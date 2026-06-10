import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTracks } from "@/lib/mockData";
import { mockArtists, mockAlbums, mockPlaylists, mockSearchHistory } from "@/lib/musicData";
import { Search, X, Play, Clock, TrendingUp, Music, Users, Disc, ListMusic } from "lucide-react";

export default function SearchPage() {
  const [_, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const allResults = [
    ...mockTracks.map(t => ({ ...t, type: "track" as const })),
    ...mockArtists.map(a => ({ ...a, type: "artist" as const })),
    ...mockAlbums.map(a => ({ ...a, type: "album" as const })),
    ...mockPlaylists.map(p => ({ ...p, type: "playlist" as const })),
  ];

  const filtered = query.length > 0
    ? allResults.filter((item: any) => {
        const name = item.title || item.name || item.title;
        return name.toLowerCase().includes(query.toLowerCase());
      })
    : [];

  const tracks = filtered.filter((i: any) => i.type === "track");
  const artists = filtered.filter((i: any) => i.type === "artist");
  const albums = filtered.filter((i: any) => i.type === "album");
  const playlists = filtered.filter((i: any) => i.type === "playlist");

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Search Bar */}
        <div className="sticky top-0 md:top-[57px] z-40 bg-background/95 backdrop-blur py-2">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, albums, playlists..."
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Recent Searches */}
        {query.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Recent Searches</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {mockSearchHistory.map((term) => (
                <Button key={term} variant="outline" size="sm" onClick={() => setQuery(term)}>
                  <Search className="w-3 h-3 mr-1" /> {term}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {query.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="gap-1"><Search className="w-3 h-3" /> All ({filtered.length})</TabsTrigger>
              <TabsTrigger value="tracks" className="gap-1"><Music className="w-3 h-3" /> Tracks ({tracks.length})</TabsTrigger>
              <TabsTrigger value="artists" className="gap-1"><Users className="w-3 h-3" /> Artists ({artists.length})</TabsTrigger>
              <TabsTrigger value="albums" className="gap-1"><Disc className="w-3 h-3" /> Albums ({albums.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-4">
              {/* Top Result */}
              {filtered.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Result</h3>
                  <Card className="geometric-clip cursor-pointer hover:scale-[1.01] transition-transform" onClick={() => setLocation(`/track/${filtered[0].id}`)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden flex-shrink-0">
                        <img src={(filtered[0] as any).albumArt || (filtered[0] as any).image || (filtered[0] as any).cover || (filtered[0] as any).albumArt} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{(filtered[0] as any).title || (filtered[0] as any).name || (filtered[0] as any).title}</p>
                        <p className="text-sm text-muted-foreground">{(filtered[0] as any).artist || (filtered[0] as any).genre || (filtered[0] as any).description}</p>
                        <Badge variant="secondary" className="mt-1">{(filtered[0] as any).type}</Badge>
                      </div>
                      <Play className="w-8 h-8 text-primary" />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* All Results Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.slice(1).map((item: any) => (
                  <div key={item.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => {
                    if (item.type === "track") setLocation(`/track/${item.id}`);
                    else if (item.type === "artist") setLocation(`/artist/${item.id}`);
                    else if (item.type === "album") setLocation(`/album/${item.id}`);
                    else setLocation(`/playlist/${item.id}`);
                  }}>
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                      <img src={item.albumArt || item.image || item.cover || item.albumArt} alt="" className="w-full h-full object-cover" />
                    </div>
                    <p className="font-medium text-sm truncate">{item.title || item.name || item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.artist || item.genre || item.description || item.artist}</p>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No results for "{query}"</p>
                  <p className="text-sm">Try searching for a song, artist, or album</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tracks" className="space-y-2 mt-4">
              {tracks.map((track: any) => (
                <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden flex-shrink-0">
                    <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{track.title}</p>
                    <p className="text-xs text-muted-foreground">{track.artist}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="artists" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {artists.map((artist: any) => (
                  <div key={artist.id} className="text-center cursor-pointer" onClick={() => setLocation(`/artist/${artist.id}`)}>
                    <div className="w-full aspect-square rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                      <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="font-medium text-sm">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">{artist.followers}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="albums" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {albums.map((album: any) => (
                  <div key={album.id} className="cursor-pointer" onClick={() => setLocation(`/album/${album.id}`)}>
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                      <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
                    </div>
                    <p className="font-medium text-sm">{album.title}</p>
                    <p className="text-xs text-muted-foreground">{album.artist} • {album.year}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Browse All when no query */}
        {query.length === 0 && (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Browse All
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {mockArtists.map((artist) => (
                  <div key={artist.id} className="relative rounded-xl overflow-hidden h-24 cursor-pointer group" style={{ background: `linear-gradient(135deg, hsl(${Math.random() * 360}, 60%, 40%), hsl(${Math.random() * 360}, 60%, 30%))` }}>
                    <span className="absolute top-3 left-3 font-bold text-white text-sm">{artist.name}</span>
                    <Disc className="absolute bottom-2 right-2 w-8 h-8 text-white/30 rotate-12 group-hover:rotate-0 transition-transform" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
