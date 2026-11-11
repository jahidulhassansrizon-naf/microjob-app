"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowDownToLine, Plus, Trash2, X } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

const CARD = "rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_10px_28px_-20px_rgba(59,47,30,0.45)]";
const INPUT = "mt-1.5 h-11 w-full rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] px-3 text-sm text-[#3B2F1E] outline-none transition placeholder:text-[#A8987A] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#7A6A50]";

type Row = {
  id: string;
  amount: number;
  note: string;
  method: string;
  accountNumber: string;
  accountName: string;
  transactionId: string;
  withdrawnAt: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(value || 0));
}
function dateLabel(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-BD", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric" }).format(d);
}
function todayInput() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function WithdrawalCard({ onChanged }: { onChanged?: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [available, setAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayInput());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/withdrawals", { credentials: "include", cache: "no-store", headers: getClientAuthHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success !== true) throw new Error(data?.message || "Could not load withdrawals.");
      setRows(data.withdrawals || []);
      setTotalWithdrawn(Number(data.totalWithdrawn || 0));
      setAvailable(Number(data.availableRevenue || 0));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load withdrawals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setFormError("");
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 1) { setFormError("Enter a valid amount."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ amount: value, method, accountNumber, accountName, transactionId, note, withdrawnAt: date ? `${date}T12:00:00+06:00` : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success !== true) throw new Error(data?.message || "Could not save the withdrawal.");
      setOpen(false);
      setAmount(""); setMethod(""); setAccountNumber(""); setAccountName(""); setTransactionId(""); setNote(""); setDate(todayInput());
      await load();
      onChanged?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the withdrawal.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (deletingId) return;
    if (!window.confirm(`Remove this ${money(row.amount)} withdrawal? It will be added back to revenue.`)) return;
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/withdrawals?id=${encodeURIComponent(row.id)}`, {
        method: "DELETE", credentials: "include", headers: getClientAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success !== true) throw new Error(data?.message || "Could not remove the withdrawal.");
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the withdrawal.");
    } finally {
      setDeletingId("");
    }
  };

  const visible = showAll ? rows : rows.slice(0, 5);

  return (
    <section aria-label="Withdrawals">
      <article className={`${CARD} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEE9E9] text-[#B91C1C]">
              <ArrowDownToLine size={21} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[13px] font-medium text-[#7A6A50]">Total withdrawn</p>
              <p className="mt-1.5 text-[30px] font-bold leading-none tracking-tight text-[#3B2F1E] tabular-nums">
                {loading ? "—" : money(totalWithdrawn)}
              </p>
              <p className="mt-2 text-xs text-[#7A6A50]">
                Available revenue: <span className="font-semibold text-[#3B2F1E]">{loading ? "—" : money(available)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setFormError(""); setOpen(true); }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40"
          >
            <Plus size={16} /> Add withdrawal
          </button>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-[#FEE9E9] px-3 py-2 text-sm text-[#B91C1C]">{error}</p>}

        <div className="mt-5 border-t border-[#EFE5CE] pt-4">
          {loading ? (
            <p className="text-sm text-[#7A6A50]">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-[#7A6A50]">No withdrawals yet. Use “Add withdrawal” to record one.</p>
          ) : (
            <>
              <ul className="divide-y divide-[#EFE5CE]">
                {visible.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#3B2F1E]">
                        {money(row.amount)}
                        {row.method && <span className="ml-2 rounded-md bg-[#F2E8D2] px-1.5 py-0.5 text-[11px] font-semibold text-[#5A4A32]">{row.method}</span>}
                      </p>
                      {(row.accountName || row.accountNumber) && (
                        <p className="mt-1 text-xs text-[#5A4A32]">
                          <span className="text-[#7A6A50]">Sent to:</span>{" "}
                          <span className="font-semibold">{[row.accountName, row.accountNumber].filter(Boolean).join(" · ")}</span>
                        </p>
                      )}
                      {row.transactionId && (
                        <p className="mt-0.5 text-xs text-[#5A4A32]">
                          <span className="text-[#7A6A50]">TrxID:</span>{" "}
                          <span className="font-mono font-semibold">{row.transactionId}</span>
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-[#7A6A50]">
                        {dateLabel(row.withdrawnAt)}{row.note ? ` · ${row.note}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove withdrawal"
                      disabled={deletingId === row.id}
                      onClick={() => void remove(row)}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#B91C1C] transition hover:bg-[#FEE9E9] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              {rows.length > 5 && (
                <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 cursor-pointer text-xs font-semibold text-[#B91C1C] hover:underline">
                  {showAll ? "Show less" : `Show all (${rows.length})`}
                </button>
              )}
            </>
          )}
        </div>
      </article>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button aria-label="Close" onClick={() => !saving && setOpen(false)} className="absolute inset-0 cursor-pointer bg-[#2A2118]/55 backdrop-blur-[2px]" />
          <form onSubmit={submit} className={`${CARD} relative max-h-[92vh] w-full max-w-md overflow-y-auto p-6`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-semibold text-[#3B2F1E]">Add withdrawal</h3>
                <p className="mt-1 text-sm text-[#7A6A50]">The amount is deducted from total revenue.</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => !saving && setOpen(false)} className="cursor-pointer rounded-lg p-1.5 text-[#7A6A50] hover:bg-[#EFE5CE]">
                <X size={18} />
              </button>
            </div>

            <label className="mt-5 block">
              <span className={LABEL}>Amount (BDT)</span>
              <input autoFocus type="number" inputMode="numeric" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" className={INPUT} />
            </label>
            <label className="mt-4 block">
              <span className={LABEL}>Method (optional)</span>
              <input list="withdrawal-methods" value={method} maxLength={80} onChange={(e) => setMethod(e.target.value)} placeholder="bKash / Nagad / Bank" className={INPUT} />
              <datalist id="withdrawal-methods">
                <option value="bKash" /><option value="Nagad" /><option value="Rocket" /><option value="Bank transfer" /><option value="Cash" />
              </datalist>
            </label>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>Sent to number (optional)</span>
                <input value={accountNumber} maxLength={60} onChange={(e) => setAccountNumber(e.target.value)} placeholder="01XXXXXXXXX / A/C no." className={INPUT} />
              </label>
              <label className="block">
                <span className={LABEL}>Account name (optional)</span>
                <input value={accountName} maxLength={100} onChange={(e) => setAccountName(e.target.value)} placeholder="Who received it" className={INPUT} />
              </label>
            </div>
            <label className="mt-4 block">
              <span className={LABEL}>Transaction ID (optional)</span>
              <input value={transactionId} maxLength={80} onChange={(e) => setTransactionId(e.target.value)} placeholder="TrxID / reference" className={INPUT} />
            </label>
            <label className="mt-4 block">
              <span className={LABEL}>Date</span>
              <input type="date" value={date} max={todayInput()} onChange={(e) => setDate(e.target.value)} className={INPUT} />
            </label>
            <label className="mt-4 block">
              <span className={LABEL}>Note (optional)</span>
              <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Why / where it went" className={INPUT} />
            </label>

            {formError && <p role="alert" className="mt-4 rounded-lg bg-[#FEE9E9] px-3 py-2 text-sm text-[#B91C1C]">{formError}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={saving} onClick={() => setOpen(false)} className="cursor-pointer rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] px-4 py-2.5 text-sm font-semibold text-[#5A4A32] hover:border-[#3B2F1E] disabled:cursor-not-allowed">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-[#DC2626] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Saving…" : "Add withdrawal"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
