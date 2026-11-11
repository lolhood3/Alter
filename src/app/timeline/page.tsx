"use client";

import { useEffect, useMemo, useState } from "react";
import { MODES } from "@/lib/modes";
import { TYPE_ICON, TYPE_LABEL } from "@/lib/echoMeta";
import { useAlter } from "@/lib/store";
import { formatDay, formatTime } from "@/lib/util";
import { LivingCore } from "@/components/core/LivingCore";
import { Emblem, Icon } from "@/components/ui/Icon";
import { Button, Page, PageHeader, cx } from "@/components/ui/ui";

export default function TimelinePage() {
  const events = useAlter((s) => s.events);
  const hydrated = useAlter((s) => s.hydrated);
  const setPreview = useAlter((s) => s.setPreview);
  const applyEnvironment = useAlter((s) => s.applyEnvironment);
  const [idx, setIdx] = useState<number | null>(null); // null = now

  const chrono = useMemo(() => [...events].reverse(), [events]);
  const n = chrono.length;
  const sel = idx !== null && idx < n ? idx : null;
  const ev = sel !== null ? chrono[sel] : null;

  // Historical preview never overwrites current state.
  useEffect(() => {
    if (!ev) {
      setPreview(null);
      return;
    }
    setPreview({ modeId: ev.modeId, motionScale: Number(ev.meta?.motion) || 1, label: ev.meta?.name ?? MODES[ev.modeId].name });
  }, [ev, setPreview]);
  useEffect(() => () => setPreview(null), [setPreview]);

  const go = (i: number | null) => setIdx(i === null ? null : Math.max(0, Math.min(n - 1, i)));
  const step = (d: number) => {
    if (n === 0) return;
    if (sel === null) go(d < 0 ? n - 1 : null);
    else if (sel + d >= n) go(null);
    else go(sel + d);
  };

  const restore = () => {
    if (!ev) return;
    const m = MODES[ev.modeId];
    applyEnvironment({
      id: `restore-${ev.id}`,
      name: ev.meta?.name ?? m.name,
      modeId: ev.modeId,
      summary: ev.meta?.summary ?? m.tagline,
      motionScale: Number(ev.meta?.motion) || 1,
      source: "restore",
    });
    setIdx(null);
  };

  return (
    <Page wide>
      <PageHeader eyebrow="Revisit" title="Timeline Rewind">
        Step back through the moments you chose to record. Previews never change your current environment unless you restore one yourself.
      </PageHeader>

      {hydrated && n === 0 ? (
        <div className="surface rounded-3xl p-10 text-center">
          <p className="font-display text-[28px] text-ink/85 italic">No moments to revisit yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink/45">Enter a mode or apply a Reality Shift and it will appear on the timeline.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="relative h-[260px] sm:h-[320px]">
              <LivingCore className="absolute inset-0" slow />
              <p className="eyebrow absolute inset-x-0 bottom-0 text-center !text-accent">{ev ? "Previewing the past — not applied" : "Now"}</p>
            </div>

            <div className="surface mt-5 rounded-3xl p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1" role="group" aria-label="Move through time">
                  <button aria-label="Oldest event" onClick={() => go(0)} disabled={n === 0} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/5 disabled:opacity-30"><Icon name="first" size={18} /></button>
                  <button aria-label="Earlier event" onClick={() => step(-1)} disabled={n === 0 || sel === 0} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/5 disabled:opacity-30"><Icon name="prev" size={18} /></button>
                  <button aria-label="Later event" onClick={() => step(1)} disabled={sel === null} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/5 disabled:opacity-30"><Icon name="next" size={18} /></button>
                  <button aria-label="Return to now" onClick={() => go(null)} disabled={sel === null} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/5 disabled:opacity-30"><Icon name="last" size={18} /></button>
                </div>
                <Button variant="ghost" onClick={() => go(null)} disabled={sel === null} className="!min-h-10">
                  Return to current
                </Button>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(n, 1)}
                value={sel === null ? n : sel}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  go(v >= n ? null : v);
                }}
                aria-label="Timeline position"
                aria-valuetext={ev ? `${ev.title}, ${formatTime(ev.ts)}` : "Now"}
                className="mt-2 h-11 w-full cursor-pointer"
              />

              {ev ? (
                <div className="anim-fade-in mt-3" key={ev.id}>
                  <div className="flex items-start gap-4">
                    <span style={{ color: MODES[ev.modeId].accent }}>
                      <Emblem modeId={ev.modeId} size={36} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow">{TYPE_LABEL[ev.type]} · {formatDay(ev.ts)}, {formatTime(ev.ts)}</p>
                      <h2 className="font-display mt-1 text-[28px] leading-tight">{ev.title}</h2>
                      <p className="mt-1 text-[12px] tracking-[0.14em] text-ink/50 uppercase">{MODES[ev.modeId].name}</p>
                    </div>
                  </div>
                  {ev.detail && <p className="mt-3 text-[13.5px] leading-relaxed break-words text-ink/65">{ev.detail}</p>}
                  {ev.meta?.mood && <p className="mt-2 text-[13px] text-ink/50">{[ev.meta.mood, ev.meta.energy && `${ev.meta.energy} energy`].filter(Boolean).join(" · ")}</p>}
                  {ev.fromModeId && <p className="mt-2 text-[12.5px] text-ink/40">Moved from {MODES[ev.fromModeId].name}</p>}
                  <div className="mt-5">
                    <Button variant="primary" onClick={restore}>
                      <Icon name="history" size={16} /> Restore this environment
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[13px] text-ink/45">You’re at the present. Drag the slider or use the arrows to look back.</p>
              )}
            </div>
          </div>

          <aside aria-label="Recorded events" className="surface thin-scroll max-h-[640px] overflow-y-auto rounded-3xl p-3">
            <button
              onClick={() => go(null)}
              aria-current={sel === null}
              className={cx("mb-1 flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-[13px]", sel === null ? "accent-tint border" : "border border-transparent hover:bg-white/[0.04]")}
            >
              <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--alt-accent)]" />
              Now
            </button>
            <ol>
              {events.map((e) => {
                const i = chrono.indexOf(e);
                const active = sel === i;
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => go(i)}
                      aria-current={active}
                      className={cx("flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors", active ? "accent-tint" : "border-transparent hover:bg-white/[0.04]")}
                    >
                      <span style={{ color: MODES[e.modeId].accent }}>
                        <Icon name={TYPE_ICON[e.type]} size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink/90">{e.title}</span>
                        <span className="block text-[11.5px] text-ink/40">{formatDay(e.ts)} · {formatTime(e.ts)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      )}
    </Page>
  );
}
