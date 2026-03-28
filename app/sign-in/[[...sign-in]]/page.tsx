'use client';

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Recycle, Leaf, TreePine } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ── Left: Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
              <Recycle className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">T2T</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-4 drop-shadow-lg">
            Turn Waste Into <br />
            <span className="text-yellow-300">Real Rewards</span>
          </h1>

          <p className="text-lg text-white/80 leading-relaxed mb-10">
            Join thousands of citizens making Telangana cleaner. Recycle, upload, and earn eco-credits instantly.
          </p>

          {/* Feature pills */}
          <div className="space-y-4">
            {[
              { icon: Leaf, text: "Earn credits for every recyclable item" },
              { icon: TreePine, text: "Plant trees with your earned points" },
              { icon: Recycle, text: "Track your environmental impact" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Sign-In Form ── */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile header (hidden on desktop) */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-2 mb-6">
              <Recycle className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-bold text-teal-700">Trash2Treasure</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in to continue your green journey</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in to your Trash2Treasure account</p>
          </div>

          <SignIn
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

          {/* Sign-up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors">
                Sign up
              </Link>
            </p>
          </div>

          {/* Terms footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              By signing in, you agree to our{" "}
              <span className="text-teal-600 hover:text-teal-700 cursor-pointer font-medium">Terms of Service</span>
              {" "}and{" "}
              <span className="text-teal-600 hover:text-teal-700 cursor-pointer font-medium">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
