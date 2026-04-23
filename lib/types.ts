// Scenario state model — mirrors §04 of the Deep Dive doc.

export type Stage = "BEFORE" | "ARRIVAL" | "DURING_EVENT" | "DISPERSAL";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Trend = "RISING" | "STABLE" | "FALLING";
export type WeatherCondition = "CLEAR" | "RAINING" | "CLOUDY";

export interface Hotspot {
  zone: string;
  label: string;
  density: number;
  trend: Trend;
  severity: Severity;
}

export interface CorridorState {
  load: number;
  forecast20min: number;
  divertActive: boolean;
}

export interface ScenarioState {
  eventId: string;
  eventName: string;
  stage: Stage;
  stageProgress: number; // 0..1 overall progress across 4 stages
  eventClock: string; // display clock, e.g. "19:42"
  elapsedLabel: string; // e.g. "T+1h 12m"
  attendance: {
    current: number;
    capacity: number;
    fillRate: number;
    arrivalVelocity: number; // /min
  };
  corridors: { A: CorridorState; B: CorridorState };
  parking: { P1: number; P2: number; P3: number; P4: number };
  parkingForecast12m?: { P1?: number; P2?: number; P3?: number; P4?: number };
  hotspots: Hotspot[];
  psim: { activeIncidents: number; critical: number; lastEvent: string };
  weather: { tempC: number; condition: WeatherCondition; forecast60min: WeatherCondition; forecastConfidence: number };
  overlays: { rain: boolean };
  vip: { active: boolean; plateLast4?: string; approachDistanceM?: number };
  // KPIs
  kpi: {
    incidentResponseSec: number; // live value, target drop vs BAU
    responseDeltaPct: number; // % vs BAU (negative = better)
    manualCoordSteps: number;
    manualCoordDeltaPct: number;
    proactiveRatio: [number, number]; // [proactive, reactive]
  };
}

export type ChannelKey = "VMS" | "APP_PUSH" | "ACCESS" | "PSIM_NOTIFY";

export interface ActionSpec {
  channel: ChannelKey;
  target?: string;
  summary: string;
  status?: "PENDING" | "FIRING" | "ACK" | "FAILED";
  latencyMs?: number;
}

export interface Recommendation {
  id: string;
  ruleId: string;
  title: string;
  zone?: string;
  priority: Priority;
  headline: string;
  subtitle?: string;
  affectedVisitors?: string;
  expectedImpact?: string;
  tradeoff?: string;
  channels: string[];
  confidence: number;
  etaToEffect: string;
  actions: ActionSpec[];
  status: "PENDING" | "FIRING" | "EXECUTED" | "ROLLED_BACK" | "REJECTED" | "SUPPRESSED";
  createdAt: string;
  appearance?: "STANDARD" | "CRITICAL" | "VIP" | "BATCH";
  // Effects applied after approval
  onApprove?: (ctx: ScenarioState) => Partial<ScenarioState>;
  // Rollback trigger description (text)
  rollbackText?: string;
  // Optional reason shown post-execution
  resultNote?: string;
}

export interface AuditEntry {
  id: string;
  ts: string;
  kind: "DECISION" | "ACTION_ACK" | "ROLLBACK" | "RULE_FIRE" | "SCENARIO" | "SUPPRESS";
  title: string;
  detail?: string;
  ruleId?: string;
  reasonCode?: string;
  operator?: string;
  color?: "good" | "warn" | "danger" | "info" | "vip";
}

export type ScenarioKey =
  | "S01_GATE_B"
  | "S02_P4"
  | "S03_MEDICAL"
  | "S04_RAIN"
  | "S05_VIP";

export interface ScenarioDescriptor {
  key: ScenarioKey;
  number: string; // "01"
  shortTitle: string;
  longTitle: string;
  ruleId: string;
  priority: Priority;
  outcome: string;
  tag: string;
}
