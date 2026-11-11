"use client";

import { useEffect } from "react";
import { MODE_LIST, type ModeConfig } from "@/lib/modes";
import { useAlter } from "@/lib/store";
import { hexToRgba } from "@/lib/util";
import { LivingCore } from "@/components/core/LivingCore";
import { Emblem, Icon } from "@/components/ui/Icon";
import { Button, Page, PageHeader, cx } from "@/components/ui/ui";

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink/45">
      <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ background: color }} />
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow !text-[10px]">{label}</dt>
      <dd className="mt-1 text-[13px] leading-snug text-ink/75">{value}</dd>
    </div>
  );
}

function ModeCard({ m, current, previewing }: { m: ModeConfig; current: boolean; previewing: boolean }) {
  const enterMode = useAlter((s) => s.enterMode);
  const setPreview = useAlter((s) => s.setPreview);
  return (
    <article
      className={cx("rounded-3xl border p-5 transition-[border-color,background] duration-[var(--m-standard)] sm:p-6", !current && !previewing && "border-white/[0.07] bg-white/[0.02]")}
      style={
        current || previewing
          ? {
              borderColor: hexToRgba(m.accent, current ? 0.65 : 0.35),
              background: `linear-gradient(160deg, ${hexToRgba(m.accent, 0.12)}, rgba(255,255,255,0.015))`,
            }
          : undefined
      }
    >
      <div className="flex items-start gap-4">
        <span style={{ color: m.accent }} className="mt-1">
          <Emblem modeId={m.id} size={42} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[30px] leading-none font-normal tracking-[0.04em] uppercase">{m.name}</h2>
          <p className="mt-1.5 text-[13px] text-ink/60 italic">{m.tagline}</p>
        </div>
        {current && <span className="eyebrow rounded-full border border-white/10 px-3 py-1 !text-[10px]">Current</span>}
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-ink/55">{m.identity}</p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Detail label="Emotional territory" value={m.territory} />
        <Detail label="Communication" value={m.voice.style} />
        <Detail label="Motion" value={m.motion.personality} />
        <Detail label="Environment" value={`${m.env.lighting}. ${m.env.particle.description}.`} />
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
        <Swatch color={m.accent} label="Primary" />
        <Swatch color={m.accent2} label="Secondary" />
        <Swatch color={m.look.colA} label="Core" />
        <Swatch color={m.bg0} label="Ground" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          variant={previewing ? "primary" : "ghost"}
          aria-pressed={previewing}
          onClick={() => setPreview(previewing ? null : { modeId: m.id, motionScale: 1, label: m.name })}
        >
          <Icon name="eye" size={16} /> {previewing ? "Previewing" : "Preview"}
        </Button>
        <Button variant={current ? "quiet" : "primary"} disabled={current} onClick={() => enterMode(m.id)}>
          {current ? "Active" : "Enter mode"}
        </Button>
      </div>
    </article>
  );
}

export default function ModesPage() {
  const modeId = useAlter((s) => s.modeId);
  const preview = useAlter((s) => s.previewEnv);
  const setPreview = useAlter((s) => s.setPreview);
  useEffect(() => () => setPreview(null), [setPreview]);

  return (
    <Page wide>
      <PageHeader eyebrow="Seven identities" title="Modes">
        Seven experiential identities, one shared Core. Preview any of them without changing your current environment, or enter one to make it yours.
      </PageHeader>

      <div className="relative mb-8 h-[280px] sm:h-[320px]">
        <LivingCore className="absolute inset-0" />
        {preview && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            <Button onClick={() => setPreview(null)} variant="ghost" className="!min-h-10 bg-black/40 backdrop-blur">
              Stop preview
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {MODE_LIST.map((m) => (
          <ModeCard key={m.id} m={m} current={m.id === modeId} previewing={preview?.modeId === m.id} />
        ))}
      </div>
    </Page>
  );
}
