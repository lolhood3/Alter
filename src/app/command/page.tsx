"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { CORE_STATE_LIST } from "@/lib/coreStates";
import { MODE_LIST, MODES, resolveMode } from "@/lib/modes";
import { NAV_ITEMS } from "@/lib/nav";
import { isReduced, useAlter, type Settings, type TransitionStyle } from "@/lib/store";
import { Page, PageHeader, cx } from "@/components/ui/ui";

interface Line {
  kind: "in" | "out" | "err" | "sys";
  text: string;
}

const HELP = [
  "Allowlisted commands — nothing else is ever executed:",
  "  help                     show this list",
  "  status                   mode, Core state, environment, session",
  "  mode                     inspect the current mode",
  "  mode list                list the seven modes",
  "  mode <name>              enter a mode (e.g. mode moon-knight)",
  "  state                    inspect the Core state",
  "  state list               list the eight Core states",
  "  settings                 show current settings",
  "  set <key> <value>        change a setting (keys: reduced-motion, core-intensity,",
  "                           particle-intensity, ambient, compact, transition, record)",
  "  echoes                   show the five most recent echoes",
  "  open <page>              navigate (core, modes, match, shift, echoes, universe,",
  "                           dreamscape, timeline, command, settings)",
  "  history                  commands entered this session",
  "  clear                    clear the screen",
  "  clear-history confirm    delete recorded echoes",
  "  reset confirm            reset the demo (settings, mode and echoes)",
];

const QUICK = ["help", "status", "mode list", "state", "settings", "echoes"];

function onOff(v: string): boolean | null {
  if (["on", "true", "yes", "1"].includes(v)) return true;
  if (["off", "false", "no", "0"].includes(v)) return false;
  return null;
}

export default function CommandPage() {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([
    { kind: "sys", text: "ALTER Command 1.0 — local control surface. Type `help` to begin." },
  ]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const out: Line[] = [{ kind: "in", text: cmd }];
    const say = (t: string | string[]) => (Array.isArray(t) ? t : [t]).forEach((x) => out.push({ kind: "out", text: x }));
    const err = (t: string) => out.push({ kind: "err", text: t });
    const s = useAlter.getState();
    const [head, ...args] = cmd.toLowerCase().split(/\s+/);
    let valid = true;

    switch (head) {
      case "help":
      case "?":
        say(HELP);
        break;
      case "status": {
        const m = MODES[s.modeId];
        say([
          `mode         ${m.name}`,
          `core state   ${s.coreState}`,
          `environment  ${s.env.name} (pace ×${s.env.motionScale})`,
          `session      ${s.sessionEntered} environment(s) entered`,
          `echoes       ${s.events.length} recorded${s.settings.recordEchoes ? "" : " (recording off)"}`,
          `motion       ${isReduced(s) ? "reduced" : "full"}`,
        ]);
        break;
      }
      case "mode": {
        if (args.length === 0) {
          const m = MODES[s.modeId];
          say([m.name.toUpperCase(), m.tagline, `territory: ${m.territory}`, `voice: ${m.voice.style}`, `motion: ${m.motion.personality}`, `particles: ${m.env.particle.description}`]);
        } else if (args[0] === "list") {
          MODE_LIST.forEach((m, i) => say(`  ${i + 1}  ${m.id.padEnd(14)} ${m.name}${m.id === s.modeId ? "   ← current" : ""}`));
        } else {
          const id = resolveMode(args.join(" "));
          if (!id) {
            err(`Unknown mode “${args.join(" ")}”. Try \`mode list\`.`);
            valid = false;
          } else if (id === s.modeId && s.env.source === "manual") say(`Already in ${MODES[id].name}.`);
          else {
            s.enterMode(id);
            say(`Entered ${MODES[id].name}.`);
          }
        }
        break;
      }
      case "state": {
        if (args[0] === "list") {
          CORE_STATE_LIST.forEach((c) => say(`  ${c.label.padEnd(14)} ${c.behavior}${c.id === s.coreState ? "   ← now" : ""}`));
        } else {
          const c = CORE_STATE_LIST.find((x) => x.id === s.coreState)!;
          say([c.label.toUpperCase(), c.behavior, c.description]);
        }
        break;
      }
      case "settings": {
        const st = s.settings;
        say([
          `reduced-motion      ${st.reducedMotion === null ? "system" : st.reducedMotion ? "on" : "off"}  (effective: ${isReduced(s) ? "on" : "off"})`,
          `core-intensity      ${st.coreIntensity}`,
          `particle-intensity  ${st.particleIntensity}`,
          `ambient             ${st.ambientSound ? "on" : "off"}`,
          `compact             ${st.compactComm ? "on" : "off"}`,
          `transition          ${st.transitionStyle}`,
          `record              ${st.recordEchoes ? "on" : "off"}`,
        ]);
        break;
      }
      case "set": {
        const [key, val] = args;
        if (!key || val === undefined) {
          err("Usage: set <key> <value>. See `help`.");
          valid = false;
          break;
        }
        const patch: Partial<Settings> = {};
        let bad = false;
        if (key === "reduced-motion") {
          if (val === "system") patch.reducedMotion = null;
          else if (onOff(val) !== null) patch.reducedMotion = onOff(val)!;
          else bad = true;
        } else if (key === "core-intensity" || key === "particle-intensity") {
          const n = Number(val);
          if (!Number.isFinite(n) || n < 0 || n > 100) bad = true;
          else if (key === "core-intensity") patch.coreIntensity = Math.round(n);
          else patch.particleIntensity = Math.round(n);
        } else if (key === "ambient" || key === "compact" || key === "record") {
          const b = onOff(val);
          if (b === null) bad = true;
          else if (key === "ambient") patch.ambientSound = b;
          else if (key === "compact") patch.compactComm = b;
          else patch.recordEchoes = b;
        } else if (key === "transition") {
          if (["reduced", "standard", "immersive"].includes(val)) patch.transitionStyle = val as TransitionStyle;
          else bad = true;
        } else {
          err(`Unknown setting “${key}”.`);
          valid = false;
          break;
        }
        if (bad) {
          err(`Invalid value “${val}” for ${key}.`);
          valid = false;
        } else {
          s.updateSettings(patch);
          say(`${key} → ${val}`);
        }
        break;
      }
      case "echoes": {
        if (s.events.length === 0) say("No echoes recorded.");
        else s.events.slice(0, 5).forEach((e) => say(`  ${new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}  ${e.title}`));
        break;
      }
      case "open": {
        const target = NAV_ITEMS.find((i) => i.alias === args[0] || i.href === `/${args[0]}`);
        if (!target) {
          err(`Unknown page “${args[0] ?? ""}”.`);
          valid = false;
        } else {
          say(`Opening ${target.label}…`);
          window.setTimeout(() => router.push(target.href), 250);
        }
        break;
      }
      case "history":
        if (history.length === 0) say("No commands yet.");
        else history.forEach((h, i) => say(`  ${String(i + 1).padStart(2)}  ${h}`));
        break;
      case "clear":
        setLines([]);
        setHistory((h) => [...h, cmd]);
        setValue("");
        return;
      case "clear-history":
        if (args[0] === "confirm") {
          s.clearHistory();
          say("Echoes cleared.");
        } else say("This deletes all recorded echoes. Run `clear-history confirm` to proceed.");
        break;
      case "reset":
        if (args[0] === "confirm") {
          s.resetDemo();
          say("Demo state reset: settings, mode and echoes are back to defaults.");
        } else say("This resets settings, mode and echoes. Run `reset confirm` to proceed.");
        break;
      default:
        err(`Command not found: “${head}”. Type \`help\` for the allowlist.`);
        valid = false;
    }

    if (valid && head !== "reset") s.flashCore("interpreting", 700);
    setLines((l) => [...l, ...out]);
    setHistory((h) => [...h, cmd]);
    setHIdx(null);
    setValue("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = hIdx === null ? history.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(i);
      setValue(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx === null) return;
      const i = hIdx + 1;
      if (i >= history.length) {
        setHIdx(null);
        setValue("");
      } else {
        setHIdx(i);
        setValue(history[i]);
      }
    }
  };

  return (
    <Page>
      <PageHeader eyebrow="Direct local control" title="ALTER Command">
        A terminal-style surface for inspecting and steering ALTER. It only understands the commands listed in <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[13px]">help</code> — it never runs shell commands or arbitrary code.
      </PageHeader>

      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => {
              run(q);
              inputRef.current?.focus();
            }}
            className="min-h-10 rounded-full border border-white/10 bg-white/[0.03] px-4 font-mono text-[12px] text-ink/70 transition-colors hover:border-accent/40 hover:text-ink"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="surface-solid overflow-hidden rounded-3xl" onClick={() => inputRef.current?.focus()}>
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-accent/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="eyebrow ml-3 !text-[10px]">alter://command</span>
        </div>
        <div className="thin-scroll h-[min(52dvh,460px)] overflow-y-auto px-5 py-4 font-mono text-[12.5px] leading-[1.7]" role="log" aria-live="polite">
          {lines.map((l, i) => (
            <pre
              key={i}
              className={cx(
                "font-[inherit] break-words whitespace-pre-wrap",
                l.kind === "in" && "mt-2 text-ink",
                l.kind === "out" && "text-ink/65",
                l.kind === "err" && "text-red-300/90",
                l.kind === "sys" && "text-accent/90",
              )}
            >
              {l.kind === "in" ? `› ${l.text}` : l.text}
            </pre>
          ))}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(value);
          }}
          className="flex items-center gap-3 border-t border-white/[0.06] px-5"
        >
          <span aria-hidden className="font-mono text-accent">›</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            aria-label="Command input"
            placeholder="type a command…"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            maxLength={120}
            className="h-14 min-w-0 flex-1 bg-transparent font-mono text-[13px] text-ink placeholder:text-ink/30 focus:outline-none"
          />
        </form>
      </div>
    </Page>
  );
}
