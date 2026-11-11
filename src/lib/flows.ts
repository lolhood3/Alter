import { MODES, type ModeId } from "./modes";

export type EnvSource = "manual" | "match" | "shift" | "restore" | "recent";

/** An environment: a mode plus how it is presented. */
export interface Environment {
  id: string;
  name: string;
  modeId: ModeId;
  summary: string;
  motionScale: number;
  source: EnvSource;
}

export function defaultEnvironment(modeId: ModeId): Environment {
  const m = MODES[modeId];
  return {
    id: `default-${modeId}`,
    name: m.name,
    modeId,
    summary: m.tagline,
    motionScale: 1,
    source: "manual",
  };
}

/* ------------------------------ MATCH ------------------------------ */

export const MOODS = [
  "Drained",
  "Lonely",
  "Restless",
  "Reflective",
  "Angry",
  "Driven",
  "Joyful",
  "Curious",
  "Overstimulated",
] as const;
export type Mood = (typeof MOODS)[number];

export const ENERGIES = ["Very low", "Low", "Steady", "High", "Very high"] as const;
export type Energy = (typeof ENERGIES)[number];

const ENERGY_SCALE: Record<Energy, number> = {
  "Very low": 0.55,
  Low: 0.75,
  Steady: 1,
  High: 1.2,
  "Very high": 1.4,
};

interface MoodRule {
  modeId: ModeId;
  name: string;
  summary: string;
  highAlt?: { modeId: ModeId; name: string; summary: string };
}

const MOOD_RULES: Record<Mood, MoodRule> = {
  Drained: { modeId: "peter-parker", name: "Room to breathe", summary: "Low warm light, restrained movement, nothing asked of you." },
  Lonely: { modeId: "peter-parker", name: "Someone’s here", summary: "Gentle warmth and a Core that stays close without crowding you." },
  Restless: {
    modeId: "moon-knight",
    name: "Pacing in moonlight",
    summary: "Slow silver light that gives restlessness room without feeding it.",
    highAlt: { modeId: "venom", name: "Restless current", summary: "Heavy, flowing motion that lets high restless energy move through." },
  },
  Reflective: { modeId: "moon-knight", name: "Still water", summary: "Cool, quiet and slow — a place to turn thoughts over." },
  Angry: { modeId: "red-k", name: "Safe burn", summary: "Hard crimson light where the heat can be felt fully and kept contained." },
  Driven: { modeId: "batman-beyond", name: "Clear channel", summary: "Precise lines and controlled light that stay out of your way." },
  Joyful: { modeId: "spider-man", name: "Open sky", summary: "Bright, buoyant and a little elastic — room for the good mood." },
  Curious: { modeId: "iron-man", name: "Workshop light", summary: "Warm amber and technical detail for following ideas." },
  Overstimulated: {
    modeId: "moon-knight",
    name: "Dimmed room",
    summary: "Fewer details, cooler light and slow motion to lower the volume.",
    highAlt: { modeId: "venom", name: "Static, given a shape", summary: "Heavy dark motion that gives overload somewhere to go." },
  },
};

export interface MatchInput {
  mood: Mood | null;
  energy: Energy | null;
  note: string;
}

export interface MatchProposal {
  env: Environment;
  reason: string;
  neutral: boolean;
}

export function proposeFromCheckin(input: MatchInput, currentMode: ModeId): MatchProposal {
  const scale = input.energy ? ENERGY_SCALE[input.energy] : 1;
  const highEnergy = input.energy === "High" || input.energy === "Very high";

  if (!input.mood) {
    const cur = MODES[currentMode];
    return {
      neutral: !input.energy,
      reason: input.energy
        ? `You shared ${input.energy.toLowerCase()} energy, so only the pace of ${cur.name} is adjusted.`
        : "You chose not to share anything, so nothing needs to change.",
      env: {
        id: `match-stay-${currentMode}-${scale}`,
        name: input.energy ? `${cur.name}, tuned` : cur.name,
        modeId: currentMode,
        summary: input.energy ? `Same environment, paced for ${input.energy.toLowerCase()} energy.` : "Staying exactly where you are.",
        motionScale: scale,
        source: "match",
      },
    };
  }

  const rule = MOOD_RULES[input.mood];
  const pick = highEnergy && rule.highAlt ? rule.highAlt : rule;
  return {
    neutral: false,
    reason: `Because you chose ${input.mood}${input.energy ? ` at ${input.energy.toLowerCase()} energy` : ""}. This is a suggestion from a fixed table — not an analysis.`,
    env: {
      id: `match-${input.mood}-${pick.modeId}`,
      name: pick.name,
      modeId: pick.modeId,
      summary: pick.summary,
      motionScale: scale,
      source: "match",
    },
  };
}

/* ------------------------------ SHIFT ------------------------------ */

export const DIRECTION_IDS = ["soften", "withdraw", "release", "focus", "play", "create", "amplify"] as const;
export type DirectionId = (typeof DIRECTION_IDS)[number];

export interface Direction {
  id: DirectionId;
  label: string;
  description: string;
  coreBehavior: string;
  env: Omit<Environment, "id" | "source">;
}

export const DIRECTIONS: Record<DirectionId, Direction> = {
  soften: {
    id: "soften",
    label: "Soften",
    description: "Lower the light and loosen the edges.",
    coreBehavior: "The Core slows, warms and rounds out.",
    env: { name: "Soft landing", modeId: "peter-parker", summary: "Warm, low light with restrained movement.", motionScale: 0.7 },
  },
  withdraw: {
    id: "withdraw",
    label: "Withdraw",
    description: "Step back into quiet and solitude.",
    coreBehavior: "The Core drifts slowly in cool, silver light.",
    env: { name: "Moonlit retreat", modeId: "moon-knight", summary: "Nocturnal calm with slow, tidal movement.", motionScale: 0.65 },
  },
  release: {
    id: "release",
    label: "Release",
    description: "Let intensity out somewhere safe.",
    coreBehavior: "The Core flares with sharper, hotter movement.",
    env: { name: "Safe burn", modeId: "red-k", summary: "Crimson heat and hard contrast — contained.", motionScale: 1.2 },
  },
  focus: {
    id: "focus",
    label: "Focus",
    description: "Narrow the field and sharpen the lines.",
    coreBehavior: "The Core tightens into precise, structured light.",
    env: { name: "Clear channel", modeId: "batman-beyond", summary: "Black glass, thin crimson lines, steady pace.", motionScale: 0.9 },
  },
  play: {
    id: "play",
    label: "Play",
    description: "Make it lighter and a little silly.",
    coreBehavior: "The Core bounces with bright, elastic motion.",
    env: { name: "Open sky", modeId: "spider-man", summary: "Bright red and blue with buoyant movement.", motionScale: 1.15 },
  },
  create: {
    id: "create",
    label: "Create",
    description: "Warm the room for making things.",
    coreBehavior: "The Core glows amber with technical detail.",
    env: { name: "Workshop light", modeId: "iron-man", summary: "Gold and amber with fine mechanical lines.", motionScale: 1 },
  },
  amplify: {
    id: "amplify",
    label: "Amplify",
    description: "Turn everything up and feel it fully.",
    coreBehavior: "The Core deforms heavily with glossy, raw motion.",
    env: { name: "Full volume", modeId: "venom", summary: "Dense black, wet highlights, large deformation.", motionScale: 1.3 },
  },
};

export const DIRECTION_LIST = DIRECTION_IDS.map((id) => DIRECTIONS[id]);

export function directionEnvironment(id: DirectionId): Environment {
  return { ...DIRECTIONS[id].env, id: `shift-${id}`, source: "shift" };
}

export function motionLabel(scale: number): "Calm" | "Steady" | "Lively" {
  if (scale < 0.85) return "Calm";
  if (scale > 1.1) return "Lively";
  return "Steady";
}
export const MOTION_SCALES = { Calm: 0.7, Steady: 1, Lively: 1.3 } as const;
