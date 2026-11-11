"use client";

import { useEffect, useState } from "react";
import { MODE_LIST, MODES, type ModeId } from "@/lib/modes";
import { useAlter, useReducedMotion } from "@/lib/store";
import { hexToRgba } from "@/lib/util";
import { LivingCore } from "@/components/core/LivingCore";
import { Emblem, Icon } from "@/components/ui/Icon";
import { Button, cx } from "@/components/ui/ui";

export default function DreamscapePage() {
  const modeId = useAlter((s) => s.modeId);
  const sound = useAlter((s) => s.settings.ambientSound);
  const update = useAlter((s) => s.updateSettings);
  const setPreview = useAlter((s) => s.setPreview);
  const setUiHidden = useAlter((s) => s.setUiHidden);
  const enterMode = useAlter((s) => s.enterMode);
  const reduced = useReducedMotion();
  const [viewing, setViewing] = useState<ModeId | null>(null);
  const shown: ModeId = viewing ?? modeId;
  const [line, setLine] = useState(0);

  useEffect(() => {
    setPreview(shown === modeId ? null : { modeId: shown, motionScale: 0.8, label: MODES[shown].name });
  }, [shown, modeId, setPreview]);
  useEffect(
    () => () => {
      setPreview(null);
      setUiHidden(false);
    },
    [setPreview, setUiHidden],
  );

  useEffect(() => {
    setLine(0);
    if (reduced) return;
    const t = window.setInterval(() => setLine((l) => l + 1), 14000);
    return () => window.clearInterval(t);
  }, [shown, reduced]);

  const m = MODES[shown];
  const msgs = m.voice.messages;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1100px] flex-col px-4 pb-6 pt-5 sm:px-8 lg:pt-8">
      <header className="text-center">
        <p className="eyebrow !tracking-[0.42em]">Dreamscape</p>
        <p className="mt-2 text-[13px] text-ink/45">A passive space. Nothing here asks anything of you.</p>
      </header>

      <div className="relative min-h-[340px] flex-1">
        <LivingCore className="absolute inset-0" slow scaleBoost={1.04} />
      </div>

      <p key={`${shown}-${line}`} className="anim-fade-in font-display mx-auto min-h-[3.2rem] max-w-xl text-center text-[24px] leading-snug font-light text-ink/80 italic sm:text-[28px]">
        {msgs[line % msgs.length]}
      </p>

      <div role="group" aria-label="Preview an environment" className="mt-5 flex flex-wrap justify-center gap-2">
        {MODE_LIST.map((x) => {
          const active = x.id === shown;
          return (
            <button
              key={x.id}
              aria-pressed={active}
              aria-label={x.name}
              onClick={() => setViewing(x.id === modeId ? null : x.id)}
              className={cx("flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-[12px] tracking-[0.1em] uppercase transition-colors", !active && "border-white/10 text-ink/55 hover:text-ink")}
              style={active ? { borderColor: hexToRgba(x.accent, 0.7), background: hexToRgba(x.accent, 0.14), color: "#fff" } : undefined}
            >
              <span style={{ color: x.accent }}>
                <Emblem modeId={x.id} size={20} />
              </span>
              <span className="hidden sm:inline">{x.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button variant={sound ? "primary" : "ghost"} aria-pressed={sound} onClick={() => update({ ambientSound: !sound })}>
          <Icon name={sound ? "volume" : "mute"} size={16} /> Sound {sound ? "on" : "off"}
        </Button>
        <Button onClick={() => setUiHidden(true)}>
          <Icon name="eyeoff" size={16} /> Hide interface
        </Button>
        {shown !== modeId && (
          <Button variant="primary" onClick={() => { enterMode(shown); setViewing(null); }}>
            Make this my environment
          </Button>
        )}
      </div>
      {shown !== modeId && <p className="mt-3 text-center text-[12px] text-ink/40">Previewing {m.name} — your current environment is unchanged.</p>}
    </div>
  );
}
