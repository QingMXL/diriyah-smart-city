"use client";

import { useStore } from "@/lib/store";
import clsx from "clsx";
import { SectionLabel } from "./ui";

const colorMap: Record<string, string> = {
  good: "text-accent",
  warn: "text-warn",
  danger: "text-danger",
  info: "text-info",
  vip: "text-vip",
};

const dotMap: Record<string, string> = {
  good: "bg-accent",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  vip: "bg-vip",
};

export function AuditLog() {
  const { store } = useStore();
  return (
    <section className="panel p-5 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Audit Log · Event-sourced</SectionLabel>
        <span className="text-[10px] text-ink-muted uppercase tracking-[0.14em]">
          {store.audit.length} entries
        </span>
      </div>
      <ul className="flex-1 overflow-y-auto pr-1 space-y-1.5 text-[11px] font-mono">
        {store.audit.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-2 border-b border-line/40 pb-1.5"
          >
            <span className="text-ink-muted tabular-nums whitespace-nowrap">{a.ts}</span>
            <span
              className={clsx(
                "h-1.5 w-1.5 rounded-full mt-[6px] flex-shrink-0",
                a.color ? dotMap[a.color] : "bg-ink-muted"
              )}
            />
            <div className="flex-1 min-w-0">
              <div className={clsx("truncate", a.color ? colorMap[a.color] : "text-ink-secondary")}>
                {a.kind} · {a.title}
              </div>
              {a.detail && (
                <div className="text-ink-muted truncate">{a.detail}</div>
              )}
              {(a.operator || a.reasonCode) && (
                <div className="text-ink-muted truncate">
                  {a.operator && <>by {a.operator} </>}
                  {a.reasonCode && <>· code {a.reasonCode}</>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
