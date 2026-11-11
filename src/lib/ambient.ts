/**
 * Ambient sound — a tiny generative drone built with the Web Audio API.
 * No audio files, nothing leaves the device. Off by default.
 */
import type { ModeId } from "./modes";

interface Recipe {
  type: OscillatorType;
  freqs: number[];
  cutoff: number;
  lfoRate: number;
  gain: number;
}

const RECIPES: Record<ModeId, Recipe> = {
  "peter-parker": { type: "sine", freqs: [110, 164.8, 220, 277.2], cutoff: 900, lfoRate: 0.08, gain: 1 },
  "moon-knight": { type: "sine", freqs: [98, 146.8, 196, 293.7], cutoff: 700, lfoRate: 0.05, gain: 1 },
  "red-k": { type: "sawtooth", freqs: [55, 82.4, 110.6, 164.8], cutoff: 420, lfoRate: 0.6, gain: 0.55 },
  "batman-beyond": { type: "square", freqs: [55, 110, 165, 220], cutoff: 360, lfoRate: 0.25, gain: 0.4 },
  "spider-man": { type: "triangle", freqs: [130.8, 196, 261.6, 329.6], cutoff: 1500, lfoRate: 0.15, gain: 0.9 },
  "iron-man": { type: "triangle", freqs: [110, 220, 330, 440], cutoff: 1200, lfoRate: 0.12, gain: 0.9 },
  venom: { type: "sawtooth", freqs: [41.2, 61.7, 82.4, 123.5], cutoff: 240, lfoRate: 0.09, gain: 0.6 },
};

const MASTER = 0.05;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let lfo: OscillatorNode | null = null;
let lfoDepth: GainNode | null = null;
let voices: { osc: OscillatorNode; gain: GainNode }[] = [];
let running = false;

function build() {
  if (ctx) return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.7;
  filter.connect(master);
  master.connect(ctx.destination);
  lfo = ctx.createOscillator();
  lfoDepth = ctx.createGain();
  lfo.connect(lfoDepth);
  lfoDepth.connect(filter.frequency);
  lfo.start();
  voices = [0, 1, 2, 3].map(() => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    gain.gain.value = 0.25;
    osc.connect(gain);
    gain.connect(filter!);
    osc.start();
    return { osc, gain };
  });
}

export function ambientSetMode(modeId: ModeId) {
  if (!ctx || !filter || !lfo || !lfoDepth) return;
  const r = RECIPES[modeId];
  const t = ctx.currentTime;
  voices.forEach((v, i) => {
    v.osc.type = r.type;
    v.osc.frequency.setTargetAtTime(r.freqs[i], t, 1.2);
    v.osc.detune.setTargetAtTime((i - 1.5) * 4, t, 0.5);
    v.gain.gain.setTargetAtTime((0.3 - i * 0.05) * r.gain, t, 1);
  });
  filter.frequency.setTargetAtTime(r.cutoff, t, 1.5);
  lfoDepth.gain.setTargetAtTime(r.cutoff * 0.35, t, 1);
  lfo.frequency.setTargetAtTime(r.lfoRate, t, 1);
}

export function ambientStart(modeId: ModeId) {
  build();
  if (!ctx || !master) return;
  running = true;
  void ctx.resume();
  ambientSetMode(modeId);
  master.gain.setTargetAtTime(MASTER, ctx.currentTime, 1.2);
}

export function ambientStop() {
  running = false;
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  const c = ctx;
  window.setTimeout(() => {
    if (!running && c.state === "running") void c.suspend();
  }, 1600);
}

export function ambientNeedsGesture(): boolean {
  return !ctx || ctx.state !== "running";
}
