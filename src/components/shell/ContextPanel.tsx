"use client";

import { useEffect, useState } from "react";
import { MODES } from "@/lib/modes";
import { CORE_STATES } from "@/lib/coreStates";
import { motionLabel } from "@/lib/flows";
import { useAlter, useDisplayModeId } from "@/lib/store";
import { timeAgo } from "@/lib/util";
import { StatePill, cx } from "@/components/ui/ui";
import { CorePanel } from "./CorePanel";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-[12px] text-ink/40">{label}</dt>
      <dd className="text-right text-[12.5px] leading-snug text-ink/80">{value}</dd>
    </div>
  );
}

function Mountains() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 160"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-36 w-full opacity-80"
    >
      <defs>
        <linearGradient id="mt-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--alt-accent)" stopOpacity="0.38" />
          <stop offset="1" stopColor="var(--alt-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mt-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--alt-accent2)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--alt-accent2)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 120 L50 98 L84 112 L140 70 L186 104 L236 58 L286 96 L330 78 L400 118 L400 160 L0 160Z" fill="url(#mt-b)" />
      <path d="M0 138 L60 118 L110 130 L170 96 L230 128 L292 90 L350 124 L400 108 L400 160 L0 160Z" fill="url(#mt-a)" />
      <path d="M0 138 L60 118 L110 130 L170 96 L230 128 L292 90 L350 124 L400 108" fill="none" stroke="var(--alt-accent)" strokeOpacity="0.35" strokeWidth="0.8" />
    </svg>
  );
}

/** The contextual companion: mode, state, environment, session context and Core voice. */
export function ContextPanel({ className }: { className?: string }) {
  const modeId = useDisplayModeId();
  const m = MODES[modeId];
  const state = useAlter((s) => s.coreState);
  const env = useAlter((s) => s.env);
  const preview = useAlter((s) => s.previewEnv);
  const entered = useAlter((s) => s.sessionEntered);
  const events = useAlter((s) => s.events);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, []);

  const lastCheckin = events.find((e) => e.type === "checkin");
  const envName = preview ? (preview.label ?? m.name) : env.name;
  const scale = preview ? preview.motionScale : env.motionScale;
  const showEnvName = envName !== m.name;

  return (
    <div className={cx("surface relative flex min-h-0 flex-col overflow-hidden rounded-[28px]", className)}>
      <div className="thin-scroll relative z-10 flex-1 overflow-y-auto p-6 pb-28">
        <p className="eyebrow">{preview ? "Previewing" : "Current mode"}</p>
        <h2 className="font-display mt-2 text-[34px] leading-[1.02] font-normal tracking-[0.04em] uppercase">{m.name}</h2>
        <p className="mt-2 text-[14px] leading-snug text-ink/65">{m.tagline}</p>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink/45">{m.identity}</p>

        <div className="hairline my-5" />

        <p className="eyebrow mb-3">Core state</p>
        <StatePill state={state} />
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink/50">{CORE_STATES[state].description}</p>

        <div className="hairline my-5" />
        <CorePanel />
        <div className="hairline my-5" />

        <p className="eyebrow mb-1.5">Environment</p>
        {showEnvName && <p className="font-display text-[22px] leading-tight text-ink/90">{envName}</p>}
        <dl className="mt-1 divide-y divide-white/[0.05]">
          <Row label="Light" value={m.env.lighting} />
          <Row label="Motion" value={`${m.motion.personality} · ${motionLabel(scale).toLowerCase()}`} />
          <Row label="Particles" value={m.env.particle.description} />
        </dl>

        <div className="hairline my-5" />

        <p className="eyebrow mb-1.5">Session</p>
        <dl className="divide-y divide-white/[0.05]">
          <Row label="Entered" value={entered === 0 ? "Nothing yet" : `${entered} environment${entered === 1 ? "" : "s"}`} />
          <Row
            label="Last check-in"
            value={
              lastCheckin
                ? `${[lastCheckin.meta?.mood, lastCheckin.meta?.energy && `${lastCheckin.meta.energy.toLowerCase()} energy`].filter(Boolean).join(" · ") || "Shared a note"}${now ? ` · ${timeAgo(lastCheckin.ts, now)}` : ""}`
                : "None shared"
            }
          />
        </dl>

      </div>
      <Mountains />
    </div>
  );
}
