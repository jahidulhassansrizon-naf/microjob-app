"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, Clock3, CreditCard, LoaderCircle, LifeBuoy, ShieldCheck, Undo2 } from "lucide-react";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";

type Phase = "loading" | "success" | "pending" | "error";

export default function PaymentSuccessClient({ ppId, invoiceId, subscriptionId, provider = "piprapay", cancelled = false }: { ppId: string; invoiceId: string; subscriptionId: string; provider?: "piprapay" | "uddoktapay"; cancelled?: boolean }) {
  const providerName = provider === "uddoktapay" ? "UddoktaPay" : "PipraPay";
  const [status, setStatus] = useState(`${providerName} payment যাচাই করা হচ্ছে...`);
  const [phase, setPhase] = useState<Phase>("loading");
  const [reference, setReference] = useState(provider === "uddoktapay" ? invoiceId : ppId);
  const [retryKey, setRetryKey] = useState(0);

  const verify = useCallback(async (signal?: AbortSignal) => {
    if (cancelled) {
      setPhase("error");
      setStatus("পেমেন্ট বাতিল করা হয়েছে। কোনো Subscription Access চালু করা হয়নি। চাইলে আবার পেমেন্ট চেষ্টা করুন।");
      return true;
    }
    if (!ppId && !invoiceId && !subscriptionId) {
      setPhase("error");
      setStatus("পেমেন্ট রেফারেন্স পাওয়া যায়নি। পেমেন্ট সম্পন্ন হয়ে থাকলে সাপোর্টে যোগাযোগ করুন।");
      return true;
    }

    try {
      const response = await fetch(provider === "uddoktapay" ? "/api/uddoktapay/verify" : "/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        signal,
        body: JSON.stringify(provider === "uddoktapay"
          ? { invoice_id: invoiceId || undefined, subscription_id: subscriptionId || undefined }
          : { pp_id: ppId || undefined, subscription_id: subscriptionId || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (signal?.aborted) return false;
      if (response.ok && data?.success) {
        setPhase("success");
        setStatus("পেমেন্ট সফলভাবে যাচাই হয়েছে। আপনার Premium Access চালু করা হয়েছে।");
        const verifiedReference = provider === "uddoktapay"
          ? (data?.payment?.invoice_id || invoiceId)
          : (data?.payment?.pp_id || ppId);
        setReference(String(verifiedReference || ""));
        return true;
      }
      if (response.status === 202 || data?.paymentStatus === "PENDING" || data?.paymentStatus === "UNKNOWN") {
        setPhase("pending");
        setStatus(data?.message || `${providerName} এখনো পেমেন্ট সম্পন্ন বলে নিশ্চিত করেনি। স্বয়ংক্রিয়ভাবে আবার যাচাই করা হবে।`);
        return false;
      }
      setPhase("error");
      setStatus(data?.message || "পেমেন্ট যাচাই করা যায়নি। আবার চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন।");
      return true;
    } catch {
      if (!signal?.aborted) {
        setPhase("error");
        setStatus("Verification request failed. ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।");
      }
      return false;
    }
  }, [ppId, invoiceId, subscriptionId, provider, providerName, cancelled]);

  useEffect(() => {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const run = async () => {
      const completed = await verify(controller.signal);
      if (!completed && !controller.signal.aborted && attempts < 12) {
        attempts += 1;
        timeout = setTimeout(run, 5000);
      }
    };

    void run();
    return () => {
      controller.abort();
      if (timeout) clearTimeout(timeout);
    };
  }, [verify, retryKey]);

  const isCancelled = cancelled && phase === "error";
  const Icon = phase === "success" ? CheckCircle2 : phase === "pending" ? Clock3 : isCancelled ? Undo2 : phase === "error" ? CircleAlert : LoaderCircle;

  // One tone per state keeps the card calm: green = done, amber = waiting / cancelled, red = problem.
  const tone = phase === "success"
    ? { bar: "from-emerald-400 via-emerald-500 to-teal-500", ring: "bg-emerald-100 ring-emerald-200", icon: "text-emerald-600", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", glow: "bg-emerald-300/30" }
    : phase === "error" && !isCancelled
      ? { bar: "from-red-400 via-red-500 to-rose-500", ring: "bg-red-100 ring-red-200", icon: "text-red-600", chip: "bg-red-50 text-red-700 border-red-200", glow: "bg-red-300/30" }
      : { bar: "from-amber-300 via-orange-400 to-amber-500", ring: "bg-amber-100 ring-amber-200", icon: "text-amber-600", chip: "bg-amber-50 text-amber-700 border-amber-200", glow: "bg-amber-300/30" };

  const title = phase === "success" ? "পেমেন্ট সফল হয়েছে"
    : isCancelled ? "পেমেন্ট সম্পন্ন হয়নি"
    : phase === "pending" ? "পেমেন্ট যাচাই চলছে"
    : phase === "error" ? "পেমেন্ট যাচাই করা যায়নি"
    : "পেমেন্ট যাচাই করা হচ্ছে";
  const chipText = phase === "success" ? "Premium Access চালু"
    : isCancelled ? "বাতিল করা হয়েছে"
    : phase === "pending" ? "অপেক্ষমাণ"
    : phase === "error" ? "সমস্যা হয়েছে"
    : "যাচাই চলছে";
  const message = isCancelled
    ? "আপনি পেমেন্ট সম্পন্ন করার আগেই ফিরে এসেছেন, তাই আপনার সাবস্ক্রিপশনে কোনো পরিবর্তন হয়নি। আপনি চাইলে যেকোনো সময় আবার পেমেন্ট করতে পারেন।"
    : status;

  return (
    <div className="flex min-h-screen flex-col bg-[#F0E6CF] text-[#2B2116]">
      <style>{`
        @keyframes pay-card-in { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pay-pop { 0% { transform: scale(.6); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
        .pay-card-in { animation: pay-card-in .45s cubic-bezier(.2,.8,.2,1) both; }
        .pay-pop { animation: pay-pop .5s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .pay-card-in, .pay-pop { animation: none; } }
      `}</style>
      <DashboardNavbar />
      <main data-nav-content className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:py-14">
        <div aria-hidden className={`pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${tone.glow}`} />
        <div className="pay-card-in relative w-full max-w-xl overflow-hidden rounded-[28px] border border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_24px_60px_-28px_rgba(59,47,30,0.45)]">
          <div className={`h-1.5 w-full bg-gradient-to-r ${tone.bar}`} />
          <div className="px-6 pb-7 pt-8 text-center sm:px-10 sm:pb-9">
            <div className={`pay-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full ring-8 ${tone.ring}`} key={`${phase}-${isCancelled}`}>
              <Icon size={38} strokeWidth={2.2} className={`${tone.icon} ${phase === "loading" ? "animate-spin" : ""}`} />
            </div>

            <span className={`mt-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tone.chip}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> {chipText}
            </span>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
            <p role="status" aria-live="polite" className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-[#5A4A32]">{message}</p>

            {reference ? (
              <p className="mx-auto mt-5 max-w-full break-all rounded-xl border border-[#E3D6B8] bg-[#F2E8D2] px-3 py-2 text-xs text-[#6B5A40]">
                {providerName} reference: <span className="font-semibold">{reference}</span>
              </p>
            ) : null}

            {isCancelled ? (
              <ul className="mx-auto mt-6 max-w-md space-y-2.5 rounded-2xl border border-[#E8DCC0] bg-white/55 p-4 text-left text-sm text-[#4A3B26]">
                <li className="flex items-start gap-2.5"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" /><span>আপনার অ্যাকাউন্ট ও আগের অ্যাক্সেস সম্পূর্ণ নিরাপদ আছে।</span></li>
                <li className="flex items-start gap-2.5"><CreditCard size={18} className="mt-0.5 shrink-0 text-amber-600" /><span>অনলাইন পেমেন্টে সমস্যা হলে সাবস্ক্রিপশন পেজ থেকে Manual Payment (bKash / Nagad) ব্যবহার করতে পারেন।</span></li>
                <li className="flex items-start gap-2.5"><LifeBuoy size={18} className="mt-0.5 shrink-0 text-red-600" /><span>টাকা কেটে থাকলে সাপোর্টে যোগাযোগ করুন, আমরা দ্রুত দেখে দেব।</span></li>
              </ul>
            ) : null}

            <div className="mt-7 flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              {isCancelled ? (
                <>
                  <Link href="/sohoj-tools" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C9A6] bg-white/60 px-5 py-3 font-bold text-[#5A4A32] transition hover:bg-[#F2E8D2]">টুলসে ফিরে যান</Link>
                  <Link href="/subscription" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E02B2B] to-[#C01818] px-6 py-3 font-bold text-white shadow-[0_10px_22px_-10px_rgba(212,32,32,0.7)] transition hover:from-[#D42020] hover:to-[#AE1717]">
                    আবার পেমেন্ট করুন <ArrowRight size={17} />
                  </Link>
                </>
              ) : (
                <>
                  {phase !== "success" ? (
                    <button type="button" onClick={() => { setPhase("loading"); setRetryKey((value) => value + 1); }} className="inline-flex items-center justify-center rounded-xl border border-[#D8C9A6] bg-white/60 px-5 py-3 font-bold text-[#5A4A32] transition hover:bg-[#F2E8D2]">আবার যাচাই করুন</button>
                  ) : null}
                  <Link href={phase === "success" ? "/sohoj-tools" : "/subscription"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E02B2B] to-[#C01818] px-6 py-3 font-bold text-white shadow-[0_10px_22px_-10px_rgba(212,32,32,0.7)] transition hover:from-[#D42020] hover:to-[#AE1717]">
                    {phase === "success" ? "টুলস ব্যবহার শুরু করুন" : "সাবস্ক্রিপশন দেখুন"} <ArrowRight size={17} />
                  </Link>
                  {phase === "success" ? <Link href="/subscription" className="inline-flex items-center justify-center rounded-xl border border-[#D8C9A6] bg-white/60 px-5 py-3 font-bold text-[#5A4A32] transition hover:bg-[#F2E8D2]">সাবস্ক্রিপশন দেখুন</Link> : null}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
