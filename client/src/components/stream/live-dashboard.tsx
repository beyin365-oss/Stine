import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { MusicPlayer } from "./music-player";
import { TrackQueue } from "./track-queue";
import { SongRequests } from "./song-requests";
import { AnalyticsCards } from "./analytics-cards";
import { ChatSidebar } from "../chat/chat-sidebar";
import { 
  Radio, 
  Square, 
  Share, 
  Play, 
  Pause,
  Heart,
  Headphones
} from "lucide-react";

interface Stream {
  id: string;
  title: string;
  description?: string;
  isLive: boolean;
  listenerCount: number;
  currentTrackId?: string;
  startedAt: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  albumArt?: string;
  genre?: string;
}

const EMPTY_TRACKS: Track[] = [];

export function LiveDashboard() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(154); // 2:34
  const [streamDuration, setStreamDuration] = useState(9252); // 2:34:12
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current stream
  const { data: currentStream } = useQuery<Stream>({
    queryKey: ['/api/stream/current'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // End stream mutation
  const endStreamMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/stream/end');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stream/current'] });
      toast({
        title: "Stream Ended",
        description: "Your live stream has been ended successfully",
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
        title: "Error",
        description: "Failed to end stream",
        variant: "destructive",
      });
    },
  });

  // Update current time every second when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
        setStreamDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatStreamDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndStream = () => {
    if (window.confirm('Are you sure you want to end this stream?')) {
      endStreamMutation.mutate();
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleShare = () => {
    const streamUrl = `${window.location.origin}/stream/${currentStream?.id}`;
    navigator.clipboard.writeText(streamUrl);
    toast({
      title: "Link Copied",
      description: "Stream link copied to clipboard",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Live Status */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
                <Badge variant="destructive" className="text-xs" data-testid="text-stream-duration">
                  {formatStreamDuration(streamDuration)}
                </Badge>
              </div>
              
              {/* Listener Stats */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Headphones className="w-4 h-4 text-primary" />
                  <span className="font-mono text-lg" data-testid="text-listener-count">
                    {currentStream?.listenerCount ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground">listeners</span>
                </div>
              </div>
            </div>

            {/* Stream Controls */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="destructive"
                onClick={handleEndStream}
                disabled={endStreamMutation.isPending}
                data-testid="button-end-stream"
              >
                <Square className="w-4 h-4 mr-2" />
                End Stream
              </Button>
              <Button 
                variant="outline"
                onClick={handleShare}
                data-testid="button-share-stream"
              >
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Music Player */}
          <div className="mb-6">
            <MusicPlayer
              currentTrack={null}
              isPlaying={isPlaying}
              currentTime={currentTime}
              onPlayPause={handlePlayPause}
              onPrevious={() => {}}
              onNext={() => {}}
              onLike={() => {}}
            />
          </div>

          {/* Queue and Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <TrackQueue 
              tracks={EMPTY_TRACKS}
              onRemoveTrack={() => {}}
            />
            <SongRequests streamId={currentStream?.id} />
          </div>

          {/* Analytics */}
          <AnalyticsCards />
        </div>
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar streamId={currentStream?.id} />
    </div>
  );
}
