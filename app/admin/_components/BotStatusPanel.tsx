"use client";

import { useCallback, useState } from "react";
import { Activity, AlertTriangle, Check, ChevronDown, Clock, RefreshCw, X } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

const PANEL = "rounded-3xl border border-[#E6DAB9] bg-[#FFFCF3] shadow-[0_18px_40px_-28px_rgba(59,47,30,0.5)]";

type Problem = { level: "error" | "warn" | "info"; title: string; cause?: string; advice?: string };

type BotStatus = {
  online: boolean;
  detailed?: boolean;
  reason?: string;
  checkedAt: string;
  startedAt?: string;
  uptimeSeconds?: number;
  generation?: { active: number; waiting: number; maxConcurrent: number; currentCapacity: number; maxQueue: number };
  perSessionConcurrency?: number;
  maxJobRetries?: number;
  warm?: {
    enabled: boolean; startupDone: boolean; startedAt: string; pagesPerSession: number;
    hits: number; misses: number; replaced: number;
    sessions: Array<{ slot: number; ready: number; open: number; refreshing: number; lastError: string }>;
  } | null;
  stats?: {
    jobs: number; jobsOk: number; jobsFailed: number; retries: number; attemptsRefused: number;
    attemptsTimedOut: number; limitHits: number; loggedOutSessions: number; otherErrors: number;
    peakActive: number; peakWaiting: number; avgSeconds: number;
  };
  sessions?: Array<{
    slot: number; active: number; usable: boolean; healthy: boolean; downReason: string; failStreak: number;
    lastError: string; lastCause: string; lastAdvice: string; restingUntil: string; usableAgainAt: string; images: number;
  }>;
  recentErrors?: Array<{ at: string; label: string; message: string }>;
  events?: Array<{ at: string; type: string; slot: number; message: string; cause: string; advice: string }>;
  jobs?: Array<{ at: string; ms: number; ok: boolean; error: string; attempts: Array<{ slot: number; result: string; ms: number }> }>;
  logTail?: Array<{ at: string; level: string; text: string }>;
  runs?: Array<{ number: number; status: string; conclusion: string; event: string; startedAt: string; updatedAt: string }> | null;
  problems?: Problem[];
};

// Bangladesh time (Asia/Dhaka), 12-hour with AM/PM, e.g. "11:50:01 PM".
function dhaka(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })
    .replace(/\u202f/g, " ");
}

// Same, without seconds, e.g. "11:50 PM".
function dhakaShort(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\u202f/g, " ");
}

function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

function bnDuration(seconds: number): string {
  const m = Math.max(0, Math.round(seconds / 60));
  return m >= 60 ? `${Math.floor(m / 60)} ঘণ্টা ${m % 60} মিনিট` : `${m} মিনিট`;
}

type SessionRow = NonNullable<BotStatus["sessions"]>[number];

// Plain Bengali reason for a session that is not working (same wording as the old email report).
function sessionReasonBn(x: SessionRow): string {
  if (!x.usable) {
    if (x.downReason === "logged-out") return "লগ-আউট হয়ে গেছে (নতুন সেশন সেভ করতে হবে)";
    const back = dhakaShort(x.usableAgainAt);
    if (x.downReason === "limit") return back ? `দৈনিক লিমিট শেষ, ${back} নাগাদ আবার চালু হবে` : "দৈনিক লিমিট শেষ";
    return back ? `সাময়িক বন্ধ, ${back} নাগাদ আবার চালু হবে` : "সাময়িক বন্ধ";
  }
  const err = x.lastError ? ` (${x.lastError.slice(0, 110)})` : "";
  const back = dhakaShort(x.restingUntil);
  return back ? `বারবার ফেল করছে${err}, ${back} নাগাদ আবার চেষ্টা হবে` : `বারবার ফেল করছে${err}`;
}

const EVENT_LABEL: Record<string, string> = {
  "attempt-failed": "চেষ্টা ফেল করেছে",
  "session-resting": "সেশন বিশ্রামে গেছে",
  "session-limit": "দৈনিক লিমিট শেষ",
  "session-logged-out": "লগ-আউট হয়ে গেছে",
  refused: "Gemini রিফিউজ করেছে",
  "job-failed": "ছবি বানানো ফেল",
};

type Tone = "ok" | "warn" | "bad";

const TONE: Record<Tone, { color: string; glow: string; soft: string; text: string }> = {
  ok: { color: "#34D399", glow: "rgba(52,211,153,0.20)", soft: "bg-emerald-50 text-emerald-800", text: "text-emerald-700" },
  warn: { color: "#F5B544", glow: "rgba(245,181,68,0.22)", soft: "bg-amber-50 text-amber-900", text: "text-amber-700" },
  bad: { color: "#F87171", glow: "rgba(248,113,113,0.22)", soft: "bg-red-50 text-red-800", text: "text-red-700" },
};

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <h3 className="text-lg font-bold text-[#2B2116]">{title}</h3>
      {hint && <p className="text-sm text-[#7A6A50]">{hint}</p>}
    </div>
  );
}

function Fact({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: Tone }) {
  return (
    <div className="rounded-2xl border border-[#EADFC4] bg-[#FBF5E4] p-4">
      <p className="text-sm font-semibold text-[#6B5A40]">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${tone ? TONE[tone].text : "text-[#2B2116]"}`}>{value}</p>
      {hint && <p className="mt-1 text-sm text-[#7A6A50]">{hint}</p>}
    </div>
  );
}

function ProblemItem({ p }: { p: Problem }) {
  const tone = p.level === "error" ? "bad" : p.level === "warn" ? "warn" : null;
  const box =
    p.level === "error"
      ? "border-red-200 bg-red-50"
      : p.level === "warn"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-slate-50";
  return (
    <li className={`flex gap-3 rounded-2xl border p-4 ${box}`}>
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
          p.level === "error" ? "bg-red-500" : p.level === "warn" ? "bg-amber-500" : "bg-slate-500"
        }`}
      >
        {tone === "bad" ? <X size={15} /> : <AlertTriangle size={14} />}
      </span>
      <div className="min-w-0">
        <p className="text-base font-bold text-[#2B2116]">{p.title}</p>
        {p.cause && (
          <p className="mt-1 text-sm leading-relaxed text-[#3B2F1E]">
            <span className="font-bold">কেন হলো:</span> {p.cause}
          </p>
        )}
        {p.advice && (
          <p className="mt-1 text-sm leading-relaxed text-[#3B2F1E]">
            <span className="font-bold">কী করবেন:</span> {p.advice}
          </p>
        )}
      </div>
    </li>
  );
}

function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className={`group ${PANEL} px-5 py-4 sm:px-6`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-bold text-[#2B2116] [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={18} className="text-[#7A6A50] transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

const RUN_MINUTES = 315;

export default function BotStatusPanel() {
  const [data, setData] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/bot-status", { credentials: "include", cache: "no-store", headers: getClientAuthHeaders() });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.success !== true) throw new Error(body?.message || "Bot status could not be loaded.");
      setData(body as BotStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bot status could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const s = data?.stats;
  const done = (s?.jobsOk ?? 0) + (s?.jobsFailed ?? 0);
  const rate = done ? Math.round(((s?.jobsOk ?? 0) / done) * 100) : 100;
  const sessions = data?.sessions ?? [];
  const upSessions = sessions.filter((x) => x.usable && x.healthy).length;
  const problems = data?.problems ?? [];
  const errorsCount = problems.filter((p) => p.level === "error").length;
  const startedMs = data?.startedAt ? new Date(data.startedAt).getTime() : NaN;
  const handoff = Number.isNaN(startedMs) ? "" : new Date(startedMs + RUN_MINUTES * 60_000).toISOString();
  const runPct = Math.min(100, Math.max(2, ((data?.uptimeSeconds ?? 0) / (RUN_MINUTES * 60)) * 100));

  const warm = data?.warm ?? null;
  const warmOn = !!warm && warm.enabled;
  const warmReady = warm ? warm.sessions.reduce((n, x) => n + x.ready, 0) : 0;
  const warmWanted = warm ? sessions.filter((x) => x.usable && x.healthy).length * warm.pagesPerSession : 0;
  const warmJobs = warm ? warm.hits + warm.misses : 0;
  const warmHitPct = warmJobs > 0 && warm ? Math.round((warm.hits / warmJobs) * 100) : 0;
  const warmTone: Tone = !warm || !warmOn ? "warn" : !warm.startupDone ? "warn" : warmWanted > 0 && warmReady < warmWanted ? "warn" : "ok";

  const offline = !!data && !data.online;
  const allDown = sessions.length > 0 && upSessions === 0;
  let tone: Tone = "ok";
  if (offline || allDown || errorsCount > 0) tone = "bad";
  else if (upSessions < sessions.length || problems.length > 0) tone = "warn";

  let title = "সব ঠিক আছে";
  let sub = `${sessions.length}টা সেশনের সবকটা ঠিক আছে। ছবি বানানো যাচ্ছে।`;
  if (offline) {
    title = "বট এখন বন্ধ আছে";
    sub = data?.reason || "বট উত্তর দিচ্ছে না। নতুন করে চালু হতে পারে, ১-২ মিনিট পরে আবার Refresh চাপুন।";
  } else if (allDown) {
    title = "সব সেশন বন্ধ, ছবি বানানো যাচ্ছে না";
    sub = "নিচে প্রতিটা সেশনের কারণ দেওয়া আছে।";
  } else if (tone === "bad") {
    title = "একটা বড় সমস্যা আছে";
    sub = `${upSessions}/${sessions.length} সেশন কাজ করছে। নিচে কারণ আর করণীয় দেওয়া আছে।`;
  } else if (tone === "warn") {
    title = "বট চলছে, তবে কিছু দেখার আছে";
    sub = `${upSessions}/${sessions.length} সেশন কাজ করছে। নিচে কারণ দেওয়া আছে।`;
  }
  const t = TONE[tone];

  return (
    <div className="space-y-5">
      {/* Verdict */}
      <section
        className="relative overflow-hidden rounded-3xl border border-[#3A2F22] bg-[#1F1913] p-6 text-white shadow-[0_24px_50px_-28px_rgba(31,25,19,0.9)] sm:p-8"
        style={data ? { backgroundImage: `radial-gradient(520px 220px at 0% 0%, ${t.glow}, transparent 70%)` } : undefined}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {data ? (
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                {tone === "ok" && <span className="absolute inset-0 rounded-full opacity-40 motion-safe:animate-ping" style={{ background: t.color }} />}
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-2" style={{ borderColor: t.color, background: t.glow, color: t.color }}>
                  {tone === "ok" ? <Check size={30} strokeWidth={3} /> : tone === "warn" ? <AlertTriangle size={28} /> : <X size={30} strokeWidth={3} />}
                </span>
              </span>
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#5A4A32] text-[#E0A53A]">
                <Activity size={28} />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#CDBFA3]">Image bot (Gemini)</p>
              <h2 className="text-2xl font-bold leading-snug sm:text-3xl">{data ? title : "বটের অবস্থা দেখুন"}</h2>
              <p className="mt-1 max-w-xl text-base leading-relaxed text-[#E6DAB9]">
                {data ? sub : "বাটন চাপলে বট চালু আছে কিনা, সেশনগুলো ঠিক আছে কিনা আর কতগুলো ছবি বানানো হয়েছে, সব এক জায়গায় দেখা যাবে।"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#E0A53A] px-5 text-sm font-bold text-[#2B2116] transition hover:bg-[#EDB853] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "চেক হচ্ছে..." : data ? "Refresh" : "বট চেক করুন"}
          </button>
        </div>

        {error && <p className="mt-5 rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200">{error}</p>}

        {data?.online && s && (
          <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-4">
            {[
              { k: "সেশন ঠিক আছে", v: `${upSessions}/${sessions.length}` },
              { k: "ছবি বানানো হয়েছে", v: String(s.jobsOk) },
              { k: "সফলতার হার", v: `${rate}%` },
              { k: "গড় সময়", v: s.jobsOk > 0 ? `${s.avgSeconds} সেকেন্ড` : "–" },
            ].map((x) => (
              <div key={x.k} className="bg-[#1F1913] px-5 py-4">
                <dd className="text-2xl font-bold tabular-nums sm:text-3xl">{x.v}</dd>
                <dt className="mt-0.5 text-sm text-[#CDBFA3]">{x.k}</dt>
              </div>
            ))}
          </dl>
        )}

        {data && (
          <p className="mt-5 flex items-center gap-2 text-sm text-[#CDBFA3]">
            <Clock size={14} />
            শেষ চেক: {dhaka(data.checkedAt)} (বাংলাদেশ সময়). নিজে নিজে আপডেট হয় না, নতুন তথ্য দেখতে Refresh চাপুন।
          </p>
        )}
      </section>

      {/* Problems (only when there are some) */}
      {data && problems.length > 0 && (
        <section className={`${PANEL} p-5 sm:p-7`}>
          <SectionTitle title="সমস্যা আর করণীয়" hint={`${errorsCount} টা গুরুতর, ${problems.length - errorsCount} টা অন্য`} />
          <ul className="mt-4 space-y-3">
            {problems.map((p, i) => (
              <ProblemItem key={`${p.title}-${i}`} p={p} />
            ))}
          </ul>
        </section>
      )}

      {data?.online && s && (
        <>
          {/* This run */}
          <section className={`${PANEL} p-5 sm:p-7`}>
            <SectionTitle title="এখন কী হচ্ছে" hint="প্রতিটা রান প্রায় ৫ ঘণ্টা ২০ মিনিট চলে, তারপর নতুন রান দায়িত্ব নেয়। সংখ্যাগুলো প্রতি রানে ০ থেকে শুরু হয়।" />
            <div className="mt-5">
              <div className="h-3 overflow-hidden rounded-full bg-[#EADFC4]">
                <div className="h-full rounded-full bg-[#C98A1B]" style={{ width: `${runPct}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-x-4 text-sm text-[#6B5A40]">
                <span>শুরু {data.startedAt ? dhakaShort(data.startedAt) : "–"}</span>
                <span className="font-bold text-[#2B2116]">{bnDuration(data.uptimeSeconds ?? 0)} ধরে চলছে</span>
                <span>নতুন রান ~{handoff ? dhakaShort(handoff) : "–"}</span>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Fact label="এখন ছবি বানাচ্ছে" value={data.generation?.active ?? 0} hint={`সর্বোচ্চ ${data.generation?.currentCapacity ?? 0}টা একসাথে`} />
              <Fact label="লাইনে অপেক্ষায়" value={data.generation?.waiting ?? 0} hint={`আজকের রানে সর্বোচ্চ ${s.peakWaiting}`} />
              <Fact label="ফেল হয়েছে" value={s.jobsFailed} hint={`মোট ${s.jobs}টা অনুরোধ`} tone={s.jobsFailed > 0 ? "warn" : undefined} />
              <Fact label="অটো রিট্রাই" value={s.retries} hint={`রিফিউজ ${s.attemptsRefused}, টাইমআউট ${s.attemptsTimedOut}`} />
            </div>
          </section>

          {/* Ready pages */}
          {warm && (
            <section className={`${PANEL} p-5 sm:p-7`}>
              <SectionTitle
                title="আগে থেকে খোলা Gemini পেজ"
                hint={
                  !warmOn
                    ? "এই সুবিধা এখন বন্ধ আছে, প্রতি ছবির জন্য নতুন পেজ খোলা হচ্ছে।"
                    : "রান শুরুতে সব সেশনের পেজ খুলে রাখা হয়। ছবি এলে সরাসরি ওই পেজেই কাজ শুরু হয়।"
                }
              />
              {warmOn ? (
                <>
                  <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${TONE[warmTone].soft}`}>
                    {!warm.startupDone
                      ? "শুরুর পেজগুলো এখনো খোলা হচ্ছে (এক সেশনের পর আরেক সেশন)। এর মধ্যে ছবি এলে বট নিজে পেজ খুলে নেয়।"
                      : warmWanted > 0 && warmReady < warmWanted
                        ? `${warmReady}/${warmWanted}টা পেজ এখন রেডি। বাকিগুলো ব্যবহার হচ্ছে, নতুন করে সাজানো হচ্ছে বা খোলা যায়নি।`
                        : `সব পেজ রেডি (${warmReady}/${warmWanted})। ছবি এলেই কাজ শুরু হবে।`}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Fact label="এখন রেডি পেজ" value={warmReady} hint={warmWanted > 0 ? `মোট ${warmWanted}টা থাকার কথা (প্রতি সেশনে ${warm.pagesPerSession}টা)` : undefined} tone={warm.startupDone && warmWanted > 0 && warmReady < warmWanted ? "warn" : undefined} />
                    <Fact label="রেডি পেজ থেকে শুরু" value={warm.hits} hint={warmJobs > 0 ? `${warmHitPct}% ছবি সঙ্গে সঙ্গে শুরু হয়েছে` : "এখনো কোনো ছবি আসেনি"} />
                    <Fact label="নিজে পেজ খুলতে হয়েছে" value={warm.misses} hint="সব পেজ ব্যস্ত ছিল, তাই ধীর" tone={warm.misses > 0 ? "warn" : undefined} />
                    <Fact label="নষ্ট পেজ বদলানো" value={warm.replaced} hint="ফেল হওয়া পেজ বন্ধ করে নতুন খোলা হয়েছে" />
                  </div>
                </>
              ) : (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  চালু করতে GitHub workflow-তে PREWARM: &quot;1&quot; দিন, তারপর বট নতুন করে চালু করুন।
                </p>
              )}
            </section>
          )}

          {/* Sessions */}
          <section className={`${PANEL} p-5 sm:p-7`}>
            <SectionTitle title="Google সেশন" hint={`${upSessions}/${sessions.length} ঠিক আছে`} />
            <ul className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
              {sessions.map((x) => {
                const st: Tone = !x.usable ? "bad" : !x.healthy ? "warn" : "ok";
                const label = !x.usable ? "বন্ধ" : !x.healthy ? "বিশ্রামে" : "ঠিক আছে";
                const cap = data.perSessionConcurrency ?? 0;
                const pct = cap > 0 ? Math.min(100, (x.active / cap) * 100) : 0;
                return (
                  <li key={x.slot} className={`rounded-2xl border p-4 ${st === "ok" ? "border-[#EADFC4] bg-[#FBF5E4]" : st === "warn" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-[#2B2116]">Session {x.slot}</span>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: TONE[st].color }} />
                    </div>
                    <p className={`mt-1 text-sm font-bold ${TONE[st].text}`}>{label}</p>
                    <p className="mt-3 text-sm text-[#6B5A40]">
                      <span className="text-lg font-bold tabular-nums text-[#2B2116]">{x.images}</span>টা ছবি বানিয়েছে
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EADFC4]" aria-hidden>
                      <div className="h-full rounded-full bg-[#C98A1B]" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-[#7A6A50]">এখন কাজ করছে {x.active}/{cap}</p>
                    {warmOn && warm && (() => {
                      const w = warm.sessions.find((y) => y.slot === x.slot);
                      const want = warm.pagesPerSession;
                      return (
                        <p className="mt-0.5 text-xs text-[#7A6A50]" title={w?.lastError || undefined}>
                          রেডি পেজ <span className={`font-bold ${w && w.ready >= want ? "text-emerald-700" : "text-amber-700"}`}>{w?.ready ?? 0}/{want}</span>
                          {w && w.refreshing > 0 ? ` · ${w.refreshing}টা সাজানো হচ্ছে` : ""}
                        </p>
                      );
                    })()}
                  </li>
                );
              })}
            </ul>
            {sessions.some((x) => !(x.usable && x.healthy) || x.failStreak > 0) && (
              <ul className="mt-4 space-y-2">
                {sessions
                  .filter((x) => !(x.usable && x.healthy) || x.failStreak > 0)
                  .map((x) => (
                    <li key={`why-${x.slot}`} className="rounded-xl bg-[#FBF5E4] px-4 py-3 text-sm leading-relaxed text-[#3B2F1E]">
                      <span className="font-bold">Session {x.slot}:</span>{" "}
                      {!(x.usable && x.healthy) ? sessionReasonBn(x) : `সাম্প্রতিক ${x.failStreak}বার ফেল করেছে। ${x.lastCause || x.lastError}`}
                      {x.lastAdvice && <span className="block text-[#6B5A40]">কী করবেন: {x.lastAdvice}</span>}
                    </li>
                  ))}
              </ul>
            )}
            <p className="mt-4 text-sm leading-relaxed text-[#7A6A50]">
              “বন্ধ” মানে দৈনিক লিমিট শেষ অথবা Google লগ-আউট হয়ে গেছে। “বিশ্রামে” মানে পরপর কয়েকবার ফেল করায় বট কিছুক্ষণ ওই সেশন বাদ দিয়ে পরে আবার চেষ্টা করবে।
            </p>
          </section>

          {/* Latest images */}
          {data.detailed && (data.jobs ?? []).length > 0 && (
            <section className={`${PANEL} p-5 sm:p-7`}>
              <SectionTitle title="সাম্প্রতিক ছবি" hint="সবচেয়ে নতুন আগে। একাধিক চেষ্টা মানে প্রথম সেশন ফেল করেছিল।" />
              <ul className="mt-4 divide-y divide-[#EADFC4]">
                {(data.jobs ?? []).slice().reverse().slice(0, 12).map((j, i) => (
                  <li key={`${j.at}-${i}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3">
                    <span className="w-24 text-sm font-semibold tabular-nums text-[#2B2116]">{dhaka(j.at)}</span>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${j.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{j.ok ? "সফল" : "ফেল"}</span>
                    <span className="text-sm tabular-nums text-[#6B5A40]">{Math.round(j.ms / 1000)} সেকেন্ড</span>
                    <span className="flex flex-wrap gap-1.5">
                      {j.attempts.map((a, k) => (
                        <span key={k} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${a.result === "ok" ? "bg-[#F2E8D2] text-[#5A4A32]" : "bg-amber-100 text-amber-900"}`}>
                          Session {a.slot}: {a.result} ({Math.round(a.ms / 1000)}s)
                        </span>
                      ))}
                    </span>
                    {j.error && <span className="basis-full text-sm text-red-700">{j.error}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* GitHub runs */}
      {data?.runs && data.runs.length > 0 && (
        <section className={`${PANEL} p-5 sm:p-7`}>
          <SectionTitle title="GitHub রান" hint="বট যে রান-এ চলে। একটা শেষ হওয়ার আগে পরেরটা শুরু হয়।" />
          <ul className="mt-4 space-y-2">
            {data.runs.map((r) => {
              const live = r.status === "in_progress";
              const label = live ? "চলছে" : r.conclusion === "success" ? "সম্পন্ন" : r.conclusion === "cancelled" ? "বাতিল" : r.conclusion === "failure" ? "ব্যর্থ" : r.status === "queued" ? "অপেক্ষায়" : r.conclusion || r.status;
              const pill = live ? "bg-emerald-100 text-emerald-800" : r.conclusion === "success" ? "bg-[#F2E8D2] text-[#5A4A32]" : r.conclusion === "failure" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900";
              return (
                <li key={r.number} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-[#FBF5E4] px-4 py-3 text-sm text-[#3B2F1E]">
                  <span className="w-12 font-bold tabular-nums text-[#2B2116]">#{r.number}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold ${pill}`}>
                    {live && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 motion-safe:animate-pulse" />}
                    {label}
                  </span>
                  <span className="text-[#6B5A40]">
                    {r.event === "schedule" ? "নির্ধারিত সময়ে শুরু" : r.event === "workflow_dispatch" ? "হাতে বা আগের রান শুরু করেছে" : r.event}
                  </span>
                  <span className="ml-auto tabular-nums text-[#6B5A40]">শুরু {dhakaShort(r.startedAt)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Technical details, folded away */}
      {data?.online && data.detailed && (data.events ?? []).length > 0 && (
        <Fold title="ঘটনার তালিকা (টেকনিক্যাল)">
          <ul className="space-y-2">
            {(data.events ?? []).slice().reverse().slice(0, 25).map((e, i) => (
              <li key={`${e.at}-${i}`} className="rounded-xl bg-[#FBF5E4] px-4 py-3 text-sm text-[#3B2F1E]">
                <span className="font-bold tabular-nums">{dhaka(e.at)}</span> {e.slot ? `· Session ${e.slot} ` : ""}· <strong>{EVENT_LABEL[e.type] || e.type}</strong>
                <span className="mt-0.5 block text-[#6B5A40]">{e.message}</span>
                {e.cause && (
                  <span className="mt-0.5 block text-[#6B5A40]">
                    <strong>কেন:</strong> {e.cause} {e.advice}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Fold>
      )}

      {data?.online && data.detailed && (data.logTail ?? []).length > 0 && (
        <Fold title={`বট লগ (শেষ ${(data.logTail ?? []).length} লাইন)`}>
          <pre className="max-h-96 overflow-auto rounded-2xl border border-[#3A2F22] bg-[#1F1913] p-4 text-xs leading-relaxed text-[#F6EDD4]">
            {(data.logTail ?? []).map((l) => `${dhaka(l.at)} ${l.level === "error" ? "ERR " : ""}${l.text}`).join("\n")}
          </pre>
        </Fold>
      )}
    </div>
  );
}
