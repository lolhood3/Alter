"use client";

import { useState, type ReactNode } from "react";
import { useAlter } from "@/lib/store";
import { Button, Page, PageHeader, Segmented, Slider, Switch } from "@/components/ui/ui";
import { TRANSITION_OPTIONS } from "@/components/shell/RealityShift";

function Row({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0 sm:max-w-md">
        <h3 className="text-[14.5px] font-medium text-ink">{title}</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink/50">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface rounded-3xl px-5 sm:px-8" aria-label={title}>
      <h2 className="eyebrow pt-6">{title}</h2>
      <div className="divide-y divide-white/[0.06]">{children}</div>
    </section>
  );
}

function Confirm({
  label,
  question,
  action,
  tone = "danger",
}: {
  label: string;
  question: string;
  action: () => void;
  tone?: "danger" | "ghost";
}) {
  const [asking, setAsking] = useState(false);
  const [done, setDone] = useState(false);
  if (asking)
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-ink/60">{question}</span>
        <Button
          variant={tone}
          onClick={() => {
            action();
            setAsking(false);
            setDone(true);
            window.setTimeout(() => setDone(false), 2500);
          }}
        >
          Confirm
        </Button>
        <Button variant="quiet" onClick={() => setAsking(false)}>
          Cancel
        </Button>
      </div>
    );
  return (
    <Button variant={tone} onClick={() => setAsking(true)}>
      {done ? "Done ✓" : label}
    </Button>
  );
}

export default function SettingsPage() {
  const s = useAlter((x) => x.settings);
  const update = useAlter((x) => x.updateSettings);
  const events = useAlter((x) => x.events);
  const clearHistory = useAlter((x) => x.clearHistory);
  const resetPreferences = useAlter((x) => x.resetPreferences);
  const resetDemo = useAlter((x) => x.resetDemo);

  const rm = s.reducedMotion === null ? "system" : s.reducedMotion ? "on" : "off";

  return (
    <Page>
      <PageHeader eyebrow="Make it yours" title="Settings">
        Everything is stored locally in this browser. Nothing is sent anywhere.
      </PageHeader>

      <div className="space-y-5">
        <Group title="Motion">
          <Row title="Reduced motion" hint="Simplifies animation across the Core, environment and transitions. “System” follows your device preference.">
            <Segmented
              label="Reduced motion"
              value={rm}
              options={[
                { value: "system", label: "System" },
                { value: "on", label: "Reduced" },
                { value: "off", label: "Full" },
              ]}
              onChange={(v) => update({ reducedMotion: v === "system" ? null : v === "on" })}
            />
          </Row>
          <Row title="Reality Shift transition" hint="How an approved environment arrives. Immersive is more spatial; both can be interrupted with a tap or Esc.">
            <Segmented label="Transition style" value={s.transitionStyle} options={TRANSITION_OPTIONS} onChange={(v) => update({ transitionStyle: v })} />
          </Row>
        </Group>

        <Group title="Presence">
          <Row title="Core intensity" hint="Scales how strongly the Living Core deforms, glows and flows.">
            <Slider label="Core intensity" value={s.coreIntensity} onChange={(v) => update({ coreIntensity: v })} />
          </Row>
          <Row title="Particle intensity" hint="Density of the sparse ambient particles. Set to 0 to turn them off.">
            <Slider label="Particle intensity" value={s.particleIntensity} onChange={(v) => update({ particleIntensity: v })} />
          </Row>
          <Row title="Ambient sound" hint="A quiet generative drone that follows the mode. Off by default; generated on your device.">
            <Switch label="Ambient sound" checked={s.ambientSound} onChange={(v) => update({ ambientSound: v })} />
          </Row>
          <Row title="Compact communication" hint="Shows only the Core’s current message — no inline input or refresh.">
            <Switch label="Compact communication" checked={s.compactComm} onChange={(v) => update({ compactComm: v })} />
          </Row>
        </Group>

        <Group title="Privacy & data">
          <Row title="Record Echoes" hint="Save the actions you take (modes, check-ins, directions, shifts, messages). Turn off to stop recording; existing echoes stay until you clear them.">
            <Switch label="Record Echoes" checked={s.recordEchoes} onChange={(v) => update({ recordEchoes: v })} />
          </Row>
          <Row title="Reset preferences" hint="Restores the settings above to their defaults. Your history and current mode are kept.">
            <Confirm label="Reset preferences" tone="ghost" question="Restore default settings?" action={resetPreferences} />
          </Row>
          <Row title="Clear local history" hint={`Deletes all ${events.length} recorded echoes and timeline moments. Settings are kept.`}>
            <Confirm label="Clear history" question="Delete all echoes?" action={clearHistory} />
          </Row>
          <Row title="Reset demo state" hint="Returns everything — settings, mode and history — to a fresh start.">
            <Confirm label="Reset everything" question="Reset the whole demo?" action={resetDemo} />
          </Row>
        </Group>
      </div>
    </Page>
  );
}
