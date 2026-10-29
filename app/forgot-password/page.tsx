"use client";

import SiteBrandLogo from "@/app/_components/SiteBrandLogo";
import { T, useI18n } from "@/components/i18n/I18nProvider";
import BrandName from "@/app/_components/BrandName";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const isBn = locale === "bn";
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Step 1: Send OTP to email.
  const handleSendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Please enter your email address.");
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
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to send OTP.");
      }
      setMessage(isBn
        ? "এই ইমেইলের সঙ্গে অ্যাকাউন্ট থাকলে রিসেট কোড পাঠানো হবে। ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।"
        : "If an account matches this email, a reset code will be sent. Check your inbox and spam folder.");
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
      setError("Please complete all fields.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
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
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to reset password.");
      }
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
  const labelClass = "mb-2 block text-xs font-bold text-slate-700";

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-white font-sans text-slate-900">
      {/* Soft blue-violet atmosphere used across the সেবা লাগবে website. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-36 -top-36 h-[26rem] w-[26rem] rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute -right-36 top-10 h-[30rem] w-[30rem] rounded-full bg-violet-200/50 blur-3xl" />
        <div className="absolute bottom-[-13rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(to right, rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.07) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "linear-gradient(to bottom, black, transparent 82%)" }} />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" aria-label={isBn ? "সেবা লাগবে হোম" : "Seba Lagbe home"} className="inline-flex min-w-0 items-center">
          <SiteBrandLogo width={140} height={45} className="h-[45px] w-auto" />
        </Link>
        <Link href="/login" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm backdrop-blur transition hover:border-indigo-200 hover:text-indigo-600 sm:px-4">
          <ArrowLeft size={14} />
          <T>Back to Sign In</T>
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100svh-84px)] w-full max-w-6xl items-center justify-center px-4 pb-12 pt-3 sm:px-8 sm:pb-16">
        <section className="w-full max-w-md">
          <div className="mb-6 text-center sm:mb-7">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-100 text-indigo-600 ring-1 ring-indigo-100 shadow-sm shadow-indigo-100/70">
              {step === 1 ? <KeyRound size={25} /> : <ShieldCheck size={25} />}
            </div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
              <ShieldCheck size={12} />
              <T>Secure account recovery</T>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {step === 1 ? <T>Forgot Password?</T> : <T>Reset Password</T>}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {step === 1
                ? <T>Enter your account email to receive a password reset OTP code.</T>
                : <T>{`If an account exists for ${email}, enter the 6-digit code. If no code arrives, check the address and spam folder.`}</T>}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/90 bg-white/90 p-5 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500" />

            {error && (
              <div role="alert" aria-live="polite" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-semibold leading-5 text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div role="status" aria-live="polite" className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-semibold leading-5 text-emerald-700">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label htmlFor="recovery-email" className={labelClass}><T>Email Address</T></label>
                  <div className="relative">
                    <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="recovery-email" type="email" autoComplete="email" required placeholder="Enter your email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); setMessage(""); }} className={inputClass} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? <T>Sending OTP...</T> : <T>Send OTP Code</T>}
                </button>
                <p className="text-center text-[11px] leading-5 text-slate-400"><T>If an account exists for this email, a one-time code will be emailed. For your security, the same message is shown either way.</T></p>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="recovery-otp" className={labelClass}><T>OTP Verification Code</T></label>
                  <input id="recovery-otp" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} placeholder="1 2 3 4 5 6" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="w-full rounded-xl border border-indigo-200 bg-indigo-50/40 px-4 py-3.5 text-center text-lg font-extrabold tracking-[0.35em] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label htmlFor="new-password" className={labelClass}><T>New Password</T></label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} placeholder="Enter new password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className={labelClass}><T>Confirm New Password</T></label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="confirm-new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? <T>Resetting Password...</T> : <T>Reset Password</T>}
                </button>
                <button type="button" onClick={() => { setStep(1); setOtp(""); setError(""); setMessage(""); }} className="w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600">
                  <T>Use a different email</T>
                </button>
              </form>
            )}
          </div>

          <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">© {new Date().getFullYear()} <BrandName accentClassName="text-slate-400" />. <T>All rights reserved.</T></p>
        </section>
      </main>
    </div>
  );
}
