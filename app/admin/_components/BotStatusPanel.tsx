"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

const PANEL = "rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_10px_28px_-20px_rgba(59,47,30,0.45)]";

type Channel = { enabled: boolean; sent: number; failed: number; lastError: string; lastSentAt: string; resting?: boolean };
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
  stats?: {
    jobs: number; jobsOk: number; jobsFailed: number; retries: number; attemptsRefused: number;
    attemptsTimedOut: number; limitHits: number; loggedOutSessions: number; otherErrors: number;
    peakActive: number; peakWaiting: number; avgSeconds: number;
  };
  sessions?: Array<{
    slot: number; active: number; usable: boolean; healthy: boolean; downReason: string; failStreak: number;
    lastError: string; lastCause: string; lastAdvice: string; restingUntil: string; usableAgainAt: string; images: number;
  }>;
  notifier?: { messenger: Channel; email: Channel };
  recentErrors?: Array<{ at: string; label: string; message: string }>;
  events?: Array<{ at: string; type: string; slot: number; message: string; cause: string; advice: string }>;
  jobs?: Array<{ at: string; ms: number; ok: boolean; error: string; attempts: Array<{ slot: number; result: string; ms: number }> }>;
  logTail?: Array<{ at: string; level: string; text: string }>;
  runs?: Array<{ number: number; status: string; conclusion: string; event: string; startedAt: string; updatedAt: string }> | null;
  problems?: Problem[];
};

function dhaka(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function dhakaShort(iso?: string): string {
  return dhaka(iso).slice(0, 5);
}

function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

const EVENT_LABEL: Record<string, string> = {
  "attempt-failed": "Attempt failed",
  "session-resting": "Session resting",
  "session-limit": "Daily limit",
  "session-logged-out": "Logged out",
  refused: "Gemini declined",
  "job-failed": "Image failed",
};

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-[#E3D6B8] bg-[#FFFDF6] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#7A6A50]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#2B2116]">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-[#6B5A40]">{hint}</p>}
    </div>
  );
}

function ChannelBox({ title, ch, note }: { title: string; ch: Channel | undefined; note?: string }) {
  const on = ch?.enabled === true;
  return (
    <div className="rounded-xl border border-[#E3D6B8] bg-[#FFFDF6] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#2B2116]">{title}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${on ? "bg-emerald-100 text-emerald-700" : "bg-[#F2E8D2] text-[#5A4A32]"}`}>
          {on ? (ch?.resting ? "Resting" : "On") : "Off"}
        </span>
      </div>
      <p className="mt-2 text-sm text-[#6B5A40]">
        Sent <strong>{ch?.sent ?? 0}</strong> · Failed <strong>{ch?.failed ?? 0}</strong>
        {ch?.lastSentAt ? ` · last ${dhakaShort(ch.lastSentAt)}` : ""}
      </p>
      {ch?.lastError && (
        <p className="mt-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1.5 text-xs font-semibold text-[#B91C1C]">{ch.lastError}</p>
      )}
      {note && <p className="mt-2 text-xs text-[#6B5A40]">{note}</p>}
    </div>
  );
}

function ProblemItem({ p }: { p: Problem }) {
  const tone =
    p.level === "error"
      ? "border-l-[#DC2626] bg-[#FEF2F2]"
      : p.level === "warn"
        ? "border-l-[#D97706] bg-[#FFFBEB]"
        : "border-l-[#64748B] bg-[#F8FAFC]";
  const icon = p.level === "error" ? "🔴" : p.level === "warn" ? "🟠" : "ℹ️";
  return (
    <li className={`rounded-lg border border-[#E3D6B8] border-l-4 px-4 py-3 ${tone}`}>
      <p className="text-sm font-bold text-[#2B2116]">{icon} {p.title}</p>
      {p.cause && <p className="mt-1 text-sm text-[#3B2F1E]"><strong>Why:</strong> {p.cause}</p>}
      {p.advice && <p className="mt-0.5 text-sm text-[#3B2F1E]"><strong>What to do:</strong> {p.advice}</p>}
    </li>
  );
}

export default function BotStatusPanel() {
  const [data, setData] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const s = data?.stats;
  const done = (s?.jobsOk ?? 0) + (s?.jobsFailed ?? 0);
  const rate = done ? Math.round(((s?.jobsOk ?? 0) / done) * 100) : 100;
  const sessions = data?.sessions ?? [];
  const upSessions = sessions.filter((x) => x.usable && x.healthy).length;
  const problems = data?.problems ?? [];
  const errorsCount = problems.filter((p) => p.level === "error").length;
  const handoff =
    data?.startedAt && !Number.isNaN(new Date(data.startedAt).getTime())
      ? new Date(new Date(data.startedAt).getTime() + 315 * 60_000).toISOString()
      : "";

  return (
    <div className="space-y-6">
      <section className={`${PANEL} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DC2626] text-white shadow-sm">
              <Activity size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#2B2116]">Image bot status</h2>
              <p className="text-sm text-[#6B5A40]">
                Everything about the Gemini image bot in one place. Refreshes every 30 seconds
                {data?.checkedAt ? ` · checked ${dhaka(data.checkedAt)}` : ""} (Dhaka time).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] px-4 text-sm font-bold text-[#3B2F1E] transition hover:bg-[#F6EDD4] disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm font-semibold text-[#B91C1C]">{error}</p>}

        {data && (
          <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${data.online ? "bg-emerald-50 text-emerald-700" : "bg-[#FEF2F2] text-[#B91C1C]"}`}>
            {data.online ? `Bot is ONLINE · sessions ready ${upSessions}/${sessions.length}` : `Bot is OFFLINE · ${data.reason || "no answer"}`}
          </p>
        )}
      </section>

      {data && (
        <section className={`${PANEL} p-5 sm:p-6`}>
          <h3 className="text-base font-bold text-[#2B2116]">
            Problems right now {problems.length > 0 && <span className="ml-1 text-sm font-semibold text-[#6B5A40]">({errorsCount} serious, {problems.length - errorsCount} other)</span>}
          </h3>
          {problems.length === 0 ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">✅ No problems found. Everything looks fine.</p>
          ) : (
            <ul className="mt-3 space-y-2">{problems.map((p, i) => <ProblemItem key={`${p.title}-${i}`} p={p} />)}</ul>
          )}
        </section>
      )}

      {data?.online && s && (
        <>
          <section className={`${PANEL} p-5 sm:p-6`}>
            <h3 className="text-base font-bold text-[#2B2116]">This bot run</h3>
            <p className="mt-1 text-xs text-[#6B5A40]">
              A bot run lasts about 5 hours 20 minutes, then a new one takes over. The numbers start again from zero in each run.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Running for" value={duration(data.uptimeSeconds ?? 0)} hint={data.startedAt ? `Started ${dhakaShort(data.startedAt)}` : ""} />
              <Stat label="Next takeover" value={handoff ? `~${dhakaShort(handoff)}` : "–"} hint="A new run starts shortly before" />
              <Stat label="Images made" value={s.jobsOk} hint={`${s.jobs} requests`} />
              <Stat label="Failed" value={s.jobsFailed} hint={`Success rate ${rate}%`} />
              <Stat label="Auto retries" value={s.retries} hint={`Declined ${s.attemptsRefused} · timeout ${s.attemptsTimedOut}`} />
              <Stat label="Average time" value={`${s.avgSeconds}s`} hint="per image" />
              <Stat label="Working now" value={data.generation?.active ?? 0} hint={`Capacity ${data.generation?.currentCapacity ?? 0}`} />
              <Stat label="Waiting in line" value={data.generation?.waiting ?? 0} hint={`Peak at once ${s.peakActive} · peak line ${s.peakWaiting}`} />
            </div>
          </section>

          <section className={`${PANEL} p-5 sm:p-6`}>
            <h3 className="text-base font-bold text-[#2B2116]">Google sessions</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-[#7A6A50]">
                    <th className="py-2 pr-4">Session</th>
                    <th className="py-2 pr-4">State</th>
                    <th className="py-2 pr-4">Working now</th>
                    <th className="py-2 pr-4">Images this run</th>
                    <th className="py-2 pr-4">Back at</th>
                    <th className="py-2">Last problem</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((x) => (
                    <tr key={x.slot} className="border-t border-[#E3D6B8] align-top">
                      <td className="py-2.5 pr-4 font-bold text-[#2B2116]">#{x.slot}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            !x.usable ? "bg-[#FEE2E2] text-[#B91C1C]" : !x.healthy ? "bg-[#FEF3C7] text-[#92400E]" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {!x.usable ? "Stopped" : !x.healthy ? "Resting (failing)" : "Ready"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">{x.active} / {data.perSessionConcurrency ?? 0}</td>
                      <td className="py-2.5 pr-4">{x.images}</td>
                      <td className="py-2.5 pr-4">{dhakaShort(x.restingUntil || x.usableAgainAt) || "–"}</td>
                      <td className="py-2.5 text-xs text-[#6B5A40]">
                        {x.failStreak > 0 ? (
                          <>
                            <strong>{x.failStreak} in a row.</strong> {x.lastCause || x.lastError}
                          </>
                        ) : (
                          "–"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[#6B5A40]">
              &quot;Stopped&quot;: the daily limit was reached (back at the time shown) or the Google login expired. &quot;Resting (failing)&quot;: it failed or timed out several times in a row, so the bot skips it for a while and tries again later.
            </p>
          </section>

          {data.detailed && (data.jobs ?? []).length > 0 && (
            <section className={`${PANEL} p-5 sm:p-6`}>
              <h3 className="text-base font-bold text-[#2B2116]">Latest images (newest first)</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-[#7A6A50]">
                      <th className="py-2 pr-4">Started</th>
                      <th className="py-2 pr-4">Result</th>
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2">Tries (session → result)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.jobs ?? []).slice().reverse().slice(0, 20).map((j, i) => (
                      <tr key={`${j.at}-${i}`} className="border-t border-[#E3D6B8] align-top">
                        <td className="py-2 pr-4">{dhaka(j.at)}</td>
                        <td className="py-2 pr-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${j.ok ? "bg-emerald-100 text-emerald-700" : "bg-[#FEE2E2] text-[#B91C1C]"}`}>
                            {j.ok ? "OK" : "Failed"}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{Math.round(j.ms / 1000)}s</td>
                        <td className="py-2 text-xs text-[#3B2F1E]">
                          {j.attempts.map((a) => `#${a.slot} ${a.result} (${Math.round(a.ms / 1000)}s)`).join("  →  ") || "–"}
                          {j.error && <span className="block text-[#B91C1C]">{j.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-[#6B5A40]">An image with several tries was slow because the first session(s) failed. This shows exactly which one.</p>
            </section>
          )}

          {data.detailed && (data.events ?? []).length > 0 && (
            <section className={`${PANEL} p-5 sm:p-6`}>
              <h3 className="text-base font-bold text-[#2B2116]">Events (newest first)</h3>
              <ul className="mt-3 space-y-2">
                {(data.events ?? []).slice().reverse().slice(0, 25).map((e, i) => (
                  <li key={`${e.at}-${i}`} className="rounded-lg border border-[#E3D6B8] bg-[#FFFDF6] px-3 py-2 text-sm text-[#3B2F1E]">
                    <span className="font-bold">{dhaka(e.at)}</span> · {e.slot ? `Session #${e.slot} · ` : ""}
                    <strong>{EVENT_LABEL[e.type] || e.type}</strong>
                    <span className="block text-xs text-[#6B5A40]">{e.message}</span>
                    {e.cause && <span className="block text-xs text-[#6B5A40]"><strong>Why:</strong> {e.cause} {e.advice}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={`${PANEL} p-5 sm:p-6`}>
            <h3 className="text-base font-bold text-[#2B2116]">Alerts to you</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ChannelBox title="Email" ch={data.notifier?.email} note="Needs ALERT_WEBHOOK_URL and BOT_ALERT_KEY on the bot." />
              <ChannelBox title="Messenger" ch={data.notifier?.messenger} note="Optional. Rests for 6 hours if Facebook logs the bot account out." />
            </div>
          </section>
        </>
      )}

      {data?.runs && data.runs.length > 0 && (
        <section className={`${PANEL} p-5 sm:p-6`}>
          <h3 className="text-base font-bold text-[#2B2116]">GitHub bot runs</h3>
          <ul className="mt-3 space-y-2">
            {data.runs.map((r) => (
              <li key={r.number} className="flex flex-wrap items-center gap-x-3 rounded-lg border border-[#E3D6B8] bg-[#FFFDF6] px-3 py-2 text-sm text-[#3B2F1E]">
                <span className="font-bold">#{r.number}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    r.status === "in_progress" ? "bg-emerald-100 text-emerald-700" : r.conclusion === "success" ? "bg-[#F2E8D2] text-[#5A4A32]" : "bg-[#FEF3C7] text-[#92400E]"
                  }`}
                >
                  {r.status === "completed" ? r.conclusion || "completed" : r.status.replace("_", " ")}
                </span>
                <span>{r.event === "schedule" ? "scheduled" : r.event === "workflow_dispatch" ? "started by hand or by the previous run" : r.event}</span>
                <span className="text-xs text-[#6B5A40]">started {dhakaShort(r.startedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data?.online && data.detailed && (data.logTail ?? []).length > 0 && (
        <section className={`${PANEL} p-5 sm:p-6`}>
          <details>
            <summary className="cursor-pointer text-base font-bold text-[#2B2116]">Bot log (last {(data.logTail ?? []).length} lines)</summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded-lg border border-[#E3D6B8] bg-[#2B2116] p-3 text-xs leading-relaxed text-[#F6EDD4]">
              {(data.logTail ?? []).map((l) => `${dhaka(l.at)} ${l.level === "error" ? "ERR " : ""}${l.text}`).join("\n")}
            </pre>
          </details>
        </section>
      )}
    </div>
  );
}
