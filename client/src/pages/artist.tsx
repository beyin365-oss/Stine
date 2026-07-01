import { useParams } from "wouter";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockArtists, mockAlbums } from "@/lib/musicData";
import { Heart, Share2, Users, Disc, Radio, Music } from "lucide-react";
import { useState } from "react";

export default function ArtistPage() {
  const params = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);

  const artistId = params?.id || "a1";
  const artist = mockArtists.find(a => a.id === artistId) || mockArtists[0];
  const artistAlbums = mockAlbums.filter(a => a.artist === artist.name).slice(0, 3);

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

            <TabsContent value="popular" className="mt-4">
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                <Music className="w-12 h-12 opacity-30" />
                <p className="font-medium">No songs uploaded yet</p>
                <p className="text-sm opacity-70">This artist hasn't uploaded any tracks to STINE yet.</p>
              </div>
            </TabsContent>

            <TabsContent value="albums" className="mt-4">
              {artistAlbums.length > 0 ? (
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
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                  <Disc className="w-12 h-12 opacity-30" />
                  <p className="font-medium">No albums yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-4">
              <Card className="geometric-clip">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">About {artist.name}</h3>
                  <p className="text-muted-foreground mb-4">{artist.name} is a leading {artist.genre} artist with a massive global following. Known for blending traditional African rhythms with modern production, they have redefined the sound of contemporary African music.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{artist.followers}</p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{artistAlbums.length}</p>
                      <p className="text-xs text-muted-foreground">Albums</p>
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
