"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Megaphone, Send } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

const CARD = "rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-sm sm:p-6";
const INPUT =
  "mt-1.5 w-full rounded-lg border border-[#E3D6B8] bg-white px-3 py-2.5 text-sm text-[#3B2F1E] outline-none transition placeholder:text-[#A8977A] focus:border-[#DC2626] focus:ring-4 focus:ring-red-500/10";
const LABEL = "block text-[12px] font-semibold uppercase tracking-wide text-[#6B5A40]";

type Audience = "all" | "subscribed" | "not_subscribed";
type Counts = Record<Audience, number>;
const BATCH = 20;

const AUDIENCES: Array<{ key: Audience; label: string }> = [
  { key: "all", label: "All users" },
  { key: "subscribed", label: "Active subscribers" },
  { key: "not_subscribed", label: "Not subscribed" },
];

export default function MailCampaignPanel() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [smtpReady, setSmtpReady] = useState(true);
  const [audience, setAudience] = useState<Audience>("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [previewTo, setPreviewTo] = useState("");
  const [busy, setBusy] = useState<"" | "preview" | "send">("");
  const [progress, setProgress] = useState<{ done: number; total: number; sent: number; failed: number } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const cancelRef = useRef(false);

  const loadCounts = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/mail-campaign", { credentials: "include", cache: "no-store", headers: getClientAuthHeaders() });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        setCounts(data.counts);
        setSmtpReady(Boolean(data.smtpReady));
      }
    } catch {
      // counts are optional
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const payload = { subject: subject.trim(), message: message.trim(), ctaText: ctaText.trim(), ctaUrl: ctaUrl.trim() };

  const post = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/admin/mail-campaign", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) throw new Error(data?.message || "The request failed.");
    return data;
  };

  const sendPreview = async () => {
    setBusy("preview");
    setError("");
    setNotice("");
    try {
      const data = await post({ action: "preview", to: previewTo.trim(), ...payload });
      setNotice(data.message || "Preview sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Preview failed.");
    } finally {
      setBusy("");
    }
  };

  const sendAll = async () => {
    const total = counts?.[audience] ?? 0;
    const label = AUDIENCES.find((a) => a.key === audience)?.label || "users";
    if (!window.confirm(`Send this email to ${total} user(s) (${label})? This cannot be undone.`)) return;
    setBusy("send");
    setError("");
    setNotice("");
    cancelRef.current = false;
    let offset = 0;
    let sent = 0;
    let failed = 0;
    let grandTotal = total;
    setProgress({ done: 0, total: grandTotal, sent: 0, failed: 0 });
    try {
      for (;;) {
        if (cancelRef.current) {
          setNotice(`Stopped. Sent ${sent}, failed ${failed}.`);
          break;
        }
        const data = await post({ action: "send", audience, offset, limit: BATCH, ...payload });
        sent += data.sent;
        failed += data.failed;
        offset = data.nextOffset;
        grandTotal = data.total;
        setProgress({ done: Math.min(offset, grandTotal), total: grandTotal, sent, failed });
        if (data.errors?.length && sent === 0) {
          setError(`Sending is failing: ${data.errors[0]}`);
          break;
        }
        if (data.done) {
          setNotice(`Finished. Sent ${sent}, failed ${failed}.`);
          break;
        }
      }
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : "Sending stopped."} (Sent ${sent} so far.)`);
    } finally {
      setBusy("");
    }
  };

  const canSend = payload.subject && payload.message && !busy;

  return (
    <section className={CARD}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DC2626] text-white">
          <Megaphone size={20} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-[#3B2F1E]">Send offer / custom email to users</h2>
          <p className="mt-0.5 text-sm text-[#6B5A40]">
            Sent through the SMTP account above. Write <code className="rounded bg-white px-1">{"{{name}}"}</code> to insert the user&apos;s first name.
          </p>
        </div>
      </div>

      {!smtpReady && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> SMTP is not switched on yet. Save the SMTP settings above with SMTP ON first.
        </div>
      )}

      <div className="mt-4">
        <label className={LABEL}>Send to</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {AUDIENCES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setAudience(item.key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                audience === item.key ? "border-[#3B2F1E] bg-[#3B2F1E] text-[#F5E9C8]" : "border-[#E3D6B8] bg-white text-[#5A4A32] hover:bg-[#F6EEDB]"
              }`}
            >
              {item.label}
              {counts ? ` (${counts[item.key]})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <label className={LABEL}>Subject</label>
          <input className={INPUT} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={180} placeholder="🎉 Special offer just for you, {{name}}!" />
        </div>
        <div>
          <label className={LABEL}>Message</label>
          <textarea className={`${INPUT} min-h-[160px] resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={8000} placeholder={"Hi {{name}},\n\nThis week only: 30% off all plans..."} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Button text (optional)</label>
            <input className={INPUT} value={ctaText} onChange={(e) => setCtaText(e.target.value)} maxLength={60} placeholder="Get the offer" />
          </div>
          <div>
            <label className={LABEL}>Button link (optional)</label>
            <input className={INPUT} value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://www.sebalagbe.com/subscription" />
          </div>
        </div>
      </div>

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

      {progress && (
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E3D6B8]">
            <div className="h-full rounded-full bg-[#DC2626] transition-all" style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-[#6B5A40]">
            {progress.done} / {progress.total} processed · {progress.sent} sent · {progress.failed} failed
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input className={`${INPUT} mt-0 max-w-xs flex-1`} value={previewTo} onChange={(e) => setPreviewTo(e.target.value)} placeholder="Preview to (empty = your admin email)" />
        <button
          type="button"
          onClick={() => void sendPreview()}
          disabled={!canSend}
          className="inline-flex items-center gap-2 rounded-xl border border-[#3B2F1E] px-4 py-2.5 text-sm font-semibold text-[#3B2F1E] transition hover:bg-[#F6EEDB] disabled:opacity-50"
        >
          {busy === "preview" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send preview
        </button>
        <button
          type="button"
          onClick={() => void sendAll()}
          disabled={!canSend || !smtpReady}
          className="inline-flex items-center gap-2 rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B91C1C] disabled:opacity-50"
        >
          {busy === "send" ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />} Send to {AUDIENCES.find((a) => a.key === audience)?.label.toLowerCase()}
        </button>
        {busy === "send" && (
          <button type="button" onClick={() => (cancelRef.current = true)} className="rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">
            Stop
          </button>
        )}
      </div>
    </section>
  );
}
