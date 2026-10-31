"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, Clock3, LoaderCircle } from "lucide-react";

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

  const Icon = phase === "success" ? CheckCircle2 : phase === "pending" ? Clock3 : phase === "error" ? CircleAlert : LoaderCircle;
  const iconTone = phase === "success" ? "text-emerald-600" : phase === "error" ? "text-red-600" : "text-amber-600";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F2E8D2] px-4 py-12 text-[#3B2F1E]">
      <div className="w-full max-w-xl rounded-3xl border border-[#E3D6B8] bg-[#FBF6E8] p-7 text-center shadow-lg sm:p-9">
        <Icon size={48} className={`mx-auto ${iconTone} ${phase === "loading" ? "animate-spin" : ""}`} />
        <h1 className="mt-4 text-2xl font-black">Payment Result</h1>
        <p role="status" aria-live="polite" className="mt-3 text-base leading-7 text-[#5A4A32]">{status}</p>
        {reference ? <p className="mt-4 break-all rounded-xl bg-[#F2E8D2] px-3 py-2 text-xs text-[#6B5A40]">{providerName} reference: {reference}</p> : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/subscription" className="rounded-xl bg-[#D42020] px-5 py-2.5 font-bold text-white hover:bg-[#AE1717]">সাবস্ক্রিপশন দেখুন</Link>
          {phase !== "success" ? <button type="button" onClick={() => { setPhase("loading"); setRetryKey((value) => value + 1); }} className="rounded-xl border border-[#D8C9A6] px-5 py-2.5 font-bold text-[#5A4A32] hover:bg-[#F2E8D2]">আবার যাচাই করুন</button> : null}
        </div>
      </div>
    </main>
  );
}
