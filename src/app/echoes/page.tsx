"use client";

import { useMemo, useState } from "react";
import { MODES } from "@/lib/modes";
import { useAlter, type EchoEvent } from "@/lib/store";
import { ECHO_FILTERS, TYPE_ICON, TYPE_LABEL } from "@/lib/echoMeta";
import { formatDay, formatTime } from "@/lib/util";
import { Emblem, Icon } from "@/components/ui/Icon";
import { Button, Page, PageHeader, cx } from "@/components/ui/ui";

export default function EchoesPage() {
  const events = useAlter((s) => s.events);
  const hydrated = useAlter((s) => s.hydrated);
  const record = useAlter((s) => s.settings.recordEchoes);
  const clearHistory = useAlter((s) => s.clearHistory);
  const [filter, setFilter] = useState<(typeof ECHO_FILTERS)[number]["id"]>("all");
  const [confirming, setConfirming] = useState(false);

  const shown = useMemo(() => {
    const f = ECHO_FILTERS.find((x) => x.id === filter)!;
    return f.types ? events.filter((e) => (f.types as readonly string[]).includes(e.type)) : events;
  }, [events, filter]);

  const groups = useMemo(() => {
    const out: { day: string; items: EchoEvent[] }[] = [];
    for (const e of shown) {
      const day = formatDay(e.ts);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(e);
      else out.push({ day, items: [e] });
    }
    return out;
  }, [shown]);

  return (
    <Page>
      <PageHeader eyebrow="A simple record" title="Echoes">
        Only things you explicitly do are recorded here — entering a mode, completing a check-in, choosing a direction, applying a Reality Shift, sharing a message. It all stays on this device.
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter echoes" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {ECHO_FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cx(
                "min-h-11 shrink-0 rounded-full border px-4 text-[13px] transition-colors",
                filter === f.id ? "accent-tint text-ink" : "border-transparent text-ink/55 hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {events.length > 0 &&
          (confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] text-ink/60">Clear all {events.length} echoes?</span>
              <Button
                variant="danger"
                onClick={() => {
                  clearHistory();
                  setConfirming(false);
                }}
              >
                Clear
              </Button>
              <Button variant="quiet" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="quiet" onClick={() => setConfirming(true)}>
              <Icon name="trash" size={16} /> Clear history
            </Button>
          ))}
      </div>

      {!record && (
        <p className="surface mb-5 rounded-2xl px-5 py-3 text-[13px] text-ink/60">Recording is turned off in Settings. New activity won’t be saved.</p>
      )}

      {!hydrated ? null : shown.length === 0 ? (
        <div className="surface rounded-3xl p-10 text-center">
          <p className="font-display text-[28px] text-ink/85 italic">{events.length === 0 ? "Nothing recorded yet." : "Nothing in this filter."}</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink/45">
            Enter a mode, try MATCH or SHIFT, and the moments you choose will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.day} aria-label={g.day}>
              <h2 className="eyebrow mb-3">{g.day}</h2>
              <ol className="space-y-2">
                {g.items.map((e) => {
                  const m = MODES[e.modeId];
                  return (
                    <li key={e.id} className="surface flex gap-4 rounded-2xl p-4 sm:p-5">
                      <span
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10"
                        style={{ color: m.accent }}
                      >
                        <Icon name={TYPE_ICON[e.type]} size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                          <p className="text-[14.5px] font-medium text-ink">{e.title}</p>
                          <time className="text-[12px] text-ink/40" dateTime={new Date(e.ts).toISOString()}>
                            {formatTime(e.ts)}
                          </time>
                        </div>
                        {e.detail && <p className="mt-1 text-[13px] leading-relaxed break-words text-ink/55">{e.detail}</p>}
                        {e.meta?.mood && (
                          <p className="mt-1 text-[12.5px] text-ink/45">
                            {[e.meta.mood, e.meta.energy && `${e.meta.energy} energy`].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <p className="mt-2 flex items-center gap-2 text-[11px] tracking-[0.14em] text-ink/35 uppercase">
                          <span style={{ color: m.accent }}>
                            <Emblem modeId={m.id} size={14} />
                          </span>
                          {TYPE_LABEL[e.type]} · {m.name}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
