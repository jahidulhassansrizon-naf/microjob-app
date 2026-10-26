"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clipboard, Copy, CreditCard, LoaderCircle, Phone, Receipt, Send, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import { WalletLogo } from "@/app/payment/manual/_components/WalletLogos";

type WalletMethod = "Nagad" | "bKash";
type PaymentInfo = {
  plan: { id: string; name: string; duration: string; months: number; days: number; price: number };
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
  Nagad: "border-[#DC2626] bg-[#F6D9A8] text-[#3B2F1E]",
  bKash: "border-[#DC2626] bg-[#F6D9A8] text-[#3B2F1E]",
};
const walletAccent: Record<WalletMethod, { button: string; badge: string; bar: string; soft: string }> = {
  Nagad: {
    button: "bg-[#D42020] hover:bg-[#AE1717] shadow-sm focus-visible:ring-[#DC2626]/40",
    badge: "bg-[#DC2626]",
    bar: "bg-[#DC2626]",
    soft: "border-[#E3D6B8] bg-[#F6EEDB]",
  },
  bKash: {
    button: "bg-[#D42020] hover:bg-[#AE1717] shadow-sm focus-visible:ring-[#DC2626]/40",
    badge: "bg-[#DC2626]",
    bar: "bg-[#DC2626]",
    soft: "border-[#E3D6B8] bg-[#F6EEDB]",
  },
};
const TOTAL_STEPS = 6;
const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const toBn = (value: number) => String(value).replace(/\d/g, (d) => bnDigits[Number(d)]);

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
  const [step, setStep] = useState(0);
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
    <div className="page-font min-h-screen bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] text-[#3B2F1E]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        .page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
      `}</style>
      <DashboardNavbar />
      <main className="font-bengali-ui mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/subscription" className="inline-flex items-center gap-2 rounded-xl px-1 py-1 text-lg font-extrabold text-[#DC2626] transition hover:text-[#B91C1C]">
            <ArrowLeft size={16} /> সাবস্ক্রিপশনে ফিরে যান
          </Link>
          <Link href="/sohoj-tools" className="inline-flex items-center gap-2 px-1 py-1 text-lg font-extrabold text-[#DC2626] hover:underline">টুলসে ফিরে যান <ArrowRight size={15} /></Link>
        </div>

        <div className="mt-2 grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
          <section className="rounded-[28px] border border-[#E3D6B8] bg-[#F2E8D2] p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DC2626] text-white shadow-sm"><CreditCard size={22} /></span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#DC2626]">STUDIO SEBA CHECKOUT</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-[#3B2F1E] sm:text-3xl">পেমেন্ট সম্পন্ন করুন</h1>
                <p className="mt-1.5 text-base leading-6 text-[#5A4A32] sm:text-lg">সঠিক নম্বরে টাকা পাঠিয়ে Transaction ID জমা দিন। অ্যাডমিন যাচাই করে অনুমোদন দিলেই সাবস্ক্রিপশন চালু হবে।</p>
              </div>
            </div>

            {loading ? (
              <div aria-busy="true" className="mt-5 flex items-center gap-3 rounded-2xl border border-[#E3D6B8] bg-[#F6EEDB] p-4 text-lg text-[#5A4A32]"><LoaderCircle size={18} className="animate-spin" /> পেমেন্টের তথ্য লোড হচ্ছে...</div>
            ) : !info ? (
              <div role="alert" className="mt-5 rounded-2xl border border-[#FBB6B6] bg-[#FEE9E9] p-4 text-lg font-semibold leading-7 text-red-700">{error || "পেমেন্টের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।"}</div>
            ) : (
              <>
                <div className="mt-4 rounded-2xl border border-[#FBB6B6] bg-[#FEE9E9] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-extrabold text-[#DC2626]">নির্বাচিত প্ল্যান</p>
                      <p className="mt-0.5 text-xl font-black text-[#3B2F1E] sm:text-2xl">{info.plan.name} · {info.plan.days} দিন</p>
                      <p className="mt-0.5 text-sm font-semibold text-[#6B5A40]">মেয়াদ: {info.plan.duration}</p>
                    </div>
                    <p className="text-3xl font-black tracking-tight text-[#DC2626]">{formatMoney(info.plan.price)}</p>
                  </div>
                  <p className="mt-2 text-base leading-6 text-[#5A4A32]">পেমেন্ট ম্যানুয়ালি যাচাই করা হয়। শুধু TrxID জমা দিলেই অ্যাক্সেস চালু হবে না।</p>
                </div>

                {!reviewPending ? (
                  <div className="mt-4">
                    <h2 className="text-xl font-black text-[#3B2F1E] sm:text-2xl">কোন মাধ্যমে পেমেন্ট করবেন?</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {(["Nagad", "bKash"] as WalletMethod[]).map((wallet) => (
                        <button key={wallet} type="button" onClick={() => { setMethod(wallet); setCopied(false); setError(""); setStep(0); }} aria-pressed={method === wallet}
                          className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm sm:p-5 ${method === wallet ? `${walletStyles[wallet]} ring-2 ring-[#DC2626]/40 shadow-sm` : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32] hover:bg-[#EFE3C8]"}`}>
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FBF6E8] shadow-sm ring-1 ring-[#E3D6B8]"><WalletLogo wallet={wallet} size={30} /></span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2 text-xl font-black sm:text-2xl">{wallet}{method === wallet && <CheckCircle2 size={18} className="text-[#DC2626]" />}</span>
                            <span className="mt-0.5 block text-base font-semibold opacity-80 sm:text-lg">Send Money</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                ) : (
                  <div className="mt-4 rounded-2xl border border-[#FBB6B6] bg-[#FEE9E9] p-4 text-lg leading-7 text-[#3B2F1E] shadow-sm">
                    <strong className="block text-xl font-black">আপনার পেমেন্ট রিভিউতে আছে</strong>
                    একই সময়ে আরেকটি পেমেন্ট পাঠাবেন না। অ্যাডমিন যাচাই শেষ হলে সাবস্ক্রিপশন পেজে অবস্থা আপডেট হবে।
                  </div>
                )}
              </>
            )}
          </section>

          <section className="rounded-[28px] border border-[#E3D6B8] bg-[#F2E8D2] p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FEE9E9] text-[#DC2626]"><ShieldCheck size={22} /></span><h2 className="text-xl font-black tracking-tight text-[#3B2F1E] sm:text-2xl">নিরাপদ পেমেন্ট যাচাই</h2></div>
            <div className="mt-3 space-y-1.5 text-base leading-6 text-[#5A4A32] sm:text-lg">
              <p>• TrxID জমা পড়লেই সাবস্ক্রিপশন সক্রিয় হবে না।</p>
              <p>• অ্যাডমিন পেমেন্টের তথ্য যাচাই করে Approve বা Reject করবেন।</p>
              <p>• একই TrxID একাধিকবার জমা দেওয়া যাবে না।</p>
              <p>• টাকা পাঠানোর SMS/রসিদ যাচাই সম্পন্ন না হওয়া পর্যন্ত সংরক্ষণ করুন।</p>
            </div>
          </section>
          </div>

          <aside className="space-y-4">
            {!loading && info && !reviewPending && (
              <>
                <style>{`@keyframes walletStepIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}`}</style>
                  <div className="rounded-[28px] border border-[#E3D6B8] bg-[#F2E8D2] p-5 shadow-sm sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-extrabold text-[#6B5A40] sm:text-lg">ধাপ {toBn(step + 1)} / {toBn(TOTAL_STEPS)}</p>
                      <span className="inline-flex items-center gap-2 text-base font-extrabold text-[#5A4A32] sm:text-lg"><WalletLogo wallet={method} size={22} />{method}</span>
                    </div>
                    <div className="mt-3 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step + 1}>
                      {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                        <button key={index} type="button" disabled={index > step} onClick={() => setStep(index)} aria-label={`ধাপ ${toBn(index + 1)}`}
                          className={`h-2 flex-1 rounded-full transition-colors ${index <= step ? walletAccent[method].bar : "bg-[#E3D6B8]"} ${index < step ? "cursor-pointer" : "cursor-default"}`} />
                      ))}
                    </div>

                    <div key={`${method}-${step}`} aria-live="polite" className="mt-5 min-h-[320px]" style={{ animation: "walletStepIn 0.25s ease-out" }}>
                      {step === 0 && (
                        <div>
                          <StepHeading icon={<Copy size={22} />} badge={walletAccent[method].badge} title={`${method} নম্বর কপি করুন`} text="নিচের নম্বরটি কপি করে রাখুন। এই নম্বরেই টাকা পাঠাতে হবে।" />
                          <NumberBox accountNumber={accountNumber} copied={copied} onCopy={() => void copyNumber()} soft={walletAccent[method].soft} />
                          {configMissing && <p className="mt-3 rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] px-3.5 py-3 text-base font-bold leading-6 text-[#B91C1C] sm:text-lg">সার্ভারের environment settings-এ {method} নম্বর সেট করা নেই। নম্বর সেট না করা পর্যন্ত পেমেন্ট জমা দেওয়া যাবে না।</p>}
                        </div>
                      )}
                      {step === 1 && (
                        <div>
                          <StepHeading icon={<Smartphone size={22} />} badge={walletAccent[method].badge} title={`${method} অ্যাপ খুলুন`} text={`আপনার ফোনে ${method} অ্যাপ খুলে লগইন করুন, তারপর মেনু থেকে Send Money নির্বাচন করুন।`} />
                          <div className={`mt-4 flex items-center gap-4 rounded-2xl border p-4 ${walletAccent[method].soft}`}>
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FBF6E8] shadow-sm ring-1 ring-[#E3D6B8]"><WalletLogo wallet={method} size={40} /></span>
                            <p className="text-lg font-bold leading-7 text-[#3B2F1E] sm:text-xl">{method} অ্যাপ → <span className="font-black">Send Money</span></p>
                          </div>
                        </div>
                      )}
                      {step === 2 && (
                        <div>
                          <StepHeading icon={<Phone size={22} />} badge={walletAccent[method].badge} title="প্রাপকের নম্বর বসান" text="Send Money পেজে প্রাপকের নম্বরের ঘরে নিচের নম্বরটি পেস্ট করুন।" />
                          <NumberBox accountNumber={accountNumber} copied={copied} onCopy={() => void copyNumber()} soft={walletAccent[method].soft} />
                        </div>
                      )}
                      {step === 3 && (
                        <div>
                          <StepHeading icon={<Wallet size={22} />} badge={walletAccent[method].badge} title="টাকার পরিমাণ দিন" text="Amount-এর ঘরে ঠিক এই পরিমাণ টাকা লিখুন। কম বা বেশি পাঠাবেন না।" />
                          <div className={`mt-4 rounded-2xl border p-5 text-center ${walletAccent[method].soft}`}>
                            <p className="text-base font-extrabold text-[#6B5A40] sm:text-lg">পাঠাতে হবে</p>
                            <p className="mt-1 text-4xl font-black tracking-tight text-[#3B2F1E] sm:text-5xl">{formatMoney(info.plan.price)}</p>
                          </div>
                        </div>
                      )}
                      {step === 4 && (
                        <div>
                          <StepHeading icon={<Receipt size={22} />} badge={walletAccent[method].badge} title="TrxID সংগ্রহ করুন" text="পিন দিয়ে পেমেন্ট নিশ্চিত করুন। সফল হলে SMS অথবা অ্যাপের হিস্টোরি থেকে Transaction ID (TrxID) দেখে নিন।" />
                          <div className="mt-4 rounded-2xl border border-[#E3D6B8] bg-[#F6EEDB] p-4 text-lg leading-7 text-[#5A4A32]">
                            <p>TrxID সাধারণত <strong>৮–১০টি ইংরেজি অক্ষর/সংখ্যার</strong> হয়।</p>
                            <p className="mt-1 text-[#6B5A40]">পরের ধাপে এটি লাগবে, তাই SMS-টি মুছবেন না।</p>
                          </div>
                        </div>
                      )}
                      {step === 5 && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <StepHeading icon={<Send size={22} />} badge={walletAccent[method].badge} title="পেমেন্টের তথ্য জমা দিন" text="যে নম্বর থেকে টাকা পাঠিয়েছেন এবং TrxID লিখে জমা দিন।" />
                          <div>
                            <label htmlFor="senderNumber" className="mb-2 block text-lg font-extrabold text-[#3B2F1E] sm:text-xl">যে নম্বর থেকে টাকা পাঠিয়েছেন</label>
                            <input id="senderNumber" inputMode="tel" autoComplete="tel" value={senderNumber} onChange={(event) => setSenderNumber(event.target.value)} placeholder="01XXXXXXXXX" required maxLength={20}
                              className="w-full rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] px-4 py-4 text-lg outline-none transition placeholder:text-[#B0A080] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 sm:text-xl" />
                          </div>
                          <div>
                            <label htmlFor="transactionId" className="mb-2 block text-lg font-extrabold text-[#3B2F1E] sm:text-xl">Transaction ID (TrxID)</label>
                            <input id="transactionId" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={transactionId} onChange={(event) => setTransactionId(event.target.value.slice(0, 10))} placeholder="যেমন: BIK7A8G9XZ" required minLength={8} maxLength={10} pattern="[A-Za-z0-9]{8,10}" title="TrxID অবশ্যই ৮–১০টি ইংরেজি অক্ষর/সংখ্যার হতে হবে।"
                              className="w-full rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] px-4 py-4 font-mono text-lg uppercase tracking-wider outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-[#B0A080] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 sm:text-xl" />
                            <p className="mt-2 text-base leading-6 text-[#6B5A40] sm:text-lg sm:leading-7">৪–৫ অক্ষরের ID গ্রহণ করা হবে না। SMS-এ যেভাবে আছে, সেভাবেই লিখুন।</p>
                          </div>
                          {error && <p role="alert" className="rounded-2xl border border-[#FBB6B6] bg-[#FEE9E9] px-4 py-3.5 text-lg font-bold leading-6 text-red-700">{error}</p>}
                          {notice && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-lg font-bold leading-6 text-emerald-800">{notice}</p>}
                          <button type="submit" disabled={submitting || configMissing} className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-lg font-black text-white transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:text-xl ${walletAccent[method].button}`}>
                            {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Clipboard size={17} />}{submitting ? "জমা হচ্ছে..." : "পেমেন্টের তথ্য জমা দিন"}
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      {step > 0 && (
                        <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#FBB6B6] bg-[#FBF6E8] px-4 py-3.5 text-lg font-extrabold text-[#B91C1C] transition hover:bg-[#FEE9E9] active:scale-[0.98] sm:text-xl"><ArrowLeft size={16} /> পিছনে</button>
                      )}
                      {step < TOTAL_STEPS - 1 && (
                        <button type="button" onClick={() => setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1))} disabled={step === 0 && configMissing}
                          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-lg font-black text-white transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:text-xl ${walletAccent[method].button}`}>
                          <Check size={18} /> হয়েছে, পরবর্তী ধাপ <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
              </>
            )}
            {submitted && (
              <section className="rounded-[28px] border border-[#E3D6B8] bg-[#F2E8D2] p-5 shadow-sm sm:p-7">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[#DC2626]" size={23} />
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[#3B2F1E] sm:text-3xl">পেমেন্টের তথ্য জমা হয়েছে</h2>
                    <p className="mt-2 text-lg leading-7 text-[#5A4A32] sm:text-xl sm:leading-8">আপনার পেমেন্টের তথ্য অ্যাডমিন যাচাই করবেন। অনুমোদন না হওয়া পর্যন্ত পেইড টুলের অ্যাক্সেস চালু হবে না।</p>
                  </div>
                </div>
                <dl className="mt-5 space-y-3 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 text-lg sm:p-5">
                  <div className="flex justify-between gap-3"><dt className="text-[#6B5A40]">পেমেন্ট</dt><dd className="font-bold">{submitted.paymentMethod}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-[#6B5A40]">TrxID</dt><dd className="break-all text-right font-bold">{submitted.transactionId}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-[#6B5A40]">পরিমাণ</dt><dd className="font-bold">{formatMoney(submitted.amount)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-[#6B5A40]">অবস্থা</dt><dd className="font-bold text-[#B91C1C]">রিভিউ চলছে</dd></div>
                </dl>
                <Link href="/subscription" className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[#FBB6B6] bg-[#FBF6E8] px-4 py-4 text-lg font-extrabold text-[#B91C1C] transition hover:bg-[#FEE9E9] active:scale-[0.98] sm:text-xl">সাবস্ক্রিপশন পেজে যান</Link>
              </section>
            )}

            {info?.pending && !submitted && (
              <section className="rounded-3xl border border-[#FBB6B6] bg-[#FEE9E9] p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3 text-[#B91C1C]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBB6B6]/60"><ShieldCheck size={22} /></span><h2 className="text-xl font-black sm:text-2xl">আপনার একটি পেমেন্ট রিভিউতে আছে</h2></div>
                <p className="mt-3 text-lg leading-7 text-[#3B2F1E] sm:text-xl">TrxID: <strong className="break-all">{info.pending.transactionId || "—"}</strong>. অ্যাডমিন যাচাই শেষ না হওয়া পর্যন্ত অপেক্ষা করুন।</p>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function StepHeading({ icon, badge, title, text }: { icon: ReactNode; badge: string; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${badge}`}>{icon}</span>
      <div>
        <h3 className="text-2xl font-black text-[#3B2F1E] sm:text-3xl">{title}</h3>
        <p className="mt-1 text-lg leading-7 text-[#5A4A32] sm:text-xl">{text}</p>
      </div>
    </div>
  );
}

function NumberBox({ accountNumber, copied, onCopy, soft }: { accountNumber: string; copied: boolean; onCopy: () => void; soft: string }) {
  return (
    <div className={`mt-4 flex flex-wrap items-center gap-2 rounded-2xl border p-4 ${soft}`}>
      <p className="min-w-0 flex-1 break-all text-3xl font-black tracking-wide text-[#3B2F1E] sm:text-3xl">{accountNumber || "সার্ভারে নম্বর সেট করা নেই"}</p>
      <button type="button" onClick={onCopy} disabled={!accountNumber} className="inline-flex items-center gap-2 rounded-xl border border-[#FBB6B6] bg-[#FBF6E8] px-4 py-3 text-base font-extrabold text-[#B91C1C] shadow-sm transition hover:bg-[#FEE9E9] active:scale-[0.98] disabled:opacity-50 sm:text-lg">
        {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "কপি হয়েছে" : "Copy"}
      </button>
    </div>
  );
}
