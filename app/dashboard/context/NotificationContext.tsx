"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

// ── Types ──
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  icon?: string;
  actionUrl?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  fetchNotifications: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  latestNotification: Notification | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// ── Supabase client for realtime (browser-side) ──
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);
  const [page, setPage] = useState(1);
  const { user, isSignedIn } = useUser();
  const channelRef = useRef<any>(null);

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(
    async (reset = false) => {
      if (!isSignedIn) return;
      setLoading(true);

      try {
        const currentPage = reset ? 1 : page;
        const res = await fetch(
          `/api/notifications?page=${currentPage}&limit=20`
        );

        if (res.ok) {
          const data = await res.json();
          if (reset) {
            setNotifications(data.notifications);
            setPage(1);
          } else {
            setNotifications((prev) => {
              const existingIds = new Set(prev.map((n) => n.id));
              const newNotifs = data.notifications.filter(
                (n: Notification) => !existingIds.has(n.id)
              );
              return [...prev, ...newNotifs];
            });
          }
          setUnreadCount(data.unreadCount);
          setHasMore(currentPage < data.totalPages);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [isSignedIn, page]
  );

  // ── Load more ──
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setPage((p) => p + 1);
  }, [hasMore, loading]);

  useEffect(() => {
    if (page > 1) {
      fetchNotifications(false);
    }
  }, [page, fetchNotifications]);

  // ── Refresh unread count ──
  const refreshUnreadCount = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [isSignedIn]);

  // ── Mark single as read ──
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: id }),
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    },
    []
  );

  // ── Mark all as read ──
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  // ── Delete notification ──
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });

      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === id);
        if (removed && !removed.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  // ── Initial fetch ──
  useEffect(() => {
    if (isSignedIn) {
      fetchNotifications(true);
    }
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll unread count every 30 seconds ──
  useEffect(() => {
    if (!isSignedIn) return;
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn, refreshUnreadCount]);

  // ── Supabase Realtime subscription ──
  useEffect(() => {
    if (!isSignedIn || !user?.id || !supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `userId=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          console.log("🔔 Realtime notification received:", newNotification.title);

          // Add to top of list
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          setLatestNotification(newNotification);

          // Clear latest after 5 seconds
          setTimeout(() => setLatestNotification(null), 5000);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isSignedIn, user?.id]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        hasMore,
        fetchNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshUnreadCount,
        latestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
