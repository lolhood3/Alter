/**
 * Core State System — the eight operational states of the Living Core.
 * States are only ever changed by application logic (see store.ts).
 */
export const CORE_STATE_IDS = [
  "dormant",
  "attentive",
  "listening",
  "interpreting",
  "suggesting",
  "transitioning",
  "active",
  "reflecting",
] as const;

export type CoreStateId = (typeof CORE_STATE_IDS)[number];

/** Rendering modifiers — multiplied with the active mode's look. */
export interface StateModifiers {
  speed: number;
  deform: number;
  vein: number;
  flow: number;
  inner: number;
  glow: number;
  scale: number;
  pulse: number; // outward pulse ring strength
  breathAmp: number;
  breathRate: number;
  spin: number;
}

export interface CoreStateConfig {
  id: CoreStateId;
  label: string;
  behavior: string;
  description: string;
  tagline: string;
  mod: StateModifiers;
}

export const CORE_STATES: Record<CoreStateId, CoreStateConfig> = {
  dormant: {
    id: "dormant",
    label: "Dormant",
    behavior: "Minimal breathing and ambient movement",
    description: "Resting. The Core has gone quiet after a while without interaction.",
    tagline: "Resting, nearby.",
    mod: { speed: 0.35, deform: 0.6, vein: 0.5, flow: 0.5, inner: 0.5, glow: 0.6, scale: 0.9, pulse: 0, breathAmp: 0.015, breathRate: 0.8, spin: 0.4 },
  },
  attentive: {
    id: "attentive",
    label: "Attentive",
    behavior: "Gentle expansion and subtle response",
    description: "Awake and aware of you. It leans toward your cursor, nothing more.",
    tagline: "Here with you.",
    mod: { speed: 0.65, deform: 1, vein: 0.9, flow: 0.9, inner: 0.9, glow: 0.9, scale: 1, pulse: 0, breathAmp: 0.025, breathRate: 1.1, spin: 1 },
  },
  listening: {
    id: "listening",
    label: "Listening",
    behavior: "Concentrated visual activity",
    description: "Gathering in. MATCH is open and the Core is making room for whatever you choose to share.",
    tagline: "Take your time.",
    mod: { speed: 0.95, deform: 0.75, vein: 1.45, flow: 1.3, inner: 1.3, glow: 1.05, scale: 0.96, pulse: 0, breathAmp: 0.02, breathRate: 1.6, spin: 0.8 },
  },
  interpreting: {
    id: "interpreting",
    label: "Interpreting",
    behavior: "Controlled internal energy movement",
    description: "Turning what you shared into a proposed environment. Nothing is applied yet.",
    tagline: "Finding a shape for this.",
    mod: { speed: 1.25, deform: 0.9, vein: 1.5, flow: 2.4, inner: 1.5, glow: 1.1, scale: 0.98, pulse: 0, breathAmp: 0.012, breathRate: 2.4, spin: 2 },
  },
  suggesting: {
    id: "suggesting",
    label: "Suggesting",
    behavior: "Soft outward pulses",
    description: "Offering an environment. It is only a preview until you confirm it.",
    tagline: "Something like this?",
    mod: { speed: 0.8, deform: 1, vein: 1.1, flow: 1, inner: 1.1, glow: 1.2, scale: 1.02, pulse: 1, breathAmp: 0.03, breathRate: 1.4, spin: 1 },
  },
  transitioning: {
    id: "transitioning",
    label: "Transitioning",
    behavior: "Environmental transformation",
    description: "The environment is changing. Lighting, atmosphere and motion are all moving together.",
    tagline: "Changing the light.",
    mod: { speed: 2, deform: 1.6, vein: 1.6, flow: 2.2, inner: 1.6, glow: 1.5, scale: 1.07, pulse: 0.6, breathAmp: 0.03, breathRate: 3, spin: 3 },
  },
  active: {
    id: "active",
    label: "Active",
    behavior: "Responsive ambient behavior",
    description: "Settled into the current environment and responding to what you do.",
    tagline: "Settled in.",
    mod: { speed: 0.85, deform: 1.05, vein: 1.05, flow: 1.1, inner: 1.05, glow: 1.05, scale: 1.01, pulse: 0, breathAmp: 0.028, breathRate: 1.2, spin: 1.1 },
  },
  reflecting: {
    id: "reflecting",
    label: "Reflecting",
    behavior: "Slower, calmer visual movement",
    description: "Slow and calm. A space for looking back or simply being here.",
    tagline: "Slow and calm.",
    mod: { speed: 0.32, deform: 0.75, vein: 0.8, flow: 0.55, inner: 0.85, glow: 0.9, scale: 1, pulse: 0, breathAmp: 0.03, breathRate: 0.6, spin: 0.5 },
  },
};

export const CORE_STATE_LIST = CORE_STATE_IDS.map((id) => CORE_STATES[id]);
