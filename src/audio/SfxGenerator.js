import { SFX_PRESETS } from './sfx-presets.js';

const SAMPLE_RATE = 44100;

let _context = null;
const _buffers = new Map();

function getContext() {
  if (!_context) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _context = new Ctx();
  }
  return _context;
}

function env(t, attack, decay, duration) {
  if (t < attack) return t / attack;
  const d = duration - attack;
  if (d <= 0) return 1;
  const rel = (t - attack) / d;
  if (rel > 1) return 0;
  return 1 - rel * (1 - decay);
}

function renderPreset(preset) {
  const duration = preset.duration ?? 0.1;
  const length = Math.ceil(SAMPLE_RATE * duration);
  const data = new Float32Array(length);

  switch (preset.kind) {
    case 'sweep': {
      const {
        freqStart,
        freqEnd,
        wave = 'square',
        volume = 0.3,
        attack = 0.002,
        decay = 0.85
      } = preset;
      let phase = 0;
      for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        const p = i / length;
        const eased = p * p;
        const freq = freqStart + (freqEnd - freqStart) * eased;
        phase += (2 * Math.PI * freq) / SAMPLE_RATE;
        const w =
          wave === 'sine' ? Math.sin(phase) : Math.sign(Math.sin(phase)) * 0.55;
        data[i] = w * env(t, attack, decay, duration) * volume;
      }
      break;
    }
    case 'noiseBurst': {
      const {
        filterFreq = 2000,
        filterQ = 0.7,
        thumpFreq = 80,
        thumpGain = 0.4,
        volume = 0.4
      } = preset;
      let noiseState = 0;
      let lp = 0;
      const rc = 1 / (2 * Math.PI * filterFreq);
      const dt = 1 / SAMPLE_RATE;
      const alpha = dt / (rc + dt);
      let thumpPhase = 0;
      for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        const white = Math.random() * 2 - 1;
        noiseState = white;
        lp += alpha * (noiseState - lp);
        const band = lp * (1 + filterQ);
        thumpPhase += (2 * Math.PI * thumpFreq) / SAMPLE_RATE;
        const thump = Math.sin(thumpPhase) * thumpGain * Math.exp(-t * 18);
        const e = env(t, 0.003, 0.7, duration);
        data[i] = (band * 0.55 + thump) * e * volume;
      }
      break;
    }
    case 'resonantBurst': {
      const {
        resonanceFreq = 200,
        noiseGain = 0.5,
        decay = 0.1,
        volume = 0.4
      } = preset;
      let phase = 0;
      for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        phase += (2 * Math.PI * resonanceFreq) / SAMPLE_RATE;
        const body = Math.sin(phase) * Math.exp(-t / decay);
        const noise = (Math.random() * 2 - 1) * noiseGain * Math.exp(-t * 22);
        const e = env(t, 0.004, 0.75, duration);
        data[i] = (body * 0.6 + noise) * e * volume;
      }
      break;
    }
    case 'fallingBoom': {
      const {
        freqStart = 200,
        freqEnd = 60,
        noiseGain = 0.6,
        subFreq = 45,
        volume = 0.5
      } = preset;
      let phase = 0;
      let subPhase = 0;
      for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        const p = i / length;
        const freq = freqStart + (freqEnd - freqStart) * p * p;
        phase += (2 * Math.PI * freq) / SAMPLE_RATE;
        subPhase += (2 * Math.PI * subFreq) / SAMPLE_RATE;
        const tone = Math.sin(phase) * 0.5 + Math.sin(subPhase) * 0.35;
        const noise = (Math.random() * 2 - 1) * noiseGain * Math.exp(-t * 8);
        const e = env(t, 0.006, 0.55, duration);
        data[i] = (tone + noise) * e * volume;
      }
      break;
    }
    case 'impact': {
      const { freq = 80, noiseGain = 0.7, volume = 0.6 } = preset;
      let phase = 0;
      for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        phase += (2 * Math.PI * freq) / SAMPLE_RATE;
        const thump = Math.sin(phase) * Math.exp(-t * 14);
        const noise = (Math.random() * 2 - 1) * noiseGain * Math.exp(-t * 16);
        const e = env(t, 0.002, 0.65, duration);
        data[i] = (thump * 0.7 + noise * 0.55) * e * volume;
      }
      break;
    }
    case 'arpeggio': {
      const { notes = [440, 554, 659], wave = 'sine', volume = 0.3 } = preset;
      const noteLen = duration / notes.length;
      for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        const noteIdx = Math.min(notes.length - 1, Math.floor(t / noteLen));
        const freq = notes[noteIdx];
        const localT = t - noteIdx * noteLen;
        const phase = (2 * Math.PI * freq * localT) % (Math.PI * 2);
        const w = wave === 'sine' ? Math.sin(phase) : Math.sign(Math.sin(phase)) * 0.6;
        const noteEnv = env(localT, 0.003, 0.8, noteLen);
        data[i] = w * noteEnv * volume;
      }
      break;
    }
    default:
      break;
  }

  return data;
}

export class SfxGenerator {
  static getContext() {
    return getContext();
  }

  static async resume() {
    const ctx = getContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx.state === 'running';
  }

  static bakeAll() {
    const ctx = getContext();
    if (!ctx) return;
    for (const [name, preset] of Object.entries(SFX_PRESETS)) {
      if (_buffers.has(name)) continue;
      const samples = renderPreset(preset);
      const buffer = ctx.createBuffer(1, samples.length, SAMPLE_RATE);
      buffer.copyToChannel(samples, 0);
      _buffers.set(name, buffer);
    }
  }

  static play(name, opts = {}) {
    const ctx = getContext();
    if (!ctx || ctx.state !== 'running') return;

    const buffer = _buffers.get(name);
    if (!buffer) return;

    const masterVol = opts.masterVolume ?? 1;
    const vol = (opts.volume ?? 1) * masterVol;
    const detune = opts.detune ?? 0;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.detune.value = detune;

    const gain = ctx.createGain();
    gain.gain.value = vol;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  }

  static playAt(name, delaySec, opts = {}) {
    const ctx = getContext();
    if (!ctx || ctx.state !== 'running') return;

    const buffer = _buffers.get(name);
    if (!buffer) return;

    const masterVol = opts.masterVolume ?? 1;
    const vol = (opts.volume ?? 1) * masterVol;
    const detune = opts.detune ?? 0;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.detune.value = detune;

    const gain = ctx.createGain();
    gain.gain.value = vol;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime + delaySec);
  }

  static randomDetune(cents = 30) {
    return (Math.random() * 2 - 1) * cents;
  }

  static isRunning() {
    const ctx = getContext();
    return ctx?.state === 'running';
  }
}
