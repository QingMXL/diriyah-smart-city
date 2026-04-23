"use client";

import { useStore } from "@/lib/store";
import clsx from "clsx";
import { SectionLabel } from "./ui";
import type { Recommendation } from "@/lib/types";

export function Recommendations() {
  const { store } = useStore();
  const recs = store.recommendations;
  const active = recs.filter((r) => r.status === "PENDING" || r.status === "FIRING").length;

  return (
    <aside className="panel p-5 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Recommendations · {active}</SectionLabel>
        {store.suppression && (
          <span className="chip !text-danger !border-danger/40 animate-pulse">
            Suppression active
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {recs.length === 0 && (
          <div className="text-sm text-ink-muted py-12 text-center">
            <div className="font-serif text-base">No active recommendations</div>
            <div className="mt-1 text-[11px]">
              Trigger a scenario from the launcher below.
            </div>
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
            <span>{rec.priority}</span>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-secondary">{rec.headline}</span>
          </div>
          <h3 className="font-serif text-[15px] mt-0.5 text-ink-primary leading-snug">
            {rec.title}
          </h3>
          {rec.subtitle && (
            <div className="text-[11px] text-ink-secondary mt-0.5">{rec.subtitle}</div>
          )}
        </div>
        <span className="text-[10px] text-ink-muted tabular-nums whitespace-nowrap">
          {rec.ruleId}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-1 text-[11px]">
        {rec.affectedVisitors && (
          <Row label="Affects" value={rec.affectedVisitors} />
        )}
        {rec.expectedImpact && (
          <Row label="Impact" value={rec.expectedImpact} />
        )}
        {rec.tradeoff && (
          <Row label="Trade-off" value={rec.tradeoff} valueClass="text-warn" />
        )}
        <Row label="Channels" value={rec.channels.join(" · ")} />
        <Row
          label="Confidence"
          value={`${(rec.confidence * 100).toFixed(0)}% · ETA ${rec.etaToEffect}`}
        />
      </dl>

      {/* Actions list with status */}
      {(rec.status === "FIRING" || rec.status === "EXECUTED" || rec.status === "ROLLED_BACK") && (
        <ul className="mt-3 space-y-1.5 text-[11px]">
          {rec.actions.map((a, i) => (
            <li key={i} className="flex items-center justify-between border-t border-line/60 pt-1.5">
              <span className="flex items-center gap-2">
                <span
                  className={clsx(
                    "h-1.5 w-1.5 rounded-full",
                    a.status === "ACK"
                      ? "bg-accent"
                      : a.status === "FAILED"
                      ? "bg-danger"
                      : "bg-warn animate-pulse"
                  )}
                />
                <span className="text-ink-secondary">{a.channel}</span>
                <span className="text-ink-muted">·</span>
                <span className="text-ink-muted">{a.target}</span>
              </span>
              <span className="text-ink-muted tabular-nums">
                {a.status === "ACK" ? `ACK ${a.latencyMs}ms` : a.status ?? "pending"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-2">
        {rec.status === "PENDING" && (
          <>
            <button onClick={() => approve(rec)} className="btn-primary">
              {rec.appearance === "CRITICAL" ? "Approve · CRITICAL" : "Approve"}
            </button>
            <button className="btn-ghost" disabled>
              Edit
            </button>
            {rec.appearance !== "CRITICAL" && (
              <button onClick={() => reject(rec)} className="btn-danger-ghost">
                Reject
              </button>
            )}
          </>
        )}
        {rec.status === "FIRING" && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-warn animate-pulse">
            Fan-out in progress…
          </span>
        )}
        {rec.status === "EXECUTED" && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-accent">
            ✓ Executed · rollback armed · {rec.rollbackText}
          </span>
        )}
        {rec.status === "ROLLED_BACK" && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            ↺ Rolled back
          </span>
        )}
        {rec.status === "REJECTED" && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            ✗ Rejected — feeds rule weight learning
          </span>
        )}
        {rec.status === "SUPPRESSED" && (
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            ⊘ Suppressed by EVT-SEC-003
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
