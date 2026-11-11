"use client";

import { useEffect, useMemo, useState } from "react";
import { MODE_LIST, MODES, type ModeId } from "@/lib/modes";
import { useAlter } from "@/lib/store";
import { hexToRgba, timeAgo } from "@/lib/util";
import { Emblem, Icon } from "@/components/ui/Icon";
import { Button, Page, PageHeader } from "@/components/ui/ui";

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

export default function InnerUniversePage() {
  const events = useAlter((s) => s.events);
  const currentMode = useAlter((s) => s.modeId);
  const enterMode = useAlter((s) => s.enterMode);
  const setPreview = useAlter((s) => s.setPreview);
  const preview = useAlter((s) => s.previewEnv);
  const narrow = useNarrow();
  const [selected, setSelected] = useState<ModeId | null>(null);
  const sel: ModeId = selected ?? currentMode;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  useEffect(() => () => setPreview(null), [setPreview]);

  const data = useMemo(() => {
    const entered = Object.fromEntries(MODE_LIST.map((m) => [m.id, 0])) as Record<ModeId, number>;
    const out = { ...entered };
    const inn = { ...entered };
    const last: Partial<Record<ModeId, number>> = {};
    const edges = new Map<string, { a: ModeId; b: ModeId; n: number }>();
    for (const e of events) {
      if (e.type !== "environment" && e.type !== "shift") continue;
      entered[e.modeId]++;
      last[e.modeId] = Math.max(last[e.modeId] ?? 0, e.ts);
      if (e.fromModeId && e.fromModeId !== e.modeId) {
        out[e.fromModeId]++;
        inn[e.modeId]++;
        const [a, b] = [e.fromModeId, e.modeId].sort() as [ModeId, ModeId];
        const k = `${a}|${b}`;
        const cur = edges.get(k) ?? { a, b, n: 0 };
        cur.n++;
        edges.set(k, cur);
      }
    }
    return { entered, out, inn, last, edges: [...edges.values()] };
  }, [events]);

  const W = narrow ? 600 : 760;
  const H = narrow ? 760 : 540;
  const cx0 = W / 2;
  const cy0 = H / 2;
  const rx = narrow ? 212 : 285;
  const ry = narrow ? 290 : 180;
  const pos = useMemo(() => {
    const jitter = [0, 0.07, -0.05, 0.04, -0.06, 0.05, -0.03];
    const radial = [1, 0.92, 1.05, 0.9, 1.02, 0.95, 1.04];
    return Object.fromEntries(
      MODE_LIST.map((m, i) => {
        const ang = -Math.PI / 2 + (i / 7) * Math.PI * 2 + jitter[i];
        return [m.id, { x: cx0 + Math.cos(ang) * rx * radial[i], y: cy0 + Math.sin(ang) * ry * radial[i] }];
      }),
    ) as Record<ModeId, { x: number; y: number }>;
  }, [cx0, cy0, rx, ry]);

  const radius = (id: ModeId) => (data.entered[id] === 0 ? 13 : 17 + Math.min(26, Math.sqrt(data.entered[id]) * 7));
  const coreR = 24 + Math.min(20, Math.log2(events.length + 1) * 4);
  const selMode = MODES[sel];
  const isPreviewing = preview?.modeId === sel && sel !== currentMode;

  return (
    <Page wide>
      <PageHeader eyebrow="Your relationship with the seven" title="Inner Universe">
        A constellation built only from what you’ve done. A node grows each time you enter that environment; a line appears when you move between two. Nothing here is inferred.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="surface relative overflow-hidden rounded-3xl p-2 sm:p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label="Constellation of the seven modes">
            <defs>
              <radialGradient id="core-g">
                <stop offset="0" stopColor="#fff2ee" />
                <stop offset="0.35" stopColor="var(--alt-accent)" />
                <stop offset="1" stopColor="var(--alt-glow)" stopOpacity="0.2" />
              </radialGradient>
              {MODE_LIST.map((m) => (
                <radialGradient key={m.id} id={`n-${m.id}`}>
                  <stop offset="0" stopColor={m.accent} stopOpacity="0.95" />
                  <stop offset="0.55" stopColor={m.accent} stopOpacity="0.35" />
                  <stop offset="1" stopColor={m.accent} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {/* Core connections */}
            {MODE_LIST.map((m) => (
              <line key={m.id} x1={cx0} y1={cy0} x2={pos[m.id].x} y2={pos[m.id].y} stroke={m.accent} strokeOpacity={sel === m.id ? 0.4 : 0.1} strokeWidth={1} />
            ))}

            {/* Recorded transitions */}
            {data.edges.map((e) => {
              const A = pos[e.a];
              const B = pos[e.b];
              const mx = (A.x + B.x) / 2 * 0.55 + cx0 * 0.45;
              const my = (A.y + B.y) / 2 * 0.55 + cy0 * 0.45;
              return (
                <path
                  key={`${e.a}-${e.b}`}
                  d={`M${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`}
                  fill="none"
                  stroke={MODES[e.a].accent}
                  strokeOpacity={0.55}
                  strokeWidth={Math.min(7, 1.2 + e.n * 1.1)}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Nascent Core */}
            <g>
              <circle cx={cx0} cy={cy0} r={coreR * 2.4} fill="url(#core-g)" opacity={0.25} />
              <circle cx={cx0} cy={cy0} r={coreR} fill="url(#core-g)" />
              <text x={cx0} y={cy0 + coreR + (narrow ? 30 : 22)} textAnchor="middle" fill="rgba(244,238,240,0.45)" fontSize={narrow ? 17 : 13} letterSpacing="2.5">
                CORE · {events.length} RECORDED
              </text>
            </g>

            {/* Mode nodes */}
            {MODE_LIST.map((m, i) => {
              const p = pos[m.id];
              const r = radius(m.id);
              const active = sel === m.id;
              return (
                <g
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  aria-label={`${m.name}, entered ${data.entered[m.id]} times`}
                  onClick={() => setSelected(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(m.id);
                    }
                  }}
                  className="cursor-pointer outline-none [&:focus-visible_.ring]:stroke-white"
                  style={{ animation: `floaty ${7 + i}s ease-in-out ${i * 0.6}s infinite` }}
                >
                  <circle cx={p.x} cy={p.y} r={r * 2.6} fill={`url(#n-${m.id})`} opacity={data.entered[m.id] === 0 ? 0.35 : 0.8} />
                  <circle cx={p.x} cy={p.y} r={r} fill={hexToRgba(m.accent, data.entered[m.id] === 0 ? 0.18 : 0.5)} stroke={m.accent} strokeWidth={active ? 2.4 : 1.2} />
                  <circle className="ring" cx={p.x} cy={p.y} r={r + 7} fill="none" stroke={active ? m.accent : "transparent"} strokeOpacity={0.5} strokeDasharray="2 5" />
                  <text x={p.x} y={p.y + r + (narrow ? 30 : 22)} textAnchor="middle" fill={active ? "#fff" : "rgba(244,238,240,0.7)"} fontSize={narrow ? 20 : 15} letterSpacing="2">
                    {m.name.toUpperCase()}
                  </text>
                  {data.entered[m.id] > 0 && (
                    <text x={p.x} y={p.y + (narrow ? 7 : 5)} textAnchor="middle" fill="#fff" fontSize={narrow ? 20 : 16} fontWeight={600}>
                      {data.entered[m.id]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {events.length === 0 && (
            <p className="eyebrow px-4 pb-3 text-center !text-[10.5px] !tracking-[0.2em]">Enter a few environments and the constellation will begin to grow</p>
          )}
        </div>

        <aside className="surface h-fit rounded-3xl p-5 sm:p-6" aria-live="polite">
          <div className="flex items-center gap-4">
            <span style={{ color: selMode.accent }}>
              <Emblem modeId={sel} size={40} />
            </span>
            <div>
              <p className="eyebrow">{sel === currentMode ? "Current environment" : "Selected"}</p>
              <h2 className="font-display mt-1 text-[28px] leading-none tracking-[0.04em] uppercase">{selMode.name}</h2>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-ink/55">{selMode.territory}</p>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              ["Entered", data.entered[sel]],
              ["Moved to", data.inn[sel]],
              ["Moved from", data.out[sel]],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] py-3">
                <dd className="font-display text-[30px] leading-none">{v}</dd>
                <dt className="mt-1.5 text-[10.5px] tracking-[0.12em] text-ink/45 uppercase">{k}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[12.5px] text-ink/45">
            {data.last[sel] && now ? `Last entered ${timeAgo(data.last[sel]!, now)}.` : "Not entered yet in your recorded history."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant={isPreviewing ? "primary" : "ghost"}
              disabled={sel === currentMode}
              onClick={() => setPreview(isPreviewing ? null : { modeId: sel, motionScale: 1, label: selMode.name })}
            >
              <Icon name="eye" size={16} /> {isPreviewing ? "Previewing" : "Preview"}
            </Button>
            <Button variant="primary" disabled={sel === currentMode} onClick={() => enterMode(sel)}>
              Enter
            </Button>
          </div>
        </aside>
      </div>
    </Page>
  );
}
