"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Save, Users } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

const PANEL = "rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_10px_28px_-20px_rgba(59,47,30,0.45)]";
const INPUT = "mt-1.5 h-11 w-full rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] px-3 text-base font-semibold text-[#3B2F1E] outline-none transition placeholder:text-[#A8987A] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#7A6A50]";

export default function SubscriptionActivityPanel() {
  const [value, setValue] = useState("850");
  const [savedValue, setSavedValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/subscription-activity", {
        credentials: "include", cache: "no-store", headers: getClientAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success !== true) throw new Error(data?.message || "Settings could not be loaded.");
      setValue(String(data.totalBuyers));
      setSavedValue(Number(data.totalBuyers));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const total = Number(value);
    if (!Number.isInteger(total) || total < 100) return setError("Total buyers must be a whole number of at least 100.");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/subscription-activity", {
        method: "PUT", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ totalBuyers: total }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success !== true) throw new Error(data?.message || "Changes could not be saved.");
      setValue(String(data.totalBuyers));
      setSavedValue(Number(data.totalBuyers));
      setNotice("Saved. The subscription page now shows the new total.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Changes could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`${PANEL} max-w-2xl p-5 sm:p-6`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DC2626] text-white shadow-sm">
          <Users size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-[#2B2116]">Subscription activity</h2>
          <p className="text-sm text-[#6B5A40]">Controls the &quot;Total buyers&quot; number on the /subscription page.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5">
        <label className={LABEL} htmlFor="total-buyers">Total buyers</label>
        <input
          id="total-buyers"
          type="number"
          inputMode="numeric"
          min={100}
          step={1}
          value={value}
          disabled={loading || saving}
          onChange={(event) => setValue(event.target.value)}
          className={INPUT}
          placeholder="850"
        />
        <p className="mt-2 text-sm text-[#6B5A40]">
          Currently live: <strong className="text-[#DC2626]">{savedValue === null ? "–" : `${savedValue.toLocaleString("en-US")}+`}</strong>.
          The &quot;bought today / 1 hour ago / 2 months ago&quot; numbers on the page are shared out of this total automatically,
          so you only change this one number.
        </p>

        {error && <p className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm font-semibold text-[#B91C1C]">{error}</p>}
        {notice && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{notice}</p>}

        <button
          type="submit"
          disabled={loading || saving}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-[#DC2626] px-5 text-sm font-bold text-white transition hover:bg-[#B91C1C] disabled:opacity-60"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </section>
  );
}
