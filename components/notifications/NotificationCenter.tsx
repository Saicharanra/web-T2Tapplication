"use client";

import { useState } from "react";
import { NotificationItem, NotificationItemData } from "./NotificationItem";
import { BellOff, CheckCheck, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
  notifications: NotificationItemData[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => Promise<void>;
  loading: boolean;
}

type FilterType = "all" | "unread" | "read";

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  loading,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filter list
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Action Header Card */}
      <div className="p-5 rounded-3xl bg-glass border border-white/50 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        {/* Toggle Filters */}
        <div className="flex gap-2">
          {(["all", "unread", "read"] as FilterType[]).map((t) => {
            const isActive = filter === t;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider transition-all transform active:scale-95 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm",
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-sm"
                    : "hover:border-slate-300 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                {t}
                {t === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Batch Controls */}
        <div className="flex gap-2 w-full sm:w-auto">
          {unreadCount > 0 && (
            <Button
              onClick={onMarkAllAsRead}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial py-5 text-xs font-bold rounded-2xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-50/50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800 transition-colors"
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Mark all as read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              onClick={onClearAll}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial py-5 text-xs font-bold rounded-2xl border-rose-500/20 text-rose-500 hover:bg-rose-50/50 dark:border-slate-800 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear history
            </Button>
          )}
        </div>
      </div>

      {/* Main listings stack */}
      <div className="p-5 rounded-3xl bg-glass border border-white/50 dark:border-slate-800/50 shadow-sm flex flex-col gap-3 min-h-[400px]">
        <div className="flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <h3 className="font-bold text-slate-850 dark:text-slate-200 text-sm md:text-base">
            Inbox Reports
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            Showing {filteredNotifications.length} entries
          </span>
        </div>

        {loading ? (
          /* Animated skeleton states */
          <div className="flex flex-col gap-3.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white/20 dark:bg-slate-900/20 border border-white/30 dark:border-slate-800/30 shadow-sm animate-pulse flex gap-3"
              >
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <div className="h-4.5 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredNotifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        ) : (
          /* Staggering empty state */
          <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
            <div className="p-4 bg-slate-100 dark:bg-slate-850 rounded-full text-slate-400 dark:text-slate-500">
              <BellOff className="h-8 w-8" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">
                No Notifications Found
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
                {filter === "unread"
                  ? "Outstanding! You do not have any unread items in your inbox."
                  : filter === "read"
                  ? "No read entries recorded. Click on a notification card to dismiss it."
                  : "Welcome! Dispose and submit items to trigger system progress reports here."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
