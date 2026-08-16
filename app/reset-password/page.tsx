"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Recycle, CheckCircle2, Loader2, Lock, ArrowLeft, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function checkRecoverySession() {
      try {
        // 1. Check existing Supabase session (e.g. set by PKCE / hash token exchange)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setHasValidSession(true);
          setVerifyingSession(false);
          return;
        }

        // 2. Listen to Auth state change for PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" || session?.user) {
            setHasValidSession(true);
          }
          setVerifyingSession(false);
        });

        // 3. Timeout fallback if no recovery session detected after 2 seconds
        setTimeout(() => {
          setVerifyingSession(false);
        }, 2000);

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        setVerifyingSession(false);
      }
    }

    checkRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push("/sign-in");
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password. Please request a new reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-teal-500/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-xl shadow-teal-500/20">
              <Recycle className="h-6 w-6" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">Trash2Treasure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Set New Password</h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-sm">
            Enter your secure new password below to update your account credentials.
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/90 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl"
        >
          {verifyingSession ? (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-teal-400 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Verifying reset token & session...</p>
            </div>
          ) : !hasValidSession && !success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Invalid or Expired Link</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  The password reset link has expired or is invalid. Please request a new password reset email.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/sign-in">
                  <Button className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Request New Reset Link</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center py-6 space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-7 w-7" />
              </motion.div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Password Updated Successfully! 🎉</h2>
                <p className="text-xs text-slate-400">Redirecting you to the sign-in page...</p>
              </div>
              <div className="pt-2 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* New Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 text-white placeholder-slate-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 text-white placeholder-slate-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer shadow-lg shadow-teal-500/10"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> : "Update Password"}
              </Button>

              <div className="text-center pt-2">
                <Link href="/sign-in" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
