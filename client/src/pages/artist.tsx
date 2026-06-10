import { useParams } from "wouter";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockTracks } from "@/lib/mockData";
import { mockArtists, mockAlbums } from "@/lib/musicData";
import { Play, Pause, Heart, Share2, Users, Disc, Radio, Music, Clock } from "lucide-react";
import { useState } from "react";

export default function ArtistPage() {
  const params = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  const artistId = params?.id || "a1";
  const artist = mockArtists.find(a => a.id === artistId) || mockArtists[0];
  const artistTracks = mockTracks.slice(0, 5);
  const artistAlbums = mockAlbums.filter(a => a.artist === artist.name).slice(0, 3);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Artist Header */}
        <div className="relative bg-gradient-to-b from-primary/20 to-background p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden border-4 border-background shadow-lg">
              <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-left flex-1">
              <Badge variant="secondary" className="mb-2">Verified Artist</Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-2">{artist.name}</h1>
              <p className="text-muted-foreground mb-4">{artist.followers} monthly listeners</p>
              <div className="flex gap-3 justify-center md:justify-start">
                <Button className="geometric-gradient text-primary-foreground" onClick={() => { setPlayingTrack(artistTracks[0].id); toast({ title: "Playing", description: `Now playing ${artistTracks[0].title}` }); }}>
                  <Play className="w-4 h-4 mr-2" /> Play
                </Button>
                <Button variant="outline" onClick={() => setIsFollowing(!isFollowing)}>
                  <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'text-pink-500 fill-pink-500' : ''}`} /> {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button variant="outline" size="icon" onClick={() => toast({ title: "Shared" })}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-8">
          <Tabs defaultValue="popular">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="popular" className="gap-1"><Music className="w-3 h-3" /> Popular</TabsTrigger>
              <TabsTrigger value="albums" className="gap-1"><Disc className="w-3 h-3" /> Albums</TabsTrigger>
              <TabsTrigger value="about" className="gap-1"><Users className="w-3 h-3" /> About</TabsTrigger>
              <TabsTrigger value="live" className="gap-1"><Radio className="w-3 h-3" /> Live</TabsTrigger>
            </TabsList>

            <TabsContent value="popular" className="mt-4 space-y-2">
              {artistTracks.map((track, idx) => (
                <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => setPlayingTrack(playingTrack === track.id ? null : track.id)}>
                  <span className="w-6 text-center text-sm text-muted-foreground">{idx + 1}</span>
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
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setLikedTracks(p => { const n = new Set(p); n.has(track.id) ? n.delete(track.id) : n.add(track.id); return n; }); }}>
                    <Heart className={`w-4 h-4 ${likedTracks.has(track.id) ? 'text-pink-500 fill-pink-500' : ''}`} />
                  </Button>
                  <span className="text-xs text-muted-foreground font-mono">{formatTime(track.duration)}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="albums" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {artistAlbums.map((album) => (
                  <div key={album.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setLocation(`/album/${album.id}`)}>
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden mb-2">
                      <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
                    </div>
                    <p className="font-medium text-sm truncate">{album.title}</p>
                    <p className="text-xs text-muted-foreground">{album.year} • {album.tracks} tracks</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="about" className="mt-4">
              <Card className="geometric-clip">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">About {artist.name}</h3>
                  <p className="text-muted-foreground mb-4">{artist.name} is a leading {artist.genre} artist from Nigeria with a massive global following. Known for blending traditional African rhythms with modern production, they have redefined the sound of contemporary African music.</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{artist.followers}</p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{artistAlbums.length}</p>
                      <p className="text-xs text-muted-foreground">Albums</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{artistTracks.length}</p>
                      <p className="text-xs text-muted-foreground">Top Tracks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="live" className="mt-4">
              <Card className="geometric-clip">
                <CardContent className="p-6 text-center">
                  <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-bold text-lg mb-2">No Live Streams</h3>
                  <p className="text-muted-foreground">{artist.name} is not streaming right now. Follow them to get notified when they go live.</p>
                  <Button className="mt-4" onClick={() => setLocation("/feed")}>Browse Live Streams</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
