"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import Footer from "@/app/dashboard/footer/page";

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect information you provide directly to us when you create an account, upload recycling submissions (including photos and location coordinates), and contact us for support. This includes your name, email address, profile photo, and device/location information necessary to verify recycling bins and submissions."
    },
    {
      title: "2. How We Use Your Information",
      content: "We use the collected information to operate, maintain, and improve our services, verify recycling uploads, allocate reward points, process redemptions, detect and prevent fraud, and send you important notifications about your account status."
    },
    {
      title: "3. Smart Image and Location Verification",
      content: "When you upload waste photos and bin images, our system processes them using machine learning models to validate the item type. We collect high-precision geolocation data to verify that recyclables are deposited at correct bin locations. This data is only used for verification and is never sold to third parties."
    },
    {
      title: "4. Data Sharing & Security",
      content: "We implement robust security measures to protect your personal information. We do not sell or trade your data. We may share anonymized, aggregated recycling analytics with municipal bodies or environmental organizations in Telangana to showcase green initiatives and program success."
    },
    {
      title: "5. Your Rights and Control",
      content: "You have the right to access, update, or request deletion of your account and personal data. You can manage your profile settings inside the dashboard or contact our support team through the Help Center for assistance with data inquiries."
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
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-1.5 text-sm font-semibold">
            <Shield className="h-4 w-4" />
            <span>Privacy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Policy</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Last Updated: July 5, 2026
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-3xl p-8 md:p-12 space-y-8 shadow-sm">
          <p className="text-gray-700 text-base md:text-lg leading-relaxed">
            At Trash2Treasure, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application.
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
