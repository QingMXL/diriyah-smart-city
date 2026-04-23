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
  // T+0: crowd density rising
  h.pushAudit(
    mkAudit({
      kind: "SCENARIO",
      title: "Scenario 01 · Gate B hotspot armed",
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
      title: "EVT-CROWD-001 matched",
      detail: "hotspots[gate_B].density > 0.80",
      ruleId: "EVT-CROWD-001",
      color: "warn",
    })
  );
  await wait(400);
  if (h.isCancelled()) return;

  const rec = mkRec({
    ruleId: "EVT-CROWD-001",
    title: "Reroute to Gate A",
    zone: "gate_B",
    priority: "HIGH",
    headline: "Gate B Hotspot",
    subtitle: "Redistribute arriving visitors to Gate A",
    affectedVisitors: "~2,000 visitors",
    expectedImpact: "Expected density drop: 0.15",
    channels: ["VMS (3 boards)", "App Push", "PSIM L2"],
    confidence: 0.85,
    etaToEffect: "3–5 min",
    appearance: "STANDARD",
    actions: [
      { channel: "VMS", target: "VMS-B1 / B2 / B3", summary: "Push reroute_to_gate_a content" },
      { channel: "APP_PUSH", target: "users_near_gate_b", summary: "Template crowd_divert_gentle" },
      { channel: "PSIM_NOTIFY", target: "L2 duty", summary: "gate_b_crowd_divert_active" },
    ],
    rollbackText: "Auto-rollback when gate_B.density < 0.55",
  });
  h.pushRec(rec);
}

// ---- Scenario 02 · P4 Saturation --------------------------------------------

async function runP4(h: RunnerHandle) {
  h.pushAudit(
    mkAudit({
      kind: "SCENARIO",
      title: "Scenario 02 · P4 forecast watch",
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
      title: "EVT-PARK-002 matched",
      detail: "forecast(P4,12m) ≥ 0.95 AND P2.forecast < 0.85",
      ruleId: "EVT-PARK-002",
      color: "warn",
    })
  );

  const rec = mkRec({
    ruleId: "EVT-PARK-002",
    title: "Redirect arriving P4-bound vehicles to P2",
    zone: "P4",
    priority: "MEDIUM",
    headline: "P4 Saturation Forecast",
    subtitle: "Pre-emptive redirect — 12 min ahead of saturation",
    affectedVisitors: "~50 vehicles (from app destination data)",
    expectedImpact: "Avoid a 25-min queue on entry road",
    tradeoff: "+80m average walk to destination",
    channels: ["VMS-PARK-ENTRY", "App Push (targeted)"],
    confidence: 0.71,
    etaToEffect: "2 min",
    appearance: "STANDARD",
    actions: [
      { channel: "VMS", target: "VMS-PARK-ENTRY", summary: "P4 full — P2 recommended" },
      { channel: "APP_PUSH", target: "users_dest_p4", summary: "Suggest re-route to P2" },
    ],
    rollbackText: "Clears when P4.forecast drops below 0.85",
  });
  h.pushRec(rec);
}

// ---- Scenario 03 · Medical (CRITICAL) ---------------------------------------

async function runMedical(h: RunnerHandle) {
  h.pushAudit(
    mkAudit({
      kind: "SCENARIO",
      title: "Scenario 03 · PSIM L3 medical incoming",
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
      title: "EVT-SEC-003 matched · CRITICAL",
      detail: "Fusing PSIM L3 + plaza_central density 0.62",
      ruleId: "EVT-SEC-003",
      color: "danger",
    })
  );

  h.pushAudit(
    mkAudit({
      kind: "SUPPRESS",
      title: "Suppressing rules ≤ MEDIUM",
      detail: "Active while L3 medical unresolved",
      color: "warn",
    })
  );

  const rec = mkRec({
    ruleId: "EVT-SEC-003",
    title: "Clear medical path + suppress secondary alerts",
    zone: "plaza_central",
    priority: "CRITICAL",
    headline: "L3 Medical · Plaza Central",
    subtitle: "Medical team 1 dispatched from Gate A",
    affectedVisitors: "Path clearance: corridor M2 → Plaza North",
    expectedImpact: "Expected medical ETA: 4 min (vs 7 min BAU)",
    channels: ["Access (M2)", "App Push", "VMS", "PSIM L1"],
    confidence: 0.92,
    etaToEffect: "< 60 s",
    appearance: "CRITICAL",
    actions: [
      { channel: "ACCESS", target: "M2 corridor", summary: "Reduce to emergency-only throughput" },
      { channel: "APP_PUSH", target: "users_along_path", summary: "Please make way for emergency services" },
      { channel: "VMS", target: "Plaza-N", summary: "Direct pedestrians to alternate exits" },
      { channel: "PSIM_NOTIFY", target: "L1 + Facility Director", summary: "Escalate + coordinate escort" },
    ],
    rollbackText: "Auto-clears when PSIM L3 marked resolved",
  });
  h.pushRec(rec);
}

// ---- Scenario 04 · Rain Overlay ---------------------------------------------

async function runRain(h: RunnerHandle) {
  h.pushAudit(
    mkAudit({
      kind: "SCENARIO",
      title: "Scenario 04 · Weather forecast flip",
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
      title: "EVT-WEATHER-001 matched · BATCH",
      detail: "forecast.rain_60min confidence 0.88",
      ruleId: "EVT-WEATHER-001",
      color: "warn",
    })
  );

  const rec = mkRec({
    ruleId: "EVT-WEATHER-001",
    title: "Activate rain overlay (batch)",
    priority: "HIGH",
    headline: "Rain Overlay · 3 coordinated actions",
    subtitle: "Overlay weights, don't replace rules",
    affectedVisitors: "All attendees",
    expectedImpact: "Covered-parking weight +30% · rain-aware messaging · umbrella offer trigger armed",
    channels: ["Parking (weights)", "VMS (templates)", "App Push (rain)"],
    confidence: 0.88,
    etaToEffect: "Immediate",
    appearance: "BATCH",
    actions: [
      { channel: "ACCESS", target: "Parking weights", summary: "Covered lots preference +30%" },
      { channel: "VMS", target: "All boards", summary: "Switch to rain-active variants" },
      { channel: "APP_PUSH", target: "All users", summary: "Rain expected · umbrella stations active" },
    ],
    rollbackText: "Decays 30 min after forecast clears",
  });
  h.pushRec(rec);
}

// ---- Scenario 05 · VIP Convoy (Parallel) ------------------------------------

async function runVip(h: RunnerHandle) {
  h.pushAudit(
    mkAudit({
      kind: "SCENARIO",
      title: "Scenario 05 · ANPR match on extended VIP list",
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
      title: "EVT-VIP-001 matched (parallel)",
      detail: "Runs alongside active recommendations",
      ruleId: "EVT-VIP-001",
      color: "vip",
    })
  );

  const rec = mkRec({
    ruleId: "EVT-VIP-001",
    title: "Open VIP lane · coordinate escort",
    priority: "HIGH",
    headline: "VIP Convoy · 500m approaching",
    subtitle: "Plate recognized on extended VIP list",
    affectedVisitors: "~90 s regular lane pacing −15% (invisible to visitors)",
    expectedImpact: "Clear VIP passage · regular flow uninterrupted",
    channels: ["Access (VIP lane)", "PSIM L1", "Gate staff push"],
    confidence: 0.96,
    etaToEffect: "< 10 s",
    appearance: "VIP",
    actions: [
      { channel: "ACCESS", target: "Main entrance", summary: "Open VIP lane · regular pacing −15%" },
      { channel: "APP_PUSH", target: "Gate staff (internal)", summary: "Brief: escort incoming" },
      { channel: "PSIM_NOTIFY", target: "L1 · Escort coord.", summary: "Coordinate escort + clearance" },
    ],
    rollbackText: "Lane closes after convoy clears",
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

// --- Effects animation: updates state over time, arms auto-rollback ----------

async function effectsGateB(h: RunnerHandle) {
  // Gradually drop gate_B density; raise gate_A modestly
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
      title: "Auto-rollback fired · Gate B back to normal",
      detail: "gate_B.density crossed below 0.55",
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
      title: "P4 stabilised at 82% · overlay released",
      ruleId: "EVT-PARK-002",
      color: "good",
    })
  );
}

async function effectsMedical(h: RunnerHandle) {
  // Clear the path: plaza density drops, medical team arrives
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
      title: "Medical resolved · suppression lifted",
      detail: "Medics arrived in 3m 50s · rules ≤ MEDIUM re-enabled",
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
  // rain arrives
  h.setState((s) => ({
    ...s,
    weather: { ...s.weather, condition: "RAINING" },
    parking: { ...s.parking, P1: 0.98, P3: 0.62 }, // covered lots fill up
  }));
  h.pushAudit(
    mkAudit({
      kind: "ACTION_ACK",
      title: "Covered-lot preference engaged · +22% fill",
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
      title: "VIP convoy through · regular flow uninterrupted",
      ruleId: "EVT-VIP-001",
      color: "vip",
    })
  );
  h.setState((s) => ({
    ...s,
    vip: { active: false },
  }));
}

// ---- Public audit/rec helpers (used by the runner when operator acts) -------

export { mkAudit, mkRec };
