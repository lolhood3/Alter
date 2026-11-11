"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CORE_STATES } from "@/lib/coreStates";
import { MODES } from "@/lib/modes";
import { useAlter, useDisplayModeId } from "@/lib/store";
import { greetingFor } from "@/lib/util";
import { LivingCore } from "@/components/core/LivingCore";
import { Icon } from "@/components/ui/Icon";
import { StatePill } from "@/components/ui/ui";
import { ModeSelector } from "@/components/shell/ModeSelector";

const pill =
  "inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full border px-8 text-[13px] font-medium tracking-[0.2em] uppercase transition-[background,border-color,transform,box-shadow] duration-[var(--m-snappy)] active:scale-[0.98]";

export default function LivingCorePage() {
  const modeId = useDisplayModeId();
  const m = MODES[modeId];
  const state = useAlter((s) => s.coreState);
  const openDialog = useAlter((s) => s.openDialog);
  const proposal = useAlter((s) => s.proposal);
  const [greeting, setGreeting] = useState("");
  useEffect(() => setGreeting(greetingFor(new Date())), []);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1000px] flex-col px-4 pb-5 pt-5 sm:px-8 lg:pt-7">
      <header className="text-center">
        <div className="flex items-center justify-center gap-5">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-white/20 sm:w-20" />
          <p className="eyebrow !tracking-[0.42em]">{greeting ? `${greeting} · ` : ""}Living Core</p>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-white/20 sm:w-20" />
        </div>
        <h1 key={m.id} className="anim-fade-up font-display mt-3 text-[36px] leading-[1.04] font-light text-ink sm:text-[48px] xl:text-[54px]">
          {m.headline[0]}
          <em className="text-accent">
            {m.headline[1]}
            {m.headline[2]}
          </em>
        </h1>
      </header>

      <div className="relative min-h-[300px] flex-1 sm:min-h-[340px]">
        <LivingCore className="absolute inset-0" />
      </div>

      <div className="flex flex-col items-center">
        <StatePill state={state} />
        <p key={state} className="anim-fade-in font-display mt-2 text-[21px] leading-snug text-ink/70 italic">
          {CORE_STATES[state].tagline}
        </p>
        <div className="mt-4 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Link href="/match" className={`${pill} accent-tint w-full text-ink shadow-[0_0_36px_-12px_var(--alt-accent)] hover:bg-accent/20 sm:w-[210px]`}>
            <Icon name="match" size={19} /> MATCH
          </Link>
          <Link href="/shift" className={`${pill} w-full border-white/10 bg-white/[0.03] text-ink/90 hover:border-white/25 hover:bg-white/[0.07] sm:w-[210px]`}>
            <Icon name="shift" size={19} /> SHIFT
          </Link>
        </div>
        <button
          onClick={() => openDialog("reality")}
          className="relative mt-3 inline-flex min-h-11 items-center gap-2.5 rounded-full border border-white/10 bg-black/30 px-6 text-[12px] font-medium tracking-[0.2em] text-ink/85 uppercase transition-colors hover:border-white/25 hover:bg-white/[0.06]"
        >
          <Icon name="sparkle" size={16} /> Reality Shift
          {proposal && <span aria-label="An environment is proposed" className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--alt-accent)]" />}
        </button>
      </div>

      <ModeSelector className="mt-5" />
    </div>
  );
}
