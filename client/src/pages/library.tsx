import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { usePlayer } from "@/contexts/PlayerContext";
import { mockTracks } from "@/lib/mockData";
import { mockPlaylists, mockAlbums } from "@/lib/musicData";
import { Play, Pause, Heart, Clock, ListMusic, Disc, Download, Plus } from "lucide-react";

const FALLBACK = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function LibraryPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { playTrack, currentTrack, isPlaying, downloadTrack } = usePlayer();
  const [activeTab, setActiveTab] = useState("playlists");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set(["t1", "t3", "t5"]));

  // Real tracks from the server
  const { data: myTracks = [] } = useQuery<any[]>({ queryKey: ["/api/tracks/my"] });
  const { data: publicTracks = [] } = useQuery<any[]>({ queryKey: ["/api/tracks/public"] });

  // Merge real + mock for liked & recent tabs
  const allTracks = publicTracks.length > 0 ? publicTracks : mockTracks;
  const likedTracks = allTracks.filter((t: any) => likedIds.has(t.id));
  const recentTracks = allTracks.slice(0, 6);

  const toggleLike = (id: string) =>
    setLikedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handlePlay = (track: any, queue: any[]) => {
    const q = queue.map(t => ({
      id: t.id, title: t.title, artist: t.artist,
      duration: t.duration, albumArt: t.albumArt || FALLBACK,
      fileUrl: t.fileUrl || null, genre: t.genre, bpm: t.bpm,
    }));
    playTrack({ ...track, albumArt: track.albumArt || FALLBACK, fileUrl: track.fileUrl || null }, q);
  };

  const TrackRow = ({ track, queue }: { track: any; queue: any[] }) => {
    const playing = currentTrack?.id === track.id && isPlaying;
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group cursor-pointer"
        onClick={() => handlePlay(track, queue)}>
        <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative">
          <img src={track.albumArt || FALLBACK} alt="" className="w-full h-full object-cover"
            onError={(e: any) => { e.target.src = FALLBACK; }} />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${playing ? "text-primary" : ""}`}>{track.title}</p>
          <p className="text-xs text-muted-foreground">{track.artist}{track.genre ? ` · ${track.genre}` : ""}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
            onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}>
            <Heart className={`w-4 h-4 ${likedIds.has(track.id) ? "text-pink-500 fill-pink-500" : ""}`} />
          </Button>
          {track.fileUrl && (
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
              onClick={(e) => { e.stopPropagation(); downloadTrack({ ...track, albumArt: track.albumArt || FALLBACK }); }}>
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-mono">{fmt(track.duration)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-32 bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Library</h1>
            <p className="text-sm text-muted-foreground">Playlists, albums, liked songs, and more</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast({ title: "Create playlist", description: "New playlist created" })}>
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="playlists" className="gap-1"><ListMusic className="w-3 h-3" />Playlists</TabsTrigger>
            <TabsTrigger value="albums" className="gap-1"><Disc className="w-3 h-3" />Albums</TabsTrigger>
            <TabsTrigger value="liked" className="gap-1"><Heart className="w-3 h-3" />Liked</TabsTrigger>
            <TabsTrigger value="my" className="gap-1"><Plus className="w-3 h-3" />My Tracks</TabsTrigger>
            <TabsTrigger value="recent" className="gap-1"><Clock className="w-3 h-3" />Recent</TabsTrigger>
          </TabsList>

          {/* Playlists */}
          <TabsContent value="playlists" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mockPlaylists.slice(0, 8).map((pl: any) => (
                <div key={pl.id} className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setLocation(`/playlist/${pl.id}`)}>
                  <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2 relative">
                    <img src={pl.cover} alt={pl.name} className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.src = FALLBACK; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <p className="text-white text-xs font-medium">{pl.trackCount} tracks</p>
                    </div>
                  </div>
                  <p className="font-medium text-sm truncate">{pl.name}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Albums */}
          <TabsContent value="albums" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mockAlbums.slice(0, 8).map((album: any) => (
                <div key={album.id} className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setLocation(`/album/${album.id}`)}>
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-2">
                    <img src={album.cover} alt={album.title} className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.src = FALLBACK; }} />
                  </div>
                  <p className="font-medium text-sm truncate">{album.title}</p>
                  <p className="text-xs text-muted-foreground">{album.artist}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Liked songs */}
          <TabsContent value="liked" className="mt-4">
            <Card className="geometric-clip">
              <CardContent className="p-4">
                {likedTracks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No liked songs yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {likedTracks.map((t: any) => <TrackRow key={t.id} track={t} queue={likedTracks} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Tracks (uploaded/recorded) */}
          <TabsContent value="my" className="mt-4">
            <Card className="geometric-clip">
              <CardContent className="p-4">
                {myTracks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground space-y-3">
                    <Plus className="w-10 h-10 mx-auto opacity-30" />
                    <p>No tracks yet</p>
                    <Button size="sm" onClick={() => setLocation("/studio")}>Go to Studio</Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {myTracks.map((t: any) => <TrackRow key={t.id} track={t} queue={myTracks} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recently played */}
          <TabsContent value="recent" className="mt-4">
            <Card className="geometric-clip">
              <CardContent className="p-4 space-y-1">
                {recentTracks.map((t: any) => <TrackRow key={t.id} track={t} queue={recentTracks} />)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
