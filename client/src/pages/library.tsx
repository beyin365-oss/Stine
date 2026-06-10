import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockTracks } from "@/lib/mockData";
import { mockPlaylists, mockAlbums } from "@/lib/musicData";
import { Play, Pause, Heart, Clock, ListMusic, Disc, Download, Plus, Trash2 } from "lucide-react";

export default function LibraryPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("playlists");
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set(["t1", "t3", "t5"]));

  const myPlaylists = mockPlaylists.slice(0, 4);
  const myAlbums = mockAlbums.slice(0, 4);
  const myLikedTracks = mockTracks.filter(t => likedTracks.has(t.id));
  const myDownloads = mockTracks.slice(0, 3);
  const recentlyPlayed = mockTracks.slice(0, 5);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
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
            <TabsTrigger value="playlists" className="gap-1"><ListMusic className="w-3 h-3" /> Playlists</TabsTrigger>
            <TabsTrigger value="albums" className="gap-1"><Disc className="w-3 h-3" /> Albums</TabsTrigger>
            <TabsTrigger value="liked" className="gap-1"><Heart className="w-3 h-3" /> Liked</TabsTrigger>
            <TabsTrigger value="downloads" className="gap-1"><Download className="w-3 h-3" /> Downloads</TabsTrigger>
            <TabsTrigger value="recent" className="gap-1"><Clock className="w-3 h-3" /> Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="playlists" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {myPlaylists.map((playlist) => (
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
          </TabsContent>

          <TabsContent value="albums" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {myAlbums.map((album) => (
                <div key={album.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setLocation(`/album/${album.id}`)}>
                  <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                    <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
                  </div>
                  <p className="font-medium text-sm truncate">{album.title}</p>
                  <p className="text-xs text-muted-foreground">{album.artist} • {album.year}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="liked" className="mt-4">
            <div className="space-y-2">
              {myLikedTracks.map((track) => (
                <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => setPlayingTrack(playingTrack === track.id ? null : track.id)}>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden relative">
                    <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {playingTrack === track.id ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${playingTrack === track.id ? 'text-primary' : ''}`}>{track.title}</p>
                    <p className="text-xs text-muted-foreground">{track.artist}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); setLikedTracks(prev => { const next = new Set(prev); next.delete(track.id); return next; }); }}>
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                  </Button>
                  <span className="text-xs text-muted-foreground font-mono">{formatTime(track.duration)}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="downloads" className="mt-4">
            <div className="space-y-2">
              {myDownloads.map((track) => (
                <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                    <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{track.title}</p>
                    <p className="text-xs text-muted-foreground">{track.artist}</p>
                  </div>
                  <Download className="w-4 h-4 text-green-500" />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toast({ title: "Removed from downloads" })}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            <div className="space-y-2">
              {recentlyPlayed.map((track, idx) => (
                <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                  <span className="w-6 text-center text-sm text-muted-foreground">{idx + 1}</span>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                    <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{track.title}</p>
                    <p className="text-xs text-muted-foreground">{track.artist}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{idx * 10 + 5} min ago</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
