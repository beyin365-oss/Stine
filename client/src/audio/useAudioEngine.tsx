import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { engine, EngineState } from "./EnginePipeline";

interface AudioEngineContextValue {
  state: EngineState;
  audioRef: React.RefObject<HTMLAudioElement>;
  initEngine: () => Promise<void>;
  toggleMatrix: (v: boolean) => void;
  setSpatialWidth: (v: number) => void;
  setSaturation: (v: number) => void;
  setTransientExpansion: (v: number) => void;
  setBassBoost: (v: boolean) => void;
  setEQBand: (index: number, gainDb: number) => void;
  resetEQ: () => void;
  getAnalyser: () => AnalyserNode | null;
}

const AudioEngineContext = createContext<AudioEngineContextValue | null>(null);

export function AudioEngineProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null!);
  const [state, setState] = useState<EngineState>(engine.state);

  useEffect(() => {
    const unsub = engine.subscribe(setState);
    return unsub;
  }, []);

  const initEngine = useCallback(async () => {
    if (!audioRef.current) return;
    await engine.resume();
    await engine.initialize(audioRef.current);
  }, []);

  const value: AudioEngineContextValue = {
    state,
    audioRef,
    initEngine,
    toggleMatrix: (v) => engine.toggleMatrix(v),
    setSpatialWidth: (v) => engine.setSpatialWidth(v),
    setSaturation: (v) => engine.setSaturation(v),
    setTransientExpansion: (v) => engine.setTransientExpansion(v),
    setBassBoost: (v) => engine.setBassBoost(v),
    setEQBand: (index, gain) => engine.setEQBand(index, gain),
    resetEQ: () => engine.resetEQ(),
    getAnalyser: () => engine.getAnalyser(),
  };

  return (
    <AudioEngineContext.Provider value={value}>
      {children}
    </AudioEngineContext.Provider>
  );
}

export function useAudioEngine(): AudioEngineContextValue {
  const ctx = useContext(AudioEngineContext);
  if (!ctx) throw new Error("useAudioEngine must be used inside AudioEngineProvider");
  return ctx;
}
