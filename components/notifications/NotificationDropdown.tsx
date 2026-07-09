"use client";

import Link from "next/link";
import { NotificationItem, NotificationItemData } from "./NotificationItem";
import { CheckCheck, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationDropdownProps {
  notifications: NotificationItemData[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationDropdownProps) {
  
  // Display only the first 5 recent notifications
  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Overlay to close the dropdown when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed top-16 left-4 right-4 mt-3 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:w-[360px] sm:mt-3 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border border-slate-250/50 dark:border-slate-800/80 rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
        {/* Dropdown Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 animate-pulse">
                You have {unreadCount} unread reports
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <Button
                onClick={() => {
                  onMarkAllAsRead();
                }}
                variant="ghost"
                className="h-8 px-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 rounded-xl"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:text-rose-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications Scroll List */}
        <div className="max-h-[300px] overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkAsRead={onMarkAsRead}
              />
            ))
          ) : (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2.5 text-slate-400 dark:text-slate-500 select-none">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                <BellOff className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold">All caught up!</p>
                <p className="text-[10px] mt-0.5">No recent notifications found.</p>
              </div>
            </div>
          )}
        </div>

        {/* Dropdown Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 p-3 bg-slate-50/50 dark:bg-slate-900/30">
          <Link href="/dashboard/notifications" onClick={onClose} className="block w-full">
            <Button
              variant="outline"
              className="w-full h-10 text-xs font-extrabold rounded-2xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-transparent shadow-sm"
            >
              View All Notifications
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
