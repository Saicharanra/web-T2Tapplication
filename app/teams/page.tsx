"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import { Clock, Check, X, Coins, Users as UsersIcon, RefreshCw, ArrowUp, ArrowDown, Sparkles, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Stat {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ComponentType<any>;
  gradient: string;
  glowColor: string;
}

interface Activity {
  id: number;
  user: string;
  action: string;
  details: string;
  time: string;
  status: "new" | "verified" | "rejected";
}

interface Submission {
  id: number;
  userName: string;
  userEmail: string;
  image: string;
  wasteType: string;
  location: string;
  submissionDate: string;
  status: "pending" | "verified" | "rejected";
  points: number;
  description: string;
  userId: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{ stats: any, recentSubmissions: Submission[] }>({
    stats: {
      pendingSubmissions: 0,
      verifiedToday: 0,
      rejectedToday: 0,
      totalPoints: 0,
      totalUsers: 0,
      newThisWeek: 0
    },
    recentSubmissions: []
  });

  const [activities, setActivities] = useState<Activity[]>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        console.log("Dashboard response:", data);
        const newStats = data.stats || {
          pendingSubmissions: 0,
          verifiedToday: 0,
          rejectedToday: 0,
          totalPoints: 0,
          totalUsers: 0,
          newThisWeek: 0
        };
        const newSubmissions = data.recentSubmissions || [];

        setDashboardData({ stats: newStats, recentSubmissions: newSubmissions });

        if (newSubmissions.length > 0) {
          const derivedActivities: Activity[] = newSubmissions.map((sub: any) => {
            let actionStr = 'submitted new waste item';
            let statusEnum: "new" | "verified" | "rejected" = 'new';
            if (sub.status === 'VERIFIED') { actionStr = `earned ${sub.pointsAwarded || 35} points`; statusEnum = 'verified'; }
            if (sub.status === 'REJECTED') { actionStr = 'submission rejected'; statusEnum = 'rejected'; }

            return {
              id: sub.id,
              user: sub.user?.name || 'Unknown User',
              action: actionStr,
              details: sub.wasteType + " from " + sub.location,
              time: new Date(sub.createdAt).toLocaleDateString(),
              status: statusEnum
            };
          });
          setActivities(derivedActivities);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Auto-update dashboard metrics every 10 seconds in production
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const stats: Stat[] = [
    {
      title: "Pending",
      value: String(dashboardData.stats.pendingSubmissions),
      change: "Needs review",
      changeType: "positive",
      icon: Clock,
      gradient: "from-amber-400 to-orange-500",
      glowColor: "shadow-amber-200/50",
    },
    {
      title: "Verified Today",
      value: String(dashboardData.stats.verifiedToday),
      change: "Approved",
      changeType: "positive",
      icon: Check,
      gradient: "from-emerald-400 to-teal-600",
      glowColor: "shadow-emerald-200/50",
    },
    {
      title: "Rejected",
      value: String(dashboardData.stats.rejectedToday),
      change: "Today",
      changeType: "negative",
      icon: X,
      gradient: "from-rose-400 to-red-600",
      glowColor: "shadow-rose-200/50",
    },
    {
      title: "Points Awarded",
      value: String(dashboardData.stats.totalPoints.toLocaleString()),
      change: "Total",
      changeType: "positive",
      icon: Coins,
      gradient: "from-violet-400 to-purple-600",
      glowColor: "shadow-violet-200/50",
    },
    {
      title: "Active Users",
      value: String(dashboardData.stats.totalUsers),
      change: `+${dashboardData.stats.newThisWeek} this week`,
      changeType: "positive",
      icon: UsersIcon,
      gradient: "from-blue-400 to-indigo-600",
      glowColor: "shadow-blue-200/50",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTMwVjBoLTEydjRoMTJ6TTI0IDI0aDEydi0ySDI0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-20 -translate-x-20"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <span className="text-white/80 text-sm font-medium" suppressHydrationWarning={true}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">{getGreeting()}, Admin! 👋</h1>
            <p className="text-white/70 text-sm sm:text-base">Here&apos;s what&apos;s happening with Trash2Treasure today.</p>
          </div>
          <Button
            onClick={() => fetchDashboardData()}
            className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white rounded-xl px-5 py-2.5 font-medium transition-all duration-300 hover:-translate-y-0.5"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100/80 relative overflow-hidden hover:-translate-y-1.5 transition-all duration-400 hover:shadow-xl cursor-default"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Top gradient line */}
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${stat.gradient} opacity-80`}></div>

              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.title}</h3>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.glowColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">{stat.value}</p>

              <div className={`flex items-center text-xs font-medium ${stat.changeType === 'positive' ? 'text-emerald-600' : 'text-rose-500'}`}>
                {stat.changeType === 'positive' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {stat.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Feed - Takes 3 columns */}
        <div className="lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 overflow-hidden">
          <div className="p-5 border-b border-gray-100/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200/50">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Activity Feed</h2>
                <p className="text-[11px] text-gray-400">Real-time updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Live
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {activities.map((activity, idx) => (
              <div
                key={activity.id}
                className="p-4 border-b border-gray-50/80 flex items-center gap-3.5 hover:bg-gray-50/60 transition-all duration-300 group"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0
                  ${activity.status === 'new' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                    activity.status === 'verified' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
                      'bg-gradient-to-br from-rose-500 to-rose-700'}`}
                >
                  {activity.user.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{activity.user}</span>{' '}
                    <span className="text-gray-500">{activity.action}</span>
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{activity.details}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-gray-400 mb-1">{activity.time}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                    ${activity.status === 'new' ? 'bg-blue-50 text-blue-600' :
                      activity.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-rose-50 text-rose-600'}`}
                  >
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <Activity className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No activity yet</p>
                <p className="text-sm mt-1">Activity will appear here as submissions come in</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Sidebar - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-5">
          {/* Performance Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md shadow-purple-200/50">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Performance</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500 font-medium">Verification Rate</span>
                  <span className="font-bold text-gray-900">
                    {dashboardData.stats.verifiedToday + dashboardData.stats.rejectedToday > 0
                      ? `${Math.round((dashboardData.stats.verifiedToday / (dashboardData.stats.verifiedToday + dashboardData.stats.rejectedToday)) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: dashboardData.stats.verifiedToday + dashboardData.stats.rejectedToday > 0
                        ? `${Math.round((dashboardData.stats.verifiedToday / (dashboardData.stats.verifiedToday + dashboardData.stats.rejectedToday)) * 100)}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500 font-medium">User Growth</span>
                  <span className="font-bold text-gray-900">
                    +{dashboardData.stats.newThisWeek} this week
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, (dashboardData.stats.newThisWeek / Math.max(1, dashboardData.stats.totalUsers)) * 100 * 5)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500 font-medium">Pending Review</span>
                  <span className="font-bold text-gray-900">{dashboardData.stats.pendingSubmissions} items</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, dashboardData.stats.pendingSubmissions * 5)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="/teams/submissions" className="flex flex-col items-center gap-2 p-4 bg-amber-50 rounded-xl border border-amber-100/80 hover:bg-amber-100/80 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
                <Clock className="h-6 w-6 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-amber-700">Review</span>
              </a>
              <a href="/teams/users" className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl border border-blue-100/80 hover:bg-blue-100/80 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
                <UsersIcon className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-blue-700">Users</span>
              </a>
              <a href="/teams/reports" className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl border border-purple-100/80 hover:bg-purple-100/80 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
                <TrendingUp className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-purple-700">Reports</span>
              </a>
              <a href="/teams/rewards" className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100/80 hover:bg-emerald-100/80 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
                <Coins className="h-6 w-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-emerald-700">Rewards</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 overflow-hidden">
        <div className="p-5 border-b border-gray-100/80 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Submissions</h2>
          <a href="/teams/submissions" className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
            View All
          </a>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dashboardData.recentSubmissions.map((sub: any, i) => (
            <div key={i} className={`rounded-2xl border-2 p-5 relative transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl
              ${sub.status === 'PENDING' ? 'border-amber-200 bg-gradient-to-br from-amber-50/80 to-white' :
                sub.status === 'VERIFIED' ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white' :
                  'border-rose-200 bg-gradient-to-br from-rose-50/80 to-white'}`}>

              <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-sm z-10
                ${sub.status === 'PENDING' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                  sub.status === 'VERIFIED' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                    'bg-gradient-to-r from-rose-500 to-red-500'}`}>
                {sub.status}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-200/50 uppercase">
                  {(sub.user?.name || 'U').charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 leading-tight truncate text-sm">{sub.user?.name || 'Unknown User'}</h4>
                  <p className="text-[11px] text-gray-400 truncate">{sub.userId?.substring(0, 8)}... • {sub.user?.email}</p>
                </div>
              </div>

              <div className="w-full h-44 bg-gray-100 rounded-xl mb-4 overflow-hidden relative group cursor-pointer">
                <img src={sub.imageUrl || 'https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg?auto=compress&cs=tinysrgb&w=400'} alt={sub.wasteType} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Type', value: sub.wasteType },
                  { label: 'Location', value: sub.location },
                  { label: 'Date', value: new Date(sub.createdAt).toLocaleDateString() },
                  { label: 'Points', value: sub.pointsAwarded || 0 },
                ].map((item, j) => (
                  <div key={j} className="flex justify-between items-center py-1 border-b border-gray-100/60 last:border-0">
                    <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                    <span className="text-xs font-semibold text-gray-800 truncate max-w-[140px] text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}