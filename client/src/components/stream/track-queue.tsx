import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, MoreHorizontal } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  genre?: string;
}

interface TrackQueueProps {
  tracks: Track[];
  onRemoveTrack?: (trackId: string) => void;
  onReorderTracks?: (tracks: Track[]) => void;
}

export function TrackQueue({ tracks, onRemoveTrack }: TrackQueueProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGenreColor = (genre?: string) => {
    const colors = {
      'electronic': 'bg-primary',
      'house': 'bg-secondary',
      'techno': 'bg-accent',
      'trance': 'bg-green-500',
      'dubstep': 'bg-purple-500',
    };
    return colors[genre?.toLowerCase() as keyof typeof colors] || 'bg-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <List className="w-5 h-5 text-primary mr-2" />
          Up Next
          <Badge variant="secondary" className="ml-auto" data-testid="text-queue-count">
            {tracks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tracks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <List className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tracks in queue</p>
            <p className="text-sm">Add some tracks to get started</p>
          </div>
        ) : (
          tracks.map((track, index) => (
            <div 
              key={track.id} 
              className="flex items-center space-x-3 p-3 rounded hover:bg-muted transition-colors group"
              data-testid={`track-queue-item-${track.id}`}
            >
              <div className={`w-2 h-2 diamond-shape ${getGenreColor(track.genre)}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" data-testid={`text-track-title-${track.id}`}>
                  {track.title}
                </p>
                <p className="text-sm text-muted-foreground truncate" data-testid={`text-track-artist-${track.id}`}>
                  {track.artist}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {track.genre && (
                  <Badge variant="outline" className="text-xs">
                    {track.genre}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground font-mono" data-testid={`text-track-duration-${track.id}`}>
                  {formatDuration(track.duration)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveTrack?.(track.id)}
                  data-testid={`button-remove-track-${track.id}`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
