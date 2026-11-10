// app/login/LoginClient.tsx (rendered by app/login/page.tsx)
"use client";
import SiteBrandLogo from "@/app/_components/SiteBrandLogo";
import BrandPanel, { BRAND_FONT } from "./_components/BrandPanel";

import { useState, useEffect, Suspense, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import BrandName from "@/app/_components/BrandName";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";
import { replaceSiteNameInText } from "@/lib/siteSettings";
import { resolvePostLoginPath } from "./_lib/resolvePostLoginPath";
import { fetchAuthMe, invalidateAuthMe } from "@/lib/clientAuth";

type SearchParamsLike = { get(name: string): string | null } | null;

function LoginContent({ searchParams }: { searchParams: SearchParamsLike }) {
  const router = useRouter();
  const callbackUrl =
    searchParams?.get("callbackUrl") || searchParams?.get("redirect") || "";
  const { locale, setLocale } = useI18n();
  const { settings } = useSiteSettings();
  const isBn = locale === "bn";

  const text = {
    back: isBn ? "ফিরে যান" : "Back",
    language: isBn ? "ভাষা" : "Language",
    loginTitle: isBn ? "আপনার অ্যাকাউন্টে প্রবেশ করুন" : "Sign in to your account",
    loginSubtitle: replaceSiteNameInText(
      isBn
        ? "আপনার সেবা লাগবে অ্যাকাউন্টে প্রবেশ করতে তথ্য দিন।"
        : "Enter your details to access your Seba Lagbe account.",
      settings.branding.siteName,
    ),
    identifier: isBn ? "ফোন নম্বর বা ইমেইল" : "Phone number or email",
    identifierPlaceholder: isBn
      ? "ফোন নম্বর বা ইমেইল লিখুন"
      : "Enter your phone number or email",
    password: isBn ? "পাসওয়ার্ড" : "Password",
    passwordPlaceholder: isBn ? "আপনার পাসওয়ার্ড লিখুন" : "Enter your password",
    rememberMe: isBn ? "আমাকে মনে রাখুন" : "Remember me",
    forgotPassword: isBn ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot password?",
    signingIn: isBn ? "প্রবেশ করা হচ্ছে..." : "Signing in...",
    signIn: isBn ? "লগইন করুন" : "Sign in",
    noAccount: isBn ? "অ্যাকাউন্ট নেই?" : "Don't have an account?",
    signUp: isBn ? "নতুন অ্যাকাউন্ট খুলুন" : "Create an account",
    showPassword: isBn ? "পাসওয়ার্ড দেখান" : "Show password",
    hidePassword: isBn ? "পাসওয়ার্ড লুকান" : "Hide password",
    secureSignIn: isBn ? "নিরাপদ অ্যাকাউন্ট প্রবেশ" : "Secure account access",
    invalidCredentials: isBn
      ? "ফোন নম্বর/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।"
      : "The phone/email or password is incorrect. Please try again.",
    tooManyAttempts: isBn
      ? "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।"
      : "Too many login attempts. Please wait a few minutes and try again.",
    missingFields: isBn
      ? "সঠিক ফোন নম্বর/ইমেইল এবং পাসওয়ার্ড লিখুন।"
      : "Enter a valid phone number/email and password.",
    loginFailed: isBn
      ? "লগইন করা যায়নি। আপনার তথ্য যাচাই করে আবার চেষ্টা করুন।"
      : "Unable to sign in. Please check your details and try again.",
    connectionError: isBn
      ? "সার্ভারের সঙ্গে সংযোগ করা যায়নি। ইন্টারনেট পরীক্ষা করে আবার চেষ্টা করুন।"
      : "Could not connect to the server. Check your connection and try again.",
    required: isBn ? "আবশ্যক" : "Required",
  };

  useEffect(() => {
    let active = true;
    const requestedTarget = callbackUrl.trim();

    // Cached user roles can become stale when the primary administrator promotes
    // an existing account. Always ask the server (shared fetchAuthMe, which sends the
    // cached token as a credential) for the current database role before redirecting.

    const clearInvalidSession = () => {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userData");
      } catch {
        // Storage cleanup is best-effort.
      }
      window.dispatchEvent(new Event("sohojhub:presence-stop"));
      invalidateAuthMe();
      void fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        keepalive: true,
      }).catch(() => undefined);
      document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    };

    void fetchAuthMe()
      .then(async (response) => {
        if (!active) return;

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          if (data?.user && typeof data.user === "object") {
            try {
              localStorage.setItem("user", JSON.stringify(data.user));
            } catch {
              // The authenticated session does not depend on cached user data.
            }

            const verifiedTarget = resolvePostLoginPath(
              data.user.role,
              requestedTarget,
            );
            router.replace(verifiedTarget);
            return;
          }
        }

        if ([401, 403, 404].includes(response.status)) {
          clearInvalidSession();
        }
      })
      .catch(() => {
        // If the role lookup fails temporarily, leave the sign-in form available.
      });

    return () => {
      active = false;
    };
  }, [callbackUrl, router]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: true,
  });

  const changeLanguage = (targetLang: "EN" | "BN") => {
    setLocale(targetLang === "BN" ? "bn" : "en");
  };

  const handleBack = () => router.replace("/");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      invalidateAuthMe();
      const response = await fetch("/api/auth/login", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password: formData.password,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Keep distinct failures distinct: a rate limit or server fault must
        // not be shown as "wrong password".
        if (response.status === 429) throw new Error(text.tooManyAttempts);
        if (response.status === 400) throw new Error(text.missingFields);
        if ([401, 403].includes(response.status)) {
          throw new Error(text.invalidCredentials);
        }
        const requestId = typeof data?.requestId === "string" ? data.requestId : "";
        throw new Error(requestId ? `${text.loginFailed} (${requestId.slice(0, 8)})` : text.loginFailed);
      }

      const isAdminLogin = data?.user?.role === "admin";
      if (isAdminLogin) {
        // The server sets an HttpOnly cookie for Admin; never persist its JWT in JS storage.
        localStorage.removeItem("token");
      } else if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      if (!isAdminLogin && data.token) {
        const maxAge = formData.rememberMe ? 86400 * 30 : 86400 * 7;
        const isSecure =
          window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure}`;
      }

      window.dispatchEvent(new Event("sohojhub:auth-changed"));

      const targetPath = resolvePostLoginPath(
        data?.user?.role,
        callbackUrl.trim(),
      );

      const secureCookie =
        window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `sohoj_login_success=1; path=/; max-age=30; SameSite=Lax${secureCookie}`;
      // Show a respectful role-based greeting for admins instead of their
      // account/profile name (for example, a test name like "Test").
      const loginFirstName = isAdminLogin
        ? "Administrator"
        : (String(data?.user?.fullName ?? data?.user?.name ?? "")
            .trim()
            .split(/\s+/)[0] ?? "");
      if (loginFirstName) {
        document.cookie = `sohoj_login_name=${encodeURIComponent(loginFirstName)}; path=/; max-age=30; SameSite=Lax${secureCookie}`;
      }
      window.location.replace(targetPath);
    } catch (error: unknown) {
      if (error instanceof TypeError) {
        setErrorMessage(text.connectionError);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(text.loginFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F2E8D2] text-[#3B2F1E] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]" data-bn={isBn ? "1" : "0"} style={{ fontFamily: BRAND_FONT }}>
      <BrandPanel isBn={isBn} />
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-5 sm:px-8 sm:py-7 lg:max-w-none lg:px-14">
        <header className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#5A4A32] transition-colors hover:bg-white hover:text-[#B91C1C]"
          >
            <ArrowLeft size={17} />
            <span>{text.back}</span>
          </button>

          <div
            className="inline-flex items-center gap-1 rounded-xl border border-[#E3D6B8] bg-white/90 p-1 shadow-sm"
            aria-label={text.language}
          >
            <button
              type="button"
              onClick={() => changeLanguage("EN")}
              aria-pressed={locale === "en"}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                locale === "en"
                  ? "bg-[#DC2626] text-white shadow-sm"
                  : "text-[#5A4A32] hover:bg-[#EFE3C8]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => changeLanguage("BN")}
              aria-pressed={locale === "bn"}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                locale === "bn"
                  ? "bg-[#DC2626] text-white shadow-sm"
                  : "text-[#5A4A32] hover:bg-[#EFE3C8]"
              }`}
            >
              বাংলা
            </button>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-md">
            <div className="mb-7 flex flex-col items-center text-center">
              <Link href="/" className="mb-6 inline-flex items-center">
                <SiteBrandLogo width={140} height={45} className="h-[45px] w-auto" />
              </Link>
              <h1 className="text-[1.7rem] font-bold leading-snug tracking-tight text-[#3B2F1E] sm:text-3xl">
                {text.loginTitle}
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#7A6A50]">
                {text.loginSubtitle}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-[0_28px_60px_-34px_rgba(59,47,30,0.45)] sm:p-9">
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="login-identifier"
                    className="block text-sm font-semibold text-[#4A3C27]"
                  >
                    {text.identifier} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail
                      size={17}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 text-[#9A8A6E]"
                    />
                    <input
                      id="login-identifier"
                      name="identifier"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder={text.identifierPlaceholder}
                      value={formData.identifier}
                      onChange={(e) =>
                        setFormData({ ...formData, identifier: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#E3D6B8] bg-white py-3 pl-10 pr-4 text-sm text-[#3B2F1E] outline-none transition-all placeholder:text-[#9A8A6E] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-semibold text-[#4A3C27]"
                  >
                    {text.password} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock
                      size={17}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 text-[#9A8A6E]"
                    />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder={text.passwordPlaceholder}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#E3D6B8] bg-white py-3 pl-10 pr-12 text-sm text-[#3B2F1E] outline-none transition-all placeholder:text-[#9A8A6E] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3.5 rounded-md p-1 text-[#9A8A6E] transition-colors hover:text-[#4A3C27] focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                      aria-label={showPassword ? text.hidePassword : text.showPassword}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1 text-sm">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-[#5A4A32]">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rememberMe: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-[#D4C4A0] text-[#DC2626] focus:ring-[#DC2626]"
                    />
                    <span>{text.rememberMe}</span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="font-semibold text-[#DC2626] transition-colors hover:text-[#991B1B] hover:underline"
                  >
                    {text.forgotPassword}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E5393B] to-[#B91C1C] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#DC2626]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DC2626]/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      <span>{text.signingIn}</span>
                    </>
                  ) : (
                    text.signIn
                  )}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-sm text-[#5A4A32]">
              {text.noAccount}{" "}
              <Link
                href={
                  callbackUrl
                    ? `/register?redirect=${encodeURIComponent(callbackUrl)}`
                    : "/register"
                }
                className="font-bold text-[#DC2626] transition-colors hover:text-[#991B1B] hover:underline"
              >
                {text.signUp}
              </Link>
            </p>
          </div>
        </section>

        <footer className="pb-2 text-center text-xs text-[#9A8A6E]">
          © {new Date().getFullYear()} <BrandName accentClassName="text-[#9A8A6E]" />. {isBn ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
        </footer>
      </div>
    </main>
  );
}

// useSearchParams() needs a Suspense boundary to prevent a blank page during hydration.
function SearchParamsBridge() {
  const searchParams = useSearchParams();
  return <LoginContent searchParams={searchParams} />;
}

export default function LoginClient() {
  return (
    <Suspense fallback={<LoginContent searchParams={null} />}>
      <SearchParamsBridge />
    </Suspense>
  );
}
