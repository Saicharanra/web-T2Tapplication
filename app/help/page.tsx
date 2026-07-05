"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/app/dashboard/footer/page";
import { 
  ArrowLeft, 
  HelpCircle, 
  Mail, 
  Recycle, 
  MessageSquare, 
  ShieldQuestion, 
  Clock, 
  BookOpen 
} from "lucide-react";

export default function HelpCenter() {
  const { toast } = useToast();
  
  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  // FAQ state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Trash2Treasure?",
      answer: "Trash2Treasure is a gamified waste management and recycling rewards platform. It enables citizens in Telangana to recycle responsibly and earn reward points that can be redeemed for partner brand vouchers."
    },
    {
      question: "How do I earn points?",
      answer: "Sort your recyclable waste (plastics, paper, metal, e-waste) at home, go to the 'Scan & Earn' page in the dashboard, take a photo of the sorted waste and upload it. Once verified, points are credited to your wallet."
    },
    {
      question: "What waste types are accepted?",
      answer: "We accept Plastic Bottles, Paper Waste, Metal Cans, Glass Bottles, Cardboard, E-Waste, Organic Waste, and Mixed Recyclables. Each has a different points multiplier based on recycling value."
    },
    {
      question: "How can I redeem my rewards?",
      answer: "Visit the 'Rewards' page in the dashboard. You can redeem accumulated points for shopping vouchers, grocery vouchers, utility bill payments, or even plant trees."
    },
    {
      question: "Where do I drop off the recyclables?",
      answer: "You can find nearby collection bins by clicking 'Find Bins' on the dashboard home screen. Drop off your recyclables at any designated Trash2Treasure bin."
    },
    {
      question: "How long does verification take?",
      answer: "Submissions are verified by our admin team, typically within 12 to 24 hours of uploading. You will receive an in-app notification once verified."
    }
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingContact(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to send message.");
      }
      toast({
        title: "✅ Message Sent!",
        description: "We've received your message and will reply to your email shortly.",
      });
      setContactName("");
      setContactEmail("");
      setContactSubject("");
      setContactMessage("");
    } catch (err: any) {
      toast({
        title: "❌ Failed to Send",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingContact(false);
    }
  };

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
      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Side: Support FAQs */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-4 py-1.5 text-sm font-semibold">
              <HelpCircle className="h-4 w-4" />
              <span>Help Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">help you?</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Find answers to frequently asked questions about recycling, verification, and reward redemption.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-gray-200/80 bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-sm transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 hover:bg-green-50/30 transition-colors"
                  >
                    <span className="font-bold text-gray-800 text-base md:text-lg">
                      {faq.question}
                    </span>
                    <span className="text-xl font-bold text-green-600 select-none">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-gray-600 leading-relaxed text-sm md:text-base border-t border-gray-100 bg-white/40">
                      {faq.answer}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <Card className="bg-white/80 border border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Clock className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-gray-900">Verification Time</h4>
                <p className="text-xs text-gray-500">Usually within 12-24 hours</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-gray-900">Points Multipliers</h4>
                <p className="text-xs text-gray-500">Up to 50 pts per item</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <ShieldQuestion className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-gray-900">Live Support</h4>
                <p className="text-xs text-gray-500">Quick response to emails</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Side: Contact Us form */}
        <div className="lg:col-span-5">
          <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-lg sticky top-24 overflow-hidden rounded-[2rem]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-blue-500" />
            <CardHeader className="pt-8 px-8">
              <CardTitle className="flex items-center gap-2.5 text-2xl font-extrabold text-gray-900">
                <MessageSquare className="h-6 w-6 text-green-600" />
                <span>Message Us</span>
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Still have questions? Send our support team a message. We usually respond within 4 hours.
              </p>
            </CardHeader>
            <CardContent className="pb-8 px-8">
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Full Name</label>
                  <Input
                    placeholder="Enter your name"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    disabled={sendingContact}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={sendingContact}
                    className="rounded-xl border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Subject</label>
                  <Input
                    placeholder="Help, Account issues, Rewards, etc."
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    disabled={sendingContact}
                    className="rounded-xl border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Message</label>
                  <textarea
                    className="flex min-h-[140px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all"
                    placeholder="Type your questions or issues here..."
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    disabled={sendingContact}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sendingContact}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] disabled:opacity-60"
                >
                  {sendingContact ? (
                    <>
                      <Recycle className="h-5 w-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
