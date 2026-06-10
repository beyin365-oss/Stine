import { useParams } from "wouter";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mockTracks } from "@/lib/mockData";
import { mockPlaylists } from "@/lib/musicData";
import { Play, Pause, Heart, Share2, Shuffle, Clock, ListMusic, User, MoreHorizontal } from "lucide-react";
import { useState } from "react";

export default function PlaylistPage() {
  const params = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  const playlistId = params?.id || "pl1";
  const playlist = mockPlaylists.find(p => p.id === playlistId) || mockPlaylists[0];
  const playlistTracks = mockTracks.slice(0, Math.min(playlist.trackCount, 8));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = playlistTracks.reduce((sum, t) => sum + t.duration, 0);
  const totalMins = Math.floor(totalDuration / 60);

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-b from-primary/20 to-background p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden border-4 border-background shadow-lg">
              <img src={playlist.cover} alt={playlist.name} className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-left flex-1">
              <Badge variant="secondary" className="mb-2">Playlist</Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-2">{playlist.name}</h1>
              <p className="text-muted-foreground mb-1">{playlist.description}</p>
              <p className="text-sm text-muted-foreground">{playlistTracks.length} tracks, {totalMins} min</p>
              <div className="flex gap-3 mt-4 justify-center md:justify-start">
                <Button className="geometric-gradient text-primary-foreground" onClick={() => { setPlayingTrack(playlistTracks[0].id); toast({ title: "Playing playlist", description: playlist.name }); }}>
                  <Play className="w-4 h-4 mr-2" /> Play
                </Button>
                <Button variant="outline" size="icon" onClick={() => { setIsSaved(!isSaved); toast({ title: isSaved ? "Removed from library" : "Saved to library" }); }}>
                  <Heart className={`w-4 h-4 ${isSaved ? 'text-pink-500 fill-pink-500' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={() => toast({ title: "Shared" })}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-3 px-2 py-1 text-xs text-muted-foreground uppercase tracking-wider">
            <span className="w-6">#</span>
            <span className="flex-1">Title</span>
            <span className="w-12 text-right"><Clock className="w-3 h-3 inline" /></span>
          </div>
          {playlistTracks.map((track, idx) => (
            <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
              onClick={() => setPlayingTrack(playingTrack === track.id ? null : track.id)}>
              <span className="w-6 text-center text-sm text-muted-foreground">{idx + 1}</span>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden relative flex-shrink-0">
                <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {playingTrack === track.id ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                </div>
              </div>
              <div className="flex-1">
                <p className={`font-medium text-sm ${playingTrack === track.id ? 'text-primary' : ''}`}>{track.title}</p>
                <p className="text-xs text-muted-foreground">{track.artist}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setLikedTracks(p => { const n = new Set(p); n.has(track.id) ? n.delete(track.id) : n.add(track.id); return n; }); }}>
                <Heart className={`w-4 h-4 ${likedTracks.has(track.id) ? 'text-pink-500 fill-pink-500' : ''}`} />
              </Button>
              <span className="text-xs text-muted-foreground font-mono w-12 text-right">{formatTime(track.duration)}</span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
