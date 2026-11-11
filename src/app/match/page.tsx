"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ENERGIES, MOODS, MOTION_SCALES, motionLabel, proposeFromCheckin, type Energy, type MatchProposal, type Mood } from "@/lib/flows";
import { MODE_LIST, MODES, type ModeId } from "@/lib/modes";
import { useAlter, useReducedMotion } from "@/lib/store";
import { hexToRgba } from "@/lib/util";
import { LivingCore } from "@/components/core/LivingCore";
import { Emblem, Icon } from "@/components/ui/Icon";
import { Button, Page, PageHeader, Segmented, cx } from "@/components/ui/ui";

type Step = "listen" | "interpret" | "propose";

export default function MatchPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const modeId = useAlter((s) => s.modeId);
  const record = useAlter((s) => s.record);
  const setCore = useAlter((s) => s.setCore);
  const setPreview = useAlter((s) => s.setPreview);
  const setProposal = useAlter((s) => s.setProposal);
  const applyEnvironment = useAlter((s) => s.applyEnvironment);

  const [step, setStep] = useState<Step>("listen");
  const [mood, setMood] = useState<Mood | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<MatchProposal | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      setPreview(null);
    },
    [setPreview],
  );

  const showProposal = (p: MatchProposal) => {
    setResult(p);
    setProposal(p.env);
    setPreview({ modeId: p.env.modeId, motionScale: p.env.motionScale, label: p.env.name });
    setCore("suggesting");
    setStep("propose");
  };

  const submit = () => {
    const shared = mood || energy || note.trim();
    if (shared) {
      record({
        type: "checkin",
        title: "Completed a check-in",
        detail: note.trim() || undefined,
        meta: { ...(mood ? { mood } : {}), ...(energy ? { energy } : {}) },
      });
    }
    setCore("interpreting");
    setStep("interpret");
    timer.current = window.setTimeout(() => showProposal(proposeFromCheckin({ mood, energy, note }, modeId)), reduced ? 350 : 1600);
  };

  const modify = (patch: { modeId?: ModeId; motionScale?: number }) => {
    if (!result) return;
    const env = { ...result.env };
    if (patch.modeId && patch.modeId !== env.modeId) {
      env.modeId = patch.modeId;
      env.name = MODES[patch.modeId].name;
      env.summary = MODES[patch.modeId].tagline;
      env.id = `match-custom-${patch.modeId}`;
    }
    if (patch.motionScale) env.motionScale = patch.motionScale;
    setResult({ ...result, env, neutral: false, reason: `${result.reason} You adjusted it.` });
    setProposal(env);
    setPreview({ modeId: env.modeId, motionScale: env.motionScale, label: env.name });
  };

  const accept = () => {
    if (!result) return;
    if (result.neutral && result.env.modeId === modeId) {
      setPreview(null);
      setProposal(null);
      router.push("/");
      return;
    }
    applyEnvironment(result.env);
    router.push("/");
  };

  const skip = () => {
    setPreview(null);
    setProposal(null);
    router.push("/");
  };

  const chip = (active: boolean) =>
    cx(
      "min-h-11 rounded-full border px-4 text-[13px] transition-[background,border-color,color] duration-[var(--m-snappy)]",
      active ? "accent-tint text-ink" : "border-white/10 bg-white/[0.02] text-ink/65 hover:border-white/25 hover:text-ink",
    );

  return (
    <Page>
      <PageHeader eyebrow="MATCH · Accommodate" title={step === "listen" ? "How are you arriving?" : step === "interpret" ? "Finding a shape for this…" : "A proposed environment"}>
        {step === "listen"
          ? "Everything here is optional. Share as much or as little as you like — ALTER never infers how you feel."
          : step === "interpret"
            ? "Nothing is applied yet."
            : "This is only a preview. You decide whether it becomes real."}
      </PageHeader>

      <div className="relative mx-auto mb-6 h-[240px] sm:h-[280px]">
        <LivingCore className="absolute inset-0" />
      </div>

      {step === "listen" && (
        <div className="surface anim-fade-up space-y-7 rounded-3xl p-5 sm:p-8">
          <section aria-labelledby="mood-h">
            <h2 id="mood-h" className="eyebrow mb-3">Mood · optional</h2>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((x) => (
                <button key={x} type="button" aria-pressed={mood === x} onClick={() => setMood(mood === x ? null : x)} className={chip(mood === x)}>
                  {x}
                </button>
              ))}
            </div>
          </section>
          <section aria-labelledby="energy-h">
            <h2 id="energy-h" className="eyebrow mb-3">Energy · optional</h2>
            <div className="flex flex-wrap gap-2">
              {ENERGIES.map((x) => (
                <button key={x} type="button" aria-pressed={energy === x} onClick={() => setEnergy(energy === x ? null : x)} className={chip(energy === x)}>
                  {x}
                </button>
              ))}
            </div>
          </section>
          <section>
            <label htmlFor="note" className="eyebrow mb-3 block">In your own words · optional</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={400}
              rows={3}
              placeholder="Anything you want to put here…"
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[14px] leading-relaxed text-ink placeholder:text-ink/30 focus:border-accent/50 focus:outline-none"
            />
            <p className="mt-2 text-[12px] text-ink/40">Stays on this device. ALTER does not analyze what you write.</p>
          </section>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={submit}>
              Continue <Icon name="next" size={16} />
            </Button>
            <Button variant="quiet" onClick={skip}>
              Skip check-in
            </Button>
          </div>
        </div>
      )}

      {step === "interpret" && (
        <div className="surface anim-fade-in flex items-center justify-center gap-3 rounded-3xl p-10 text-[14px] text-ink/60" role="status">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" style={{ animation: "dot-pulse 1s ease-in-out infinite" }} />
          Interpreting what you chose…
        </div>
      )}

      {step === "propose" && result && (
        <div className="surface anim-fade-up rounded-3xl p-5 sm:p-8">
          <div className="flex items-center gap-4">
            <span style={{ color: MODES[result.env.modeId].accent }}>
              <Emblem modeId={result.env.modeId} size={46} />
            </span>
            <div>
              <h2 className="font-display text-[34px] leading-none font-normal">{result.env.name}</h2>
              <p className="mt-1.5 text-[12px] tracking-[0.14em] text-ink/50 uppercase">
                {MODES[result.env.modeId].name} · {motionLabel(result.env.motionScale)} pace
              </p>
            </div>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-ink/75">{result.env.summary}</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink/45">{result.reason}</p>

          <details className="group mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] open:bg-white/[0.03]">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-[13px] tracking-[0.12em] text-ink/80 uppercase">
              Modify
              <Icon name="next" size={16} className="transition-transform group-open:rotate-90" />
            </summary>
            <div className="space-y-5 px-5 pb-5">
              <div>
                <p className="eyebrow mb-2">Mode</p>
                <div className="flex flex-wrap gap-2">
                  {MODE_LIST.map((m) => {
                    const active = m.id === result.env.modeId;
                    return (
                      <button
                        key={m.id}
                        aria-pressed={active}
                        onClick={() => modify({ modeId: m.id })}
                        className="min-h-11 rounded-full border px-4 text-[13px] transition-colors"
                        style={{
                          borderColor: active ? hexToRgba(m.accent, 0.8) : "rgba(255,255,255,0.1)",
                          background: active ? hexToRgba(m.accent, 0.15) : "transparent",
                          color: active ? "#fff" : "rgba(244,238,240,0.65)",
                        }}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-2">Pace</p>
                <Segmented
                  label="Pace"
                  value={motionLabel(result.env.motionScale)}
                  options={(Object.keys(MOTION_SCALES) as (keyof typeof MOTION_SCALES)[]).map((k) => ({ value: k, label: k }))}
                  onChange={(k) => modify({ motionScale: MOTION_SCALES[k] })}
                />
              </div>
            </div>
          </details>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={accept}>
              <Icon name="sparkle" size={16} /> {result.neutral && result.env.modeId === modeId ? "Stay here" : "Accept & shift"}
            </Button>
            <Button variant="quiet" onClick={skip}>
              Skip
            </Button>
          </div>
        </div>
      )}
    </Page>
  );
}
