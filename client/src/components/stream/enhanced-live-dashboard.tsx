import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

// Import enhanced components
import { MusicPlayer } from "./music-player";
import { ChatSidebar } from "../chat/chat-sidebar";
import { AdvancedDJControls } from "../dj/advanced-controls";
import { UploadManager } from "../music/upload-manager";
import { StreamRecorder } from "../recording/stream-recorder";
import { AdvancedAnalytics } from "../analytics/advanced-analytics";
import { TipSystem, RecentTips } from "../monetization/tip-system";
import { CollaborationHub } from "../social/collaboration-hub";
import { WebRTCAudioStream } from "../streaming/webrtc-audio-stream";
import { VideoStream } from "../streaming/video-stream";
import { NFTMarketplace } from "../nft/nft-marketplace";
import { AutoMixing } from "../ai/auto-mixing";
import { AudioInputManager } from "../streaming/audio-input-manager";
import { AudioMixer } from "../streaming/audio-mixer";
import { DJVideoControl } from "../streaming/dj-video-control";
import { FanVideoControl } from "../streaming/fan-video-control";
import { ListenerVideoPanel } from "../streaming/listener-video-panel";

import { 
  Radio, 
  Square, 
  Share, 
  Play, 
  Pause,
  Heart,
  Headphones,
  Users,
  TrendingUp,
  Music,
  Settings,
  Upload,
  Mic,
  BarChart3,
  DollarSign,
  UserCheck,
  Eye,
  Volume2,
  Sliders,
  FileAudio,
  Brain,
  Zap,
  Video,
  Sparkles,
  Cpu,
  Globe,
  Wifi
} from "lucide-react";

interface Stream {
  id: string;
  title: string;
  description?: string;
  isLive: boolean;
  listenerCount: number;
  currentTrackId?: string;
  startedAt: string;
  genre?: string;
  tags?: string[];
}

export function EnhancedLiveDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("house");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [tracks, setTracks] = useState([]);

  // Enhanced dashboard state
  const [dashboardLayout, setDashboardLayout] = useState({
    showChat: true,
    showAnalytics: true,
    showTips: true,
    showRecording: false,
    chatPosition: 'right' as 'right' | 'bottom',
  });

  // Fetch current stream
  const { data: currentStream } = useQuery<Stream>({
    queryKey: ['/api/streams/current'],
    refetchInterval: isStreaming ? 5000 : false,
  });

  // Fetch real-time metrics
  const { data: liveMetrics } = useQuery({
    queryKey: ['/api/streams/metrics', currentStream?.id],
    refetchInterval: isStreaming ? 2000 : false,
    enabled: isStreaming && !!currentStream?.id,
  });

  // Type-safe default values
  const metricsData = (liveMetrics as any) || {
    listenerCount: 0,
    totalLikes: 0,
    tipsReceived: 0,
    engagementRate: 0,
    audioQuality: 'High',
    serverLoad: 45
  };

  // Fetch recent tips
  const { data: recentTips = [] } = useQuery({
    queryKey: ['/api/tips/recent', currentStream?.id],
    refetchInterval: 10000,
    enabled: isStreaming,
  });

  const startStreamMutation = useMutation({
    mutationFn: async (streamData: any) => {
      return await apiRequest('POST', '/api/streams/start', streamData);
    },
    onSuccess: (data) => {
      setIsStreaming(true);
      queryClient.invalidateQueries({ queryKey: ['/api/streams/current'] });
      toast({
        title: "Stream Started! 🔴",
        description: "You are now live! Share your stream to get listeners.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Stream Failed",
        description: "Unable to start stream. Please try again.",
        variant: "destructive",
      });
    },
  });

  const stopStreamMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/streams/${currentStream?.id}/stop`);
    },
    onSuccess: () => {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ['/api/streams/current'] });
      toast({
        title: "Stream Ended",
        description: "Your stream has ended successfully.",
      });
    },
  });

  const handleStartStream = () => {
    if (!streamTitle) {
      toast({
        title: "Missing Title",
        description: "Please enter a title for your stream",
        variant: "destructive",
      });
      return;
    }

    startStreamMutation.mutate({
      title: streamTitle,
      description: streamDescription,
      genre: selectedGenre,
    });
  };

  const handleStopStream = () => {
    stopStreamMutation.mutate();
  };

  const QuickStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="geometric-clip">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold" data-testid="text-listener-count">
                {metricsData.listenerCount}
              </p>
              <p className="text-xs text-muted-foreground">Listeners</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="geometric-clip">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-likes">
                {metricsData.totalLikes}
              </p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="geometric-clip">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold" data-testid="text-tips-received">
                ${metricsData.tipsReceived}
              </p>
              <p className="text-xs text-muted-foreground">Tips</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="geometric-clip">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold" data-testid="text-engagement-rate">
                {metricsData.engagementRate}%
              </p>
              <p className="text-xs text-muted-foreground">Engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const StreamControls = () => (
    <Card className="geometric-clip">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Radio className="w-5 h-5 mr-2" />
            Stream Control
          </span>
          <div className="flex items-center space-x-2">
            {isStreaming && (
              <Badge variant="destructive" className="animate-pulse">
                🔴 LIVE
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              data-testid="button-toggle-advanced"
            >
              <Sliders className="w-4 h-4 mr-2" />
              {showAdvancedControls ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isStreaming ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Stream Title</label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Enter your stream title..."
                className="w-full p-2 border rounded mt-1"
                data-testid="input-stream-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <textarea
                value={streamDescription}
                onChange={(e) => setStreamDescription(e.target.value)}
                placeholder="Describe your stream..."
                className="w-full p-2 border rounded mt-1 h-20 resize-none"
                data-testid="textarea-stream-description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                data-testid="select-stream-genre"
              >
                <option value="house">House</option>
                <option value="techno">Techno</option>
                <option value="trance">Trance</option>
                <option value="progressive">Progressive</option>
                <option value="deep-house">Deep House</option>
                <option value="ambient">Ambient</option>
              </select>
            </div>
            <Button
              onClick={handleStartStream}
              disabled={startStreamMutation.isPending}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              data-testid="button-start-stream"
            >
              <Play className="w-4 h-4 mr-2" />
              {startStreamMutation.isPending ? "Starting..." : "Go Live"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold" data-testid="text-current-stream-title">
                {currentStream?.title}
              </h3>
              <p className="text-muted-foreground">
                Live since {new Date(currentStream?.startedAt || '').toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleStopStream}
                disabled={stopStreamMutation.isPending}
                variant="destructive"
                className="flex-1"
                data-testid="button-stop-stream"
              >
                <Square className="w-4 h-4 mr-2" />
                End Stream
              </Button>
              
              <Button variant="outline" data-testid="button-share-stream">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold geometric-gradient bg-clip-text text-transparent">
              Live Studio
            </h1>
            {isStreaming && currentStream && (
              <div className="flex items-center space-x-3">
                <Badge variant="destructive" className="animate-pulse">
                  🔴 LIVE
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentStream.title}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDashboardLayout(prev => ({ ...prev, showChat: !prev.showChat }))}
              data-testid="button-toggle-chat"
            >
              <Eye className="w-4 h-4 mr-2" />
              {dashboardLayout.showChat ? 'Hide' : 'Show'} Chat
            </Button>
            
            {user && (
              <div>
                <TipSystem
                  recipientId={(user as any).id || ''}
                  recipientName={(user as any).djName || (user as any).firstName || 'DJ'}
                  recipientImage={(user as any).profileImageUrl}
                  streamId={currentStream?.id}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Main Controls */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="music">Music</TabsTrigger>
              <TabsTrigger value="controls">DJ Controls</TabsTrigger>
              <TabsTrigger value="webrtc">Live Audio</TabsTrigger>
              <TabsTrigger value="video">Video Stream</TabsTrigger>
              <TabsTrigger value="ai">AI Mixing</TabsTrigger>
              <TabsTrigger value="nft">NFT Market</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4">
              <QuickStats />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StreamControls />
                
                <Card className="geometric-clip">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Music className="w-5 h-5 mr-2" />
                      Now Playing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MusicPlayer />
                  </CardContent>
                </Card>
              </div>

              {showAdvancedControls && (
                <Card className="geometric-clip">
                  <CardHeader>
                    <CardTitle>Advanced DJ Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdvancedDJControls />
                  </CardContent>
                </Card>
              )}

              {dashboardLayout.showTips && Array.isArray(recentTips) && recentTips.length > 0 && (
                <RecentTips tips={recentTips as any} />
              )}
            </TabsContent>

            {/* Music Tab */}
            <TabsContent value="music" className="space-y-4">
              <UploadManager />
            </TabsContent>

            {/* DJ Controls Tab */}
            <TabsContent value="controls" className="space-y-4">
              <AdvancedDJControls />
              
              {/* Audio Input Manager */}
              <AudioInputManager 
                onAudioStreamChange={(stream) => {
                  toast({
                    title: "External Audio Connected! 🎤",
                    description: "External device audio is now streaming to listeners",
                  });
                }}
              />
              
              {/* Audio Mixer */}
              <AudioMixer 
                externalInputVolume={100}
                onExternalInputVolumeChange={(volume) => {
                  console.log('External input volume:', volume);
                }}
              />
            </TabsContent>

            {/* WebRTC Audio Tab */}
            <TabsContent value="webrtc" className="space-y-4">
              <WebRTCAudioStream 
                streamId={currentStream?.id}
                onStreamStart={(streamId) => {
                  toast({
                    title: "Live Audio Stream Started! 🔴",
                    description: "Broadcasting high-quality audio to listeners",
                  });
                }}
                onStreamStop={() => {
                  toast({
                    title: "Audio Stream Stopped",
                    description: "Live audio broadcast has ended",
                  });
                }}
              />
            </TabsContent>

            {/* Video Stream Tab - DJ Camera */}
            <TabsContent value="video" className="space-y-4">
              <DJVideoControl streamId={currentStream?.id} />
              
              <VideoStream 
                streamId={currentStream?.id}
                audioEnabled={true}
                onStreamStart={(streamData) => {
                  toast({
                    title: "Video Stream Started! 📹",
                    description: "Broadcasting live video to viewers",
                  });
                }}
                onStreamStop={() => {
                  toast({
                    title: "Video Stream Stopped",
                    description: "Video broadcast has ended",
                  });
                }}
              />
            </TabsContent>

            {/* AI Mixing Tab */}
            <TabsContent value="ai" className="space-y-4">
              <AutoMixing 
                tracks={tracks}
                onMixComplete={(sessionId) => {
                  toast({
                    title: "AI Auto-Mix Complete! 🎵",
                    description: "Your AI-generated mix is ready to download",
                  });
                }}
              />
            </TabsContent>

            {/* NFT Marketplace Tab */}
            <TabsContent value="nft" className="space-y-4">
              <NFTMarketplace 
                djId={(user as any)?.id}
                showCreateButton={true}
              />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <AdvancedAnalytics 
                streamId={currentStream?.id}
                timeRange="day"
              />
            </TabsContent>

            {/* Fan Camera Tab (for listeners viewing stream) */}
            {!isStreaming && (
              <TabsContent value="fan-cam" className="space-y-4">
                <ListenerVideoPanel 
                  streamId={streamId}
                  djAllowsFanCameras={true}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Panel - Chat & Secondary Info */}
        {dashboardLayout.showChat && (
          <div className="w-80 border-l bg-card">
            <ChatSidebar 
              streamId={currentStream?.id}
            />
          </div>
        )}
      </div>

      {/* Footer - Mini Player & Status */}
      {isStreaming && (
        <div className="border-t p-3 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {metricsData.listenerCount}
                </span>
                <span className="flex items-center">
                  <Volume2 className="w-4 h-4 mr-1" />
                  {metricsData.audioQuality}
                </span>
                <span className="flex items-center">
                  <Zap className="w-4 h-4 mr-1" />
                  {metricsData.serverLoad}% load
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" data-testid="button-quick-record">
                <FileAudio className="w-4 h-4 mr-2" />
                Record
              </Button>
              <Button variant="outline" size="sm" data-testid="button-quick-settings">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}