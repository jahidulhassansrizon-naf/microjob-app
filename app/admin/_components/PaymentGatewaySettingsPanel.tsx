"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, RefreshCw, Save, ShieldCheck, Power } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

const INPUT = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";

type ConnectionTestResult = {
  success: boolean;
  status: string;
  httpStatus?: number;
  message: string;
};

type SettingsState = {
  baseUrl: string;
  apiKeyConfigured: boolean;
  enabled: boolean;
  updatedAt?: string | null;
  updatedBy?: string;
};

const DEFAULTS: SettingsState = {
  baseUrl: "https://pay.devprobd.top/api",
  apiKeyConfigured: false,
  enabled: false,
};

export default function PaymentGatewaySettingsPanel() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [savedBaseUrl, setSavedBaseUrl] = useState(DEFAULTS.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [testing, setTesting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/payment-gateway-settings", {
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data.settings) {
        throw new Error(data?.message || "Could not load PipraPay settings.");
      }
      setSettings({ ...DEFAULTS, ...data.settings });
      setSavedBaseUrl(String(data.settings.baseUrl || DEFAULTS.baseUrl));
      setConnectionTest(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load PipraPay settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  const testConnection = async () => {
    setTesting(true);
    setError("");
    setNotice("");
    setConnectionTest(null);
    try {
      const response = await fetch("/api/admin/payment-gateway-settings/test", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        throw new Error(data?.message || "PipraPay connection test could not be completed.");
      }
      setConnectionTest(data as ConnectionTestResult);
    } catch (cause) {
      setConnectionTest({
        success: false,
        status: "client-error",
        message: cause instanceof Error ? cause.message : "PipraPay connection test could not be completed.",
      });
    } finally {
      setTesting(false);
    }
  };

  const toggleCheckout = async (enabled: boolean) => {
    setToggling(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/payment-gateway-settings/toggle", {
        method: "POST",
        credentials: "include",
        headers: { ...getClientAuthHeaders(), "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ enabled }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Could not change PipraPay checkout status.");
      }
      setSettings((current) => ({ ...current, enabled: Boolean(data.settings?.enabled) }));
      setNotice(data.message || "PipraPay checkout status updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change PipraPay checkout status.");
    } finally {
      setToggling(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/payment-gateway-settings", {
        method: "PUT",
        credentials: "include",
        headers: { ...getClientAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: settings.baseUrl, apiKey }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data.settings) {
        throw new Error(data?.message || "Could not save PipraPay settings.");
      }
      setSettings((current) => ({ ...current, ...data.settings }));
      setSavedBaseUrl(String(data.settings.baseUrl || settings.baseUrl));
      setApiKey("");
      setShowApiKey(false);
      setConnectionTest(null);
      setNotice(data.message || "PipraPay settings saved securely.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save PipraPay settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Payment gateway settings</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Configure the self-hosted PipraPay server used by SebaLagbe. Credentials are saved server-side and are never returned to the browser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void loadSettings()} disabled={loading || saving || testing} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Reload
          </button>
          <button type="button" onClick={() => void testConnection()} disabled={loading || saving || testing || !settings.apiKeyConfigured || !settings.baseUrl.trim() || settings.baseUrl !== savedBaseUrl || Boolean(apiKey.trim())} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50">
            <ShieldCheck size={15} className={testing ? "animate-pulse" : ""}/>{testing ? "Testing…" : "Test connection"}
          </button>
          <button type="button" onClick={() => void saveSettings()} disabled={loading || saving || testing || (!apiKey.trim() && !settings.apiKeyConfigured)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Save size={15}/>{saving ? "Saving…" : "Save settings"}
          </button>
          <button type="button" onClick={() => void toggleCheckout(!settings.enabled)} disabled={loading || saving || testing || toggling || !settings.apiKeyConfigured || settings.baseUrl.trim() !== savedBaseUrl || Boolean(apiKey.trim())} className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${settings.enabled ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
            <Power size={15}/>{toggling ? "Updating…" : settings.enabled ? "Disable live checkout" : "Enable live checkout"}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
      {notice && <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/><span>{notice}</span></div>}
      {connectionTest && (
        <div role="status" className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${connectionTest.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          {connectionTest.success ? <CheckCircle2 size={17} className="mt-0.5 shrink-0"/> : <AlertCircle size={17} className="mt-0.5 shrink-0"/>}
          <div>
            <p className="font-semibold">{connectionTest.success ? "PipraPay connection confirmed" : "PipraPay connection needs attention"}</p>
            <p className="mt-0.5">{connectionTest.message}</p>
            {typeof connectionTest.httpStatus === "number" && <p className="mt-1 text-xs opacity-75">Provider HTTP status: {connectionTest.httpStatus}</p>}
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><KeyRound size={19}/></div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">PipraPay API connection</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Enter the API base URL and dedicated API key provided for the PipraPay server.</p>
          </div>
        </div>

        {loading ? <div className="py-12 text-center text-sm text-slate-500">Loading payment gateway settings…</div> : (
          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="piprapay-base-url" className="block text-sm font-medium text-slate-700">Base URL</label>
              <input id="piprapay-base-url" type="url" autoComplete="url" value={settings.baseUrl} onChange={(event) => { setSettings((current) => ({ ...current, baseUrl: event.target.value })); setConnectionTest(null); }} placeholder="https://pay.example.com/api" className={INPUT}/>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">Use the self-hosted PipraPay API URL. Example: https://pay.devprobd.top/api</p>
            </div>

            <div>
              <label htmlFor="piprapay-api-key" className="block text-sm font-medium text-slate-700">API Key</label>
              <div className="relative mt-1.5">
                <input id="piprapay-api-key" type={showApiKey ? "text" : "password"} autoComplete="new-password" spellCheck={false} value={apiKey} onChange={(event) => { setApiKey(event.target.value); setConnectionTest(null); }} placeholder={settings.apiKeyConfigured ? "Saved key is protected — enter only to replace it" : "Paste the dedicated PipraPay API key"} className={`${INPUT} mt-0 pr-11`}/>
                <button type="button" onClick={() => setShowApiKey((value) => !value)} aria-label={showApiKey ? "Hide API key" : "Show API key"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700">
                  {showApiKey ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{settings.apiKeyConfigured ? "An API key is already saved. Leave this field blank to keep the existing key." : "No API key has been saved yet."}</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-700"/>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">Credential protection</h4>
                  <p className="mt-1 text-xs leading-5 text-emerald-800">The API key is encrypted before it is stored in the database. The original key is never sent back to the browser or included in public site settings.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <LockKeyhole size={17} className="shrink-0"/>
              <span>Enable live checkout only when you are ready to accept real customer payments. Enabling performs a fresh V3+ verification probe; it does not create a charge. Disable it at any time. Keep manual bKash/Nagad available as a backup.</span>
            </div>

            <div className="flex flex-col gap-1 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>API key status: <strong className={settings.apiKeyConfigured ? "text-emerald-700" : "text-amber-700"}>{settings.apiKeyConfigured ? "Saved securely" : "Not configured"}</strong></span>
              <span>Checkout status: <strong className={settings.enabled ? "text-emerald-700" : "text-amber-700"}>{settings.enabled ? "Live checkout enabled" : "Disabled"}</strong></span>
              {settings.updatedAt && <span>Last saved: {new Date(settings.updatedAt).toLocaleString()}</span>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
