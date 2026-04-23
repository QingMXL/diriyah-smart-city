"use client";

import { scenarios } from "@/lib/initialState";
import { useStore } from "@/lib/store";
import { useLocale } from "@/lib/locale";
import clsx from "clsx";
import { SectionLabel } from "./ui";

export function ScenarioLauncher() {
  const { triggerScenario, store } = useStore();
  const { t } = useLocale();

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>{t("launcher.title")}</SectionLabel>
        <span className="text-[10px] text-ink-muted uppercase tracking-[0.14em]">
          {t("launcher.hint")}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {scenarios.map((sc) => {
          const tone =
            sc.priority === "CRITICAL"
              ? "hover:border-danger/60 hover:shadow-[0_0_0_1px_rgba(239,94,94,0.25)]"
              : sc.key === "S05_VIP"
              ? "hover:border-vip/60 hover:shadow-[0_0_0_1px_rgba(212,175,55,0.25)]"
              : "hover:border-accent/50 hover:shadow-glow";

          const priorityClass =
            sc.priority === "CRITICAL"
              ? "text-danger"
              : sc.key === "S05_VIP"
              ? "text-vip"
              : sc.priority === "HIGH"
              ? "text-accent"
              : "text-info";

          return (
            <button
              key={sc.key}
              onClick={() => triggerScenario(sc.key)}
              className={clsx("card text-left p-3.5 transition-all", tone, "group")}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-[26px] text-ink-muted group-hover:text-ink-secondary transition-colors">
                  {sc.number}
                </span>
                <span className={clsx("text-[10px] uppercase tracking-[0.14em]", priorityClass)}>
                  {t(`priority.${sc.priority}`)}
                </span>
              </div>
              <h4 className="font-serif text-[13px] mt-1 text-ink-primary leading-snug">
                {t(sc.shortTitleKey)}
              </h4>
              <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                {t(sc.tagKey)}
              </div>
              <div className="mt-2 text-[11px] text-ink-secondary line-clamp-2">
                {t(sc.longTitleKey)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-ink-muted tabular-nums">{sc.ruleId}</span>
                <span className="text-accent">{t("launcher.trigger")}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-[10px] text-ink-muted uppercase tracking-[0.14em]">
        {store.activeScenario
          ? t("launcher.lastTriggered", { key: store.activeScenario })
          : t("launcher.idle")}
      </div>
    </section>
  );
}
