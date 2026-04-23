"use client";

import { useStore } from "@/lib/store";
import { useLocale } from "@/lib/locale";
import { Bar, Dot, SectionLabel, Trend, severityColor, severityText } from "./ui";
import clsx from "clsx";

export function LeftPanel() {
  const { store } = useStore();
  const { t } = useLocale();
  const s = store.state;

  const stageKey =
    s.stage === "BEFORE"
      ? "stage.before"
      : s.stage === "ARRIVAL"
      ? "stage.arrival"
      : s.stage === "DURING_EVENT"
      ? "stage.during"
      : "stage.dispersal";

  const avgDensity =
    s.hotspots.reduce((a, h) => a + h.density, 0) / Math.max(1, s.hotspots.length);

  return (
    <aside className="panel p-5 space-y-5">
      <section>
        <SectionLabel>{t("left.scenarioState")}</SectionLabel>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-xl text-accent">{t("left.stage3")}</span>
          <span className="text-sm text-ink-secondary">{t(stageKey)}</span>
        </div>
      </section>

      <div className="divider" />

      <section>
        <SectionLabel>{t("left.attendance")}</SectionLabel>
        <div className="flex items-baseline gap-2">
          <span className="stat-num">{s.attendance.current.toLocaleString()}</span>
          <span className="text-xs text-ink-muted">/ {s.attendance.capacity.toLocaleString()}</span>
        </div>
        <div className="mt-2">
          <Bar value={s.attendance.fillRate} colorClass="bg-accent" />
        </div>
        <div className="mt-1 text-[11px] text-ink-secondary">
          {(s.attendance.fillRate * 100).toFixed(1)}% · +{s.attendance.arrivalVelocity}
          {t("left.perMin")}
        </div>
      </section>

      <div className="divider" />

      <section>
        <SectionLabel>{t("left.crowdAvg")}</SectionLabel>
        <Bar value={avgDensity} colorClass={severityColor(avgDensity)} />
      </section>

      <div className="divider" />

      <section>
        <SectionLabel>{t("left.hotspots")}</SectionLabel>
        <ul className="space-y-2 text-sm">
          {s.hotspots
            .slice()
            .sort((a, b) => b.density - a.density)
            .map((h) => (
              <li key={h.zone} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Dot color={severityColor(h.density)} />
                  <span className="text-ink-secondary">{t(h.labelKey)}</span>
                </span>
                <span className={clsx("tabular-nums", severityText(h.density))}>
                  {h.density.toFixed(2)} <Trend trend={h.trend} />
                </span>
              </li>
            ))}
        </ul>
      </section>

      <div className="divider" />

      <section>
        <SectionLabel>{t("left.psim")}</SectionLabel>
        <div className="flex items-baseline gap-2">
          <span className={clsx("stat-num", s.psim.critical > 0 ? "text-danger" : "text-ink-primary")}>
            {s.psim.activeIncidents}
          </span>
          <span className="text-[11px] text-ink-muted">
            {t("left.psimActive")} · {s.psim.critical} {t("left.psimCritical")}
          </span>
        </div>
        <div className="text-[11px] text-ink-muted truncate">
          {t("left.last")}: {s.psim.lastEvent}
        </div>
      </section>

      <div className="divider" />

      <section>
        <SectionLabel>{t("left.parking")}</SectionLabel>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {(["P1", "P2", "P3", "P4"] as const).map((k) => {
            const v = s.parking[k];
            return (
              <div key={k} className="card px-2.5 py-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-muted">{k}</span>
                  <span className={clsx("tabular-nums", severityText(v))}>
                    {(v * 100).toFixed(0)}%
                  </span>
                </div>
                <Bar value={v} colorClass={severityColor(v)} height="h-1" />
              </div>
            );
          })}
        </div>
      </section>

      <div className="divider" />

      <section>
        <SectionLabel>{t("left.weather")}</SectionLabel>
        <div className="flex items-baseline gap-2">
          <span className="stat-num">{s.weather.tempC}°C</span>
          <span
            className={clsx(
              "text-[11px]",
              s.weather.condition === "RAINING" ? "text-info" : "text-ink-secondary"
            )}
          >
            {t(`weather.${s.weather.condition}`)}
          </span>
        </div>
        {s.weather.forecast60min === "RAINING" && s.weather.condition !== "RAINING" && (
          <div className="mt-1 text-[11px] text-info">
            ◔{" "}
            {t("left.rainForecast", {
              conf: (s.weather.forecastConfidence * 100).toFixed(0),
            })}
          </div>
        )}
        {s.overlays.rain && (
          <div className="mt-1 text-[11px] text-info/90">◉ {t("left.rainOverlayActive")}</div>
        )}
      </section>

      {s.vip.active && (
        <>
          <div className="divider" />
          <section>
            <SectionLabel className="text-vip">{t("left.vipAnpr")}</SectionLabel>
            <div className="flex items-baseline gap-2">
              <span className="stat-num text-vip">{s.vip.plateLast4}</span>
            </div>
            <div className="text-[11px] text-ink-muted">
              {t("left.approach")} · {s.vip.approachDistanceM ?? 0}m
            </div>
          </section>
        </>
      )}
    </aside>
  );
}
