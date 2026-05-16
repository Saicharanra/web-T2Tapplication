"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { createUser, getUser } from "@/lib/firebase-db";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, Loader2, ArrowRight} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Ensure user exists in Firestore
      const existingUser = await getUser(user.uid);
      if (!existingUser) {
        await createUser(user.uid, {
          name: user.displayName || email.split("@")[0],
          email: user.email!,
          role: "USER",
          level: "BRONZE",
          points: 0,
          status: "ACTIVE",
          location: "Not specified",
          imageUrl: user.photoURL,
        });
      }

      router.push("/dashboard/home");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not create them
      const existingUser = await getUser(user.uid);
      if (!existingUser) {
        await createUser(user.uid, {
          name: user.displayName || "Anonymous User",
          email: user.email!,
          role: "USER",
          level: "BRONZE",
          points: 0,
          status: "ACTIVE",
          location: "Not specified",
          imageUrl: user.photoURL,
        });
      }
      router.push("/dashboard/home");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex overflow-hidden font-sans">
      {/* Left Decoration Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-teal-950/20 items-center justify-center p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-500/10 blur-[100px] rounded-full animate-bounce" style={{ animationDuration: '8s' }} />
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
          
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
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

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-slate-400 mt-2 font-medium">Please enter your details to sign in</p>
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
            </AnimatePresence>

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
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-slate-300">Password</label>
                <Link href="#" className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-[#020617] px-4 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          <p className="mt-10 text-center text-slate-400 font-medium">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-teal-400 font-bold hover:text-teal-300 transition-colors underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
