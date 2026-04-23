"use client";

import { useStore } from "@/lib/store";
import { useLocale } from "@/lib/locale";
import clsx from "clsx";
import { SectionLabel } from "./ui";
import type { Recommendation } from "@/lib/types";

export function Recommendations() {
  const { store } = useStore();
  const { t } = useLocale();
  const recs = store.recommendations;
  const active = recs.filter((r) => r.status === "PENDING" || r.status === "FIRING").length;

  return (
    <aside className="panel p-5 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>
          {t("rec.title")} · {active}
        </SectionLabel>
        {store.suppression && (
          <span className="chip !text-danger !border-danger/40 animate-pulse">
            {t("rec.suppression")}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {recs.length === 0 && (
          <div className="text-sm text-ink-muted py-12 text-center">
            <div className="font-serif text-base">{t("rec.empty.title")}</div>
            <div className="mt-1 text-[11px]">{t("rec.empty.sub")}</div>
          </div>
        )}
        {recs.map((rec) => (
          <RecCard key={rec.id} rec={rec} />
        ))}
      </div>
    </aside>
  );
}

function RecCard({ rec }: { rec: Recommendation }) {
  const { approve, reject } = useStore();
  const { t, tx } = useLocale();

  const tone =
    rec.appearance === "CRITICAL"
      ? "border-danger/60 bg-danger/[0.07] shadow-[0_0_0_1px_rgba(239,94,94,0.25),0_0_28px_rgba(239,94,94,0.08)]"
      : rec.appearance === "VIP"
      ? "border-vip/60 bg-vip/[0.06] shadow-[0_0_0_1px_rgba(212,175,55,0.25),0_0_28px_rgba(212,175,55,0.10)]"
      : rec.appearance === "BATCH"
      ? "border-info/40 bg-info/[0.06]"
      : rec.priority === "HIGH"
      ? "border-accent/50 bg-accent/[0.05] shadow-glow"
      : "border-line bg-bg-card";

  const priorityClass =
    rec.priority === "CRITICAL"
      ? "text-danger"
      : rec.appearance === "VIP"
      ? "text-vip"
      : rec.priority === "HIGH"
      ? "text-accent"
      : "text-info";

  const rollbackText = rec.rollbackText ? tx(rec.rollbackText) : "";

  return (
    <article
      className={clsx(
        "rounded-md border p-3.5 animate-rise",
        tone,
        rec.status === "SUPPRESSED" && "opacity-40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className={clsx("text-[10px] uppercase tracking-[0.14em] flex items-center gap-2", priorityClass)}>
            <span>{t(`priority.${rec.priority}`)}</span>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-secondary">{tx(rec.headline)}</span>
          </div>
          <h3 className="font-serif text-[15px] mt-0.5 text-ink-primary leading-snug">
            {tx(rec.title)}
          </h3>
          {rec.subtitle && (
            <div className="text-[11px] text-ink-secondary mt-0.5">{tx(rec.subtitle)}</div>
          )}
        </div>
        <span className="text-[10px] text-ink-muted tabular-nums whitespace-nowrap">
          {rec.ruleId}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-1 text-[11px]">
        {rec.affectedVisitors && <Row label={t("rec.row.affects")} value={tx(rec.affectedVisitors)} />}
        {rec.expectedImpact && <Row label={t("rec.row.impact")} value={tx(rec.expectedImpact)} />}
        {rec.tradeoff && <Row label={t("rec.row.tradeoff")} value={tx(rec.tradeoff)} valueClass="text-warn" />}
        <Row label={t("rec.row.channels")} value={tx(rec.channels)} />
        <Row
          label={t("rec.row.confidence")}
          value={t("rec.confidenceValue", { pct: (rec.confidence * 100).toFixed(0), eta: rec.etaToEffect })}
        />
      </dl>

      {(rec.status === "FIRING" || rec.status === "EXECUTED" || rec.status === "ROLLED_BACK") && (
        <ul className="mt-3 space-y-1.5 text-[11px]">
          {rec.actions.map((a, i) => (
            <li key={i} className="flex items-center justify-between border-t border-line/60 pt-1.5">
              <span className="flex items-center gap-2">
                <span
                  className={clsx(
                    "h-1.5 w-1.5 rounded-full",
                    a.status === "ACK" ? "bg-accent" : a.status === "FAILED" ? "bg-danger" : "bg-warn animate-pulse"
                  )}
                />
                <span className="text-ink-secondary">{a.channel}</span>
                <span className="text-ink-muted">·</span>
                <span className="text-ink-muted">{a.target ? tx(a.target) : ""}</span>
              </span>
              <span className="text-ink-muted tabular-nums">
                {a.status === "ACK" ? `ACK ${a.latencyMs}ms` : a.status ?? t("rec.actions.pending")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-2">
        {rec.status === "PENDING" && (
          <>
            <button onClick={() => approve(rec)} className="btn-primary">
              {rec.appearance === "CRITICAL" ? t("rec.approveCritical") : t("rec.approve")}
            </button>
            <button className="btn-ghost" disabled>
              {t("rec.edit")}
            </button>
            {rec.appearance !== "CRITICAL" && (
              <button onClick={() => reject(rec)} className="btn-danger-ghost">
                {t("rec.reject")}
              </button>
            )}
          </>
        )}
        {rec.status === "FIRING" && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-warn animate-pulse">
            {t("rec.firing")}
          </span>
        )}
        {rec.status === "EXECUTED" && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-accent">
            {t("rec.executed", { rollback: rollbackText })}
          </span>
        )}
        {rec.status === "ROLLED_BACK" && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            {t("rec.rolledBack")}
          </span>
        )}
        {rec.status === "REJECTED" && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            {t("rec.rejected")}
          </span>
        )}
        {rec.status === "SUPPRESSED" && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            {t("rec.suppressed")}
          </span>
        )}
      </div>
    </article>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 text-ink-muted uppercase tracking-[0.1em] text-[10px] pt-0.5">
        {label}
      </dt>
      <dd className={clsx("flex-1 text-ink-secondary", valueClass)}>{value}</dd>
    </div>
  );
}
