import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockUserProfile, mockArtists, mockPlaylists } from "@/lib/musicData";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Edit3, Heart, Disc, ListMusic, Radio, Users, Clock, Crown, Mail, Calendar } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  const profile = user ? {
    name: user.name || user.username || "DJ Stine",
    username: user.username || "djstine",
    image: user.avatar || "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop",
    bio: "Afro-future sounds from Lagos",
    followers: 2847,
    following: 156,
    totalPlays: 45200,
    likedTracks: 234,
    playlists: 12,
    isDJ: true,
    subscription: "Pro",
    joinDate: "2023-01-15",
  } : mockUserProfile;

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-b from-primary/20 to-background p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden border-4 border-background shadow-lg">
              <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{profile.name}</h1>
                {profile.isDJ && <Badge className="bg-purple-500">DJ</Badge>}
                <Badge className="bg-amber-500 text-white"><Crown className="w-3 h-3 mr-1" /> {profile.subscription}</Badge>
              </div>
              <p className="text-muted-foreground mb-3">@{profile.username}</p>
              <p className="text-sm mb-4 max-w-lg">{profile.bio}</p>
              <div className="flex gap-3 justify-center md:justify-start">
                <Button variant="outline" onClick={() => setLocation("/settings")}>
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Edit profile" })}>
                  <Edit3 className="w-4 h-4 mr-2" /> Edit
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            {[
              { label: "Followers", value: profile.followers.toLocaleString(), icon: Users },
              { label: "Following", value: profile.following.toLocaleString(), icon: Users },
              { label: "Plays", value: profile.totalPlays.toLocaleString(), icon: Radio },
              { label: "Liked", value: profile.likedTracks.toString(), icon: Heart },
              { label: "Playlists", value: profile.playlists.toString(), icon: ListMusic },
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
              {[
                { action: "Started streaming", target: "Afro-Future Friday", time: "Just now", icon: Radio },
                { action: "Liked", target: "Amapiano Wave", time: "2 min ago", icon: Heart },
                { action: "Created playlist", target: "Late Night Vibes", time: "1 hour ago", icon: ListMusic },
                { action: "Followed", target: "Burna Boy", time: "3 hours ago", icon: Users },
                { action: "Shared", target: "Lagos Sunset Mix", time: "5 hours ago", icon: Disc },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{item.action} <span className="font-medium">{item.target}</span></p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="playlists" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockPlaylists.slice(0, 4).map((pl) => (
                  <div key={pl.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setLocation(`/playlist/${pl.id}`)}>
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2 relative">
                      <img src={pl.cover} alt={pl.name} className="w-full h-full object-cover" />
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
                      <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
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
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile.username}@stine.app</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Joined {new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">{profile.subscription} Plan</span>
                  </div>
                  <p className="text-muted-foreground">{profile.bio}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
