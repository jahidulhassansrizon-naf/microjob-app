"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  Gauge,
  MessageCircle,
  Percent,
  Repeat,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export type OverviewInsightsData = {
  attention: { unreadChats: number; failedPayments24h: number };
  kpi: { dau: number; mau: number; mrr: number; costConfigured: boolean; aiCostMonth: number };
  usage: {
    tools: { key: string; label: string; uses: number; today: number; yesterday: number; successRate: number | null; failed: number }[];
    todayTotal: number;
    yesterdayTotal: number;
    weekTotal: number;
  };
  growth: {
    activation: { base: number; activated: number };
    sevenDayReturn: { base: number; returned: number };
    churn: { expired: number; notRenewed: number };
    plans: { planId: string; planName?: string; count: number; revenue: number }[];
  };
  health: {
    aiCostToday: number;
    aiCostMonth: number;
    generationsThisMonth: number;
    unitCost: number;
    gateways: { name: string; enabled: boolean; hasKey: boolean; updatedAt: string | null }[];
    support: { openChats: number; avgReplyMinutes: number | null };
    security: { otpToday: number };
  };
  series: { date: string; label: string; signups: number; paid: number; revenue: number; aiCost: number }[];
};

type Stats = {
  activeNow: number;
  activeSubscribers: number;
  paidConversionPercent: number;
  revenueThisMonth: number;
  pendingPayments: number;
  expiringSoon: number;
  newToday: number;
  newThisMonth: number;
};

export type OverviewTarget = "pending" | "failed" | "expiring" | "chats" | "generations";

const CARD =
  "rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_10px_28px_-20px_rgba(59,47,30,0.45)]";
const n = (v: number | undefined | null) => (v || 0).toLocaleString("en-BD");
const money = (v: number | undefined | null) => `BDT ${Math.round(v || 0).toLocaleString("en-BD")}`;
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 1000) / 10}%` : "—");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-[#7A6A50]">{title}</h3>
      {children}
    </section>
  );
}

function Card({
  title,
  value,
  detail,
  icon: Icon,
  tint,
  valueClass = "",
}: {
  title: string;
  value: string;
  detail?: string;
  icon: typeof Users;
  tint: string;
  valueClass?: string;
}) {
  return (
    <article className={`${CARD} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#7A6A50]">{title}</p>
          <p className={`mt-2.5 text-[28px] font-semibold leading-none tracking-tight text-[#3B2F1E] tabular-nums ${valueClass}`}>{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </div>
      {detail && <p className="mt-4 border-t border-[#EFE5CE] pt-3 text-xs text-[#7A6A50]">{detail}</p>}
    </article>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <article className={`${CARD} p-5`}>
      <h4 className="text-sm font-semibold text-[#3B2F1E]">{title}</h4>
      {note && <p className="mt-0.5 text-xs text-[#7A6A50]">{note}</p>}
      <div className="mt-4">{children}</div>
    </article>
  );
}

function Bar({ label, value, max, right, color = "#3B2F1E" }: { label: string; value: number; max: number; right: string; color?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="truncate font-medium text-[#3B2F1E]">{label}</span>
        <span className="shrink-0 tabular-nums text-[#7A6A50]">{right}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-[#EFE5CE]">
        <div className="h-2 rounded-full" style={{ width: `${max > 0 ? Math.max(3, (value / max) * 100) : 0}%`, background: color }} />
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-4 text-center text-xs text-[#7A6A50]">{text}</p>;
}

// Bars for series A, line for series B (same scale), last 30 days.
function TrendChart({
  days,
  a,
  b,
  format,
}: {
  days: OverviewInsightsData["series"];
  a: { key: "signups" | "revenue"; label: string; color: string };
  b?: { key: "paid" | "aiCost"; label: string; color: string };
  format: (v: number) => string;
}) {
  const W = 600;
  const H = 180;
  const max = Math.max(1, ...days.map((d) => Math.max(d[a.key], b ? d[b.key] : 0)));
  const bw = W / days.length;
  const y = (v: number) => H - (v / max) * (H - 10) - 2;
  const line = b ? days.map((d, i) => `${i === 0 ? "M" : "L"}${(i * bw + bw / 2).toFixed(1)},${y(d[b.key]).toFixed(1)}`).join(" ") : "";
  const sumA = days.reduce((s, d) => s + d[a.key], 0);
  const sumB = b ? days.reduce((s, d) => s + d[b.key], 0) : 0;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-[#5A4A32]">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: a.color }} />{a.label}: <b className="tabular-nums">{format(sumA)}</b></span>
        {b && <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: b.color }} />{b.label}: <b className="tabular-nums">{format(sumB)}</b></span>}
        <span className="text-[#7A6A50]">peak {format(max)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={b ? `${a.label} and ${b.label}, last 30 days` : `${a.label}, last 30 days`}>
        <line x1="0" x2={W} y1={H} y2={H} stroke="#D8C9A6" />
        {days.map((d, i) => (
          <rect key={d.date} x={i * bw + 3} y={y(d[a.key])} width={Math.max(2, bw - 6)} height={H - y(d[a.key])} rx="2" fill={a.color} opacity="0.85">
            <title>{b ? `${d.label}: ${a.label} ${format(d[a.key])}, ${b.label} ${format(d[b.key])}` : `${d.label}: ${a.label} ${format(d[a.key])}`}</title>
          </rect>
        ))}
        {b && <path d={line} fill="none" stroke={b.color} strokeWidth="2" strokeLinejoin="round" />}
        {[0, 7, 14, 21, 29].map((i) => (
          <text key={i} x={i * bw + bw / 2} y={H + 14} textAnchor="middle" fontSize="10" fill="#7A6A50">{days[i]?.label}</text>
        ))}
      </svg>
    </div>
  );
}

export default function OverviewInsights({
  stats,
  insights,
  loading,
  onNavigate,
}: {
  stats?: Stats;
  insights?: OverviewInsightsData | null;
  loading: boolean;
  onNavigate: (target: OverviewTarget) => void;
}) {
  if (!insights) {
    return loading ? null : (
      <p className={`${CARD} p-5 text-sm text-[#7A6A50]`}>Extra overview metrics could not be loaded. Press Refresh to try again.</p>
    );
  }

  const { attention, kpi, usage, growth, health, series } = insights;
  const revenueThisMonth = stats?.revenueThisMonth || 0;

  const attentionItems = [
    { key: "pending" as const, label: "Pending payments", count: stats?.pendingPayments || 0, tone: "red" },
    { key: "chats" as const, label: "Unread user chats", count: attention.unreadChats, tone: "red" },
    { key: "failed" as const, label: "Failed payments (24h)", count: attention.failedPayments24h, tone: "amber" },
    { key: "expiring" as const, label: "Expiring in 7 days", count: stats?.expiringSoon || 0, tone: "amber" },
  ].filter((item) => item.count > 0);

  const maxUses = Math.max(1, ...usage.tools.map((t) => t.uses));
  const dayDelta = usage.todayTotal - usage.yesterdayTotal;
  const planTotal = growth.plans.reduce((s, p) => s + p.count, 0);
  const planLabel: Record<string, string> = { "1-month": "1 month", "3-month": "3 months", "6-month": "6 months", "1-year": "1 year" };

  return (
    <div className="space-y-6">
      {attentionItems.length > 0 && (
        <section aria-label="Needs attention" className="rounded-2xl border border-[#F2B93B]/60 bg-[#FFF6DC] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#8A5A00]">
              <AlertTriangle size={16} /> Needs attention
            </span>
            {attentionItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${item.tone === "red" ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-amber-200 bg-white text-amber-800 hover:bg-amber-50"}`}
              >
                <span className="tabular-nums">{item.count}</span> {item.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <Section title="Key numbers">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="DAU / MAU" value={`${n(kpi.dau)} / ${n(kpi.mau)}`} detail={`Seen today / in the last 30 days · stickiness ${pct(kpi.dau, kpi.mau)}`} icon={Users} tint="bg-[#F2E8D2] text-[#5A4A32]" />
          <Card title="Revenue this month" value={money(revenueThisMonth)} detail={`MRR (active plans per month): ${money(kpi.mrr)}`} icon={Wallet} tint="bg-[#FDF1D0] text-[#8A5A00]" />
          <Card title="Active subscribers" value={n(stats?.activeSubscribers)} detail="Paying users right now" icon={CreditCard} tint="bg-[#FEE9E9] text-[#B91C1C]" />
          <Card title="Paid conversion" value={`${stats?.paidConversionPercent ?? 0}%`} detail="Users with an active subscription" icon={Percent} tint="bg-emerald-50 text-emerald-700" />
        </div>
      </Section>

      <Section title="Product usage">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Top tools this week" note="AI image generations, last 7 days">
            {usage.tools.length === 0 ? (
              <Empty text="No tool usage recorded yet." />
            ) : (
              <div className="space-y-3.5">
                {usage.tools.slice(0, 5).map((t) => (
                  <Bar key={t.key} label={t.label} value={t.uses} max={maxUses} right={`${n(t.uses)} uses`} />
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Tool uses today" note="Compared with yesterday">
            <p className="text-[32px] font-semibold leading-none tabular-nums text-[#3B2F1E]">{n(usage.todayTotal)}</p>
            <p className={`mt-2 text-xs font-semibold ${dayDelta > 0 ? "text-emerald-700" : dayDelta < 0 ? "text-rose-700" : "text-[#7A6A50]"}`}>
              {dayDelta === 0 ? "Same as yesterday" : `${dayDelta > 0 ? "▲" : "▼"} ${Math.abs(dayDelta)} vs yesterday (${n(usage.yesterdayTotal)})`}
            </p>
            <p className="mt-4 text-xs text-[#7A6A50]">{n(usage.weekTotal)} generations in the last 7 days.</p>
          </Panel>
          <Panel title="Tool success rate" note="Generations that finished vs failed (7 days)">
            {usage.tools.length === 0 ? (
              <Empty text="Nothing to measure yet." />
            ) : (
              <div className="space-y-3.5">
                {usage.tools.map((t) => (
                  <Bar
                    key={t.key}
                    label={t.label}
                    value={t.successRate ?? 0}
                    max={100}
                    color={t.successRate !== null && t.successRate < 90 ? "#DC2626" : "#059669"}
                    right={t.successRate === null ? "no data yet" : `${t.successRate}% · ${t.failed} failed`}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>
        <p className="mt-3 px-1 text-xs text-[#7A6A50]">
          Only AI Editor, Bulk Photo Edit and AI Template are tracked so far. Free-tool usage and a free-vs-paid split need the same tracking added to those tools.
        </p>
      </Section>

      <Section title="Growth & revenue">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="Sign-ups today" value={n(stats?.newToday)} detail={`${n(stats?.newThisMonth)} this month`} icon={TrendingUp} tint="bg-[#FEE9E9] text-[#B91C1C]" />
          <Card title="Activation rate" value={pct(growth.activation.activated, growth.activation.base)} detail={`${n(growth.activation.activated)} of ${n(growth.activation.base)} sign-ups (30 days) used an AI tool`} icon={Gauge} tint="bg-emerald-50 text-emerald-700" />
          <Card title="7-day return rate" value={pct(growth.sevenDayReturn.returned, growth.sevenDayReturn.base)} detail={`${n(growth.sevenDayReturn.returned)} of ${n(growth.sevenDayReturn.base)} sign-ups from 7–14 days ago came back`} icon={Repeat} tint="bg-[#F2E8D2] text-[#5A4A32]" />
          <Card title="Expired, not renewed" value={n(growth.churn.notRenewed)} detail={`${n(growth.churn.expired)} plans expired in the last 30 days`} icon={CalendarClock} tint="bg-[#FDF1D0] text-[#8A5A00]" />
        </div>
        <div className="mt-4">
          <Panel title="Plan breakdown" note="Completed purchases by plan (all time)">
            {growth.plans.length === 0 ? (
              <Empty text="No completed purchases yet." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {growth.plans.map((p) => (
                  <Bar key={p.planId} label={p.planName || planLabel[p.planId] || p.planId} value={p.count} max={planTotal} right={`${p.count} · ${pct(p.count, planTotal)} · ${money(p.revenue)}`} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </Section>

      <Section title="Health & cost">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Payment gateways" note="Configured and enabled?">
            <div className="space-y-2.5">
              {health.gateways.map((g) => (
                <div key={g.name} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[#3B2F1E]">{g.name}</span>
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${g.enabled && g.hasKey ? "bg-emerald-50 text-emerald-700" : g.hasKey ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700"}`}>
                    {g.enabled && g.hasKey ? "Enabled" : g.hasKey ? "Key saved, off" : "Not configured"}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Support" note="User chats">
            <div className="flex items-center gap-2 text-[#3B2F1E]">
              <MessageCircle size={16} />
              <span className="text-[24px] font-semibold tabular-nums">{n(health.support.openChats)}</span>
              <span className="text-xs text-[#7A6A50]">chats waiting</span>
            </div>
            <p className="mt-3 text-xs text-[#7A6A50]">
              Avg first reply (7 days): <b className="text-[#3B2F1E]">{health.support.avgReplyMinutes === null ? "—" : health.support.avgReplyMinutes >= 60 ? `${Math.round(health.support.avgReplyMinutes / 6) / 10} h` : `${health.support.avgReplyMinutes} min`}</b>
            </p>
          </Panel>
          <Panel title="Security" note="SMS/OTP cost watch">
            <div className="flex items-center gap-2 text-[#3B2F1E]">
              <ShieldCheck size={16} />
              <span className="text-[24px] font-semibold tabular-nums">{n(health.security.otpToday)}</span>
              <span className="text-xs text-[#7A6A50]">OTPs sent today</span>
            </div>
            <button onClick={() => onNavigate("generations")} className="mt-3 text-xs font-semibold text-[#B91C1C] hover:underline">
              Check image generation activity →
            </button>
          </Panel>
        </div>
      </Section>

      <Section title="Last 30 days">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Sign-ups and paid" note="New accounts vs completed purchases per day">
            <TrendChart days={series} a={{ key: "signups", label: "Sign-ups", color: "#3B2F1E" }} b={{ key: "paid", label: "Paid", color: "#DC2626" }} format={n} />
          </Panel>
          <Panel title="Revenue" note="Completed payments per day (BDT)">
            <TrendChart days={series} a={{ key: "revenue", label: "Revenue", color: "#F2B93B" }} format={money} />
          </Panel>
        </div>
      </Section>
    </div>
  );
}
