"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

// Translations
const translations = {
  EN: {
    backToHome: "Back to Home",
    loginTitle: "Login to your account",
    phoneOrEmail: "Phone or Email",
    phoneOrEmailPlaceholder: "Enter phone or email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    signIn: "Sign in",
    signingIn: "Signing in...",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    heroTitle:
      "Create documents, designs, and print media with photo editing, AI photo editing, manual editing, and bulk editing -",
    heroSub: "easy to use.",
  },
  BN: {
    backToHome: "হোমে ফিরে যান",
    loginTitle: "আপনার অ্যাকাউন্টে লগইন করুন",
    phoneOrEmail: "ফোন অথবা ইমেইল",
    phoneOrEmailPlaceholder: "ফোন বা ইমেইল লিখুন",
    password: "পাসওয়ার্ড",
    passwordPlaceholder: "আপনার পাসওয়ার্ড লিখুন",
    rememberMe: "মনে রাখুন",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    signIn: "লগইন করুন",
    signingIn: "লগইন হচ্ছে...",
    noAccount: "অ্যাকাউন্ট নেই?",
    signUp: "সাইন আপ করুন",
    heroTitle:
      "ফটো এডিটিং, এআই এডিটিং এবং বাল্ক এডিটিং সহ যেকোনো ডিজাইন বা ডকুমেন্টস তৈরি করুন -",
    heroSub: "সহজেই ব্যবহারযোগ্য।",
  },
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<"EN" | "BN">("EN");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: true,
  });

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      // Next.js Internal API Route
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

      // LocalStorage এ টোকেন ও ইউজার ডাটা সেভ
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      // Cookie তে সিকিউরভাবে টোকেন সেট করা (Middleware এর জন্য)
      const maxAge = formData.rememberMe ? 86400 * 30 : 86400 * 7;
      const isSecure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure}`;

      window.location.href = "/dashboard";
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
    <div className="min-h-screen w-full flex flex-col-reverse lg:flex-row bg-white font-sans overflow-x-hidden relative">
      {/* Left Visual Banner */}
      <div className="lg:w-1/2 bg-[#222835] py-10 px-6 lg:min-h-screen flex flex-col items-center justify-center lg:p-8 relative overflow-hidden">
        <div className="relative w-full max-w-[450px] lg:max-w-[620px] aspect-square flex items-center justify-center">
          <img
            src="https://app.sohozkaj.com/images/authImage.svg"
            alt="SohozKaj Workflow Illustration"
            className="w-full h-full object-contain z-10 drop-shadow-2xl scale-100 lg:scale-105"
          />
        </div>

        <div className="mt-4 text-center w-full max-w-[680px] z-10 px-2">
          <p className="text-gray-300 text-xs sm:text-sm font-normal leading-relaxed">
            <span className="block">{t.heroTitle}</span>
            <span className="block mt-1">{t.heroSub}</span>
          </p>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="lg:w-1/2 min-h-[calc(100vh-300px)] lg:min-h-screen flex flex-col justify-between p-5 sm:p-10 lg:p-12 relative bg-white">
        {/* Navigation & Language Selector */}
        <div className="flex justify-between items-center w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#FF5D00] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{t.backToHome}</span>
          </Link>

          <div className="inline-flex items-center bg-gray-100 p-0.5 rounded-md text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLang("EN")}
              className={`px-3 py-1 rounded transition-all ${
                lang === "EN"
                  ? "bg-[#FF5D00] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("BN")}
              className={`px-3 py-1 rounded transition-all ${
                lang === "BN"
                  ? "bg-[#FF5D00] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              বাং
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          <div className="flex flex-col items-center mb-6">
            <Link href="/" className="flex items-center gap-2 mb-1.5 group">
              <div className="w-9 h-9 bg-[#FF5D00] rounded-xl flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                SK
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-2xl font-black tracking-tight text-gray-900">
                  Sohoz<span className="text-[#FF5D00]">kaj</span>
                </span>
                <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase mt-0.5">
                  WWW.SOHOZKAJ.COM
                </span>
              </div>
            </Link>
            <p className="text-xs text-gray-500 font-medium">{t.loginTitle}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/60 p-5 sm:p-8">
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  {t.phoneOrEmail} <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder={t.phoneOrEmailPlaceholder}
                    value={formData.identifier}
                    onChange={(e) =>
                      setFormData({ ...formData, identifier: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5D00] focus:ring-1 focus:ring-[#FF5D00] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  {t.password} <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder={t.passwordPlaceholder}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5D00] focus:ring-1 focus:ring-[#FF5D00] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rememberMe: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-[#FF5D00] focus:ring-[#FF5D00]"
                  />
                  <span>{t.rememberMe}</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[#FF5D00] hover:underline font-semibold"
                >
                  {t.forgotPassword}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#FF5D00] hover:bg-[#e05200] disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-orange-500/20 active:scale-[0.99] mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t.signingIn}</span>
                  </>
                ) : (
                  <span>{t.signIn}</span>
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-gray-600">
              {t.noAccount}{" "}
              <Link
                href="/register"
                className="text-[#FF5D00] font-bold hover:underline ml-0.5"
              >
                {t.signUp}
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
