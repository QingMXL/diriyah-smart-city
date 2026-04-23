"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type {
  AuditEntry,
  Recommendation,
  ScenarioKey,
  ScenarioState,
} from "./types";
import { initialState } from "./initialState";
import { effectsForRule, mkAudit, runScenario } from "./scenarios";

// ---- Reducer ---------------------------------------------------------------

interface Store {
  state: ScenarioState;
  recommendations: Recommendation[];
  audit: AuditEntry[];
  activeScenario: ScenarioKey | null;
  suppression: boolean;
}

type Action =
  | { type: "PATCH_STATE"; patch: Partial<ScenarioState> }
  | { type: "SET_STATE"; updater: (s: ScenarioState) => ScenarioState }
  | { type: "PUSH_REC"; rec: Recommendation }
  | { type: "UPDATE_REC"; id: string; patch: Partial<Recommendation> }
  | { type: "ACK_ACTION"; recId: string; idx: number; latencyMs: number }
  | { type: "PUSH_AUDIT"; entry: AuditEntry }
  | { type: "SET_SUPPRESSION"; on: boolean }
  | { type: "SET_ACTIVE_SCENARIO"; key: ScenarioKey | null }
  | { type: "RESET" };

const initial: Store = {
  state: initialState,
  recommendations: [],
  audit: [
    {
      id: "seed-0",
      ts: "—",
      kind: "SCENARIO",
      title: { key: "seed.consoleLive" },
      color: "info",
    },
  ],
  activeScenario: null,
  suppression: false,
};

function reducer(store: Store, action: Action): Store {
  switch (action.type) {
    case "PATCH_STATE":
      return { ...store, state: { ...store.state, ...action.patch } };
    case "SET_STATE":
      return { ...store, state: action.updater(store.state) };
    case "PUSH_REC":
      // Suppression: if a CRITICAL rule is active, lower priority recs become SUPPRESSED.
      if (
        store.suppression &&
        (action.rec.priority === "LOW" || action.rec.priority === "MEDIUM")
      ) {
        return {
          ...store,
          recommendations: [
            { ...action.rec, status: "SUPPRESSED" },
            ...store.recommendations,
          ],
        };
      }
      return {
        ...store,
        recommendations: [action.rec, ...store.recommendations],
        // enable suppression when a CRITICAL rec arrives
        suppression: action.rec.priority === "CRITICAL" ? true : store.suppression,
      };
    case "UPDATE_REC":
      return {
        ...store,
        recommendations: store.recommendations.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
        suppression:
          action.patch.status === "EXECUTED" || action.patch.status === "ROLLED_BACK"
            ? store.recommendations.find((r) => r.id === action.id)?.priority === "CRITICAL"
              ? false
              : store.suppression
            : store.suppression,
      };
    case "ACK_ACTION":
      return {
        ...store,
        recommendations: store.recommendations.map((r) => {
          if (r.id !== action.recId) return r;
          return {
            ...r,
            actions: r.actions.map((a, i) =>
              i === action.idx ? { ...a, status: "ACK", latencyMs: action.latencyMs } : a
            ),
          };
        }),
      };
    case "PUSH_AUDIT":
      return { ...store, audit: [action.entry, ...store.audit].slice(0, 60) };
    case "SET_SUPPRESSION":
      return { ...store, suppression: action.on };
    case "SET_ACTIVE_SCENARIO":
      return { ...store, activeScenario: action.key };
    case "RESET":
      return initial;
    default:
      return store;
  }
}

// ---- Context ---------------------------------------------------------------

interface Ctx {
  store: Store;
  triggerScenario: (key: ScenarioKey) => void;
  approve: (rec: Recommendation) => void;
  reject: (rec: Recommendation) => void;
  reset: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, dispatch] = useReducer(reducer, initial);
  const cancelRef = useRef(false);

  const handle = useMemo(
    () => ({
      pushAudit: (a: AuditEntry) => dispatch({ type: "PUSH_AUDIT", entry: a }),
      pushRec: (r: Recommendation) => dispatch({ type: "PUSH_REC", rec: r }),
      patchState: (p: Partial<ScenarioState>) => dispatch({ type: "PATCH_STATE", patch: p }),
      setState: (u: (s: ScenarioState) => ScenarioState) =>
        dispatch({ type: "SET_STATE", updater: u }),
      markRecStatus: (id: string, status: Recommendation["status"], resultNote?: string) =>
        dispatch({ type: "UPDATE_REC", id, patch: { status, resultNote } }),
      markActionAck: (recId: string, idx: number, latencyMs: number) =>
        dispatch({ type: "ACK_ACTION", recId, idx, latencyMs }),
      isCancelled: () => cancelRef.current,
    }),
    []
  );

  const triggerScenario = useCallback(
    (key: ScenarioKey) => {
      dispatch({ type: "SET_ACTIVE_SCENARIO", key });
      runScenario(key, handle);
    },
    [handle]
  );

  const approve = useCallback(
    async (rec: Recommendation) => {
      dispatch({
        type: "UPDATE_REC",
        id: rec.id,
        patch: { status: "FIRING" },
      });
      dispatch({
        type: "PUSH_AUDIT",
        entry: mkAudit({
          kind: "DECISION",
          title: { key: "decision.approved", params: { title: rec.ruleId } },
          detail: {
            key: "decision.detail.rule",
            params: { rule: rec.ruleId, priority: rec.priority },
          },
          ruleId: rec.ruleId,
          reasonCode: rec.priority === "CRITICAL" ? "L3_MEDICAL" : "OPERATOR_APPROVED",
          operator: { key: "decision.operator" },
          color: rec.appearance === "VIP" ? "vip" : rec.priority === "CRITICAL" ? "danger" : "good",
        }),
      });

      // Fan-out: ACKs come in staggered
      for (let i = 0; i < rec.actions.length; i++) {
        const delay = 250 + Math.round(Math.random() * 700);
        setTimeout(() => {
          dispatch({
            type: "ACK_ACTION",
            recId: rec.id,
            idx: i,
            latencyMs: delay,
          });
          const action = rec.actions[i];
          const targetText =
            action.target === undefined
              ? ""
              : typeof action.target === "string"
              ? action.target
              : ""; // target text of TText-type is shown in the rec card; skip in audit
          dispatch({
            type: "PUSH_AUDIT",
            entry: mkAudit({
              kind: "ACTION_ACK",
              title: {
                key: "ack.title",
                params: { channel: action.channel, target: targetText },
              },
              detail: { key: "ack.detail", params: { ms: delay } },
              ruleId: rec.ruleId,
              color: "info",
            }),
          });
        }, 300 + i * 250 + delay);
      }

      // Mark executed after all ACKs roughly return
      setTimeout(() => {
        dispatch({
          type: "UPDATE_REC",
          id: rec.id,
          patch: { status: "EXECUTED" },
        });
        // Run post-approval effects (state changes over time + auto-rollback)
        effectsForRule(rec.ruleId, handle);
      }, 300 + rec.actions.length * 350 + 900);
    },
    [handle]
  );

  const reject = useCallback((rec: Recommendation) => {
    dispatch({ type: "UPDATE_REC", id: rec.id, patch: { status: "REJECTED" } });
    dispatch({
      type: "PUSH_AUDIT",
      entry: mkAudit({
        kind: "DECISION",
        title: { key: "decision.rejected", params: { title: rec.ruleId } },
        ruleId: rec.ruleId,
        reasonCode: "OPERATOR_REJECT",
        operator: { key: "decision.operator" },
        color: "warn",
      }),
    });
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setTimeout(() => {
      cancelRef.current = false;
      dispatch({ type: "RESET" });
    }, 100);
  }, []);

  // Continuously tick the event clock (cosmetic)
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({
        type: "PATCH_STATE",
        patch: {}, // noop; kept for future live cadence
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const ctx: Ctx = useMemo(
    () => ({ store, triggerScenario, approve, reject, reset }),
    [store, triggerScenario, approve, reject, reset]
  );

  return <StoreCtx.Provider value={ctx}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
