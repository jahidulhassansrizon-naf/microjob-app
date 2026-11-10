"use client";
import { T } from "@/components/i18n/I18nProvider";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import LoginSuccessCard from "@/app/_components/LoginSuccessCard";
import { fetchAuthMe } from "@/lib/clientAuth";
import { getSafeLocalPostLoginTarget, resolvePostLoginPath } from "@/app/login/_lib/resolvePostLoginPath";
function LoginSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = useMemo(() => {
        // URLSearchParams already decodes the query value once. Never decode it
        // again: double-decoding can turn an encoded backslash into a redirect.
        return getSafeLocalPostLoginTarget(searchParams.get("next") || "/dashboard") || "/dashboard";
    }, [searchParams]);
    useEffect(() => {
        let active = true;
        const timer = window.setTimeout(() => {
            void fetchAuthMe()
                .then(async (response) => {
                    const data = await response.json().catch(() => ({}));
                    if (!active) return;
                    const role = response.ok && data?.user?.role === "admin" ? "admin" : "user";
                    router.replace(resolvePostLoginPath(role, nextPath));
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
