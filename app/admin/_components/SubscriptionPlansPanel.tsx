"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, BadgePercent, Check, CircleDollarSign, Clock3, Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";
import type { SubscriptionDurationUnit, SubscriptionPlan } from "@/app/_lib/subscriptionPlans";

type Draft = {
  name: string;
  durationValue: string;
  durationUnit: SubscriptionDurationUnit;
  price: string;
  regularPrice: string;
  badge: string;
  note: string;
};

const EMPTY_DRAFT: Draft = {
  name: "", durationValue: "1", durationUnit: "month", price: "99",
  regularPrice: "350", badge: "", note: "Full access to all paid tools",
};
const PANEL = "rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_10px_28px_-20px_rgba(59,47,30,0.45)]";
const INPUT = "mt-1.5 h-10 w-full rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] px-3 text-sm text-[#3B2F1E] outline-none transition placeholder:text-[#A8987A] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#7A6A50]";
const formatMoney = (value: number) => `৳${Number(value || 0).toLocaleString("en-BD")}`;

function makeId(name: string, plans: SubscriptionPlan[]) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "custom-plan";
  const used = new Set(plans.map((plan) => plan.id));
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function getDays(value: number, unit: SubscriptionDurationUnit) {
  return unit === "year" ? value * 365 : unit === "month" ? value * 30 : value;
}

function toDraft(plan: SubscriptionPlan): Draft {
  return {
    name: plan.name,
    durationValue: String(plan.durationValue),
    durationUnit: plan.durationUnit,
    price: String(plan.price),
    regularPrice: String(plan.regularPrice),
    badge: plan.badge,
    note: plan.note,
  };
}

export default function SubscriptionPlansPanel() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/subscription-plans", {
        credentials: "include", cache: "no-store", headers: getClientAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success !== true) throw new Error(data?.message || "Subscription plans could not be loaded.");
      setPlans(Array.isArray(data.plans) ? data.plans : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscription plans could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPlans(); }, [loadPlans]);

  const activeCount = useMemo(() => plans.filter((plan) => plan.active).length, [plans]);
  const previewPrice = Number(draft.price);
  const previewRegularPrice = Number(draft.regularPrice);
  const previewDiscount = Number.isInteger(previewPrice) && previewPrice >= 1 && Number.isInteger(previewRegularPrice) && previewRegularPrice >= previewPrice && previewRegularPrice >= 1
    ? Math.round((1 - previewPrice / previewRegularPrice) * 100)
    : null;

  const persistPlans = useCallback(async (nextPlans: SubscriptionPlan[], successText = "Subscription plans saved successfully.") => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/subscription-plans", {
        method: "PUT", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ plans: nextPlans }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success !== true) throw new Error(data?.message || "Changes could not be saved.");
      setPlans(Array.isArray(data.plans) ? data.plans : nextPlans);
      setNotice(successText);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Changes could not be saved.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const clearEditor = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
  };

  const submitDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const name = draft.name.trim();
    const durationValue = Number(draft.durationValue);
    const price = Number(draft.price);
    const regularPrice = Number(draft.regularPrice);
    if (name.length < 2 || name.length > 50) return setError("Plan name must be between 2 and 50 characters.");
    if (!Number.isInteger(durationValue) || durationValue < 1) return setError("Enter a valid whole-number duration.");
    if (!Number.isInteger(price) || price < 1) return setError("Selling price must be at least ৳1.");
    if (!Number.isInteger(regularPrice) || regularPrice < price) return setError("Regular price must be equal to or higher than the selling price.");
    const days = getDays(durationValue, draft.durationUnit);
    if (days < 1 || days > 36500) return setError("Plan duration must not exceed 100 years.");

    const existingIndex = editingId ? plans.findIndex((plan) => plan.id === editingId) : -1;
    const original = existingIndex >= 0 ? plans[existingIndex] : null;
    const nextPlan: SubscriptionPlan = {
      id: editingId || makeId(name, plans),
      name,
      duration: `${durationValue} ${draft.durationUnit === "year" ? "Year" : draft.durationUnit === "month" ? "Month" : "Day"}${durationValue === 1 ? "" : "s"}`,
      durationValue,
      durationUnit: draft.durationUnit,
      months: draft.durationUnit === "year" ? durationValue * 12 : draft.durationUnit === "month" ? durationValue : Math.max(1, Math.round(days / 30)),
      days,
      price,
      regularPrice,
      note: draft.note.trim().slice(0, 120) || `Full access to all paid tools for ${durationValue} ${draft.durationUnit}${durationValue > 1 ? "s" : ""}`,
      badge: draft.badge.trim().slice(0, 40),
      active: original?.active ?? true,
      sortOrder: original?.sortOrder ?? plans.length,
    };
    const next = existingIndex >= 0
      ? plans.map((plan, index) => index === existingIndex ? nextPlan : plan)
      : [...plans, nextPlan];
    const saved = await persistPlans(next, editingId ? "Plan updated successfully." : "New subscription plan added successfully.");
    if (saved) clearEditor();
  };

  const editPlan = (plan: SubscriptionPlan) => {
    setDraft(toDraft(plan));
    setEditingId(plan.id);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePlan = async (plan: SubscriptionPlan) => {
    if (plan.active && activeCount <= 1) return setError("At least one plan must remain active.");
    const next = plans.map((item) => item.id === plan.id ? { ...item, active: !item.active } : item);
    await persistPlans(next, `${plan.name} ${plan.active ? "paused" : "activated"}.`);
  };

  const removePlan = async (plan: SubscriptionPlan) => {
    if (!window.confirm(`Remove “${plan.name}” from the subscription page? Existing payment records will remain unchanged.`)) return;
    if (plan.active && activeCount <= 1) return setError("Keep at least one active plan on the subscription page.");
    const next = plans.filter((item) => item.id !== plan.id).map((item, index) => ({ ...item, sortOrder: index }));
    if (editingId === plan.id) clearEditor();
    await persistPlans(next, "Subscription plan removed. Existing subscription records were preserved.");
  };

  const movePlan = async (plan: SubscriptionPlan, delta: -1 | 1) => {
    const ordered = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((item) => item.id === plan.id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await persistPlans(ordered.map((item, sortOrder) => ({ ...item, sortOrder })), "Plan order updated.");
  };

  return (
    <div className="space-y-6">
      <section className={`${PANEL} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3D6B8] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-[#3B2F1E]">Subscription plan controls</h2>
            <p className="mt-1 text-sm text-[#7A6A50]">Manage the plans, prices, durations and offers shown on the customer subscription page.</p>
          </div>
          <div className="rounded-full border border-[#C7EBD8] bg-[#ECFDF3] px-3 py-1.5 text-xs font-semibold text-[#087443]">{activeCount} active plan{activeCount === 1 ? "" : "s"}</div>
        </div>

        <form onSubmit={submitDraft} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEE9E9] text-[#DC2626]">{editingId ? <Edit3 size={16} /> : <Plus size={17} />}</span>
            <div>
              <h3 className="text-sm font-bold text-[#3B2F1E]">{editingId ? "Edit subscription plan" : "Create a new plan"}</h3>
              <p className="text-xs text-[#8A7A5F]">Selling price and regular price drive the automatic discount calculation.</p>
            </div>
          </div>

          <label className={LABEL}>Plan name
            <input className={INPUT} required maxLength={50} value={draft.name} onChange={(e) => setDraft((v) => ({ ...v, name: e.target.value }))} placeholder="Example: 3 Months" />
          </label>
          <div>
            <label className={LABEL} htmlFor="subscription-duration-value">Duration</label>
            <div className="mt-1.5 flex gap-2">
              <input id="subscription-duration-value" className={`${INPUT} mt-0 min-w-0 flex-1`} type="number" min="1" max={draft.durationUnit === "year" ? 100 : draft.durationUnit === "month" ? 1216 : 36500} step="1" required value={draft.durationValue} onChange={(e) => setDraft((v) => ({ ...v, durationValue: e.target.value }))} />
              <select className="h-10 rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] px-3 text-sm text-[#3B2F1E] outline-none focus:border-[#DC2626]" value={draft.durationUnit} onChange={(e) => setDraft((v) => ({ ...v, durationUnit: e.target.value as SubscriptionDurationUnit }))}>
                <option value="day">Days</option><option value="month">Months</option><option value="year">Years</option>
              </select>
            </div>
          </div>
          <label className={LABEL}>Selling price (৳)
            <input className={INPUT} type="number" min="1" max="10000000" step="1" required value={draft.price} onChange={(e) => setDraft((v) => ({ ...v, price: e.target.value }))} />
          </label>
          <label className={LABEL}>Regular price (৳)
            <input className={INPUT} type="number" min="1" max="10000000" step="1" required value={draft.regularPrice} onChange={(e) => setDraft((v) => ({ ...v, regularPrice: e.target.value }))} />
            {previewDiscount !== null && previewDiscount > 0 ? <span className="mt-1 block text-[11px] font-semibold text-emerald-700">Preview: {previewDiscount}% discount · Save {formatMoney(previewRegularPrice - previewPrice)}</span> : previewDiscount === 0 ? <span className="mt-1 block text-[11px] text-[#8A7A5F]">No discount will be displayed when both prices are equal.</span> : <span className="mt-1 block text-[11px] text-rose-700">Regular price must be equal to or higher than the selling price.</span>}
          </label>
          <label className={LABEL}>Offer badge (optional)
            <input className={INPUT} maxLength={40} value={draft.badge} onChange={(e) => setDraft((v) => ({ ...v, badge: e.target.value }))} placeholder="Most popular" />
          </label>
          <label className={`${LABEL} sm:col-span-2`}>Plan description
            <input className={INPUT} maxLength={120} value={draft.note} onChange={(e) => setDraft((v) => ({ ...v, note: e.target.value }))} placeholder="Full access to all paid tools" />
          </label>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 xl:col-span-4">
            <button type="submit" disabled={saving || loading} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#DC2626] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"><Save size={15} />{saving ? "Saving…" : editingId ? "Save plan changes" : "Add subscription plan"}</button>
            {editingId && <button type="button" disabled={saving} onClick={clearEditor} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D8C9A6] bg-white px-4 text-sm font-semibold text-[#5A4A32] hover:bg-[#F6EEDB]"><X size={15} />Cancel edit</button>}
            <span className="text-xs text-[#8A7A5F]">Duration is saved as an exact number of days for payment activation.</span>
          </div>
        </form>
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}

      <section className={`${PANEL} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3D6B8] px-5 py-4 sm:px-6">
          <div><h2 className="text-base font-bold text-[#3B2F1E]">Plans displayed to customers</h2><p className="mt-1 text-xs text-[#8A7A5F]">Use the arrows to change display order. Inactive plans are hidden from checkout.</p></div>
          <button type="button" onClick={() => void loadPlans()} disabled={loading || saving} className="rounded-lg border border-[#D8C9A6] bg-white px-3 py-2 text-xs font-semibold text-[#5A4A32] hover:bg-[#F6EEDB] disabled:opacity-50">Refresh list</button>
        </div>
        {loading ? <div className="p-8 text-center text-sm text-[#8A7A5F]">Loading subscription plans…</div> : !plans.length ? <div className="p-8 text-center text-sm text-[#8A7A5F]">No subscription plans have been configured.</div> : (
          <div className="divide-y divide-[#E8DFCC]">
            {[...plans].sort((a, b) => a.sortOrder - b.sortOrder).map((plan, index) => {
              const discount = plan.regularPrice > plan.price ? Math.round((1 - plan.price / plan.regularPrice) * 100) : 0;
              return (
                <article key={plan.id} className={`flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6 ${!plan.active ? "bg-[#F6EEDB]/60 opacity-75" : ""}`}>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2E8D2] text-[#8A5A00]"><Clock3 size={17} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#3B2F1E]">{plan.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${plan.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{plan.active ? "ACTIVE" : "PAUSED"}</span>{plan.badge && <span className="rounded-full bg-[#FEE9E9] px-2 py-0.5 text-[10px] font-bold text-[#B91C1C]">{plan.badge}</span>}</div>
                      <p className="mt-1 text-xs text-[#7A6A50]">{plan.duration} · {plan.days.toLocaleString("en-BD")} days · ID: <code>{plan.id}</code></p>
                      <p className="mt-1 truncate text-xs text-[#8A7A5F]">{plan.note}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
                    <div className="min-w-[128px]"><div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-[#8A7A5F]"><CircleDollarSign size={12} /> Selling price</div><p className="text-xl font-extrabold text-[#DC2626]">{formatMoney(plan.price)}</p><p className="text-[11px] text-[#8A7A5F]">Regular {formatMoney(plan.regularPrice)}{discount ? ` · ${discount}% OFF` : ""}</p></div>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label={`Move ${plan.name} up`} title="Move up" disabled={saving || index === 0} onClick={() => void movePlan(plan, -1)} className="rounded-lg border border-[#D8C9A6] bg-white p-2 text-[#5A4A32] hover:bg-[#F6EEDB] disabled:opacity-30"><ArrowUp size={15} /></button>
                      <button type="button" aria-label={`Move ${plan.name} down`} title="Move down" disabled={saving || index === plans.length - 1} onClick={() => void movePlan(plan, 1)} className="rounded-lg border border-[#D8C9A6] bg-white p-2 text-[#5A4A32] hover:bg-[#F6EEDB] disabled:opacity-30"><ArrowDown size={15} /></button>
                      <button type="button" disabled={saving} onClick={() => editPlan(plan)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8C9A6] bg-white px-3 py-2 text-xs font-semibold text-[#5A4A32] hover:bg-[#F6EEDB]"><Edit3 size={13} />Edit</button>
                      <button type="button" disabled={saving || (plan.active && activeCount <= 1)} onClick={() => void togglePlan(plan)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${plan.active ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}><Check size={13} />{plan.active ? "Pause" : "Activate"}</button>
                      <button type="button" disabled={saving || (plan.active && activeCount <= 1)} onClick={() => void removePlan(plan)} title="Remove plan" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100 disabled:opacity-30"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-[#806F53]"><BadgePercent size={15} className="mt-0.5 shrink-0" />Discount is calculated automatically as (regular price − selling price) ÷ regular price. Existing payment records keep their original amount and plan duration even after edits or removal.</p>
    </div>
  );
}
