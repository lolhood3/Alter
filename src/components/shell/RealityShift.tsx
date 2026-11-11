"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MODES } from "@/lib/modes";
import { useAlter, useReducedMotion, type TransitionStyle } from "@/lib/store";
import type { Environment } from "@/lib/flows";
import { hexToRgba } from "@/lib/util";
import { Emblem, Icon } from "@/components/ui/Icon";
import { Button, Modal, Segmented } from "@/components/ui/ui";

export const TRANSITION_OPTIONS: { value: TransitionStyle; label: string }[] = [
  { value: "reduced", label: "Reduced" },
  { value: "standard", label: "Standard" },
  { value: "immersive", label: "Immersive" },
];

/** Full-screen transition. Interruptible: click, tap or Esc finishes it immediately. */
export function RealityShiftOverlay() {
  const tr = useAlter((s) => s.transition);
  const skip = useAlter((s) => s.skipTransition);

  useEffect(() => {
    if (!tr) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tr, skip]);

  if (!tr) return null;
  const m = MODES[tr.env.modeId];
  const reduced = tr.style === "reduced";
  const immersive = tr.style === "immersive";
  const bg = `radial-gradient(circle at 50% 48%, ${hexToRgba(m.accent, immersive ? 0.5 : 0.38)} 0%, ${hexToRgba(m.bg0, 0.97)} 64%)`;

  return (
    <div
      key={tr.key}
      role="status"
      aria-live="assertive"
      aria-label={`Reality Shift to ${tr.env.name}. Press any key or tap to skip.`}
      onClick={skip}
      className="fixed inset-0 z-[90] cursor-pointer overflow-hidden"
    >
      <div
        className={reduced ? "rs-fade-keep absolute inset-0" : "absolute inset-0"}
        style={{
          background: bg,
          backdropFilter: immersive ? "blur(10px)" : undefined,
          animation: `${reduced ? "rs-fade" : "rs-wipe"} ${tr.endMs}ms cubic-bezier(0.45, 0, 0.2, 1) both`,
        }}
      />
      {immersive &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 aspect-square w-[60vmin] rounded-full border"
            style={{
              borderColor: hexToRgba(m.accent, 0.5),
              animation: `rs-ring ${tr.endMs * 0.8}ms ease-out ${i * 220}ms both`,
            }}
          />
        ))}
      {!reduced && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{ animation: `rs-title ${tr.endMs}ms ease-out both` }}
        >
          <span style={{ color: m.accent }}>
            <Emblem modeId={m.id} size={44} />
          </span>
          <p className="eyebrow mt-5">Reality Shift</p>
          <p className="font-display mt-2 text-[44px] leading-none font-light text-ink sm:text-[64px]">{tr.env.name}</p>
          <p className="mt-3 text-[13px] tracking-[0.12em] text-ink/60 uppercase">{m.name}</p>
        </div>
      )}
    </div>
  );
}

/** Reality Shift dialog from the home screen: apply a proposal or a recent environment. */
export function RealityShiftDialog() {
  const open = useAlter((s) => s.dialog === "reality");
  const openDialog = useAlter((s) => s.openDialog);
  const proposal = useAlter((s) => s.proposal);
  const setProposal = useAlter((s) => s.setProposal);
  const apply = useAlter((s) => s.applyEnvironment);
  const events = useAlter((s) => s.events);
  const style = useAlter((s) => s.settings.transitionStyle);
  const update = useAlter((s) => s.updateSettings);
  const reduced = useReducedMotion();
  const router = useRouter();

  const recent = useMemo<Environment[]>(() => {
    const seen = new Set<string>();
    const out: Environment[] = [];
    for (const e of events) {
      if (e.type !== "shift" || !e.meta?.name) continue;
      if (seen.has(e.meta.name)) continue;
      seen.add(e.meta.name);
      out.push({
        id: `recent-${e.id}`,
        name: e.meta.name,
        modeId: e.modeId,
        summary: e.meta.summary ?? MODES[e.modeId].tagline,
        motionScale: Number(e.meta.motion) || 1,
        source: "recent",
      });
      if (out.length >= 3) break;
    }
    return out;
  }, [events]);

  const go = (path: string) => {
    openDialog(null);
    router.push(path);
  };

  return (
    <Modal open={open} onClose={() => openDialog(null)} title="Reality Shift">
      <p className="mb-5 text-[14px] leading-relaxed text-ink/60">
        Reality Shift applies an environment you’ve approved — Core, lighting, atmosphere, motion and voice, all together.
      </p>

      {proposal ? (
        <div className="surface rounded-2xl p-5">
          <p className="eyebrow">Proposed environment</p>
          <div className="mt-3 flex items-center gap-4">
            <span style={{ color: MODES[proposal.modeId].accent }}>
              <Emblem modeId={proposal.modeId} size={38} />
            </span>
            <div>
              <p className="font-display text-[28px] leading-none">{proposal.name}</p>
              <p className="mt-1 text-[12px] tracking-[0.12em] text-ink/50 uppercase">{MODES[proposal.modeId].name}</p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink/65">{proposal.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => apply(proposal)}>
              <Icon name="sparkle" size={16} /> Apply
            </Button>
            <Button variant="quiet" onClick={() => setProposal(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="surface rounded-2xl p-5">
            <p className="text-[14px] text-ink/80">No environment is proposed right now.</p>
            <p className="mt-1 text-[13px] text-ink/50">Get a proposal from a check-in or by choosing a direction.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => go("/match")}>Open MATCH</Button>
              <Button onClick={() => go("/shift")}>Open SHIFT</Button>
            </div>
          </div>
          {recent.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Recently applied</p>
              <ul className="space-y-2">
                {recent.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => apply(r)}
                      className="flex min-h-14 w-full items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      <span style={{ color: MODES[r.modeId].accent }}>
                        <Emblem modeId={r.modeId} size={28} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-display block text-[21px] leading-tight">{r.name}</span>
                        <span className="block truncate text-[12px] text-ink/50">{MODES[r.modeId].name}</span>
                      </span>
                      <Icon name="sparkle" size={16} className="text-ink/40" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-white/[0.07] pt-5">
        <p className="eyebrow mb-3">Transition</p>
        <Segmented label="Transition style" value={reduced ? "reduced" : style} options={TRANSITION_OPTIONS} onChange={(v) => update({ transitionStyle: v })} />
        {reduced && <p className="mt-2 text-[12px] text-ink/45">Reduced motion is on, so the reduced transition is always used.</p>}
      </div>
    </Modal>
  );
}
