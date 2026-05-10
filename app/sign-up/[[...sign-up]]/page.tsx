'use client';

import { useEffect } from "react";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Recycle, Sparkles, Award, Shield } from "lucide-react";

export default function SignUpPage() {
  // Prevent scrolling on the body when this page is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, []);

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ── Left: Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-cyan-400/15 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
            <img
                src="/logo.png"
                alt="Trash2Treasure Logo"
                className="w-full h-full object-contain rounded-lg shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 hover:brightness-105"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(240,253,244,0.15) 100%)",
                  padding: '0.1rem'
                }}
              />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">T2T</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-4 drop-shadow-lg">
            Start Your <br />
            <span className="text-yellow-300">Green Journey</span>
          </h1>

          <p className="text-lg text-white/80 leading-relaxed mb-10">
            Create your free account and join the recycling revolution. Every piece of waste you recycle earns real rewards.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: Sparkles, text: "Get 50 welcome credits on signup", highlight: true },
              { icon: Award, text: "Climb the leaderboard and earn badges" },
              { icon: Shield, text: "Secure and verified by Telangana Gov." },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all
                ${item.highlight
                  ? "bg-yellow-400/20 border-yellow-400/30 shadow-lg shadow-yellow-400/10"
                  : "bg-white/10 border-white/10 backdrop-blur-sm"
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  ${item.highlight ? "bg-yellow-400/30" : "bg-white/20"}`}>
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className={`text-sm font-medium ${item.highlight ? "text-yellow-100" : "text-white/90"}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-orange-500"].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/70">
              <span className="font-bold text-white">12,000+</span> eco-warriors already joined
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Sign-Up Form ── */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile header (hidden on desktop) */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center gap-2 bg-emerald-50 rounded-full px-4 py-2 mb-6">
              <Recycle className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">Trash2Treasure</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Create Account</h1>
            <p className="text-gray-500 text-sm">Join the recycling revolution today</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Create Your Account</h2>
            <p className="text-gray-500 text-sm">Start earning rewards for recycling</p>
          </div>

          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                footer: "hidden",
              },
            }}
          />

          {/* Sign-in link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              By creating an account, you agree to our{" "}
              <span className="text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium">Terms of Service</span>
              {" "}and{" "}
              <span className="text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
