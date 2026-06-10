import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mockTracks, mockLiveStreams } from "@/lib/mockData";
import { mockArtists, mockAlbums, mockPlaylists, mockCategories } from "@/lib/musicData";
import {
  Play, Pause, Heart, Radio, Headphones, Clock, ChevronRight,
  TrendingUp, Music, Star, Flame, Disc
} from "lucide-react";

export default function HomePage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    setLikedTracks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-6 md:p-10">
          <Badge className="mb-3 bg-red-500 text-white">
            <Radio className="w-3 h-3 mr-1 animate-pulse" /> LIVE NOW
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-2">Afro-Future Friday</h1>
          <p className="text-muted-foreground mb-4 max-w-lg">The hottest Afrobeat and Amapiano mix from Lagos. 2,847 listeners tuned in.</p>
          <div className="flex gap-3">
            <Button className="geometric-gradient text-primary-foreground" onClick={() => setLocation("/mixer")}>
              <Play className="w-4 h-4 mr-2" /> Listen Live
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "Saved to library" })}>
              <Heart className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </div>

        {/* Categories */}
        <section>
          <h2 className="text-xl font-bold mb-4">Browse by Mood</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {mockCategories.map((cat) => (
              <div key={cat.id} onClick={() => setLocation("/search")} className="relative rounded-xl overflow-hidden h-24 md:h-32 cursor-pointer group" style={{ background: cat.gradient }}>
                <span className="absolute top-3 left-3 font-bold text-white text-sm md:text-base">{cat.name}</span>
                <Disc className="absolute bottom-2 right-2 w-10 h-10 text-white/30 rotate-12 group-hover:rotate-0 transition-transform" />
              </div>
            ))}
          </div>
        </section>

        {/* Live Streams */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" /> Live Now
            </h2>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setLocation("/feed")}>
              See all <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockLiveStreams.slice(0, 3).map((stream) => (
              <Card key={stream.id} className="geometric-clip overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setLocation("/mixer")}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0 flex items-center justify-center relative">
                      <Radio className="w-6 h-6 text-red-500 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm truncate">{stream.title}</h3>
                        <Badge className="bg-red-500 text-[10px] px-1">LIVE</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{stream.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Headphones className="w-3 h-3" /> {stream.listenerCount.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(stream.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" /> Trending
          </h2>
          <div className="space-y-2">
            {mockTracks.slice(0, 5).map((track, idx) => (
              <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                onClick={() => setPlayingTrack(playingTrack === track.id ? null : track.id)}>
                <span className="w-6 text-center text-sm text-muted-foreground">{idx + 1}</span>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0 overflow-hidden relative">
                  <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {playingTrack === track.id ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${playingTrack === track.id ? 'text-primary' : ''}`}>{track.title}</p>
                  <p className="text-xs text-muted-foreground">{track.artist}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}>
                  <Heart className={`w-4 h-4 ${likedTracks.has(track.id) ? 'text-pink-500 fill-pink-500' : ''}`} />
                </Button>
                <span className="text-xs text-muted-foreground font-mono">{formatTime(track.duration)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Artists */}
        <section>
          <h2 className="text-xl font-bold mb-4">Popular Artists</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {mockArtists.slice(0, 6).map((artist) => (
              <div key={artist.id} className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={() => setLocation(`/artist/${artist.id}`)}>
                <div className="w-full aspect-square rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                  <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                </div>
                <p className="font-medium text-sm truncate">{artist.name}</p>
                <p className="text-xs text-muted-foreground">{artist.followers}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Albums */}
        <section>
          <h2 className="text-xl font-bold mb-4">New Albums</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mockAlbums.slice(0, 5).map((album) => (
              <div key={album.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setLocation(`/album/${album.id}`)}>
                <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                  <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
                </div>
                <p className="font-medium text-sm truncate">{album.title}</p>
                <p className="text-xs text-muted-foreground">{album.artist}</p>
                <p className="text-xs text-muted-foreground">{album.year} • {album.tracks} tracks</p>
              </div>
            ))}
          </div>
        </section>

        {/* Playlists */}
        <section>
          <h2 className="text-xl font-bold mb-4">Made For You</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mockPlaylists.slice(0, 5).map((playlist) => (
              <div key={playlist.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setLocation(`/playlist/${playlist.id}`)}>
                <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2 relative">
                  <img src={playlist.cover} alt={playlist.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs font-medium">{playlist.trackCount} tracks</p>
                  </div>
                </div>
                <p className="font-medium text-sm truncate">{playlist.name}</p>
                <p className="text-xs text-muted-foreground">{playlist.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <Card className="geometric-clip">
            <CardContent className="p-4 space-y-3">
              {[
                { action: "You liked", target: "Amapiano Wave", time: "2 min ago", icon: Heart },
                { action: "Listened to", target: "Afrobeat Soul", time: "15 min ago", icon: Play },
                { action: "Followed", target: "DJ Stine", time: "1 hour ago", icon: Star },
                { action: "Shared", target: "Lagos Sunset Mix", time: "3 hours ago", icon: Flame },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{item.action} <span className="font-medium">{item.target}</span></p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
