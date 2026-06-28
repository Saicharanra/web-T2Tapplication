"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Calendar, Users, Megaphone, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [scheduleType, setScheduleType] = useState("instantly");
  const [scheduleDate, setScheduleDate] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessCount(null);

    try {
      const response = await fetchWithAuth("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          targetAudience,
          scheduleType,
          scheduleDate: scheduleType === "scheduled" ? scheduleDate : null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to dispatch announcements.");
      }

      const data = await response.json();

      if (scheduleType === "scheduled") {
        setLoading(false);
        setSuccessCount(0); // Indicates queued
        confetti({ particleCount: 80, colors: ["#3b82f6", "#60a5fa"] });
        setTitle("");
        setMessage("");
        setScheduleDate("");
        return;
      }

      // Succeeded!
      setSuccessCount(data.count);
      setTitle("");
      setMessage("");
      
      // Explosion confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error("Failed to broadcast announcements:", err);
      setError(err?.message || "Internal server error during broadcast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 px-1 md:px-0">
      <title>Manage Announcements | Admin Panel</title>
      {/* Admin Panel Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl bg-glass border border-white/50 dark:border-slate-800/50 p-5 md:p-8 relative overflow-hidden flex flex-col gap-1 shadow-sm"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2">
          <span>📢</span> Announcement Dispatcher
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xl text-xs md:text-sm leading-relaxed">
          Broadcast critical eco announcements, streaking updates, and community alerts across emails and in-app feeds.
        </p>
      </motion.div>

      {/* Broadcast Form Card */}
      <div className="p-6 rounded-3xl bg-glass border border-white/50 dark:border-slate-800/50 shadow-sm">
        {error && (
          <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-start gap-2 text-xs">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs sm:text-sm">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
              <Megaphone className="h-4 w-4 text-emerald-500" /> Broadcast Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Major Waste-Location Grid Streaks Activated!"
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-850 dark:text-slate-100 font-semibold"
            />
          </div>

          {/* Message Area */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-350">Message Body *</label>
            <textarea
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Draft announcement details here. Dynamic responsive email layout and alert feeds are formatted automatically."
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-850 dark:text-slate-100 leading-relaxed"
            />
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
            {/* Target Audience */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-500" /> Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
              >
                <option value="all">All Registered Community Users</option>
                <option value="bronze">Bronze Level Users Only</option>
                <option value="silver">Silver Level Users Only</option>
                <option value="gold">Gold & Platinum Champions</option>
              </select>
            </div>

            {/* Delivery scheduling */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                <Calendar className="h-4 w-4 text-purple-500" /> Delivery Schedule
              </label>
              <div className="flex gap-2">
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex-1"
                >
                  <option value="instantly">Send Instantly</option>
                  <option value="scheduled">Schedule for later</option>
                </select>

                {scheduleType === "scheduled" && (
                  <input
                    type="datetime-local"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action trigger */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 rounded-2xl bg-gradient-eco text-white font-extrabold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Broadcasting Community Update...
                </>
              ) : scheduleType === "scheduled" ? (
                <>
                  <Clock className="h-4.5 w-4.5" />
                  Queue Scheduled Broadcast
                </>
              ) : (
                <>
                  <Send className="h-4.5 w-4.5" />
                  Broadcast Announcements
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Announcements Queue Alert Banner */}
      <AnimatePresence>
        {successCount !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSuccessCount(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden z-10 p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="p-3.5 bg-emerald-500/10 rounded-full text-emerald-500">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-lg leading-tight">
                  {successCount === 0 ? "Announcement Queued!" : "Broadcast Successful!"}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
                  {successCount === 0
                    ? `Your announcement has been successfully queued for delivery on the specified date.`
                    : `Your announcement has been successfully delivered in real-time to all ${successCount} community users via email and in-app alerts.`}
                </p>
              </div>
              <Button
                onClick={() => setSuccessCount(null)}
                className="w-full py-5 rounded-2xl bg-gradient-eco text-white font-bold hover:opacity-95 transition-all text-xs"
              >
                Super, Close
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
