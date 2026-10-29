"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShieldOff, ArrowLeft } from "lucide-react";

type GateState = {
  pathname: string;
  status: "checking" | "allowed" | "blocked";
  reason?: string;
};

const TOOL_PATHS = [
  "/ai-editor",
  "/ai-photo",
  "/ai-template",
  "/bulk-photo-edit",
  "/manual-editor",
  "/dorkar-link",
  "/dorkari-document",
  "/customers-invoices",
  "/income-expenses",
  "/print-media",
  "/questions-create",
  "/my-files",
];

function isToolPath(pathname: string) {
  if (pathname.startsWith("/sohoj-tools/")) return true;
  return TOOL_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function ToolAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const toolPath = isToolPath(pathname);
  const [gate, setGate] = useState<GateState>({ pathname: "", status: "allowed" });

  useEffect(() => {
    if (!toolPath) {
      setGate({ pathname, status: "allowed" });
      return;
    }

    let active = true;
    let firstCheck = true;
    setGate({ pathname, status: "checking" });

    const checkAccess = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!active) return;

        if (response.ok && data?.user) {
          const user = data.user;
          const blocked = user.role !== "admin" && user.isBanned === true;
          setGate({
            pathname,
            status: blocked ? "blocked" : "allowed",
            reason: typeof user.banReason === "string" ? user.banReason : "",
          });
        } else {
          // Guests still see the existing page/login prompt. Protected APIs enforce auth.
          setGate({ pathname, status: "allowed" });
        }
      } catch {
        if (active) setGate({ pathname, status: "allowed" });
      } finally {
        firstCheck = false;
      }
    };

    void checkAccess();
    // Also disables already-open tool pages shortly after an administrator bans an account.
    const interval = window.setInterval(() => {
      if (!firstCheck) void checkAccess();
    }, 8_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [pathname, toolPath]);

  const status = !toolPath ? "allowed" : gate.pathname !== pathname ? "checking" : gate.status;

  if (status === "checking") {
    // Keep the protected tool tree unmounted while the fresh server-side session
    // check runs, but do not expose an internal access-check spinner/message.
    return <main aria-busy="true" aria-hidden="true" className="min-h-[55vh]" />;
  }

  if (status === "blocked") {
    return (
      <main className="flex min-h-[65vh] items-center justify-center px-5 py-12">
        <section className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm sm:p-9">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldOff size={27} strokeWidth={1.8} />
          </span>
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">Tool access is disabled</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You can still sign in and browse the website, but an administrator has temporarily disabled tool access for this account.
          </p>
          {gate.reason && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600">
              <span className="font-medium text-slate-800">Reason:</span> {gate.reason}
            </div>
          )}
          <a
            href="/dashboard"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <ArrowLeft size={16} /> Back to dashboard
          </a>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
