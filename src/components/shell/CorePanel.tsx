"use client";

import { useState, type FormEvent } from "react";
import { MODES } from "@/lib/modes";
import { useAlter, useDisplayModeId } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { Modal, cx } from "@/components/ui/ui";

export function CoreOrb({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 32% 28%, #fff4f0 0%, var(--alt-accent) 28%, var(--alt-glow) 62%, color-mix(in srgb, var(--alt-bg0) 70%, black) 100%)",
        boxShadow: "0 0 18px -2px color-mix(in srgb, var(--alt-accent) 70%, transparent)",
      }}
    />
  );
}

export function useCoreLine(): string {
  const modeId = useDisplayModeId();
  const seed = useAlter((s) => s.messageSeed);
  const line = useAlter((s) => s.coreLine);
  const msgs = MODES[modeId].voice.messages;
  return line ?? msgs[seed % msgs.length];
}

/** Core communication surface: current message, optional input, expanded thread. */
export function CorePanel() {
  const message = useCoreLine();
  const compact = useAlter((s) => s.settings.compactComm);
  const nextLine = useAlter((s) => s.nextLine);
  const openDialog = useAlter((s) => s.openDialog);
  const sendMessage = useAlter((s) => s.sendMessage);
  const setCore = useAlter((s) => s.setCore);
  const settle = useAlter((s) => s.settle);
  const [text, setText] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  return (
    <section aria-label="Core communication">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CoreOrb />
          <span className="eyebrow">Core</span>
        </div>
        <div className="flex items-center gap-1">
          {!compact && (
            <button
              onClick={nextLine}
              aria-label="Show another message from the Core"
              title="Another message"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-white/5 hover:text-ink"
            >
              <Icon name="refresh" size={17} />
            </button>
          )}
          <button
            onClick={() => openDialog("comm")}
            aria-label="Open the expanded conversation"
            title="Expand"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-white/5 hover:text-ink"
          >
            <Icon name="expand" size={17} />
          </button>
        </div>
      </div>

      <blockquote
        key={message}
        className="anim-fade-up font-display border-l-2 border-accent pl-4 text-[23px] leading-[1.25] font-light text-ink/95 italic"
      >
        {message}
      </blockquote>

      {!compact && (
        <form onSubmit={submit} className="mt-4 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setCore("listening")}
            onBlur={() => settle()}
            maxLength={300}
            aria-label="Say something to the Core (optional)"
            placeholder="Say something, if you like…"
            className="h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[13px] text-ink placeholder:text-ink/35 focus:border-accent/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-ink transition-opacity disabled:opacity-30"
          >
            <Icon name="send" size={16} />
          </button>
        </form>
      )}
    </section>
  );
}

export function CommunicationDialog() {
  const open = useAlter((s) => s.dialog === "comm");
  const openDialog = useAlter((s) => s.openDialog);
  const thread = useAlter((s) => s.thread);
  const modeId = useDisplayModeId();
  const sendMessage = useAlter((s) => s.sendMessage);
  const record = useAlter((s) => s.settings.recordEchoes);
  const message = useCoreLine();
  const [text, setText] = useState("");
  const mode = MODES[modeId];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  return (
    <Modal open={open} onClose={() => openDialog(null)} title="Talk with the Core" wide>
      <p className="eyebrow mb-4">{mode.name} · {mode.voice.style}</p>
      <div className="thin-scroll mb-5 flex max-h-[44dvh] min-h-40 flex-col gap-3 overflow-y-auto pr-1" aria-live="polite">
        <div className="flex gap-3">
          <CoreOrb size={26} />
          <p className="font-display text-[21px] leading-snug text-ink/90 italic">{message}</p>
        </div>
        {thread.map((m) => (
          <div key={m.id} className={cx("flex gap-3", m.from === "you" && "justify-end")}>
            {m.from === "core" && <CoreOrb size={26} />}
            <p
              className={cx(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                m.from === "you" ? "bg-white/[0.07] text-ink" : "font-display text-[20px] text-ink/90 italic",
              )}
            >
              {m.text}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          aria-label="Your message"
          placeholder="Write to the Core…"
          className="h-12 min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[14px] text-ink placeholder:text-ink/35 focus:border-accent/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="accent-tint inline-flex h-12 items-center gap-2 rounded-full border px-5 text-[12px] font-medium tracking-[0.16em] uppercase disabled:opacity-30"
        >
          Send <Icon name="send" size={15} />
        </button>
      </form>
      <p className="mt-4 text-[12px] leading-relaxed text-ink/45">
        The Core’s replies are authored for each mode. It is not an AI and does not analyze your words.{" "}
        {record ? "Messages you send are kept in Echoes on this device only." : "Echoes recording is off, so nothing is saved."}
      </p>
    </Modal>
  );
}
