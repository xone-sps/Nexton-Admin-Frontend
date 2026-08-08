"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import lo from "./lo";
import en from "./en";
import type { TranslationKeys } from "./lo";

export type { TranslationKeys } from "./lo";

export type Locale = "lo" | "en";

const translations: Record<Locale, TranslationKeys> = { lo, en };

type I18nContextType = {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  t: en,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("nexton_admin_locale") as Locale | null;
    if (stored === "lo" || stored === "en") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("nexton_admin_locale", newLocale);
  }, []);

  return (
    <I18nContext.Provider
      value={{ locale, t: translations[locale], setLocale }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
