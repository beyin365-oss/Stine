import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Users, 
  Plus, 
  Send, 
  Share2, 
  Music, 
  Calendar,
  Bell,
  MessageCircle,
  ThumbsUp,
  Eye,
  Crown,
  UserPlus,
  Settings,
  Radio,
  Headphones,
  Mic,
  Volume2
} from "lucide-react";

interface Collaboration {
  id: string;
  title: string;
  description?: string;
  type: 'co_stream' | 'track_collab' | 'remix' | 'live_session';
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  initiatorId: string;
  participantIds: string[];
  scheduledAt?: string;
  createdAt: string;
  participants: Array<{
    id: string;
    djName?: string;
    firstName?: string;
    profileImageUrl?: string;
    role: 'host' | 'co_host' | 'participant';
    status: 'invited' | 'accepted' | 'declined';
  }>;
}

interface SocialPost {
  id: string;
  authorId: string;
  content: string;
  type: 'track_share' | 'stream_announcement' | 'collaboration_invite' | 'achievement';
  mediaUrl?: string;
  trackId?: string;
  streamId?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
  author: {
    djName?: string;
    firstName?: string;
    profileImageUrl?: string;
  };
}

const collaborationTypes = [
  { value: 'co_stream', label: 'Co-Stream', icon: Radio, description: 'Stream together in real-time' },
  { value: 'track_collab', label: 'Track Collaboration', icon: Music, description: 'Work on tracks together' },
  { value: 'remix', label: 'Remix Project', icon: Headphones, description: 'Remix each other\'s tracks' },
  { value: 'live_session', label: 'Live Session', icon: Mic, description: 'Live jam session' },
];

export function CollaborationHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("collaborations");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCollaboration, setNewCollaboration] = useState({
    title: "",
    description: "",
    type: "co_stream" as const,
    participantEmails: "",
    scheduledAt: "",
  });

  // Fetch collaborations
  const { data: collaborations = [] } = useQuery<Collaboration[]>({
    queryKey: ['/api/collaborations'],
    refetchInterval: 30000,
  });

  // Fetch social feed
  const { data: socialFeed = [] } = useQuery<SocialPost[]>({
    queryKey: ['/api/social/feed'],
    refetchInterval: 30000,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 15000,
  });

  const createCollaborationMutation = useMutation({
    mutationFn: async (collaborationData: any) => {
      return await apiRequest('POST', '/api/collaborations', collaborationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations'] });
      setShowCreateDialog(false);
      setNewCollaboration({
        title: "",
        description: "",
        type: "co_stream",
        participantEmails: "",
        scheduledAt: "",
      });
      toast({
        title: "Collaboration Created",
        description: "Invitations have been sent to participants!",
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
        title: "Creation Failed",
        description: "Failed to create collaboration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const respondToCollaborationMutation = useMutation({
    mutationFn: async ({ collaborationId, response }: { collaborationId: string; response: 'accept' | 'decline' }) => {
      return await apiRequest('POST', `/api/collaborations/${collaborationId}/respond`, { response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations'] });
      toast({
        title: "Response Sent",
        description: "Your collaboration response has been sent!",
      });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest('POST', `/api/social/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/feed'] });
    },
  });

  const handleCreateCollaboration = () => {
    if (!newCollaboration.title) {
      toast({
        title: "Missing Title",
        description: "Please enter a title for your collaboration",
        variant: "destructive",
      });
      return;
    }

    createCollaborationMutation.mutate({
      ...newCollaboration,
      participantEmails: newCollaboration.participantEmails.split(',').map(email => email.trim()),
    });
  };

  const getCollaborationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = collaborationTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : Music;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Collaboration Hub</h2>
        <div className="flex items-center space-x-3">
          <Button variant="outline" data-testid="button-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            {notifications.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1 min-w-5 h-5">
                {notifications.length}
              </Badge>
            )}
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-collaboration">
                <Plus className="w-4 h-4 mr-2" />
                New Collaboration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Collaboration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newCollaboration.title}
                    onChange={(e) => setNewCollaboration(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Give your collaboration a name"
                    data-testid="input-collaboration-title"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Type</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {collaborationTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.value}
                          variant={newCollaboration.type === type.value ? "default" : "outline"}
                          className="h-auto p-3 flex flex-col"
                          onClick={() => setNewCollaboration(prev => ({ ...prev, type: type.value as any }))}
                          data-testid={`button-collaboration-type-${type.value}`}
                        >
                          <Icon className="w-5 h-5 mb-1" />
                          <span className="text-xs">{type.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newCollaboration.description}
                    onChange={(e) => setNewCollaboration(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your collaboration idea..."
                    rows={3}
                    data-testid="textarea-collaboration-description"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Invite Participants (email addresses)</label>
                  <Input
                    value={newCollaboration.participantEmails}
                    onChange={(e) => setNewCollaboration(prev => ({ ...prev, participantEmails: e.target.value }))}
                    placeholder="email1@example.com, email2@example.com"
                    data-testid="input-participant-emails"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Schedule (Optional)</label>
                  <Input
                    type="datetime-local"
                    value={newCollaboration.scheduledAt}
                    onChange={(e) => setNewCollaboration(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    data-testid="input-scheduled-at"
                  />
                </div>

                <Button
                  onClick={handleCreateCollaboration}
                  disabled={createCollaborationMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-collaboration"
                >
                  {createCollaborationMutation.isPending ? "Creating..." : "Create Collaboration"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collaborations">My Collaborations</TabsTrigger>
          <TabsTrigger value="social">Social Feed</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        {/* Collaborations Tab */}
        <TabsContent value="collaborations" className="space-y-6">
          {collaborations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Collaborations Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start collaborating with other DJs to create amazing music together
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Create Your First Collaboration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {collaborations.map((collaboration) => {
                const TypeIcon = getTypeIcon(collaboration.type);
                const userParticipant = collaboration.participants.find(p => p.id === user?.id);
                const isInitiator = collaboration.initiatorId === user?.id;
                
                return (
                  <Card key={collaboration.id} className="geometric-clip">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <TypeIcon className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold" data-testid={`collaboration-title-${collaboration.id}`}>
                              {collaboration.title}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={`${getCollaborationStatusColor(collaboration.status)} text-white`}
                            >
                              {collaboration.status}
                            </Badge>
                            {isInitiator && (
                              <Badge variant="secondary">
                                <Crown className="w-3 h-3 mr-1" />
                                Host
                              </Badge>
                            )}
                          </div>
                          
                          {collaboration.description && (
                            <p className="text-muted-foreground mb-3">
                              {collaboration.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {collaboration.scheduledAt ? formatDate(collaboration.scheduledAt) : 'Not scheduled'}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {collaboration.participants.length} participants
                            </span>
                          </div>

                          {/* Participants */}
                          <div className="flex items-center space-x-2 mt-3">
                            {collaboration.participants.slice(0, 5).map((participant) => (
                              <div key={participant.id} className="relative">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={participant.profileImageUrl} />
                                  <AvatarFallback className="text-xs">
                                    {(participant.djName || participant.firstName || 'U').charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {participant.role === 'host' && (
                                  <Crown className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500" />
                                )}
                              </div>
                            ))}
                            {collaboration.participants.length > 5 && (
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs">
                                +{collaboration.participants.length - 5}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          {userParticipant?.status === 'invited' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => respondToCollaborationMutation.mutate({
                                  collaborationId: collaboration.id,
                                  response: 'accept'
                                })}
                                data-testid={`button-accept-${collaboration.id}`}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => respondToCollaborationMutation.mutate({
                                  collaborationId: collaboration.id,
                                  response: 'decline'
                                })}
                                data-testid={`button-decline-${collaboration.id}`}
                              >
                                Decline
                              </Button>
                            </div>
                          )}

                          {collaboration.status === 'active' && (
                            <Button size="sm" data-testid={`button-join-${collaboration.id}`}>
                              <Volume2 className="w-4 h-4 mr-2" />
                              Join Session
                            </Button>
                          )}

                          {isInitiator && (
                            <Button size="sm" variant="outline" data-testid={`button-manage-${collaboration.id}`}>
                              <Settings className="w-4 h-4 mr-2" />
                              Manage
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Social Feed Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="space-y-4">
            {socialFeed.map((post) => (
              <Card key={post.id} className="geometric-clip">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.author.profileImageUrl} />
                      <AvatarFallback>
                        {(post.author.djName || post.author.firstName || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold">
                          {post.author.djName || post.author.firstName}
                        </span>
                        <Badge variant="outline">{post.type.replace('_', ' ')}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground mb-3" data-testid={`post-content-${post.id}`}>
                        {post.content}
                      </p>

                      {post.mediaUrl && (
                        <div className="mb-3">
                          <img 
                            src={post.mediaUrl} 
                            alt="Post media" 
                            className="rounded-lg max-w-md"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-6 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likePostMutation.mutate(post.id)}
                          className={post.isLiked ? "text-red-500" : ""}
                          data-testid={`button-like-${post.id}`}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {post.likes}
                        </Button>
                        
                        <Button variant="ghost" size="sm" data-testid={`button-comment-${post.id}`}>
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.comments}
                        </Button>
                        
                        <Button variant="ghost" size="sm" data-testid={`button-share-${post.id}`}>
                          <Share2 className="w-4 h-4 mr-1" />
                          {post.shares}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Suggested Collaborators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>DJ</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">DJ Example {i}</p>
                        <p className="text-sm text-muted-foreground">House, Techno</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trending Collaborations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <h4 className="font-semibold mb-1">Epic House Session #{i}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Live collaboration between multiple DJs
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        1.2k views
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        4 DJs
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}