import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { usePlayer } from "@/contexts/PlayerContext";
import {
  Play, Pause, Heart, Radio, Headphones, ChevronRight,
  TrendingUp, Music, Disc, Download, Flame, Users,
} from "lucide-react";

const FALLBACK_ART = "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  const { data: publicTracks = [] } = useQuery<any[]>({ queryKey: ["/api/tracks/public"] });
  const { data: liveStreams = [] } = useQuery<any[]>({ queryKey: ["/api/streams/live"] });
  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["/api/content/categories"] });
  const { data: featuredArtists = [] } = useQuery<any[]>({ queryKey: ["/api/content/artists"] });
  const { data: featuredAlbums = [] } = useQuery<any[]>({ queryKey: ["/api/content/albums"] });
  const { data: featuredPlaylists = [] } = useQuery<any[]>({ queryKey: ["/api/content/playlists/featured"] });

  const trendingTracks = [...publicTracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 8);
  const newTracks = [...publicTracks].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 8);

  const handleLike = (id: string) => {
    setLikedTracks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const TrackRow = ({ track }: { track: any }) => {
    const active = currentTrack?.id === track.id;
    return (
      <div className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-card/60 transition-colors group cursor-pointer ${active ? "bg-primary/10" : ""}`}
        onClick={() => playTrack(track)}>
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img src={track.albumArt || FALLBACK_ART} alt={track.title} className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ART; }} />
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${active && isPlaying ? "opacity-100" : ""}`}>
            {active && isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${active ? "text-primary" : ""}`}>{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); handleLike(track.id); }} className="p-1.5 rounded-full hover:bg-muted">
            <Heart className={`w-3.5 h-3.5 ${likedTracks.has(track.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{fmt(track.duration || 0)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-8">

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-900/50 via-purple-900/50 to-background border border-border p-6 md:p-10">
          <div className="relative z-10 max-w-lg">
            <Badge className="mb-3 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">New on STINE</Badge>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 leading-tight">African Music, Amplified</h1>
            <p className="text-muted-foreground mb-4 text-sm md:text-base">Discover Afrobeat, Amapiano, Highlife and more — from independent creators across the continent.</p>
            <div className="flex gap-3">
              <Button className="geometric-gradient text-primary-foreground" onClick={() => setLocation("/feed")}>
                <Radio className="w-4 h-4 mr-2" /> Explore Streams
              </Button>
              <Button variant="outline" onClick={() => setLocation("/search")}>
                <Music className="w-4 h-4 mr-2" /> Browse Music
              </Button>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none" />
        </div>

        {/* Live Streams */}
        {liveStreams.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Now
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/feed")}>
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveStreams.slice(0, 3).map((stream: any) => (
                <Card key={stream.id} className="geometric-clip overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
                  onClick={() => setLocation("/feed")}>
                  <CardContent className="p-0">
                    <div className="h-24 bg-gradient-to-br from-red-900/40 to-purple-900/40 relative">
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">● LIVE</Badge>
                      </div>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-white/80">
                        <Users className="w-3 h-3" /> {stream.listenerCount || 0}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm truncate">{stream.title}</p>
                      <p className="text-xs text-muted-foreground">{stream.genre || "Live DJ Set"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Browse Genres</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {categories.slice(0, 12).map((cat: any) => (
                <div key={cat.id}
                  className="relative overflow-hidden rounded-xl aspect-square flex items-end cursor-pointer hover:scale-105 transition-transform"
                  style={{ background: cat.gradient || "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
                  onClick={() => setLocation(`/search?genre=${cat.name}`)}>
                  <p className="p-2 text-white font-bold text-xs drop-shadow">{cat.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trending tracks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" /> Trending
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/search")}>
              More <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {trendingTracks.length > 0 ? (
            <div className="space-y-1">
              {trendingTracks.map((t: any) => <TrackRow key={t.id} track={t} />)}
            </div>
          ) : (
            <Card className="geometric-clip">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No public tracks yet</p>
                <p className="text-xs mt-1">Be the first to upload!</p>
                <Button className="mt-4" onClick={() => setLocation("/studio")}>Upload Track</Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Featured Artists */}
        {featuredArtists.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" /> Featured Artists
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {featuredArtists.slice(0, 8).map((artist: any) => (
                <div key={artist.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-20 cursor-pointer"
                  onClick={() => setLocation(`/search?q=${artist.name}`)}>
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-border hover:ring-primary transition-all">
                    <img src={artist.image || FALLBACK_ART} alt={artist.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ART; }} />
                  </div>
                  <p className="text-xs font-medium text-center leading-tight line-clamp-2">{artist.name}</p>
                  <p className="text-[10px] text-muted-foreground">{artist.genre}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Albums */}
        {featuredAlbums.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Disc className="w-5 h-5 text-purple-400" /> Featured Albums
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {featuredAlbums.slice(0, 8).map((album: any) => (
                <div key={album.id} className="flex-shrink-0 w-36 cursor-pointer group" onClick={() => setLocation(`/search?q=${album.title}`)}>
                  <div className="w-36 h-36 rounded-xl overflow-hidden mb-2 group-hover:scale-105 transition-transform">
                    <img src={album.cover || FALLBACK_ART} alt={album.title} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ART; }} />
                  </div>
                  <p className="text-sm font-medium truncate">{album.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* New releases */}
        {newTracks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Headphones className="w-5 h-5 text-green-400" /> New Releases
              </h2>
            </div>
            <div className="space-y-1">
              {newTracks.map((t: any) => <TrackRow key={t.id} track={t} />)}
            </div>
          </section>
        )}

        {/* Featured Playlists */}
        {featuredPlaylists.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Music className="w-5 h-5 text-cyan-400" /> STINE Playlists
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {featuredPlaylists.slice(0, 8).map((pl: any) => (
                <Card key={pl.id} className="geometric-clip overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer">
                  <CardContent className="p-0">
                    <div className="aspect-square overflow-hidden">
                      <img src={pl.cover || FALLBACK_ART} alt={pl.name} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ART; }} />
                    </div>
                    <div className="p-2">
                      <p className="font-medium text-sm truncate">{pl.name}</p>
                      <p className="text-xs text-muted-foreground">{pl.trackCount} tracks · {pl.curator}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
