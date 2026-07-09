"use client";

import { cn } from "@/lib/utils";

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

const typeStyles: Record<string, {
  emoji: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
}> = {
  account_created: {
    emoji: "👋",
    bgColor: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]",
    borderColor: "border-emerald-500/10 dark:border-emerald-500/20",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconColor: "text-emerald-500 dark:text-emerald-400"
  },
  user_created: {
    emoji: "🌍",
    bgColor: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]",
    borderColor: "border-emerald-500/10 dark:border-emerald-500/20",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconColor: "text-emerald-500 dark:text-emerald-400"
  },
  first_login: {
    emoji: "🚀",
    bgColor: "bg-indigo-500/[0.03] dark:bg-indigo-500/[0.06]",
    borderColor: "border-indigo-500/10 dark:border-indigo-500/20",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    iconColor: "text-indigo-500 dark:text-indigo-400"
  },
  submission_received: {
    emoji: "🚮",
    bgColor: "bg-blue-500/[0.03] dark:bg-blue-500/[0.06]",
    borderColor: "border-blue-500/10 dark:border-blue-500/20",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconColor: "text-blue-500 dark:text-blue-400"
  },
  submission_approved: {
    emoji: "🎉",
    bgColor: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]",
    borderColor: "border-emerald-500/10 dark:border-emerald-500/20",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconColor: "text-emerald-500 dark:text-emerald-400"
  },
  submission_rejected: {
    emoji: "❌",
    bgColor: "bg-rose-500/[0.03] dark:bg-rose-500/[0.06]",
    borderColor: "border-rose-500/10 dark:border-rose-500/20",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    iconColor: "text-rose-500 dark:text-rose-400"
  },
  reward_claimed: {
    emoji: "🪙",
    bgColor: "bg-amber-500/[0.03] dark:bg-amber-500/[0.06]",
    borderColor: "border-amber-500/10 dark:border-amber-500/20",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconColor: "text-amber-500 dark:text-amber-400"
  },
  reward_delivered: {
    emoji: "🎁",
    bgColor: "bg-teal-500/[0.03] dark:bg-teal-500/[0.06]",
    borderColor: "border-teal-500/10 dark:border-teal-500/20",
    iconBg: "bg-teal-500/10 dark:bg-teal-500/20",
    iconColor: "text-teal-500 dark:text-teal-400"
  },
  password_changed: {
    emoji: "🔒",
    bgColor: "bg-slate-500/[0.03] dark:bg-slate-500/[0.06]",
    borderColor: "border-slate-500/10 dark:border-slate-500/20",
    iconBg: "bg-slate-500/10 dark:bg-slate-500/20",
    iconColor: "text-slate-500 dark:text-slate-400"
  },
  profile_updated: {
    emoji: "👤",
    bgColor: "bg-cyan-500/[0.03] dark:bg-cyan-500/[0.06]",
    borderColor: "border-cyan-500/10 dark:border-cyan-500/20",
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    iconColor: "text-cyan-500 dark:text-cyan-400"
  },
  announcement: {
    emoji: "📢",
    bgColor: "bg-fuchsia-500/[0.03] dark:bg-fuchsia-500/[0.06]",
    borderColor: "border-fuchsia-500/10 dark:border-fuchsia-500/20",
    iconBg: "bg-fuchsia-500/10 dark:bg-fuchsia-500/20",
    iconColor: "text-fuchsia-500 dark:text-fuchsia-400"
  },
};

const getStyles = (type: string) => {
  return typeStyles[type] || {
    emoji: "🔔",
    bgColor: "bg-slate-500/[0.03] dark:bg-slate-500/[0.06]",
    borderColor: "border-slate-200 dark:border-slate-800",
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-500 dark:text-slate-400"
  };
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

  const styles = getStyles(notification.type);

  return (
    <div
      onClick={() => {
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
      }}
      className={cn(
        "p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex gap-3 text-xs sm:text-sm cursor-pointer select-none hover:translate-x-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] active:scale-[0.99]",
        notification.read
          ? "bg-white/40 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/60 text-slate-500"
          : cn(styles.bgColor, styles.borderColor, "text-slate-800 dark:text-slate-100 shadow-[0_2px_8px_rgba(16,185,129,0.01)]")
      )}
    >
      {/* Type Emoji Icon wrapper */}
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0 select-none transition-opacity",
        notification.read ? "bg-slate-100 dark:bg-slate-800 opacity-60" : styles.iconBg
      )}>
        {styles.emoji}
      </div>

      {/* Info Rows */}
      <div className="flex-1 flex flex-col gap-1 pr-1">
        <div className="flex justify-between items-start gap-2">
          <h5 className={cn(
            "font-extrabold leading-tight text-xs sm:text-sm flex items-center flex-wrap gap-1.5",
            notification.read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"
          )}>
            {notification.title}
            {!notification.read && (
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse shrink-0" />
            )}
          </h5>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap mt-0.5">
            {formatTimeElapsed(notification.createdAt)}
          </span>
        </div>
        <p className={cn(
          "text-[11px] sm:text-xs leading-relaxed mt-0.5",
          notification.read ? "text-slate-400 dark:text-slate-500" : "text-slate-600 dark:text-slate-350"
        )}>
          {notification.message}
        </p>
      </div>
    </div>
  );
}
