"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/config";
import { detectLocaleFromBrowser } from "@/i18n/detect-locale";

type LanguageContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    return detectLocaleFromBrowser();
  });

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

/** Sync document lang + title when locale changes (client-only). */
export function DocumentLocaleSync() {
  const { locale } = useLanguage();
  const t = useTranslations("metadata");

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = t("title");
  }, [locale, t]);

  return null;
}
