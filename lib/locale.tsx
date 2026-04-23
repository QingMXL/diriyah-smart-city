"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LOCALES, Locale, TText, resolveTText, translate } from "./i18n";

interface LocaleCtx {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tx: (text: TText) => string;
}

const Ctx = createContext<LocaleCtx | null>(null);

const STORAGE_KEY = "diriyah_locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Load saved locale client-side; URL ?lang=xx wins over storage
  useEffect(() => {
    try {
      const urlLang = new URLSearchParams(window.location.search).get("lang") as Locale | null;
      if (urlLang && LOCALES.some((l) => l.code === urlLang)) {
        setLocaleState(urlLang);
        window.localStorage.setItem(STORAGE_KEY, urlLang);
        return;
      }
      const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && LOCALES.some((l) => l.code === saved)) {
        setLocaleState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const dir = useMemo<"ltr" | "rtl">(
    () => LOCALES.find((l) => l.code === locale)?.dir ?? "ltr",
    [locale]
  );

  // Reflect on <html>
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  const tx = useCallback((text: TText) => resolveTText(locale, text), [locale]);

  const value = useMemo(
    () => ({ locale, dir, setLocale, t, tx }),
    [locale, dir, setLocale, t, tx]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocale must be used inside LocaleProvider");
  return v;
}
