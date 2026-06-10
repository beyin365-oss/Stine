import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { usePlayer } from "@/contexts/PlayerContext";
import { mockTracks, mockLiveStreams } from "@/lib/mockData";
import { mockArtists, mockAlbums, mockPlaylists, mockCategories } from "@/lib/musicData";
import {
  Play, Pause, Heart, Radio, Headphones, Clock, ChevronRight,
  TrendingUp, Music, Disc, Download,
} from "lucide-react";

const FALLBACK_ART = "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function HomePage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { playTrack, currentTrack, isPlaying, downloadTrack } = usePlayer();
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  // Real public tracks from the DB (falls back to mock when empty)
  const { data: publicTracks = [] } = useQuery<any[]>({
    queryKey: ["/api/tracks/public"],
    retry: false,
  });

  const trendingTracks = publicTracks.length > 0
    ? publicTracks.slice(0, 8)
    : mockTracks.slice(0, 8);

  const toggleLike = (id: string) =>
    setLikedTracks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handlePlayTrack = (track: any) => {
    const queue = trendingTracks.map(t => ({
      id: t.id, title: t.title, artist: t.artist,
      duration: t.duration, albumArt: t.albumArt || FALLBACK_ART,
      fileUrl: t.fileUrl || null, genre: t.genre, bpm: t.bpm,
    }));
    playTrack({ ...track, albumArt: track.albumArt || FALLBACK_ART, fileUrl: track.fileUrl || null }, queue);
  };

  return (
    <div className="min-h-screen pb-32 bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-8">

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-6 md:p-10">
          <Badge className="mb-3 bg-red-500 text-white">
            <Radio className="w-3 h-3 mr-1 animate-pulse" /> LIVE NOW
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-2">Afro-Future Friday</h1>
          <p className="text-muted-foreground mb-4 max-w-lg">
            The hottest Afrobeat and Amapiano mix from Lagos. 2,847 listeners tuned in.
          </p>
          <div className="flex gap-3">
            <Button className="geometric-gradient text-primary-foreground" onClick={() => setLocation("/mixer")}>
              <Play className="w-4 h-4 mr-2" /> Listen Live
            </Button>
            <Button variant="outline" onClick={() => toast({ title: "Saved to library" })}>
              <Heart className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </div>

        {/* Browse by Mood */}
        <section>
          <h2 className="text-xl font-bold mb-4">Browse by Mood</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {mockCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setLocation("/search")}
                className="relative rounded-xl overflow-hidden h-24 md:h-32 cursor-pointer group"
                style={{ background: cat.gradient }}
              >
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
            {mockLiveStreams.slice(0, 3).map((stream: any) => (
              <Card
                key={stream.id}
                className="geometric-clip overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => setLocation("/mixer")}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0 flex items-center justify-center">
                      <Radio className="w-6 h-6 text-red-500 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm truncate">{stream.title}</h3>
                        <Badge className="bg-red-500 text-[10px] px-1">LIVE</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{stream.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Headphones className="w-3 h-3" />{stream.listenerCount?.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(stream.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending / real tracks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" /> Trending
              {publicTracks.length > 0 && <Badge variant="outline" className="text-xs">Real Data</Badge>}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/search")}>
              See all <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {trendingTracks.map((track: any, idx: number) => {
              const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
              return (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => handlePlayTrack(track)}
                >
                  <span className="w-6 text-center text-sm text-muted-foreground font-mono">{idx + 1}</span>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0 overflow-hidden relative">
                    <img
                      src={track.albumArt || FALLBACK_ART}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.src = FALLBACK_ART; }}
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCurrentlyPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                    </div>
                    {isCurrentlyPlaying && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="flex gap-0.5 items-end h-5">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: `${40 + i * 20}%`, animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isCurrentlyPlaying ? "text-primary" : ""}`}>{track.title}</p>
                    <p className="text-xs text-muted-foreground">{track.artist}{track.genre ? ` · ${track.genre}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                      onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}>
                      <Heart className={`w-4 h-4 ${likedTracks.has(track.id) ? "text-pink-500 fill-pink-500" : ""}`} />
                    </Button>
                    {track.fileUrl && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={(e) => { e.stopPropagation(); downloadTrack({ ...track, albumArt: track.albumArt || FALLBACK_ART }); }}>
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{fmt(track.duration)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Popular Artists */}
        <section>
          <h2 className="text-xl font-bold mb-4">Popular Artists</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {mockArtists.slice(0, 6).map((artist: any) => (
              <div
                key={artist.id}
                className="text-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setLocation(`/artist/${artist.id}`)}
              >
                <div className="w-full aspect-square rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.src = FALLBACK_ART; }}
                  />
                </div>
                <p className="font-medium text-sm truncate">{artist.name}</p>
                <p className="text-xs text-muted-foreground">{artist.followers}</p>
              </div>
            ))}
          </div>
        </section>

        {/* New Albums */}
        <section>
          <h2 className="text-xl font-bold mb-4">New Albums</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mockAlbums.slice(0, 5).map((album: any) => (
              <div
                key={album.id}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setLocation(`/album/${album.id}`)}
              >
                <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                  <img
                    src={album.cover}
                    alt={album.title}
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.src = FALLBACK_ART; }}
                  />
                </div>
                <p className="font-medium text-sm truncate">{album.title}</p>
                <p className="text-xs text-muted-foreground">{album.artist}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Playlists */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Music className="w-5 h-5 text-secondary" /> Featured Playlists
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockPlaylists.slice(0, 4).map((pl: any) => (
              <div
                key={pl.id}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setLocation(`/playlist/${pl.id}`)}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 relative">
                  <img
                    src={pl.cover}
                    alt={pl.name}
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.src = FALLBACK_ART; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                    <p className="text-white text-xs font-medium">{pl.trackCount} tracks</p>
                  </div>
                </div>
                <p className="font-medium text-sm truncate">{pl.name}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
