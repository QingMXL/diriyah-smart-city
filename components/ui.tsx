"use client";

import clsx from "clsx";

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("section-label mb-1.5", className)}>{children}</div>;
}

export function Bar({
  value,
  colorClass = "bg-accent",
  height = "h-1.5",
  max = 1,
}: {
  value: number;
  colorClass?: string;
  height?: string;
  max?: number;
}) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className={clsx("w-full rounded-full bg-bg-elevated overflow-hidden", height)}>
      <div
        className={clsx("h-full transition-all duration-700", colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Dot({ color = "bg-accent", size = "h-1.5 w-1.5" }: { color?: string; size?: string }) {
  return <span className={clsx("inline-block rounded-full", size, color)} />;
}

export function severityColor(value: number) {
  if (value >= 0.8) return "bg-danger";
  if (value >= 0.6) return "bg-warn";
  if (value >= 0.4) return "bg-info";
  return "bg-accent";
}

export function severityText(value: number) {
  if (value >= 0.8) return "text-danger";
  if (value >= 0.6) return "text-warn";
  if (value >= 0.4) return "text-info";
  return "text-accent";
}

export function Trend({ trend }: { trend: "RISING" | "STABLE" | "FALLING" }) {
  if (trend === "RISING") return <span className="text-danger">↑</span>;
  if (trend === "FALLING") return <span className="text-accent">↓</span>;
  return <span className="text-ink-muted">→</span>;
}
