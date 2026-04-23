"use client";

import { useStore } from "@/lib/store";
import { useLocale } from "@/lib/locale";
import clsx from "clsx";
import { SectionLabel } from "./ui";

export function FlowMap() {
  const { store } = useStore();
  const { t, dir } = useLocale();
  const s = store.state;

  const gateA = s.hotspots.find((h) => h.zone === "gate_A");
  const gateB = s.hotspots.find((h) => h.zone === "gate_B");
  const plaza = s.hotspots.find((h) => h.zone === "plaza_central");

  const divertActive =
    s.corridors.A.divertActive || s.corridors.B.divertActive;

  const criticalPlaza =
    (plaza?.severity === "HIGH" || plaza?.severity === "CRITICAL") && s.psim.critical > 0;

  return (
    <section className="panel p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>{t("map.title")}</SectionLabel>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-ink-muted">
          {divertActive && (
            <span className="chip !text-accent !border-accent/40">
              <span className="h-1 w-1 rounded-full bg-accent" /> {t("map.divertActive")}
            </span>
          )}
          {s.overlays.rain && (
            <span className="chip !text-info !border-info/40">
              <span className="h-1 w-1 rounded-full bg-info" /> {t("map.rainOverlay")}
            </span>
          )}
          {s.vip.active && (
            <span className="chip !text-vip !border-vip/50">
              <span className="h-1 w-1 rounded-full bg-vip" /> {t("map.vipInbound")}
            </span>
          )}
        </div>
      </div>

      {/* Keep the SVG always LTR so geometry stays right regardless of page dir */}
      <div className="relative flex-1 rounded-md grid-dots overflow-hidden" dir="ltr">
        <svg viewBox="0 0 600 320" className="absolute inset-0 w-full h-full">
          <path d="M 50 160 Q 200 70 300 160" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="28" strokeLinecap="round" />
          <path d="M 300 160 Q 420 80 560 140" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="28" strokeLinecap="round" />
          <path d="M 300 160 L 300 280" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="22" strokeLinecap="round" />

          {divertActive && (
            <path d="M 470 110 Q 320 30 130 140" fill="none" stroke="#3ec1a6" strokeWidth="2" strokeDasharray="6 8" className="animate-dash" />
          )}

          {criticalPlaza && (
            <path d="M 130 140 L 260 190 L 300 250" fill="none" stroke="#ef5e5e" strokeWidth="3" strokeDasharray="5 7" className="animate-dash" />
          )}

          <ZoneNode x={120} y={140} label="A" sub={t("zone.gate_A")} value={gateA?.density ?? 0} rising={gateA?.trend === "RISING"} />
          <ZoneNode x={470} y={110} label="B" sub={t("zone.gate_B")} value={gateB?.density ?? 0} rising={gateB?.trend === "RISING"} />
          <ZoneNode x={300} y={250} label="P" sub={t("zone.plaza_central")} value={plaza?.density ?? 0} rising={plaza?.trend === "RISING"} critical={criticalPlaza} />

          <ParkLot x={60} y={60} label="P1" value={s.parking.P1} />
          <ParkLot x={560} y={60} label="P4" value={s.parking.P4} />
          <ParkLot x={60} y={280} label="P3" value={s.parking.P3} />
          <ParkLot x={560} y={280} label="P2" value={s.parking.P2} />

          {s.vip.active && (
            <g>
              <circle cx={30} cy={200} r="6" fill="#d4af37">
                <animate attributeName="cx" from="30" to="110" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="1" to="0.3" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <text x="30" y="190" fontSize="9" fill="#d4af37">
                {t("map.vipShort")} · {s.vip.approachDistanceM ?? 0}m
              </text>
            </g>
          )}
        </svg>

        {divertActive && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.18em] text-accent/80">
            {t("map.proposedDivert")}
          </div>
        )}
        {criticalPlaza && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.18em] text-danger animate-blink">
            {t("map.medicalClearance")}
          </div>
        )}
      </div>
    </section>
  );
}

function ZoneNode({
  x,
  y,
  label,
  sub,
  value,
  rising,
  critical,
}: {
  x: number;
  y: number;
  label: string;
  sub: string;
  value: number;
  rising?: boolean;
  critical?: boolean;
}) {
  const ringColor = critical ? "#ef5e5e" : value >= 0.8 ? "#ef5e5e" : value >= 0.6 ? "#f5a524" : "#3ec1a6";
  const r = 42;
  const pct = Math.max(0, Math.min(1, value));
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;

  return (
    <g>
      <circle cx={x} cy={y} r={r + 8} fill="rgba(255,255,255,0.02)" />
      <circle cx={x} cy={y} r={r} fill="#17232c" stroke="#233543" strokeWidth="1" />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={ringColor}
        strokeWidth="3"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${x} ${y})`}
        style={{ transition: "stroke-dasharray 0.7s ease, stroke 0.3s ease" }}
      />
      <text x={x} y={y + 5} textAnchor="middle" fontSize="22" fontFamily="ui-serif, Georgia, serif" fill="#e8f0f3">
        {label}
      </text>
      <text x={x} y={y + r + 18} textAnchor="middle" fontSize="10" fill="#9eb0bc" style={{ letterSpacing: "0.08em" }}>
        {sub}
      </text>
      <text x={x} y={y + r + 32} textAnchor="middle" fontSize="10" fill={ringColor}>
        {(value * 100).toFixed(0)}% {rising ? "↑" : ""}
      </text>
    </g>
  );
}

function ParkLot({ x, y, label, value }: { x: number; y: number; label: string; value: number }) {
  const color = value >= 0.9 ? "#ef5e5e" : value >= 0.75 ? "#f5a524" : "#3ec1a6";
  return (
    <g>
      <rect x={x - 18} y={y - 14} width="36" height="28" rx="4" fill="#17232c" stroke="#233543" />
      <rect
        x={x - 18}
        y={y - 14 + (28 - 28 * value)}
        width="36"
        height={28 * value}
        rx="4"
        fill={color}
        opacity="0.25"
        style={{ transition: "height 0.7s ease, y 0.7s ease, fill 0.3s ease" }}
      />
      <text x={x} y={y + 3} textAnchor="middle" fontSize="10" fill="#e8f0f3">
        {label}
      </text>
      <text x={x} y={y + 26} textAnchor="middle" fontSize="9" fill={color}>
        {(value * 100).toFixed(0)}%
      </text>
    </g>
  );
}
