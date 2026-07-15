"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase-client";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { NotificationItemData } from "@/components/notifications/NotificationItem";
import { motion } from "framer-motion";

export default function UserNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 1. Fetch notifications + Supabase Realtime subscription
  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }

    setLoading(true);

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from("Notification")
        .select("*")
        .eq("userId", user.uid)
        .order("createdAt", { ascending: false });

      if (!error && data) {
        setNotifications(data as NotificationItemData[]);
      }
      setLoading(false);
    };

    loadNotifications();

    // Realtime subscription
    const channel = supabase
      .channel(`notifications-page:${user.uid}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "Notification",
        filter: `userId=eq.${user.uid}`,
      }, () => loadNotifications())
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user, authLoading]);

  // 2. Mark individual notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await supabase.from("Notification").update({ read: true }).eq("id", id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to read notification:", err);
    }
  };

  // 3. Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await supabase.from("Notification").update({ read: true }).eq("userId", user?.uid).eq("read", false);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to read all notifications:", err);
    }
  };

  // 4. Clear all notifications
  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    const confirmClear = window.confirm("Are you sure you want to clear your entire notification history?");
    if (!confirmClear) return;
    try {
      await supabase.from("Notification").delete().eq("userId", user?.uid);
      setNotifications([]);
    } catch (err) {
      console.error("Failed to delete notifications:", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 px-1 md:px-0">
      <title>Notifications | Trash2Treasure</title>
      <meta name="description" content="Stay updated with your latest points verification alerts." />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl bg-glass border border-white/50 dark:border-slate-800/50 p-5 md:p-8 relative overflow-hidden flex flex-col gap-1 shadow-sm"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-2">
          <span>🔔</span> Notification Center
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xl text-xs md:text-sm leading-relaxed">
          Manage system progress logs, review submission review verdicts, and check announcement updates.
        </p>
      </motion.div>

      <NotificationCenter
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
        loading={authLoading || loading}
      />
    </div>
  );
}
