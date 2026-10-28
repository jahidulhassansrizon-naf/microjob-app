// app/login/page.tsx
"use client";

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
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import BrandName from "@/app/_components/BrandName";

/**
 * This is only a client-side fast-path hint, not authentication. Protected API
 * routes still verify the JWT on the server. We only skip blocking the page
 * transition when a cached identity exists and the JWT has not expired.
 */
function hasUnexpiredJwt(token: string): boolean {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return false;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(window.atob(padded), (character) =>
      character.charCodeAt(0),
    );
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as {
      exp?: unknown;
    };

    return (
      typeof payload.exp === "number" &&
      Number.isFinite(payload.exp) &&
      payload.exp * 1000 > Date.now() + 5_000
    );
  } catch {
    return false;
  }
}

type SearchParamsLike = { get(name: string): string | null } | null;

function LoginContent({ searchParams }: { searchParams: SearchParamsLike }) {
  const router = useRouter();
  const callbackUrl =
    searchParams?.get("callbackUrl") || searchParams?.get("redirect") || "";
  const [, setCheckingExistingSession] = useState(true);
  const { locale, setLocale } = useI18n();
  const isBn = locale === "bn";

  const text = {
    back: isBn ? "ফিরে যান" : "Back",
    language: isBn ? "ভাষা" : "Language",
    loginTitle: isBn ? "আপনার অ্যাকাউন্টে প্রবেশ করুন" : "Sign in to your account",
    loginSubtitle: isBn
      ? "আপনার সেবা লাগবে অ্যাকাউন্টে প্রবেশ করতে তথ্য দিন।"
      : "Enter your details to access your Seba Lagbe account.",
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

    const readCookieToken = () => {
      const entry = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith("token="));
      if (!entry) return "";
      const value = entry.slice("token=".length);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };

    const requestedTarget = callbackUrl.trim();
    let safeTargetUrl =
      requestedTarget.startsWith("/") &&
      !requestedTarget.startsWith("//") &&
      !requestedTarget.startsWith("/login")
        ? requestedTarget
        : "/dashboard";

    let localToken = "";
    let hasCachedIdentity = false;
    let cachedRole = "user";
    try {
      localToken = localStorage.getItem("token") || "";
      const cachedUserValue = localStorage.getItem("user");
      if (cachedUserValue) {
        const cachedUser = JSON.parse(cachedUserValue) as Record<
          string,
          unknown
        > | null;
        hasCachedIdentity = Boolean(
          cachedUser &&
            typeof cachedUser === "object" &&
            (cachedUser.id ||
              cachedUser._id ||
              cachedUser.phoneNumber ||
              cachedUser.email),
        );
        if (
          cachedUser &&
          typeof cachedUser === "object" &&
          cachedUser.role === "admin"
        ) {
          cachedRole = "admin";
        }
      }
    } catch {
      // Continue with a cookie-based check if browser storage is unavailable.
    }

    if (!requestedTarget && cachedRole === "admin") safeTargetUrl = "/admin";

    const token = localToken || readCookieToken();
    const isDashboardTarget =
      safeTargetUrl === "/dashboard" ||
      safeTargetUrl.startsWith("/dashboard/") ||
      safeTargetUrl.startsWith("/dashboard?");

    if (isDashboardTarget && hasCachedIdentity && hasUnexpiredJwt(token)) {
      window.dispatchEvent(
        new CustomEvent("navigation-progress:start", {
          detail: { targetPath: safeTargetUrl },
        }),
      );
      router.replace(safeTargetUrl);
      return () => {
        active = false;
      };
    }

    const progressStartTimer = window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("navigation-progress:start", {
          detail: { targetPath: safeTargetUrl },
        }),
      );
    }, 0);

    const clearInvalidSession = () => {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {
        // Storage cleanup is best-effort.
      }
      window.dispatchEvent(new Event("sohojhub:presence-stop"));
      void fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        keepalive: true,
      }).catch(() => undefined);
      document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    };

    void fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (response) => {
        if (!active) return;
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          if (data?.user) {
            try {
              localStorage.setItem("user", JSON.stringify(data.user));
            } catch {
              // The authenticated session does not depend on cached user data.
            }
          }

          const verifiedTarget = requestedTarget
            ? safeTargetUrl
            : data.user.role === "admin"
              ? "/admin"
              : "/dashboard";
          router.replace(verifiedTarget);
          return;
        }

        if ([401, 403, 404].includes(response.status)) {
          clearInvalidSession();
        }
        setCheckingExistingSession(false);
        window.dispatchEvent(new Event("navigation-progress:finish"));
      })
      .catch(() => {
        if (active) {
          setCheckingExistingSession(false);
          window.dispatchEvent(new Event("navigation-progress:finish"));
        }
      });

    return () => {
      active = false;
      window.clearTimeout(progressStartTimer);
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.identifier,
          password: formData.password,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if ([400, 401, 403].includes(response.status)) {
          throw new Error(text.invalidCredentials);
        }
        throw new Error(text.loginFailed);
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

      const fallbackTarget =
        data?.user?.role === "admin" ? "/admin" : "/dashboard";
      const requestedTarget = callbackUrl.trim();
      const isSafeLocalTarget =
        requestedTarget.startsWith("/") &&
        !requestedTarget.startsWith("//") &&
        !/^\/(?:login|register|login-success)(?:[/?#]|$)/i.test(
          requestedTarget,
        );
      const targetUrl = isSafeLocalTarget ? requestedTarget : fallbackTarget;

      let target = new URL(targetUrl, window.location.origin);
      if (target.origin !== window.location.origin) {
        target = new URL(fallbackTarget, window.location.origin);
      }
      target.searchParams.delete("loginSuccess");
      const targetPath = `${target.pathname}${target.search}${target.hash}`;

      const secureCookie =
        window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `sohoj_login_success=1; path=/; max-age=30; SameSite=Lax${secureCookie}`;
      const loginFirstName = String(
        data?.user?.fullName ?? data?.user?.name ?? "",
      )
        .trim()
        .split(/\s+/)[0] ?? "";
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
    <main className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 font-sans text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-8 sm:py-7">
        <header className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            <span>{text.back}</span>
          </button>

          <div
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm"
            aria-label={text.language}
          >
            <button
              type="button"
              onClick={() => changeLanguage("EN")}
              aria-pressed={locale === "en"}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                locale === "en"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
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
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              বাংলা
            </button>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-md">
            <div className="mb-7 flex flex-col items-center text-center">
              <Link href="/" className="group mb-6 inline-flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-black tracking-tight text-white shadow-lg shadow-blue-600/20 transition-transform group-hover:scale-105">
                  SL
                </span>
                <span className="flex flex-col items-start leading-none">
                  <BrandName className="text-2xl font-black tracking-tight text-slate-900" accentClassName="text-blue-600" />
                  <span className="mt-1.5 text-[10px] font-bold tracking-[0.2em] text-slate-400">
                    {isBn ? "ডিজিটাল সেবা" : "DIGITAL SERVICES"}
                  </span>
                </span>
              </Link>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <ShieldCheck size={14} />
                <span>{text.secureSignIn}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {text.loginTitle}
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {text.loginSubtitle}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-8">
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
                    className="block text-sm font-semibold text-slate-700"
                  >
                    {text.identifier} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail
                      size={17}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 text-slate-400"
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
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    {text.password} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock
                      size={17}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 text-slate-400"
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
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3.5 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={showPassword ? text.hidePassword : text.showPassword}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1 text-sm">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rememberMe: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span>{text.rememberMe}</span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="font-semibold text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                  >
                    {text.forgotPassword}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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

            <p className="mt-6 text-center text-sm text-slate-600">
              {text.noAccount}{" "}
              <Link
                href={
                  callbackUrl
                    ? `/register?redirect=${encodeURIComponent(callbackUrl)}`
                    : "/register"
                }
                className="font-bold text-blue-600 transition-colors hover:text-blue-800 hover:underline"
              >
                {text.signUp}
              </Link>
            </p>
          </div>
        </section>

        <footer className="pb-2 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} <BrandName accentClassName="text-slate-400" />. {isBn ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginContent searchParams={null} />}>
      <SearchParamsBridge />
    </Suspense>
  );
}
