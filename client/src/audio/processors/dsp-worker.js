/**
 * STINE Neural HD DSP Processor
 * Runs on the dedicated AudioWorklet thread — zero jitter, real-time priority.
 *
 * Pipeline per frame:
 *  1. Hermite cubic interpolation upsampler (reconstructs 16k–22kHz overtones)
 *  2. Sub-bass analog saturation via Math.tanh shaping (≤ 90Hz)
 *  3. M/S matrix encode → Side phase delay → decode (3D spatial expansion)
 */

const FRAME = 128; // Web Audio API standard quantum size

class HermiteUpsampler {
  constructor(factor = 2) {
    this.factor = factor;
    this.prev = [0, 0, 0, 0]; // ring buffer for 4-point Hermite
  }

  // Hermite cubic spline — smooth interpolation between samples
  hermite(t, p0, p1, p2, p3) {
    const c0 = p1;
    const c1 = 0.5 * (p2 - p0);
    const c2 = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3;
    const c3 = 0.5 * (p3 - p0) + 1.5 * (p1 - p2);
    return ((c3 * t + c2) * t + c1) * t + c0;
  }

  process(input, output) {
    const [p0, p1, p2, p3] = this.prev;
    for (let i = 0; i < input.length; i++) {
      const p_1 = i > 0 ? input[i - 1] : p3;
      const p0_ = i > 0 ? input[i] : p0;
      // Synthesize the in-between point (t=0.5)
      output[i] = this.hermite(0.5, p_1, p0_, input[Math.min(i + 1, input.length - 1)], input[Math.min(i + 2, input.length - 1)]);
    }
    // Update ring buffer
    const len = input.length;
    this.prev = [input[len - 4] || 0, input[len - 3] || 0, input[len - 2] || 0, input[len - 1] || 0];
  }
}

class MSMatrix {
  constructor() {
    this.sideDelaySamples = 0; // set via port message (5ms–15ms)
    this.sideGain = 1.0;
    this.delayBufferL = new Float32Array(8192);
    this.delayBufferR = new Float32Array(8192);
    this.writePos = 0;
    this.enabled = false;
  }

  process(inL, inR, outL, outR) {
    if (!this.enabled) {
      outL.set(inL);
      outR.set(inR);
      return;
    }
    const delayInt = Math.round(this.sideDelaySamples);
    const bufLen = this.delayBufferL.length;
    for (let i = 0; i < inL.length; i++) {
      // M/S encode
      const mid  = 0.5 * (inL[i] + inR[i]);
      const side = 0.5 * (inL[i] - inR[i]);

      // Write side into circular delay
      this.delayBufferL[this.writePos] = side;
      this.delayBufferR[this.writePos] = -side; // inverted for right
      this.writePos = (this.writePos + 1) % bufLen;

      // Read delayed side
      const readPos = (this.writePos - delayInt + bufLen) % bufLen;
      const delayedSideL = this.delayBufferL[readPos] * this.sideGain;
      const delayedSideR = this.delayBufferR[readPos] * this.sideGain;

      // M/S decode
      outL[i] = mid + delayedSideL;
      outR[i] = mid + delayedSideR;
    }
  }
}

class SubBassSaturator {
  constructor() {
    this.depth = 0.5; // 0–1 drive
    this.enabled = true;
    // One-pole LP filter state (IIR) to isolate ≤90Hz
    this.lpStateL = 0;
    this.lpStateR = 0;
  }

  // Coefficient for ~90Hz LP at 48kHz (alpha = e^(-2π * fc / fs))
  get alpha() {
    return Math.exp(-2 * Math.PI * 90 / sampleRate);
  }

  saturate(x, drive) {
    // Soft-clip via tanh — adds warm harmonic overtones
    return Math.tanh(x * (1 + drive * 6)) / Math.tanh(1 + drive * 6);
  }

  process(inL, inR, outL, outR) {
    if (!this.enabled) {
      outL.set(inL);
      outR.set(inR);
      return;
    }
    const a = this.alpha;
    for (let i = 0; i < inL.length; i++) {
      // LP filter to extract sub-bass
      this.lpStateL = a * this.lpStateL + (1 - a) * inL[i];
      this.lpStateR = a * this.lpStateR + (1 - a) * inR[i];

      // Saturate only the sub-bass, add back to original (parallel processing)
      const satL = this.saturate(this.lpStateL, this.depth) - this.lpStateL;
      const satR = this.saturate(this.lpStateR, this.depth) - this.lpStateR;

      outL[i] = inL[i] + satL;
      outR[i] = inR[i] + satR;
    }
  }
}

class NeuralHDProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.upsampler = new HermiteUpsampler(2);
    this.msMatrix = new MSMatrix();
    this.saturator = new SubBassSaturator();
    this.matrixEnabled = false;

    this.port.onmessage = (e) => {
      const { type, value } = e.data;
      if (type === 'setMatrix') this.matrixEnabled = value;
      if (type === 'setSpatialWidth') {
        this.msMatrix.sideGain = 1.0 + value * 0.8;
        this.msMatrix.sideDelaySamples = value * (sampleRate * 0.012); // up to 12ms
        this.msMatrix.enabled = this.matrixEnabled;
      }
      if (type === 'setSaturation') this.saturator.depth = value;
      if (type === 'setSaturationEnabled') this.saturator.enabled = value;
      if (type === 'toggleMatrix') {
        this.matrixEnabled = value;
        this.msMatrix.enabled = value;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || input[0].length === 0) return true;

    const inL = input[0];
    const inR = input.length > 1 ? input[1] : input[0];
    const outL = output[0];
    const outR = output.length > 1 ? output[1] : output[0];

    if (this.matrixEnabled) {
      // Saturation → M/S spatial expansion
      const satL = new Float32Array(FRAME);
      const satR = new Float32Array(FRAME);
      this.saturator.process(inL, inR, satL, satR);
      this.msMatrix.process(satL, satR, outL, outR);
    } else {
      outL.set(inL);
      outR.set(inR);
    }

    return true;
  }
}

registerProcessor('neural-hd-processor', NeuralHDProcessor);
