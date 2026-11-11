"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MODES, type ModeId } from "@/lib/modes";
import { CORE_STATES, type CoreStateId } from "@/lib/coreStates";
import { useAlter, useReducedMotion } from "@/lib/store";
import { clamp } from "@/lib/util";
import {
  BODY_FRAGMENT,
  GLOW_FRAGMENT,
  GLOW_VERTEX,
  INNER_FRAGMENT,
  SHELL_FRAGMENT,
  VERTEX,
} from "./shaders";

// Colours are authored in sRGB and written straight to the canvas.
THREE.ColorManagement.enabled = false;

const NUM_KEYS = [
  "deform", "freq", "ridge", "elastic", "vein", "veinSharp", "flow", "fresnel", "gloss", "spec",
  "bands", "struct", "irid", "inner", "glow", "bodyAlpha", "scale", "speed", "pulse",
  "breathAmp", "breathRate", "spin", "alpha",
] as const;
type NumKey = (typeof NUM_KEYS)[number];
const COLOR_KEYS = ["colA", "colB", "colHot", "colRim", "body"] as const;
type ColorKey = (typeof COLOR_KEYS)[number];

interface Live {
  modeId: ModeId;
  stateId: CoreStateId;
  intensity: number;
  reduced: boolean;
  motionScale: number;
  slow: boolean;
  interactive: boolean;
  scaleBoost: number;
}

function computeTarget(L: Live): Record<NumKey, number> {
  const look = MODES[L.modeId].look;
  const m = CORE_STATES[L.stateId].mod;
  const k = 0.4 + L.intensity / 100; // 0.4 – 1.4, 1.0 at the default of 60
  const r = L.reduced ? 0 : 1;
  return {
    deform: look.deform * m.deform * (0.7 + 0.3 * k),
    freq: look.freq,
    ridge: look.ridge,
    elastic: look.elastic * r,
    vein: look.vein * m.vein * k,
    veinSharp: look.veinSharp,
    flow: look.flow * m.flow,
    fresnel: look.fresnel,
    gloss: look.gloss,
    spec: look.spec,
    bands: look.bands,
    struct: look.struct,
    irid: look.irid,
    inner: look.inner * m.inner * k,
    glow: look.glow * m.glow * k,
    bodyAlpha: look.bodyAlpha,
    scale: m.scale * L.scaleBoost,
    speed: r * look.speed * m.speed * L.motionScale * (L.slow ? 0.55 : 1),
    pulse: m.pulse * r,
    breathAmp: m.breathAmp * r,
    breathRate: m.breathRate,
    spin: m.spin * r * L.motionScale,
    alpha: clamp(0.62 + 0.38 * k, 0.4, 1.1),
  };
}

export function LivingCore({
  className = "",
  modeId,
  stateId,
  motionScale,
  slow = false,
  interactive = true,
  scaleBoost = 1,
}: {
  className?: string;
  modeId?: ModeId;
  stateId?: CoreStateId;
  motionScale?: number;
  slow?: boolean;
  interactive?: boolean;
  scaleBoost?: number;
}) {
  const storeMode = useAlter((s) => s.previewEnv?.modeId ?? s.modeId);
  const storeScale = useAlter((s) => s.previewEnv?.motionScale ?? s.env.motionScale);
  const storeState = useAlter((s) => s.coreState);
  const intensity = useAlter((s) => s.settings.coreIntensity);
  const reduced = useReducedMotion();

  const mode = modeId ?? storeMode;
  const state = stateId ?? storeState;

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef<Live>({
    modeId: mode, stateId: state, intensity, reduced,
    motionScale: motionScale ?? storeScale, slow, interactive, scaleBoost,
  });
  const dirty = useRef(true);
  const [failed, setFailed] = useState(false);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    live.current = {
      modeId: mode, stateId: state, intensity, reduced,
      motionScale: motionScale ?? storeScale, slow, interactive, scaleBoost,
    };
    dirty.current = true;
  }, [mode, state, intensity, reduced, motionScale, storeScale, slow, interactive, scaleBoost]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    const CAM_Z = 5.2;
    camera.position.z = CAM_Z;

    const group = new THREE.Group();
    scene.add(group);

    // ---- shared uniforms (one set of values, many layers) ----
    const col = (hex: string) => new THREE.Color(hex);
    const startNum = computeTarget(live.current);
    const look = MODES[live.current.modeId].look;
    const shared = {
      uTime: { value: 3.7 },
      uDeform: { value: startNum.deform },
      uFreq: { value: startNum.freq },
      uRidge: { value: startNum.ridge },
      uElastic: { value: startNum.elastic },
      uVein: { value: startNum.vein },
      uVeinSharp: { value: startNum.veinSharp },
      uFlow: { value: startNum.flow },
      uFresnel: { value: startNum.fresnel },
      uGloss: { value: startNum.gloss },
      uSpec: { value: startNum.spec },
      uBands: { value: startNum.bands },
      uStruct: { value: startNum.struct },
      uIrid: { value: startNum.irid },
      uAlpha: { value: startNum.alpha },
      uBodyAlpha: { value: startNum.bodyAlpha },
      uColA: { value: col(look.colA) },
      uColB: { value: col(look.colB) },
      uColHot: { value: col(look.colHot) },
      uColRim: { value: col(look.colRim) },
      uBody: { value: col(look.body) },
    };

    const outerGeo = new THREE.SphereGeometry(1, 128, 96);
    const innerGeo = new THREE.SphereGeometry(1, 64, 48);
    const glowGeo = new THREE.PlaneGeometry(4.6, 4.6);

    const baseMat = (extra: Partial<THREE.ShaderMaterialParameters>) =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        vertexShader: VERTEX,
        ...extra,
      });

    const backMat = baseMat({
      fragmentShader: SHELL_FRAGMENT,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: { ...shared, uRadius: { value: 1 }, uPhase: { value: 0 }, uLayer: { value: 0.5 } },
    });
    const bodyMat = baseMat({
      fragmentShader: BODY_FRAGMENT,
      side: THREE.FrontSide,
      blending: THREE.NormalBlending,
      uniforms: { ...shared, uRadius: { value: 1 }, uPhase: { value: 0 } },
    });
    const frontMat = baseMat({
      fragmentShader: SHELL_FRAGMENT,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      uniforms: { ...shared, uRadius: { value: 1 }, uPhase: { value: 0 }, uLayer: { value: 1 } },
    });
    const innerDeform = { value: startNum.deform * 0.8 };
    const innerFreq = { value: startNum.freq * 1.3 };
    const innerAlpha = { value: startNum.inner };
    const innerMat = baseMat({
      fragmentShader: INNER_FRAGMENT,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: shared.uTime,
        uDeform: innerDeform,
        uFreq: innerFreq,
        uRidge: { value: 0 },
        uElastic: { value: 0 },
        uRadius: { value: 0.54 },
        uPhase: { value: 5.3 },
        uFlow: shared.uFlow,
        uAlpha: innerAlpha,
        uColA: shared.uColA,
        uColHot: shared.uColHot,
        uColRim: shared.uColRim,
      },
    });
    const glowU = {
      uColA: shared.uColA,
      uColB: shared.uColB,
      uColRim: shared.uColRim,
      uGlow: { value: startNum.glow },
      uPulseAmp: { value: 0 },
      uPulseT: { value: 0 },
    };
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: GLOW_VERTEX,
      fragmentShader: GLOW_FRAGMENT,
      uniforms: glowU,
    });

    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = -0.8;
    glow.renderOrder = -1;
    scene.add(glow);

    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.renderOrder = 0;
    const back = new THREE.Mesh(outerGeo, backMat);
    back.renderOrder = 1;
    const body = new THREE.Mesh(outerGeo, bodyMat);
    body.renderOrder = 2;
    const front = new THREE.Mesh(outerGeo, frontMat);
    front.renderOrder = 3;
    group.add(inner, back, body, front);

    // ---- animated state (smoothed towards the target each frame) ----
    const cur = { ...startNum } as Record<NumKey, number>;
    const curColors = {} as Record<ColorKey, THREE.Color>;
    const colorUniform: Record<ColorKey, THREE.Color> = {
      colA: shared.uColA.value, colB: shared.uColB.value, colHot: shared.uColHot.value,
      colRim: shared.uColRim.value, body: shared.uBody.value,
    };
    COLOR_KEYS.forEach((c) => (curColors[c] = colorUniform[c]));
    const tmp = new THREE.Color();

    let time = 3.7;
    let clockT = 0;
    let spinAngle = 0.6;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let visible = true;
    let sizeOk = false;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w < 2 || h < 2) {
        sizeOk = false;
        return;
      }
      sizeOk = true;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(w, h, false);
      const aspect = w / h;
      const visMin = 2.8; // world units that must stay visible on the short axis
      const visH = aspect >= 1 ? visMin : visMin / aspect;
      camera.aspect = aspect;
      camera.fov = (2 * Math.atan(visH / 2 / CAM_Z) * 180) / Math.PI;
      camera.updateProjectionMatrix();
      dirty.current = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      dirty.current = true;
    });
    io.observe(wrap);

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      mouse.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.3, 1.3);
      mouse.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1.3, 1.3);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const onLost = (e: Event) => {
      e.preventDefault();
      setLost(true);
    };
    const onRestored = () => {
      setLost(false);
      dirty.current = true;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || !sizeOk) {
        last = now;
        return;
      }
      if (renderer.getContext().isContextLost()) return;
      const L = live.current;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const tgt = computeTarget(L);
      const k = 1 - Math.exp(-dt * (L.reduced ? 7 : 2.4));
      let delta = 0;
      for (const key of NUM_KEYS) {
        const d = tgt[key] - cur[key];
        cur[key] += d * k;
        delta += Math.abs(d);
      }
      const lookT = MODES[L.modeId].look;
      for (const c of COLOR_KEYS) {
        tmp.set(lookT[c]);
        delta += Math.abs(tmp.r - curColors[c].r) + Math.abs(tmp.g - curColors[c].g) + Math.abs(tmp.b - curColors[c].b);
        curColors[c].lerp(tmp, k);
      }

      if (L.reduced && delta < 0.004 && !dirty.current) return;
      dirty.current = false;

      time += dt * cur.speed;
      clockT += L.reduced ? 0 : dt;
      spinAngle += dt * 0.07 * cur.spin;

      const mk = 1 - Math.exp(-dt * 3);
      const follow = L.interactive && !L.reduced ? 1 : 0;
      mouse.x += (mouse.tx * follow - mouse.x) * mk;
      mouse.y += (mouse.ty * follow - mouse.y) * mk;

      shared.uTime.value = time;
      shared.uDeform.value = cur.deform;
      shared.uFreq.value = cur.freq;
      shared.uRidge.value = cur.ridge;
      shared.uElastic.value = cur.elastic;
      shared.uVein.value = cur.vein;
      shared.uVeinSharp.value = cur.veinSharp;
      shared.uFlow.value = cur.flow;
      shared.uFresnel.value = cur.fresnel;
      shared.uGloss.value = cur.gloss;
      shared.uSpec.value = cur.spec;
      shared.uBands.value = cur.bands;
      shared.uStruct.value = cur.struct;
      shared.uIrid.value = cur.irid;
      shared.uAlpha.value = cur.alpha;
      shared.uBodyAlpha.value = cur.bodyAlpha;
      innerDeform.value = cur.deform * 0.8;
      innerFreq.value = cur.freq * 1.3;
      innerAlpha.value = cur.inner * cur.alpha;
      glowU.uGlow.value = cur.glow;
      glowU.uPulseAmp.value = cur.pulse;
      glowU.uPulseT.value = clockT;

      const breath = 1 + cur.breathAmp * Math.sin(clockT * cur.breathRate * 2);
      group.scale.setScalar(cur.scale * breath);
      group.rotation.y = spinAngle + mouse.x * 0.38;
      group.rotation.x = -mouse.y * 0.26 + Math.sin(clockT * 0.3) * 0.05;
      group.position.x = mouse.x * 0.06;
      group.position.y = -mouse.y * 0.05;

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      outerGeo.dispose();
      innerGeo.dispose();
      glowGeo.dispose();
      [backMat, bodyMat, frontMat, innerMat, glowMat].forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  const cfg = MODES[mode];
  return (
    <div
      ref={wrapRef}
      className={className || "relative h-full w-full"}
      role="img"
      aria-label={`The Living Core in ${cfg.name} mode, ${CORE_STATES[state].label.toLowerCase()}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square h-[135%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--alt-glow) 30%, transparent) 0%, color-mix(in srgb, var(--alt-glow) 10%, transparent) 55%, transparent 100%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      {(failed || lost) && <CoreFallback />}
    </div>
  );
}

/** Graceful fallback when WebGL is unavailable or the context is lost. */
function CoreFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
      <div
        className="aspect-square h-[62%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, var(--alt-accent2), var(--alt-accent) 45%, color-mix(in srgb, var(--alt-bg0) 80%, black) 100%)",
          boxShadow: "0 0 80px color-mix(in srgb, var(--alt-glow) 45%, transparent), inset 0 0 40px rgba(255,255,255,0.12)",
          borderRadius: "46% 54% 52% 48% / 52% 46% 54% 48%",
          animation: "orb-breathe 6s ease-in-out infinite",
        }}
      />
    </div>
  );
}
