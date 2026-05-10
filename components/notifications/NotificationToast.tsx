"use client";

import { useEffect, useState } from "react";
import { useNotifications, Notification } from "@/app/dashboard/context/NotificationContext";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const typeGradients: Record<string, string> = {
  UPLOAD_APPROVED: "from-emerald-500 to-teal-500",
  UPLOAD_REJECTED: "from-red-500 to-rose-500",
  REWARD_POINTS: "from-amber-500 to-yellow-500",
  REWARD_REDEEMED: "from-purple-500 to-violet-500",
  ADMIN_ANNOUNCEMENT: "from-blue-500 to-indigo-500",
  ACCOUNT_WELCOME: "from-teal-500 to-cyan-500",
  GENERAL: "from-gray-500 to-slate-500",
};

export default function NotificationToast() {
  const { latestNotification } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<Notification | null>(null);

  useEffect(() => {
    if (latestNotification) {
      setCurrent(latestNotification);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [latestNotification]);

  if (!visible || !current) return null;

  const gradient =
    typeGradients[current.type] || typeGradients.GENERAL;

  return (
    <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right-5 fade-in duration-300 max-w-sm">
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-800">
        {/* Gradient accent bar */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
            gradient
          )}
        />

        <div className="flex items-start gap-3 px-4 py-3 pt-4">
          {/* Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-lg shadow-lg",
              gradient
            )}
          >
            {current.icon || "🔔"}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
              {current.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
              {current.message}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100 dark:bg-gray-800">
          <div
            className={cn(
              "h-full bg-gradient-to-r animate-shrink",
              gradient
            )}
            style={{
              animation: "shrink 4.5s linear forwards",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
