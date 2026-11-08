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
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const changeLanguage = (target: "EN" | "BN") => setLocale(target === "BN" ? "bn" : "en");

  // Step 1: send the OTP to the email.
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
        throw new Error(data.message || data.error || tx("Failed to send OTP.", "OTP পাঠানো যায়নি।"));
      }
      setMessage(
        tx(
          "If an account matches this email, a reset code will be sent. Check your inbox and spam folder.",
          "এই ইমেইলের সঙ্গে অ্যাকাউন্ট থাকলে রিসেট কোড পাঠানো হবে। ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।",
        ),
      );
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tx("Something went wrong.", "কিছু একটা ভুল হয়েছে।"));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: reset the password with the OTP.
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
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || tx("Failed to reset password.", "পাসওয়ার্ড রিসেট করা যায়নি।"));
      }
      setMessage(
        tx(
          "Password reset successful! Redirecting to login...",
          "পাসওয়ার্ড সফলভাবে রিসেট হয়েছে! লগইন পেজে নেওয়া হচ্ছে...",
        ),
      );
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tx("Something went wrong.", "কিছু একটা ভুল হয়েছে।"));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#E3D6B8] bg-white py-3 pl-10 pr-4 text-sm text-[#3B2F1E] outline-none transition-all placeholder:text-[#9A8A6E] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10";
  const labelClass = "block text-sm font-semibold text-[#4A3C27]";
  const iconClass = "pointer-events-none absolute left-3.5 text-[#9A8A6E]";
  const eyeClass =
    "absolute right-3.5 rounded-md p-1 text-[#9A8A6E] transition-colors hover:text-[#4A3C27] focus:outline-none focus:ring-2 focus:ring-[#DC2626]";
  const primaryBtn =
    "mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E5393B] to-[#B91C1C] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#DC2626]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DC2626]/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#F2E8D2] text-[#3B2F1E]"
      data-bn={isBn ? "1" : "0"}
      style={{ fontFamily: BRAND_FONT }}
    >
      <BrandFonts />
      <main className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-between p-5 sm:p-8 lg:px-10 lg:py-8 xl:px-12">
        <div className="flex w-full items-center justify-between gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#5A4A32] transition hover:text-[#DC2626]"
          >
            <ArrowLeft size={16} />
            <span>{tx("Back to Sign In", "সাইন ইন-এ ফিরে যান")}</span>
          </Link>
          <div
            className="inline-flex rounded-xl border border-[#E3D6B8] bg-white p-1 text-xs font-bold shadow-sm"
            aria-label={tx("Choose language", "ভাষা নির্বাচন করুন")}
          >
            <button
              type="button"
              onClick={() => changeLanguage("EN")}
              aria-pressed={locale === "en"}
              className={`rounded-lg px-3 py-1.5 transition ${locale === "en" ? "bg-[#DC2626] text-white shadow" : "text-[#5A4A32] hover:bg-[#F6EFDC]"}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => changeLanguage("BN")}
              aria-pressed={locale === "bn"}
              className={`rounded-lg px-3 py-1.5 transition ${locale === "bn" ? "bg-[#DC2626] text-white shadow" : "text-[#5A4A32] hover:bg-[#F6EFDC]"}`}
            >
              বাংলা
            </button>
          </div>
        </div>

        <section className="mx-auto my-auto w-full max-w-md py-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Link href="/" className="mb-5 inline-flex items-center" aria-label={tx("Seba Lagbe home", "সেবা লাগবে হোম")}>
              <SiteBrandLogo width={140} height={45} className="h-[45px] w-auto" />
            </Link>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] text-[#DC2626] shadow-sm">
              {step === 1 ? <KeyRound size={25} /> : <ShieldCheck size={25} />}
            </div>
            <h1 className="text-[1.7rem] font-bold leading-snug tracking-tight text-[#3B2F1E] sm:text-3xl">
              {step === 1 ? tx("Forgot Password?", "পাসওয়ার্ড ভুলে গেছেন?") : tx("Reset Password", "পাসওয়ার্ড রিসেট করুন")}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#7A6A50]">
              {step === 1
                ? tx(
                    "Enter your account email to receive a password reset OTP code.",
                    "আপনার অ্যাকাউন্টের ইমেইল দিন, আমরা পাসওয়ার্ড রিসেটের OTP কোড পাঠাব।",
                  )
                : tx(
                    `If an account exists for ${email}, enter the 6-digit code. If no code arrives, check the address and spam folder.`,
                    `${email} ইমেইলে অ্যাকাউন্ট থাকলে ৬ সংখ্যার কোডটি দিন। কোড না এলে ঠিকানা ও স্প্যাম ফোল্ডার দেখুন।`,
                  )}
            </p>
          </div>

          <div className="relative rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-[0_28px_60px_-34px_rgba(59,47,30,0.45)] sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#E5393B] via-[#DC2626] to-[#F0B27A]" />

            {error && (
              <div role="alert" aria-live="polite" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div role="status" aria-live="polite" className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium leading-5 text-emerald-700">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="recovery-email" className={labelClass}>
                    {tx("Email Address", "ইমেইল ঠিকানা")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={17} aria-hidden="true" className={iconClass} />
                    <input
                      id="recovery-email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder={tx("Enter your email", "আপনার ইমেইল ঠিকানা লিখুন")}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                        setMessage("");
                      }}
                      className={inputClass}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      <span>{tx("Sending OTP...", "OTP পাঠানো হচ্ছে...")}</span>
                    </>
                  ) : (
                    tx("Send OTP Code", "OTP কোড পাঠান")
                  )}
                </button>
                <p className="text-center text-[11px] leading-5 text-[#9A8A6E]">
                  {tx(
                    "If an account exists for this email, a one-time code will be emailed. For your security, the same message is shown either way.",
                    "এই ইমেইলে অ্যাকাউন্ট থাকলে একটি ওয়ান-টাইম কোড পাঠানো হবে। আপনার নিরাপত্তার জন্য উভয় ক্ষেত্রেই একই বার্তা দেখানো হয়।",
                  )}
                </p>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="recovery-otp" className={labelClass}>
                    {tx("OTP Verification Code", "OTP যাচাইকরণ কোড")} <span className="text-red-500">*</span>
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
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-xl border border-[#E3D6B8] bg-white px-4 py-3.5 text-center text-lg font-extrabold tracking-[0.35em] text-[#3B2F1E] outline-none transition-all placeholder:text-[#9A8A6E] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="new-password" className={labelClass}>
                    {tx("New Password", "নতুন পাসওয়ার্ড")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={17} aria-hidden="true" className={iconClass} />
                    <input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder={tx("Enter new password", "নতুন পাসওয়ার্ড লিখুন")}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className={eyeClass}
                      aria-label={showNew ? tx("Hide password", "পাসওয়ার্ড লুকান") : tx("Show password", "পাসওয়ার্ড দেখান")}
                      aria-pressed={showNew}
                    >
                      {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-new-password" className={labelClass}>
                    {tx("Confirm New Password", "নতুন পাসওয়ার্ড নিশ্চিত করুন")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={17} aria-hidden="true" className={iconClass} />
                    <input
                      id="confirm-new-password"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder={tx("Confirm new password", "আবার পাসওয়ার্ড লিখুন")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className={eyeClass}
                      aria-label={showConfirm ? tx("Hide password", "পাসওয়ার্ড লুকান") : tx("Show password", "পাসওয়ার্ড দেখান")}
                      aria-pressed={showConfirm}
                    >
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      <span>{tx("Resetting Password...", "পাসওয়ার্ড রিসেট হচ্ছে...")}</span>
                    </>
                  ) : (
                    tx("Reset Password", "পাসওয়ার্ড রিসেট করুন")
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setError("");
                    setMessage("");
                  }}
                  className="w-full rounded-xl px-3 py-2 text-xs font-bold text-[#5A4A32] transition hover:text-[#DC2626]"
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
        </section>

        <footer className="pb-2 text-center text-xs text-[#9A8A6E]">
          © {new Date().getFullYear()} <BrandName accentClassName="text-[#9A8A6E]" />.{" "}
          {tx("All rights reserved.", "সর্বস্বত্ব সংরক্ষিত।")}
        </footer>
      </main>
    </div>
  );
}
