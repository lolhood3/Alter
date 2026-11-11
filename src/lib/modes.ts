/**
 * Core Identity System — centralized configuration for the seven ALTER modes.
 * One shared renderer, seven configurations.
 */
export const MODE_IDS = [
  "peter-parker",
  "moon-knight",
  "red-k",
  "batman-beyond",
  "spider-man",
  "iron-man",
  "venom",
] as const;

export type ModeId = (typeof MODE_IDS)[number];

export type ParticleKind = "dust" | "motes" | "embers" | "data" | "orbs" | "sparks" | "ooze";

/** Parameters consumed by the Living Core renderer. */
export interface CoreLook {
  colA: string;
  colB: string;
  colHot: string;
  colRim: string;
  body: string;
  bodyAlpha: number;
  deform: number;
  freq: number;
  speed: number;
  ridge: number;
  elastic: number;
  vein: number;
  veinSharp: number;
  flow: number;
  fresnel: number;
  gloss: number;
  spec: number;
  bands: number;
  struct: number;
  irid: number;
  inner: number;
  glow: number;
}

export interface EnvLight {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  a: number;
}

export interface ModeConfig {
  id: ModeId;
  name: string;
  cardLine: string;
  tagline: string;
  territory: string;
  identity: string;
  headline: [string, string, string];
  accent: string;
  accent2: string;
  bg0: string;
  bg1: string;
  look: CoreLook;
  env: {
    lighting: string;
    atmosphere: string;
    lights: EnvLight[];
    particle: { kind: ParticleKind; count: number; color: string; description: string };
  };
  motion: { personality: string };
  voice: { style: string; messages: string[]; replies: string[] };
}

export const MODES: Record<ModeId, ModeConfig> = {
  "peter-parker": {
    id: "peter-parker",
    name: "Peter Parker",
    cardLine: "Vulnerable, human, overwhelmed",
    tagline: "A little room to breathe.",
    territory: "Vulnerability, exhaustion, sadness, loneliness, overwhelm and humanity.",
    identity:
      "The quietest, most human of the seven. Muted warmth and gentle light for the days that ask too much — nothing to fix, nothing to perform.",
    headline: ["A space that moves with ", "you", "."],
    accent: "#e0566a",
    accent2: "#b48ae6",
    bg0: "#0b0509",
    bg1: "#140710",
    look: {
      colA: "#c4455c", colB: "#8a68c4", colHot: "#ff8e7e", colRim: "#f6cdbd",
      body: "#1a0a12", bodyAlpha: 0.3,
      deform: 0.27, freq: 0.85, speed: 0.55, ridge: 0.1, elastic: 0,
      vein: 0.9, veinSharp: 1, flow: 1, fresnel: 2.2, gloss: 40, spec: 0.35,
      bands: 0, struct: 0, irid: 1, inner: 0.85, glow: 1,
    },
    env: {
      lighting: "Low, warm light from the upper left",
      atmosphere: "Soft rose haze with gentle depth",
      lights: [
        { x: 10, y: 6, w: 60, h: 48, c: "#c4455c", a: 0.3 },
        { x: 52, y: 55, w: 52, h: 52, c: "#6b4a9e", a: 0.22 },
        { x: 94, y: 96, w: 42, h: 38, c: "#d98a5e", a: 0.14 },
      ],
      particle: { kind: "dust", count: 34, color: "#f4c4b4", description: "Slow warm dust, drifting upward" },
    },
    motion: { personality: "Restrained and unhurried" },
    voice: {
      style: "Gentle, understanding, human and reassuring",
      messages: [
        "You don’t have to figure everything out right now.",
        "Tired counts as a real reason to slow down.",
        "Whatever today was, you got through it. That’s enough.",
        "You can put some of it down here. I’ll hold the light.",
        "It’s okay to be someone who needs a minute.",
        "Nothing is required of you in this room.",
      ],
      replies: [
        "I hear that. Thank you for putting it here.",
        "That sounds heavy. You don’t have to carry it perfectly.",
        "Okay. We can just stay with it for a moment.",
        "Noted, gently. Take as long as you need.",
        "You said it out loud. That counts for something.",
      ],
    },
  },
  "moon-knight": {
    id: "moon-knight",
    name: "Moon Knight",
    cardLine: "Introspective, isolated, reflective",
    tagline: "Quiet is also a place.",
    territory: "Introspection, isolation, restlessness, reflection and internal conflict.",
    identity:
      "Moonlit silver over deep charcoal. A nocturnal, slow-moving environment for turning thoughts over and letting them settle.",
    headline: ["Quiet is also ", "a place", "."],
    accent: "#a9a6f2",
    accent2: "#dfe4f2",
    bg0: "#06060d",
    bg1: "#0b0a18",
    look: {
      colA: "#6a63b8", colB: "#cdd3ea", colHot: "#eef0ff", colRim: "#b9b0ff",
      body: "#0b0b1a", bodyAlpha: 0.34,
      deform: 0.15, freq: 0.85, speed: 0.3, ridge: 0, elastic: 0,
      vein: 0.6, veinSharp: 1.1, flow: 0.7, fresnel: 2.0, gloss: 70, spec: 0.55,
      bands: 0, struct: 0, irid: 1.3, inner: 0.7, glow: 0.92,
    },
    env: {
      lighting: "Cool moonlight falling from above",
      atmosphere: "Nocturnal charcoal with lavender mist",
      lights: [
        { x: 66, y: 0, w: 50, h: 55, c: "#c9cfee", a: 0.14 },
        { x: 20, y: 50, w: 55, h: 55, c: "#4a4390", a: 0.3 },
        { x: 90, y: 90, w: 45, h: 40, c: "#6a63b8", a: 0.18 },
      ],
      particle: { kind: "motes", count: 42, color: "#d8dcf5", description: "Fine silver motes, falling slowly" },
    },
    motion: { personality: "Slow, tidal and contemplative" },
    voice: {
      style: "Quiet, reflective and contemplative",
      messages: [
        "Some thoughts only make sense in the dark. Let them.",
        "You don’t need to resolve it tonight.",
        "Stillness isn’t absence. It’s another kind of attention.",
        "Which part of you is speaking loudest right now?",
        "The night is long enough for all of it.",
        "Sit with it. It will move when it’s ready.",
      ],
      replies: [
        "Mm. Let that echo for a while.",
        "There may be more beneath that. No hurry.",
        "I’ll keep the quiet with you.",
        "Held. Nothing needs answering yet.",
        "Strange how saying it changes its shape.",
      ],
    },
  },
  "red-k": {
    id: "red-k",
    name: "RED-K",
    cardLine: "Fearless, volatile, raw",
    tagline: "Say it. Then let it burn down.",
    territory: "Fearlessness, anger, hurt, impulsivity, volatility and raw intensity.",
    identity:
      "Inspired by red kryptonite. Hard crimson light, sharp contrast and an unstable core — a place to feel the heat fully without aiming it at anyone.",
    headline: ["Feel it all. ", "Keep it safe", "."],
    accent: "#ff2e44",
    accent2: "#ff9a6b",
    bg0: "#0d0204",
    bg1: "#1a0307",
    look: {
      colA: "#b0001c", colB: "#ff3a2e", colHot: "#ff9a7a", colRim: "#ff3047",
      body: "#1a0306", bodyAlpha: 0.5,
      deform: 0.22, freq: 1.1, speed: 1.1, ridge: 0.6, elastic: 0,
      vein: 0.95, veinSharp: 1, flow: 1.6, fresnel: 3.0, gloss: 30, spec: 0.3,
      bands: 0, struct: 0, irid: 0.2, inner: 1.25, glow: 1.15,
    },
    env: {
      lighting: "Hard crimson from below, deep black above",
      atmosphere: "Heat shimmer and volatile contrast",
      lights: [
        { x: 50, y: 108, w: 90, h: 55, c: "#d1001f", a: 0.4 },
        { x: 6, y: 10, w: 40, h: 40, c: "#8d0017", a: 0.3 },
        { x: 96, y: 22, w: 36, h: 36, c: "#ff3a2e", a: 0.14 },
      ],
      particle: { kind: "embers", count: 38, color: "#ff6a4a", description: "Flickering embers, rising fast" },
    },
    motion: { personality: "Sharp, volatile, high-contrast" },
    voice: {
      style: "Direct, intense and unfiltered — without glorifying harm",
      messages: [
        "Anger is information. You decide what it turns into.",
        "Say the unedited version. Nobody but you is reading it.",
        "That fire is yours. Aim it at the problem, not the people.",
        "Hurt wears loud clothes sometimes. I see it anyway.",
        "Move it, shout it, write it — then let it burn down.",
        "You don’t have to be calm. You just have to stay safe.",
      ],
      replies: [
        "Good. Get it out of your chest and into the room.",
        "Straight, no polish. I’ve got it.",
        "That’s a lot of heat. It’s allowed to be here.",
        "Understood. Now breathe out slowly. Then we go on.",
        "Raw is fine. Just keep it from hurting anyone, you included.",
      ],
    },
  },
  "batman-beyond": {
    id: "batman-beyond",
    name: "Batman Beyond",
    cardLine: "Disciplined, focused, strategic",
    tagline: "One clear step. Then the next.",
    territory: "Discipline, focus, determination, strategy and ambition.",
    identity:
      "Futuristic black with precise crimson lines. Structured detail and controlled light for when you know what you’re doing and need the room to agree.",
    headline: ["One clear step. ", "Then the next", "."],
    accent: "#ff2f4d",
    accent2: "#8590a8",
    bg0: "#040406",
    bg1: "#0a0a10",
    look: {
      colA: "#0e0e18", colB: "#5c1024", colHot: "#ff2f4d", colRim: "#ff5068",
      body: "#05050a", bodyAlpha: 0.86,
      deform: 0.13, freq: 1.1, speed: 0.5, ridge: 0.15, elastic: 0,
      vein: 0.85, veinSharp: 1.7, flow: 1, fresnel: 2.8, gloss: 80, spec: 0.6,
      bands: 26, struct: 0.9, irid: 0, inner: 0.85, glow: 0.82,
    },
    env: {
      lighting: "Controlled edge-light, crimson on black",
      atmosphere: "Clean dark depth with thin precise lines",
      lights: [
        { x: 85, y: 4, w: 42, h: 40, c: "#ff2f4d", a: 0.16 },
        { x: 14, y: 70, w: 50, h: 48, c: "#2a2d44", a: 0.4 },
        { x: 50, y: 50, w: 40, h: 40, c: "#5c1024", a: 0.2 },
      ],
      particle: { kind: "data", count: 26, color: "#ff5068", description: "Fine data lines tracking in straight lanes" },
    },
    motion: { personality: "Precise, measured, structured" },
    voice: {
      style: "Focused, strategic and concise",
      messages: [
        "Define the next step. Only the next one.",
        "Cut what doesn’t serve the objective.",
        "Discipline is a decision you repeat.",
        "What’s the smallest move that changes the position?",
        "Plan briefly. Execute fully. Review honestly.",
        "Rest is part of the strategy.",
      ],
      replies: [
        "Logged. What’s the first action?",
        "Understood. Prioritize one thing.",
        "Clear. Now sequence it.",
        "Noted. Remove one obstacle today.",
        "Good. Keep it small, keep it moving.",
      ],
    },
  },
  "spider-man": {
    id: "spider-man",
    name: "Spider-Man",
    cardLine: "Playful, excited, spontaneous",
    tagline: "Go on, swing a little.",
    territory: "Happiness, excitement, playfulness, spontaneity and positive energy.",
    identity:
      "Expressive red and blue in brighter light. Lively, slightly elastic movement for the moments you feel good and want the room to bounce with you.",
    headline: ["Go on, ", "swing a little", "."],
    accent: "#ff3b55",
    accent2: "#4a86ff",
    bg0: "#09070f",
    bg1: "#120a1c",
    look: {
      colA: "#e8213a", colB: "#3068f2", colHot: "#ffe0e6", colRim: "#7fb2ff",
      body: "#0e0816", bodyAlpha: 0.18,
      deform: 0.23, freq: 1.0, speed: 0.95, ridge: 0, elastic: 1,
      vein: 0.95, veinSharp: 1, flow: 1.3, fresnel: 2.0, gloss: 50, spec: 0.5,
      bands: 0, struct: 0, irid: 1.2, inner: 1.1, glow: 1.2,
    },
    env: {
      lighting: "Bright, high-key red and blue",
      atmosphere: "Open, buoyant and slightly electric",
      lights: [
        { x: 12, y: 18, w: 52, h: 50, c: "#e8213a", a: 0.3 },
        { x: 88, y: 70, w: 55, h: 52, c: "#3068f2", a: 0.3 },
        { x: 50, y: 50, w: 40, h: 40, c: "#8b4fd6", a: 0.16 },
      ],
      particle: { kind: "orbs", count: 28, color: "#9cc2ff", description: "Bouncy bubbles floating up" },
    },
    motion: { personality: "Lively with gentle elastic bounce" },
    voice: {
      style: "Playful, expressive, energetic and humorous",
      messages: [
        "Okay, that’s a good mood. Let’s not waste it!",
        "Quick, do one slightly ridiculous thing today.",
        "Gravity is mostly a suggestion in here.",
        "Your good news deserves a little show.",
        "What’s the fun version of this plan?",
        "I’m bouncing. Is that weird? I’m keeping it.",
      ],
      replies: [
        "Ha! Love that. Tell me more!",
        "Okay okay, I’m into it.",
        "That is delightful. Please continue.",
        "Noted — with sparkle.",
        "Yes! Now do the fun part first.",
      ],
    },
  },
  "iron-man": {
    id: "iron-man",
    name: "Iron Man",
    cardLine: "Inspired, curious, innovative",
    tagline: "What if we built it?",
    territory: "Inspiration, curiosity, creativity, innovation and motivation.",
    identity:
      "Metallic gold and warm amber with technical detail. A workshop-bright space for making things and following ideas to see where they go.",
    headline: ["What if we ", "built it", "?"],
    accent: "#f0b44a",
    accent2: "#ff8a2a",
    bg0: "#0a0705",
    bg1: "#150d06",
    look: {
      colA: "#c68418", colB: "#ff7a1a", colHot: "#fff0b8", colRim: "#ffd27a",
      body: "#150c04", bodyAlpha: 0.42,
      deform: 0.12, freq: 0.9, speed: 0.5, ridge: 0, elastic: 0,
      vein: 0.75, veinSharp: 1.5, flow: 0.9, fresnel: 2.4, gloss: 90, spec: 0.75,
      bands: 20, struct: 1, irid: 0.3, inner: 1.15, glow: 1.0,
    },
    env: {
      lighting: "Warm workshop amber with metallic highlights",
      atmosphere: "Technical, warm and precise",
      lights: [
        { x: 18, y: 92, w: 55, h: 45, c: "#ff7a1a", a: 0.24 },
        { x: 78, y: 12, w: 50, h: 45, c: "#c68418", a: 0.26 },
        { x: 50, y: 52, w: 40, h: 40, c: "#8a5410", a: 0.2 },
      ],
      particle: { kind: "sparks", count: 30, color: "#ffd27a", description: "Small gold sparks on clean arcs" },
    },
    motion: { personality: "Precise, bright and inventive" },
    voice: {
      style: "Inventive, curious and encouraging",
      messages: [
        "Interesting. What happens if you change just one variable?",
        "Sketch it badly first. Polish comes later.",
        "Every prototype is a good question.",
        "You’re one weird idea away from something real.",
        "Build the smallest version that could work.",
        "Curiosity is a fine engine. Keep it running.",
      ],
      replies: [
        "Now that’s a thread worth pulling.",
        "Ooh. Prototype it before lunch.",
        "Good. What would version two do differently?",
        "Logged in the workshop. Keep going.",
        "I like where your head’s at. Test it.",
      ],
    },
  },
  venom: {
    id: "venom",
    name: "Venom",
    cardLine: "Primal, restless, intense",
    tagline: "All of it, all at once.",
    territory: "Primal intensity, overstimulation, restlessness, sensory amplification and raw energy.",
    identity:
      "Deep black, glossy and alive. Strange organic deformation and amplified sensation — raw energy given somewhere to move.",
    headline: ["All of it, ", "all at once", "."],
    accent: "#cdb9ff",
    accent2: "#6c40d8",
    bg0: "#030206",
    bg1: "#09050f",
    look: {
      colA: "#150e22", colB: "#3a2275", colHot: "#c9b8ff", colRim: "#a894e8",
      body: "#04030a", bodyAlpha: 0.94,
      deform: 0.37, freq: 1.05, speed: 0.62, ridge: 0.35, elastic: 0,
      vein: 0.3, veinSharp: 1.3, flow: 0.9, fresnel: 3.4, gloss: 100, spec: 1.0,
      bands: 0, struct: 0, irid: 0.3, inner: 0.4, glow: 0.5,
    },
    env: {
      lighting: "Almost no light — only wet highlights",
      atmosphere: "Dense black with slow violet undertow",
      lights: [
        { x: 50, y: 100, w: 80, h: 50, c: "#3a1f78", a: 0.34 },
        { x: 10, y: 20, w: 40, h: 42, c: "#26164a", a: 0.34 },
        { x: 92, y: 40, w: 36, h: 40, c: "#6c40d8", a: 0.12 },
      ],
      particle: { kind: "ooze", count: 20, color: "#7b52e0", description: "Slow dark violet blobs, swirling" },
    },
    motion: { personality: "Heavy, flowing and unpredictable" },
    voice: {
      style: "Raw, intense and instinctive",
      messages: [
        "Too much. Good. Let it all come through.",
        "Feel everything at full volume. Then find the dial.",
        "Restless is just energy without a door. Let’s find a door.",
        "Loud inside? Same. Move your body.",
        "We are a lot. We are allowed to be a lot.",
        "Crawl out of your skin a little. Then come back.",
      ],
      replies: [
        "Yes. Raw. Keep going.",
        "Mm. Heavy. I’m with you.",
        "Louder, if you need to. Then slower.",
        "Felt that. Channel it somewhere.",
        "Instinct first. Thinking later.",
      ],
    },
  },
};

export const MODE_LIST: ModeConfig[] = MODE_IDS.map((id) => MODES[id]);

export function isModeId(v: string): v is ModeId {
  return (MODE_IDS as readonly string[]).includes(v);
}

/** Resolve user input (id, name, or short alias) to a mode id. */
export function resolveMode(input: string): ModeId | null {
  const q = input.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (!q) return null;
  if (isModeId(q)) return q;
  const aliases: Record<string, ModeId> = {
    peter: "peter-parker",
    parker: "peter-parker",
    moon: "moon-knight",
    knight: "moon-knight",
    redk: "red-k",
    "red-kryptonite": "red-k",
    batman: "batman-beyond",
    beyond: "batman-beyond",
    spider: "spider-man",
    spiderman: "spider-man",
    iron: "iron-man",
    ironman: "iron-man",
    "1": "peter-parker",
    "2": "moon-knight",
    "3": "red-k",
    "4": "batman-beyond",
    "5": "spider-man",
    "6": "iron-man",
    "7": "venom",
  };
  return aliases[q] ?? null;
}
