"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODES } from "@/lib/modes";
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/nav";
import { ambientNeedsGesture, ambientSetMode, ambientStart, ambientStop } from "@/lib/ambient";
import { useAlter, useDisplayModeId, useReducedMotion } from "@/lib/store";
import { Environment } from "@/components/environment/Environment";
import { Icon } from "@/components/ui/Icon";
import { Modal, StatePill, cx } from "@/components/ui/ui";
import { ContextPanel } from "./ContextPanel";
import { CoreOrb, CommunicationDialog } from "./CorePanel";
import { RealityShiftDialog, RealityShiftOverlay } from "./RealityShift";

const IDLE_MS = 120_000;

/** Side-effects that belong to the shell: hydration, reduced motion, route → state, idle, ambient sound. */
function ShellEffects() {
  const pathname = usePathname();
  const setRoute = useAlter((s) => s.setRoute);
  const setSystemReduced = useAlter((s) => s.setSystemReduced);
  const reduced = useReducedMotion();
  const sound = useAlter((s) => s.settings.ambientSound);
  const modeId = useDisplayModeId();

  useEffect(() => {
    // Hydrate FIRST — any setState before this would overwrite saved data with defaults.
    const r = useAlter.persist.rehydrate();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = (e: MediaQueryListEvent) => setSystemReduced(e.matches);
    mq.addEventListener("change", on);
    Promise.resolve(r).then(() => {
      setSystemReduced(mq.matches);
      useAlter.setState({ hydrated: true });
      useAlter.getState().settle();
    });
    return () => mq.removeEventListener("change", on);
  }, [setSystemReduced]);

  useEffect(() => {
    document.documentElement.dataset.reduced = String(reduced);
  }, [reduced]);

  useEffect(() => {
    setRoute(pathname);
  }, [pathname, setRoute]);

  // Idle → Dormant, activity → settle. Purely application logic, never random.
  useEffect(() => {
    let timer: number;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const s = useAlter.getState();
        if (!s.transition && (s.coreState === "attentive" || s.coreState === "active")) s.setCore("dormant");
      }, IDLE_MS);
    };
    const onActivity = () => {
      const s = useAlter.getState();
      if (s.coreState === "dormant") s.settle();
      arm();
    };
    arm();
    const evs = ["pointerdown", "keydown", "pointermove"] as const;
    evs.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      evs.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, []);

  useEffect(() => {
    if (!sound) {
      ambientStop();
      return;
    }
    ambientStart(modeId);
    if (ambientNeedsGesture()) {
      const resume = () => {
        ambientStart(useAlter.getState().previewEnv?.modeId ?? useAlter.getState().modeId);
      };
      window.addEventListener("pointerdown", resume, { once: true });
      window.addEventListener("keydown", resume, { once: true });
      return () => {
        window.removeEventListener("pointerdown", resume);
        window.removeEventListener("keydown", resume);
      };
    }
  }, [sound]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sound) ambientSetMode(modeId);
  }, [modeId, sound]);

  return null;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="ALTER — Living Core" className="flex items-center gap-3.5 rounded-xl">
      <CoreOrb size={34} />
      {!compact && <span className="font-display text-[26px] leading-none font-normal tracking-[0.34em] text-ink">ALTER</span>}
    </Link>
  );
}

function SideNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-[76px] shrink-0 flex-col border-r border-white/[0.05] bg-black/25 px-3 py-5 min-[1440px]:w-[248px] min-[1440px]:px-4"
    >
      <div className="mb-8 flex h-10 items-center justify-center min-[1440px]:justify-start min-[1440px]:pl-2">
        <span className="min-[1440px]:hidden">
          <Logo compact />
        </span>
        <span className="hidden min-[1440px]:block">
          <Logo />
        </span>
      </div>
      <div className="thin-scroll flex-1 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="hairline my-3.5" />}
            <ul className="space-y-1">
              {group.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      title={item.label}
                      className={cx(
                        "group flex min-h-11 items-center justify-center gap-3.5 rounded-2xl border px-3 text-[14px] transition-[background,border-color,color] duration-[var(--m-snappy)] min-[1440px]:justify-start",
                        active
                          ? "accent-tint text-ink"
                          : "border-transparent text-ink/60 hover:bg-white/[0.04] hover:text-ink",
                      )}
                    >
                      <Icon name={item.icon} size={20} className={cx("shrink-0", active && "text-accent")} />
                      <span className="hidden min-[1440px]:inline">{item.label}</span>
                      <span className="sr-only min-[1440px]:hidden">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4 hidden items-center gap-3 px-2 min-[1440px]:flex">
        <span className="eyebrow !text-[10px]">ALTER 1.0</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <p className="eyebrow text-center !text-[9px] min-[1440px]:hidden">1.0</p>
    </nav>
  );
}

function BottomTabs() {
  const pathname = usePathname();
  const openDrawer = useAlter((s) => s.openDrawer);
  const items = NAV_ITEMS.filter((i) => ["/", "/modes", "/match", "/shift"].includes(i.href));
  const moreActive = !items.some((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)));
  const base =
    "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[10.5px] tracking-wide transition-colors duration-[var(--m-snappy)]";
  return (
    <nav aria-label="Primary" className="flex shrink-0 gap-1 border-t border-white/[0.06] bg-black/60 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md lg:hidden">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cx(base, active ? "text-ink" : "text-ink/50")}>
            <Icon name={item.icon} size={21} className={active ? "text-accent" : ""} />
            {item.short}
          </Link>
        );
      })}
      <button onClick={() => openDrawer("menu")} className={cx(base, moreActive ? "text-ink" : "text-ink/50")} aria-label="More destinations">
        <Icon name="menu" size={21} className={moreActive ? "text-accent" : ""} />
        More
      </button>
    </nav>
  );
}

function MenuSheet() {
  const open = useAlter((s) => s.drawer === "menu");
  const openDrawer = useAlter((s) => s.openDrawer);
  const pathname = usePathname();
  return (
    <Modal open={open} onClose={() => openDrawer(null)} title="Navigate">
      <ul className="grid grid-cols-2 gap-2">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => openDrawer(null)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-[14px]",
                  active ? "accent-tint text-ink" : "border-white/[0.07] bg-white/[0.02] text-ink/75",
                )}
              >
                <Icon name={item.icon} size={20} className={active ? "text-accent" : ""} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

function ContextDrawer() {
  const open = useAlter((s) => s.drawer === "context");
  const openDrawer = useAlter((s) => s.openDrawer);
  return (
    <Modal open={open} onClose={() => openDrawer(null)} title="Context" wide>
      <ContextPanel className="!rounded-2xl" />
    </Modal>
  );
}

function ToolButtons({ showContext }: { showContext: boolean }) {
  const openDrawer = useAlter((s) => s.openDrawer);
  const btn =
    "flex h-11 w-11 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-white/[0.06] hover:text-ink";
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };
  return (
    <div className="flex items-center gap-1">
      {showContext && (
        <button className={btn} onClick={() => openDrawer("context")} aria-label="Open context panel">
          <Icon name="panel" size={20} />
        </button>
      )}
      <button className={btn} onClick={toggleFullscreen} aria-label="Toggle fullscreen">
        <Icon name="fullscreen" size={19} />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const modeId = useDisplayModeId();
  const m = MODES[modeId];
  const state = useAlter((s) => s.coreState);
  const hidden = useAlter((s) => s.uiHidden);
  const setUiHidden = useAlter((s) => s.setUiHidden);

  const vars = {
    "--alt-accent": m.accent,
    "--alt-accent2": m.accent2,
    "--alt-bg0": m.bg0,
    "--alt-glow": m.look.colA,
  } as CSSProperties;

  const fade = cx("transition-opacity duration-[var(--m-spatial)]", hidden && "pointer-events-none opacity-0");

  return (
    <div className="alter-root relative h-dvh w-full overflow-hidden text-ink" style={vars}>
      <ShellEffects />
      <a href="#main" className="sr-only z-[100] rounded-full bg-black px-4 py-2 focus:not-sr-only focus:absolute focus:left-3 focus:top-3">
        Skip to content
      </a>
      <Environment />

      <div className="relative z-10 flex h-full">
        <div className={cx("hidden lg:block", fade)} inert={hidden}>
          <SideNav />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Compact header (below xl) */}
          <header className={cx("flex h-14 shrink-0 items-center justify-between gap-3 px-4 min-[1280px]:hidden", fade)} inert={hidden}>
            <div className="lg:invisible">
              <Logo />
            </div>
            <StatePill state={state} className="!px-3 !py-1 !text-[10.5px]" />
            <ToolButtons showContext />
          </header>

          <main id="main" tabIndex={-1} className="thin-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto focus:outline-none">
            {children}
          </main>

          <div className={fade} inert={hidden}>
            <BottomTabs />
          </div>
        </div>

        <aside aria-label="Context" className={cx("hidden w-[340px] shrink-0 flex-col px-4 pb-5 min-[1280px]:flex", fade)} inert={hidden}>
          <div className="flex h-[68px] shrink-0 items-center justify-end">
            <ToolButtons showContext={false} />
          </div>
          <ContextPanel className="min-h-0 flex-1" />
        </aside>
      </div>

      {hidden && (
        <button
          onClick={() => setUiHidden(false)}
          className="anim-fade-in absolute right-4 top-4 z-30 flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 text-[12px] tracking-[0.16em] text-ink/70 uppercase backdrop-blur hover:text-ink"
        >
          <Icon name="eye" size={16} /> Show interface
        </button>
      )}

      <ContextDrawer />
      <MenuSheet />
      <RealityShiftDialog />
      <CommunicationDialog />
      <RealityShiftOverlay />
    </div>
  );
}
