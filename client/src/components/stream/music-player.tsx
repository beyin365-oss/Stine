import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward,
  Volume2,
  Heart
} from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  albumArt?: string;
}

interface MusicPlayerProps {
  currentTrack?: Track;
  isPlaying?: boolean;
  currentTime?: number;
  onPlayPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onLike?: () => void;
}

export function MusicPlayer({
  currentTrack,
  isPlaying = false,
  currentTime = 0,
  onPlayPause,
  onPrevious,
  onNext,
  onLike
}: MusicPlayerProps) {
  const [isLiked, setIsLiked] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.();
  };

  if (!currentTrack) {
    return (
      <div className="bg-card rounded-lg p-6 geometric-clip">
        <div className="text-center text-muted-foreground">
          <Music className="w-12 h-12 mx-auto mb-2" />
          <p>No track selected</p>
        </div>
      </div>
    );
  }

  const progress = currentTrack.duration > 0 ? (currentTime / currentTrack.duration) * 100 : 0;

  return (
    <div className="bg-card rounded-lg p-6 geometric-clip">
      <div className="flex items-center space-x-6">
        {/* Album artwork */}
        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 crystal-border flex items-center justify-center flex-shrink-0">
          {currentTrack.albumArt ? (
            <img 
              src={currentTrack.albumArt} 
              alt={`${currentTrack.title} artwork`}
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            <Volume2 className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1">
          {/* Track info */}
          <h2 className="text-2xl font-bold mb-2" data-testid="text-track-title">
            {currentTrack.title}
          </h2>
          <p className="text-muted-foreground mb-4" data-testid="text-track-artist">
            {currentTrack.artist}
          </p>
          
          {/* Waveform visualization */}
          <div className="relative h-10 bg-muted rounded mb-4 overflow-hidden">
            <div className="absolute inset-0 waveform"></div>
            <div 
              className="absolute top-0 w-1 h-full bg-primary transition-all duration-300"
              style={{ left: `${progress}%` }}
            />
          </div>
          
          {/* Progress bar */}
          <Progress value={progress} className="mb-2" />
          
          {/* Time info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span data-testid="text-current-time">{formatTime(currentTime)}</span>
            <span data-testid="text-track-duration">{formatTime(currentTrack.duration)}</span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full"
            onClick={onPrevious}
            data-testid="button-previous"
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            size="lg"
            className="w-16 h-16 rounded-full geometric-gradient text-primary-foreground"
            onClick={onPlayPause}
            data-testid="button-play-pause"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full"
            onClick={onNext}
            data-testid="button-next"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full"
            onClick={handleLike}
            data-testid="button-like"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-accent text-accent' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
