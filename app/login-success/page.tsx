"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

function LoginSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const raw = searchParams.get("next") || "/dashboard";

    try {
      const decoded = decodeURIComponent(raw);
      return decoded.startsWith("/") && !decoded.startsWith("//")
        ? decoded
        : "/dashboard";
    } catch {
      return "/dashboard";
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(nextPath);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [nextPath, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm font-sans">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-success-title"
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white p-7 text-center shadow-xl animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2
            size={26}
            strokeWidth={2}
            className="animate-in zoom-in-50 duration-500"
          />
        </div>

        <h1
          id="login-success-title"
          className="text-lg font-semibold text-slate-900"
        >
          Login Successful!
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Welcome back!
        </p>

        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-full origin-left rounded-full bg-[#2563EB] animate-[loginProgress_1.6s_linear_forwards]" />
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
          <Loader2 size={12} className="animate-spin" />
          Taking you to your dashboard...
        </div>
      </div>

      <style jsx global>{`
        @keyframes loginProgress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </main>
  );
}

export default function LoginSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm font-sans">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-7 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={26} strokeWidth={2} />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">
              Login Successful!
            </h1>
          </div>
        </main>
      }
    >
      <LoginSuccessContent />
    </Suspense>
  );
}
