import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AdvancedDJControls } from "@/components/dj/advanced-controls";
import { AudioInputManager } from "@/components/streaming/audio-input-manager";
import { AudioMixer } from "@/components/streaming/audio-mixer";
import { mockTracks, mockWaveform } from "@/lib/mockData";
import {
  Radio, Play, Pause, Square, SkipBack, SkipForward,
  Heart, Volume2, Headphones, Zap, Activity, Waves
} from "lucide-react";

export default function MixerPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(154);
  const [streamDuration, setStreamDuration] = useState(9252);
  const [isLive, setIsLive] = useState(true);
  const [likes, setLikes] = useState(346);
  const [listenerCount, setListenerCount] = useState(2847);
  const { toast } = useToast();

  const currentTrack = mockTracks[currentTrackIndex];
  const progress = currentTrack ? (currentTime / currentTrack.duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStreamDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % mockTracks.length);
    setCurrentTime(0);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + mockTracks.length) % mockTracks.length);
    setCurrentTime(0);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      {/* Stream Status Bar */}
      <div className="sticky top-0 md:top-[57px] z-40 bg-card/80 backdrop-blur border-b border-border px-4 py-2">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{isLive ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {formatStreamDuration(streamDuration)}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-mono font-bold">{listenerCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-mono">{likes}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Now Playing Card */}
        <Card className="geometric-clip overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              {/* Album Art */}
              <div className="w-full md:w-48 h-48 md:h-48 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 crystal-border flex-shrink-0 overflow-hidden relative">
                <img
                  src={currentTrack?.albumArt}
                  alt={currentTrack?.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <Badge className="bg-primary/80 text-xs">{currentTrack?.genre}</Badge>
                </div>
              </div>

              {/* Track Info & Controls */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold truncate">{currentTrack?.title}</h2>
                  <p className="text-muted-foreground text-sm md:text-base">{currentTrack?.artist}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{currentTrack?.bpm} BPM</Badge>
                    <Badge variant="outline" className="text-xs">Key: {currentTrack?.key}</Badge>
                    <Badge variant="outline" className="text-xs">Energy: {currentTrack?.energy}/10</Badge>
                  </div>
                </div>

                {/* Waveform & Progress */}
                <div className="mt-4">
                  <div className="relative h-12 bg-muted rounded-lg overflow-hidden mb-2">
                    <div className="absolute inset-0 flex items-center gap-[2px] px-2">
                      {mockWaveform.map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm transition-all"
                          style={{
                            height: `${h}%`,
                            backgroundColor: i < (progress / 100) * mockWaveform.length ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)',
                            opacity: i < (progress / 100) * mockWaveform.length ? 1 : 0.5,
                          }}
                        />
                      ))}
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary-foreground z-10"
                      style={{ left: `${progress}%` }}
                    />
                  </div>
                  <Progress value={progress} className="h-1.5 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{formatTime(currentTime)}</span>
                    <span className="font-mono">{formatTime(currentTrack?.duration || 0)}</span>
                  </div>
                </div>

                {/* Transport Controls */}
                <div className="flex items-center justify-center gap-3 mt-3">
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={handlePrev}>
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="rounded-full w-14 h-14 geometric-gradient text-primary-foreground"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={handleNext}>
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={() => setLikes(l => l + 1)}>
                    <Heart className="w-4 h-4 text-pink-400" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue */}
        <Card className="geometric-clip">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Waves className="w-4 h-4 text-cyan-400" />
              Track Queue
              <Badge variant="secondary" className="ml-auto">{mockTracks.length} tracks</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockTracks.map((track, idx) => (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  idx === currentTrackIndex ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                }`}
                onClick={() => setCurrentTrackIndex(idx)}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${idx === currentTrackIndex ? 'text-primary' : ''}`}>{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artist} • {track.bpm} BPM</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5">{track.genre}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">{formatTime(track.duration)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* DJ Controls */}
        <AdvancedDJControls />

        {/* Audio Input & External Devices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AudioInputManager
            onAudioStreamChange={() => {
              toast({ title: "External Audio Connected", description: "USB/Bluetooth device ready" });
            }}
          />
          <AudioMixer externalInputVolume={100} onExternalInputVolumeChange={() => {}} />
        </div>

        {/* Stream Controls */}
        <div className="flex gap-3">
          <Button
            variant={isLive ? "destructive" : "default"}
            className="flex-1"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? <><Square className="w-4 h-4 mr-2" /> End Stream</> : <><Radio className="w-4 h-4 mr-2" /> Go Live</>}
          </Button>
          <Button variant="outline" className="flex-1">
            <Activity className="w-4 h-4 mr-2" /> Stream Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
