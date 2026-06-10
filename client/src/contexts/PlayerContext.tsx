import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

export interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  albumArt?: string;
  fileUrl?: string | null;
  genre?: string;
  bpm?: number;
}

interface PlayerContextValue {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  playTrack: (track: PlayerTrack, newQueue?: PlayerTrack[]) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (tracks: PlayerTrack[]) => void;
  downloadTrack: (track: PlayerTrack) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<PlayerTrack[]>([]);
  const queueIndexRef = useRef(0);
  const shuffleRef = useRef(false);
  const repeatRef = useRef<"off" | "one" | "all">("off");

  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [queue, setQueueState] = useState<PlayerTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off");

  const loadTrackAtIndex = useCallback((idx: number) => {
    const q = queueRef.current;
    if (idx < 0 || idx >= q.length) return;
    const track = q[idx];
    queueIndexRef.current = idx;
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(0);
    const audio = audioRef.current;
    if (!audio) return;
    if (track.fileUrl) {
      audio.src = track.fileUrl;
      audio.load();
      audio.play().catch(() => {});
    } else {
      audio.src = "";
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = 0.8;
    audio.preload = "auto";
    audioRef.current = audio;

    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.ondurationchange = () => setDuration(isNaN(audio.duration) ? 0 : audio.duration);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.onended = () => {
      if (repeatRef.current === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      const q = queueRef.current;
      let nextIdx = shuffleRef.current
        ? Math.floor(Math.random() * q.length)
        : queueIndexRef.current + 1;
      if (nextIdx >= q.length) {
        if (repeatRef.current === "all") nextIdx = 0;
        else return;
      }
      loadTrackAtIndex(nextIdx);
    };

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [loadTrackAtIndex]);

  const playTrack = useCallback(
    (track: PlayerTrack, newQueue?: PlayerTrack[]) => {
      const q = newQueue ?? [track];
      const idx = q.findIndex((t) => t.id === track.id);
      queueRef.current = q;
      setQueueState(q);
      loadTrackAtIndex(idx >= 0 ? idx : 0);
    },
    [loadTrackAtIndex]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (audio.src) audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const next = useCallback(() => {
    const q = queueRef.current;
    let nextIdx = shuffleRef.current
      ? Math.floor(Math.random() * q.length)
      : queueIndexRef.current + 1;
    if (nextIdx >= q.length) nextIdx = repeatRef.current === "all" ? 0 : q.length - 1;
    loadTrackAtIndex(nextIdx);
  }, [loadTrackAtIndex]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    loadTrackAtIndex(Math.max(0, queueIndexRef.current - 1));
  }, [loadTrackAtIndex]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => { shuffleRef.current = !s; return !s; });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat((r) => {
      const next = r === "off" ? "all" : r === "all" ? "one" : "off";
      repeatRef.current = next;
      return next;
    });
  }, []);

  const addToQueue = useCallback((tracks: PlayerTrack[]) => {
    setQueueState((prev) => {
      const next = [...prev, ...tracks];
      queueRef.current = next;
      return next;
    });
  }, []);

  const downloadTrack = useCallback((track: PlayerTrack) => {
    if (!track.fileUrl) return;
    const a = document.createElement("a");
    a.href = track.fileUrl;
    a.download = `${track.artist} - ${track.title}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack, queue, isPlaying, volume, currentTime, duration,
        shuffle, repeat, playTrack, togglePlay, next, prev, seek,
        setVolume, toggleShuffle, toggleRepeat, addToQueue, downloadTrack,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
