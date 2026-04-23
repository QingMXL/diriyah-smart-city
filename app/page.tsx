"use client";

import { AuditLog } from "@/components/AuditLog";
import { FlowMap } from "@/components/FlowMap";
import { Header } from "@/components/Header";
import { LeftPanel } from "@/components/LeftPanel";
import { Recommendations } from "@/components/Recommendations";
import { ScenarioLauncher } from "@/components/ScenarioLauncher";
import { StageProgress } from "@/components/StageProgress";
import { StoreProvider } from "@/lib/store";
import { LocaleProvider, useLocale } from "@/lib/locale";

export default function Page() {
  return (
    <LocaleProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </LocaleProvider>
  );
}

function Shell() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-5 py-5 grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <LeftPanel />
        </div>

        <div className="col-span-6 flex flex-col gap-4 min-h-0">
          <div className="min-h-[360px]">
            <FlowMap />
          </div>
          <StageProgress />
          <ScenarioLauncher />
        </div>

        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-[420px]">
            <Recommendations />
          </div>
          <div className="flex-1 min-h-[260px]">
            <AuditLog />
          </div>
        </div>
      </main>

      <footer className="border-t border-line/70 px-6 py-3 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.16em] text-ink-muted">
        <span>{t("footer.left")}</span>
        <span className="text-right">{t("footer.right")}</span>
      </footer>
    </div>
  );
}
