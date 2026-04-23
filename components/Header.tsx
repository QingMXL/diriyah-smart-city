"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function Header() {
  const { store, reset } = useStore();
  const [clock, setClock] = useState("19:42:08");

  useEffect(() => {
    // A slow ticking cosmetic clock; starts at 19:42:08 and ticks forward.
    let sec = 42 * 60 + 8;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const total = 19 * 3600 + sec + elapsed;
      const h = Math.floor(total / 3600) % 24;
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      setClock(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
          .toString()
          .padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-line/70 bg-bg-panel/80 backdrop-blur px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-secondary">
            Diriyah · Orchestration Console
          </span>
        </div>
        <span className="h-4 w-px bg-line" />
        <span className="font-serif text-base text-ink-primary">
          Event Day · {store.state.eventName}
        </span>
      </div>

      <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.16em]">
        <span className="flex items-center gap-2 text-accent">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          LIVE
        </span>
        <span className="text-ink-secondary tabular-nums">{clock}</span>
        <span className="text-ink-muted">{store.state.elapsedLabel}</span>
        <button
          onClick={reset}
          className="btn-ghost !py-1 !px-2.5 text-[10px]"
          aria-label="Reset demo"
        >
          Reset
        </button>
      </div>
    </header>
  );
}
