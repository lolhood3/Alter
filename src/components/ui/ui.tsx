"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { CORE_STATES, type CoreStateId } from "@/lib/coreStates";
import { Icon } from "./Icon";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ----------------------------- Buttons ----------------------------- */

type Variant = "primary" | "ghost" | "quiet" | "danger";

export function Button({
  variant = "ghost",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary:
      "accent-tint border text-ink hover:bg-accent/20 shadow-[0_0_30px_-10px_var(--alt-accent)]",
    ghost: "border border-white/10 bg-white/[0.03] text-ink/90 hover:bg-white/[0.07] hover:border-white/20",
    quiet: "border border-transparent text-ink/70 hover:text-ink hover:bg-white/[0.05]",
    danger: "border border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/20",
  };
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-medium tracking-[0.12em] uppercase transition-[background,border-color,color,transform] duration-[var(--m-snappy)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ----------------------------- State pill ----------------------------- */

export function StatePill({ state, className }: { state: CoreStateId; className?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`Core state: ${CORE_STATES[state].label}`}
      className={cx(
        "inline-flex items-center gap-2.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-[12px] font-medium tracking-[0.26em] uppercase text-ink",
        className,
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--alt-accent)]"
        style={{ animation: "dot-pulse 2.4s ease-in-out infinite" }}
      />
      {CORE_STATES[state].label}
    </span>
  );
}

/* ----------------------------- Controls ----------------------------- */

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-[var(--m-snappy)]",
        checked ? "border-accent/60 bg-accent/30" : "border-white/15 bg-white/[0.05]",
      )}
    >
      <span
        className={cx(
          "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all duration-[var(--m-snappy)]",
          checked ? "left-[26px] bg-accent shadow-[0_0_12px_var(--alt-accent)]" : "left-1 bg-white/60",
        )}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  const selected = Math.max(0, options.findIndex((option) => option.value === value));
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let next = selected;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (selected + 1) % options.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (selected - 1 + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else return;
    event.preventDefault();
    onChange(options[next].value);
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
      {options.map((o, index) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          tabIndex={index === selected ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-9 rounded-full px-3.5 text-[12px] font-medium tracking-wide transition-colors duration-[var(--m-snappy)]",
            value === o.value ? "bg-accent/25 text-ink" : "text-ink/60 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  value,
  onChange,
  label,
  min = 0,
  max = 100,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex w-full items-center gap-3 sm:w-64">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full cursor-pointer"
      />
      <span className="w-9 text-right text-[13px] tabular-nums text-ink/70">{value}</span>
    </div>
  );
}

/* ----------------------------- Layout ----------------------------- */

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 anim-fade-up">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display mt-2 text-[34px] leading-[1.05] font-light text-ink sm:text-[44px]">{title}</h1>
      {children && <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink/60">{children}</p>}
    </header>
  );
}

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={cx("mx-auto w-full px-4 pb-10 pt-6 sm:px-8 lg:pt-10", wide ? "max-w-6xl" : "max-w-4xl")}>{children}</div>
  );
}

/* ----------------------------- Modal ----------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusable = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter(
        (n) => !n.hasAttribute("disabled"),
      );
    focusable()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === "Tab") {
        const f = focusable();
        if (!f.length) return;
        const first = f[0];
        const lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6" role="presentation">
      <button aria-label="Close dialog" tabIndex={-1} className="anim-fade-in absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "surface-solid anim-fade-up relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl p-6 shadow-2xl sm:rounded-3xl sm:p-8",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-display text-[30px] leading-none font-light">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink/60 hover:bg-white/5 hover:text-ink"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
