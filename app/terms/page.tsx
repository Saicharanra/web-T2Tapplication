"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Scale } from "lucide-react";
import Footer from "@/app/dashboard/footer/page";

export default function TermsOfService() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing or using the Trash2Treasure platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the application."
    },
    {
      title: "2. User Accounts and Verification",
      content: "To access certain features (such as scanning and claiming rewards), you must register for an account using a valid email. You are responsible for maintaining the confidentiality of your account credentials and are fully responsible for all activities that occur under your account."
    },
    {
      title: "3. Recycling Submissions & Integrity",
      content: "All waste uploads must be honest and represent actual recyclable items. Submitting fake, repetitive, or non-recyclable materials, or spoofing locations to claim points without disposing of waste, is strictly prohibited. Suspicious submissions will be rejected, and repeat offenses will lead to account suspension and forfeiture of points."
    },
    {
      title: "4. Points, Levels, and Rewards",
      content: "Points awarded have no monetary value outside of the platform. They can only be redeemed for partner brand vouchers as listed on the 'Rewards' page. Redemption limits, voucher availability, and points conversion rates may change at any time without notice. Partner brands retain their own terms of service for voucher usage."
    },
    {
      title: "5. Limitation of Liability",
      content: "Trash2Treasure is provided 'as is' without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages resulting from your use of the platform, including any physical injuries or accidents occurring at physical recycling bins or drop-off sites."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col">
      {/* Header Bar */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors font-medium">
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>
        <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
          Trash2Treasure
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto px-6 py-16 w-full space-y-8">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 rounded-full px-4 py-1.5 text-sm font-semibold">
            <Scale className="h-4 w-4" />
            <span>Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Service</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Last Updated: July 5, 2026
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-3xl p-8 md:p-12 space-y-8 shadow-sm">
          <p className="text-gray-700 text-base md:text-lg leading-relaxed">
            Welcome to Trash2Treasure. These Terms of Service govern your access to and use of our website and applications. Please read them carefully.
          </p>

          <div className="border-t border-gray-100 pt-8 space-y-8">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
