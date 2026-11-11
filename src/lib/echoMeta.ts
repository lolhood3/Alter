import type { IconName } from "@/components/ui/Icon";
import type { EchoType } from "./store";

export const ECHO_FILTERS = [
  { id: "all", label: "All", types: null },
  { id: "environments", label: "Environments", types: ["environment", "shift"] },
  { id: "checkins", label: "Check-ins", types: ["checkin"] },
  { id: "directions", label: "Directions", types: ["direction"] },
  { id: "messages", label: "Messages", types: ["message"] },
] as const;

export const TYPE_ICON: Record<EchoType, IconName> = {
  environment: "environment",
  shift: "sparkle",
  checkin: "checkin",
  direction: "direction",
  message: "message",
};

export const TYPE_LABEL: Record<EchoType, string> = {
  environment: "Environment",
  shift: "Reality Shift",
  checkin: "Check-in",
  direction: "Direction",
  message: "Message",
};
