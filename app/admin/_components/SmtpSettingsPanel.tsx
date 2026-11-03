"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Mail, Save, Send, Server } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

const CARD = "rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-sm sm:p-6";
const INPUT =
  "mt-1.5 w-full rounded-lg border border-[#E3D6B8] bg-white px-3 py-2.5 text-sm text-[#3B2F1E] outline-none transition placeholder:text-[#A8977A] focus:border-[#DC2626] focus:ring-4 focus:ring-red-500/10";
const LABEL = "block text-[12px] font-semibold uppercase tracking-wide text-[#6B5A40]";

type Form = {
  host: string;
  port: string;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  enabled: boolean;
};

const EMPTY: Form = {
  host: "smtp.gmail.com",
  port: "465",
  secure: true,
  username: "",
  fromEmail: "",
  fromName: "SebaLagbe.com",
  replyTo: "",
  enabled: false,
};

const PRESETS = [
  { label: "Gmail (465 SSL)", host: "smtp.gmail.com", port: "465", secure: true },
  { label: "Gmail (587 TLS)", host: "smtp.gmail.com", port: "587", secure: false },
  { label: "Outlook / Office 365", host: "smtp.office365.com", port: "587", secure: false },
  { label: "Zoho", host: "smtp.zoho.com", port: "465", secure: true },
];

export default function SmtpSettingsPanel() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfigured, setPasswordConfigured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/smtp-settings", { credentials: "include", cache: "no-store", headers: getClientAuthHeaders() });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.message || "Could not load SMTP settings.");
      const s = data.settings;
      setForm({
        host: s.host || EMPTY.host,
        port: String(s.port || 465),
        secure: Boolean(s.secure),
        username: s.username || "",
        fromEmail: s.fromEmail || "",
        fromName: s.fromName || EMPTY.fromName,
        replyTo: s.replyTo || "",
        enabled: Boolean(s.enabled),
      });
      setPasswordConfigured(Boolean(s.passwordConfigured));
      setUpdatedAt(s.updatedAt || null);
      setUpdatedBy(s.updatedBy || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load SMTP settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/smtp-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ ...form, port: Number(form.port), password }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.message || "Could not save SMTP settings.");
      setNotice(data.message || "Saved.");
      setPassword("");
      setPasswordConfigured(true);
      setUpdatedAt(data.settings?.updatedAt || null);
      setUpdatedBy(data.settings?.updatedBy || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save SMTP settings.");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/smtp-settings/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ to: testTo.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.message || "The test email could not be sent.");
      setNotice(data.message || "Test email sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The test email could not be sent.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <section className={`${CARD} flex items-center gap-3 text-sm text-[#5A4A32]`}>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading SMTP settings…
      </section>
    );
  }

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B2F1E] text-[#F5E9C8]">
            <Server size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[#3B2F1E]">SMTP email settings</h2>
            <p className="mt-0.5 text-sm text-[#6B5A40]">
              When SMTP is turned on, every website email (OTP, password reset, offers) is sent from this mail account.
            </p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#E3D6B8] bg-white px-3 py-1.5 text-sm font-semibold text-[#3B2F1E]">
          <input type="checkbox" className="h-4 w-4 accent-[#DC2626]" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} />
          SMTP {form.enabled ? "ON" : "OFF"}
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setForm((c) => ({ ...c, host: preset.host, port: preset.port, secure: preset.secure }))}
            className="rounded-full border border-[#E3D6B8] bg-white px-3 py-1 text-xs font-semibold text-[#5A4A32] hover:bg-[#F6EEDB]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL}>SMTP host</label>
          <input className={INPUT} value={form.host} onChange={(e) => set("host", e.target.value)} placeholder="smtp.gmail.com" autoComplete="off" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Port</label>
            <input className={INPUT} value={form.port} onChange={(e) => set("port", e.target.value.replace(/\D/g, ""))} placeholder="465" inputMode="numeric" />
          </div>
          <div>
            <label className={LABEL}>SSL / TLS</label>
            <select className={INPUT} value={form.secure ? "ssl" : "starttls"} onChange={(e) => set("secure", e.target.value === "ssl")}>
              <option value="ssl">SSL (port 465)</option>
              <option value="starttls">STARTTLS (port 587)</option>
            </select>
          </div>
        </div>
        <div>
          <label className={LABEL}>SMTP username</label>
          <input className={INPUT} value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="yourname@gmail.com" autoComplete="off" />
        </div>
        <div>
          <label className={LABEL}>SMTP password {passwordConfigured && <span className="ml-1 font-medium normal-case text-emerald-700">(saved)</span>}</label>
          <div className="relative">
            <input
              className={`${INPUT} pr-10`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={passwordConfigured ? "Leave empty to keep the saved password" : "Gmail App Password"}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 mt-[3px] -translate-y-1/2 text-[#7A6A4F]" aria-label="Show or hide password">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className={LABEL}>From email</label>
          <input className={INPUT} value={form.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} placeholder="yourname@gmail.com" autoComplete="off" />
        </div>
        <div>
          <label className={LABEL}>Sender name</label>
          <input className={INPUT} value={form.fromName} onChange={(e) => set("fromName", e.target.value)} placeholder="SebaLagbe.com" />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Reply-To (optional)</label>
          <input className={INPUT} value={form.replyTo} onChange={(e) => set("replyTo", e.target.value)} placeholder="support@yourdomain.com" />
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-[#F6EEDB] px-3 py-2 text-xs leading-5 text-[#6B5A40]">
        Gmail: turn on 2-Step Verification, then create an <b>App Password</b> (Google Account → Security → App passwords) and paste the 16 letters here. Your normal Gmail password will not work. Gmail allows about 500 emails per day.
      </p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {notice && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {notice}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B91C1C] disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save settings
        </button>
        {updatedAt && (
          <span className="text-xs text-[#7A6A4F]">
            Last saved {new Date(updatedAt).toLocaleString()} {updatedBy ? `by ${updatedBy}` : ""}
          </span>
        )}
      </div>

      <div className="mt-6 border-t border-[#E3D6B8] pt-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#3B2F1E]">
          <Mail size={16} /> Send a test email
        </h3>
        <p className="mt-1 text-xs text-[#6B5A40]">Uses the saved settings. Save first, then test.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            className={`${INPUT} mt-0 max-w-sm flex-1`}
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="Test email address (empty = your admin email)"
          />
          <button
            type="button"
            onClick={() => void sendTest()}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#3B2F1E] bg-[#3B2F1E] px-4 py-2.5 text-sm font-semibold text-[#F5E9C8] transition hover:bg-[#2A2118] disabled:opacity-60"
          >
            {testing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send test
          </button>
        </div>
      </div>
    </section>
  );
}
