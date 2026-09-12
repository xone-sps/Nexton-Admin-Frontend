"use client";

import React, { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import lo from "./lo";
import en from "./en";
import type { TranslationKeys } from "./lo";

export type { TranslationKeys } from "./lo";

export type Locale = "lo" | "en";

const translations: Record<Locale, TranslationKeys> = { lo, en };

const STORAGE_KEY = "nexton_admin_locale";
const DEFAULT_LOCALE: Locale = "en";

// localStorage is an external store, so it is read through useSyncExternalStore:
// the server (and the hydration pass) see DEFAULT_LOCALE, and the client then
// re-renders with the persisted choice. Same behaviour as the old
// useState + useEffect pair, without a setState inside an effect.
const listeners = new Set<() => void>();

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "lo" || stored === "en" ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function getServerLocale(): Locale {
  return DEFAULT_LOCALE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other tabs in sync when the locale changes in one of them.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeStoredLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable: the in-memory value below still updates this tab */
  }
  listeners.forEach((listener) => listener());
}

type I18nContextType = {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  t: en,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readStoredLocale, getServerLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    writeStoredLocale(newLocale);
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
