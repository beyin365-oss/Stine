import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLocation } from "wouter";
import { Search, Play, Pause, Loader2, Music, X, TrendingUp } from "lucide-react";

const FALLBACK_ART = "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data: searchResults = [], isLoading: searching } = useQuery<any[]>({
    queryKey: ["/api/tracks/search", debouncedQ],
    queryFn: async () => {
      if (!debouncedQ || debouncedQ.length < 2) return [];
      const res = await fetch(`/api/tracks/search?q=${encodeURIComponent(debouncedQ)}`);
      return res.json();
    },
    enabled: debouncedQ.length >= 2,
  });

  const { data: allTracks = [] } = useQuery<any[]>({ queryKey: ["/api/tracks/public"] });
  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["/api/content/categories"] });
  const { data: featuredArtists = [] } = useQuery<any[]>({ queryKey: ["/api/content/artists"] });

  const trending = [...allTracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 8);
  const displayTracks = debouncedQ.length >= 2 ? searchResults : trending;

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tracks, artists, genres..."
            className="pl-9 pr-9 py-3 rounded-xl text-sm"
            autoFocus
          />
          {q && (
            <button onClick={() => { setQ(""); setDebouncedQ(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Genre categories */}
        {!debouncedQ && categories.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Browse by Genre</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {categories.slice(0, 12).map((cat: any) => (
                <div key={cat.id}
                  className="relative overflow-hidden rounded-xl aspect-square flex items-end cursor-pointer hover:scale-105 transition-transform"
                  style={{ background: cat.gradient || "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
                  onClick={() => setQ(cat.name)}>
                  <p className="p-2 text-white font-bold text-xs drop-shadow">{cat.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Artists row */}
        {!debouncedQ && featuredArtists.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Popular Artists</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {featuredArtists.slice(0, 8).map((a: any) => (
                <div key={a.id} className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16 cursor-pointer" onClick={() => setQ(a.name)}>
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-border hover:ring-primary transition-all">
                    <img src={a.image || FALLBACK_ART} alt={a.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ART; }} />
                  </div>
                  <p className="text-xs text-center leading-tight line-clamp-2">{a.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results / Trending */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            {debouncedQ.length >= 2
              ? <><Search className="w-4 h-4 text-muted-foreground" /><h2 className="text-sm font-semibold">Results for "{debouncedQ}"</h2></>
              : <><TrendingUp className="w-4 h-4 text-cyan-400" /><h2 className="text-sm font-semibold">Trending</h2></>
            }
          </div>

          {searching ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : displayTracks.length === 0 ? (
            <Card className="geometric-clip"><CardContent className="p-10 text-center">
              <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">{debouncedQ.length >= 2 ? `No results for "${debouncedQ}"` : "No tracks yet"}</p>
              <p className="text-xs text-muted-foreground mt-1">{debouncedQ.length >= 2 ? "Try a different search term" : "Upload the first track!"}</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-1.5">
              {displayTracks.map((t: any) => {
                const active = currentTrack?.id === t.id;
                return (
                  <div key={t.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-card/60 transition-colors group cursor-pointer ${active ? "bg-primary/10" : ""}`}
                    onClick={() => playTrack(t)}>
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img src={t.albumArt || FALLBACK_ART} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ART; }} />
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                        {active && isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${active ? "text-primary" : ""}`}>{t.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
                    </div>
                    {t.genre && <Badge variant="outline" className="text-[10px] px-1.5 hidden sm:block">{t.genre}</Badge>}
                    {t.bpm && <span className="text-xs text-muted-foreground hidden md:block">{t.bpm} BPM</span>}
                    <span className="text-xs text-muted-foreground flex-shrink-0">{fmt(t.duration || 0)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
