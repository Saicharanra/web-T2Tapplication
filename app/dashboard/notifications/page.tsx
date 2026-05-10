"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  ChevronDown,
  Check,
  ExternalLink,
  Inbox,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/app/dashboard/context/NotificationContext";
import { useRouter } from "next/navigation";

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Upload Approved", value: "UPLOAD_APPROVED" },
  { label: "Upload Rejected", value: "UPLOAD_REJECTED" },
  { label: "Reward Points", value: "REWARD_POINTS" },
  { label: "Reward Redeemed", value: "REWARD_REDEEMED" },
  { label: "Announcements", value: "ADMIN_ANNOUNCEMENT" },
  { label: "General", value: "GENERAL" },
];

const typeLabels: Record<string, string> = {
  UPLOAD_APPROVED: "Approved",
  UPLOAD_REJECTED: "Rejected",
  REWARD_POINTS: "Points",
  REWARD_REDEEMED: "Redeemed",
  ADMIN_ANNOUNCEMENT: "Announcement",
  ACCOUNT_WELCOME: "Welcome",
  PICKUP_SCHEDULED: "Pickup",
  PICKUP_COMPLETED: "Completed",
  CAMPAIGN: "Campaign",
  REFERRAL: "Referral",
  WEEKLY_REPORT: "Report",
  GENERAL: "General",
};

const typeBadgeColors: Record<string, string> = {
  UPLOAD_APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UPLOAD_REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  REWARD_POINTS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  REWARD_REDEEMED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ADMIN_ANNOUNCEMENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ACCOUNT_WELCOME: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  GENERAL: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

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
    year: "numeric",
  });
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const router = useRouter();

  // Initial load
  useEffect(() => {
    fetchNotifications(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredNotifications = filter
    ? notifications.filter((n) => n.type === filter)
    : notifications;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-200/50">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Notifications
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        {/* Filter */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="rounded-xl border-gray-200 dark:border-gray-700 text-sm font-medium gap-2"
          >
            <Filter className="w-4 h-4" />
            {filter ? typeLabels[filter] || "Filter" : "All Types"}
            <ChevronDown className="w-3 h-3" />
          </Button>

          {showFilterMenu && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 z-20 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFilter(opt.value);
                    setShowFilterMenu(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                    filter === opt.value
                      ? "text-teal-600 font-semibold bg-teal-50/50 dark:bg-teal-900/10"
                      : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-sm font-medium gap-1.5 text-teal-600 hover:text-teal-700 hover:border-teal-300"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
            <p className="text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-800/50">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-4">
              <Inbox className="w-9 h-9 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-base font-semibold text-gray-500 dark:text-gray-400">
              {filter ? "No notifications of this type" : "No notifications yet"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {filter
                ? "Try a different filter"
                : "Activities and updates will appear here"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "group relative bg-white dark:bg-gray-900/50 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden",
                notification.isRead
                  ? "border-gray-200/80 dark:border-gray-800/80"
                  : "border-blue-200/80 dark:border-blue-800/50 shadow-sm"
              )}
              onClick={() => {
                if (!notification.isRead) markAsRead(notification.id);
                if (notification.actionUrl) router.push(notification.actionUrl);
              }}
            >
              {/* Unread indicator */}
              {!notification.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-teal-500 rounded-l-xl" />
              )}

              <div className="flex items-start gap-4 p-4 pl-5">
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl border",
                    typeBadgeColors[notification.type]
                      ? typeBadgeColors[notification.type]
                          .replace("text-", "border-")
                          .split(" ")[0] +
                        " " +
                        typeBadgeColors[notification.type]
                      : "bg-gray-100 border-gray-200"
                  )}
                >
                  {notification.icon || "🔔"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={cn(
                          "text-sm leading-tight",
                          notification.isRead
                            ? "text-gray-700 dark:text-gray-300 font-medium"
                            : "text-gray-900 dark:text-white font-semibold"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        typeBadgeColors[notification.type] ||
                          typeBadgeColors.GENERAL
                      )}
                    >
                      {typeLabels[notification.type] || notification.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 font-medium">
                      {timeAgo(notification.createdAt)}
                    </span>
                    {notification.actionUrl && (
                      <span className="flex items-center gap-1 text-xs text-teal-500">
                        <ExternalLink className="w-3 h-3" /> View
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4 text-gray-400 hover:text-teal-500" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && filteredNotifications.length > 0 && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
            className="rounded-xl px-8 gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
