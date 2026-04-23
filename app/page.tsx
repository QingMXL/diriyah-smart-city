import { AuditLog } from "@/components/AuditLog";
import { FlowMap } from "@/components/FlowMap";
import { Header } from "@/components/Header";
import { LeftPanel } from "@/components/LeftPanel";
import { Recommendations } from "@/components/Recommendations";
import { ScenarioLauncher } from "@/components/ScenarioLauncher";
import { StageProgress } from "@/components/StageProgress";
import { StoreProvider } from "@/lib/store";

export default function Page() {
  return (
    <StoreProvider>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 px-5 py-5 grid grid-cols-12 gap-4">
          {/* Left: Scenario state */}
          <div className="col-span-3">
            <LeftPanel />
          </div>

          {/* Middle: Map + KPIs + Launcher */}
          <div className="col-span-6 flex flex-col gap-4 min-h-0">
            <div className="min-h-[360px]">
              <FlowMap />
            </div>
            <StageProgress />
            <ScenarioLauncher />
          </div>

          {/* Right: Recommendations + Audit */}
          <div className="col-span-3 flex flex-col gap-4 min-h-0">
            <div className="flex-1 min-h-[420px]">
              <Recommendations />
            </div>
            <div className="flex-1 min-h-[260px]">
              <AuditLog />
            </div>
          </div>
        </main>

        <footer className="border-t border-line/70 px-6 py-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          <span>Pilot A · Event Day Operations · Operator Console Demo</span>
          <span>
            Read-only mock · 7 sources · 4 write channels · YAML rules · Rollback &lt; 30s
          </span>
        </footer>
      </div>
    </StoreProvider>
  );
}
