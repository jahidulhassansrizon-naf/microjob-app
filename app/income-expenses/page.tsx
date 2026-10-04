"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Edit3,
  Filter,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";

type EntryType = "income" | "expense";

type Entry = {
  id: string;
  type: EntryType;
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  createdAt: string;
};

const STORAGE_BASE = "sohozkaj:income-expenses:v1";

const defaultForm = {
  type: "income" as EntryType,
  category: "Sales",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  paymentMethod: "Cash",
};

function money(value: number) {
  return `৳${Math.round(value).toLocaleString("en-BD")}`;
}

function userScopeKey() {
  if (typeof window === "undefined") return "guest";
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "guest";
    const user = JSON.parse(raw) as { id?: string; _id?: string; email?: string; phoneNumber?: string };
    return user.id || user._id || user.email || user.phoneNumber || "guest";
  } catch {
    return "guest";
  }
}

function storageKey() {
  return `${STORAGE_BASE}:${userScopeKey()}`;
}

function downloadCsv(rows: Entry[]) {
  const header = ["Date", "Type", "Category", "Amount", "Payment Method", "Description"];
  const body = rows.map((row) => [
    row.date,
    row.type,
    row.category,
    row.amount,
    row.paymentMethod,
    row.description,
  ]);
  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `income-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function IncomeExpensesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | EntryType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) setEntries(JSON.parse(raw) as Entry[]);
    } catch {
      setEntries([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(storageKey(), JSON.stringify(entries));
  }, [entries, loaded]);

  const categories = useMemo(() => {
    return Array.from(new Set(entries.map((entry) => entry.category).filter(Boolean))).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...entries]
      .filter((entry) => {
        if (typeFilter !== "all" && entry.type !== typeFilter) return false;
        if (categoryFilter !== "all" && entry.category !== categoryFilter) return false;
        if (!q) return true;
        return [entry.category, entry.description, entry.paymentMethod]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [entries, query, typeFilter, categoryFilter]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const entry of entries) {
      if (entry.type === "income") income += entry.amount;
      else expense += entry.amount;
    }
    return { income, expense, balance: income - expense };
  }, [entries]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setError("");
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setForm({
      type: entry.type,
      category: entry.category,
      amount: String(entry.amount),
      date: entry.date,
      description: entry.description,
      paymentMethod: entry.paymentMethod,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.category.trim()) return setError("Please enter a category.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Please enter a valid amount.");
    if (!form.date) return setError("Please choose a date.");

    if (editingId) {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === editingId
            ? { ...entry, ...form, category: form.category.trim(), amount }
            : entry,
        ),
      );
    } else {
      const newEntry: Entry = {
        id: crypto.randomUUID(),
        type: form.type,
        category: form.category.trim(),
        amount,
        date: form.date,
        description: form.description.trim(),
        paymentMethod: form.paymentMethod,
        createdAt: new Date().toISOString(),
      };
      setEntries((current) => [newEntry, ...current]);
    }
    setShowForm(false);
    resetForm();
  };

  const deleteEntry = (id: string) => {
    if (!window.confirm("Delete this income/expense entry?")) return;
    setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A]">
      <DashboardNavbar />

      <main className="mx-auto max-w-[1220px] px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/dashboard" className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600">
              <ArrowLeft size={14} /> Back to dashboard
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                <Wallet size={20} />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Income &amp; Expenses</h1>
                <p className="mt-1 text-sm font-medium text-slate-500">Track money coming in, going out, and your current balance.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => downloadCsv(filteredEntries)} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">
              <Download size={15} /> Export CSV
            </button>
            <button type="button" onClick={openCreate} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
              <Plus size={15} /> Add entry
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total income" value={money(totals.income)} tone="emerald" icon={<ArrowDownLeft size={18} />} />
          <SummaryCard label="Total expenses" value={money(totals.expense)} tone="rose" icon={<ArrowUpRight size={18} />} />
          <SummaryCard label="Current balance" value={money(totals.balance)} tone={totals.balance >= 0 ? "blue" : "rose"} icon={<Wallet size={18} />} />
          <SummaryCard label="Total entries" value={String(entries.length)} tone="slate" icon={<Filter size={18} />} />
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search category, note or payment method..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white" />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "all" | EntryType)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500">
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500">
                <option value="all">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-600">{entry.date}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${entry.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{entry.type}</span></td>
                    <td className="px-5 py-3 text-sm font-bold text-slate-800">{entry.category}</td>
                    <td className="max-w-[300px] px-5 py-3 text-sm text-slate-500">{entry.description || "—"}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-500">{entry.paymentMethod}</td>
                    <td className={`whitespace-nowrap px-5 py-3 text-right text-sm font-black ${entry.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>{entry.type === "income" ? "+" : "-"}{money(entry.amount)}</td>
                    <td className="px-5 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={() => openEdit(entry)} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600" aria-label="Edit"><Edit3 size={15} /></button><button type="button" onClick={() => deleteEntry(entry.id)} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Trash2 size={15} /></button></div></td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && <tr><td colSpan={7} className="px-5 py-14 text-center"><p className="text-sm font-bold text-slate-700">No entries found</p><p className="mt-1 text-xs text-slate-500">Add your first income or expense entry to start tracking.</p></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-lg font-black">{editingId ? "Edit entry" : "Add entry"}</h2><p className="mt-0.5 text-xs text-slate-500">Record money in or money out.</p></div><button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={17} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EntryType })} className="input"><option value="income">Income</option><option value="expense">Expense</option></select></Field>
                <Field label="Amount (৳)"><input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" className="input" /></Field>
                <Field label="Category"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Sales, Rent, Salary..." className="input" /></Field>
                <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" /></Field>
              </div>
              <Field label="Payment method"><select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="input"><option>Cash</option><option>Bank</option><option>bKash</option><option>Nagad</option><option>Card</option><option>Other</option></select></Field>
              <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional note" className="input resize-none" /></Field>
              <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" className="cursor-pointer rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">{editingId ? "Save changes" : "Add entry"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-slate-700"><span className="mb-1.5 block">{label}</span>{children}</label>;
}

function SummaryCard({ label, value, tone, icon }: { label: string; value: string; tone: "emerald" | "rose" | "blue" | "slate"; icon: React.ReactNode }) {
  const styles = { emerald: "bg-emerald-50 text-emerald-700", rose: "bg-rose-50 text-rose-700", blue: "bg-blue-50 text-blue-700", slate: "bg-slate-100 text-slate-700" }[tone];
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${styles}`}>{icon}</div><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{value}</p></div>;
}
