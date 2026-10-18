"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MonitorPlay,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";
import LiveScreenViewer from "./LiveScreenViewer";

type ScreenShareStatus = "idle" | "requested" | "sharing" | "declined" | "stopped";
type LiveSession = {
  userId: string;
  sessionId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  lastHeartbeatAt?: string | null;
  screenShareStatus?: ScreenShareStatus;
  screenShareRequestId?: string;
  screenShareAdminViewerId?: string;
};

function dateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function screenShareLabel(status: ScreenShareStatus | undefined) {
  if (status === "sharing") return "Screen sharing live";
  if (status === "requested") return "Request sent · waiting";
  if (status === "declined") return "User declined";
  if (status === "stopped") return "Sharing stopped";
  return "Ready to request";
}

function screenShareStyle(status: ScreenShareStatus | undefined) {
  if (status === "sharing") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "requested") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "declined") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-indigo-200 bg-indigo-50 text-indigo-700";
}

export default function AdminLivePanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const loadSessions = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/admin/live", {
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Could not load current online sessions.");
      const nextSessions: LiveSession[] = Array.isArray(data?.sessions) ? data.sessions : [];
      setSessions(nextSessions);
      setLastChecked(new Date().toISOString());
      setError("");
      setSelectedSessionId((current) =>
        current && nextSessions.some((row) => row.sessionId === current)
          ? current
          : nextSessions[0]?.sessionId || "",
      );
    } catch (cause) {
      if (!quiet) setError(cause instanceof Error ? cause.message : "Could not load current online sessions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions(false);
    const interval = window.setInterval(() => void loadSessions(true), 3_000);
    return () => window.clearInterval(interval);
  }, [loadSessions, refreshKey]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.sessionId === selectedSessionId) || null,
    [sessions, selectedSessionId],
  );
  const sharingCount = sessions.filter((session) => session.screenShareStatus === "sharing").length;
  const requestedCount = sessions.filter((session) => session.screenShareStatus === "requested").length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <MonitorPlay size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Live screen sessions</h2>
                <p className="mt-0.5 text-xs text-slate-500">Online users · user-approved website live view</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              অনলাইন ইউজার নির্বাচন করে <strong>Request live screen</strong> চাপুন। ইউজার অনুমতি দিলে ওয়েবপেজের DOM ও ইন্টারঅ্যাকশন ইভেন্ট LiveKit-এ যাবে; ভিডিও ফ্রেম বারবার রেন্ডার হবে না, এবং অন্য ট্যাব/ডেস্কটপ পাঠানো হবে না। অ্যাপটি পুরোনো অ্যাক্টিভিটি ডিটেইলস, ক্লিক-তালিকা বা লাইভ ভিডিও সংরক্ষণ করে না.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live sync active
            </span>
            <button
              type="button"
              onClick={() => { setRefreshing(true); void loadSessions(false); }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 shrink-0" size={17} /> <span>{error}</span>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Online browser sessions</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{sessions.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Website live views</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{sharingCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Requests awaiting user</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums text-slate-900"><Clock3 size={19} className="text-amber-600" /> {requestedCount}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-600"><ShieldCheck size={13} className="text-emerald-600" /> Live only · no recording</p>
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h3 className="font-semibold text-slate-900">Currently online</h3>
            <p className="mt-0.5 text-xs text-slate-500">Choose an online user to request a live screen. Refreshes every 3 seconds.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{sessions.length}</span>
        </div>
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading online users…</div>
        ) : sessions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <UserRound className="mx-auto text-slate-300" size={30} />
            <p className="mt-3 text-sm font-semibold text-slate-700">No users online right now</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Signed-in user sessions will appear here. Screen sharing starts only after a user accepts your request.</p>
          </div>
        ) : (
          <div className="max-h-[440px] divide-y divide-slate-100 overflow-y-auto">
            {sessions.map((session) => {
              const selected = session.sessionId === selectedSessionId;
              const shareStatus = session.screenShareStatus || "idle";
              return (
                <button
                  key={session.sessionId}
                  type="button"
                  onClick={() => setSelectedSessionId(session.sessionId)}
                  className={`block w-full p-4 text-left transition hover:bg-slate-50 sm:p-5 ${selected ? "bg-indigo-50/70 ring-1 ring-inset ring-indigo-100" : "bg-white"}`}
                >
                  <span className="flex items-start gap-3">
                    {session.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.profileImageUrl} alt="" className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">{(session.fullName || "U").slice(0, 1).toUpperCase()}</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{session.fullName}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${screenShareStyle(shareStatus)}`}>
                          {shareStatus === "sharing" ? <CheckCircle2 size={12} /> : shareStatus === "requested" ? <Clock3 size={12} /> : shareStatus === "declined" ? <XCircle size={12} /> : <Video size={12} />}
                          {screenShareLabel(shareStatus)}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">{session.email}</span>
                      <span className="mt-2 block text-xs text-slate-500">{selected ? "Selected for live screen request" : "Click to select this user"}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-5">Last refreshed: {dateTime(lastChecked)}</div>
      </section>

      <LiveScreenViewer
        selectedSession={selectedSession ? {
          userId: selectedSession.userId,
          sessionId: selectedSession.sessionId,
          fullName: selectedSession.fullName,
          email: selectedSession.email,
          screenShareStatus: selectedSession.screenShareStatus || "idle",
          screenShareRequestId: selectedSession.screenShareRequestId || "",
          screenShareAdminViewerId: selectedSession.screenShareAdminViewerId || "",
        } : null}
        onChanged={() => { void loadSessions(true); }}
      />
    </div>
  );
}
