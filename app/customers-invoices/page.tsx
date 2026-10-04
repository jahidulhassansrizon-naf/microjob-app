"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  FileText,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";

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
  notes: string;
  items: InvoiceItem[];
  createdAt: string;
};

const CUSTOMER_KEY = "sohozkaj:customers:v1";
const INVOICE_KEY = "sohozkaj:invoices:v1";

const blankCustomer = { name: "", phone: "", email: "", address: "", note: "" };
const today = () => new Date().toISOString().slice(0, 10);
const money = (value: number) => `৳${Math.round(value).toLocaleString("en-BD")}`;

function scope() {
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

function key(base: string) {
  return `${base}:${scope()}`;
}

function invoiceTotal(invoice: Invoice) {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = Math.min(Math.max(invoice.discount || 0, 0), subtotal);
  const taxable = subtotal - discount;
  const tax = taxable * ((invoice.taxPercent || 0) / 100);
  return { subtotal, discount, tax, total: taxable + tax };
}

export default function CustomersInvoicesPage() {
  const [tab, setTab] = useState<"customers" | "invoices">("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [customerModal, setCustomerModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState(blankCustomer);
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: "",
    issueDate: today(),
    dueDate: today(),
    status: "Unpaid" as InvoiceStatus,
    taxPercent: "0",
    discount: "0",
    notes: "",
    items: [{ id: "1", description: "", quantity: "1", unitPrice: "" }],
  });
  const [error, setError] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | InvoiceStatus>("all");

  useEffect(() => {
    try {
      const rawCustomers = localStorage.getItem(key(CUSTOMER_KEY));
      const rawInvoices = localStorage.getItem(key(INVOICE_KEY));
      if (rawCustomers) setCustomers(JSON.parse(rawCustomers) as Customer[]);
      if (rawInvoices) setInvoices(JSON.parse(rawInvoices) as Invoice[]);
    } catch {
      setCustomers([]);
      setInvoices([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(key(CUSTOMER_KEY), JSON.stringify(customers));
    localStorage.setItem(key(INVOICE_KEY), JSON.stringify(invoices));
  }, [customers, invoices, loaded]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => !q || [c.name, c.phone, c.email, c.address].join(" ").toLowerCase().includes(q));
  }, [customers, query]);

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices
      .filter((invoice) => invoiceFilter === "all" || invoice.status === invoiceFilter)
      .filter((invoice) => {
        const customer = customers.find((c) => c.id === invoice.customerId);
        return !q || [invoice.number, customer?.name || "", invoice.status].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [customers, invoices, invoiceFilter, query]);

  const invoiceStats = useMemo(() => {
    const totals = invoices.map(invoiceTotal);
    const billed = totals.reduce((sum, row) => sum + row.total, 0);
    const paid = invoices.filter((invoice) => invoice.status === "Paid").reduce((sum, invoice) => sum + invoiceTotal(invoice).total, 0);
    return { billed, paid, due: billed - paid };
  }, [invoices]);

  const openNewCustomer = () => {
    setCustomerForm(blankCustomer);
    setEditingCustomerId(null);
    setError("");
    setCustomerModal(true);
  };

  const editCustomer = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setCustomerForm({ name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, note: customer.note });
    setError("");
    setCustomerModal(true);
  };

  const saveCustomer = (event: FormEvent) => {
    event.preventDefault();
    if (!customerForm.name.trim()) return setError("Customer name is required.");
    if (!customerForm.phone.trim() && !customerForm.email.trim()) return setError("Add at least a phone number or email.");
    if (editingCustomerId) {
      setCustomers((current) => current.map((c) => c.id === editingCustomerId ? { ...c, ...customerForm, name: customerForm.name.trim() } : c));
    } else {
      setCustomers((current) => [{ id: crypto.randomUUID(), ...customerForm, name: customerForm.name.trim(), createdAt: new Date().toISOString() }, ...current]);
    }
    setCustomerModal(false);
    setEditingCustomerId(null);
    setCustomerForm(blankCustomer);
    setError("");
  };

  const deleteCustomer = (id: string) => {
    const hasInvoices = invoices.some((invoice) => invoice.customerId === id);
    if (hasInvoices) return window.alert("This customer has invoices. Delete or reassign those invoices first.");
    if (!window.confirm("Delete this customer?")) return;
    setCustomers((current) => current.filter((c) => c.id !== id));
  };

  const newInvoiceNumber = () => {
    const next = invoices.length + 1;
    return `INV-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
  };

  const openNewInvoice = () => {
    setEditingInvoiceId(null);
    setInvoiceForm({ customerId: customers[0]?.id || "", issueDate: today(), dueDate: today(), status: "Unpaid", taxPercent: "0", discount: "0", notes: "", items: [{ id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" }] });
    setError("");
    setInvoiceModal(true);
  };

  const editInvoice = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id);
    setInvoiceForm({
      customerId: invoice.customerId,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      taxPercent: String(invoice.taxPercent),
      discount: String(invoice.discount),
      notes: invoice.notes,
      items: invoice.items.map((item) => ({ id: item.id, description: item.description, quantity: String(item.quantity), unitPrice: String(item.unitPrice) })),
    });
    setError("");
    setInvoiceModal(true);
  };

  const updateItem = (id: string, field: "description" | "quantity" | "unitPrice", value: string) => {
    setInvoiceForm((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  };

  const saveInvoice = (event: FormEvent) => {
    event.preventDefault();
    if (!invoiceForm.customerId) return setError("Select a customer first.");
    const items: InvoiceItem[] = invoiceForm.items
      .map((item) => ({ id: item.id, description: item.description.trim(), quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) }))
      .filter((item) => item.description && item.quantity > 0 && item.unitPrice >= 0);
    if (!items.length) return setError("Add at least one valid invoice item.");

    const payload: Invoice = {
      id: editingInvoiceId || crypto.randomUUID(),
      number: editingInvoiceId ? invoices.find((i) => i.id === editingInvoiceId)?.number || newInvoiceNumber() : newInvoiceNumber(),
      customerId: invoiceForm.customerId,
      issueDate: invoiceForm.issueDate,
      dueDate: invoiceForm.dueDate,
      status: invoiceForm.status,
      taxPercent: Math.max(0, Number(invoiceForm.taxPercent) || 0),
      discount: Math.max(0, Number(invoiceForm.discount) || 0),
      notes: invoiceForm.notes.trim(),
      items,
      createdAt: editingInvoiceId ? invoices.find((i) => i.id === editingInvoiceId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    if (editingInvoiceId) setInvoices((current) => current.map((invoice) => invoice.id === editingInvoiceId ? payload : invoice));
    else setInvoices((current) => [payload, ...current]);
    setInvoiceModal(false);
    setEditingInvoiceId(null);
    setError("");
  };

  const deleteInvoice = (id: string) => {
    if (!window.confirm("Delete this invoice?")) return;
    setInvoices((current) => current.filter((invoice) => invoice.id !== id));
  };

  const markPaid = (id: string) => setInvoices((current) => current.map((invoice) => invoice.id === id ? { ...invoice, status: "Paid" } : invoice));

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A]">
      <DashboardNavbar />
      <main className="mx-auto max-w-[1220px] px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/dashboard" className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"><ArrowLeft size={14} /> Back to dashboard</Link>
            <div className="flex items-center gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100"><Users size={20} /></span><div><h1 className="text-2xl font-black tracking-tight sm:text-3xl">Customers &amp; Invoices</h1><p className="mt-1 text-sm font-medium text-slate-500">Keep customer details, create invoices, and track what is paid or due.</p></div></div>
          </div>
          <button type="button" onClick={() => tab === "customers" ? openNewCustomer() : openNewInvoice()} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"><Plus size={15} /> {tab === "customers" ? "Add customer" : "Create invoice"}</button>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-3"><MiniStat label="Customers" value={String(customers.length)} /><MiniStat label="Billed" value={money(invoiceStats.billed)} /><MiniStat label="Paid" value={money(invoiceStats.paid)} /><MiniStat label="Due" value={money(Math.max(invoiceStats.due, 0))} /></div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => { setTab("customers"); setQuery(""); }} className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold ${tab === "customers" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Customers</button><button type="button" onClick={() => { setTab("invoices"); setQuery(""); }} className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold ${tab === "invoices" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Invoices</button></div>
            <div className="flex flex-wrap gap-2"><div className="relative min-w-0 flex-1 sm:min-w-[280px]"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === "customers" ? "Search customers..." : "Search invoice number or customer..."} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white" /></div>{tab === "invoices" && <select value={invoiceFilter} onChange={(e) => setInvoiceFilter(e.target.value as "all" | InvoiceStatus)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"><option value="all">All statuses</option><option>Draft</option><option>Unpaid</option><option>Partial</option><option>Paid</option></select>}</div>
          </div>

          {tab === "customers" ? <CustomerTable customers={filteredCustomers} onEdit={editCustomer} onDelete={deleteCustomer} /> : <InvoiceTable invoices={filteredInvoices} customers={customers} onEdit={editInvoice} onDelete={deleteInvoice} onMarkPaid={markPaid} />}
        </section>
      </main>

      {customerModal && <CustomerModal form={customerForm} setForm={setCustomerForm} error={error} editing={Boolean(editingCustomerId)} onClose={() => setCustomerModal(false)} onSubmit={saveCustomer} />}
      {invoiceModal && <InvoiceModal form={invoiceForm} setForm={setInvoiceForm} error={error} customers={customers} editing={Boolean(editingInvoiceId)} onClose={() => setInvoiceModal(false)} onSubmit={saveInvoice} updateItem={updateItem} />}
    </div>
  );
}

function CustomerTable({ customers, onEdit, onDelete }: { customers: Customer[]; onEdit: (customer: Customer) => void; onDelete: (id: string) => void }) {
  return <div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Address</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{customers.map((customer) => <tr key={customer.id} className="hover:bg-slate-50/70"><td className="px-5 py-3"><p className="text-sm font-black text-slate-800">{customer.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{customer.note || "No note"}</p></td><td className="px-5 py-3 text-xs font-semibold text-slate-600">{customer.phone || "—"}</td><td className="px-5 py-3 text-xs text-slate-600">{customer.email || "—"}</td><td className="max-w-[260px] px-5 py-3 text-xs text-slate-500">{customer.address || "—"}</td><td className="px-5 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={() => onEdit(customer)} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Edit3 size={15} /></button><button type="button" onClick={() => onDelete(customer.id)} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button></div></td></tr>)}{customers.length === 0 && <tr><td colSpan={5} className="px-5 py-14 text-center"><p className="text-sm font-bold text-slate-700">No customers yet</p><p className="mt-1 text-xs text-slate-500">Add your first customer to start creating invoices.</p></td></tr>}</tbody></table></div>;
}

function InvoiceTable({ invoices, customers, onEdit, onDelete, onMarkPaid }: { invoices: Invoice[]; customers: Customer[]; onEdit: (invoice: Invoice) => void; onDelete: (id: string) => void; onMarkPaid: (id: string) => void }) {
  return <div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Issue / Due</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{invoices.map((invoice) => { const customer = customers.find((c) => c.id === invoice.customerId); const total = invoiceTotal(invoice).total; return <tr key={invoice.id} className="hover:bg-slate-50/70"><td className="px-5 py-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FileText size={15} /></span><span className="text-sm font-black text-slate-800">{invoice.number}</span></div></td><td className="px-5 py-3"><p className="text-sm font-bold text-slate-800">{customer?.name || "Unknown customer"}</p><p className="text-[11px] text-slate-400">{customer?.phone || customer?.email || ""}</p></td><td className="px-5 py-3 text-xs text-slate-500"><div>{invoice.issueDate}</div><div className="mt-0.5">Due {invoice.dueDate}</div></td><td className="px-5 py-3"><StatusPill status={invoice.status} /></td><td className="px-5 py-3 text-right text-sm font-black text-slate-900">{money(total)}</td><td className="px-5 py-3"><div className="flex justify-end gap-1">{invoice.status !== "Paid" && <button type="button" onClick={() => onMarkPaid(invoice.id)} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600" title="Mark paid"><CheckCircle2 size={15} /></button>}<button type="button" onClick={() => onEdit(invoice)} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Edit3 size={15} /></button><button type="button" onClick={() => onDelete(invoice.id)} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button></div></td></tr>; })}{invoices.length === 0 && <tr><td colSpan={6} className="px-5 py-14 text-center"><p className="text-sm font-bold text-slate-700">No invoices yet</p><p className="mt-1 text-xs text-slate-500">Create an invoice after adding a customer.</p></td></tr>}</tbody></table></div>;
}

function StatusPill({ status }: { status: InvoiceStatus }) { const styles = { Draft: "bg-slate-100 text-slate-600", Unpaid: "bg-amber-50 text-amber-700", Partial: "bg-violet-50 text-violet-700", Paid: "bg-emerald-50 text-emerald-700" }[status]; return <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${styles}`}>{status}</span>; }
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{value}</p></div>; }

function CustomerModal({ form, setForm, error, editing, onClose, onSubmit }: { form: typeof blankCustomer; setForm: (value: typeof blankCustomer) => void; error: string; editing: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  return <Modal title={editing ? "Edit customer" : "Add customer"} subtitle="Keep contact details ready for future invoices." onClose={onClose}><form onSubmit={onSubmit} className="space-y-4">{error && <ErrorBox text={error} />}<div className="grid gap-4 sm:grid-cols-2"><Field label="Name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Customer name" /></Field><Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="01XXXXXXXXX" /></Field><Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="customer@email.com" /></Field><Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" placeholder="Address" /></Field></div><Field label="Note"><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="input resize-none" placeholder="Optional note" /></Field><ModalActions onClose={onClose} submit={editing ? "Save changes" : "Add customer"} /></form></Modal>;
}

function InvoiceModal({ form, setForm, error, customers, editing, onClose, onSubmit, updateItem }: { form: { customerId: string; issueDate: string; dueDate: string; status: InvoiceStatus; taxPercent: string; discount: string; notes: string; items: { id: string; description: string; quantity: string; unitPrice: string }[] }; setForm: React.Dispatch<React.SetStateAction<typeof form>>; error: string; customers: Customer[]; editing: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void; updateItem: (id: string, field: "description" | "quantity" | "unitPrice", value: string) => void }) {
  const subtotal = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const discount = Math.min(Math.max(Number(form.discount) || 0, 0), subtotal);
  const tax = (subtotal - discount) * ((Number(form.taxPercent) || 0) / 100);
  const total = subtotal - discount + tax;
  return <Modal title={editing ? "Edit invoice" : "Create invoice"} subtitle="Add customer, items, dates, and status." onClose={onClose} wide><form onSubmit={onSubmit} className="space-y-4">{error && <ErrorBox text={error} />}<div className="grid gap-4 sm:grid-cols-2"><Field label="Customer"><select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="input"><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })} className="input"><option>Draft</option><option>Unpaid</option><option>Partial</option><option>Paid</option></select></Field><Field label="Issue date"><input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="input" /></Field><Field label="Due date"><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" /></Field></div><div><div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold text-slate-700">Items</p><button type="button" onClick={() => setForm({ ...form, items: [...form.items, { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" }] })} className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700">+ Add item</button></div><div className="space-y-2">{form.items.map((item, index) => <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_90px_120px_38px]"><input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder={`Item ${index + 1}`} className="input" /><input value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} inputMode="decimal" placeholder="Qty" className="input" /><input value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)} inputMode="decimal" placeholder="Unit price" className="input" /><button type="button" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((row) => row.id !== item.id) })} className="cursor-pointer rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={14} className="mx-auto" /></button></div>)}</div></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Discount (৳)"><input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} inputMode="decimal" className="input" /></Field><Field label="Tax (%)"><input value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: e.target.value })} inputMode="decimal" className="input" /></Field></div><Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input resize-none" placeholder="Optional notes" /></Field><div className="rounded-xl bg-slate-50 p-4"><div className="ml-auto grid max-w-xs gap-2 text-sm"><div className="flex justify-between text-slate-500"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="flex justify-between text-slate-500"><span>Discount</span><strong>-{money(discount)}</strong></div><div className="flex justify-between text-slate-500"><span>Tax</span><strong>{money(tax)}</strong></div><div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-900"><span>Total</span><strong>{money(total)}</strong></div></div></div><ModalActions onClose={onClose} submit={editing ? "Save changes" : "Create invoice"} /></form></Modal>;
}

function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) { return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"><div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ${wide ? "max-w-3xl" : "max-w-lg"}`}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4"><div><h2 className="text-lg font-black">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div><button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={17} /></button></div><div className="p-5">{children}</div></div></div>; }
function ModalActions({ onClose, submit }: { onClose: () => void; submit: string }) { return <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" className="cursor-pointer rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">{submit}</button></div>; }
function ErrorBox({ text }: { text: string }) { return <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{text}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-bold text-slate-700"><span className="mb-1.5 block">{label}</span>{children}</label>; }
