import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mockNotifications } from "@/lib/musicData";
import { useLocation } from "wouter";
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
  const [_, setLocation] = useLocation();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? notifications : notifications.filter(n => !n.read);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({ title: "All notifications marked as read" });
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">{unreadCount} unread notifications</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilter(filter === "all" ? "unread" : "all")}>
              {filter === "all" ? "Unread" : "All"}
            </Button>
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <Check className="w-4 h-4 mr-1" /> Mark All
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <Card key={notif.id} className={`geometric-clip ${!notif.read ? 'border-l-4 border-l-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${typeColors[notif.type]} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notif.title}</p>
                        {!notif.read && <Badge className="bg-primary text-[10px] px-1">New</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                    <div className="flex gap-1">
                      {!notif.read && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => markRead(notif.id)}>
                          <Check className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteNotif(notif.id)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
