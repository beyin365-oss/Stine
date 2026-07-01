import { useParams } from "wouter";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mockAlbums } from "@/lib/musicData";
import { Play, Heart, Share2, Clock, Disc, ListMusic, Music } from "lucide-react";
import { useState } from "react";

export default function AlbumPage() {
  const params = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);

  const albumId = params?.id || "alb1";
  const album = mockAlbums.find(a => a.id === albumId) || mockAlbums[0];

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Album Header */}
        <div className="relative bg-gradient-to-b from-primary/20 to-background p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden border-4 border-background shadow-lg">
              <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-left flex-1">
              <Badge variant="secondary" className="mb-2">Album</Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-2">{album.title}</h1>
              <p className="text-lg text-muted-foreground mb-1 cursor-pointer hover:underline" onClick={() => setLocation(`/artist/a1`)}>{album.artist}</p>
              <p className="text-sm text-muted-foreground">{album.year}</p>
              <div className="flex gap-3 mt-4 justify-center md:justify-start">
                <Button variant="outline" onClick={() => { setIsSaved(!isSaved); toast({ title: isSaved ? "Removed from library" : "Saved to library" }); }}>
                  <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'text-pink-500 fill-pink-500' : ''}`} /> {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" size="icon" onClick={() => toast({ title: "Shared" })}>
                  <Share2 className="w-4 h-4" />
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

          {/* Empty state — no tracks uploaded yet */}
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
            <Music className="w-12 h-12 opacity-30" />
            <p className="font-medium">No songs uploaded yet</p>
            <p className="text-sm opacity-70">Tracks for this album haven't been added to STINE yet.</p>
          </div>
        </div>

        {/* More from Artist */}
        <div className="p-4 pt-8">
          <h2 className="text-xl font-bold mb-4">More from {album.artist}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockAlbums.filter(a => a.artist === album.artist && a.id !== album.id).slice(0, 4).map((a) => (
              <div key={a.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setLocation(`/album/${a.id}`)}>
                <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                  <img src={a.cover} alt={a.title} className="w-full h-full object-cover" />
                </div>
                <p className="font-medium text-sm truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.year}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
