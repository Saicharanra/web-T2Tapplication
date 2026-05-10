"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Mail,
  Send,
  Users,
  BarChart3,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Megaphone,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Analytics {
  notifications: {
    total: number;
    read: number;
    unread: number;
    byType: Record<string, number>;
  };
  emails: {
    total: number;
    byStatus: Record<string, number>;
    recentLogs: Array<{
      id: string;
      toEmail: string;
      subject: string;
      templateType: string;
      status: string;
      createdAt: string;
      errorMessage?: string;
    }>;
  };
}

const statusColors: Record<string, string> = {
  SENT: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
  RETRYING: "bg-blue-100 text-blue-700",
};

const statusIcons: Record<string, any> = {
  SENT: CheckCircle2,
  FAILED: XCircle,
  PENDING: Clock,
  RETRYING: Loader2,
};

export default function AdminNotificationsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastCtaText, setBroadcastCtaText] = useState("");
  const [broadcastCtaUrl, setBroadcastCtaUrl] = useState("");
  const [sendMode, setSendMode] = useState<"broadcast" | "targeted">("broadcast");
  const [targetUserId, setTargetUserId] = useState("");
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSendNotification = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast({
        title: "❌ Missing Fields",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    setSendingBroadcast(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: sendMode,
          title: broadcastTitle,
          message: broadcastMessage,
          ctaText: broadcastCtaText || undefined,
          ctaUrl: broadcastCtaUrl || undefined,
          targetUserId: sendMode === "targeted" ? targetUserId : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "✅ Notification Sent!",
          description: data.message,
        });
        setBroadcastTitle("");
        setBroadcastMessage("");
        setBroadcastCtaText("");
        setBroadcastCtaUrl("");
        setTargetUserId("");
        fetchAnalytics();
      } else {
        const error = await res.json();
        toast({
          title: "❌ Error",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Notification Center
        </h1>
        <p className="text-gray-600 mt-1">
          Manage notifications, send announcements, and monitor email delivery
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Total Notifications
                </p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {analytics?.notifications.total || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Emails Sent
                </p>
                <p className="text-3xl font-bold text-emerald-900 mt-1">
                  {analytics?.emails.byStatus?.SENT || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  Unread
                </p>
                <p className="text-3xl font-bold text-amber-900 mt-1">
                  {analytics?.notifications.unread || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                  Failed Emails
                </p>
                <p className="text-3xl font-bold text-red-900 mt-1">
                  {analytics?.emails.byStatus?.FAILED || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Types Breakdown */}
      {analytics?.notifications.byType && Object.keys(analytics.notifications.byType).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              Notifications by Type
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(analytics.notifications.byType).map(
                ([type, count]) => (
                  <div
                    key={type}
                    className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
                  >
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-[11px] font-medium text-gray-500 mt-1 uppercase tracking-wider">
                      {type.replace(/_/g, " ")}
                    </p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Notification */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-gray-500" />
            Send Notification
          </h3>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={sendMode === "broadcast" ? "default" : "outline"}
              size="sm"
              onClick={() => setSendMode("broadcast")}
              className={cn(
                "rounded-xl gap-2",
                sendMode === "broadcast" &&
                  "bg-gradient-to-r from-emerald-600 to-teal-600"
              )}
            >
              <Megaphone className="w-4 h-4" />
              Broadcast to All
            </Button>
            <Button
              variant={sendMode === "targeted" ? "default" : "outline"}
              size="sm"
              onClick={() => setSendMode("targeted")}
              className={cn(
                "rounded-xl gap-2",
                sendMode === "targeted" &&
                  "bg-gradient-to-r from-blue-600 to-indigo-600"
              )}
            >
              <Target className="w-4 h-4" />
              Targeted User
            </Button>
          </div>

          <div className="space-y-4">
            {sendMode === "targeted" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Target User ID
                </label>
                <Input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="user_2abc123xyz"
                  className="rounded-xl"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Title
              </label>
              <Input
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="🎉 New Feature Alert!"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Message
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Write your announcement message here..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  CTA Button Text (Optional)
                </label>
                <Input
                  value={broadcastCtaText}
                  onChange={(e) => setBroadcastCtaText(e.target.value)}
                  placeholder="Learn More"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  CTA URL (Optional)
                </label>
                <Input
                  value={broadcastCtaUrl}
                  onChange={(e) => setBroadcastCtaUrl(e.target.value)}
                  placeholder="https://..."
                  className="rounded-xl"
                />
              </div>
            </div>
            <Button
              onClick={handleSendNotification}
              disabled={sendingBroadcast}
              className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shadow-teal-200/50 py-3 font-semibold"
            >
              {sendingBroadcast ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {sendMode === "broadcast"
                ? "Send to All Users"
                : "Send to User"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Email Logs */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-500" />
            Recent Email Logs
          </h3>

          {analytics?.emails.recentLogs &&
          analytics.emails.recentLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-500 text-xs uppercase">
                      Email
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-500 text-xs uppercase">
                      Type
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-500 text-xs uppercase">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-500 text-xs uppercase">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.emails.recentLogs.map((log) => {
                    const StatusIcon =
                      statusIcons[log.status] || Clock;
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">
                            {log.toEmail}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate max-w-[180px]">
                            {log.subject}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                            {log.templateType.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                              statusColors[log.status] ||
                                "bg-gray-100 text-gray-600"
                            )}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No email logs yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
