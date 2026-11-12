"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MODES, type ModeId } from "./modes";
import type { CoreStateId } from "./coreStates";
import { defaultEnvironment, type Environment } from "./flows";
import { clamp, newId } from "./util";

/* ------------------------------ Types ------------------------------ */

export type TransitionStyle = "reduced" | "standard" | "immersive";

export interface Settings {
  /** null = follow the system preference */
  reducedMotion: boolean | null;
  coreIntensity: number;
  particleIntensity: number;
  ambientSound: boolean;
  compactComm: boolean;
  transitionStyle: TransitionStyle;
  recordEchoes: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  reducedMotion: null,
  coreIntensity: 60,
  particleIntensity: 50,
  ambientSound: false,
  compactComm: false,
  transitionStyle: "standard",
  recordEchoes: true,
};

export type EchoType = "environment" | "shift" | "checkin" | "direction" | "message";

export interface EchoEvent {
  id: string;
  ts: number;
  type: EchoType;
  title: string;
  detail?: string;
  modeId: ModeId;
  fromModeId?: ModeId;
  meta?: Record<string, string>;
}

export interface ThreadMsg {
  id: string;
  from: "you" | "core";
  text: string;
  ts: number;
  modeId: ModeId;
}

export interface PreviewEnv {
  modeId: ModeId;
  motionScale: number;
  label?: string;
}

export interface TransitionInfo {
  key: number;
  style: TransitionStyle;
  env: Environment;
  committed: boolean;
  commitMs: number;
  endMs: number;
}

export type DialogId = "reality" | "comm" | null;
export type DrawerId = "context" | "menu" | null;

interface AlterState {
  hydrated: boolean;
  modeId: ModeId;
  env: Environment;
  settings: Settings;
  events: EchoEvent[];

  // transient
  coreState: CoreStateId;
  route: string;
  sessionActive: boolean;
  sessionEntered: number;
  previewEnv: PreviewEnv | null;
  proposal: Environment | null;
  transition: TransitionInfo | null;
  messageSeed: number;
  coreLine: string | null;
  thread: ThreadMsg[];
  uiHidden: boolean;
  systemReduced: boolean;
  dialog: DialogId;
  drawer: DrawerId;

  // actions
  setRoute: (route: string) => void;
  setCore: (s: CoreStateId) => void;
  flashCore: (s: CoreStateId, ms: number) => void;
  settle: () => void;
  setSystemReduced: (v: boolean) => void;
  setPreview: (p: PreviewEnv | null) => void;
  setProposal: (e: Environment | null) => void;
  setUiHidden: (v: boolean) => void;
  openDialog: (d: DialogId) => void;
  openDrawer: (d: DrawerId) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  enterMode: (id: ModeId) => void;
  applyEnvironment: (env: Environment) => void;
  skipTransition: () => void;
  record: (ev: Omit<EchoEvent, "id" | "ts" | "modeId"> & { modeId?: ModeId }) => void;
  nextLine: () => void;
  sendMessage: (text: string) => void;
  clearHistory: () => void;
  resetPreferences: () => void;
  resetDemo: () => void;
}

/* ------------------------------ Helpers ------------------------------ */

export function baselineState(route: string, sessionActive: boolean): CoreStateId {
  if (route.startsWith("/match")) return "listening";
  if (route.startsWith("/dreamscape") || route.startsWith("/timeline")) return "reflecting";
  if (route.startsWith("/shift")) return "attentive";
  return sessionActive ? "active" : "attentive";
}

const TRANSITION_TIMING: Record<TransitionStyle, { commit: number; end: number }> = {
  reduced: { commit: 180, end: 420 },
  standard: { commit: 560, end: 1200 },
  immersive: { commit: 1050, end: 2300 },
};

let shiftTimers: number[] = [];
let settleTimer: number | undefined;
let replyTimer: number | undefined;

function clearShiftTimers() {
  shiftTimers.forEach((t) => window.clearTimeout(t));
  shiftTimers = [];
}

export function isReduced(s: Pick<AlterState, "settings" | "systemReduced">) {
  return s.settings.reducedMotion ?? s.systemReduced;
}

const MAX_EVENTS = 500;
const ENV_SOURCES = new Set(["manual", "match", "shift", "restore", "recent"]);
const ECHO_TYPES = new Set(["environment", "shift", "checkin", "direction", "message"]);
const TRANSITION_STYLES = new Set(["reduced", "standard", "immersive"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isModeId(value: unknown): value is ModeId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MODES, value);
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeEnvironment(value: unknown, modeId: ModeId): Environment | null {
  if (!isRecord(value) || value.modeId !== modeId) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.summary !== "string" ||
    typeof value.source !== "string" ||
    !ENV_SOURCES.has(value.source)
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    modeId,
    summary: value.summary,
    motionScale: finiteNumber(value.motionScale, 1, 0, 2),
    source: value.source as Environment["source"],
  };
}

function sanitizeEvent(value: unknown): EchoEvent | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.ts !== "number" ||
    !Number.isFinite(value.ts) ||
    Math.abs(value.ts) > 8.64e15 ||
    typeof value.type !== "string" ||
    !ECHO_TYPES.has(value.type) ||
    typeof value.title !== "string" ||
    !isModeId(value.modeId)
  ) {
    return null;
  }

  const event: EchoEvent = {
    id: value.id,
    ts: value.ts,
    type: value.type as EchoType,
    title: value.title,
    modeId: value.modeId,
  };
  if (typeof value.detail === "string") event.detail = value.detail;
  if (isModeId(value.fromModeId)) event.fromModeId = value.fromModeId;
  if (isRecord(value.meta)) {
    const entries = Object.entries(value.meta).filter((entry): entry is [string, string] => typeof entry[1] === "string");
    if (entries.length) event.meta = Object.fromEntries(entries);
  }
  return event;
}

type PersistedCoreState = Pick<AlterState, "modeId" | "env" | "settings" | "events">;

/** Treat localStorage as untrusted input: retain valid data and fall back field by field. */
export function sanitizePersistedState(persisted: unknown, current: PersistedCoreState): PersistedCoreState {
  const p = isRecord(persisted) ? persisted : {};
  const modeId = isModeId(p.modeId) ? p.modeId : current.modeId;
  const settings = isRecord(p.settings) ? p.settings : {};
  const events: EchoEvent[] = [];
  const ids = new Set<string>();
  if (Array.isArray(p.events)) {
    for (const value of p.events.slice(0, MAX_EVENTS)) {
      const event = sanitizeEvent(value);
      if (!event || ids.has(event.id)) continue;
      ids.add(event.id);
      events.push(event);
    }
  }

  return {
    modeId,
    env: sanitizeEnvironment(p.env, modeId) ?? defaultEnvironment(modeId),
    settings: {
      reducedMotion: settings.reducedMotion === null || typeof settings.reducedMotion === "boolean"
        ? settings.reducedMotion
        : DEFAULT_SETTINGS.reducedMotion,
      coreIntensity: finiteNumber(settings.coreIntensity, DEFAULT_SETTINGS.coreIntensity, 0, 100),
      particleIntensity: finiteNumber(settings.particleIntensity, DEFAULT_SETTINGS.particleIntensity, 0, 100),
      ambientSound: booleanValue(settings.ambientSound, DEFAULT_SETTINGS.ambientSound),
      compactComm: booleanValue(settings.compactComm, DEFAULT_SETTINGS.compactComm),
      transitionStyle: typeof settings.transitionStyle === "string" && TRANSITION_STYLES.has(settings.transitionStyle)
        ? settings.transitionStyle as TransitionStyle
        : DEFAULT_SETTINGS.transitionStyle,
      recordEchoes: booleanValue(settings.recordEchoes, DEFAULT_SETTINGS.recordEchoes),
    },
    events,
  };
}

/** Storage denial/quota errors leave the in-memory experience usable for the session. */
export function createSafeJSONStorage(getStorage: () => Storage) {
  return createJSONStorage(() => {
    const storage = getStorage();
    return {
      getItem: (name: string) => {
        try {
          return storage.getItem(name);
        } catch {
          return null;
        }
      },
      setItem: (name: string, value: string) => {
        try {
          storage.setItem(name, value);
        } catch {
          // The app remains functional without durable persistence.
        }
      },
      removeItem: (name: string) => {
        try {
          storage.removeItem(name);
        } catch {
          // The app remains functional without durable persistence.
        }
      },
    };
  });
}

/* ------------------------------ Store ------------------------------ */

export const useAlter = create<AlterState>()(
  persist(
    (set, get) => {
      const withRecord = (
        s: AlterState,
        ev: Omit<EchoEvent, "id" | "ts" | "modeId"> & { modeId?: ModeId },
        modeId: ModeId,
      ): EchoEvent[] => {
        if (!s.settings.recordEchoes) return s.events;
        const full: EchoEvent = { ...ev, id: newId(), ts: Date.now(), modeId: ev.modeId ?? modeId };
        return [full, ...s.events].slice(0, MAX_EVENTS);
      };

      const commitTransition = () => {
        const s = get();
        const tr = s.transition;
        if (!tr || tr.committed) return;
        const env = tr.env;
        set({
          modeId: env.modeId,
          env: { ...env },
          sessionActive: true,
          sessionEntered: s.sessionEntered + 1,
          messageSeed: s.messageSeed + 1,
          coreLine: null,
          events: withRecord(
            s,
            {
              type: "shift",
              title: `Applied Reality Shift · ${env.name}`,
              detail: `${MODES[env.modeId].name} — ${env.summary}`,
              modeId: env.modeId,
              fromModeId: s.modeId,
              meta: { source: env.source, motion: String(env.motionScale), name: env.name, summary: env.summary },
            },
            env.modeId,
          ),
          transition: { ...tr, committed: true },
        });
      };

      const endTransition = () => {
        clearShiftTimers();
        set({ transition: null });
        get().settle();
      };

      return {
        hydrated: false,
        modeId: "peter-parker",
        env: defaultEnvironment("peter-parker"),
        settings: DEFAULT_SETTINGS,
        events: [],

        coreState: "attentive",
        route: "/",
        sessionActive: false,
        sessionEntered: 0,
        previewEnv: null,
        proposal: null,
        transition: null,
        messageSeed: 0,
        coreLine: null,
        thread: [],
        uiHidden: false,
        systemReduced: false,
        dialog: null,
        drawer: null,

        setRoute: (route) => {
          const s = get();
          set({ route, drawer: null, uiHidden: route.startsWith("/dreamscape") ? s.uiHidden : false });
          if (!s.transition) set({ coreState: baselineState(route, get().sessionActive) });
        },
        setCore: (coreState) => set({ coreState }),
        flashCore: (st, ms) => {
          set({ coreState: st });
          window.clearTimeout(settleTimer);
          settleTimer = window.setTimeout(() => {
            if (get().coreState === st && !get().transition) get().settle();
          }, ms);
        },
        settle: () => {
          const s = get();
          set({ coreState: baselineState(s.route, s.sessionActive) });
        },
        setSystemReduced: (systemReduced) => set({ systemReduced }),
        setPreview: (previewEnv) => set({ previewEnv }),
        setProposal: (proposal) => set({ proposal }),
        setUiHidden: (uiHidden) => set({ uiHidden }),
        openDialog: (dialog) => set({ dialog }),
        openDrawer: (drawer) => set({ drawer }),
        updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

        enterMode: (id) => {
          const s = get();
          if (s.modeId === id && s.env.source === "manual") return;
          const env = defaultEnvironment(id);
          set({
            modeId: id,
            env,
            sessionActive: true,
            sessionEntered: s.sessionEntered + 1,
            messageSeed: s.messageSeed + 1,
            coreLine: null,
            previewEnv: null,
            events: withRecord(
              s,
              { type: "environment", title: `Entered ${MODES[id].name}`, detail: MODES[id].tagline, fromModeId: s.modeId },
              id,
            ),
          });
          get().flashCore("transitioning", 1100);
        },

        applyEnvironment: (env) => {
          const s = get();
          clearShiftTimers();
          const style: TransitionStyle = isReduced(s) ? "reduced" : s.settings.transitionStyle;
          const timing = TRANSITION_TIMING[style];
          set({
            transition: { key: Date.now(), style, env, committed: false, commitMs: timing.commit, endMs: timing.end },
            coreState: "transitioning",
            proposal: null,
            previewEnv: null,
            dialog: null,
          });
          shiftTimers.push(window.setTimeout(commitTransition, timing.commit));
          shiftTimers.push(window.setTimeout(endTransition, timing.end));
        },

        skipTransition: () => {
          if (!get().transition) return;
          commitTransition();
          endTransition();
        },

        record: (ev) => set((s) => ({ events: withRecord(s, ev, s.modeId) })),

        nextLine: () => set((s) => ({ messageSeed: s.messageSeed + 1, coreLine: null })),

        sendMessage: (text) => {
          const t = text.trim().slice(0, 500);
          if (!t) return;
          const s = get();
          const mode = s.modeId;
          const you: ThreadMsg = { id: newId(), from: "you", text: t, ts: Date.now(), modeId: mode };
          set({
            thread: [...s.thread, you],
            events: withRecord(s, { type: "message", title: "Shared a message", detail: t }, mode),
          });
          get().setCore("interpreting");
          window.clearTimeout(replyTimer);
          const delay = isReduced(get()) ? 350 : 1000;
          replyTimer = window.setTimeout(() => {
            const cur = get();
            const replies = MODES[cur.modeId].voice.replies;
            const idx = cur.thread.filter((m) => m.from === "core").length % replies.length;
            const reply: ThreadMsg = { id: newId(), from: "core", text: replies[idx], ts: Date.now(), modeId: cur.modeId };
            set({ thread: [...cur.thread, reply], coreLine: reply.text });
            if (!cur.transition) get().settle();
          }, delay);
        },

        clearHistory: () => set({ events: [] }),
        resetPreferences: () => set({ settings: { ...DEFAULT_SETTINGS } }),
        resetDemo: () => {
          clearShiftTimers();
          window.clearTimeout(replyTimer);
          window.clearTimeout(settleTimer);
          set({
            modeId: "peter-parker",
            env: defaultEnvironment("peter-parker"),
            settings: { ...DEFAULT_SETTINGS },
            events: [],
            sessionActive: false,
            sessionEntered: 0,
            previewEnv: null,
            proposal: null,
            transition: null,
            messageSeed: 0,
            coreLine: null,
            thread: [],
            dialog: null,
          });
          get().settle();
        },
      };
    },
    {
      name: "alter.v1",
      version: 1,
      storage: createSafeJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ modeId: s.modeId, env: s.env, settings: s.settings, events: s.events }),
      merge: (persisted, current) => ({ ...current, ...sanitizePersistedState(persisted, current) }),
    },
  ),
);

/* ------------------------------ Selectors ------------------------------ */

export function useReducedMotion(): boolean {
  return useAlter((s) => s.settings.reducedMotion ?? s.systemReduced);
}

/** The mode currently shown: a preview if one is active, otherwise the real mode. */
export function useDisplayModeId(): ModeId {
  return useAlter((s) => s.previewEnv?.modeId ?? s.modeId);
}
