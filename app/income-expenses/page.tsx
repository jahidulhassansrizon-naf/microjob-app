"use client";
import { T } from "@/components/i18n/I18nProvider";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState, } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDownLeft, ArrowLeft, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Download, Edit3, Filter, Info, Plus, RotateCcw, Search, Trash2, Wallet, X, } from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */
type EntryType = "income" | "expense";
type PeriodKey = "all" | "thisMonth" | "lastMonth" | "thisYear" | "custom";
type SortKey = "newest" | "oldest" | "highest" | "lowest";
type Entry = {
    id: string;
    type: EntryType;
    category: string;
    amount: number;
    date: string; // YYYY-MM-DD (লোকাল তারিখ)
    description: string;
    paymentMethod: string;
    createdAt: string;
};
type FormState = {
    type: EntryType;
    category: string;
    amount: string;
    date: string;
    description: string;
    paymentMethod: string;
};
type FormErrors = Partial<Record<"category" | "amount" | "date", string>>;
type Toast = {
    id: number;
    message: string;
    tone: "success" | "error" | "info";
    action?: {
        label: string;
        onClick: () => void;
    };
};
const STORAGE_BASE = "sohozkaj:income-expenses:v1";
const PAGE_SIZE = 15;
const MAX_AMOUNT = 999999999.99;
const MAX_CATEGORY_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 200;
const PAYMENT_METHODS = ["Cash", "Bank", "bKash", "Nagad", "Card", "Other"];
const DEFAULT_CATEGORY: Record<EntryType, string> = {
    income: "Sales",
    expense: "Rent",
};
const SUGGESTED_CATEGORIES: Record<EntryType, string[]> = {
    income: ["Sales", "Service", "Salary", "Commission", "Interest", "Other"],
    expense: [
        "Rent",
        "Salary",
        "Utilities",
        "Transport",
        "Food",
        "Purchase",
        "Marketing",
        "Other",
    ],
};
const PERIOD_OPTIONS: {
    value: PeriodKey;
    label: string;
}[] = [
    { value: "all", label: "All time" },
    { value: "thisMonth", label: "This month" },
    { value: "lastMonth", label: "Last month" },
    { value: "thisYear", label: "This year" },
    { value: "custom", label: "Custom range" },
];
const SORT_OPTIONS: {
    value: SortKey;
    label: string;
}[] = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "highest", label: "Highest amount" },
    { value: "lowest", label: "Lowest amount" },
];
const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];
const inputCls = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10";
const inputErrCls = "!border-rose-300 hover:!border-rose-400 focus:!border-rose-500 focus:!ring-rose-500/10";
const filterFieldCls = "h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-[13px] font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10";
/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const nfInt = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });
const nfDec = new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function money(value: number): string {
    const v = round2(value);
    const abs = Math.abs(v);
    const text = Number.isInteger(abs) ? nfInt.format(abs) : nfDec.format(abs);
    return `${v < 0 ? "-" : ""}৳${text}`;
}
const pad2 = (n: number) => String(n).padStart(2, "0");
// লোকাল তারিখ (UTC নয়), তাই বাংলাদেশে ভোরে গেলেও আগের দিন দেখাবে না
function toDateStr(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function todayStr(): string {
    return toDateStr(new Date());
}
function isValidDateStr(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return false;
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return (date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d);
}
function formatDate(value: string): string {
    if (!isValidDateStr(value))
        return value;
    const [y, m, d] = value.split("-").map(Number);
    return `${pad2(d)} ${MONTHS[m - 1]} ${y}`;
}
function toEnglishDigits(value: string): string {
    return value.replace(/[০-৯]/g, (ch) => String("০১২৩৪৫৬৭৮৯".indexOf(ch)));
}
// টাইপ করার সময়: শুধু সংখ্যা ও একটা দশমিক, দশমিকের পর সর্বোচ্চ ২ ঘর
function sanitizeAmountInput(raw: string): string {
    let s = toEnglishDigits(raw).replace(/[^\d.]/g, "");
    const dot = s.indexOf(".");
    if (dot !== -1) {
        s =
            s.slice(0, dot + 1) +
                s
                    .slice(dot + 1)
                    .replace(/\./g, "")
                    .slice(0, 2);
    }
    s = s.replace(/^0+(?=\d)/, "");
    return s.slice(0, 13);
}
function parseAmount(raw: string): number | null {
    const s = sanitizeAmountInput(raw);
    if (s === "" || s === ".")
        return null;
    const n = Number(s);
    return Number.isFinite(n) ? round2(n) : null;
}
function makeId(): string {
    if (typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function userScopeKey(): string {
    try {
        const raw = localStorage.getItem("user");
        if (!raw)
            return "guest";
        const user = JSON.parse(raw) as {
            id?: string;
            _id?: string;
            email?: string;
            phoneNumber?: string;
        };
        return user.id || user._id || user.email || user.phoneNumber || "guest";
    }
    catch {
        return "guest";
    }
}
function storageKey(): string {
    return `${STORAGE_BASE}:${userScopeKey()}`;
}
// সেভ করা ডাটা নষ্ট বা ভুল ফরম্যাটের হলেও যেন পেজ না ভাঙে
function sanitizeEntries(raw: unknown): Entry[] {
    if (!Array.isArray(raw))
        return [];
    const out: Entry[] = [];
    const seen = new Set<string>();
    const text = (v: unknown) => (typeof v === "string" ? v : "");
    for (const item of raw) {
        if (!item || typeof item !== "object")
            continue;
        const r = item as Record<string, unknown>;
        const type: EntryType | null = r.type === "income" || r.type === "expense" ? r.type : null;
        const amount = typeof r.amount === "number" ? r.amount : Number(r.amount);
        const date = text(r.date);
        if (!type ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            !isValidDateStr(date)) {
            continue;
        }
        let id = text(r.id) || makeId();
        if (seen.has(id))
            id = makeId();
        seen.add(id);
        out.push({
            id,
            type,
            category: text(r.category).trim() || "Uncategorized",
            amount: round2(amount),
            date,
            description: text(r.description),
            paymentMethod: text(r.paymentMethod) || "Cash",
            createdAt: text(r.createdAt) || new Date().toISOString(),
        });
    }
    return out;
}
function emptyForm(type: EntryType = "income"): FormState {
    return {
        type,
        category: DEFAULT_CATEGORY[type],
        amount: "",
        date: todayStr(),
        description: "",
        paymentMethod: "Cash",
    };
}
function periodRange(period: PeriodKey, from: string, to: string): {
    start: string | null;
    end: string | null;
} {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    switch (period) {
        case "thisMonth":
            return {
                start: toDateStr(new Date(y, m, 1)),
                end: toDateStr(new Date(y, m + 1, 0)),
            };
        case "lastMonth":
            return {
                start: toDateStr(new Date(y, m - 1, 1)),
                end: toDateStr(new Date(y, m, 0)),
            };
        case "thisYear":
            return { start: `${y}-01-01`, end: `${y}-12-31` };
        case "custom":
            return { start: from || null, end: to || null };
        default:
            return { start: null, end: null };
    }
}
// CSV: ফর্মুলা ইনজেকশন আটকানো + Excel-এ বাংলা ঠিক রাখতে BOM
function csvCell(value: string | number): string {
    let s = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(s))
        s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
}
function downloadCsv(rows: Entry[]) {
    const header = [
        "Date",
        "Type",
        "Category",
        "Amount",
        "Payment Method",
        "Description",
    ];
    const body = rows.map((row) => [
        row.date,
        row.type,
        row.category,
        row.amount,
        row.paymentMethod,
        row.description,
    ]);
    const csv = "\uFEFF" +
        [header, ...body].map((line) => line.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `income-expenses-${todayStr()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function IncomeExpensesPage() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [storageFailed, setStorageFailed] = useState(false);
    const keyRef = useRef("");
    const lastRawRef = useRef<string | null>(null);
    // ফিল্টার
    const [query, setQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | EntryType>("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [period, setPeriod] = useState<PeriodKey>("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [sort, setSort] = useState<SortKey>("newest");
    const [page, setPage] = useState(1);
    // ফর্ম
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<FormState>(() => emptyForm());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    // ডিলিট নিশ্চিতকরণ ও টোস্ট
    const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    /* ---------- সেভ/লোড ---------- */
    useEffect(() => {
        const key = storageKey();
        keyRef.current = key;
        try {
            const raw = localStorage.getItem(key);
            lastRawRef.current = raw;
            if (raw)
                setEntries(sanitizeEntries(JSON.parse(raw)));
        }
        catch {
            setEntries([]);
        }
        setLoaded(true);
        // অন্য ট্যাবে বদল হলে এখানেও আপডেট
        const onStorage = (e: StorageEvent) => {
            if (e.key !== key)
                return;
            try {
                lastRawRef.current = e.newValue;
                setEntries(e.newValue ? sanitizeEntries(JSON.parse(e.newValue)) : []);
            }
            catch {
                /* ignore */
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);
    useEffect(() => {
        if (!loaded)
            return;
        const raw = JSON.stringify(entries);
        if (raw === lastRawRef.current)
            return;
        try {
            localStorage.setItem(keyRef.current, raw);
            lastRawRef.current = raw;
            setStorageFailed(false);
        }
        catch {
            setStorageFailed(true);
        }
    }, [entries, loaded]);
    useEffect(() => {
        return () => {
            if (toastTimer.current)
                clearTimeout(toastTimer.current);
        };
    }, []);
    const showToast = useCallback((message: string, tone: Toast["tone"] = "success", action?: Toast["action"]) => {
        if (toastTimer.current)
            clearTimeout(toastTimer.current);
        const id = Date.now();
        setToast({ id, message, tone, action });
        toastTimer.current = setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), action ? 6000 : 3500);
    }, []);
    /* ---------- হিসাব ---------- */
    const categories = useMemo(() => Array.from(new Set(entries.map((e) => e.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [entries]);
    const paymentMethods = useMemo(() => Array.from(new Set([...PAYMENT_METHODS, ...entries.map((e) => e.paymentMethod)])).filter((m) => entries.some((e) => e.paymentMethod === m)), [entries]);
    // যে ক্যাটাগরি/পেমেন্ট আর নেই, তার ফিল্টার আটকে থাকলে রিসেট
    useEffect(() => {
        if (categoryFilter !== "all" && !categories.includes(categoryFilter)) {
            setCategoryFilter("all");
        }
    }, [categories, categoryFilter]);
    useEffect(() => {
        if (paymentFilter !== "all" && !paymentMethods.includes(paymentFilter)) {
            setPaymentFilter("all");
        }
    }, [paymentMethods, paymentFilter]);
    const range = useMemo(() => periodRange(period, fromDate, toDate), [period, fromDate, toDate]);
    const filteredEntries = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = entries.filter((entry) => {
            if (typeFilter !== "all" && entry.type !== typeFilter)
                return false;
            if (categoryFilter !== "all" && entry.category !== categoryFilter)
                return false;
            if (paymentFilter !== "all" && entry.paymentMethod !== paymentFilter)
                return false;
            if (range.start && entry.date < range.start)
                return false;
            if (range.end && entry.date > range.end)
                return false;
            if (!q)
                return true;
            return [
                entry.category,
                entry.description,
                entry.paymentMethod,
                String(entry.amount),
            ]
                .join(" ")
                .toLowerCase()
                .includes(q);
        });
        const byDate = (a: Entry, b: Entry) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
        list.sort((a, b) => {
            switch (sort) {
                case "oldest":
                    return -byDate(a, b);
                case "highest":
                    return b.amount - a.amount || byDate(a, b);
                case "lowest":
                    return a.amount - b.amount || byDate(a, b);
                default:
                    return byDate(a, b);
            }
        });
        return list;
    }, [entries, query, typeFilter, categoryFilter, paymentFilter, range, sort]);
    // টাকার যোগফল পয়সায় (পূর্ণসংখ্যা) করে, যাতে দশমিকের ভুল না হয়
    const totals = useMemo(() => {
        let income = 0;
        let expense = 0;
        for (const entry of filteredEntries) {
            const cents = Math.round(entry.amount * 100);
            if (entry.type === "income")
                income += cents;
            else
                expense += cents;
        }
        return {
            income: income / 100,
            expense: expense / 100,
            balance: (income - expense) / 100,
        };
    }, [filteredEntries]);
    const filtersActive = query.trim() !== "" ||
        typeFilter !== "all" ||
        categoryFilter !== "all" ||
        paymentFilter !== "all" ||
        period !== "all";
    const invalidRange = period === "custom" && !!fromDate && !!toDate && fromDate > toDate;
    // ফিল্টার বদলালে প্রথম পাতায়
    useEffect(() => {
        setPage(1);
    }, [
        query,
        typeFilter,
        categoryFilter,
        paymentFilter,
        period,
        fromDate,
        toDate,
        sort,
    ]);
    const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageEntries = filteredEntries.slice(pageStart, pageStart + PAGE_SIZE);
    const clearFilters = () => {
        setQuery("");
        setTypeFilter("all");
        setCategoryFilter("all");
        setPaymentFilter("all");
        setPeriod("all");
        setFromDate("");
        setToDate("");
    };
    /* ---------- ফর্ম ---------- */
    const closeForm = useCallback(() => {
        setShowForm(false);
        setEditingId(null);
        setErrors({});
    }, []);
    const openCreate = () => {
        setForm(emptyForm());
        setEditingId(null);
        setErrors({});
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
        setErrors({});
        setShowForm(true);
    };
    const changeFormType = (type: EntryType) => {
        setForm((f) => {
            const usingDefault = f.category.trim() === "" || f.category === DEFAULT_CATEGORY[f.type];
            return {
                ...f,
                type,
                category: usingDefault ? DEFAULT_CATEGORY[type] : f.category,
            };
        });
    };
    const categorySuggestions = useMemo(() => {
        const counts = new Map<string, number>();
        for (const e of entries) {
            if (e.type === form.type)
                counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
        }
        const used = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name]) => name);
        return Array.from(new Set([...used, ...SUGGESTED_CATEGORIES[form.type]])).slice(0, 10);
    }, [entries, form.type]);
    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const category = form.category.trim().replace(/\s+/g, " ");
        const amount = parseAmount(form.amount);
        const next: FormErrors = {};
        if (!category)
            next.category = "Please enter a category.";
        else if (category.length > MAX_CATEGORY_LENGTH) {
            next.category = `Category must be ${MAX_CATEGORY_LENGTH} characters or less.`;
        }
        if (amount === null)
            next.amount = "Enter a valid amount, like 1500 or 1500.50.";
        else if (amount <= 0)
            next.amount = "Amount must be greater than zero.";
        else if (amount > MAX_AMOUNT)
            next.amount = "That amount is too large.";
        if (!isValidDateStr(form.date))
            next.date = "Please choose a valid date.";
        if (Object.keys(next).length > 0) {
            setErrors(next);
            const firstId = next.category
                ? "ie-category"
                : next.amount
                    ? "ie-amount"
                    : "ie-date";
            requestAnimationFrame(() => document.getElementById(firstId)?.focus());
            return;
        }
        const cleaned = {
            type: form.type,
            category,
            amount: amount as number,
            date: form.date,
            description: form.description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
            paymentMethod: form.paymentMethod,
        };
        if (editingId) {
            setEntries((current) => current.map((entry) => entry.id === editingId ? { ...entry, ...cleaned } : entry));
            showToast("Entry updated");
        }
        else {
            const newEntry: Entry = {
                id: makeId(),
                ...cleaned,
                createdAt: new Date().toISOString(),
            };
            setEntries((current) => [newEntry, ...current]);
            showToast(`${cleaned.type === "income" ? "Income" : "Expense"} added`);
        }
        closeForm();
    };
    /* ---------- ডিলিট (Undo সহ) ---------- */
    const confirmDelete = () => {
        const entry = deleteTarget;
        if (!entry)
            return;
        setEntries((current) => current.filter((e) => e.id !== entry.id));
        setDeleteTarget(null);
        showToast("Entry deleted", "info", {
            label: "Undo",
            onClick: () => {
                setEntries((current) => current.some((e) => e.id === entry.id)
                    ? current
                    : [entry, ...current]);
                setToast(null);
            },
        });
    };
    /* ---------- এক্সপোর্ট ---------- */
    const handleExport = () => {
        if (filteredEntries.length === 0) {
            showToast("There is nothing to export yet.", "error");
            return;
        }
        downloadCsv(filteredEntries);
        showToast(`Exported ${filteredEntries.length} ${filteredEntries.length === 1 ? "entry" : "entries"}`);
    };
    /* ---------- UI ---------- */
    const spentPct = totals.income > 0
        ? Math.round((totals.expense / totals.income) * 100)
        : null;
    return (<div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A]">
      <DashboardNavbar />

      <main className="mx-auto max-w-[1220px] px-4 py-8 sm:px-6 lg:py-10">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/dashboard" className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600">
              <ArrowLeft size={14}/><T>{"Back to dashboard\n            "}</T></Link>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                <Wallet size={21}/>
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl"><T>{"Income &amp; Expenses\n                "}</T></h1>
                <p className="mt-0.5 text-sm font-medium text-slate-500"><T>{"Track money coming in, going out, and your current balance.\n                "}</T></p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleExport} disabled={!loaded || entries.length === 0} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-[#2563EB]/15 disabled:cursor-not-allowed disabled:opacity-50">
              <Download size={15}/><T>{"Export CSV\n            "}</T></button>
            <button type="button" onClick={openCreate} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[13px] font-bold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-[#2563EB]/30">
              <Plus size={16}/><T>{"Add entry\n            "}</T></button>
          </div>
        </div>

        {/* সেভ ব্যর্থ হলে সতর্কবার্তা */}
        {storageFailed && (<div role="alert" className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0"/><T>{"Your latest changes could not be saved. Your browser storage may be\n            full or blocked (for example in private mode). Please export a CSV\n            backup.\n          "}</T></div>)}

        {/* ফিল্টার চালু থাকলে জানানো */}
        {filtersActive && loaded && (<div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
            <span><T>{"Totals are for the "}</T>{filteredEntries.length}<T>{"filtered"}</T>{<T>{" "}</T>}
              {filteredEntries.length === 1 ? <T>{"entry"}</T> : <T>{"entries"}</T>}<T>{"(of"}</T>{<T>{" "}</T>}
              {entries.length}<T>{").\n            "}</T></span>
            <button type="button" onClick={clearFilters} className="cursor-pointer text-[#2563EB] hover:underline"><T>{"Show all\n            "}</T></button>
          </div>)}

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total income" value={money(totals.income)} tone="emerald" icon={<ArrowDownLeft size={18}/>} loading={!loaded}/>
          <SummaryCard label="Total expenses" value={money(totals.expense)} tone="rose" icon={<ArrowUpRight size={18}/>} loading={!loaded}/>
          <SummaryCard label="Current balance" value={money(totals.balance)} tone={totals.balance >= 0 ? "blue" : "rose"} icon={<Wallet size={18}/>} loading={!loaded}>
            {spentPct !== null && (<div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all duration-500 ${spentPct > 100 ? "bg-rose-500" : "bg-blue-500"}`} style={{ width: `${Math.min(100, spentPct)}%` }}/>
                </div>
                <p className="mt-1.5 text-[11px] font-semibold text-slate-500"><T>{"Spent "}</T>{spentPct}<T>{"% of income\n                "}</T></p>
              </div>)}
          </SummaryCard>
          <SummaryCard label={filtersActive ? "Matching entries" : "Total entries"} value={String(filteredEntries.length)} tone="slate" icon={<Filter size={18}/>} loading={!loaded}/>
        </div>

        {/* Table section */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.1)]">
          {/* Filters */}
          <div className="space-y-3 border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search entries" placeholder="Search category, note, payment method or amount..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 text-[13px] font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10"/>
                {query && (<button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                    <X size={13}/>
                  </button>)}
              </div>

              <div role="group" aria-label="Filter by type" className="flex h-10 shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1">
                {([
            ["all", "All"],
            ["income", "Income"],
            ["expense", "Expense"],
        ] as const).map(([value, label]) => {
            const active = typeFilter === value;
            return (<button key={value} type="button" aria-pressed={active} onClick={() => setTypeFilter(value)} className={`h-full flex-1 cursor-pointer rounded-lg px-4 text-[13px] font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 lg:flex-none ${active
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70"
                    : "text-slate-600 hover:text-slate-900"}`}>
                      {label}
                    </button>);
        })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center">
              <SelectBox label="Filter by period" value={period} onChange={(v) => setPeriod(v as PeriodKey)} className="lg:w-[150px]">
                {PERIOD_OPTIONS.map((o) => (<option key={o.value} value={o.value}>
                    {o.label}
                  </option>))}
              </SelectBox>
              <SelectBox label="Filter by category" value={categoryFilter} onChange={setCategoryFilter} className="lg:w-[170px]">
                <option value="all"><T>{"All categories"}</T></option>
                {categories.map((c) => (<option key={c} value={c}>
                    {c}
                  </option>))}
              </SelectBox>
              <SelectBox label="Filter by payment method" value={paymentFilter} onChange={setPaymentFilter} className="lg:w-[160px]">
                <option value="all"><T>{"All payments"}</T></option>
                {paymentMethods.map((m) => (<option key={m} value={m}>
                    {m}
                  </option>))}
              </SelectBox>
              <SelectBox label="Sort entries" value={sort} onChange={(v) => setSort(v as SortKey)} className="lg:w-[170px]">
                {SORT_OPTIONS.map((o) => (<option key={o.value} value={o.value}>
                    {o.label}
                  </option>))}
              </SelectBox>

              {filtersActive && (<button type="button" onClick={clearFilters} className="col-span-2 inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold text-[#2563EB] outline-none transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 lg:col-span-1 lg:ml-auto">
                  <RotateCcw size={14}/><T>{"Clear filters\n                "}</T></button>)}
            </div>

            {period === "custom" && (<div className="flex flex-wrap items-end gap-3">
                <label className="block text-xs font-bold text-slate-600">
                  <span className="mb-1 block"><T>{"From"}</T></span>
                  <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 outline-none [color-scheme:light] hover:border-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10"/>
                </label>
                <label className="block text-xs font-bold text-slate-600">
                  <span className="mb-1 block"><T>{"To"}</T></span>
                  <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 outline-none [color-scheme:light] hover:border-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10"/>
                </label>
                {invalidRange && (<p className="pb-2 text-xs font-semibold text-rose-600"><T>{"The start date is after the end date.\n                  "}</T></p>)}
              </div>)}
          </div>

          {/* ডেস্কটপ: টেবিল */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left">
              <caption className="sr-only"><T>{"Income and expense entries"}</T></caption>
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3"><T>{"Date\n                  "}</T></th>
                  <th scope="col" className="px-5 py-3"><T>{"Type\n                  "}</T></th>
                  <th scope="col" className="px-5 py-3"><T>{"Category\n                  "}</T></th>
                  <th scope="col" className="px-5 py-3"><T>{"Description\n                  "}</T></th>
                  <th scope="col" className="px-5 py-3"><T>{"Payment\n                  "}</T></th>
                  <th scope="col" className="px-5 py-3 text-right"><T>{"Amount\n                  "}</T></th>
                  <th scope="col" className="px-5 py-3 text-right"><T>{"Actions\n                  "}</T></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loaded &&
            pageEntries.map((entry) => (<tr key={entry.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-600">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-5 py-3">
                        <TypeBadge type={entry.type}/>
                      </td>
                      <td className="max-w-[180px] truncate px-5 py-3 text-sm font-bold text-slate-800" title={entry.category}>
                        {entry.category}
                      </td>
                      <td className="max-w-[280px] truncate px-5 py-3 text-sm text-slate-500" title={entry.description || undefined}>
                        {entry.description || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-500">
                        {entry.paymentMethod}
                      </td>
                      <td className={`whitespace-nowrap px-5 py-3 text-right text-sm font-black tabular-nums ${entry.type === "income"
                    ? "text-emerald-700"
                    : "text-rose-700"}`}>
                        {entry.type === "income" ? <T>{"+"}</T> : <T>{"-"}</T>}
                        {money(entry.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <IconButton label="Edit entry" tone="blue" onClick={() => openEdit(entry)}>
                            <Edit3 size={15}/>
                          </IconButton>
                          <IconButton label="Delete entry" tone="rose" onClick={() => setDeleteTarget(entry)}>
                            <Trash2 size={15}/>
                          </IconButton>
                        </div>
                      </td>
                    </tr>))}
              </tbody>
            </table>
          </div>

          {/* মোবাইল: কার্ড লিস্ট */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {loaded &&
            pageEntries.map((entry) => (<li key={entry.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {entry.category}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        {entry.description || "No note"}
                      </p>
                    </div>
                    <p className={`shrink-0 text-sm font-black tabular-nums ${entry.type === "income"
                    ? "text-emerald-700"
                    : "text-rose-700"}`}>
                      {entry.type === "income" ? <T>{"+"}</T> : <T>{"-"}</T>}
                      {money(entry.amount)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <TypeBadge type={entry.type}/>
                      <span className="text-xs font-semibold text-slate-500">
                        {formatDate(entry.date)}<T>{"\u00B7 "}</T>{entry.paymentMethod}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconButton label="Edit entry" tone="blue" onClick={() => openEdit(entry)}>
                        <Edit3 size={15}/>
                      </IconButton>
                      <IconButton label="Delete entry" tone="rose" onClick={() => setDeleteTarget(entry)}>
                        <Trash2 size={15}/>
                      </IconButton>
                    </div>
                  </div>
                </li>))}
          </ul>

          {/* খালি অবস্থা */}
          {loaded && filteredEntries.length === 0 && (<div className="flex flex-col items-center px-5 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">
                {entries.length === 0 ? (<Wallet size={26}/>) : (<Search size={26}/>)}
              </span>
              <p className="mt-4 text-base font-bold text-slate-800">
                {entries.length === 0
            ? <T>{"No entries yet"}</T> : <T>{"No matching entries"}</T>}
              </p>
              <p className="mt-1 max-w-sm text-[13px] font-medium leading-5 text-slate-500">
                {entries.length === 0
            ? <T>{"Add your first income or expense entry to start tracking."}</T> : <T>{"Try changing or clearing your filters to see more entries."}</T>}
              </p>
              {entries.length === 0 ? (<button type="button" onClick={openCreate} className="mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[13px] font-bold text-white shadow-sm hover:bg-blue-700">
                  <Plus size={15}/><T>{"Add your first entry\n                "}</T></button>) : (<button type="button" onClick={clearFilters} className="mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-700 hover:bg-slate-50">
                  <RotateCcw size={14}/><T>{"Clear filters\n                "}</T></button>)}
            </div>)}

          {/* ফুটার: পেজিনেশন + নোট */}
          {loaded && (<div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Info size={13} className="shrink-0 text-slate-400"/>
                {filteredEntries.length > 0
            ? <T>{`Showing ${pageStart + 1}–${pageStart + pageEntries.length} of ${filteredEntries.length}. `}</T> : <T>{""}</T>}<T>{"Entries are saved in this browser on this device.\n              "}</T></p>

              {totalPages > 1 && (<nav aria-label="Pagination" className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft size={16}/>
                  </button>
                  <span className="min-w-[88px] text-center text-xs font-semibold text-slate-600"><T>{"Page "}</T>{currentPage}<T>{"of "}</T>{totalPages}
                  </span>
                  <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronRight size={16}/>
                  </button>
                </nav>)}
            </div>)}
        </section>
      </main>

      {/* ============ Add / Edit ফর্ম ============ */}
      {showForm && (<Modal titleId="entry-form-title" onClose={closeForm}>
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 id="entry-form-title" className="text-lg font-black">
                {editingId ? <T>{"Edit entry"}</T> : <T>{"Add entry"}</T>}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500"><T>{"Record money in or money out.\n              "}</T></p>
            </div>
            <button type="button" onClick={closeForm} aria-label="Close" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
              <X size={18}/>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
            {/* Type: Income / Expense */}
            <div role="group" aria-label="Entry type" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {([
                ["income", "Income", ArrowDownLeft, "text-emerald-700"],
                ["expense", "Expense", ArrowUpRight, "text-rose-700"],
            ] as const).map(([value, label, Icon, activeText]) => {
                const active = form.type === value;
                return (<button key={value} type="button" aria-pressed={active} onClick={() => changeFormType(value)} className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-[13px] font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 ${active
                        ? `bg-white shadow-sm ring-1 ring-slate-200/70 ${activeText}`
                        : "text-slate-500 hover:text-slate-800"}`}>
                    <Icon size={16}/>
                    {label}
                  </button>);
            })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ie-amount" label="Amount (৳)" error={errors.amount}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400"><T>{"\u09F3\n                  "}</T></span>
                  <input id="ie-amount" data-autofocus inputMode="decimal" autoComplete="off" value={form.amount} onChange={(e) => {
                setForm({
                    ...form,
                    amount: sanitizeAmountInput(e.target.value),
                });
                if (errors.amount)
                    setErrors({ ...errors, amount: undefined });
            }} placeholder="0" aria-invalid={!!errors.amount} aria-describedby={errors.amount ? "ie-amount-error" : undefined} className={`${inputCls} pl-8 tabular-nums ${errors.amount ? inputErrCls : ""}`}/>
                </div>
              </Field>

              <Field id="ie-date" label="Date" error={errors.date}>
                <input id="ie-date" type="date" value={form.date} onChange={(e) => {
                setForm({ ...form, date: e.target.value });
                if (errors.date)
                    setErrors({ ...errors, date: undefined });
            }} aria-invalid={!!errors.date} aria-describedby={errors.date ? "ie-date-error" : undefined} className={`${inputCls} [color-scheme:light] ${errors.date ? inputErrCls : ""}`}/>
              </Field>
            </div>

            <Field id="ie-category" label="Category" error={errors.category}>
              <input id="ie-category" value={form.category} maxLength={MAX_CATEGORY_LENGTH + 10} onChange={(e) => {
                setForm({ ...form, category: e.target.value });
                if (errors.category)
                    setErrors({ ...errors, category: undefined });
            }} placeholder="Sales, Rent, Salary..." autoComplete="off" aria-invalid={!!errors.category} aria-describedby={errors.category ? "ie-category-error" : undefined} className={`${inputCls} ${errors.category ? inputErrCls : ""}`}/>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categorySuggestions.map((name) => {
                const active = form.category.trim().toLowerCase() === name.toLowerCase();
                return (<button key={name} type="button" onClick={() => {
                        setForm({ ...form, category: name });
                        if (errors.category)
                            setErrors({ ...errors, category: undefined });
                    }} className={`h-7 cursor-pointer rounded-full border px-3 text-xs font-semibold transition-colors ${active
                        ? "border-[#2563EB] bg-blue-50 text-[#1D4ED8]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}>
                      {name}
                    </button>);
            })}
              </div>
            </Field>

            <Field id="ie-payment" label="Payment method">
              <SelectBox id="ie-payment" label="Payment method" value={form.paymentMethod} onChange={(v) => setForm({ ...form, paymentMethod: v })} tall>
                {(PAYMENT_METHODS.includes(form.paymentMethod)
                ? PAYMENT_METHODS
                : [...PAYMENT_METHODS, form.paymentMethod]).map((m) => (<option key={m} value={m}>
                    {m}
                  </option>))}
              </SelectBox>
            </Field>

            <Field id="ie-description" label="Description (optional)">
              <textarea id="ie-description" value={form.description} maxLength={MAX_DESCRIPTION_LENGTH} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Add a short note" className={`${inputCls} h-auto resize-none py-2.5`}/>
              <p className="mt-1 text-right text-[11px] font-medium text-slate-400">
                {form.description.length}<T>{"/"}</T>{MAX_DESCRIPTION_LENGTH}
              </p>
            </Field>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={closeForm} className="h-11 cursor-pointer rounded-xl border border-slate-200 px-5 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50"><T>{"Cancel\n              "}</T></button>
              <button type="submit" className="h-11 cursor-pointer rounded-xl bg-[#2563EB] px-5 text-[13px] font-bold text-white shadow-sm outline-none transition-colors hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-[#2563EB]/30">
                {editingId ? <T>{"Save changes"}</T> : <T>{"Add entry"}</T>}
              </button>
            </div>
          </form>
        </Modal>)}

      {/* ============ ডিলিট নিশ্চিতকরণ ============ */}
      {deleteTarget && (<Modal titleId="delete-title" onClose={() => setDeleteTarget(null)} closeOnBackdrop widthClass="max-w-md">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
                <Trash2 size={20}/>
              </span>
              <div className="min-w-0">
                <h2 id="delete-title" className="text-lg font-black"><T>{"Delete this entry?\n                "}</T></h2>
                <p className="mt-1 text-[13px] font-medium leading-5 text-slate-500">
                  <span className="font-bold text-slate-700">
                    {deleteTarget.category}
                  </span>{<T>{" "}</T>}<T>{"\u00B7"}</T>{<T>{" "}</T>}
                  <span className={`font-bold ${deleteTarget.type === "income"
                ? "text-emerald-700"
                : "text-rose-700"}`}>
                    {deleteTarget.type === "income" ? <T>{"+"}</T> : <T>{"-"}</T>}
                    {money(deleteTarget.amount)}
                  </span>{<T>{" "}</T>}<T>{"\u00B7 "}</T>{formatDate(deleteTarget.date)}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500"><T>{"You can undo this right after deleting.\n                "}</T></p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" data-autofocus onClick={() => setDeleteTarget(null)} className="h-11 cursor-pointer rounded-xl border border-slate-200 px-5 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50"><T>{"Cancel\n              "}</T></button>
              <button type="button" onClick={confirmDelete} className="h-11 cursor-pointer rounded-xl bg-rose-600 px-5 text-[13px] font-bold text-white shadow-sm outline-none transition-colors hover:bg-rose-700 focus-visible:ring-4 focus-visible:ring-rose-500/30"><T>{"Delete\n              "}</T></button>
            </div>
          </div>
        </Modal>)}

      {/* ============ টোস্ট ============ */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[120] flex justify-center px-4">
        {toast && (<div key={toast.id} role={toast.tone === "error" ? "alert" : "status"} className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-900 py-2.5 pl-3.5 pr-2.5 text-[13px] font-semibold text-white shadow-2xl">
            {toast.tone === "error" ? (<AlertTriangle size={16} className="shrink-0 text-amber-300"/>) : (<Check size={16} className="shrink-0 text-emerald-300"/>)}
            <span className="min-w-0">{toast.message}</span>
            {toast.action && (<button type="button" onClick={toast.action.onClick} className="cursor-pointer rounded-lg px-2.5 py-1 text-[13px] font-bold text-sky-300 hover:bg-white/10">
                {toast.action.label}
              </button>)}
            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
              <X size={14}/>
            </button>
          </div>)}
      </div>
    </div>);
}
/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */
function Modal({ titleId, onClose, closeOnBackdrop = false, widthClass = "max-w-lg", children, }: {
    titleId: string;
    onClose: () => void;
    closeOnBackdrop?: boolean;
    widthClass?: string;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);
    useEffect(() => {
        const node = ref.current;
        const previous = document.activeElement as HTMLElement | null;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const focusables = () => node
            ? Array.from(node.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
            : [];
        const first = node?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0];
        first?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onCloseRef.current();
                return;
            }
            if (e.key !== "Tab")
                return;
            const items = focusables();
            if (items.length === 0)
                return;
            const firstItem = items[0];
            const lastItem = items[items.length - 1];
            if (e.shiftKey && document.activeElement === firstItem) {
                e.preventDefault();
                lastItem.focus();
            }
            else if (!e.shiftKey && document.activeElement === lastItem) {
                e.preventDefault();
                firstItem.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
            previous?.focus?.();
        };
    }, []);
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onMouseDown={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget)
                onClose();
        }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ${widthClass}`}>
        {children}
      </div>
    </div>);
}
function Field({ id, label, error, children, }: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (<div className="block">
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-700">
        {label}
      </label>
      {children}
      {error && (<p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">
          {error}
        </p>)}
    </div>);
}
function SelectBox({ id, label, value, onChange, className = "", tall = false, children, }: {
    id?: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
    tall?: boolean;
    children: ReactNode;
}) {
    return (<div className={`relative ${className}`}>
      <select id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={`${tall ? `${inputCls} cursor-pointer appearance-none pr-9` : filterFieldCls}`}>
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>
    </div>);
}
function TypeBadge({ type }: {
    type: EntryType;
}) {
    const income = type === "income";
    return (<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${income ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {income ? <ArrowDownLeft size={11}/> : <ArrowUpRight size={11}/>}
      {type}
    </span>);
}
function IconButton({ label, tone, onClick, children, }: {
    label: string;
    tone: "blue" | "rose";
    onClick: () => void;
    children: ReactNode;
}) {
    return (<button type="button" onClick={onClick} aria-label={label} title={label} className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 ${tone === "blue"
            ? "hover:bg-blue-50 hover:text-blue-600"
            : "hover:bg-rose-50 hover:text-rose-600"}`}>
      {children}
    </button>);
}
function SummaryCard({ label, value, tone, icon, loading = false, children, }: {
    label: string;
    value: string;
    tone: "emerald" | "rose" | "blue" | "slate";
    icon: ReactNode;
    loading?: boolean;
    children?: ReactNode;
}) {
    const styles = {
        emerald: "bg-emerald-50 text-emerald-700",
        rose: "bg-rose-50 text-rose-700",
        blue: "bg-blue-50 text-blue-700",
        slate: "bg-slate-100 text-slate-700",
    }[tone];
    return (<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${styles}`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      {loading ? (<div className="mt-2 h-7 w-28"/>) : (<p className="mt-1 truncate text-xl font-black tabular-nums text-slate-900" title={value}>
          {value}
        </p>)}
      {!loading && children}
    </div>);
}
