"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import { Clock, Timer, Eye, Compass, Activity, RefreshCw, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";

interface EngagementStat {
  totalSessions: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  mostPopularPage: string;
}

interface PageStat {
  path: string;
  visits: number;
  totalTime: number;
  avgTime: number;
}

interface EngagementLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  pathname: string;
  timeSpent: number;
  timestamp: string;
}

export default function EngagementPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EngagementStat>({
    totalSessions: 0,
    totalTimeSpent: 0,
    averageSessionDuration: 0,
    mostPopularPage: "N/A",
  });
  const [pageStats, setPageStats] = useState<PageStat[]>([]);
  const [logs, setLogs] = useState<EngagementLog[]>([]);

  const fetchEngagementData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth("/api/admin/engagement");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {
          totalSessions: 0,
          totalTimeSpent: 0,
          averageSessionDuration: 0,
          mostPopularPage: "N/A",
        });
        setPageStats(data.pageStats || []);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load engagement stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEngagementData();
    // Auto refresh stats every 15 seconds
    const interval = setInterval(fetchEngagementData, 15000);
    return () => clearInterval(interval);
  }, [fetchEngagementData]);

  const getPageName = (path: string) => {
    if (path === "/dashboard/home") return "🏠 Home Dashboard";
    if (path === "/dashboard/scan") return "📸 Scan & Earn";
    if (path === "/dashboard/wallet") return "💰 Wallet & Points";
    if (path === "/dashboard/reward") return "🎁 Rewards Center";
    if (path === "/dashboard/profile") return "👤 User Profile";
    if (path === "/dashboard/leaderboard") return "🏆 Leaderboard";
    if (path === "/dashboard/learn") return "📚 Learn & Grow";
    if (path === "/dashboard/notifications") return "🔔 Notifications";
    return path;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const formatTotalTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const maxVisits = pageStats.reduce((max, item) => (item.visits > max ? item.visits : max), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-left">
      <title>User Engagement KPIs | Admin Panel</title>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTMwVjBoLTEydjRoMTJ6TTI0IDI0aDEydi0ySDI0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">⏱️ User Engagement KPIs</h1>
            <p className="text-white/70 text-sm sm:text-base">Track where users spend time and analyze feature engagement in real-time.</p>
          </div>
          <Button
            onClick={fetchEngagementData}
            disabled={loading}
            className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white rounded-xl px-5 py-2.5 font-medium transition-all duration-300 hover:-translate-y-0.5"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Active Sessions */}
        <Card className="border border-slate-100 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pageviews Tracked</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <Eye className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-gray-900">{stats.totalSessions}</div>
            <p className="text-xs text-gray-500 mt-1">Total recorded path transitions</p>
          </CardContent>
        </Card>

        {/* KPI 2: Total Time Spent */}
        <Card className="border border-slate-100 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Time Spent</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-gray-900">{formatTotalTime(stats.totalTimeSpent)}</div>
            <p className="text-xs text-gray-500 mt-1">Accumulated app usage duration</p>
          </CardContent>
        </Card>

        {/* KPI 3: Average Session Time */}
        <Card className="border border-slate-100 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Page Time</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Timer className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-gray-900">{formatDuration(stats.averageSessionDuration)}</div>
            <p className="text-xs text-gray-500 mt-1">Average spent per page visit</p>
          </CardContent>
        </Card>

        {/* KPI 4: Most Popular Page */}
        <Card className="border border-slate-100 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Page</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Compass className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 truncate mt-1">{getPageName(stats.mostPopularPage)}</div>
            <p className="text-xs text-gray-500 mt-1">Most visited path by citizens</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Page Stats Breakdown (3 cols) */}
        <Card className="lg:col-span-3 border border-slate-100">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-base font-bold text-gray-900">Page-by-Page Engagement Breakdown</CardTitle>
            <CardDescription>Visits count and time spent metrics grouped by individual system pages.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {pageStats.map((item, idx) => {
                const percentage = Math.round((item.visits / maxVisits) * 100);
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-700">{getPageName(item.path)}</span>
                      <span className="text-xs text-gray-500 font-medium">
                        {item.visits} visits • avg {formatDuration(item.avgTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-10 text-right">
                        {formatTotalTime(item.totalTime)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {pageStats.length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  <Compass className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No page views recorded yet</p>
                  <p className="text-sm mt-1">Usage data will build up as citizens visit dashboard pages.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Live Feed (2 cols) */}
        <Card className="lg:col-span-2 border border-slate-100 flex flex-col">
          <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Live Engagement Feed</CardTitle>
              <CardDescription>Real-time page views and dwell times.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Live
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[480px] p-0">
            <div className="divide-y divide-slate-50">
              {logs.map((log, idx) => (
                <div key={log.id} className="p-4 flex items-start gap-3.5 hover:bg-slate-50/50 transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-100 flex-shrink-0">
                    {log.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800">
                      <span className="font-semibold text-gray-900">{log.userName}</span> visited
                    </p>
                    <p className="text-xs font-bold text-emerald-700 truncate mt-0.5">
                      {getPageName(log.pathname)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "Just now"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">{formatDuration(log.timeSpent)}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="py-20 text-center text-gray-400">
                  <Activity className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Waiting for activity...</p>
                  <p className="text-sm mt-1">Recent visits will pop up here in real-time.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
