import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { mockLiveStreams, mockTracks, mockPlaylist, mockChatMessages } from "@/lib/mockData";
import {
  Radio, Play, Headphones, Heart, MessageCircle, Share2,
  Music, TrendingUp, Clock, Users, Search, Filter, Flame
} from "lucide-react";

export default function FeedPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [activeTab, setActiveTab] = useState("live");
  const { toast } = useToast();

  const genres = ["all", "afrobeat", "amapiano", "house", "highlife", "alte", "gospel", "jazz"];
  const totalListeners = mockLiveStreams.reduce((sum, s) => sum + s.listenerCount, 0);

  const filteredStreams = mockLiveStreams.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "all" || s.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="geometric-clip">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Radio className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{mockLiveStreams.length}</p>
                <p className="text-xs text-muted-foreground">Live Now</p>
              </div>
            </CardContent>
          </Card>
          <Card className="geometric-clip">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{totalListeners.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Listeners</p>
              </div>
            </CardContent>
          </Card>
          <Card className="geometric-clip">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-lg font-bold">3.2K</p>
                <p className="text-xs text-muted-foreground">Likes Today</p>
              </div>
            </CardContent>
          </Card>
          <Card className="geometric-clip">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-lg font-bold">Trending</p>
                <p className="text-xs text-muted-foreground">Afrobeat</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search streams, DJs, genres..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {genres.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                className="capitalize text-xs whitespace-nowrap"
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live" className="gap-1">
              <Radio className="w-4 h-4" /> Live
            </TabsTrigger>
            <TabsTrigger value="playlists" className="gap-1">
              <Music className="w-4 h-4" /> Playlists
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1">
              <MessageCircle className="w-4 h-4" /> Chat
            </TabsTrigger>
          </TabsList>

          {/* Live Streams */}
          <TabsContent value="live" className="space-y-4">
            {filteredStreams.map((stream) => (
              <Card key={stream.id} className="geometric-clip overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Stream Thumbnail */}
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop')] bg-cover bg-center opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-1 left-1">
                        <Badge className="bg-red-500 text-[10px] px-1.5 py-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1" /> LIVE
                        </Badge>
                      </div>
                    </div>

                    {/* Stream Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm md:text-base truncate">{stream.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">{stream.description}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full flex-shrink-0 ml-2"
                          onClick={() => toast({ title: "Joined Stream", description: `Now listening to ${stream.title}` })}
                        >
                          <Play className="w-3 h-3 mr-1" /> Join
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Headphones className="w-3 h-3" /> {stream.listenerCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(stream.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{stream.genre}</Badge>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          <Heart className="w-3 h-3" /> Like
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          <MessageCircle className="w-3 h-3" /> Chat
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          <Share2 className="w-3 h-3" /> Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredStreams.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No streams match your filters</p>
                <Button variant="outline" className="mt-3" onClick={() => { setSearchQuery(""); setSelectedGenre("all"); }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Playlists */}
          <TabsContent value="playlists" className="space-y-4">
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Music className="w-4 h-4 text-cyan-400" /> {mockPlaylist.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{mockPlaylist.description}</p>
                {mockPlaylist.tracks.map((track, idx) => (
                  <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground">{track.artist} • {track.bpm} BPM</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{track.genre}</Badge>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-cyan-400" /> Community Chat
                  <Badge variant="secondary" className="ml-auto">{mockChatMessages.length} messages</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockChatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                      {msg.username.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{msg.username}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-foreground">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Chat Input */}
            <div className="flex gap-2">
              <Input placeholder="Say something in the chat..." className="flex-1" />
              <Button className="geometric-gradient text-primary-foreground">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
