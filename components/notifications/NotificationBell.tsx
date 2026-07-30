"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase-client";
import { NotificationItemData } from "./NotificationItem";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 1. Initial fetch + Supabase Realtime subscription
  useEffect(() => {
    if (!user) return;

    // Initial load
    const loadNotifications = async () => {
      let loaded = false;
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.uid)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setNotifications(
            data.map((row) => ({
              id: row.id,
              userId: row.user_id,
              email: row.email,
              type: row.type,
              title: row.title,
              message: row.message,
              read: row.read,
              createdAt: row.created_at,
            }))
          );
          loaded = true;
        } else if (error) {
          console.warn("⚠️ Client-side notification fetch returned error (checking API fallback):", error);
        }
      } catch (err) {
        console.warn("⚠️ Client notification query exception:", err);
      }

      if (!loaded) {
        try {
          const res = await fetch("/api/notifications", {
            headers: { Authorization: `Bearer ${user.uid}` },
          });
          if (res.ok) {
            const apiData = await res.json();
            if (apiData.notifications) {
              setNotifications(apiData.notifications);
            }
          }
        } catch (apiErr) {
          console.error("❌ Notifications API fallback failed:", apiErr);
        }
      }
    };

    loadNotifications();

    // Realtime subscription on notifications table filtered by user_id
    const channel = supabase
      .channel(`notifications:${user.uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.uid}`,
        },
        () => {
          // Re-fetch on any change (INSERT / UPDATE / DELETE)
          loadNotifications();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 2. Mark a single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // 3. Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user?.uid)
        .eq("read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative shrink-0 flex items-center justify-center">
      {/* Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all relative outline-none select-none"
        title="View Notifications"
      >
        <Bell className="h-5.5 w-5.5" />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4.5 min-w-[18px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full border border-white dark:border-slate-900 flex items-center justify-center animate-in scale-in shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating dropdown overlay */}
      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
