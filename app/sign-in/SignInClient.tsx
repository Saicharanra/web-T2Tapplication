"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Leaf, Mail, Loader2, ArrowRight, X, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Step = "email" | "otp";

export default function SignInClient() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const router = useRouter();

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send verification code");
      setResendTimer(60);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError("");
    setResendSuccess(false);
    try {
      const res = await fetch("/api/auth/otp/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code");
      setResendTimer(60);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpValues.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }
    setError("");
    setOtpLoading(true);
    try {
      // 1. Verify the OTP
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpCode }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");

      // 2. Fetch user from Supabase by email
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (userError || !userData) {
        throw new Error("No account found for this email. Please sign up first.");
      }

      // 3. Store userId in localStorage and redirect
      localStorage.setItem("t2t_user_id", userData.id);
      router.push("/dashboard/home");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newValues = [...otpValues];
    newValues[index] = value.substring(value.length - 1);
    setOtpValues(newValues);
    if (value && index < 5) {
      document.getElementById(`signin-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const newValues = [...otpValues];
        newValues[index - 1] = "";
        setOtpValues(newValues);
        document.getElementById(`signin-otp-${index - 1}`)?.focus();
      } else {
        const newValues = [...otpValues];
        newValues[index] = "";
        setOtpValues(newValues);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(paste)) {
      setOtpValues(paste.split(""));
      document.getElementById(`signin-otp-5`)?.focus();
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] flex overflow-hidden font-sans">
      {/* Left Decoration Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-teal-950/20 items-center justify-center p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-500/10 blur-[100px] rounded-full animate-bounce" style={{ animationDuration: "8s" }} />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-lg"
        >
          <div className="w-24 h-24 bg-teal-500/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-10 border border-white/10 shadow-2xl shadow-teal-500/20">
            <Leaf className="w-12 h-12 text-teal-400" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Waste to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Wealth</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            Join the community of environmental champions turning waste into meaningful rewards.
          </p>
          <div className="mt-12 flex items-center gap-3 bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 text-left">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Passwordless Sign-In</div>
              <div className="text-slate-500 text-xs font-medium">Enter your email and verify with a one-time code</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="text-teal-400 font-bold text-2xl mb-1">20K+</div>
              <div className="text-slate-500 text-xs uppercase tracking-wider font-bold">Active Users</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="text-emerald-400 font-bold text-2xl mb-1">50T+</div>
              <div className="text-slate-500 text-xs uppercase tracking-wider font-bold">Waste Recycled</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Content Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <Link
          href="/"
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg backdrop-blur-sm z-50 group animate-in fade-in duration-300"
          aria-label="Close"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        </Link>

        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[80%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo (Mobile only) */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Trash2Treasure</span>
          </div>

          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
                  <p className="text-slate-400 mt-2 font-medium">Enter your email to receive a sign-in code</p>
                </div>

                <form className="space-y-5" onSubmit={handleSendOtp}>
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl p-4 text-sm flex items-start gap-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Email address</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        id="signin-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@gmail.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="signin-send-otp"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Verification Code <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>

                <p className="mt-10 text-center text-slate-400 font-medium">
                  Don't have an account?{" "}
                  <Link href="/sign-up" className="text-teal-400 font-bold hover:text-teal-300 transition-colors underline-offset-4 hover:underline">
                    Create an account
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Enter Code</h2>
                  <p className="text-slate-400 mt-2 font-medium">
                    We sent a 6-digit code to <span className="text-teal-400 font-semibold">{email}</span>
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleVerifyOtp}>
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl p-4 text-sm flex items-start gap-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        {error}
                      </motion.div>
                    )}
                    {resendSuccess && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 text-sm flex items-start gap-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        Verification code resent successfully!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-between gap-2 md:gap-3 my-8">
                    {otpValues.map((digit, index) => (
                      <input
                        key={index}
                        id={`signin-otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        required
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all outline-none"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    id="signin-verify-otp"
                    disabled={otpLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98]"
                  >
                    {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                  </button>

                  <div className="text-center space-y-4 pt-4">
                    <p className="text-sm text-slate-400">
                      Didn't receive the code?{" "}
                      {resendTimer > 0 ? (
                        <span className="text-slate-500 font-semibold">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-teal-400 font-bold hover:text-teal-300 transition-colors underline-offset-4 hover:underline focus:outline-none"
                        >
                          Resend Code
                        </button>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setStep("email"); setError(""); setOtpValues(Array(6).fill("")); }}
                      className="text-sm text-slate-400 hover:text-white font-semibold transition-colors underline-offset-4 hover:underline focus:outline-none"
                    >
                      Change Email / Back
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
