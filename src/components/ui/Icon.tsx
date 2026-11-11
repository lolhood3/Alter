import type { ReactNode, SVGProps } from "react";
import type { ModeId } from "@/lib/modes";

const ICONS: Record<string, ReactNode> = {
  core: (<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.3" /></>),
  modes: (<><path d="M12 3 3 8l9 5 9-5-9-5Z" /><path d="m3 12.5 9 5 9-5" /><path d="m3 16.8 9 5 9-5" /></>),
  match: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.4" /><circle cx="12" cy="12" r="1.6" /></>),
  shift: (<><path d="M4 8h15" /><path d="m15 4 4 4-4 4" /><path d="M20 16H5" /><path d="m9 12-4 4 4 4" /></>),
  echoes: (<><path d="M3 12h.5" /><path d="M7 9v6" /><path d="M11 4v16" /><path d="M15 8v8" /><path d="M19 10.5v3" /><path d="M21.5 12h.5" /></>),
  universe: (<><circle cx="12" cy="12" r="4.6" /><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(-28 12 12)" /></>),
  dream: (<path d="M20 14.6A8.6 8.6 0 1 1 9.4 4a7 7 0 0 0 10.6 10.6Z" />),
  rewind: (<><path d="M11.5 6 4 12l7.5 6V6Z" /><path d="M20 6l-7.5 6 7.5 6V6Z" /></>),
  command: (<><path d="m8 7-5 5 5 5" /><path d="m16 7 5 5-5 5" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>),
  sparkle: (<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />),
  fullscreen: (<><path d="M4 9V4h5" /><path d="M20 9V4h-5" /><path d="M4 15v5h5" /><path d="M20 15v5h-5" /></>),
  panel: (<><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M15 4v16" /></>),
  menu: (<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>),
  close: (<><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>),
  send: (<><path d="M4 12 20 4l-5 16-3.5-6.5L4 12Z" /></>),
  check: (<path d="m5 12.5 4.5 4.5L19 7" />),
  trash: (<><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="m6 7 1 13h10l1-13" /></>),
  volume: (<><path d="M4 9.5v5h4l5 4v-13l-5 4H4Z" /><path d="M16.5 9a4.5 4.5 0 0 1 0 6" /><path d="M19 6.5a8 8 0 0 1 0 11" /></>),
  mute: (<><path d="M4 9.5v5h4l5 4v-13l-5 4H4Z" /><path d="m17 9.5 4 5" /><path d="m21 9.5-4 5" /></>),
  eyeoff: (<><path d="M3 3l18 18" /><path d="M10.6 6.2A9.6 9.6 0 0 1 12 6c5 0 8.5 4 9.5 6a12 12 0 0 1-2.4 3" /><path d="M6.3 7.7A12 12 0 0 0 2.5 12C3.5 14 7 18 12 18c1.3 0 2.5-.3 3.6-.7" /></>),
  eye: (<><path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6Z" /><circle cx="12" cy="12" r="2.6" /></>),
  prev: (<path d="m15 5-7 7 7 7" />),
  next: (<path d="m9 5 7 7-7 7" />),
  first: (<><path d="M6 5v14" /><path d="m18 5-8 7 8 7V5Z" /></>),
  last: (<><path d="M18 5v14" /><path d="m6 5 8 7-8 7V5Z" /></>),
  refresh: (<><path d="M20 11a8 8 0 0 0-14-4.5L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14 4.5L20 15" /><path d="M20 20v-5h-5" /></>),
  expand: (<><path d="M14 4h6v6" /><path d="m20 4-7 7" /><path d="M10 20H4v-6" /><path d="m4 20 7-7" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>),
  message: (<path d="M4 5h16v11H9l-5 4V5Z" />),
  direction: (<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>),
  environment: (<><path d="M3 18 9 9l4 6 3-4 5 7H3Z" /></>),
  checkin: (<><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></>),
  history: (<><path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v4h4" /><path d="M12 8v4l3 2" /></>),
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {ICONS[name]}
    </svg>
  );
}

/** Original abstract emblems for each mode — no character artwork. */
export function Emblem({ modeId, size = 40, color }: { modeId: ModeId; size?: number; color?: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: color ?? "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (modeId) {
    case "peter-parker":
      return (
        <svg {...common}>
          <ellipse cx="20" cy="20" rx="15" ry="7" />
          <ellipse cx="20" cy="20" rx="7" ry="15" />
          <circle cx="20" cy="20" r="2.4" fill={color ?? "currentColor"} stroke="none" />
        </svg>
      );
    case "moon-knight":
      return (
        <svg {...common}>
          <path d="M27 6.5a14 14 0 1 0 6.5 21.5A11.5 11.5 0 0 1 27 6.5Z" />
          <path d="M31 9.5v.01M34.5 14v.01" strokeWidth={2.4} />
        </svg>
      );
    case "red-k":
      return (
        <svg {...common}>
          <path d="M20 4c1 8 3.5 12.5 14 16-10.5 3.5-13 8-14 16-1-8-3.5-12.5-14-16C16.5 16.5 19 12 20 4Z" />
        </svg>
      );
    case "batman-beyond":
      return (
        <svg {...common}>
          <path d="M4 31 15 11l5 8 5-10 11 22" />
          <path d="m15 11 3 6" />
          <path d="M9 31h22" opacity="0.5" />
        </svg>
      );
    case "spider-man":
      return (
        <svg {...common}>
          <ellipse cx="20" cy="20" rx="15.5" ry="6.5" transform="rotate(45 20 20)" />
          <ellipse cx="20" cy="20" rx="15.5" ry="6.5" transform="rotate(-45 20 20)" />
          <circle cx="20" cy="20" r="1.8" fill={color ?? "currentColor"} stroke="none" />
        </svg>
      );
    case "iron-man":
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="13" strokeWidth={2.2} />
          <circle cx="20" cy="20" r="6.5" opacity="0.45" />
        </svg>
      );
    case "venom":
      return (
        <svg {...common}>
          <path d="M29 9.5c-6-4.5-17-1.5-15 5 2 5.5 15 3.5 13 11-2 6.5-13 7.5-18 3" strokeWidth={2.2} />
          <path d="M31 14c1.5 1.5 2 3 1.5 5" opacity="0.5" />
        </svg>
      );
  }
}
