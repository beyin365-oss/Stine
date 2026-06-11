import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Music, Loader2, Play, Pause, Upload, Heart, Download, Plus } from "lucide-react";
import { useState } from "react";

const FALLBACK_ART = "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const { data: myTracks = [], isLoading: tracksLoading } = useQuery<any[]>({ queryKey: ["/api/tracks/my"] });
  const { data: myPlaylists = [] } = useQuery<any[]>({ queryKey: ["/api/playlists/my"] });

  const toggleLike = (id: string) => setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const TrackRow = ({ track }: { track: any }) => {
    const active = currentTrack?.id === track.id;
    return (
      <div className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-card/60 transition-colors group cursor-pointer ${active ? "bg-primary/10" : ""}`}
        onClick={() => playTrack(track)}>
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img src={track.albumArt || FALLBACK_ART} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ART; }} />
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${active && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
            {active && isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${active ? "text-primary" : ""}`}>{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
        </div>
        {track.genre && <Badge variant="outline" className="text-xs hidden sm:block">{track.genre}</Badge>}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }} className="p-1.5 rounded-full hover:bg-muted">
            <Heart className={`w-3.5 h-3.5 ${liked.has(track.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{fmt(track.duration || 0)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold flex items-center gap-2"><Music className="w-5 h-5 text-purple-400" /> My Library</h1>
          <Button size="sm" className="geometric-gradient text-primary-foreground" onClick={() => setLocation("/studio")}>
            <Upload className="w-4 h-4 mr-1" /> Upload
          </Button>
        </div>

        <Tabs defaultValue="tracks">
          <TabsList className="mb-4">
            <TabsTrigger value="tracks">My Tracks {myTracks.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{myTracks.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="liked">Liked <Heart className="w-3 h-3 ml-1 text-red-400" /></TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="tracks">
            {tracksLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : myTracks.length === 0 ? (
              <Card className="geometric-clip"><CardContent className="p-12 text-center">
                <Upload className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No tracks uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-1">Upload your music to get started</p>
                <Button className="mt-4 geometric-gradient text-primary-foreground" onClick={() => setLocation("/studio")}>
                  <Upload className="w-4 h-4 mr-2" /> Upload First Track
                </Button>
              </CardContent></Card>
            ) : (
              <div className="space-y-1">{myTracks.map((t: any) => <TrackRow key={t.id} track={t} />)}</div>
            )}
          </TabsContent>

          <TabsContent value="liked">
            {liked.size === 0 ? (
              <Card className="geometric-clip"><CardContent className="p-12 text-center">
                <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No liked tracks</p>
                <p className="text-sm text-muted-foreground mt-1">Like tracks while browsing to save them here</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-1">
                {myTracks.filter(t => liked.has(t.id)).map((t: any) => <TrackRow key={t.id} track={t} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="playlists">
            <Card className="geometric-clip"><CardContent className="p-12 text-center">
              <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No playlists yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create playlists to organise your music</p>
              <Button className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Create Playlist
              </Button>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
