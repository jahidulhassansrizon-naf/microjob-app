"use client";

import {
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  Plus,
  Printer,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";

/* ───────────────────────── Types ───────────────────────── */

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
  createdAt: string;
};
type InvoiceStatus = "Draft" | "Unpaid" | "Partial" | "Paid";
type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};
type Invoice = {
  id: string;
  number: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  taxPercent: number;
  discount: number;
  paidAmount: number;
  notes: string;
  items: InvoiceItem[];
  createdAt: string;
};
type ItemForm = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};
type InvoiceForm = {
  customerId: string;
  issueDate: string;
  dueDate: string;
  draft: boolean;
  taxPercent: string;
  discount: string;
  paidAmount: string;
  notes: string;
  items: ItemForm[];
};
type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
};
type Filter = "all" | InvoiceStatus | "Overdue";

/* ───────────────────────── Helpers ───────────────────────── */

const CUSTOMER_KEY = "sohozkaj:customers:v1";
const INVOICE_KEY = "sohozkaj:invoices:v1";
const blankCustomer: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  note: "",
};
const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
// Local date (not UTC) so Bangladesh users near midnight get the right day.
const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const money = (v: number) =>
  `৳${(Number.isFinite(v) ? v : 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
const num = (v: string | number) => {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round(n * 100) / 100;
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );
const normPhone = (p: string) => p.replace(/[\s-]/g, "");
const phoneOk = (p: string) => /^(\+?88)?01[3-9]\d{8}$/.test(normPhone(p));
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function scope() {
  if (typeof window === "undefined") return "guest";
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "guest";
    const u = JSON.parse(raw) as {
      id?: string;
      _id?: string;
      email?: string;
      phoneNumber?: string;
    };
    return u.id || u._id || u.email || u.phoneNumber || "guest";
  } catch {
    return "guest";
  }
}
const key = (base: string) => `${base}:${scope()}`;

function totalsOf(inv: Pick<Invoice, "items" | "discount" | "taxPercent">) {
  const subtotal = round2(
    inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
  );
  const discount = Math.min(Math.max(inv.discount || 0, 0), subtotal);
  const tax = round2((subtotal - discount) * ((inv.taxPercent || 0) / 100));
  return { subtotal, discount, tax, total: round2(subtotal - discount + tax) };
}
const deriveStatus = (
  draft: boolean,
  total: number,
  paid: number,
): InvoiceStatus =>
  draft
    ? "Draft"
    : paid >= total && total > 0
      ? "Paid"
      : paid > 0
        ? "Partial"
        : "Unpaid";
const isOverdue = (inv: Invoice) =>
  (inv.status === "Unpaid" || inv.status === "Partial") &&
  inv.dueDate < localDate();
const dueOf = (inv: Invoice) =>
  inv.status === "Draft"
    ? 0
    : Math.max(round2(totalsOf(inv).total - inv.paidAmount), 0);

// Defensive load: tolerates old/corrupt data and migrates invoices that had no paidAmount.
function loadList<T>(k: string): T[] {
  try {
    const v = JSON.parse(localStorage.getItem(key(k)) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function loadInvoices(): Invoice[] {
  return loadList<Invoice>(INVOICE_KEY).map((i) => {
    const total = totalsOf(i).total;
    const paid =
      typeof i.paidAmount === "number"
        ? i.paidAmount
        : i.status === "Paid"
          ? total
          : 0;
    return {
      ...i,
      items: Array.isArray(i.items) ? i.items : [],
      paidAmount: paid,
      status: deriveStatus(i.status === "Draft", total, paid),
    };
  });
}

function nextInvoiceNumber(invoices: Invoice[]) {
  const year = new Date().getFullYear();
  const max = invoices.reduce((m, i) => {
    const x = i.number.match(new RegExp(`^INV-${year}-(\\d+)$`));
    return x ? Math.max(m, Number(x[1])) : m;
  }, 0);
  return `INV-${year}-${String(max + 1).padStart(4, "0")}`;
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function printInvoice(inv: Invoice, customer: Customer | undefined): boolean {
  const t = totalsOf(inv);
  let biz = "Sohozkaj";
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}") as {
      businessName?: string;
      name?: string;
      fullName?: string;
    };
    biz = u.businessName || u.name || u.fullName || biz;
  } catch {
    /* ignore */
  }
  const rows = inv.items
    .map(
      (i, n) =>
        `<tr><td>${n + 1}</td><td>${esc(i.description)}</td><td class="r">${i.quantity}</td><td class="r">${money(i.unitPrice)}</td><td class="r">${money(i.quantity * i.unitPrice)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.number)}</title><style>
    body{font-family:system-ui,sans-serif;color:#0f172a;margin:40px;font-size:13px}h1{margin:0;font-size:26px}.m{color:#64748b}
    .top{display:flex;justify-content:space-between;margin-bottom:28px}table{width:100%;border-collapse:collapse;margin-top:20px}
    th{background:#f1f5f9;text-align:left;font-size:11px;text-transform:uppercase;color:#475569}th,td{padding:9px 10px;border-bottom:1px solid #e2e8f0}
    .r{text-align:right}.tot{margin-left:auto;width:260px;margin-top:16px}.tot div{display:flex;justify-content:space-between;padding:4px 0}
    .g{font-weight:800;font-size:15px;border-top:2px solid #0f172a;margin-top:4px;padding-top:8px!important}@media print{body{margin:16px}}</style></head><body>
    <div class="top"><div><h1>${esc(biz)}</h1><div class="m">Invoice</div></div><div class="r"><b>${esc(inv.number)}</b><div class="m">Issued: ${esc(inv.issueDate)}</div><div class="m">Due: ${esc(inv.dueDate)}</div><div><b>${inv.status.toUpperCase()}</b></div></div></div>
    <div class="m">Bill to</div><b>${esc(customer?.name || "Unknown customer")}</b><div>${esc(customer?.phone || "")} ${esc(customer?.email || "")}</div><div>${esc(customer?.address || "")}</div>
    <table><thead><tr><th>#</th><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="tot"><div><span>Subtotal</span><span>${money(t.subtotal)}</span></div><div><span>Discount</span><span>-${money(t.discount)}</span></div><div><span>Tax (${inv.taxPercent}%)</span><span>${money(t.tax)}</span></div>
    <div class="g"><span>Total</span><span>${money(t.total)}</span></div><div><span>Paid</span><span>${money(inv.paidAmount)}</span></div><div><b>Balance due</b><b>${money(dueOf(inv))}</b></div></div>
    ${inv.notes ? `<p class="m" style="margin-top:28px">Notes: ${esc(inv.notes)}</p>` : ""}<script>window.onload=function(){window.print()}<\/script></body></html>`;
  const w = window.open("", "_blank", "width=900,height=800");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}

/* ───────────────────────── Page ───────────────────────── */

export default function CustomersInvoicesPage() {
  const [tab, setTab] = useState<"customers" | "invoices">("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [customerModal, setCustomerModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerForm>(blankCustomer);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(() =>
    blankInvoice(""),
  );
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);
  const [payment, setPayment] = useState<{ id: string; amount: string } | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }, []);

  // Load + keep multiple tabs in sync
  useEffect(() => {
    const read = () => {
      setCustomers(loadList<Customer>(CUSTOMER_KEY));
      setInvoices(loadInvoices());
    };
    read();
    setLoaded(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key(CUSTOMER_KEY) || e.key === key(INVOICE_KEY)) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key(CUSTOMER_KEY), JSON.stringify(customers));
      localStorage.setItem(key(INVOICE_KEY), JSON.stringify(invoices));
    } catch {
      notify("Could not save — browser storage is full or blocked.");
    }
  }, [customers, invoices, loaded, notify]);

  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );

  const perCustomer = useMemo(() => {
    const m = new Map<string, { count: number; due: number }>();
    invoices.forEach((i) => {
      const r = m.get(i.customerId) || { count: 0, due: 0 };
      r.count++;
      r.due += dueOf(i);
      m.set(i.customerId, r);
    });
    return m;
  }, [invoices]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter(
      (c) =>
        !q ||
        [c.name, c.phone, c.email, c.address, c.note]
          .join(" ")
          .toLowerCase()
          .includes(q),
    );
  }, [customers, query]);

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices
      .filter(
        (i) =>
          filter === "all" ||
          (filter === "Overdue" ? isOverdue(i) : i.status === filter),
      )
      .filter((i) => {
        const c = customerMap.get(i.customerId);
        return (
          !q ||
          [i.number, c?.name || "", c?.phone || "", i.status]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
      })
      .sort(
        (a, b) =>
          b.issueDate.localeCompare(a.issueDate) ||
          b.number.localeCompare(a.number),
      );
  }, [customerMap, invoices, filter, query]);

  const stats = useMemo(() => {
    const live = invoices.filter((i) => i.status !== "Draft");
    const billed = live.reduce((s, i) => s + totalsOf(i).total, 0);
    const paid = live.reduce(
      (s, i) => s + Math.min(i.paidAmount, totalsOf(i).total),
      0,
    );
    return {
      billed,
      paid,
      due: Math.max(billed - paid, 0),
      overdue: invoices.filter(isOverdue).length,
    };
  }, [invoices]);

  /* Customers */
  const openNewCustomer = () => {
    setCustomerForm(blankCustomer);
    setEditingCustomerId(null);
    setError("");
    setCustomerModal(true);
  };
  const editCustomer = (c: Customer) => {
    setEditingCustomerId(c.id);
    setCustomerForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      note: c.note,
    });
    setError("");
    setCustomerModal(true);
  };

  const saveCustomer = (e: FormEvent) => {
    e.preventDefault();
    const f = {
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      email: customerForm.email.trim(),
      address: customerForm.address.trim(),
      note: customerForm.note.trim(),
    };
    if (!f.name) return setError("Customer name is required.");
    if (!f.phone && !f.email)
      return setError("Add at least a phone number or email.");
    if (f.phone && !phoneOk(f.phone))
      return setError(
        "Enter a valid Bangladeshi mobile number (e.g. 01712345678).",
      );
    if (f.email && !emailOk(f.email))
      return setError("Enter a valid email address.");
    if (
      f.phone &&
      customers.some(
        (c) =>
          c.id !== editingCustomerId &&
          c.phone &&
          normPhone(c.phone) === normPhone(f.phone),
      )
    )
      return setError("A customer with this phone number already exists.");
    if (editingCustomerId)
      setCustomers((cur) =>
        cur.map((c) => (c.id === editingCustomerId ? { ...c, ...f } : c)),
      );
    else
      setCustomers((cur) => [
        { id: uid(), ...f, createdAt: new Date().toISOString() },
        ...cur,
      ]);
    notify(editingCustomerId ? "Customer updated." : "Customer added.");
    setCustomerModal(false);
    setEditingCustomerId(null);
    setCustomerForm(blankCustomer);
    setError("");
  };

  const deleteCustomer = (c: Customer) => {
    if (invoices.some((i) => i.customerId === c.id))
      return setConfirm({
        title: "Can't delete customer",
        message: `${c.name} has invoices. Delete or reassign those invoices first.`,
        action: () => {},
      });
    setConfirm({
      title: "Delete customer?",
      message: `${c.name} will be removed permanently.`,
      action: () => {
        setCustomers((cur) => cur.filter((x) => x.id !== c.id));
        notify("Customer deleted.");
      },
    });
  };

  /* Invoices */
  const openNewInvoice = () => {
    if (!customers.length) {
      notify("Add a customer first.");
      setTab("customers");
      return openNewCustomer();
    }
    setEditingInvoiceId(null);
    setInvoiceForm(blankInvoice(customers[0].id));
    setError("");
    setInvoiceModal(true);
  };

  const editInvoice = (i: Invoice) => {
    setEditingInvoiceId(i.id);
    setInvoiceForm({
      customerId: i.customerId,
      issueDate: i.issueDate,
      dueDate: i.dueDate,
      draft: i.status === "Draft",
      taxPercent: String(i.taxPercent),
      discount: String(i.discount),
      paidAmount: String(i.paidAmount),
      notes: i.notes,
      items: i.items.map((x) => ({
        id: x.id,
        description: x.description,
        quantity: String(x.quantity),
        unitPrice: String(x.unitPrice),
      })),
    });
    setError("");
    setInvoiceModal(true);
  };

  const updateItem = (
    id: string,
    field: "description" | "quantity" | "unitPrice",
    value: string,
  ) =>
    setInvoiceForm((cur) => ({
      ...cur,
      items: cur.items.map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    }));

  const saveInvoice = (e: FormEvent) => {
    e.preventDefault();
    const f = invoiceForm;
    if (!f.customerId || !customerMap.has(f.customerId))
      return setError("Select a customer first.");
    if (!f.issueDate || !f.dueDate)
      return setError("Issue date and due date are required.");
    if (f.dueDate < f.issueDate)
      return setError("Due date can't be before the issue date.");
    const filled = f.items.filter(
      (x) => x.description.trim() || x.unitPrice.trim(),
    );
    if (!filled.length) return setError("Add at least one invoice item.");
    const items: InvoiceItem[] = [];
    for (const [n, x] of filled.entries()) {
      const q = num(x.quantity),
        p = num(x.unitPrice);
      if (!x.description.trim() || q <= 0 || !x.unitPrice.trim() || p < 0)
        return setError(
          `Item ${n + 1}: enter a description, a quantity above 0 and a unit price.`,
        );
      items.push({
        id: x.id,
        description: x.description.trim(),
        quantity: q,
        unitPrice: p,
      });
    }
    const tax = num(f.taxPercent),
      discount = num(f.discount),
      paid = num(f.paidAmount);
    if (tax < 0 || tax > 100)
      return setError("Tax must be between 0 and 100%.");
    if (discount < 0) return setError("Discount can't be negative.");
    const t = totalsOf({ items, discount, taxPercent: tax });
    if (discount > t.subtotal)
      return setError("Discount can't be more than the subtotal.");
    if (paid < 0) return setError("Amount paid can't be negative.");
    if (paid > t.total)
      return setError(
        `Amount paid can't be more than the total (${money(t.total)}).`,
      );

    const existing = editingInvoiceId
      ? invoices.find((i) => i.id === editingInvoiceId)
      : undefined;
    const payload: Invoice = {
      id: existing?.id || uid(),
      number: existing?.number || nextInvoiceNumber(invoices),
      customerId: f.customerId,
      issueDate: f.issueDate,
      dueDate: f.dueDate,
      status: deriveStatus(f.draft, t.total, paid),
      taxPercent: tax,
      discount,
      paidAmount: paid,
      notes: f.notes.trim(),
      items,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    setInvoices((cur) =>
      existing
        ? cur.map((i) => (i.id === existing.id ? payload : i))
        : [payload, ...cur],
    );
    notify(
      existing ? "Invoice updated." : `Invoice ${payload.number} created.`,
    );
    setInvoiceModal(false);
    setEditingInvoiceId(null);
    setError("");
  };

  const deleteInvoice = (i: Invoice) =>
    setConfirm({
      title: "Delete invoice?",
      message: `${i.number} will be removed permanently.`,
      action: () => {
        setInvoices((cur) => cur.filter((x) => x.id !== i.id));
        notify("Invoice deleted.");
      },
    });

  const applyPayment = (id: string, amount: number) =>
    setInvoices((cur) =>
      cur.map((i) => {
        if (i.id !== id) return i;
        const total = totalsOf(i).total;
        const paid = Math.min(round2(i.paidAmount + amount), total);
        return {
          ...i,
          paidAmount: paid,
          status: deriveStatus(false, total, paid),
        };
      }),
    );

  const markPaid = (i: Invoice) => {
    applyPayment(i.id, dueOf(i) || totalsOf(i).total);
    notify(`${i.number} marked as paid.`);
  };

  const submitPayment = (e: FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    const inv = invoices.find((i) => i.id === payment.id);
    const amt = num(payment.amount);
    if (!inv) return setPayment(null);
    if (amt <= 0) return setError("Enter an amount above 0.");
    if (amt > dueOf(inv))
      return setError(
        `Amount can't be more than the balance due (${money(dueOf(inv))}).`,
      );
    applyPayment(inv.id, amt);
    notify(`Payment of ${money(amt)} recorded.`);
    setPayment(null);
    setError("");
  };

  const exportCsv = () => {
    if (tab === "customers") {
      if (!filteredCustomers.length) return notify("Nothing to export.");
      downloadCsv(`customers-${localDate()}.csv`, [
        ["Name", "Phone", "Email", "Address", "Note"],
        ...filteredCustomers.map((c) => [
          c.name,
          c.phone,
          c.email,
          c.address,
          c.note,
        ]),
      ]);
    } else {
      if (!filteredInvoices.length) return notify("Nothing to export.");
      downloadCsv(`invoices-${localDate()}.csv`, [
        [
          "Invoice",
          "Customer",
          "Issue date",
          "Due date",
          "Status",
          "Total",
          "Paid",
          "Balance",
        ],
        ...filteredInvoices.map((i) => [
          i.number,
          customerMap.get(i.customerId)?.name || "",
          i.issueDate,
          i.dueDate,
          isOverdue(i) ? "Overdue" : i.status,
          totalsOf(i).total,
          i.paidAmount,
          dueOf(i),
        ]),
      ]);
    }
  };

  const doPrint = (i: Invoice) => {
    if (!printInvoice(i, customerMap.get(i.customerId)))
      notify("Allow pop-ups to print the invoice.");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A]">
      <DashboardNavbar />
      <main className="mx-auto max-w-[1220px] px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft size={14} /> Back to dashboard
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                <Users size={20} />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Customers &amp; Invoices
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Keep customer details, create invoices, and track what is paid
                  or due.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={tab === "customers" ? openNewCustomer : openNewInvoice}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={15} />{" "}
            {tab === "customers" ? "Add customer" : "Create invoice"}
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniStat
            label="Customers"
            value={String(customers.length)}
            icon={<Users size={18} />}
            accent="bg-blue-50 text-blue-600"
          />
          <MiniStat
            label="Billed"
            value={money(stats.billed)}
            icon={<FileText size={18} />}
            accent="bg-slate-100 text-slate-600"
          />
          <MiniStat
            label="Paid"
            value={money(stats.paid)}
            tone="text-emerald-600"
            icon={<CheckCircle2 size={18} />}
            accent="bg-emerald-50 text-emerald-600"
          />
          <MiniStat
            label="Due"
            value={money(stats.due)}
            tone={stats.due > 0 ? "text-amber-600" : undefined}
            sub={stats.overdue ? `${stats.overdue} overdue` : undefined}
            icon={<Banknote size={18} />}
            accent="bg-amber-50 text-amber-600"
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="flex w-fit rounded-xl bg-slate-100 p-1"
              role="tablist"
            >
              {(["customers", "invoices"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => {
                    setTab(t);
                    setQuery("");
                    setFilter("all");
                  }}
                  className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold capitalize ${tab === t ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {t}
                  {t === "customers"
                    ? ` (${customers.length})`
                    : ` (${invoices.length})`}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-0 flex-1 sm:min-w-[280px]">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search"
                  placeholder={
                    tab === "customers"
                      ? "Search name, phone, email..."
                      : "Search invoice number or customer..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              {tab === "invoices" && (
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as Filter)}
                  aria-label="Filter by status"
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
                >
                  <option value="all">All statuses</option>
                  <option>Draft</option>
                  <option>Unpaid</option>
                  <option>Partial</option>
                  <option>Paid</option>
                  <option>Overdue</option>
                </select>
              )}
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {tab === "customers" ? (
            <CustomerTable
              customers={filteredCustomers}
              stats={perCustomer}
              searching={Boolean(query)}
              onAdd={openNewCustomer}
              onEdit={editCustomer}
              onDelete={deleteCustomer}
            />
          ) : (
            <InvoiceTable
              onAdd={openNewInvoice}
              invoices={filteredInvoices}
              customers={customerMap}
              searching={Boolean(query) || filter !== "all"}
              onEdit={editInvoice}
              onDelete={deleteInvoice}
              onMarkPaid={markPaid}
              onPay={(i) => {
                setError("");
                setPayment({ id: i.id, amount: String(dueOf(i)) });
              }}
              onPrint={doPrint}
            />
          )}
        </section>
      </main>

      {customerModal && (
        <CustomerModal
          form={customerForm}
          setForm={setCustomerForm}
          error={error}
          editing={Boolean(editingCustomerId)}
          onClose={() => setCustomerModal(false)}
          onSubmit={saveCustomer}
        />
      )}
      {invoiceModal && (
        <InvoiceModal
          form={invoiceForm}
          setForm={setInvoiceForm}
          error={error}
          customers={customers}
          editing={Boolean(editingInvoiceId)}
          onClose={() => setInvoiceModal(false)}
          onSubmit={saveInvoice}
          updateItem={updateItem}
        />
      )}
      {payment && (
        <Modal
          title="Record payment"
          subtitle={`Balance due: ${money(dueOf(invoices.find((i) => i.id === payment.id)!))}`}
          onClose={() => setPayment(null)}
        >
          <form onSubmit={submitPayment} className="space-y-4">
            {error && <ErrorBox text={error} />}
            <Field label="Amount received (৳)">
              <input
                autoFocus
                inputMode="decimal"
                value={payment.amount}
                onChange={(e) =>
                  setPayment({ ...payment, amount: e.target.value })
                }
                className={inputCls}
              />
            </Field>
            <ModalActions
              onClose={() => setPayment(null)}
              submit="Save payment"
            />
          </form>
        </Modal>
      )}
      {confirm && (
        <ConfirmDialog {...confirm} onClose={() => setConfirm(null)} />
      )}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function blankInvoice(customerId: string): InvoiceForm {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return {
    customerId,
    issueDate: localDate(),
    dueDate: localDate(d),
    draft: false,
    taxPercent: "0",
    discount: "0",
    paidAmount: "0",
    notes: "",
    items: [{ id: uid(), description: "", quantity: "1", unitPrice: "" }],
  };
}

/* ───────────────────────── Tables ───────────────────────── */

const th = "px-5 py-3 whitespace-nowrap";
const iconBtn = "cursor-pointer rounded-lg p-2 text-slate-500";

function CustomerTable({
  customers,
  stats,
  searching,
  onAdd,
  onEdit,
  onDelete,
}: {
  onAdd: () => void;
  customers: Customer[];
  stats: Map<string, { count: number; due: number }>;
  searching: boolean;
  onEdit: (c: Customer) => void;
  onDelete: (c: Customer) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className={th}>Customer</th>
            <th className={th}>Phone</th>
            <th className={th}>Email</th>
            <th className={th}>Address</th>
            <th className={`${th} text-right`}>Invoices / Due</th>
            <th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customers.map((c) => {
            const s = stats.get(c.id);
            return (
              <tr key={c.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3">
                  <p className="text-sm font-black text-slate-800">{c.name}</p>
                  <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-400">
                    {c.note || "No note"}
                  </p>
                </td>
                <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                  {c.phone ? (
                    <a
                      href={`tel:${normPhone(c.phone)}`}
                      className="hover:text-blue-600"
                    >
                      {c.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-slate-600">
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      className="hover:text-blue-600"
                    >
                      {c.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-[260px] px-5 py-3 text-xs text-slate-500">
                  {c.address || "—"}
                </td>
                <td className="px-5 py-3 text-right text-xs">
                  <span className="text-slate-500">{s?.count || 0} inv</span>
                  {s && s.due > 0 && (
                    <span className="ml-2 font-black text-amber-600">
                      {money(s.due)}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${c.name}`}
                      title="Edit"
                      onClick={() => onEdit(c)}
                      className={`${iconBtn} hover:bg-blue-50 hover:text-blue-600`}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${c.name}`}
                      title="Delete"
                      onClick={() => onDelete(c)}
                      className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {customers.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-14 text-center">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Users size={22} />
                </span>
                <p className="text-sm font-bold text-slate-700">
                  {searching ? "No matching customers" : "No customers yet"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {searching
                    ? "Try a different search."
                    : "Add your first customer to start creating invoices."}
                </p>
                {!searching && (
                  <button
                    type="button"
                    onClick={onAdd}
                    className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    <Plus size={14} /> Add customer
                  </button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceTable({
  onAdd,
  invoices,
  customers,
  searching,
  onEdit,
  onDelete,
  onMarkPaid,
  onPay,
  onPrint,
}: {
  onAdd: () => void;
  invoices: Invoice[];
  customers: Map<string, Customer>;
  searching: boolean;
  onEdit: (i: Invoice) => void;
  onDelete: (i: Invoice) => void;
  onMarkPaid: (i: Invoice) => void;
  onPay: (i: Invoice) => void;
  onPrint: (i: Invoice) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className={th}>Invoice</th>
            <th className={th}>Customer</th>
            <th className={th}>Issue / Due</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Total</th>
            <th className={`${th} text-right`}>Balance</th>
            <th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((i) => {
            const c = customers.get(i.customerId);
            const open = i.status !== "Paid" && i.status !== "Draft";
            return (
              <tr key={i.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText size={15} />
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      {i.number}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm font-bold text-slate-800">
                    {c?.name || "Unknown customer"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {c?.phone || c?.email || ""}
                  </p>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  <div>{i.issueDate}</div>
                  <div
                    className={`mt-0.5 ${isOverdue(i) ? "font-bold text-rose-600" : ""}`}
                  >
                    Due {i.dueDate}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <StatusPill status={isOverdue(i) ? "Overdue" : i.status} />
                </td>
                <td className="px-5 py-3 text-right text-sm font-black text-slate-900">
                  {money(totalsOf(i).total)}
                </td>
                <td
                  className={`px-5 py-3 text-right text-sm font-bold ${dueOf(i) > 0 ? "text-amber-600" : "text-slate-400"}`}
                >
                  {money(dueOf(i))}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    {open && (
                      <button
                        type="button"
                        title="Record payment"
                        aria-label="Record payment"
                        onClick={() => onPay(i)}
                        className={`${iconBtn} hover:bg-violet-50 hover:text-violet-600`}
                      >
                        <Banknote size={15} />
                      </button>
                    )}
                    {open && (
                      <button
                        type="button"
                        title="Mark paid"
                        aria-label="Mark paid"
                        onClick={() => onMarkPaid(i)}
                        className={`${iconBtn} hover:bg-emerald-50 hover:text-emerald-600`}
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Print / save PDF"
                      aria-label="Print invoice"
                      onClick={() => onPrint(i)}
                      className={`${iconBtn} hover:bg-slate-100 hover:text-slate-800`}
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      type="button"
                      title="Edit"
                      aria-label="Edit invoice"
                      onClick={() => onEdit(i)}
                      className={`${iconBtn} hover:bg-blue-50 hover:text-blue-600`}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      aria-label="Delete invoice"
                      onClick={() => onDelete(i)}
                      className={`${iconBtn} hover:bg-rose-50 hover:text-rose-600`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {invoices.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-14 text-center">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FileText size={22} />
                </span>
                <p className="text-sm font-bold text-slate-700">
                  {searching ? "No matching invoices" : "No invoices yet"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {searching
                    ? "Try a different search or filter."
                    : "Create your first invoice for a customer."}
                </p>
                {!searching && (
                  <button
                    type="button"
                    onClick={onAdd}
                    className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    <Plus size={14} /> Create invoice
                  </button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── Small components ───────────────────────── */

function StatusPill({ status }: { status: InvoiceStatus | "Overdue" }) {
  const styles = {
    Draft: "bg-slate-100 text-slate-600",
    Unpaid: "bg-amber-50 text-amber-700",
    Partial: "bg-violet-50 text-violet-700",
    Paid: "bg-emerald-50 text-emerald-700",
    Overdue: "bg-rose-50 text-rose-700",
  }[status];
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${styles}`}
    >
      {status}
    </span>
  );
}

function MiniStat({
  label,
  value,
  tone = "text-slate-900",
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className={`truncate text-xl font-black ${tone}`}>{value}</p>
        {sub && <p className="text-[11px] font-bold text-rose-600">{sub}</p>}
      </div>
    </div>
  );
}

function CustomerModal({
  form,
  setForm,
  error,
  editing,
  onClose,
  onSubmit,
}: {
  form: CustomerForm;
  setForm: Dispatch<SetStateAction<CustomerForm>>;
  error: string;
  editing: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const set = (k: keyof CustomerForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal
      title={editing ? "Edit customer" : "Add customer"}
      subtitle="Keep contact details ready for future invoices."
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <ErrorBox text={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <input
              autoFocus
              maxLength={80}
              value={form.name}
              onChange={set("name")}
              className={inputCls}
              placeholder="Customer name"
            />
          </Field>
          <Field label="Phone" hint="Bangladeshi mobile, e.g. 01712345678">
            <input
              type="tel"
              maxLength={16}
              value={form.phone}
              onChange={set("phone")}
              className={inputCls}
              placeholder="01XXXXXXXXX"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              maxLength={100}
              value={form.email}
              onChange={set("email")}
              className={inputCls}
              placeholder="customer@email.com"
            />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input
              maxLength={200}
              value={form.address}
              onChange={set("address")}
              className={inputCls}
              placeholder="Address"
            />
          </Field>
        </div>
        <Field label="Note">
          <textarea
            maxLength={300}
            value={form.note}
            onChange={set("note")}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Optional note"
          />
        </Field>
        <ModalActions
          onClose={onClose}
          submit={editing ? "Save changes" : "Add customer"}
        />
      </form>
    </Modal>
  );
}

function InvoiceModal({
  form,
  setForm,
  error,
  customers,
  editing,
  onClose,
  onSubmit,
  updateItem,
}: {
  form: InvoiceForm;
  setForm: Dispatch<SetStateAction<InvoiceForm>>;
  error: string;
  customers: Customer[];
  editing: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  updateItem: (
    id: string,
    f: "description" | "quantity" | "unitPrice",
    v: string,
  ) => void;
}) {
  const items = form.items.map((i) => ({
    id: i.id,
    description: i.description,
    quantity: num(i.quantity),
    unitPrice: num(i.unitPrice),
  }));
  const t = totalsOf({
    items,
    discount: num(form.discount),
    taxPercent: num(form.taxPercent),
  });
  const set = (k: keyof InvoiceForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal
      title={editing ? "Edit invoice" : "Create invoice"}
      subtitle="Add customer, items, dates, and payment."
      onClose={onClose}
      wide
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <ErrorBox text={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer" required>
            <select
              value={form.customerId}
              onChange={set("customerId")}
              className={inputCls}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` — ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex cursor-pointer items-end gap-2 pb-2.5 text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.draft}
              onChange={(e) =>
                setForm((f) => ({ ...f, draft: e.target.checked }))
              }
              className="h-4 w-4 cursor-pointer"
            />{" "}
            Save as draft (not counted in totals)
          </label>
          <Field label="Issue date">
            <input
              type="date"
              value={form.issueDate}
              onChange={set("issueDate")}
              className={inputCls}
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              min={form.issueDate}
              value={form.dueDate}
              onChange={set("dueDate")}
              className={inputCls}
            />
          </Field>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-black text-slate-800">Items</p>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  items: [
                    ...f.items,
                    {
                      id: uid(),
                      description: "",
                      quantity: "1",
                      unitPrice: "",
                    },
                  ],
                }))
              }
              className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              + Add item
            </button>
          </div>
          <div className="hidden gap-2 px-1 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:grid sm:grid-cols-[1fr_80px_110px_100px_38px]">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          <div className="space-y-2">
            {form.items.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-[1fr_80px_110px_100px_38px] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
              >
                <input
                  value={item.description}
                  maxLength={120}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                  placeholder={`Item ${idx + 1} (e.g. Banner printing)`}
                  aria-label={`Item ${idx + 1} description`}
                  className={`${inputCls} col-span-2 sm:col-span-1`}
                />
                <input
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, "quantity", e.target.value)
                  }
                  inputMode="decimal"
                  placeholder="Qty"
                  aria-label="Quantity"
                  className={inputCls}
                />
                <input
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(item.id, "unitPrice", e.target.value)
                  }
                  inputMode="decimal"
                  placeholder="Unit price"
                  aria-label="Unit price"
                  className={inputCls}
                />
                <span className="text-right text-xs font-bold text-slate-600">
                  {money(num(item.quantity) * num(item.unitPrice))}
                </span>
                <button
                  type="button"
                  aria-label="Remove item"
                  disabled={form.items.length === 1}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      items: f.items.filter((r) => r.id !== item.id),
                    }))
                  }
                  className="h-[38px] cursor-pointer rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={14} className="mx-auto" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Discount (৳)">
            <input
              value={form.discount}
              onChange={set("discount")}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <Field label="Tax (%)">
            <input
              value={form.taxPercent}
              onChange={set("taxPercent")}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <Field
            label="Amount paid (৳)"
            hint={
              !form.draft && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, paidAmount: String(t.total) }))
                  }
                  className="cursor-pointer font-bold text-blue-600 hover:text-blue-700"
                >
                  Mark fully paid ({money(t.total)})
                </button>
              )
            }
          >
            <input
              value={form.paidAmount}
              onChange={set("paidAmount")}
              inputMode="decimal"
              disabled={form.draft}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            maxLength={300}
            value={form.notes}
            onChange={set("notes")}
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Optional notes (shown on the printed invoice)"
          />
        </Field>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="ml-auto grid max-w-xs gap-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <strong>{money(t.subtotal)}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Discount</span>
              <strong>-{money(t.discount)}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <strong>{money(t.tax)}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-slate-900">
              <span>Total</span>
              <strong>{money(t.total)}</strong>
            </div>
            {!form.draft && (
              <div className="flex justify-between text-slate-500">
                <span>Balance due</span>
                <strong>
                  {money(Math.max(t.total - num(form.paidAmount), 0))}
                </strong>
              </div>
            )}
          </div>
        </div>
        <ModalActions
          onClose={onClose}
          submit={editing ? "Save changes" : "Create invoice"}
        />
      </form>
    </Modal>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={17} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  action,
  onClose,
}: {
  title: string;
  message: string;
  action: () => void;
  onClose: () => void;
}) {
  const info = title.startsWith("Can't");
  return (
    <Modal title={title} subtitle="" onClose={onClose}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle size={18} />
        </span>
        <p className="pt-1.5 text-sm text-slate-600">{message}</p>
      </div>
      <div className="flex justify-end gap-2 pt-5">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          {info ? "OK" : "Cancel"}
        </button>
        {!info && (
          <button
            type="button"
            onClick={() => {
              action();
              onClose();
            }}
            className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700"
          >
            Delete
          </button>
        )}
      </div>
    </Modal>
  );
}

function ModalActions({
  onClose,
  submit,
}: {
  onClose: () => void;
  submit: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="cursor-pointer rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
      >
        {submit}
      </button>
    </div>
  );
}
function ErrorBox({ text }: { text: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
    >
      {text}
    </div>
  );
}
function Field({
  label,
  children,
  required,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1 text-xs font-bold text-slate-700">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-[11px] font-medium text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}
