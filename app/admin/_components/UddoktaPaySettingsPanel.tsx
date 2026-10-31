"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Power, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

const INPUT = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10";
type ConnectionResult = { success: boolean; status: string; httpStatus?: number; message: string };
type Settings = { baseUrl: string; apiKeyConfigured: boolean; enabled: boolean; updatedAt?: string | null; updatedBy?: string };
const DEFAULTS: Settings = { baseUrl: "https://test-app.paymently.io", apiKeyConfigured: false, enabled: false };

export default function UddoktaPaySettingsPanel() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [savedBaseUrl, setSavedBaseUrl] = useState(DEFAULTS.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [test, setTest] = useState<ConnectionResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/uddoktapay-settings", { credentials: "include", cache: "no-store", headers: getClientAuthHeaders() });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data?.settings) throw new Error(data?.message || "UddoktaPay settings could not be loaded.");
      setSettings({ ...DEFAULTS, ...data.settings });
      setSavedBaseUrl(String(data.settings.baseUrl || DEFAULTS.baseUrl));
      setTest(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "UddoktaPay settings could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/uddoktapay-settings", { method: "PUT", credentials: "include", headers: { ...getClientAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ baseUrl: settings.baseUrl, apiKey }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data?.settings) throw new Error(data?.message || "UddoktaPay settings could not be saved.");
      setSettings((current) => ({ ...current, ...data.settings }));
      setSavedBaseUrl(String(data.settings.baseUrl || settings.baseUrl));
      setApiKey(""); setShowKey(false); setTest(null);
      setNotice(data.message || "UddoktaPay settings saved securely.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "UddoktaPay settings could not be saved."); }
    finally { setSaving(false); }
  };

  const testConnection = async () => {
    setTesting(true); setError(""); setNotice(""); setTest(null);
    try {
      const response = await fetch("/api/admin/uddoktapay-settings/test", { method: "POST", credentials: "include", cache: "no-store", headers: getClientAuthHeaders() });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.message || "UddoktaPay connection test failed.");
      setTest(data as ConnectionResult);
    } catch (cause) { setTest({ success: false, status: "client-error", message: cause instanceof Error ? cause.message : "UddoktaPay connection test failed." }); }
    finally { setTesting(false); }
  };

  const toggle = async (enabled: boolean) => {
    setToggling(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/uddoktapay-settings/toggle", { method: "POST", credentials: "include", headers: { ...getClientAuthHeaders(), "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ enabled }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.message || "UddoktaPay checkout status could not be changed.");
      setSettings((current) => ({ ...current, enabled: Boolean(data.settings?.enabled) }));
      setNotice(data.message || "UddoktaPay checkout status updated.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "UddoktaPay checkout status could not be changed."); }
    finally { setToggling(false); }
  };

  const busy = loading || saving || testing || toggling;
  return (
    <section className="mx-auto w-full max-w-4xl rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><KeyRound size={19}/></div>
          <div><h2 className="text-lg font-semibold tracking-tight text-slate-900">UddoktaPay API connection</h2><p className="mt-1 text-sm leading-6 text-slate-500">Configure your own UddoktaPay hosted payment panel. This is separate from PipraPay.</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load()} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Reload</button>
          <button type="button" onClick={() => void testConnection()} disabled={busy || !settings.apiKeyConfigured || settings.baseUrl !== savedBaseUrl || Boolean(apiKey.trim())} className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 disabled:opacity-50"><ShieldCheck size={15}/>{testing ? "Testing…" : "Test connection"}</button>
          <button type="button" onClick={() => void save()} disabled={busy || (!apiKey.trim() && !settings.apiKeyConfigured)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50"><Save size={15}/>{saving ? "Saving…" : "Save settings"}</button>
          <button type="button" onClick={() => void toggle(!settings.enabled)} disabled={busy || !settings.apiKeyConfigured || settings.baseUrl !== savedBaseUrl || Boolean(apiKey.trim())} className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-50 ${settings.enabled ? "border border-rose-200 bg-rose-50 text-rose-700" : "bg-slate-900 text-white"}`}><Power size={15}/>{toggling ? "Updating…" : settings.enabled ? "Disable live checkout" : "Enable live checkout"}</button>
        </div>
      </div>

      {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</div>}
      {notice && <div role="status" className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/>{notice}</div>}
      {test && <div role="status" className={`mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${test.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}><ShieldCheck size={17} className="mt-0.5 shrink-0"/><div><p className="font-semibold">{test.success ? "UddoktaPay connection confirmed" : "UddoktaPay connection needs attention"}</p><p className="mt-0.5">{test.message}</p>{typeof test.httpStatus === "number" && <p className="mt-1 text-xs opacity-75">Provider HTTP status: {test.httpStatus}</p>}</div></div>}

      {loading ? <div className="py-10 text-center text-sm text-slate-500">Loading UddoktaPay settings…</div> : <div className="mt-5 space-y-5">
        <div><label htmlFor="uddoktapay-base-url" className="block text-sm font-medium text-slate-700">Hosted Domain / Base URL</label><input id="uddoktapay-base-url" type="url" autoComplete="url" value={settings.baseUrl} onChange={(event) => { setSettings((current) => ({ ...current, baseUrl: event.target.value })); setTest(null); }} placeholder="https://your-payment-domain.com" className={INPUT}/><p className="mt-1.5 text-xs leading-5 text-slate-500">স্ক্রিনশটে থাকা hosted domain অনুযায়ী default: https://test-app.paymently.io — প্যানেলের Product Details-এ domain আলাদা হলে সেটি বসাবে। এখানে `/api` যোগ করবে না।</p></div>
        <div><label htmlFor="uddoktapay-api-key" className="block text-sm font-medium text-slate-700">UddoktaPay API Key</label><div className="relative mt-1.5"><input id="uddoktapay-api-key" type={showKey ? "text" : "password"} autoComplete="new-password" spellCheck={false} value={apiKey} onChange={(event) => { setApiKey(event.target.value); setTest(null); }} placeholder={settings.apiKeyConfigured ? "Saved key is protected — enter only to replace it" : "Paste API key from Brand Settings → API Settings"} className={`${INPUT} mt-0 pr-11`}/><button type="button" onClick={() => setShowKey((value) => !value)} aria-label={showKey ? "Hide API key" : "Show API key"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700">{showKey ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div><p className="mt-1.5 text-xs leading-5 text-slate-500">{settings.apiKeyConfigured ? "An API key is already saved. Leave blank to keep it." : "API key is saved encrypted server-side and never returned to the browser."}</p></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4"><div className="flex items-start gap-2.5"><LockKeyhole size={18} className="mt-0.5 shrink-0 text-emerald-700"/><div><h3 className="text-sm font-semibold text-emerald-900">Credential & payment safety</h3><p className="mt-1 text-xs leading-5 text-emerald-800">API key browser/client code-এ যাবে না। Save করলে live checkout disabled হবে। Enable করার আগে safe dummy-invoice verification test হবে; কোনো real charge তৈরি হবে না। Customer return বা webhook পেলেও server-side verify, amount এবং subscription metadata না মেলা পর্যন্ত access চালু হবে না।</p></div></div></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><p className="font-semibold">Required API permissions</p><p className="mt-1 text-xs leading-5">API key-তে অন্তত <code>payment:checkout</code> এবং <code>payment:verify</code> permission চালু রাখবে। Refund support না যোগ করা পর্যন্ত <code>payment:refund</code> প্রয়োজন নেই।</p><p className="mt-2 break-all text-xs text-slate-500">Webhook URL: {typeof window !== "undefined" ? `${window.location.origin}/api/uddoktapay/webhook` : "/api/uddoktapay/webhook"}</p></div>
        <div className="flex flex-col gap-1 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:justify-between"><span>API key: <strong className={settings.apiKeyConfigured ? "text-emerald-700" : "text-amber-700"}>{settings.apiKeyConfigured ? "Saved securely" : "Not configured"}</strong></span><span>Checkout: <strong className={settings.enabled ? "text-emerald-700" : "text-amber-700"}>{settings.enabled ? "Live enabled" : "Disabled"}</strong></span>{settings.updatedAt && <span>Last saved: {new Date(settings.updatedAt).toLocaleString()}</span>}</div>
      </div>}
    </section>
  );
}
