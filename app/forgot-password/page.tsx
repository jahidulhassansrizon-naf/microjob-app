"use client";

import SiteBrandLogo from "@/app/_components/SiteBrandLogo";
import BrandName from "@/app/_components/BrandName";
import { BrandFonts, BRAND_FONT } from "@/app/login/_components/BrandPanel";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { locale, setLocale } = useI18n();
  const isBn = locale === "bn";
  const tx = (en: string, bn: string) => (isBn ? bn : en);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Server messages are English; show a Bangla equivalent for the common ones.
  const friendlyError = (raw: string) => {
    if (!isBn) return raw;
    const map: Array<[RegExp, string]> = [
      [/valid email/i, "সঠিক ইমেইল ঠিকানা লিখুন।"],
      [/too many|rate|wait/i, "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।"],
      [/invalid|incorrect|expired|otp|code/i, "কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে। আবার চেষ্টা করুন।"],
      [/8 characters|at least 8/i, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।"],
      [/do not match/i, "পাসওয়ার্ড দুটি মিলছে না।"],
    ];
    for (const [pattern, bn] of map) if (pattern.test(raw)) return bn;
    return "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  };

  // Step 1: Send OTP to email.
  const handleSendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError(tx("Please enter your email address.", "আপনার ইমেইল ঠিকানা লিখুন।"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to send OTP.");
      }
      setMessage(
        tx(
          "If an account matches this email, a reset code will be sent. Check your inbox and spam folder.",
          "এই ইমেইলের সঙ্গে অ্যাকাউন্ট থাকলে রিসেট কোড পাঠানো হবে। ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।",
        ),
      );
      setStep(2);
    } catch (err: unknown) {
      setError(
        err instanceof TypeError
          ? tx("Could not connect to the server. Check your connection and try again.", "সার্ভারের সঙ্গে সংযোগ করা যায়নি। ইন্টারনেট পরীক্ষা করে আবার চেষ্টা করুন।")
          : friendlyError(err instanceof Error ? err.message : "Something went wrong."),
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password with OTP.
  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!otp.trim() || !newPassword || !confirmPassword) {
      setError(tx("Please complete all fields.", "সবগুলো ঘর পূরণ করুন।"));
      return;
    }
    if (newPassword.length < 8) {
      setError(tx("Password must be at least 8 characters long.", "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(tx("Passwords do not match.", "পাসওয়ার্ড দুটি মিলছে না।"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to reset password.");
      }
      setMessage(
        tx(
          "Password reset successful! Redirecting to sign in...",
          "পাসওয়ার্ড সফলভাবে রিসেট হয়েছে! লগইন পেজে নেওয়া হচ্ছে...",
        ),
      );
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      setError(
        err instanceof TypeError
          ? tx("Could not connect to the server. Check your connection and try again.", "সার্ভারের সঙ্গে সংযোগ করা যায়নি। ইন্টারনেট পরীক্ষা করে আবার চেষ্টা করুন।")
          : friendlyError(err instanceof Error ? err.message : "Something went wrong."),
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#E3D6B8] bg-white py-3 pl-10 pr-4 text-sm text-[#3B2F1E] outline-none transition-all placeholder:text-[#9A8A6E] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10";
  const labelClass = "block text-sm font-semibold text-[#4A3C27]";
  const iconClass = "pointer-events-none absolute left-3.5 text-[#9A8A6E]";
  const primaryButton =
    "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E5393B] to-[#B91C1C] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#DC2626]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DC2626]/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main
      className="min-h-screen w-full overflow-x-hidden bg-[#F2E8D2] text-[#3B2F1E]"
      data-bn={isBn ? "1" : "0"}
      style={{ fontFamily: BRAND_FONT }}
    >
      <BrandFonts />
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-5 sm:px-8 sm:py-7">
        <header className="flex w-full items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#5A4A32] transition-colors hover:bg-white hover:text-[#B91C1C]"
          >
            <ArrowLeft size={17} />
            <span>{tx("Back to sign in", "লগইনে ফিরে যান")}</span>
          </Link>

          <div
            className="inline-flex items-center gap-1 rounded-xl border border-[#E3D6B8] bg-white/90 p-1 shadow-sm"
            aria-label={tx("Language", "ভাষা")}
          >
            {(["en", "bn"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={locale === code}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  locale === code ? "bg-[#DC2626] text-white shadow-sm" : "text-[#5A4A32] hover:bg-[#EFE3C8]"
                }`}
              >
                {code === "en" ? "EN" : "বাংলা"}
              </button>
            ))}
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-md">
            <div className="mb-7 flex flex-col items-center text-center">
              <Link href="/" className="mb-6 inline-flex items-center">
                <SiteBrandLogo width={140} height={45} className="h-[45px] w-auto" />
              </Link>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FDECEC] to-[#FBD5D5] text-[#DC2626] ring-1 ring-[#FBD5D5]">
                {step === 1 ? <KeyRound size={24} /> : <ShieldCheck size={25} />}
              </div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#FBD5D5] bg-[#FDECEC] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#B91C1C]">
                <ShieldCheck size={12} />
                {tx("Secure account recovery", "নিরাপদ অ্যাকাউন্ট পুনরুদ্ধার")}
              </div>
              <h1 className="text-[1.7rem] font-bold leading-snug tracking-tight text-[#3B2F1E] sm:text-3xl">
                {step === 1 ? tx("Forgot your password?", "পাসওয়ার্ড ভুলে গেছেন?") : tx("Reset your password", "পাসওয়ার্ড রিসেট করুন")}
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#7A6A50]">
                {step === 1
                  ? tx(
                      "Enter your account email and we'll send you a one-time reset code.",
                      "আপনার অ্যাকাউন্টের ইমেইল দিন, আমরা একটি রিসেট কোড পাঠাব।",
                    )
                  : isBn
                    ? <>এই ইমেইলে অ্যাকাউন্ট থাকলে ৬ সংখ্যার কোড পাঠানো হয়েছে: <span className="break-all font-semibold text-[#3B2F1E]">{email}</span>। কোড না এলে ঠিকানা ও স্প্যাম ফোল্ডার দেখুন।</>
                    : <>If an account exists for <span className="break-all font-semibold text-[#3B2F1E]">{email}</span>, enter the 6-digit code we sent. If nothing arrives, check the address and your spam folder.</>}
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-[0_28px_60px_-34px_rgba(59,47,30,0.45)] sm:p-9">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#E5393B] via-[#DC2626] to-[#F0B27A]" />

              {error && (
                <div role="alert" aria-live="polite" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
              {message && (
                <div role="status" aria-live="polite" className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-700">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="recovery-email" className={labelClass}>
                      {tx("Email address", "ইমেইল ঠিকানা")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={17} aria-hidden="true" className={iconClass} />
                      <input
                        id="recovery-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder={tx("Enter your email", "আপনার ইমেইল লিখুন")}
                        value={email}
                        onChange={(event) => { setEmail(event.target.value); setError(""); setMessage(""); }}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className={primaryButton}>
                    {loading ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        <span>{tx("Sending code...", "কোড পাঠানো হচ্ছে...")}</span>
                      </>
                    ) : (
                      tx("Send reset code", "রিসেট কোড পাঠান")
                    )}
                  </button>
                  <p className="text-center text-[11px] leading-5 text-[#7A6A50]">
                    {tx(
                      "If an account exists for this email, a one-time code will be emailed. For your security, the same message is shown either way.",
                      "এই ইমেইলে অ্যাকাউন্ট থাকলে একটি একবারের কোড ইমেইলে পাঠানো হবে। নিরাপত্তার জন্য সব ক্ষেত্রেই একই বার্তা দেখানো হয়।",
                    )}
                  </p>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="rounded-2xl border border-[#FBD5D5] bg-gradient-to-br from-[#F6EFDC] to-[#FDECEC]/70 p-4 sm:p-5">
                    <label htmlFor="recovery-otp" className="mb-2.5 block text-xs font-bold text-[#4A3C27]">
                      {tx("Enter 6-digit code", "৬ সংখ্যার কোড লিখুন")}
                    </label>
                    <input
                      id="recovery-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      maxLength={6}
                      placeholder="1 2 3 4 5 6"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full rounded-xl border border-[#F5B5B5] bg-white px-4 py-3.5 text-center text-xl font-extrabold tracking-[0.35em] text-[#3B2F1E] outline-none transition placeholder:text-[#9A8A6E] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/15"
                    />
                    <p className="mt-2.5 text-center text-[11px] leading-5 text-[#7A6A50]">
                      {tx("The code is valid for 5 minutes. Keep it private.", "কোডটি ৫ মিনিট পর্যন্ত কার্যকর। এটি গোপন রাখুন।")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="new-password" className={labelClass}>
                      {tx("New password", "নতুন পাসওয়ার্ড")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={17} aria-hidden="true" className={iconClass} />
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={128}
                        placeholder={tx("Create a new password", "নতুন পাসওয়ার্ড তৈরি করুন")}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute right-3.5 rounded-md p-1 text-[#9A8A6E] transition-colors hover:text-[#4A3C27] focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                        aria-label={showPassword ? tx("Hide password", "পাসওয়ার্ড লুকান") : tx("Show password", "পাসওয়ার্ড দেখান")}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm-new-password" className={labelClass}>
                      {tx("Confirm new password", "নতুন পাসওয়ার্ড নিশ্চিত করুন")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={17} aria-hidden="true" className={iconClass} />
                      <input
                        id="confirm-new-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={128}
                        placeholder={tx("Re-enter the new password", "আবার পাসওয়ার্ড লিখুন")}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className={`${primaryButton} mt-1`}>
                    {loading ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        <span>{tx("Resetting password...", "পাসওয়ার্ড রিসেট হচ্ছে...")}</span>
                      </>
                    ) : (
                      tx("Reset password", "পাসওয়ার্ড রিসেট করুন")
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(""); setError(""); setMessage(""); }}
                    className="w-full rounded-xl px-3 py-2 text-xs font-semibold text-[#7A6A50] transition hover:text-[#DC2626]"
                  >
                    {tx("Use a different email", "অন্য ইমেইল ব্যবহার করুন")}
                  </button>
                </form>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-[#5A4A32]">
              {tx("Remembered your password?", "পাসওয়ার্ড মনে পড়েছে?")}{" "}
              <Link href="/login" className="font-bold text-[#DC2626] transition-colors hover:text-[#991B1B] hover:underline">
                {tx("Sign in", "লগইন করুন")}
              </Link>
            </p>
          </div>
        </section>

        <footer className="pb-2 text-center text-xs text-[#9A8A6E]">
          © {new Date().getFullYear()} <BrandName accentClassName="text-[#9A8A6E]" />. {tx("All rights reserved.", "সর্বস্বত্ব সংরক্ষিত।")}
        </footer>
      </div>
    </main>
  );
}
