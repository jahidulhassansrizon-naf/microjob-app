"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_SITE_SETTINGS, buildSiteTitle, type SiteSettings } from "@/lib/siteSettings";
import { mergeSiteSettingsWithContactLists } from "@/app/_components/contactSettings";

type SiteSettingsContextValue = {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  applySettings: (settings: SiteSettings) => void;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({
  children,
  initialSettings = DEFAULT_SITE_SETTINGS,
}: {
  children: React.ReactNode;
  initialSettings?: SiteSettings;
}) {
  // Initialise from the server-rendered MongoDB settings to avoid a default-brand
  // flash on first paint; public API refreshes remain no-store and failure-safe.
  const [settings, setSettings] = useState<SiteSettings>(() => mergeSiteSettingsWithContactLists<SiteSettings>(initialSettings));
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/site-settings", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.settings) setSettings(mergeSiteSettingsWithContactLists<SiteSettings>(payload.settings));
    } catch {
      // Keep original defaults during network or database outages.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshSettings(); }, [refreshSettings]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const title = buildSiteTitle(
      settings.branding.siteName,
      settings.branding.metaTitle,
      settings.branding.tagline,
    );
    if (title) document.title = title;
    const description = settings.branding.metaDescription.trim();
    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
    // Do not replace the favicon with the full-width website logo. Keep the
    // original dedicated app icons crisp in the browser tab and on mobile.
  }, [settings.branding.metaTitle, settings.branding.metaDescription, settings.branding.siteName, settings.branding.tagline]);

  const applySettings = useCallback((next: SiteSettings) => {
    setSettings(mergeSiteSettingsWithContactLists<SiteSettings>(next));
  }, []);

  const value = useMemo(() => ({
    settings,
    loading,
    refreshSettings,
    applySettings,
  }), [settings, loading, refreshSettings, applySettings]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const value = useContext(SiteSettingsContext);
  if (!value) throw new Error("useSiteSettings must be used inside SiteSettingsProvider.");
  return value;
}
