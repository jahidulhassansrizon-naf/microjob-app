"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Edit3,
  ExternalLink,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";

type WhatsAppContact = {
  id: string;
  name: string;
  number: string;
  role: string;
  availability: string;
  message: string;
  note: string;
  createdAt: string;
};

const STORAGE_BASE = "sohozkaj:whatsapp-support:v1";
const blankForm = {
  name: "",
  number: "",
  role: "Customer Support",
  availability: "Sun-Thu, 10:00 AM - 8:00 PM",
  message: "Hello, I need support with my SohozKaj account.",
  note: "",
};

function userScopeKey() {
  if (typeof window === "undefined") return "guest";
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "guest";
    const user = JSON.parse(raw) as {
      id?: string;
      _id?: string;
      email?: string;
      phoneNumber?: string;
    };
    return user.id || user._id || user.email || user.phoneNumber || "guest";
  } catch {
    return "guest";
  }
}

function storageKey() {
  return `${STORAGE_BASE}:${userScopeKey()}`;
}

function cleanWhatsAppNumber(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function waHref(number: string, message: string) {
  const clean = cleanWhatsAppNumber(number);
  if (!clean) return "#";
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export default function WhatsAppSupportPage() {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) setContacts(JSON.parse(raw) as WhatsAppContact[]);
    } catch {
      setContacts([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey(), JSON.stringify(contacts));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) =>
      [contact.name, contact.number, contact.role, contact.availability, contact.note]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [contacts, query]);

  const resetForm = () => {
    setForm(blankForm);
    setEditingId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");

    if (!form.name.trim()) {
      setNotice("Please enter the WhatsApp contact name.");
      return;
    }

    const cleanNumber = cleanWhatsAppNumber(form.number);
    if (cleanNumber.length < 8) {
      setNotice("Please enter a valid WhatsApp number with country code.");
      return;
    }

    if (editingId) {
      setContacts((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...form,
                number: cleanNumber,
              }
            : item,
        ),
      );
      setNotice("WhatsApp contact updated successfully.");
    } else {
      const newContact: WhatsAppContact = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...form,
        number: cleanNumber,
        createdAt: new Date().toISOString(),
      };
      setContacts((current) => [newContact, ...current]);
      setNotice("WhatsApp contact saved successfully.");
    }

    resetForm();
  };

  const editContact = (contact: WhatsAppContact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      number: contact.number,
      role: contact.role,
      availability: contact.availability,
      message: contact.message,
      note: contact.note,
    });
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteContact = (id: string) => {
    if (!window.confirm("Delete this WhatsApp support contact?")) return;
    setContacts((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setNotice("WhatsApp contact deleted.");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <DashboardNavbar />

      <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/dashboard"
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-[#2563EB]"
        >
          <ArrowLeft size={14} />
          Back to dashboard
        </Link>

        <div className="mt-5 flex flex-col gap-5">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                    <MessageCircle size={21} />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                      WhatsApp Support
                    </p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      Manage support contacts
                    </h1>
                  </div>
                </div>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                  Save your client or support team WhatsApp details here. Each contact
                  can have a role, availability, default message and notes, and you can
                  open a chat directly from the page.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                <Check size={15} />
                {contacts.length} contact{contacts.length === 1 ? "" : "s"} saved
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px,1fr]">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">
                    {editingId ? "Edit contact" : "Add contact"}
                  </p>
                  <h2 className="mt-1 text-lg font-black text-slate-900">
                    {editingId ? "Update WhatsApp details" : "New WhatsApp contact"}
                  </h2>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Cancel editing"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">Name</label>
                  <div className="relative mt-1.5">
                    <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      placeholder="e.g. Support Team"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">WhatsApp number</label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      value={form.number}
                      onChange={(event) => setForm({ ...form, number: event.target.value })}
                      placeholder="8801XXXXXXXXX"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    Include the country code for the best WhatsApp link.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Role</label>
                    <input
                      value={form.role}
                      onChange={(event) => setForm({ ...form, role: event.target.value })}
                      placeholder="Customer Support"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Availability</label>
                    <input
                      value={form.availability}
                      onChange={(event) => setForm({ ...form, availability: event.target.value })}
                      placeholder="Sun-Thu, 10:00 AM - 8:00 PM"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Default WhatsApp message</label>
                  <textarea
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    rows={3}
                    placeholder="Hello, I need help with..."
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Internal note</label>
                  <textarea
                    value={form.note}
                    onChange={(event) => setForm({ ...form, note: event.target.value })}
                    rows={2}
                    placeholder="Optional note..."
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  />
                </div>

                {notice && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700">
                    {notice}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="submit"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    {editingId ? <Save size={15} /> : <Plus size={15} />}
                    {editingId ? "Update contact" : "Save contact"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <X size={15} />
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    Saved contacts
                  </p>
                  <h2 className="mt-1 text-lg font-black text-slate-900">
                    WhatsApp support list
                  </h2>
                </div>

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search contacts..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none transition focus:border-[#2563EB] sm:w-52"
                />
              </div>

              <div className="mt-5 space-y-3">
                {filteredContacts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center">
                    <MessageCircle className="mx-auto text-slate-300" size={28} />
                    <p className="mt-3 text-sm font-bold text-slate-700">
                      No WhatsApp contacts found
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      Add a support or client WhatsApp number from the form.
                    </p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-black text-slate-900">
                              {contact.name}
                            </h3>
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                              {contact.role}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <Phone size={12} /> {contact.number}
                            </span>
                            <span>{contact.availability}</span>
                          </div>

                          {contact.note && (
                            <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                              {contact.note}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <a
                            href={waHref(contact.number, contact.message)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700"
                          >
                            <MessageCircle size={13} />
                            Open WhatsApp
                            <ExternalLink size={11} />
                          </a>
                          <button
                            type="button"
                            onClick={() => editContact(contact)}
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                            aria-label={`Edit ${contact.name}`}
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteContact(contact.id)}
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-red-100 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                            aria-label={`Delete ${contact.name}`}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-inset ring-slate-200">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Default message
                        </p>
                        <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                          {contact.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
