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

      <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
        {/* Dropdown Header */}
        <div className="px-4.5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
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
          
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                onClick={() => {
                  onMarkAllAsRead();
                }}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1 rounded-lg"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:text-rose-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications Scroll List */}
        <div className="max-h-72 overflow-y-auto p-3 flex flex-col gap-2.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
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
        <div className="border-t border-slate-100 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <Link href="/dashboard/notifications" onClick={onClose} className="block w-full">
            <Button
              variant="outline"
              size="sm"
              className="w-full py-4 text-xs font-bold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              View All Notifications
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
