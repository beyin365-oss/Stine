import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockArtists, mockPlaylists } from "@/lib/musicData";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Settings, Edit3, Heart, Disc, ListMusic, Radio, Users, Clock,
  Crown, Mail, Calendar, Music2, X, Save, Mic2
} from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&auto=format";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDjName, setEditDjName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  const openEdit = () => {
    setEditFirstName(user?.firstName || "");
    setEditLastName(user?.lastName || "");
    setEditDjName(user?.djName || "");
    setEditBio((user as any)?.bio || "");
    setEditAvatar(user?.profileImageUrl || "");
    setEditOpen(true);
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditOpen(false);
      toast({ title: "Profile updated!" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const upgradeRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await apiRequest("PATCH", "/api/user/role", { role });
      return res.json();
    },
    onSuccess: (_, role) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: `Upgraded to ${role === "dj" ? "DJ" : "Song Creator"}!` });
    },
    onError: () => toast({ title: "Upgrade failed", variant: "destructive" }),
  });

  const displayName = user
    ? (user.djName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "STINE User")
    : "STINE User";

  const username = user
    ? (user.djName?.toLowerCase().replace(/\s+/g, "") || user.email?.split("@")[0] || "user")
    : "user";

  const avatar = user?.profileImageUrl || FALLBACK_AVATAR;
  const role: string = (user as any)?.role || "listener";
  const tier: string = (user as any)?.subscriptionTier || "tier-free";
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Recently";

  const tierLabel: Record<string, string> = { "tier-free": "Free", "tier-basic": "Basic", "tier-pro": "Pro", "tier-premium": "Premium" };
  const roleLabel: Record<string, string> = { listener: "Listener", dj: "DJ", songcreator: "Song Creator", admin: "Admin" };
  const roleBadgeColor: Record<string, string> = { listener: "bg-gray-500", dj: "bg-purple-500", songcreator: "bg-blue-500", admin: "bg-red-500" };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-b from-primary/20 to-background p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden border-4 border-background shadow-lg flex-shrink-0">
              <img
                src={avatar}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_AVATAR; }}
              />
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{displayName}</h1>
                <Badge className={roleBadgeColor[role] || "bg-gray-500"}>{roleLabel[role] || role}</Badge>
                <Badge className="bg-amber-500 text-white">
                  <Crown className="w-3 h-3 mr-1" /> {tierLabel[tier] || tier}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-2">@{username}</p>
              {user?.email && <p className="text-sm text-muted-foreground mb-3">{user.email}</p>}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Button variant="outline" onClick={() => setLocation("/settings")}>
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </Button>
                <Button variant="outline" onClick={openEdit}>
                  <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
                {role === "listener" && (
                  <Button
                    variant="outline"
                    className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
                    onClick={() => upgradeRoleMutation.mutate("dj")}
                    disabled={upgradeRoleMutation.isPending}
                  >
                    <Mic2 className="w-4 h-4 mr-2" /> Become a DJ
                  </Button>
                )}
                {(role === "listener" || role === "dj") && (
                  <Button
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                    onClick={() => upgradeRoleMutation.mutate("songcreator")}
                    disabled={upgradeRoleMutation.isPending}
                  >
                    <Music2 className="w-4 h-4 mr-2" /> Become a Song Creator
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                  onClick={() => setLocation("/subscription")}
                >
                  <Crown className="w-4 h-4 mr-2" /> Upgrade Plan
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            {[
              { label: "Followers", value: "0", icon: Users },
              { label: "Following", value: "0", icon: Users },
              { label: "Plays", value: "0", icon: Radio },
              { label: "Liked", value: "0", icon: Heart },
              { label: "Playlists", value: "0", icon: ListMusic },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 rounded-lg bg-card/50">
                <stat.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <Tabs defaultValue="activity">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="activity" className="gap-1"><Clock className="w-3 h-3" /> Activity</TabsTrigger>
              <TabsTrigger value="playlists" className="gap-1"><ListMusic className="w-3 h-3" /> Playlists</TabsTrigger>
              <TabsTrigger value="artists" className="gap-1"><Users className="w-3 h-3" /> Artists</TabsTrigger>
              <TabsTrigger value="about" className="gap-1"><Disc className="w-3 h-3" /> About</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground text-center py-8">Your activity will appear here as you use STINE.</p>
            </TabsContent>

            <TabsContent value="playlists" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockPlaylists.slice(0, 4).map((pl) => (
                  <div key={pl.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setLocation(`/playlist/${pl.id}`)}>
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2 relative">
                      <img
                        src={pl.cover}
                        alt={pl.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <p className="font-medium text-sm truncate">{pl.name}</p>
                    <p className="text-xs text-muted-foreground">{pl.trackCount} tracks</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="artists" className="mt-4">
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {mockArtists.slice(0, 5).map((artist) => (
                  <div key={artist.id} className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={() => setLocation(`/artist/${artist.id}`)}>
                    <div className="w-full aspect-square rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <p className="font-medium text-sm truncate">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">{artist.followers}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="about" className="mt-4">
              <Card className="geometric-clip">
                <CardContent className="p-6 space-y-4">
                  {user?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Joined {joinDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">{tierLabel[tier] || tier} Plan</span>
                  </div>
                  {(user as any)?.bio && (
                    <p className="text-muted-foreground">{(user as any).bio}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Edit Profile</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                saveProfileMutation.mutate({
                  firstName: editFirstName,
                  lastName: editLastName,
                  djName: editDjName || undefined,
                  bio: editBio || undefined,
                  profileImageUrl: editAvatar || undefined,
                });
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">First Name</label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Last Name</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">DJ Name</label>
                  <input
                    type="text"
                    value={editDjName}
                    onChange={(e) => setEditDjName(e.target.value)}
                    placeholder="e.g. DJ Stine"
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Profile Photo URL</label>
                  <input
                    type="url"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    placeholder="Tell people about yourself..."
                    className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 geometric-gradient text-primary-foreground" disabled={saveProfileMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {saveProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
