"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from "lucide-react";
import { useNotifications, Notification } from "@/app/dashboard/context/NotificationContext";
import { cn } from "@/lib/utils";

// ── Time Ago ──
function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Type Colors ──
const typeColors: Record<string, string> = {
  UPLOAD_APPROVED:
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
  UPLOAD_REJECTED:
    "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
  REWARD_POINTS:
    "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
  REWARD_REDEEMED:
    "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
  ADMIN_ANNOUNCEMENT:
    "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  ACCOUNT_WELCOME:
    "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800",
  GENERAL: "bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700",
};

// ── Single Notification Item ──
function NotificationItem({
  notification,
  onRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (url?: string) => void;
}) {
  const colorClass =
    typeColors[notification.type] || typeColors.GENERAL;

  return (
    <div
      className={cn(
        "group relative px-4 py-3 border-b border-gray-100 dark:border-gray-800 transition-all duration-200 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/50",
        !notification.isRead && "bg-blue-50/30 dark:bg-blue-900/10"
      )}
      onClick={() => {
        if (!notification.isRead) onRead(notification.id);
        if (notification.actionUrl) onNavigate(notification.actionUrl);
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg border",
            colorClass
          )}
        >
          {notification.icon || "🔔"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm leading-tight",
                notification.isRead
                  ? "text-gray-600 dark:text-gray-400 font-medium"
                  : "text-gray-900 dark:text-white font-semibold"
              )}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-gray-400 font-medium">
              {timeAgo(notification.createdAt)}
            </span>
            {notification.actionUrl && (
              <ExternalLink className="w-3 h-3 text-gray-400" />
            )}
          </div>
        </div>

        {/* Actions (show on hover) */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRead(notification.id);
              }}
              className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Mark as read"
            >
              <Check className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Bell Component ──
export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Refresh when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(true);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNavigate = (url?: string) => {
    setIsOpen(false);
    if (url) router.push(url);
  };

  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-xl transition-all duration-300",
          isOpen
            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        id="notification-bell"
      >
        <Bell className="h-5 w-5" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-lg shadow-red-200 animate-in zoom-in duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Read all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[380px] scrollbar-thin">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
                  <Bell className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  You&apos;ll be notified about important updates
                </p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-2.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard/notifications");
                }}
                className="w-full text-center text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors py-1"
              >
                View All Notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
