"use client";

import { MODE_LIST } from "@/lib/modes";
import { useAlter } from "@/lib/store";
import { hexToRgba } from "@/lib/util";
import { Emblem } from "@/components/ui/Icon";
import { cx } from "@/components/ui/ui";

export function ModeSelector({ className }: { className?: string }) {
  const modeId = useAlter((s) => s.modeId);
  const enterMode = useAlter((s) => s.enterMode);
  return (
    <div
      role="group"
      aria-label="Choose a mode"
      className={cx(
        "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0",
        className,
      )}
    >
      {MODE_LIST.map((m) => {
        const active = m.id === modeId;
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={active}
            onClick={() => enterMode(m.id)}
            className={cx(
              "group flex min-h-[128px] w-[132px] shrink-0 snap-center flex-col items-center rounded-2xl border px-2.5 pb-3 pt-3.5 text-center transition-[background,border-color,box-shadow,transform] duration-[var(--m-standard)] ease-out hover:-translate-y-0.5 lg:w-auto xl:min-h-[140px]",
              active ? "" : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.045]",
            )}
            style={
              active
                ? {
                    borderColor: hexToRgba(m.accent, 0.7),
                    background: `linear-gradient(180deg, ${hexToRgba(m.accent, 0.14)}, ${hexToRgba(m.accent, 0.03)})`,
                    boxShadow: `0 0 34px -10px ${hexToRgba(m.accent, 0.7)}`,
                  }
                : undefined
            }
          >
            <span style={{ color: m.accent }} className="transition-transform duration-[var(--m-standard)] group-hover:scale-110">
              <Emblem modeId={m.id} size={32} />
            </span>
            <span className="mt-2.5 text-[11.5px] leading-tight font-medium tracking-[0.12em] uppercase text-ink">{m.name}</span>
            <span className="mt-1.5 text-[10.5px] leading-snug text-ink/50">{m.cardLine}</span>
          </button>
        );
      })}
    </div>
  );
}
