// app/login/page.tsx
"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useI18n, T } from "@/components/i18n/I18nProvider";

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
  // URL parameters detection
  const callbackUrl =
    searchParams?.get("callbackUrl") || searchParams?.get("redirect") || "";
  // The login form is always rendered right away (server HTML == final UI). The existing-session
  // check runs in the background and redirects if the visitor is already logged in.
  const [, setCheckingExistingSession] = useState(true);
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
    // Even when no JS-readable token exists, check the HttpOnly session cookie.
    // This is how the environment-configured Admin session remains inaccessible to JS.

    // Fast path for the common Dashboard destination: a cached identity plus
    // an unexpired JWT lets us navigate immediately. Other callback targets
    // retain the original server-first check. This is only a UI hint; the
    // dashboard refreshes the user in the background and APIs verify JWTs.
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

    // First-time/uncached sessions still use the server check before redirecting.
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
      // The API also owns an HttpOnly cookie which JavaScript cannot clear.
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
        // A network/server error should not destroy a potentially valid token.
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
  const { locale, setLocale } = useI18n();
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
  const handleBack = () => {
    router.replace("/");
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: formData.identifier,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials!");
      }
      const isAdminLogin = data?.user?.role === "admin";
      if (isAdminLogin) {
        // The server sets an HttpOnly cookie for Admin; never persist its JWT in JS storage.
        localStorage.removeItem("token");
      } else if (data.token) {
        // Preserve the existing user-session compatibility flow.
        localStorage.setItem("token", data.token);
      }
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      if (!isAdminLogin && data.token) {
        const maxAge = formData.rememberMe ? 86400 * 30 : 86400 * 7;
        const isSecure =
          window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure}`;
      }
      // Return directly to the requested page. A one-time UI cookie lets the
      // root layout render the Login Successful overlay over that page on its
      // very first response, instead of showing a separate /login-success screen.
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

      // URL normalisation preserves the original tool/query target and also
      // guards against unusual slash/backslash forms becoming external URLs.
      let target = new URL(targetUrl, window.location.origin);
      if (target.origin !== window.location.origin) {
        target = new URL(fallbackTarget, window.location.origin);
      }
      target.searchParams.delete("loginSuccess");
      const targetPath = `${target.pathname}${target.search}${target.hash}`;

      const secureCookie =
        window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `sohoj_login_success=1; path=/; max-age=30; SameSite=Lax${secureCookie}`;
      // First name for the popup, so the server HTML already says "Welcome back, <name>!"
      const loginFirstName =
        String(data?.user?.fullName ?? data?.user?.name ?? "")
          .trim()
          .split(/\s+/)[0] ?? "";
      if (loginFirstName) {
        document.cookie = `sohoj_login_name=${encodeURIComponent(loginFirstName)}; path=/; max-age=30; SameSite=Lax${secureCookie}`;
      }
      window.location.replace(targetPath);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full flex flex-col-reverse lg:flex-row bg-slate-50 font-sans overflow-x-hidden relative">
      {/* Left Visual Banner */}
      <div className="lg:w-1/2 bg-slate-900 py-10 px-6 lg:min-h-screen flex flex-col items-center justify-center lg:p-8 relative overflow-hidden">
        <div className="relative w-full max-w-[450px] lg:max-w-[620px] aspect-square flex items-center justify-center">
          <img
            src="https://app.sohozkaj.com/images/authImage.svg"
            alt="SohozKaj Workflow Illustration"
            className="w-full h-full object-contain z-10 drop-shadow-2xl scale-100 lg:scale-105"
          />
        </div>

        <div className="mt-4 text-center w-full max-w-[680px] z-10 px-2">
          <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
            <span className="block">
              <T>
                {
                  "Create documents, designs, and print media with photo editing, AI\n              photo editing, manual editing, and bulk editing -\n            "
                }
              </T>
            </span>
            <span className="block mt-1">
              <T>{"easy to use."}</T>
            </span>
          </p>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="lg:w-1/2 min-h-[calc(100vh-300px)] lg:min-h-screen flex flex-col justify-between p-5 sm:p-10 lg:p-12 relative bg-white">
        {/* Navigation & Language Selector */}
        <div className="flex justify-between items-center w-full">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>
              <T>{"Back"}</T>
            </span>
          </button>

          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-semibold">
            <button
              type="button"
              onClick={() => changeLanguage("EN")}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                locale === "en"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <T>{"EN\n            "}</T>
            </button>
            <button
              type="button"
              onClick={() => changeLanguage("BN")}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                locale === "bn"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <T>{"\u09AC\u09BE\u0982\n            "}</T>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          <div className="flex flex-col items-center mb-6">
            <Link href="/" className="flex items-center gap-2 mb-1.5 group">
              <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <T>{"SK\n              "}</T>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  <T>{"Sohoz"}</T>
                  <span className="text-blue-600">
                    <T>{"kaj"}</T>
                  </span>
                </span>
                <span className="text-[9px] tracking-widest text-slate-400 font-bold uppercase mt-0.5">
                  <T>{"WWW.SOHOZKAJ.COM\n                "}</T>
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-500 font-medium">
              <T>{"Login to your account\n            "}</T>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/80 p-5 sm:p-8">
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  <T>{"Phone or Email "}</T>
                  <span className="text-red-500">
                    <T>{"*"}</T>
                  </span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Enter phone or email"
                    value={formData.identifier}
                    onChange={(e) =>
                      setFormData({ ...formData, identifier: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  <T>{"Password "}</T>
                  <span className="text-red-500">
                    <T>{"*"}</T>
                  </span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rememberMe: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span>
                    <T>{"Remember me"}</T>
                  </span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  <T>{"Forgot password?\n                "}</T>
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>
                      <T>{"Signing in..."}</T>
                    </span>
                  </>
                ) : (
                  <span>
                    <T>{"Sign in"}</T>
                  </span>
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-slate-600">
              <T>{"Don't have an account?"}</T>
              {<T> </T>}
              <Link
                href={
                  callbackUrl
                    ? `/register?redirect=${encodeURIComponent(callbackUrl)}`
                    : "/register"
                }
                className="text-blue-600 font-bold hover:underline ml-0.5"
              >
                <T>{"Sign up\n              "}</T>
              </Link>
            </p>
          </div>
        </div>

        {/* WhatsApp Support Button */}
        <div className="fixed bottom-5 right-5 z-50">
          <a
            href="https://wa.me/8801700559595"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all"
            title="Chat with Support"
          >
            <MessageCircle size={26} className="fill-current" />
          </a>
        </div>
      </div>
    </div>
  );
}
// useSearchParams() needs a <Suspense> boundary; its fallback used to be an empty box, so the page
// was blank until JS ran. The fallback is now the real form (without params) and the bridge swaps
// in the live params with identical markup.
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
