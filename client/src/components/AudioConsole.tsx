import { useEffect, useRef, useState, useCallback } from "react";
import { AudioEngineProvider, useAudioEngine } from "@/audio/useAudioEngine";

/* ── Types ─────────────────────────────────────────────────────────── */
interface Track {
  id: string;
  name: string;
  url: string;
  duration?: string;
}

/* ── Dual-layer Canvas Visualizer ──────────────────────────────────── */
function SpectrumVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getAnalyser } = useAudioEngine();
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d")!;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const analyser = getAnalyser();
      const W = canvas.width;
      const H = canvas.height;
      ctx2d.clearRect(0, 0, W, H);

      // ── Layer 1: FFT Frequency Spectrum ──────────────────────────
      if (analyser) {
        const bufLen = analyser.frequencyBinCount;
        const freqData = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(freqData);

        const barW = (W / bufLen) * 2.5;
        let x = 0;
        for (let i = 0; i < bufLen; i++) {
          const barH = (freqData[i] / 255) * (H * 0.75);
          // Gradient from teal → purple → white
          const ratio = freqData[i] / 255;
          const r = Math.round(0 + ratio * 180);
          const g = Math.round(220 - ratio * 80);
          const b = Math.round(200 + ratio * 55);
          ctx2d.fillStyle = `rgba(${r},${g},${b},0.85)`;
          ctx2d.fillRect(x, H - barH, barW - 1, barH);
          x += barW + 1;
          if (x > W) break;
        }

        // ── Layer 2: Phase Oscilloscope (stereo waveform) ─────────
        const waveData = new Uint8Array(bufLen);
        analyser.getByteTimeDomainData(waveData);

        ctx2d.beginPath();
        ctx2d.strokeStyle = "rgba(0, 255, 180, 0.5)";
        ctx2d.lineWidth = 1.5;
        const sliceW = W / bufLen;
        let ox = 0;
        for (let i = 0; i < bufLen; i++) {
          const v = waveData[i] / 128.0;
          const y = (v * H) / 4 + H * 0.88;
          if (i === 0) ctx2d.moveTo(ox, y);
          else ctx2d.lineTo(ox, y);
          ox += sliceW;
        }
        ctx2d.stroke();
      } else {
        // Idle animation — sine wave
        ctx2d.beginPath();
        ctx2d.strokeStyle = "rgba(0,200,150,0.2)";
        ctx2d.lineWidth = 2;
        const t = Date.now() / 1000;
        for (let x2 = 0; x2 < W; x2++) {
          const y = H / 2 + Math.sin(x2 * 0.04 + t) * 10;
          x2 === 0 ? ctx2d.moveTo(x2, y) : ctx2d.lineTo(x2, y);
        }
        ctx2d.stroke();
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [getAnalyser]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={120}
      className="w-full h-[120px] rounded-lg bg-black/60 border border-emerald-900/40"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

/* ── EQ Band Slider ─────────────────────────────────────────────────── */
function EQSlider({ index, band, onChange }: { index: number; band: { frequency: number; gain: number }; onChange: (i: number, v: number) => void }) {
  const freqLabel = band.frequency >= 1000 ? `${band.frequency / 1000}k` : `${band.frequency}`;
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-[9px] text-emerald-400 font-mono tabular-nums">{band.gain > 0 ? "+" : ""}{band.gain.toFixed(1)}</span>
      <div className="relative h-28 flex items-center justify-center">
        <input
          type="range"
          min={-12} max={12} step={0.5}
          value={band.gain}
          onChange={(e) => onChange(index, parseFloat(e.target.value))}
          className="eq-slider"
          style={{
            writingMode: "vertical-lr" as any,
            direction: "rtl",
            appearance: "slider-vertical",
            WebkitAppearance: "slider-vertical",
            width: 24,
            height: 108,
            cursor: "pointer",
            accentColor: band.gain === 0 ? "#6b7280" : band.gain > 0 ? "#10b981" : "#ef4444",
          }}
        />
      </div>
      <span className="text-[9px] text-gray-500 font-mono">{freqLabel}</span>
    </div>
  );
}

/* ── Rack Knob (styled range input) ────────────────────────────────── */
function RackSlider({ label, value, min = 0, max = 1, step = 0.01, onChange, color = "#10b981" }: {
  label: string; value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void; color?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-gray-400 font-mono uppercase tracking-wider">{label}</span>
        <span className="font-mono" style={{ color }}>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full outline-none cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  );
}

/* ── Main Console Panel ─────────────────────────────────────────────── */
function ConsolePanel({ playlist, currentTrackIdx, onSelect }: {
  playlist: Track[];
  currentTrackIdx: number;
  onSelect: (i: number) => void;
}) {
  const {
    state, audioRef, initEngine,
    toggleMatrix, setSpatialWidth, setSaturation,
    setTransientExpansion, setBassBoost, setEQBand, resetEQ,
  } = useAudioEngine();

  const [volume, setVolume] = useState(0.85);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onDuration = () => setDuration(el.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onDuration);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onDuration);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [audioRef]);

  const handlePlay = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    await initEngine();
    if (el.paused) await el.play().catch(() => {});
    else el.pause();
  }, [audioRef, initEngine]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (el) el.currentTime = parseFloat(e.target.value);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const track = playlist[currentTrackIdx];

  return (
    <div className="flex flex-col gap-4 w-full select-none" style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>

      {/* ── Top rack bar ── */}
      <div className="flex items-center justify-between border-b border-emerald-900/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 tracking-widest uppercase font-bold">STINE Neural HD Audio Engine</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* ── Visualizer ── */}
      <SpectrumVisualizer />

      {/* ── Now playing / transport ── */}
      <div className="bg-black/40 border border-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{track?.name || "No track loaded"}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">HD LOSSLESS · 48kHz · 32-bit float</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${state.matrixEnabled ? "border-emerald-500 text-emerald-400 bg-emerald-900/20" : "border-gray-700 text-gray-600"}`}>
            {state.matrixEnabled ? "⚡ NEURAL HD" : "STANDARD"}
          </span>
        </div>

        {/* Seek bar */}
        <div className="space-y-1">
          <input type="range" min={0} max={duration || 1} step={0.1} value={currentTime}
            onChange={handleSeek} className="w-full h-1 cursor-pointer" style={{ accentColor: "#10b981" }} />
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onSelect(Math.max(0, currentTrackIdx - 1))}
              className="text-gray-400 hover:text-white transition-colors text-sm">⏮</button>
            <button onClick={handlePlay}
              className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white font-bold transition-colors text-base">
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button onClick={() => onSelect(Math.min(playlist.length - 1, currentTrackIdx + 1))}
              className="text-gray-400 hover:text-white transition-colors text-sm">⏭</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600">VOL</span>
            <input type="range" min={0} max={1} step={0.01} value={volume}
              onChange={handleVolume} className="w-20 h-1 cursor-pointer" style={{ accentColor: "#10b981" }} />
            <span className="text-[10px] text-gray-400 w-8 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>

      {/* ── Neural HD Master Toggle ── */}
      <button
        onClick={() => toggleMatrix(!state.matrixEnabled)}
        className={`w-full py-3 rounded-lg border-2 font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
          state.matrixEnabled
            ? "border-emerald-400 bg-emerald-900/30 text-emerald-300 shadow-lg shadow-emerald-900/40"
            : "border-gray-700 bg-gray-900/60 text-gray-500 hover:border-gray-500 hover:text-gray-300"
        }`}
      >
        {state.matrixEnabled ? "⚡ Neural HD Processing — ENGAGED" : "[ Engage Neural HD Processing Matrix ]"}
      </button>

      {/* ── DSP Controls ── */}
      <div className="bg-black/40 border border-gray-800 rounded-lg p-4 space-y-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">DSP Matrix Controls</p>
        <RackSlider label="Spatial Width (M/S)" value={state.spatialWidth} onChange={setSpatialWidth} color="#a78bfa" />
        <RackSlider label="Bass Saturation (tanh)" value={state.saturationDepth} onChange={setSaturation} color="#f59e0b" />
        <RackSlider label="Transient Expansion" value={state.transientExpansion} onChange={setTransientExpansion} color="#60a5fa" />

        <div className="flex items-center justify-between pt-1 border-t border-gray-800">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Sub-Bass Enhancer (80Hz shelf)</span>
          <button
            onClick={() => setBassBoost(!state.bassBoost)}
            className={`text-[10px] px-3 py-1.5 rounded border font-bold transition-all ${
              state.bassBoost ? "border-amber-500 text-amber-400 bg-amber-900/20" : "border-gray-700 text-gray-600 hover:border-gray-500"
            }`}
          >
            {state.bassBoost ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* ── 15-band Parametric EQ ── */}
      <div className="bg-black/40 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">15-Band Parametric EQ</p>
          <button onClick={resetEQ} className="text-[10px] text-gray-600 hover:text-gray-400 border border-gray-800 hover:border-gray-600 px-2 py-0.5 rounded transition-colors">
            FLAT
          </button>
        </div>
        <div className="flex gap-1">
          {state.eqBands.map((band, i) => (
            <EQSlider key={i} index={i} band={band} onChange={setEQBand} />
          ))}
        </div>
        {/* 0dB reference line label */}
        <div className="text-center mt-1">
          <span className="text-[9px] text-gray-700">─── 0dB ───</span>
        </div>
      </div>
    </div>
  );
}

/* ── Library / Playlist Panel ──────────────────────────────────────── */
function LibraryPanel({ playlist, currentTrackIdx, onSelect, onAdd }: {
  playlist: Track[];
  currentTrackIdx: number;
  onSelect: (i: number) => void;
  onAdd: (tracks: Track[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const tracks: Track[] = files
      .filter(f => /\.(wav|flac|mp3|aac|ogg|m4a|alac)$/i.test(f.name))
      .map(f => ({
        id: `local_${Date.now()}_${Math.random()}`,
        name: f.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(f),
      }));
    onAdd(tracks);
    e.target.value = "";
  };

  const handleURL = () => {
    if (!urlInput.trim()) return;
    onAdd([{ id: `url_${Date.now()}`, name: urlInput.split("/").pop() || "Remote Track", url: urlInput.trim() }]);
    setUrlInput("");
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Track Library</p>

      {/* Load buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-2 text-xs border border-emerald-800 text-emerald-500 hover:bg-emerald-900/20 rounded transition-colors"
        >
          + Load Files
        </button>
        <input ref={fileInputRef} type="file" accept=".wav,.flac,.mp3,.aac,.ogg,.m4a,.alac" multiple className="hidden" onChange={handleFiles} />
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Paste audio URL (wav, flac, mp3…)"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleURL()}
          className="flex-1 bg-black/40 border border-gray-800 text-xs text-gray-300 px-2 py-1.5 rounded outline-none focus:border-emerald-700 placeholder-gray-700"
        />
        <button onClick={handleURL} className="px-3 py-1.5 text-xs border border-gray-700 text-gray-400 hover:text-white rounded transition-colors">
          Add
        </button>
      </div>

      {/* Supported formats */}
      <p className="text-[9px] text-gray-700">WAV · FLAC · ALAC · MP3 · AAC · OGG — all formats fed through Neural HD pipeline</p>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto space-y-1 max-h-[340px]">
        {playlist.length === 0 ? (
          <div className="text-center py-12 text-gray-700">
            <p className="text-sm">No tracks loaded</p>
            <p className="text-xs mt-1">Load local files or paste URLs above</p>
          </div>
        ) : (
          playlist.map((t, i) => (
            <button
              key={t.id}
              onClick={() => onSelect(i)}
              className={`w-full text-left px-3 py-2 rounded text-xs transition-all ${
                i === currentTrackIdx
                  ? "bg-emerald-900/30 border border-emerald-700/50 text-emerald-300"
                  : "hover:bg-gray-800/60 border border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-center text-gray-600 shrink-0">
                  {i === currentTrackIdx ? <span className="text-emerald-400">▶</span> : (i + 1)}
                </span>
                <span className="truncate">{t.name}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Root AudioConsole ─────────────────────────────────────────────── */
export default function AudioConsole() {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const { audioRef } = useAudioEngine();

  const selectTrack = useCallback((i: number) => {
    if (i < 0 || i >= playlist.length) return;
    setCurrentTrackIdx(i);
    const el = audioRef.current;
    if (!el) return;
    const wasPlaying = !el.paused;
    el.src = playlist[i].url;
    el.load();
    if (wasPlaying) el.play().catch(() => {});
  }, [playlist, audioRef]);

  useEffect(() => {
    if (playlist.length > 0 && audioRef.current) {
      audioRef.current.src = playlist[currentTrackIdx]?.url || "";
    }
  }, [playlist, currentTrackIdx, audioRef]);

  const addTracks = (tracks: Track[]) => {
    setPlaylist(prev => {
      const next = [...prev, ...tracks];
      if (prev.length === 0 && tracks.length > 0 && audioRef.current) {
        audioRef.current.src = tracks[0].url;
      }
      return next;
    });
  };

  return (
    <AudioEngineProvider>
      {/* Hidden audio element — feeds the engine */}
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" style={{ display: "none" }} />

      <div
        className="min-h-screen w-full p-4 md:p-6"
        style={{
          background: "linear-gradient(135deg, #050a08 0%, #060d0a 40%, #040808 100%)",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        }}
      >
        {/* Rack frame */}
        <div
          className="max-w-5xl mx-auto rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #111915 0%, #0d1610 100%)",
            border: "1px solid #1a2e1f",
            boxShadow: "0 0 60px rgba(16,185,129,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Rack header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-emerald-950/60"
            style={{ background: "linear-gradient(90deg, #0a1f12 0%, #0d2016 100%)" }}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1 h-4 rounded-full bg-emerald-500/30" style={{ opacity: 0.3 + i * 0.2 }} />
                ))}
              </div>
              <span className="text-emerald-400 text-xs font-bold tracking-[0.2em] uppercase">STINE · Neural HD Workstation v2.0</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-600">
              <span>48kHz</span>
              <span className="w-px h-3 bg-gray-800" />
              <span>32-bit float</span>
              <span className="w-px h-3 bg-gray-800" />
              <span>Web Audio API</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Main console — left 2/3 */}
            <div className="lg:col-span-2 p-5 border-r border-emerald-950/40">
              <ConsolePanel
                playlist={playlist}
                currentTrackIdx={currentTrackIdx}
                onSelect={selectTrack}
              />
            </div>

            {/* Library — right 1/3 */}
            <div className="p-5" style={{ background: "rgba(0,0,0,0.2)" }}>
              <LibraryPanel
                playlist={playlist}
                currentTrackIdx={currentTrackIdx}
                onSelect={selectTrack}
                onAdd={addTracks}
              />
            </div>
          </div>

          {/* Rack footer */}
          <div className="flex items-center justify-center gap-6 px-6 py-2 border-t border-emerald-950/40 text-[9px] text-gray-700"
            style={{ background: "rgba(0,0,0,0.3)" }}>
            <span>Neural HD DSP · AudioWorklet Thread</span>
            <span>·</span>
            <span>Hermite Interpolation · M/S Spatializer · tanh Saturation</span>
            <span>·</span>
            <span>15-Band EQ · Dynamic Range Expander</span>
          </div>
        </div>
      </div>
    </AudioEngineProvider>
  );
}
