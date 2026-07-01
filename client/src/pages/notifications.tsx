import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Heart, DollarSign, Radio, MessageSquare, ListMusic, Crown, Check, Trash2 } from "lucide-react";

const typeIcons: Record<string, any> = {
  follow: Heart,
  tip: DollarSign,
  stream: Radio,
  request: MessageSquare,
  playlist: ListMusic,
  subscription: Crown,
};

const typeColors: Record<string, string> = {
  follow: "bg-pink-500",
  tip: "bg-green-500",
  stream: "bg-red-500",
  request: "bg-blue-500",
  playlist: "bg-purple-500",
  subscription: "bg-amber-500",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const r = await fetch("/api/notifications", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const filtered = filter === "unread" ? notifications.filter((n: any) => !n.read) : notifications;
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilter(filter === "all" ? "unread" : "all")}>
              {filter === "all" ? "Unread only" : "Show all"}
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
                <Check className="w-4 h-4 mr-1" /> Mark All Read
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary" />
            </div>
          )}

          {!isLoading && filtered.map((notif: any) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <Card key={notif.id} className={`geometric-clip ${!notif.read ? 'border-l-4 border-l-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${typeColors[notif.type] || "bg-gray-500"} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notif.title}</p>
                        {!notif.read && <Badge className="bg-primary text-[10px] px-1">New</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : notif.time}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notif.read && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => markRead.mutate(notif.id)}>
                          <Check className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteNotif.mutate(notif.id)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="w-14 h-14 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-base">No notifications yet</p>
              <p className="text-sm mt-1 opacity-70">
                {filter === "unread" ? "No unread notifications." : "You'll see tips, follows, and stream alerts here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
