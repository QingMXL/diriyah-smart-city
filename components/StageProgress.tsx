"use client";

import { useStore } from "@/lib/store";
import { useLocale } from "@/lib/locale";
import clsx from "clsx";
import { SectionLabel } from "./ui";

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function StageProgress() {
  const { store } = useStore();
  const { t } = useLocale();
  const s = store.state;
  const pct = Math.round(s.stageProgress * 100);

  const stageItems = [
    { key: "stage.before", stagePct: 25 },
    { key: "stage.arrival", stagePct: 50 },
    { key: "stage.during", stagePct: 75, current: true },
    { key: "stage.dispersal", stagePct: 100 },
  ];

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>{t("kpi.title")}</SectionLabel>
        <span className="text-[10px] text-ink-muted tabular-nums">
          {t("kpi.throughEvent", { pct })}
        </span>
      </div>

      <div className="relative mb-5">
        <div className="h-1 rounded-full bg-bg-elevated">
          <div
            className="h-1 rounded-full bg-accent"
            style={{ width: `${pct}%`, transition: "width 0.7s ease" }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.14em]">
          {stageItems.map((item) => {
            const reached = pct >= item.stagePct - 12;
            return (
              <span
                key={item.key}
                className={clsx(
                  reached ? (item.current ? "text-accent" : "text-ink-secondary") : "text-ink-muted",
                  item.current && "font-semibold"
                )}
              >
                {t(item.key)}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiTile
          label={t("kpi.responseTime")}
          value={fmtSec(s.kpi.incidentResponseSec)}
          delta={t("kpi.vsBau", { d: s.kpi.responseDeltaPct })}
          good={s.kpi.responseDeltaPct < 0}
        />
        <KpiTile
          label={t("kpi.manualSteps")}
          value={s.kpi.manualCoordSteps.toFixed(1)}
          delta={`${s.kpi.manualCoordDeltaPct}%`}
          good={s.kpi.manualCoordDeltaPct < 0}
        />
        <KpiTile
          label={t("kpi.proactive")}
          value={`${s.kpi.proactiveRatio[0]} : ${s.kpi.proactiveRatio[1]}`}
          delta={t("kpi.target")}
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
