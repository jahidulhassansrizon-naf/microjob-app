import Link from "next/link";
import { ArrowRight, Clock3, CreditCard } from "lucide-react";

export default function SubscriptionCard() {
  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[#2563EB]">
            <CreditCard size={18} />
            <span className="text-sm font-bold uppercase tracking-[0.14em]">
              Subscription
            </span>
          </div>
          <h3 className="mt-2 text-xl font-bold text-slate-900">
            Your subscription status
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Subscription countdown can be connected here when the plan-expiry data is ready.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 min-w-[190px]">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Clock3 size={14} />
            Remaining time
          </div>
          <p className="mt-1 text-sm font-bold text-slate-900">Coming soon</p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
        <Link
          href="/subscription"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
        >
          Manage Subscription
          <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
