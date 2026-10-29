"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translateComponentText } from "@/components/i18n/componentTranslations";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";
import { replaceSiteNameInText } from "@/lib/siteSettings";
import {
  DEFAULT_LOCALE,
  persistLocale,
  readStoredLocale,
  translateText,
  type Locale,
} from "@/lib/i18n";

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (value: unknown) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = readStoredLocale();
    setLocaleState(stored);
    persistLocale(stored);
  }, []);

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const value = useMemo<I18nValue>(() => ({
    locale,
    setLocale: (next) => {
      setLocaleState(next);
      persistLocale(next);
    },
    t: (value) => {
      if (String(locale).toLowerCase().startsWith("bn")) {
        const componentTranslation = translateComponentText(value);
        if (componentTranslation !== undefined) return componentTranslation;
      }
      return translateText(value, locale);
    },
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function T({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  if (typeof children === "string" || typeof children === "number") {
    const translated = t(children);
    return <>{replaceSiteNameInText(translated, settings.branding.siteName)}</>;
  }
  return <>{children}</>;
}
