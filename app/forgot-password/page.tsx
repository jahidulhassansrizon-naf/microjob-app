"use client";
import { T } from "@/components/i18n/I18nProvider";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Loader2, Lock, Mail, ShieldCheck, } from "lucide-react";
export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    // Step 1: Send OTP to Email
    const handleSendOtp = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || data.error || "Failed to send OTP.");
            }
            setMessage("An OTP code has been sent to your email.");
            setStep(2);
        }
        catch (err: any) {
            setError(err.message || "Something went wrong.");
        }
        finally {
            setLoading(false);
        }
    };
    // Step 2: Reset Password with OTP
    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault();
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
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    otp: otp.trim(),
                    newPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || data.error || "Failed to reset password.");
            }
            setMessage("Password reset successful! Redirecting to login...");
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        }
        catch (err: any) {
            setError(err.message || "Something went wrong.");
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col justify-center items-center px-4 py-12 relative">
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-6 relative overflow-hidden">
        {/* Accent Top Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2563EB] via-[#10B981] to-[#2563EB]"/>

        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#2563EB] transition-colors">
          <ArrowLeft size={14}/><T>{"Back to Sign In\r\n        "}</T></Link>

        <div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2563EB] mb-3">
            {step === 1 ? <KeyRound size={22}/> : <ShieldCheck size={22}/>}
          </div>

          <h2 className="text-xl font-bold text-[#0F172A]">
            {step === 1 ? <T>{"Forgot Password?"}</T> : <T>{"Reset Password"}</T>}
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            {step === 1
        ? <T>{"Enter your account email to receive a password reset OTP code."}</T> : <T>{`Enter the 6-digit OTP code sent to ${email}`}</T>}
          </p>
        </div>

        {error && (<div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
            {error}
          </div>)}

        {message && (<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-[#10B981]">
            {message}
          </div>)}

        {step === 1 ? (<form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5"><T>{"Email Address\r\n              "}</T></label>

              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>

                <input type="email" required placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F172A] placeholder-slate-400 outline-none transition-all"/>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-60 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.99] cursor-pointer">
              {loading && <Loader2 size={15} className="animate-spin"/>}
              {loading ? <T>{"Sending OTP..."}</T> : <T>{"Send OTP Code"}</T>}
            </button>
          </form>) : (<form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5"><T>{"OTP Verification Code\r\n              "}</T></label>

              <input type="text" required maxLength={6} placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] placeholder-slate-400 outline-none text-center tracking-widest font-bold transition-all"/>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5"><T>{"New Password\r\n              "}</T></label>

              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>

                <input type="password" required placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F172A] placeholder-slate-400 outline-none transition-all"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5"><T>{"Confirm New Password\r\n              "}</T></label>

              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>

                <input type="password" required placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F172A] placeholder-slate-400 outline-none transition-all"/>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-[0.99] cursor-pointer">
              {loading && <Loader2 size={15} className="animate-spin"/>}
              {loading ? <T>{"Resetting Password..."}</T> : <T>{"Reset Password"}</T>}
            </button>
          </form>)}
      </div>
    </div>);
}
