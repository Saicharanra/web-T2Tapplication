"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface NotificationItemData {
  id: string;
  userId: string;
  email: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

interface NotificationItemProps {
  notification: NotificationItemData;
  onMarkAsRead: (id: string) => void;
}

const typeEmojis: Record<string, string> = {
  account_created: "👋",
  first_login: "🚀",
  submission_received: "🚮",
  submission_approved: "🎉",
  submission_rejected: "❌",
  reward_claimed: "🪙",
  reward_delivered: "🎁",
  password_changed: "🔒",
  profile_updated: "👤",
  announcement: "📢",
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  
  // Format creation time relative to now
  const formatTimeElapsed = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

      if (seconds < 60) return "Just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <div
      onClick={() => {
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
      }}
      className={cn(
        "p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-3 text-xs sm:text-sm cursor-pointer select-none",
        notification.read
          ? "bg-white/40 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 text-slate-500"
          : "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(16,185,129,0.02)] text-slate-800 dark:text-slate-100"
      )}
    >
      {/* Type Emoji Icon wrapper */}
      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-lg shrink-0 select-none">
        {typeEmojis[notification.type] || "🔔"}
      </div>

      {/* Info Rows */}
      <div className="flex-1 flex flex-col gap-0.5 pr-4">
        <div className="flex justify-between items-start gap-2">
          <h5 className="font-extrabold leading-tight text-slate-800 dark:text-slate-200">
            {notification.title}
          </h5>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
            {formatTimeElapsed(notification.createdAt)}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 mt-0.5">
          {notification.message}
        </p>
      </div>

      {/* Unread dot / checkmark indicator */}
      {!notification.read && (
        <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15 animate-pulse" />
      )}
    </div>
  );
}
