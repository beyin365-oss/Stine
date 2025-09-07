import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { HandHeart, Check, X, Clock } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface SongRequest {
  id: string;
  songTitle: string;
  artist?: string;
  userId: string;
  status: 'pending' | 'accepted' | 'declined' | 'played';
  requestedAt: string;
}

interface SongRequestsProps {
  streamId?: string;
}

export function SongRequests({ streamId }: SongRequestsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<SongRequest[]>({
    queryKey: ['/api/requests', streamId],
    enabled: !!streamId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      await apiRequest('PATCH', `/api/requests/${requestId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requests', streamId] });
      toast({
        title: "Request Updated",
        description: "Song request status has been updated",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    },
  });

  const handleAccept = (requestId: string) => {
    updateStatusMutation.mutate({ requestId, status: 'accepted' });
  };

  const handleDecline = (requestId: string) => {
    updateStatusMutation.mutate({ requestId, status: 'declined' });
  };

  const handleMarkPlayed = (requestId: string) => {
    updateStatusMutation.mutate({ requestId, status: 'played' });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, icon: Clock, color: 'text-yellow-500' },
      accepted: { variant: 'secondary' as const, icon: Check, color: 'text-green-500' },
      declined: { variant: 'destructive' as const, icon: X, color: 'text-red-500' },
      played: { variant: 'default' as const, icon: Check, color: 'text-blue-500' },
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HandHeart className="w-5 h-5 text-secondary mr-2" />
            Song Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <HandHeart className="w-5 h-5 text-secondary mr-2" />
          Song Requests
          <Badge variant="secondary" className="ml-auto" data-testid="text-requests-count">
            {pendingRequests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <HandHeart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No song requests yet</p>
            <p className="text-sm">Listeners can request songs in chat</p>
          </div>
        ) : (
          <>
            {/* Pending Requests */}
            {pendingRequests.map((request) => {
              const statusInfo = getStatusBadge(request.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div 
                  key={request.id} 
                  className="flex items-center space-x-3 p-3 rounded hover:bg-muted transition-colors"
                  data-testid={`song-request-${request.id}`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs">
                      U
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid={`text-song-title-${request.id}`}>
                      {request.songTitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.artist && `by ${request.artist} • `}
                      Requested by User #{request.userId.slice(-4)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Badge variant={statusInfo.variant} className="text-xs">
                      <StatusIcon className={`w-3 h-3 mr-1 ${statusInfo.color}`} />
                      {request.status}
                    </Badge>
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-8 h-8 p-0 bg-green-500/10 border-green-500/20 hover:bg-green-500/20"
                        onClick={() => handleAccept(request.id)}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-accept-${request.id}`}
                      >
                        <Check className="w-4 h-4 text-green-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-8 h-8 p-0 bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
                        onClick={() => handleDecline(request.id)}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-decline-${request.id}`}
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  )}
                  
                  {request.status === 'accepted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkPlayed(request.id)}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-mark-played-${request.id}`}
                    >
                      Mark Played
                    </Button>
                  )}
                </div>
              );
            })}
            
            {/* Show accepted requests if any */}
            {acceptedRequests.length > 0 && (
              <>
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">ACCEPTED</p>
                  {acceptedRequests.slice(0, 3).map((request) => {
                    const statusInfo = getStatusBadge(request.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div 
                        key={request.id} 
                        className="flex items-center space-x-3 p-2 rounded text-sm"
                        data-testid={`accepted-request-${request.id}`}
                      >
                        <Badge variant={statusInfo.variant} className="text-xs">
                          <StatusIcon className={`w-3 h-3 mr-1 ${statusInfo.color}`} />
                        </Badge>
                        <span className="truncate">{request.songTitle}</span>
                        {request.status === 'accepted' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto text-xs"
                            onClick={() => handleMarkPlayed(request.id)}
                            data-testid={`button-mark-played-${request.id}`}
                          >
                            Played
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
