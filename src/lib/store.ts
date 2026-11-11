"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MODES, type ModeId } from "./modes";
import type { CoreStateId } from "./coreStates";
import { defaultEnvironment, type Environment } from "./flows";
import { newId } from "./util";

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
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ modeId: s.modeId, env: s.env, settings: s.settings, events: s.events }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AlterState>;
        const modeId = p.modeId && MODES[p.modeId] ? p.modeId : current.modeId;
        return {
          ...current,
          modeId,
          env: p.env && MODES[p.env.modeId] ? p.env : defaultEnvironment(modeId),
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
          events: Array.isArray(p.events) ? p.events.filter((e) => e && MODES[e.modeId]) : [],
        };
      },
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
