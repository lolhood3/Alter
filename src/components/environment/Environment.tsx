"use client";

import { useEffect, useRef } from "react";
import { MODE_LIST, MODES, type ModeConfig, type ModeId, type ParticleKind } from "@/lib/modes";
import { useAlter, useDisplayModeId, useReducedMotion } from "@/lib/store";
import { hexToRgba } from "@/lib/util";

/** Static per-mode lighting layer. All seven are mounted; only the active one is visible. */
function lightingBackground(m: ModeConfig) {
  const lights = m.env.lights
    .map((l) => `radial-gradient(${l.w}% ${l.h}% at ${l.x}% ${l.y}%, ${hexToRgba(l.c, l.a)}, transparent 72%)`)
    .join(", ");
  return `${lights}, linear-gradient(180deg, ${m.bg0} 0%, ${m.bg1} 100%)`;
}

export function Environment() {
  const modeId = useDisplayModeId();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  // Optional parallax — pointer position is written straight to CSS variables (no re-render).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduced) {
      el?.style.setProperty("--px", "0");
      el?.style.setProperty("--py", "0");
      return;
    }
    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--px", String((e.clientX / window.innerWidth - 0.5) * 2));
      el.style.setProperty("--py", String((e.clientY / window.innerHeight - 0.5) * 2));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#060307]">
      {/* Layer 1 — lighting & colour grade, one per mode, cross-faded */}
      {MODE_LIST.map((m) => (
        <div
          key={m.id}
          className="absolute inset-0 transition-opacity duration-[var(--m-gentle)] ease-in-out"
          style={{ background: lightingBackground(m), opacity: m.id === modeId ? 1 : 0 }}
        />
      ))}

      {/* Layer 2 — far light ribbons (slow parallax) */}
      <svg
        className="absolute -inset-[6%] h-[112%] w-[112%] opacity-70 transition-transform duration-700 ease-out"
        style={{ transform: "translate3d(calc(var(--px, 0) * -14px), calc(var(--py, 0) * -9px), 0)" }}
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="rib-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--alt-accent)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--alt-accent)" stopOpacity="0.5" />
            <stop offset="1" stopColor="var(--alt-accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rib-b" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--alt-accent2)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--alt-accent2)" stopOpacity="0.38" />
            <stop offset="1" stopColor="var(--alt-accent2)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-40 330 C 160 190, 330 120, 560 -30" fill="none" stroke="url(#rib-a)" strokeWidth="1.4" />
        <path d="M-60 360 C 150 230, 330 150, 600 -20" fill="none" stroke="url(#rib-a)" strokeWidth="5" opacity="0.28" />
        <path d="M1660 650 C 1480 520, 1340 440, 1160 250" fill="none" stroke="url(#rib-b)" strokeWidth="1.4" />
        <path d="M1700 680 C 1500 560, 1360 470, 1180 260" fill="none" stroke="url(#rib-b)" strokeWidth="6" opacity="0.2" />
        <path d="M-40 930 C 140 820, 220 760, 330 700" fill="none" stroke="url(#rib-a)" strokeWidth="1.2" opacity="0.7" />
      </svg>

      {/* Layer 3 — sparse particles */}
      <Particles modeId={modeId} reduced={reduced} />

      {/* Layer 4 — vignette for depth */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 100% at 50% 45%, transparent 40%, rgba(2,1,4,0.72) 100%)" }}
      />
    </div>
  );
}

/* ------------------------------ Particles ------------------------------ */

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  a: number;
  ph: number;
  lane: number;
}

function seed(kind: ParticleKind, n: number): P[] {
  return Array.from({ length: n }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.01,
    vy: 0,
    s: 0.5 + Math.random(),
    a: 0.3 + Math.random() * 0.7,
    ph: Math.random() * Math.PI * 2,
    lane: kind === "data" ? Math.floor(Math.random() * 14) / 14 + 0.02 : i,
  }));
}

function Particles({ modeId, reduced }: { modeId: ModeId; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const intensity = useAlter((s) => s.settings.particleIntensity);
  const cfg = MODES[modeId].env.particle;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const count = Math.round((cfg.count * intensity) / 50);
    if (count <= 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const kind = cfg.kind;
    const ps = seed(kind, Math.min(count, 90));
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let fade = 0;
    let t = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = fade;
      for (const p of ps) {
        const x = p.x * w;
        const y = p.y * h;
        const tw = 0.5 + 0.5 * Math.sin(t * 1.6 + p.ph);
        switch (kind) {
          case "dust": {
            ctx.fillStyle = hexToRgba(cfg.color, 0.1 + p.a * 0.22 * (0.6 + 0.4 * tw));
            ctx.beginPath();
            ctx.arc(x, y, 1 + p.s * 1.6, 0, 6.283);
            ctx.fill();
            break;
          }
          case "motes": {
            ctx.fillStyle = hexToRgba(cfg.color, 0.1 + p.a * 0.45 * tw);
            ctx.beginPath();
            ctx.arc(x, y, 0.6 + p.s * 0.7, 0, 6.283);
            ctx.fill();
            break;
          }
          case "embers": {
            const fl = 0.4 + 0.6 * Math.abs(Math.sin(t * 7 + p.ph * 3));
            ctx.fillStyle = hexToRgba(cfg.color, 0.15 + p.a * 0.5 * fl);
            ctx.fillRect(x, y, 1 + p.s * 1.4, 1 + p.s * 2.2);
            break;
          }
          case "data": {
            ctx.fillStyle = hexToRgba(cfg.color, 0.12 + p.a * 0.3);
            ctx.fillRect(x, p.lane * h, 10 + p.s * 26, 1);
            ctx.fillRect(x + 14 + p.s * 26, p.lane * h - 1, 2, 3);
            break;
          }
          case "orbs": {
            ctx.strokeStyle = hexToRgba(cfg.color, 0.12 + p.a * 0.3);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 3 + p.s * 7, 0, 6.283);
            ctx.stroke();
            break;
          }
          case "sparks": {
            ctx.strokeStyle = hexToRgba(cfg.color, 0.18 + p.a * 0.5 * tw);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 7 - p.s * 7, y + 5 + p.s * 5);
            ctx.stroke();
            break;
          }
          case "ooze": {
            const r = 28 + p.s * 70;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, hexToRgba(cfg.color, 0.09 * (0.6 + 0.4 * tw)));
            g.addColorStop(1, hexToRgba(cfg.color, 0));
            ctx.fillStyle = g;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
            break;
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const step = (dt: number) => {
      t += dt;
      for (const p of ps) {
        switch (kind) {
          case "dust":
            p.y -= dt * 0.012 * (0.5 + p.s);
            p.x += Math.sin(t * 0.4 + p.ph) * dt * 0.006;
            break;
          case "motes":
            p.y += dt * 0.014 * (0.5 + p.s * 0.5);
            p.x += Math.sin(t * 0.3 + p.ph) * dt * 0.004;
            break;
          case "embers":
            p.y -= dt * 0.07 * (0.4 + p.s);
            p.x += Math.sin(t * 2 + p.ph) * dt * 0.02;
            break;
          case "data":
            p.x += dt * 0.05 * (0.5 + p.s);
            break;
          case "orbs":
            p.y -= dt * 0.028 * (0.5 + p.s);
            p.x += Math.sin(t * 0.9 + p.ph) * dt * 0.02;
            break;
          case "sparks":
            p.y -= dt * 0.05 * (0.4 + p.s);
            p.x += dt * 0.035 * (0.4 + p.s);
            break;
          case "ooze":
            p.x += Math.cos(t * 0.12 + p.ph) * dt * 0.012;
            p.y += Math.sin(t * 0.1 + p.ph * 2) * dt * 0.012;
            break;
        }
        if (p.y < -0.05) p.y = 1.05;
        if (p.y > 1.05) p.y = -0.05;
        if (p.x > 1.05) p.x = -0.05;
        if (p.x < -0.05) p.x = 1.05;
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      fade = Math.min(1, fade + dt * 0.9);
      step(dt);
      draw();
    };

    if (reduced) {
      fade = 1;
      draw(); // a single still frame
    } else {
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [cfg, intensity, reduced]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
