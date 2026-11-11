"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DIRECTION_LIST, directionEnvironment, motionLabel, type DirectionId } from "@/lib/flows";
import { MODES } from "@/lib/modes";
import { useAlter } from "@/lib/store";
import { hexToRgba } from "@/lib/util";
import { LivingCore } from "@/components/core/LivingCore";
import { Emblem, Icon } from "@/components/ui/Icon";
import { Button, Page, PageHeader, cx } from "@/components/ui/ui";

export default function ShiftPage() {
  const router = useRouter();
  const setPreview = useAlter((s) => s.setPreview);
  const setProposal = useAlter((s) => s.setProposal);
  const setCore = useAlter((s) => s.setCore);
  const settle = useAlter((s) => s.settle);
  const record = useAlter((s) => s.record);
  const applyEnvironment = useAlter((s) => s.applyEnvironment);
  const [picked, setPicked] = useState<DirectionId | null>(null);

  useEffect(() => () => setPreview(null), [setPreview]);

  const choose = (id: DirectionId) => {
    const env = directionEnvironment(id);
    setPicked(id);
    setProposal(env);
    setPreview({ modeId: env.modeId, motionScale: env.motionScale, label: env.name });
    setCore("suggesting");
  };

  const reject = () => {
    setPicked(null);
    setProposal(null);
    setPreview(null);
    settle();
  };

  const confirm = () => {
    if (!picked) return;
    const d = DIRECTION_LIST.find((x) => x.id === picked)!;
    record({ type: "direction", title: `Selected ${d.label}`, detail: d.description, modeId: d.env.modeId, meta: { direction: d.label } });
    applyEnvironment(directionEnvironment(picked));
    router.push("/");
  };

  const dir = picked ? DIRECTION_LIST.find((d) => d.id === picked)! : null;
  const env = dir ? directionEnvironment(dir.id) : null;

  return (
    <Page wide>
      <PageHeader eyebrow="SHIFT · Explore" title="Choose a direction">
        Mood and intention are different things. You might feel sad and still choose Play. Pick where you want to go — the Core will propose an environment and let you preview it first.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="relative h-[280px] lg:h-[360px]">
          <LivingCore className="absolute inset-0" />
          {dir && (
            <p className="eyebrow absolute inset-x-0 bottom-0 text-center !text-accent">Previewing — not applied</p>
          )}
        </div>

        <div className="surface rounded-3xl p-5 sm:p-6" aria-live="polite">
          {dir && env ? (
            <div className="anim-fade-up" key={dir.id}>
              <p className="eyebrow">Proposed environment</p>
              <div className="mt-3 flex items-center gap-4">
                <span style={{ color: MODES[env.modeId].accent }}>
                  <Emblem modeId={env.modeId} size={40} />
                </span>
                <div>
                  <h2 className="font-display text-[30px] leading-none">{env.name}</h2>
                  <p className="mt-1.5 text-[12px] tracking-[0.14em] text-ink/50 uppercase">
                    {MODES[env.modeId].name} · {motionLabel(env.motionScale)} pace
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-ink/70">{env.summary}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink/45">Core: {dir.coreBehavior}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="primary" onClick={confirm}>
                  <Icon name="check" size={16} /> Confirm
                </Button>
                <Button variant="ghost" onClick={reject}>
                  Reject
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="eyebrow">Nothing proposed yet</p>
              <p className="font-display mt-3 text-[26px] leading-tight text-ink/85 italic">Pick a direction and watch the room respond.</p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink/45">Previewing never changes your current environment.</p>
            </div>
          )}
        </div>
      </div>

      <div role="group" aria-label="Directions" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DIRECTION_LIST.map((d) => {
          const m = MODES[d.env.modeId];
          const active = picked === d.id;
          return (
            <button
              key={d.id}
              aria-pressed={active}
              onClick={() => choose(d.id)}
              className={cx(
                "group flex min-h-[132px] flex-col items-start rounded-2xl border p-4 text-left transition-[background,border-color,transform] duration-[var(--m-standard)] hover:-translate-y-0.5",
                !active && "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.045]",
              )}
              style={active ? { borderColor: hexToRgba(m.accent, 0.7), background: hexToRgba(m.accent, 0.1) } : undefined}
            >
              <span style={{ color: m.accent }}>
                <Emblem modeId={m.id} size={26} />
              </span>
              <span className="font-display mt-3 text-[26px] leading-none">{d.label}</span>
              <span className="mt-2 text-[12px] leading-snug text-ink/50">{d.description}</span>
            </button>
          );
        })}
      </div>
    </Page>
  );
}
