"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, Clipboard, Copy, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";

type WalletMethod = "Nagad" | "bKash";
type PaymentInfo = {
  plan: { id: string; name: string; days: number; price: number };
  paymentNumbers: Record<WalletMethod, string>;
  pending: null | {
    id: string;
    planName: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    senderNumber: string;
    submittedAt: string | null;
    reviewStatus: string;
  };
};
type SubmittedPayment = {
  id: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  senderNumber: string;
  submittedAt: string | null;
  reviewStatus: string;
};

const walletStyles: Record<WalletMethod, string> = {
  Nagad: "border-orange-200 bg-orange-50 text-orange-800",
  bKash: "border-pink-200 bg-pink-50 text-pink-800",
};

function formatMoney(amount: number) {
  return `৳${Number(amount || 0).toLocaleString("en-BD")}`;
}

export default function ManualPaymentPage() {
  const [planId, setPlanId] = useState("1-month");
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [method, setMethod] = useState<WalletMethod>("Nagad");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedPayment | null>(null);

  const loadInfo = useCallback(async (requestedPlanId: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/payment/manual-submit?plan=${encodeURIComponent(requestedPlanId)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) throw new Error(data?.message || "পেমেন্টের তথ্য লোড করা যায়নি।");
      setInfo(data as PaymentInfo);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "পেমেন্টের তথ্য লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestedPlanId = new URLSearchParams(window.location.search).get("plan") || "1-month";
    setPlanId(requestedPlanId);
    void loadInfo(requestedPlanId);
  }, [loadInfo]);

  const copyNumber = async () => {
    const account = info?.paymentNumbers?.[method] || "";
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("নম্বর কপি করা যায়নি। নম্বরটি হাতে কপি করুন।");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/payment/manual-submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, paymentMethod: method, senderNumber, transactionId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) throw new Error(data?.message || "পেমেন্ট জমা দেওয়া যায়নি।");
      const nextSubmitted: SubmittedPayment = data.subscription;
      setSubmitted(nextSubmitted);
      setNotice(data.message || "পেমেন্টের তথ্য জমা হয়েছে।");
      setTransactionId("");
      setSenderNumber("");
      await loadInfo(planId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "পেমেন্ট জমা দেওয়া যায়নি।");
    } finally {
      setSubmitting(false);
    }
  };

  const accountNumber = info?.paymentNumbers?.[method] || "";
  const configMissing = !accountNumber;
  const reviewPending = Boolean(info?.pending) || Boolean(submitted);

  return (
    <div className="min-h-screen text-slate-900" style={{ backgroundImage: "radial-gradient(ellipse at 8% 0%, rgba(219,234,254,0.8), transparent 34%), radial-gradient(ellipse at 100% 20%, rgba(224,231,255,0.65), transparent 32%), linear-gradient(180deg, #f8faff 0%, #f5f7fb 100%)" }}>
      <DashboardNavbar />
      <main className="font-bengali-ui mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/subscription" className="inline-flex items-center gap-2 rounded-xl px-1 py-1 text-base font-extrabold text-blue-700 transition hover:text-blue-900 sm:text-lg">
          <ArrowLeft size={16} /> সাবস্ক্রিপশনে ফিরে যান
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <section className="rounded-[28px] border border-white/90 bg-white/95 p-5 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.34)] backdrop-blur sm:p-8">
            <div className="flex items-start gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"><CreditCard size={26} /></span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 sm:text-sm">SOHOJ HUB CHECKOUT</p>
                <h1 className="mt-1.5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">পেমেন্ট সম্পন্ন করুন</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">সঠিক নম্বরে টাকা পাঠিয়ে আপনার Transaction ID জমা দিন। পেমেন্টের তথ্য অ্যাডমিন যাচাই করে অনুমোদন দিলেই সাবস্ক্রিপশন চালু হবে।</p>
              </div>
            </div>

            {loading ? (
              <div aria-busy="true" className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-base text-slate-700"><LoaderCircle size={18} className="animate-spin" /> পেমেন্টের তথ্য লোড হচ্ছে...</div>
            ) : !info ? (
              <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-base font-semibold leading-7 text-red-700">{error || "পেমেন্টের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।"}</div>
            ) : (
              <>
                <div className="mt-7 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-inner sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-blue-700 sm:text-base">নির্বাচিত প্ল্যান</p>
                      <p className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">{info.plan.name} · {info.plan.days} দিন</p>
                    </div>
                    <p className="text-3xl font-black tracking-tight text-blue-700 sm:text-4xl">{formatMoney(info.plan.price)}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">পেমেন্ট ম্যানুয়ালি যাচাই করা হয়। শুধু TrxID জমা দিলেই অ্যাক্সেস চালু হবে না।</p>
                </div>

                {!reviewPending ? (
                  <>
                  <div className="mt-6">
                    <h2 className="text-lg font-black text-slate-950 sm:text-xl">কোন মাধ্যমে পেমেন্ট করবেন?</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {(["Nagad", "bKash"] as WalletMethod[]).map((wallet) => (
                        <button key={wallet} type="button" onClick={() => { setMethod(wallet); setCopied(false); setError(""); }} aria-pressed={method === wallet}
                          className={`min-h-24 rounded-2xl border-2 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${walletStyles[wallet]} ${method === wallet ? "ring-4 ring-blue-100 shadow-md" : "border-slate-200 bg-white text-slate-700"}`} >
                          <span className="flex items-center justify-between gap-2 text-lg font-black sm:text-xl">{wallet}{method === wallet && <CheckCircle2 size={18} />}</span>
                          <span className="mt-1.5 block text-sm font-semibold opacity-80 sm:text-base">Send Money</span>
                        </button>
                      ))}
                    </div>
                  </div>
  
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                    <p className="text-sm font-extrabold text-slate-500 sm:text-base">{method} নম্বর</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="min-w-0 flex-1 break-all text-2xl font-black tracking-wide text-slate-950 sm:text-3xl">{accountNumber || "সার্ভারে নম্বর সেট করা নেই"}</p>
                      <button type="button" onClick={() => void copyNumber()} disabled={!accountNumber} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:text-base">
                        {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "কপি হয়েছে" : "Copy"}
                      </button>
                    </div>
                    {configMissing && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-bold leading-6 text-amber-800 sm:text-base">সার্ভারের environment settings-এ {method} নম্বর সেট করা নেই। নম্বর সেট না করা পর্যন্ত পেমেন্ট জমা দেওয়া যাবে না।</p>}
                    <ol className="mt-5 grid gap-3 text-base leading-7 text-slate-700">
                      <li className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-sm">১</span><span>{method} অ্যাপ খুলুন এবং <strong>Send Money</strong> নির্বাচন করুন।</span></li>
                      <li className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-sm">২</span><span>উপরের নম্বরে ঠিক <strong>{formatMoney(info.plan.price)}</strong> পাঠান।</span></li>
                      <li className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-sm">৩</span><span>পেমেন্ট সফল হলে SMS/অ্যাপ থেকে TrxID সংগ্রহ করে নিচের ফর্মে দিন।</span></li>
                    </ol>
                  </div>
  
                  <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <div>
                      <label htmlFor="senderNumber" className="mb-2 block text-base font-extrabold text-slate-900 sm:text-lg">যে নম্বর থেকে টাকা পাঠিয়েছেন</label>
                      <input id="senderNumber" inputMode="tel" autoComplete="tel" value={senderNumber} onChange={(event) => setSenderNumber(event.target.value)} placeholder="01XXXXXXXXX" required maxLength={20}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-lg" />
                    </div>
                    <div>
                      <label htmlFor="transactionId" className="mb-2 block text-base font-extrabold text-slate-900 sm:text-lg">Transaction ID (TrxID)</label>
                      <input id="transactionId" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={transactionId} onChange={(event) => setTransactionId(event.target.value.slice(0, 10))} placeholder="যেমন: BIK7A8G9XZ" required minLength={8} maxLength={10} pattern="[A-Za-z0-9]{8,10}" title="TrxID অবশ্যই ৮–১০টি ইংরেজি অক্ষর/সংখ্যার হতে হবে।"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 font-mono text-base uppercase tracking-wider outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-lg" />
                      <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">TrxID অবশ্যই ৮–১০টি ইংরেজি অক্ষর/সংখ্যার হতে হবে। ৪–৫ অক্ষরের ID গ্রহণ করা হবে না। SMS-এ যেভাবে আছে, সেভাবেই লিখুন।</p>
                    </div>
                    {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-base font-bold leading-6 text-red-700">{error}</p>}
                    {notice && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-base font-bold leading-6 text-emerald-800">{notice}</p>}
                    <button type="submit" disabled={submitting || configMissing} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-base font-black text-white shadow-[0_16px_30px_-14px_rgba(37,99,235,0.8)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_38px_-14px_rgba(37,99,235,0.85)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-55 sm:text-lg">
                      {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Clipboard size={17} />}{submitting ? "জমা হচ্ছে..." : "পেমেন্টের তথ্য জমা দিন"}
                    </button>
                  </form>
                  </>
                ) : (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 text-base leading-7 text-amber-950 shadow-sm sm:p-6 sm:text-lg">
                    <strong className="block text-lg font-black sm:text-xl">আপনার পেমেন্ট রিভিউতে আছে</strong>
                    একই সময়ে আরেকটি পেমেন্ট পাঠাবেন না। অ্যাডমিন যাচাই শেষ হলে সাবস্ক্রিপশন পেজে অবস্থা আপডেট হবে।
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="space-y-4">
            {submitted && (
              <section className="rounded-[28px] border border-emerald-200/90 bg-gradient-to-br from-white via-white to-emerald-50/70 p-5 shadow-[0_20px_56px_-34px_rgba(5,150,105,0.42)] sm:p-7">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={23} />
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">পেমেন্টের তথ্য জমা হয়েছে</h2>
                    <p className="mt-2 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">আপনার পেমেন্টের তথ্য অ্যাডমিন যাচাই করবেন। অনুমোদন না হওয়া পর্যন্ত পেইড টুলের অ্যাক্সেস চালু হবে না।</p>
                  </div>
                </div>
                <dl className="mt-5 space-y-3 rounded-2xl border border-emerald-100 bg-white/90 p-4 text-base sm:p-5">
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">পেমেন্ট</dt><dd className="font-bold">{submitted.paymentMethod}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">TrxID</dt><dd className="break-all text-right font-bold">{submitted.transactionId}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">পরিমাণ</dt><dd className="font-bold">{formatMoney(submitted.amount)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">অবস্থা</dt><dd className="font-bold text-amber-700">রিভিউ চলছে</dd></div>
                </dl>
                <Link href="/subscription" className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-extrabold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/60 sm:text-lg">সাবস্ক্রিপশন পেজে যান</Link>
              </section>
            )}

            {info?.pending && !submitted && (
              <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3 text-amber-800"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100"><ShieldCheck size={22} /></span><h2 className="text-lg font-black sm:text-xl">আপনার একটি পেমেন্ট রিভিউতে আছে</h2></div>
                <p className="mt-3 text-base leading-7 text-amber-900/90 sm:text-lg">TrxID: <strong className="break-all">{info.pending.transactionId || "—"}</strong>. অ্যাডমিন যাচাই শেষ না হওয়া পর্যন্ত অপেক্ষা করুন।</p>
              </section>
            )}

            <section className="rounded-[28px] border border-white bg-white/95 p-5 shadow-[0_18px_48px_-32px_rgba(15,23,42,0.28)] sm:p-7">
              <div className="flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck size={24} /></span><h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">নিরাপদ পেমেন্ট যাচাই</h2></div>
              <div className="mt-5 space-y-3.5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                <p>• TrxID জমা পড়লেই সাবস্ক্রিপশন সক্রিয় হবে না।</p>
                <p>• অ্যাডমিন পেমেন্টের তথ্য যাচাই করে Approve বা Reject করবেন।</p>
                <p>• একই TrxID একাধিকবার জমা দেওয়া যাবে না।</p>
                <p>• টাকা পাঠানোর SMS/রসিদ যাচাই সম্পন্ন না হওয়া পর্যন্ত সংরক্ষণ করুন।</p>
              </div>
            </section>
            <Link href="/sohoj-tools" className="inline-flex items-center gap-2 px-1 py-1 text-base font-extrabold text-blue-700 hover:underline sm:text-lg"><ArrowLeft size={15} /> টুলসে ফিরে যান</Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
