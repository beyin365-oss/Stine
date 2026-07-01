/**
 * STINE Neural HD Audio Engine Pipeline
 * Decoupled from React — expose control methods via singleton.
 *
 * Signal chain:
 *  HTMLAudioElement
 *    → MediaElementSourceNode
 *    → AudioWorkletNode (Neural HD: saturation + M/S spatializer)
 *    → WaveShaperNode   (Stage A: analog warmth on sub-bass)
 *    → BiquadFilterNode × 15 (Stage B: parametric EQ)
 *    → DynamicsCompressorNode (Stage C: dynamic range)
 *    → ChannelSplitterNode → [L delay / R delay] → ChannelMergerNode (Stage D: stereo width)
 *    → AnalyserNode (FFT + oscilloscope data)
 *    → AudioContext.destination
 */

export interface EQBand {
  frequency: number;
  gain: number;       // dB, -12 to +12
  type: BiquadFilterType;
  Q: number;
}

export interface EngineState {
  matrixEnabled: boolean;
  spatialWidth: number;   // 0–1
  saturationDepth: number; // 0–1
  transientExpansion: number; // 0–1 (compressor knee)
  bassBoost: boolean;
  eqBands: EQBand[];
  isInitialized: boolean;
}

const DEFAULT_EQ_BANDS: EQBand[] = [
  { frequency: 20,    gain: 0, type: 'lowshelf',  Q: 0.7 },
  { frequency: 40,    gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 80,    gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 160,   gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 315,   gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 630,   gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 1250,  gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 2500,  gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 5000,  gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 10000, gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 12500, gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 14000, gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 16000, gain: 0, type: 'peaking',   Q: 1.4 },
  { frequency: 18000, gain: 0, type: 'peaking',   Q: 1.0 },
  { frequency: 20000, gain: 0, type: 'highshelf', Q: 0.7 },
];

// Build Math.tanh soft-clip waveshaper curve
function buildTanhCurve(amount = 200): Float32Array {
  const samples = 4096;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (2 * i) / (samples - 1) - 1;
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  return curve;
}

// Subtle curve — only colors sub-bass harmonics gently
function buildMildSaturationCurve(): Float32Array {
  const samples = 4096;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (2 * i) / (samples - 1) - 1;
    // Soft knee — barely clips loud transients, adds 2nd-order harmonics
    curve[i] = (3 * x * (1 - (x * x) / 3)) / 2;
  }
  return curve;
}

export class AudioEnginePipeline {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private waveshaperNode: WaveShaperNode | null = null;
  private eqNodes: BiquadFilterNode[] = [];
  private compressorNode: DynamicsCompressorNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  private delayL: DelayNode | null = null;
  private delayR: DelayNode | null = null;
  private gainL: GainNode | null = null;
  private gainR: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private bassShelfNode: BiquadFilterNode | null = null;

  private _state: EngineState = {
    matrixEnabled: false,
    spatialWidth: 0.3,
    saturationDepth: 0.2,
    transientExpansion: 0.5,
    bassBoost: false,
    eqBands: DEFAULT_EQ_BANDS.map(b => ({ ...b })),
    isInitialized: false,
  };

  private listeners: Array<(state: EngineState) => void> = [];
  private connectedElement: HTMLAudioElement | null = null;
  private workletReady = false;

  get state(): EngineState {
    return { ...this._state, eqBands: this._state.eqBands.map(b => ({ ...b })) };
  }

  subscribe(fn: (state: EngineState) => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private emit() {
    const s = this.state;
    this.listeners.forEach(fn => fn(s));
  }

  async initialize(audioElement: HTMLAudioElement): Promise<void> {
    if (this.connectedElement === audioElement && this._state.isInitialized) return;

    // Resume or create AudioContext
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 48000,
        latencyHint: 'playback',
      });
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Tear down existing graph if reconnecting
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch {}
    }

    this.sourceNode = this.ctx.createMediaElementSource(audioElement);
    this.connectedElement = audioElement;

    // ── Stage A: Analog Warmth (WaveShaper sub-bass colouring) ─────────
    this.waveshaperNode = this.ctx.createWaveShaper();
    this.waveshaperNode.curve = buildMildSaturationCurve();
    this.waveshaperNode.oversample = '4x';

    // ── Stage B: 15-band Parametric EQ ─────────────────────────────────
    this.eqNodes = this._state.eqBands.map(band => {
      const node = this.ctx!.createBiquadFilter();
      node.type = band.type;
      node.frequency.value = band.frequency;
      node.gain.value = band.gain;
      node.Q.value = band.Q;
      return node;
    });

    // Sub-bass shelf for bass boost
    this.bassShelfNode = this.ctx.createBiquadFilter();
    this.bassShelfNode.type = 'lowshelf';
    this.bassShelfNode.frequency.value = 80;
    this.bassShelfNode.gain.value = 0;

    // ── Stage C: Dynamic Range Compressor ──────────────────────────────
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = -24;
    this.compressorNode.knee.value = 12 + this._state.transientExpansion * 18;
    this.compressorNode.ratio.value = 4;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.25;

    // ── Stage D: 3D Holographic Stereo Width ───────────────────────────
    this.splitterNode = this.ctx.createChannelSplitter(2);
    this.mergerNode = this.ctx.createChannelMerger(2);
    this.delayL = this.ctx.createDelay(0.1);
    this.delayR = this.ctx.createDelay(0.1);
    this.gainL = this.ctx.createGain();
    this.gainR = this.ctx.createGain();

    const delay = this._state.spatialWidth * 0.01;
    this.delayL.delayTime.value = 0;
    this.delayR.delayTime.value = delay;
    this.gainL.gain.value = 1;
    this.gainR.gain.value = 1 + this._state.spatialWidth * 0.3;

    // ── AnalyserNode ────────────────────────────────────────────────────
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.82;

    // ── Wire the graph ──────────────────────────────────────────────────
    // Try to load AudioWorklet
    try {
      await this.ctx.audioWorklet.addModule('/audio/processors/dsp-worker.js');
      this.workletNode = new AudioWorkletNode(this.ctx, 'neural-hd-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      this.workletReady = true;
    } catch {
      this.workletNode = null;
      this.workletReady = false;
    }

    // Chain: source → [worklet?] → waveShaper → EQ chain → bass shelf → compressor → splitter → delays → merger → analyser → destination
    let last: AudioNode = this.sourceNode;

    if (this.workletNode) {
      last.connect(this.workletNode);
      last = this.workletNode;
    }

    last.connect(this.waveshaperNode);
    last = this.waveshaperNode;

    // Chain all EQ nodes
    for (const eq of this.eqNodes) {
      last.connect(eq);
      last = eq;
    }

    last.connect(this.bassShelfNode);
    last = this.bassShelfNode;

    last.connect(this.compressorNode);
    last = this.compressorNode;

    // Stereo splitter → delay L/R → merge → analyser → output
    last.connect(this.splitterNode);
    this.splitterNode.connect(this.delayL, 0);
    this.splitterNode.connect(this.delayR, 1);
    this.delayL.connect(this.gainL);
    this.delayR.connect(this.gainR);
    this.gainL.connect(this.mergerNode, 0, 0);
    this.gainR.connect(this.mergerNode, 0, 1);
    this.mergerNode.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);

    this._state.isInitialized = true;
    this.emit();
  }

  // ── Worklet messages ──────────────────────────────────────────────────

  private postWorklet(type: string, value: unknown) {
    if (this.workletNode && this.workletReady) {
      this.workletNode.port.postMessage({ type, value });
    }
  }

  // ── Public control API ────────────────────────────────────────────────

  toggleMatrix(enabled: boolean) {
    this._state.matrixEnabled = enabled;
    this.postWorklet('toggleMatrix', enabled);
    if (enabled) {
      this.postWorklet('setSpatialWidth', this._state.spatialWidth);
      this.postWorklet('setSaturation', this._state.saturationDepth);
    }
    this.emit();
  }

  setSpatialWidth(value: number) {
    this._state.spatialWidth = value;
    const delay = value * 0.01;
    if (this.delayR) this.delayR.delayTime.setTargetAtTime(delay, this.ctx!.currentTime, 0.01);
    if (this.gainR) this.gainR.gain.setTargetAtTime(1 + value * 0.3, this.ctx!.currentTime, 0.01);
    this.postWorklet('setSpatialWidth', value);
    this.emit();
  }

  setSaturation(value: number) {
    this._state.saturationDepth = value;
    this.postWorklet('setSaturation', value);
    const drive = 1 + value * 2;
    if (this.waveshaperNode) {
      this.waveshaperNode.curve = buildTanhCurve(drive * 50);
    }
    this.emit();
  }

  setTransientExpansion(value: number) {
    this._state.transientExpansion = value;
    if (this.compressorNode && this.ctx) {
      // Higher value = softer knee = more transient punch preserved
      this.compressorNode.knee.setTargetAtTime(6 + value * 24, this.ctx.currentTime, 0.05);
      this.compressorNode.ratio.setTargetAtTime(8 - value * 5, this.ctx.currentTime, 0.05);
    }
    this.emit();
  }

  setBassBoost(enabled: boolean) {
    this._state.bassBoost = enabled;
    if (this.bassShelfNode && this.ctx) {
      this.bassShelfNode.gain.setTargetAtTime(enabled ? 8 : 0, this.ctx.currentTime, 0.05);
    }
    this.emit();
  }

  setEQBand(index: number, gainDb: number) {
    if (!this.eqNodes[index] || !this.ctx) return;
    this._state.eqBands[index].gain = gainDb;
    this.eqNodes[index].gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.02);
    this.emit();
  }

  resetEQ() {
    this._state.eqBands.forEach((_, i) => this.setEQBand(i, 0));
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }

  async resume() {
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  destroy() {
    try { this.sourceNode?.disconnect(); } catch {}
    try { this.ctx?.close(); } catch {}
    this.ctx = null;
    this.sourceNode = null;
    this._state.isInitialized = false;
    this.emit();
  }
}

// Singleton — survives React re-renders
export const engine = new AudioEnginePipeline();
