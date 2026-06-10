import { usePlayer } from "@/contexts/PlayerContext";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, Download, Heart, ChevronDown,
} from "lucide-react";
import { useState } from "react";

function fmt(s: number) {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

const FALLBACK_ART = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop";

export function MusicPlayer() {
  const {
    currentTrack, isPlaying, volume, currentTime, duration,
    shuffle, repeat, togglePlay, next, prev, seek,
    setVolume, toggleShuffle, toggleRepeat, downloadTrack,
  } = usePlayer();

  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trackDur = duration || currentTrack.duration;

  return (
    <>
      {/* Full-screen expanded view (mobile only) */}
      {expanded && (
        <div className="md:hidden fixed inset-0 z-[60] bg-gradient-to-b from-card to-background flex flex-col items-center justify-center gap-6 p-8 animate-in slide-in-from-bottom">
          <button
            className="absolute top-6 left-4 text-muted-foreground"
            onClick={() => setExpanded(false)}
          >
            <ChevronDown className="w-7 h-7" />
          </button>

          <img
            src={currentTrack.albumArt || FALLBACK_ART}
            alt={currentTrack.title}
            className="w-72 h-72 rounded-3xl shadow-2xl object-cover"
            onError={(e: any) => { e.target.src = FALLBACK_ART; }}
          />

          <div className="text-center w-full">
            <div className="flex items-center justify-between px-2">
              <div className="text-left">
                <h2 className="text-2xl font-bold leading-tight">{currentTrack.title}</h2>
                <p className="text-muted-foreground">{currentTrack.artist}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setLiked(l => !l)} className={liked ? "text-red-500" : "text-muted-foreground"}>
                  <Heart className={`w-6 h-6 ${liked ? "fill-current" : ""}`} />
                </button>
                {currentTrack.fileUrl && (
                  <button onClick={() => downloadTrack(currentTrack)} className="text-muted-foreground hover:text-primary">
                    <Download className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="w-full space-y-1">
            <Slider
              value={[progress]}
              onValueChange={([v]) => seek((v / 100) * trackDur)}
              min={0} max={100} step={0.1}
            />
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(trackDur)}</span>
            </div>
          </div>

          <div className="flex items-center gap-8 w-full justify-center">
            <button onClick={toggleShuffle} className={shuffle ? "text-primary" : "text-muted-foreground"}>
              <Shuffle className="w-5 h-5" />
            </button>
            <button onClick={prev} className="text-foreground">
              <SkipBack className="w-8 h-8" />
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xl"
            >
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
            </button>
            <button onClick={next} className="text-foreground">
              <SkipForward className="w-8 h-8" />
            </button>
            <button onClick={toggleRepeat} className={repeat !== "off" ? "text-primary" : "text-muted-foreground"}>
              {repeat === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full max-w-xs">
            <VolumeX className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              onValueChange={([v]) => setVolume(v / 100)}
              min={0} max={100} step={1}
              className="flex-1"
            />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Persistent bottom player bar */}
      <div className="fixed bottom-[3.5rem] md:bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
        {/* Desktop seek bar sits above the main controls */}
        <div className="hidden md:block px-4 pt-2">
          <Slider
            value={[progress]}
            onValueChange={([v]) => seek((v / 100) * trackDur)}
            min={0} max={100} step={0.1}
            className="h-1 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(trackDur)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 md:px-6 md:py-2">
          {/* Left: album art + info */}
          <button
            className="flex items-center gap-3 flex-1 min-w-0 text-left md:cursor-default"
            onClick={() => setExpanded(e => !e)}
          >
            <img
              src={currentTrack.albumArt || FALLBACK_ART}
              alt={currentTrack.title}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              onError={(e: any) => { e.target.src = FALLBACK_ART; }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
          </button>

          {/* Like (mobile visible) */}
          <button
            onClick={() => setLiked(l => !l)}
            className={`flex-shrink-0 md:hidden ${liked ? "text-red-500" : "text-muted-foreground"}`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          </button>

          {/* Center: transport controls */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button
              onClick={toggleShuffle}
              className={`hidden md:block transition-colors ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={prev} className="hidden md:block text-muted-foreground hover:text-foreground transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md flex-shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button onClick={next} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={toggleRepeat}
              className={`hidden md:block transition-colors ${repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {repeat === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Right: desktop extras */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
            <button
              onClick={() => setLiked(l => !l)}
              className={liked ? "text-red-500" : "text-muted-foreground hover:text-foreground"}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            </button>
            {currentTrack.fileUrl && (
              <button
                onClick={() => downloadTrack(currentTrack)}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Download track"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2 w-28">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                className="text-muted-foreground hover:text-foreground"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <Slider
                value={[volume * 100]}
                onValueChange={([v]) => setVolume(v / 100)}
                min={0} max={100} step={1}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Mobile thin progress bar */}
        <div className="md:hidden h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </>
  );
}
