"use client";

import { useStore } from "@/lib/store";
import clsx from "clsx";
import { SectionLabel } from "./ui";

const stages = ["Before", "Arrival", "Event · NOW", "Dispersal"] as const;

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function StageProgress() {
  const { store } = useStore();
  const s = store.state;
  const pct = Math.round(s.stageProgress * 100);

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Stage Progress & Live KPIs</SectionLabel>
        <span className="text-[10px] text-ink-muted tabular-nums">{pct}% through event</span>
      </div>

      {/* Stage bar */}
      <div className="relative mb-5">
        <div className="h-1 rounded-full bg-bg-elevated">
          <div
            className="h-1 rounded-full bg-accent"
            style={{ width: `${pct}%`, transition: "width 0.7s ease" }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.14em]">
          {stages.map((label, i) => {
            const stagePct = (i + 1) * 25;
            const reached = pct >= stagePct - 12;
            const current = i === 2;
            return (
              <span
                key={label}
                className={clsx(
                  reached ? (current ? "text-accent" : "text-ink-secondary") : "text-ink-muted",
                  current && "font-semibold"
                )}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiTile
          label="Incident Response Time"
          value={fmtSec(s.kpi.incidentResponseSec)}
          delta={`${s.kpi.responseDeltaPct}% vs BAU`}
          good={s.kpi.responseDeltaPct < 0}
        />
        <KpiTile
          label="Manual Coord Steps"
          value={s.kpi.manualCoordSteps.toFixed(1)}
          delta={`${s.kpi.manualCoordDeltaPct}%`}
          good={s.kpi.manualCoordDeltaPct < 0}
        />
        <KpiTile
          label="Proactive : Reactive"
          value={`${s.kpi.proactiveRatio[0]} : ${s.kpi.proactiveRatio[1]}`}
          delta="target 55 : 45"
          good={s.kpi.proactiveRatio[0] >= 55}
        />
      </div>
    </section>
  );
}

function KpiTile({
  label,
  value,
  delta,
  good,
}: {
  label: string;
  value: string;
  delta: string;
  good: boolean;
}) {
  return (
    <div className="card px-3.5 py-3">
      <div className="section-label mb-1">{label}</div>
      <div className="font-serif text-2xl text-ink-primary tabular-nums">{value}</div>
      <div className={clsx("text-[10px] mt-1", good ? "text-accent" : "text-warn")}>
        {good ? "↓" : "→"} {delta}
      </div>
    </div>
  );
}
