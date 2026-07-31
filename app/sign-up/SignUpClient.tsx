"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, Loader2, ArrowRight, User, MapPin, Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";

export default function SignUpClient() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();

      // 1. Register user via Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      // 2. Email confirmation pending — show the verification screen
      if (data.user && !data.session) {
        setIsPendingVerification(true);
        return;
      }

      // 3. Session is live — sync public profile records
      if (data.user && data.session) {
        try {
          await fetch("/api/auth/supabase-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Pass the JWT so the API can trust this request
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({
              id: data.user.id,
              name: fullName,
              email: email.trim().toLowerCase(),
            }),
          });
        } catch (syncErr) {
          // Non-blocking — the trigger should have already created the profile
          console.warn("⚠️ supabase-sync call failed (trigger may cover this):", syncErr);
        }
      }

      router.push("/dashboard/home");
    } catch (err: any) {
      console.error("❌ Sign up error caught:", err);
      let msg = "Failed to create account. Please try again.";
      if (typeof err === "string") msg = err;
      else if (err?.message && err.message !== "{}") msg = err.message;
      else if (err?.error_description) msg = err.error_description;
      else if (err?.name === "AuthRetryableFetchError" || err?.message === "{}")
        msg = "Database configuration error. Please run the SQL migration in Supabase.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
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

  return (
    <main className="min-h-screen bg-[#020617] flex overflow-hidden font-sans">
      {/* Left Decoration Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-950/20 items-center justify-center p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-lg"
        >
          <div className="w-24 h-24 bg-emerald-500/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-10 border border-white/10 shadow-2xl shadow-emerald-500/20">
            <Leaf className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Green</span> Journey
          </h1>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            Create an account today and start earning rewards for making the world a cleaner place.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Localized Impact</div>
                <div className="text-slate-500 text-xs font-medium">Contribute to recycling in your city</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-left">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Instant Rewards</div>
                <div className="text-slate-500 text-xs font-medium">Earn points immediately after verification</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Content Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <Link
          href="/"
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg backdrop-blur-sm z-50 group"
          aria-label="Close"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        </Link>

        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[80%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md py-12"
        >
          {/* Logo (Mobile only) */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Trash2Treasure</span>
          </div>

          <div>
            {isPendingVerification ? (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                  <Mail className="w-8 h-8 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Check your email</h2>
                  <p className="text-slate-400 font-medium">
                    We've sent a verification link to <span className="text-white font-bold">{email}</span>. Please click the link to activate your account.
                  </p>
                </div>
                
                <div className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl text-left text-sm text-slate-400 space-y-3">
                  <p className="font-bold text-slate-300">Didn't receive the email?</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Check your spam or junk folder.</li>
                    <li>Verify that the email address you entered is correct.</li>
                    <li>If you are running locally, click the verification link printed in your server terminal logs.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <Link
                    href="/sign-in"
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold transition-all shadow-md active:scale-[0.98]"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
                  <p className="text-slate-400 mt-2 font-medium">Join our mission for a cleaner planet</p>
                </div>

                <form className="space-y-4" onSubmit={handleSignUp}>
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
                  </  AnimatePresence>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300 ml-1">First Name</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                          <User className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                          className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300 ml-1">Last Name</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Email address</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="default@gmail.com"
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="signup-submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] mt-4"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
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
              </>
            )}

            <p className="mt-10 text-center text-slate-400 font-medium">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors underline-offset-4 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
