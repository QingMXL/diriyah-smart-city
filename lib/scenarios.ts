import type {
  AuditEntry,
  Recommendation,
  ScenarioKey,
  ScenarioState,
} from "./types";

// ---- Helpers ---------------------------------------------------------------

let auditCounter = 0;
let recCounter = 0;

function ts() {
  const d = new Date();
  return d.toISOString().replace("T", " ").slice(11, 19);
}

function mkAudit(partial: Omit<AuditEntry, "id" | "ts">): AuditEntry {
  auditCounter += 1;
  return {
    id: `audit-${auditCounter}-${Date.now()}`,
    ts: ts(),
    ...partial,
  };
}

function mkRec(partial: Omit<Recommendation, "id" | "createdAt" | "status">): Recommendation {
  recCounter += 1;
  return {
    id: `rec-${recCounter}-${Date.now()}`,
    createdAt: ts(),
    status: "PENDING",
    ...partial,
  };
}

// ---- API exposed to the runner ----------------------------------------------

export interface RunnerHandle {
  pushAudit: (a: AuditEntry) => void;
  pushRec: (r: Recommendation) => void;
  patchState: (p: Partial<ScenarioState>) => void;
  setState: (u: (s: ScenarioState) => ScenarioState) => void;
  markRecStatus: (id: string, status: Recommendation["status"], resultNote?: string) => void;
  markActionAck: (recId: string, idx: number, latencyMs: number) => void;
  isCancelled: () => boolean;
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---- Scenario 01 · Gate B Hotspot -------------------------------------------

async function runGateB(h: RunnerHandle) {
  h.pushAudit(
    mkAudit({
      kind: "SCENARIO",
      title: { key: "s01.armed" },
      color: "info",
    })
  );
  h.setState((s) => ({
    ...s,
    hotspots: s.hotspots.map((p) =>
      p.zone === "gate_B"
        ? { ...p, density: 0.72, trend: "RISING", severity: "MEDIUM" }
        : p
    ),
  }));
  await wait(1400);
  if (h.isCancelled()) return;

  h.setState((s) => ({
    ...s,
    hotspots: s.hotspots.map((p) =>
      p.zone === "gate_B"
        ? { ...p, density: 0.82, trend: "RISING", severity: "HIGH" }
        : p
    ),
  }));
  h.pushAudit(
    mkAudit({
      kind: "RULE_FIRE",
      title: { key: "s01.match" },
      detail: { key: "s01.match.detail" },
      ruleId: "EVT-CROWD-001",
      color: "warn",
    })
  );
  await wait(400);
  if (h.isCancelled()) return;

  const rec = mkRec({
    ruleId: "EVT-CROWD-001",
    title: { key: "s01.rec.title" },
    zone: "gate_B",
    priority: "HIGH",
    headline: { key: "s01.rec.headline" },
    subtitle: { key: "s01.rec.subtitle" },
    affectedVisitors: { key: "s01.rec.affects" },
    expectedImpact: { key: "s01.rec.impact" },
    channels: { key: "s01.rec.channels" },
    confidence: 0.85,
    etaToEffect: "3–5 min",
    appearance: "STANDARD",
    actions: [
      { channel: "VMS", target: "VMS-B1 / B2 / B3", summary: { key: "s01.action.vms" } },
      { channel: "APP_PUSH", target: "users_near_gate_b", summary: { key: "s01.action.app" } },
      { channel: "PSIM_NOTIFY", target: "L2 duty", summary: { key: "s01.action.psim" } },
    ],
    rollbackText: { key: "s01.rec.rollback" },
  });
  h.pushRec(rec);
}

// ---- Scenario 02 · P4 Saturation --------------------------------------------

async function runP4(h: RunnerHandle) {
  h.pushAudit(
    mkAudit({
      kind: "SCENARIO",
      title: { key: "s02.armed" },
      color: "info",
    })
  );
  h.setState((s) => ({
    ...s,
    parking: { ...s.parking, P4: 0.82 },
    parkingForecast12m: { ...s.parkingForecast12m, P4: 0.99 },
  }));
  await wait(800);
  if (h.isCancelled()) return;

  h.pushAudit(
    mkAudit({
      kind: "RULE_FIRE",
      title: { key: "s02.match" },
      detail: { key: "s02.match.detail" },
      ruleId: "EVT-PARK-002",
      color: "warn",
    })
  );

  const rec = mkRec({
    ruleId: "EVT-PARK-002",
    title: { key: "s02.rec.title" },
    zone: "P4",
    priority: "MEDIUM",
    headline: { key: "s02.rec.headline" },
    subtitle: { key: "s02.rec.subtitle" },
    affectedVisitors: { key: "s02.rec.affects" },
    expectedImpact: { key: "s02.rec.impact" },
    tradeoff: { key: "s02.rec.tradeoff" },
    channels: { key: "s02.rec.channels" },
    confidence: 0.71,
    etaToEffect: "2 min",
    appearance: "STANDARD",
    actions: [
      { channel: "VMS", target: "VMS-PARK-ENTRY", summary: { key: "s02.action.vms" } },
      { channel: "APP_PUSH", target: "users_dest_p4", summary: { key: "s02.action.app" } },
    ],
    rollbackText: { key: "s02.rec.rollback" },
  });
  h.pushRec(rec);
}

// ---- Scenario 03 · Medical (CRITICAL) ---------------------------------------

async function runMedical(h: RunnerHandle) {
  h.pushAudit(
    mkAudit({
      kind: "SCENARIO",
      title: { key: "s03.armed" },
      color: "danger",
    })
  );
  h.setState((s) => ({
    ...s,
    psim: {
      activeIncidents: s.psim.activeIncidents + 1,
      critical: s.psim.critical + 1,
      lastEvent: "L3_MEDICAL @ plaza_central",
    },
    hotspots: s.hotspots.map((p) =>
      p.zone === "plaza_central"
        ? { ...p, density: 0.62, trend: "STABLE", severity: "HIGH" }
        : p
    ),
  }));
  await wait(900);
  if (h.isCancelled()) return;

  h.pushAudit(
    mkAudit({
      kind: "RULE_FIRE",
      title: { key: "s03.match" },
      detail: { key: "s03.match.detail" },
      ruleId: "EVT-SEC-003",
      color: "danger",
    })
  );

  h.pushAudit(
    mkAudit({
      kind: "SUPPRESS",
      title: { key: "s03.suppress" },
      detail: { key: "s03.suppress.detail" },
      color: "warn",
    })
  );

  const rec = mkRec({
    ruleId: "EVT-SEC-003",
    title: { key: "s03.rec.title" },
    zone: "plaza_central",
    priority: "CRITICAL",
    headline: { key: "s03.rec.headline" },
    subtitle: { key: "s03.rec.subtitle" },
    affectedVisitors: { key: "s03.rec.affects" },
    expectedImpact: { key: "s03.rec.impact" },
    channels: { key: "s03.rec.channels" },
    confidence: 0.92,
    etaToEffect: "< 60 s",
    appearance: "CRITICAL",
    actions: [
      { channel: "ACCESS", target: "M2 corridor", summary: { key: "s03.action.access" } },
      { channel: "APP_PUSH", target: "users_along_path", summary: { key: "s03.action.app" } },
      { channel: "VMS", target: "Plaza-N", summary: { key: "s03.action.vms" } },
      { channel: "PSIM_NOTIFY", target: "L1 + Facility Director", summary: { key: "s03.action.psim" } },
    ],
    rollbackText: { key: "s03.rec.rollback" },
  });
  h.pushRec(rec);
}

// ---- Scenario 04 · Rain Overlay ---------------------------------------------

async function runRain(h: RunnerHandle) {
  h.pushAudit(
    mkAudit({
      kind: "SCENARIO",
      title: { key: "s04.armed" },
      color: "info",
    })
  );
  h.setState((s) => ({
    ...s,
    weather: { ...s.weather, forecast60min: "RAINING", forecastConfidence: 0.88 },
  }));
  await wait(700);
  if (h.isCancelled()) return;

  h.pushAudit(
    mkAudit({
      kind: "RULE_FIRE",
      title: { key: "s04.match" },
      detail: { key: "s04.match.detail" },
      ruleId: "EVT-WEATHER-001",
      color: "warn",
    })
  );

  const rec = mkRec({
    ruleId: "EVT-WEATHER-001",
    title: { key: "s04.rec.title" },
    priority: "HIGH",
    headline: { key: "s04.rec.headline" },
    subtitle: { key: "s04.rec.subtitle" },
    affectedVisitors: { key: "s04.rec.affects" },
    expectedImpact: { key: "s04.rec.impact" },
    channels: { key: "s04.rec.channels" },
    confidence: 0.88,
    etaToEffect: "Immediate",
    appearance: "BATCH",
    actions: [
      { channel: "ACCESS", target: "Parking weights", summary: { key: "s04.action.access" } },
      { channel: "VMS", target: "All boards", summary: { key: "s04.action.vms" } },
      { channel: "APP_PUSH", target: "All users", summary: { key: "s04.action.app" } },
    ],
    rollbackText: { key: "s04.rec.rollback" },
  });
  h.pushRec(rec);
}

// ---- Scenario 05 · VIP Convoy (Parallel) ------------------------------------

async function runVip(h: RunnerHandle) {
  h.pushAudit(
    mkAudit({
      kind: "SCENARIO",
      title: { key: "s05.armed" },
      color: "vip",
    })
  );
  h.setState((s) => ({
    ...s,
    vip: { active: true, plateLast4: "****A47", approachDistanceM: 500 },
  }));
  await wait(600);
  if (h.isCancelled()) return;

  h.pushAudit(
    mkAudit({
      kind: "RULE_FIRE",
      title: { key: "s05.match" },
      detail: { key: "s05.match.detail" },
      ruleId: "EVT-VIP-001",
      color: "vip",
    })
  );

  const rec = mkRec({
    ruleId: "EVT-VIP-001",
    title: { key: "s05.rec.title" },
    priority: "HIGH",
    headline: { key: "s05.rec.headline" },
    subtitle: { key: "s05.rec.subtitle" },
    affectedVisitors: { key: "s05.rec.affects" },
    expectedImpact: { key: "s05.rec.impact" },
    channels: { key: "s05.rec.channels" },
    confidence: 0.96,
    etaToEffect: "< 10 s",
    appearance: "VIP",
    actions: [
      { channel: "ACCESS", target: "Main entrance", summary: { key: "s05.action.access" } },
      { channel: "APP_PUSH", target: "Gate staff (internal)", summary: { key: "s05.action.app" } },
      { channel: "PSIM_NOTIFY", target: "L1 · Escort coord.", summary: { key: "s05.action.psim" } },
    ],
    rollbackText: { key: "s05.rec.rollback" },
  });
  h.pushRec(rec);
}

// ---- Dispatcher -------------------------------------------------------------

export async function runScenario(key: ScenarioKey, h: RunnerHandle) {
  switch (key) {
    case "S01_GATE_B":
      return runGateB(h);
    case "S02_P4":
      return runP4(h);
    case "S03_MEDICAL":
      return runMedical(h);
    case "S04_RAIN":
      return runRain(h);
    case "S05_VIP":
      return runVip(h);
  }
}

// ---- Post-approval effects --------------------------------------------------

export function effectsForRule(
  ruleId: string,
  h: RunnerHandle
): Promise<void> {
  switch (ruleId) {
    case "EVT-CROWD-001":
      return effectsGateB(h);
    case "EVT-PARK-002":
      return effectsP4(h);
    case "EVT-SEC-003":
      return effectsMedical(h);
    case "EVT-WEATHER-001":
      return effectsRain(h);
    case "EVT-VIP-001":
      return effectsVip(h);
    default:
      return Promise.resolve();
  }
}

// --- Effects animation -------------------------------------------------------

async function effectsGateB(h: RunnerHandle) {
  const steps = [0.78, 0.74, 0.7, 0.66, 0.62, 0.58, 0.54];
  for (let i = 0; i < steps.length; i++) {
    if (h.isCancelled()) return;
    const v = steps[i];
    h.setState((s) => ({
      ...s,
      hotspots: s.hotspots.map((p) =>
        p.zone === "gate_B"
          ? {
              ...p,
              density: v,
              trend: "FALLING",
              severity: v > 0.75 ? "HIGH" : v > 0.55 ? "MEDIUM" : "LOW",
            }
          : p.zone === "gate_A"
          ? { ...p, density: Math.min(0.55, p.density + 0.02), trend: "RISING" }
          : p
      ),
      corridors: {
        ...s.corridors,
        A: { ...s.corridors.A, divertActive: true, load: Math.min(0.6, s.corridors.A.load + 0.02) },
        B: { ...s.corridors.B, divertActive: true },
      },
      kpi: {
        ...s.kpi,
        incidentResponseSec: Math.max(60, s.kpi.incidentResponseSec - 4),
        manualCoordSteps: Math.max(2.4, +(s.kpi.manualCoordSteps - 0.05).toFixed(2)),
        proactiveRatio: [Math.min(68, s.kpi.proactiveRatio[0] + 1), Math.max(32, s.kpi.proactiveRatio[1] - 1)] as [number, number],
      },
    }));
    await wait(700);
  }
  h.pushAudit(
    mkAudit({
      kind: "ROLLBACK",
      title: { key: "s01.rollback" },
      detail: { key: "s01.rollback.detail" },
      ruleId: "EVT-CROWD-001",
      color: "good",
    })
  );
  h.setState((s) => ({
    ...s,
    corridors: {
      ...s.corridors,
      A: { ...s.corridors.A, divertActive: false },
      B: { ...s.corridors.B, divertActive: false },
    },
  }));
}

async function effectsP4(h: RunnerHandle) {
  const p4Steps = [0.85, 0.87, 0.87, 0.86, 0.84, 0.82];
  const p2Steps = [0.72, 0.75, 0.78, 0.8, 0.8, 0.79];
  for (let i = 0; i < p4Steps.length; i++) {
    if (h.isCancelled()) return;
    h.setState((s) => ({
      ...s,
      parking: { ...s.parking, P4: p4Steps[i], P2: p2Steps[i] },
      kpi: {
        ...s.kpi,
        incidentResponseSec: Math.max(60, s.kpi.incidentResponseSec - 3),
        manualCoordSteps: Math.max(2.4, +(s.kpi.manualCoordSteps - 0.04).toFixed(2)),
        proactiveRatio: [Math.min(68, s.kpi.proactiveRatio[0] + 1), Math.max(32, s.kpi.proactiveRatio[1] - 1)] as [number, number],
      },
    }));
    await wait(700);
  }
  h.pushAudit(
    mkAudit({
      kind: "ROLLBACK",
      title: { key: "s02.rollback" },
      ruleId: "EVT-PARK-002",
      color: "good",
    })
  );
}

async function effectsMedical(h: RunnerHandle) {
  const densitySteps = [0.56, 0.48, 0.42, 0.38, 0.34, 0.32];
  for (let i = 0; i < densitySteps.length; i++) {
    if (h.isCancelled()) return;
    h.setState((s) => ({
      ...s,
      hotspots: s.hotspots.map((p) =>
        p.zone === "plaza_central"
          ? { ...p, density: densitySteps[i], trend: "FALLING", severity: densitySteps[i] > 0.5 ? "HIGH" : "MEDIUM" }
          : p
      ),
    }));
    await wait(650);
  }
  h.pushAudit(
    mkAudit({
      kind: "ROLLBACK",
      title: { key: "s03.rollback" },
      detail: { key: "s03.rollback.detail" },
      ruleId: "EVT-SEC-003",
      color: "good",
    })
  );
  h.setState((s) => ({
    ...s,
    psim: {
      activeIncidents: Math.max(1, s.psim.activeIncidents - 1),
      critical: Math.max(0, s.psim.critical - 1),
      lastEvent: "L3_MEDICAL resolved",
    },
  }));
}

async function effectsRain(h: RunnerHandle) {
  await wait(400);
  h.setState((s) => ({ ...s, overlays: { ...s.overlays, rain: true } }));
  await wait(900);
  h.setState((s) => ({
    ...s,
    weather: { ...s.weather, condition: "RAINING" },
    parking: { ...s.parking, P1: 0.98, P3: 0.62 },
  }));
  h.pushAudit(
    mkAudit({
      kind: "ACTION_ACK",
      title: { key: "s04.ack.covered" },
      ruleId: "EVT-WEATHER-001",
      color: "info",
    })
  );
}

async function effectsVip(h: RunnerHandle) {
  const steps = [400, 300, 200, 100, 0];
  for (let i = 0; i < steps.length; i++) {
    if (h.isCancelled()) return;
    h.setState((s) => ({
      ...s,
      vip: { ...s.vip, approachDistanceM: steps[i] },
    }));
    await wait(500);
  }
  h.pushAudit(
    mkAudit({
      kind: "ROLLBACK",
      title: { key: "s05.rollback" },
      ruleId: "EVT-VIP-001",
      color: "vip",
    })
  );
  h.setState((s) => ({
    ...s,
    vip: { active: false },
  }));
}

export { mkAudit, mkRec };
