"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase-client";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  writeBatch,
  updateDoc
} from "firebase/firestore";
import { NotificationItemData } from "./NotificationItem";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // 1. Establish real-time Firestore sync on mount
  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, "notifications");
    // Listen to all notifications for the active user
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: NotificationItemData[] = [];
        snapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            ...doc.data(),
          } as NotificationItemData);
        });
        setNotifications(list);
      },
      (error) => {
        console.error("🔔 Notification listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 2. Mark a single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const docRef = doc(db, "notifications", id);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // 3. Mark all notifications as read transactionally
  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        const docRef = doc(db, "notifications", n.id);
        batch.update(docRef, { read: true });
      });
      await batch.commit();
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
        
        {/* Glow unread count badge */}
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
