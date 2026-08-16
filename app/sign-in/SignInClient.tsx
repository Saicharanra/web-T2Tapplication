"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/components/providers/AuthProvider";

export default function SignInClient() {
  const [step, setStep] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for query parameters related to verification link redirects
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    const errorParam = params.get("error");

    if (verified === "true") {
      setSuccessMessage("Email verified successfully! You can now sign in.");
    } else if (verified === "false") {
      if (errorParam === "invalid_token") {
        setError("The verification link is invalid or has expired.");
      } else {
        setError("Account verification failed. Please try registering again.");
      }
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      // Fetch user profile role from Supabase
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = (profile?.role || data.user.user_metadata?.role || "user").toLowerCase();

      // Strictly allow ONLY 'user' role
      if (role !== "user") {
        await supabase.auth.signOut();
        throw new Error(`Access denied: Account role is '${role}'. Only standard 'user' accounts are permitted to log into the User Web App.`);
      }

      router.push("/dashboard/home");
    } catch (err: any) {
      if (err.message === "Invalid login credentials") {
        setError("Account not found or invalid credentials. Please create an account to access.");
      } else {
        setError(err.message || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback",
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google sign in");
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccessMessage("A password reset link has been sent to your email address!");
      setStep("signin");
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
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
          <div className="flex justify-center mx-auto mb-8">
            <Image src={logo} alt="Trash2Treasure Logo" className="w-28 h-auto object-contain drop-shadow-md" priority />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Waste to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Wealth</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            Join the community of environmental champions turning waste into meaningful rewards.
          </p>
          <div className="mt-12 flex items-center gap-3 bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 text-left">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Secure Sign-In</div>
              <div className="text-slate-500 text-xs font-medium">Enter your credentials to access your green dashboard</div>
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
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg backdrop-blur-sm z-50 group"
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
            <Image src={logo} alt="Trash2Treasure Logo" className="h-10 w-auto" priority />
            <span className="text-2xl font-bold text-white tracking-tight">Trash2Treasure</span>
          </div>

          <AnimatePresence mode="wait">
            {step === "signin" ? (
              <motion.div
                key="signin-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
                  <p className="text-slate-400 mt-2 font-medium">Enter your credentials to sign in</p>
                </div>

                <form className="space-y-5" onSubmit={handleSignIn}>
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
                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 text-sm flex items-start gap-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        {successMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Address */}
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

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-semibold text-slate-300">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("forgot");
                          setError("");
                          setSuccessMessage("");
                        }}
                        className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 focus:text-teal-400 transition-colors cursor-pointer focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="signin-submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#020617] px-2 text-slate-500 font-bold">Or continue with</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 border border-white/10 text-white rounded-2xl font-bold transition-all shadow-md active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Google
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
                key="forgot-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Reset Password</h2>
                  <p className="text-slate-400 mt-2 font-medium">Enter your email address to receive a secure recovery link</p>
                </div>

                <form className="space-y-5" onSubmit={handleResetPassword}>
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

                  {/* Email Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Email address</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
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
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Reset Link <ArrowRight className="w-5 h-5" /></>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("signin");
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="w-full py-3.5 bg-transparent border border-white/10 hover:bg-white/5 text-slate-300 rounded-2xl font-bold transition-all"
                  >
                    Back to Sign In
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
