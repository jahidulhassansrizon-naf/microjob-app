"use client";
import { T } from "@/components/i18n/I18nProvider";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import LoginSuccessCard from "@/app/_components/LoginSuccessCard";
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
        }
        catch {
            return "/dashboard";
        }
    }, [searchParams]);
    useEffect(() => {
        let active = true;
        const timer = window.setTimeout(() => {
            void fetch("/api/auth/me", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            })
                .then(async (response) => {
                    const data = await response.json().catch(() => ({}));
                    if (!active) return;
                    const isAdmin = response.ok && data?.user?.role === "admin";
                    const isAdminTarget = /^\/admin(?:[/?#]|$)/i.test(nextPath);
                    const destination = isAdmin
                        ? (isAdminTarget ? nextPath : "/admin")
                        : (isAdminTarget ? "/dashboard" : nextPath);
                    router.replace(destination);
                })
                .catch(() => {
                    if (active) router.replace(nextPath);
                });
        }, 1600);
        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [nextPath, router]);
    const [go, setGo] = useState(false);
    useEffect(() => {
        const id = window.setTimeout(() => setGo(true), 30);
        return () => window.clearTimeout(id);
    }, []);
    return (<main className="flex min-h-screen items-center justify-center bg-[#2A2118]/60 px-4 backdrop-blur-md font-sans">
      <LoginSuccessCard go={go} durationMs={1600} title={<T>{"Login Successful!"}</T>} subtitle={<T>{"Welcome back!"}</T>} footer={<><Loader2 size={12} className="animate-spin"/><T>{"Taking you to your dashboard..."}</T></>}/>
    </main>);
}
export default function LoginSuccessPage() {
    return (<Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#2A2118]/60 px-4 backdrop-blur-md font-sans">
          <LoginSuccessCard go={false} title={<T>{"Login Successful!"}</T>} subtitle={<T>{"Welcome back!"}</T>}/>
        </main>}>
      <LoginSuccessContent />
    </Suspense>);
}
