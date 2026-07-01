import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mockPlaylists } from "@/lib/musicData";
import { Heart, Share2, ListMusic, Music, MoreHorizontal } from "lucide-react";
import { useState } from "react";

export default function PlaylistPage() {
  const params = useParams();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);

  const playlistId = params?.id || "pl1";
  const playlist = mockPlaylists.find(p => p.id === playlistId) || mockPlaylists[0];

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
              <p className="text-sm text-muted-foreground">Curated by STINE</p>
              <div className="flex gap-3 mt-4 justify-center md:justify-start">
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
          </div>

          {/* Empty state — no tracks yet */}
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
            <ListMusic className="w-12 h-12 opacity-30" />
            <p className="font-medium">No songs in this playlist yet</p>
            <p className="text-sm opacity-70">Tracks will appear here once creators upload music to STINE.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
