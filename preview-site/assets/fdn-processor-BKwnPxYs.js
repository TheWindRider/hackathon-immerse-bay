/**
 * Feedback-delay-network reverb, as an AudioWorkletProcessor.
 *
 * The world room, rebuilt so its decay is a number rather than an impulse
 * response. `ConvolverNode` cannot vary RT60, which forced the engine to
 * quantize `size01` into ~0.128 treads and crossfade between whole convolvers;
 * here RT60 is a per-block coefficient with nothing to quantize.
 *
 * Plain .js on purpose: worklets are loaded by URL into a separate global
 * scope, so this file is served as-is rather than going through the app
 * bundle. The coefficient laws live in FdnCoefficients.ts and are unit-tested
 * there; this file is deliberately only ring buffers and butterflies, and the
 * constants below are duplicated from that module because a worklet cannot
 * import from it.
 *
 * Structure per block: input → N delay lines → damping lowpass in each
 * feedback path → orthogonal Hadamard mix → back into the lines. Output is the
 * sum of the line taps, decorrelated left/right by inverting alternate lines.
 */

const FDN_PRIMES = [1123, 1187, 1289, 1381, 1433, 1531, 1613, 1699];
const ORDER = FDN_PRIMES.length;
const REFERENCE_RATE = 48000;

class FdnReverbProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      // k-rate: the tail's own time constant is far longer than a block, so
      // per-sample interpolation of these would cost work nobody can hear.
      { name: 'rt60', defaultValue: 1.2, minValue: 0.05, maxValue: 20, automationRate: 'k-rate' },
      { name: 'damping', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();
    const ratio = sampleRate / REFERENCE_RATE;
    this.lengths = FDN_PRIMES.map((p) => {
      const scaled = Math.max(3, Math.round(p * ratio));
      return scaled % 2 === 0 ? scaled + 1 : scaled;
    });
    this.lines = this.lengths.map((n) => new Float32Array(n));
    this.writeIndex = new Int32Array(ORDER);
    this.lowpassState = new Float32Array(ORDER);
    this.gains = new Float32Array(ORDER);
    this.mixBuf = new Float32Array(ORDER);
    this.hadamardScale = 1 / Math.sqrt(ORDER);
    this.lastRt60 = -1;
    this.lastDamping = -1;
    this.dampingCoef = 0;
    this.alive = true;
    this.port.onmessage = (e) => { if (e.data === 'stop') this.alive = false; };
  }

  updateCoefficients(rt60, damping) {
    if (rt60 !== this.lastRt60) {
      this.lastRt60 = rt60;
      // No compensation for the damping filter, deliberately. Compensating for
      // its white-noise power loss was tried and is wrong in principle: after a
      // few passes the filter has already concentrated the energy at low
      // frequency, where its gain is unity, so the steady-state decay is set by
      // the DC gain and needs no correction. Dividing by the broadband RMS gain
      // over-boosts toward the stability clamp — measured, a 1.5 s room became
      // 10.6 s.
      //
      // So `rt60` is the LOW-FREQUENCY decay, and `damping` shortens the
      // audible broadband tail from there, exactly as a real room does and as
      // every decay-plus-damping reverb behaves.
      for (let i = 0; i < ORDER; i++) {
        const g = Math.pow(10, (-3 * this.lengths[i]) / (rt60 * sampleRate));
        this.gains[i] = Math.min(0.9999, Math.max(0, g));
      }
    }
    if (damping !== this.lastDamping) {
      this.lastDamping = damping;
      this.dampingCoef = this.dampingCoefFor(damping);
    }
  }

  /** Damping control 0-1 -> one-pole feedback coefficient.
   *  Exactly 0 is a bypass at ANY sample rate — a fixed corner cannot express
   *  "off", since 24 kHz is still below Nyquist at 96 kHz. Duplicated from
   *  FdnCoefficients.dampingCutoffHz; change the two together. */
  dampingCoefFor(damping) {
    const d = Math.min(1, Math.max(0, damping));
    if (d === 0) return 0;
    const cutoff = 24000 * Math.pow(900 / 24000, d);
    return cutoff >= sampleRate / 2 ? 0 : Math.min(0.9999,
      Math.max(0, Math.exp((-2 * Math.PI * cutoff) / sampleRate)));
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output || output.length === 0) return this.alive;

    const rt60 = parameters.rt60[0];
    const damping = parameters.damping[0];
    const mix = parameters.mix[0];
    this.updateCoefficients(rt60, damping);

    const frames = output[0].length;
    const inL = input && input[0] ? input[0] : null;
    const inR = input && input[1] ? input[1] : inL;
    const outL = output[0];
    const outR = output.length > 1 ? output[1] : null;
    const a = this.dampingCoef;

    for (let n = 0; n < frames; n++) {
      const dry = ((inL ? inL[n] : 0) + (inR ? inR[n] : 0)) * 0.5;

      // Read one sample from each line and damp it in the feedback path.
      let sumL = 0;
      let sumR = 0;
      for (let i = 0; i < ORDER; i++) {
        const line = this.lines[i];
        const idx = this.writeIndex[i];
        const v = line[idx];
        // One-pole lowpass: highs decay faster than lows, as in any real room.
        const damped = (1 - a) * v + a * this.lowpassState[i];
        this.lowpassState[i] = damped;
        this.mixBuf[i] = damped * this.gains[i];
        // Each output reads a DISJOINT subset of lines (L: even, R: odd),
        // each with balanced ± signs. Disjoint subsets are mutually
        // incoherent — wide without being opposite. The previous alternating
        // scheme made sumR the exact negation of sumL: an out-of-phase blob
        // that cancelled the entire tail to silence on any mono fold-down
        // (phone speaker, single Bluetooth box).
        if (i % 2 === 0) sumL += (i & 2) === 0 ? v : -v;
        else sumR += (i & 2) === 0 ? v : -v;
      }

      // Orthogonal mix — energy preserving, so the decay is governed by the
      // feedback gains alone rather than by the matrix leaking or amplifying.
      hadamard(this.mixBuf);

      for (let i = 0; i < ORDER; i++) {
        const line = this.lines[i];
        const idx = this.writeIndex[i];
        line[idx] = dry + this.mixBuf[i] * this.hadamardScale;
        this.writeIndex[i] = idx + 1 === line.length ? 0 : idx + 1;
      }

      // Each channel now sums ORDER/2 incoherent lines instead of ORDER, so
      // √2 restores the per-channel power the old full-sum outputs carried.
      const norm = (mix / ORDER) * 1.4142135623730951;
      outL[n] = sumL * norm;
      if (outR) outR[n] = sumR * norm;
    }
    return this.alive;
  }
}

function hadamard(buf) {
  const n = buf.length;
  for (let len = 1; len < n; len <<= 1) {
    for (let i = 0; i < n; i += len << 1) {
      for (let j = i; j < i + len; j++) {
        const x = buf[j];
        const y = buf[j + len];
        buf[j] = x + y;
        buf[j + len] = x - y;
      }
    }
  }
}

registerProcessor('satie-fdn-reverb', FdnReverbProcessor);
