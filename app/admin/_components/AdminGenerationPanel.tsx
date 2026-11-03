"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, LoaderCircle, RefreshCw, ShieldAlert, X } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

type Item = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  loginCount: number;
  lastLoginAt: string | null;
  isBanned: boolean;
  allowed: number;
  blocked: number;
  lastHour: number;
  ipCount: number;
  lastAt: string | null;
  suspicious: boolean;
  reasons: string[];
  limitedNow: boolean;
  limitKind: "hourly" | "daily" | "both" | null;
  unlockAt: string | null;
};

type SharedIp = { ip: string; count: number; users: Pick<Item, "id" | "fullName" | "email" | "phoneNumber">[] };

type Data = {
  hours: number;
  limits: { hourly: number; daily: number };
  totals: { allowed: number; blocked: number; users: number };
  items: Item[];
  sharedIps: SharedIp[];
};

type Detail = {
  ips: { ip: string; count: number; lastAt: string; userAgent: string }[];
  recent: { id: string; route: string; ip: string; userAgent: string; outcome: "allowed" | "blocked"; createdAt: string }[];
};

const CARD =
  "rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_10px_28px_-20px_rgba(59,47,30,0.45)]";
const TH = "px-4 py-3 text-[12px] font-semibold text-[#7A6A50]";

function fmt(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "23 min" / "2h 10m" until the account can generate again; null once the time has passed.
function remaining(unlockAt: string, nowMs: number) {
  const ms = new Date(unlockAt).getTime() - nowMs;
  if (ms <= 0) return null;
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function AdminGenerationPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [hours, setHours] = useState<24 | 168>(24);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Keep the "opens in" countdown fresh without reloading the list.
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/generation-activity?hours=${hours}`, {
        headers: getClientAuthHeaders(),
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Could not load.");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load.");
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const openDetail = async (item: Item) => {
    setSelected(item);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/generation-activity?userId=${item.id}`, {
        headers: getClientAuthHeaders(),
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) setDetail(json);
    } finally {
      setDetailLoading(false);
    }
  };

  const blockTools = async (item: { id: string; fullName: string }) => {
    if (!window.confirm(`Block all tools for ${item.fullName}? You can restore access from Users → Manage access.`)) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/users/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ action: "ban", reason: "Unusual image generation activity" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || "Could not block.");
      await load();
      setSelected((cur) => (cur && cur.id === item.id ? { ...cur, isBanned: true } : cur));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not block.");
    } finally {
      setBusyId("");
    }
  };

  const items = data?.items || [];
  const suspicious = items.filter((i) => i.suspicious);

  return (
    <div className="space-y-6">
      <section className={`${CARD} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#3B2F1E]">Image generation activity</h2>
            <p className="mt-1 text-sm text-[#7A6A50]">
              Who is generating images, from which IP, and how often. Limit per account:{" "}
              {data ? `${data.limits.hourly}/hour, ${data.limits.daily}/day` : "…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {([24, 168] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${hours === h ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-[#D8C9A6] bg-[#FFFDF6] text-[#3B2F1E]"}`}
              >
                {h === 24 ? "Last 24 hours" : "Last 7 days"}
              </button>
            ))}
            <button
              onClick={() => void load()}
              className="rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] p-2.5 text-[#3B2F1E]"
              aria-label="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            ["Images generated", data?.totals.allowed ?? 0],
            ["Blocked by limit", data?.totals.blocked ?? 0],
            ["Users generating", data?.totals.users ?? 0],
            ["Suspicious accounts", suspicious.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-[#E3D6B8] bg-[#FFFDF6] p-4">
              <div className="text-xs font-medium text-[#7A6A50]">{label}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-[#3B2F1E]">{value}</div>
            </div>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
      </section>

      <section className={`${CARD} overflow-hidden`}>
        <div className="flex items-center gap-2 border-b border-[#E3D6B8] px-5 py-4 text-sm font-semibold text-[#3B2F1E]">
          <ShieldAlert size={16} className="text-[#DC2626]" /> Accounts by generation count
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E3D6B8]">
                <th className={TH}>User</th>
                <th className={TH}>Last hour</th>
                <th className={TH}>Total</th>
                <th className={TH}>Blocked</th>
                <th className={TH}>Limit status</th>
                <th className={TH}>IPs</th>
                <th className={TH}>Logins</th>
                <th className={TH}>Last generated</th>
                <th className={TH}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-[#7A6A50]"><LoaderCircle className="mx-auto animate-spin" size={18} /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-[#7A6A50]">No generations recorded in this period yet.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className={`border-b border-[#EFE4C8] ${item.suspicious ? "bg-rose-50/60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-[#3B2F1E]">{item.fullName}</div>
                      <div className="text-xs text-[#7A6A50]">{item.email || item.phoneNumber}</div>
                      {item.suspicious && (
                        <div className="mt-1 text-[11px] font-semibold text-rose-700">⚠ {item.reasons.join(" · ")}</div>
                      )}
                      {item.isBanned && <div className="mt-1 text-[11px] font-semibold text-rose-700">Tools blocked</div>}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold tabular-nums text-[#3B2F1E]">{item.lastHour}</td>
                    <td className="px-4 py-3 text-sm font-semibold tabular-nums text-[#3B2F1E]">{item.allowed}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-[#3B2F1E]">{item.blocked}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const left = item.limitedNow && item.unlockAt ? remaining(item.unlockAt, nowMs) : null;
                        if (left && item.unlockAt) {
                          return (
                            <div>
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Locked</span>
                              <div className="mt-1 text-xs font-semibold text-[#3B2F1E]">Opens in {left}</div>
                              <div className="text-[11px] text-[#7A6A50]">
                                at {fmt(item.unlockAt)} · {item.limitKind === "daily" ? "daily" : item.limitKind === "both" ? "hourly + daily" : "hourly"} limit
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Open</span>
                            <div className="mt-1 text-[11px] text-[#7A6A50]">{item.lastHour}/{data?.limits.hourly ?? 0} this hour</div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-[#3B2F1E]">{item.ipCount}</td>
                    <td className="px-4 py-3 text-sm text-[#3B2F1E]">
                      <div className="tabular-nums">{item.loginCount} times</div>
                      <div className="text-xs text-[#7A6A50]">last: {fmt(item.lastLoginAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#7A6A50]">{fmt(item.lastAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => void openDetail(item)} className="rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] px-3 py-1.5 text-xs font-semibold text-[#3B2F1E]">
                          Details
                        </button>
                        {!item.isBanned && (
                          <button
                            disabled={busyId === item.id}
                            onClick={() => void blockTools(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
                          >
                            <Ban size={12} /> Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {data && data.sharedIps.length > 0 && (
        <section className={`${CARD} p-5`}>
          <h3 className="text-sm font-semibold text-[#3B2F1E]">Same IP used by multiple accounts</h3>
          <p className="mt-1 text-xs text-[#7A6A50]">One person may be using several accounts (family or a shared shop connection can also look like this).</p>
          <div className="mt-3 space-y-2">
            {data.sharedIps.map((row) => (
              <div key={row.ip} className="rounded-xl border border-[#E3D6B8] bg-[#FFFDF6] p-3 text-sm">
                <div className="font-mono text-[#3B2F1E]">{row.ip} <span className="font-sans text-xs text-[#7A6A50]">· {row.count} generations</span></div>
                <div className="mt-1 text-xs text-[#7A6A50]">{row.users.map((u) => `${u.fullName} (${u.email || u.phoneNumber})`).join("  •  ")}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2A2118]/60 px-4 py-6 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className={`${CARD} max-h-[85vh] w-full max-w-3xl overflow-y-auto p-6`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#3B2F1E]">{selected.fullName}</h3>
                <p className="text-sm text-[#7A6A50]">{selected.email} {selected.phoneNumber && `· ${selected.phoneNumber}`}</p>
                <p className="mt-1 text-xs text-[#7A6A50]">Logged in {selected.loginCount} times · last login {fmt(selected.lastLoginAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close" className="rounded-lg p-1.5 text-[#7A6A50] hover:bg-black/5"><X size={18} /></button>
            </div>

            {detailLoading || !detail ? (
              <div className="py-10 text-center"><LoaderCircle className="mx-auto animate-spin" size={18} /></div>
            ) : (
              <>
                <h4 className="mt-5 text-sm font-semibold text-[#3B2F1E]">IP addresses (last 7 days)</h4>
                <div className="mt-2 space-y-1.5">
                  {detail.ips.map((row) => (
                    <div key={row.ip} className="rounded-lg border border-[#E3D6B8] bg-[#FFFDF6] px-3 py-2 text-sm">
                      <span className="font-mono text-[#3B2F1E]">{row.ip}</span>
                      <span className="ml-2 text-xs text-[#7A6A50]">{row.count} times · last {fmt(row.lastAt)}</span>
                      <div className="truncate text-[11px] text-[#A8987A]">{row.userAgent}</div>
                    </div>
                  ))}
                </div>
                <h4 className="mt-5 text-sm font-semibold text-[#3B2F1E]">Recent attempts</h4>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <tbody>
                      {detail.recent.map((r) => (
                        <tr key={r.id} className="border-b border-[#EFE4C8]">
                          <td className="py-1.5 pr-3 text-[#7A6A50]">{fmt(r.createdAt)}</td>
                          <td className="py-1.5 pr-3 font-mono text-[#3B2F1E]">{r.ip}</td>
                          <td className="py-1.5 pr-3 text-[#7A6A50]">{r.route}</td>
                          <td className={`py-1.5 font-semibold ${r.outcome === "blocked" ? "text-rose-700" : "text-emerald-700"}`}>{r.outcome === "blocked" ? "Blocked (limit)" : "Generated"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!selected.isBanned && (
              <button
                disabled={busyId === selected.id}
                onClick={() => void blockTools(selected)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                <Ban size={14} /> Block all tools
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
