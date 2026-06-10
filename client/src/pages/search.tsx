import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { usePlayer } from "@/contexts/PlayerContext";
import { mockTracks } from "@/lib/mockData";
import { mockArtists, mockAlbums, mockPlaylists, mockCategories } from "@/lib/musicData";
import {
  Search, X, Play, Pause, TrendingUp, Music, Users, Disc, ListMusic, Download, Heart,
} from "lucide-react";

const FALLBACK = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function SearchPage() {
  const [_, setLocation] = useLocation();
  const { playTrack, currentTrack, isPlaying, downloadTrack } = usePlayer();
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Server-side search for real tracks
  const { data: serverResults = [] } = useQuery<any[]>({
    queryKey: [`/api/tracks/search?q=${encodeURIComponent(debouncedQ)}`],
    enabled: debouncedQ.length >= 2,
    retry: false,
  });

  // Mock search fallback
  const mockResults = debouncedQ.length >= 1
    ? [
        ...mockTracks.filter(t =>
          t.title.toLowerCase().includes(debouncedQ.toLowerCase()) ||
          t.artist.toLowerCase().includes(debouncedQ.toLowerCase())
        ).map(t => ({ ...t, type: "track" as const })),
        ...mockArtists.filter((a: any) => a.name.toLowerCase().includes(debouncedQ.toLowerCase())).map((a: any) => ({ ...a, type: "artist" as const })),
        ...mockAlbums.filter((a: any) => (a.title || a.name || "").toLowerCase().includes(debouncedQ.toLowerCase())).map((a: any) => ({ ...a, type: "album" as const })),
        ...mockPlaylists.filter((p: any) => p.name.toLowerCase().includes(debouncedQ.toLowerCase())).map((p: any) => ({ ...p, type: "playlist" as const })),
      ]
    : [];

  const realTrackResults = serverResults.map((t: any) => ({ ...t, type: "track" as const }));
  const allResults = debouncedQ.length >= 1
    ? [...realTrackResults, ...mockResults.filter(r => r.type !== "track" || realTrackResults.length === 0)]
    : [];

  const trackResults = allResults.filter((i: any) => i.type === "track");
  const artistResults = allResults.filter((i: any) => i.type === "artist");
  const albumResults = allResults.filter((i: any) => i.type === "album");
  const playlistResults = allResults.filter((i: any) => i.type === "playlist");

  const toggleLike = (id: string) =>
    setLikedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handlePlayTrack = (track: any) => {
    const queue = trackResults.map(t => ({
      id: t.id, title: t.title, artist: t.artist,
      duration: t.duration, albumArt: (t as any).albumArt || FALLBACK,
      fileUrl: (t as any).fileUrl || null, genre: (t as any).genre,
    }));
    playTrack({ ...track, albumArt: track.albumArt || FALLBACK, fileUrl: track.fileUrl || null }, queue.length > 0 ? queue : [track]);
  };

  return (
    <div className="min-h-screen pb-32 bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">

        {/* Search bar */}
        <div className="sticky top-0 md:top-[57px] z-40 bg-background/95 backdrop-blur py-2">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, albums…"
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {debouncedQ.length >= 2 && serverResults.length > 0 && (
            <p className="text-center text-xs text-primary mt-1">{serverResults.length} real track{serverResults.length !== 1 ? "s" : ""} found</p>
          )}
        </div>

        {/* Browse / recent when no query */}
        {query.length === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Browse Genres
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mockCategories.map((cat: any) => (
                  <div
                    key={cat.id}
                    className="relative rounded-xl overflow-hidden h-24 cursor-pointer"
                    style={{ background: cat.gradient }}
                    onClick={() => setQuery(cat.name)}
                  >
                    <span className="absolute top-3 left-3 font-bold text-white text-sm">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-3">Trending Tracks</h2>
              <div className="space-y-1">
                {mockTracks.slice(0, 5).map((track, idx) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group cursor-pointer"
                    onClick={() => handlePlayTrack(track)}
                  >
                    <span className="w-5 text-sm text-muted-foreground font-mono">{idx + 1}</span>
                    <img src={track.albumArt} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      onError={(e: any) => { e.target.src = FALLBACK; }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground">{track.artist}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{fmt(track.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search results */}
        {query.length > 0 && (
          <>
            {allResults.length === 0 && debouncedQ === query ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No results for "{query}"</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All{allResults.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{allResults.length}</Badge>}</TabsTrigger>
                  <TabsTrigger value="tracks"><Music className="w-3 h-3 mr-1" />Tracks{trackResults.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{trackResults.length}</Badge>}</TabsTrigger>
                  <TabsTrigger value="artists"><Users className="w-3 h-3 mr-1" />Artists</TabsTrigger>
                  <TabsTrigger value="albums"><Disc className="w-3 h-3 mr-1" />Albums</TabsTrigger>
                  <TabsTrigger value="playlists"><ListMusic className="w-3 h-3 mr-1" />Playlists</TabsTrigger>
                </TabsList>

                {/* All results */}
                <TabsContent value="all" className="mt-4 space-y-6">
                  {trackResults.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-2">Tracks</h3>
                      <div className="space-y-1">
                        {trackResults.slice(0, 5).map((track: any) => {
                          const playing = currentTrack?.id === track.id && isPlaying;
                          return (
                            <div key={track.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group cursor-pointer"
                              onClick={() => handlePlayTrack(track)}>
                              <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative">
                                <img src={track.albumArt || FALLBACK} alt="" className="w-full h-full object-cover"
                                  onError={(e: any) => { e.target.src = FALLBACK; }} />
                                <div className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex">
                                  {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm truncate ${playing ? "text-primary" : ""}`}>{track.title}</p>
                                <p className="text-xs text-muted-foreground">{track.artist}{track.genre ? ` · ${track.genre}` : ""}</p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        })}
                      </div>
                    </div>
                  )}
                  {artistResults.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-2">Artists</h3>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {artistResults.slice(0, 6).map((a: any) => (
                          <div key={a.id} className="text-center cursor-pointer" onClick={() => setLocation(`/artist/${a.id}`)}>
                            <img src={a.image} alt={a.name} className="w-16 h-16 rounded-full mx-auto object-cover mb-1"
                              onError={(e: any) => { e.target.src = FALLBACK; }} />
                            <p className="text-xs truncate">{a.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tracks only */}
                <TabsContent value="tracks" className="mt-4">
                  <div className="space-y-1">
                    {trackResults.map((track: any) => {
                      const playing = currentTrack?.id === track.id && isPlaying;
                      return (
                        <div key={track.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group cursor-pointer"
                          onClick={() => handlePlayTrack(track)}>
                          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative">
                            <img src={track.albumArt || FALLBACK} alt="" className="w-full h-full object-cover"
                              onError={(e: any) => { e.target.src = FALLBACK; }} />
                            <div className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex">
                              {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${playing ? "text-primary" : ""}`}>{track.title}</p>
                            <p className="text-xs text-muted-foreground">{track.artist}{track.genre ? ` · ${track.genre}` : ""}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    })}
                    {trackResults.length === 0 && (
                      <p className="text-center py-6 text-muted-foreground text-sm">No tracks found</p>
                    )}
                  </div>
                </TabsContent>

                {/* Artists */}
                <TabsContent value="artists" className="mt-4">
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {artistResults.map((a: any) => (
                      <div key={a.id} className="text-center cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setLocation(`/artist/${a.id}`)}>
                        <img src={a.image} alt={a.name} className="w-20 h-20 rounded-full mx-auto object-cover mb-2"
                          onError={(e: any) => { e.target.src = FALLBACK; }} />
                        <p className="font-medium text-sm">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.followers}</p>
                      </div>
                    ))}
                    {artistResults.length === 0 && <p className="col-span-full text-center py-6 text-muted-foreground text-sm">No artists found</p>}
                  </div>
                </TabsContent>

                {/* Albums */}
                <TabsContent value="albums" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {albumResults.map((a: any) => (
                      <div key={a.id} className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setLocation(`/album/${a.id}`)}>
                        <img src={a.cover} alt={a.title || a.name} className="w-full aspect-square rounded-xl object-cover mb-2"
                          onError={(e: any) => { e.target.src = FALLBACK; }} />
                        <p className="font-medium text-sm truncate">{a.title || a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.artist}</p>
                      </div>
                    ))}
                    {albumResults.length === 0 && <p className="col-span-full text-center py-6 text-muted-foreground text-sm">No albums found</p>}
                  </div>
                </TabsContent>

                {/* Playlists */}
                <TabsContent value="playlists" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {playlistResults.map((p: any) => (
                      <div key={p.id} className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setLocation(`/playlist/${p.id}`)}>
                        <img src={p.cover} alt={p.name} className="w-full aspect-square rounded-xl object-cover mb-2"
                          onError={(e: any) => { e.target.src = FALLBACK; }} />
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.trackCount} tracks</p>
                      </div>
                    ))}
                    {playlistResults.length === 0 && <p className="col-span-full text-center py-6 text-muted-foreground text-sm">No playlists found</p>}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </div>
  );
}
