import type { IconName } from "@/components/ui/Icon";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: IconName;
  alias: string;
}

export const NAV_GROUPS: NavItem[][] = [
  [
    { href: "/", label: "Living Core", short: "Core", icon: "core", alias: "core" },
    { href: "/modes", label: "Modes", short: "Modes", icon: "modes", alias: "modes" },
    { href: "/match", label: "MATCH", short: "MATCH", icon: "match", alias: "match" },
    { href: "/shift", label: "SHIFT", short: "SHIFT", icon: "shift", alias: "shift" },
  ],
  [
    { href: "/echoes", label: "Echoes", short: "Echoes", icon: "echoes", alias: "echoes" },
    { href: "/inner-universe", label: "Inner Universe", short: "Universe", icon: "universe", alias: "universe" },
    { href: "/dreamscape", label: "Dreamscape", short: "Dream", icon: "dream", alias: "dreamscape" },
    { href: "/timeline", label: "Timeline Rewind", short: "Timeline", icon: "rewind", alias: "timeline" },
  ],
  [
    { href: "/command", label: "ALTER Command", short: "Command", icon: "command", alias: "command" },
    { href: "/settings", label: "Settings", short: "Settings", icon: "settings", alias: "settings" },
  ],
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flat();
