import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { usePlayer } from "@/contexts/PlayerContext";
import { Radio, Users, Play, Pause, Heart, Music, Clock, Flame, Loader2, WifiOff } from "lucide-react";
import { useState } from "react";

const FALLBACK_ART = "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop";

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StreamCard({ stream }: { stream: any }) {
  const [liked, setLiked] = useState(false);
  const [, setLocation] = useLocation();
  return (
    <Card className="geometric-clip overflow-hidden hover:scale-[1.01] transition-all duration-200 cursor-pointer border border-border hover:border-primary/30">
      <CardContent className="p-0">
        <div className="relative h-32 bg-gradient-to-br from-red-900/30 via-purple-900/30 to-cyan-900/20">
          <div className="absolute inset-0 flex items-center justify-center opacity-20"><Radio className="w-16 h-16 text-white" /></div>
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge className="bg-red-500 text-white text-xs animate-pulse">● LIVE</Badge>
            {stream.genre && <Badge variant="outline" className="text-xs border-white/30 text-white/80">{stream.genre}</Badge>}
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-1 text-xs text-white">
            <Users className="w-3 h-3" /> {(stream.listenerCount || 0).toLocaleString()}
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-1 text-xs text-white">
            <Clock className="w-3 h-3" /> {fmt(stream.totalDuration || 0)}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden flex-shrink-0 ring-2 ring-primary/30">
              {stream.djAvatar
                ? <img src={stream.djAvatar} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-primary">{(stream.djName || "DJ")[0]}</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{stream.title}</h3>
              <p className="text-xs text-muted-foreground">{stream.djName || "Unknown DJ"}</p>
              {stream.currentTrack && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Music className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <p className="text-xs text-cyan-400 truncate">Now: {stream.currentTrack}</p>
                </div>
              )}
            </div>
            <button onClick={() => setLiked(!liked)} className="p-2 rounded-full hover:bg-muted flex-shrink-0">
              <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
          </div>
          <Button className="w-full mt-3 geometric-gradient text-primary-foreground text-sm" size="sm" onClick={() => setLocation("/mixer")}>
            <Play className="w-4 h-4 mr-2" /> Tune In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TrackCard({ track, onPlay }: { track: any; onPlay: (t: any) => void }) {
  const { currentTrack, isPlaying } = usePlayer();
  const active = currentTrack?.id === track.id;
  return (
    <Card className={`geometric-clip overflow-hidden transition-all cursor-pointer ${active ? "ring-1 ring-primary" : "hover:scale-[1.01]"}`} onClick={() => onPlay(track)}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <img src={track.albumArt || FALLBACK_ART} alt={track.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ART; }} />
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${active ? "opacity-100" : "opacity-0 hover:opacity-100"}`}>
            {active && isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${active ? "text-primary" : ""}`}>{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
          <div className="flex items-center gap-3 mt-1">
            {track.genre && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{track.genre}</Badge>}
            {track.bpm && <span className="text-[10px] text-muted-foreground">{track.bpm} BPM</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0 text-xs text-muted-foreground">
          <p>{(track.playCount || 0).toLocaleString()} plays</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FeedPage() {
  const { playTrack } = usePlayer();
  const [tab, setTab] = useState<"live" | "tracks">("live");
  const { data: liveStreams = [], isLoading: streamsLoading } = useQuery<any[]>({ queryKey: ["/api/streams/live"] });
  const { data: publicTracks = [], isLoading: tracksLoading } = useQuery<any[]>({ queryKey: ["/api/tracks/public"] });

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" /> Live Feed</h1>
            <p className="text-xs text-muted-foreground">Real-time streams & fresh tracks</p>
          </div>
          {liveStreams.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-red-400">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {liveStreams.length} live
            </div>
          )}
        </div>
        <div className="flex rounded-lg overflow-hidden border mb-4">
          <button className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "live" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setTab("live")}>
            <Radio className="w-4 h-4 inline mr-1" /> Live Streams
            {liveStreams.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{liveStreams.length}</span>}
          </button>
          <button className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "tracks" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setTab("tracks")}>
            <Music className="w-4 h-4 inline mr-1" /> Fresh Tracks
            {publicTracks.length > 0 && <span className="ml-1 bg-primary/30 text-xs rounded-full px-1.5 py-0.5">{publicTracks.length}</span>}
          </button>
        </div>
        {tab === "live" && (
          <div className="space-y-4">
            {streamsLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : liveStreams.length === 0 ? (
              <Card className="geometric-clip"><CardContent className="p-12 text-center">
                <WifiOff className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No live streams right now</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon or start your own</p>
                <Button className="mt-4 geometric-gradient text-primary-foreground" onClick={() => window.location.href = "/mixer"}>
                  <Radio className="w-4 h-4 mr-2" /> Start Streaming
                </Button>
              </CardContent></Card>
            ) : liveStreams.map((s: any) => <StreamCard key={s.id} stream={s} />)}
          </div>
        )}
        {tab === "tracks" && (
          <div className="space-y-2">
            {tracksLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : publicTracks.length === 0 ? (
              <Card className="geometric-clip"><CardContent className="p-12 text-center">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No public tracks yet</p>
                <Button className="mt-4 geometric-gradient text-primary-foreground" onClick={() => window.location.href = "/studio"}>Upload Track</Button>
              </CardContent></Card>
            ) : publicTracks.map((t: any) => <TrackCard key={t.id} track={t} onPlay={playTrack} />)}
          </div>
        )}
      </div>
    </div>
  );
}
