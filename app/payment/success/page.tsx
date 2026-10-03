 "use client";

import { useEffect, useState } from "react";

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState("Verifying payment...");
  const [invoiceId, setInvoiceId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("invoice_id")?.trim() || "";
    setInvoiceId(id);

    if (!id) {
      setStatus("Invoice ID was not provided.");
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch("/api/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ invoice_id: id }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data?.success) {
          setStatus(
            data?.message || "Payment could not be verified yet.",
          );
          return;
        }

        setStatus("Payment verified. Your subscription is now active.");
      } catch {
        setStatus("Verification request failed. Please try again.");
      }
    };

    verify();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">
          Payment Result
        </h1>

        <p className="mt-4 text-slate-600">{status}</p>

        {invoiceId ? (
          <p className="mt-3 text-xs text-slate-500">
            Invoice: {invoiceId}
          </p>
        ) : null}
      </div>
    </main>
  );
}
