"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Check, X, Coins, Users as UsersIcon, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Stat {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ComponentType<any>;
  gradient: string;
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

  // Convert API submissions to our Activity UI format for feed
  const [activities, setActivities] = useState<Activity[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        let newStats = data.stats || {
          pendingSubmissions: 0,
          verifiedToday: 0,
          rejectedToday: 0,
          totalPoints: 0,
          totalUsers: 0,
          newThisWeek: 0
        };
        let newSubmissions = data.recentSubmissions || [];

        // Showcase mock data if empty
        if (newStats.totalUsers === 0 && newSubmissions.length === 0) {
          newStats = {
            pendingSubmissions: 12,
            verifiedToday: 45,
            rejectedToday: 3,
            totalPoints: 12500,
            totalUsers: 128,
            newThisWeek: 15
          };
          newSubmissions = [
            {
              id: 1,
              userId: 'USR001',
              user: { name: 'Priya Sharma', email: 'priya@example.com' },
              imageUrl: 'https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg',
              wasteType: 'Plastic Bottles',
              location: 'Hyderabad, Telangana',
              createdAt: new Date().toISOString(),
              status: 'PENDING',
              pointsAwarded: 0,
            },
            {
              id: 2,
              userId: 'USR002',
              user: { name: 'Rajesh Kumar', email: 'rajesh@example.com' },
              imageUrl: 'https://images.pexels.com/photos/802221/pexels-photo-802221.jpeg',
              wasteType: 'Aluminum Cans',
              location: 'Warangal, Telangana',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              status: 'VERIFIED',
              pointsAwarded: 35,
            },
            {
              id: 3,
              userId: 'USR003',
              user: { name: 'Anita Reddy', email: 'anita@example.com' },
              imageUrl: 'https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg',
              wasteType: 'Paper Waste',
              location: 'Karimnagar, Telangana',
              createdAt: new Date(Date.now() - 7200000).toISOString(),
              status: 'REJECTED',
              pointsAwarded: 0,
            }
          ];
        }

        setDashboardData({ stats: newStats, recentSubmissions: newSubmissions });

        // Populate feed with recent events derived from submissions
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
  }, [fetchDashboardData]);

  const stats: Stat[] = [
    {
      title: "Pending Submissions",
      value: String(dashboardData.stats.pendingSubmissions),
      change: "Live",
      changeType: "positive",
      icon: Clock,
      gradient: "from-amber-400 to-amber-600",
    },
    {
      title: "Verified Today",
      value: String(dashboardData.stats.verifiedToday),
      change: "Live",
      changeType: "positive",
      icon: Check,
      gradient: "from-emerald-500 to-emerald-700",
    },
    {
      title: "Rejected Today",
      value: String(dashboardData.stats.rejectedToday),
      change: "Live",
      changeType: "negative",
      icon: X,
      gradient: "from-red-500 to-red-700",
    },
    {
      title: "Points Awarded",
      value: String(dashboardData.stats.totalPoints.toLocaleString()),
      change: "Total",
      changeType: "positive",
      icon: Coins,
      gradient: "from-violet-500 to-violet-700",
    },
    {
      title: "Active Users",
      value: String(dashboardData.stats.totalUsers),
      change: `+${dashboardData.stats.newThisWeek} this week`,
      changeType: "positive",
      icon: UsersIcon,
      gradient: "from-blue-500 to-blue-700",
    },
  ];

  const refreshData = () => {
    fetchDashboardData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-500 text-lg">Monitor and manage your Trash2Treasure Telangana system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-blue-600"></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500">{stat.title}</h3>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${stat.gradient} shadow-inner`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <div className={`flex items-center text-sm font-medium ${stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-500'}`}>
                {stat.changeType === 'positive' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                {stat.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-gray-50/50 gap-4">
          <div className="flex items-center gap-3">
            <RadioIcon className="w-6 h-6 text-slate-700" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Real-time Activity Feed</h2>
          </div>
          <Button variant="outline" size="sm" onClick={refreshData} className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-white px-3 py-1.5 rounded-full border border-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh Data
          </Button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 border-b border-gray-50 flex items-center gap-4 hover:bg-gray-50/80 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                {activity.user.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  {activity.user} <span className="font-normal text-gray-600">{activity.action}</span>
                </p>
                <p className="text-sm text-gray-500 truncate">{activity.details}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400 font-medium mb-1">{activity.time}</p>
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                  ${activity.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    activity.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'}
                `}>
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Recent Submissions</h2>
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            View All
          </button>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData.recentSubmissions.map((sub: any, i) => (
            <div key={i} className={`bg-white rounded-xl border p-5 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
              ${sub.status === 'PENDING' ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-white' :
                sub.status === 'VERIFIED' ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-white' :
                  'border-red-400 bg-gradient-to-br from-red-50 to-white'}`}>

              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-sm z-10
                ${sub.status === 'PENDING' ? 'bg-amber-500' : sub.status === 'VERIFIED' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {sub.status}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm font-sans uppercase">
                  {(sub.user?.name || 'U').charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 leading-tight truncate">{sub.user?.name || 'Unknown User'}</h4>
                  <p className="text-xs text-gray-500 truncate">{sub.userId.substring(0, 8)}... • {sub.user?.email}</p>
                </div>
              </div>

              <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden relative group cursor-pointer">
                <img src={sub.imageUrl || 'https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg?auto=compress&cs=tinysrgb&w=400'} alt={sub.wasteType} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-sm text-gray-500 font-medium">Waste Type:</span>
                  <span className="text-sm font-semibold text-gray-900">{sub.wasteType}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-sm text-gray-500 font-medium">Location:</span>
                  <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px] text-right">{sub.location}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-sm text-gray-500 font-medium">Submitted:</span>
                  <span className="text-sm font-semibold text-gray-900">{new Date(sub.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-sm text-gray-500 font-medium">Points:</span>
                  <span className="text-sm font-bold text-gray-900">{sub.pointsAwarded || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Custom icon since Broadcast isn't exactly like the one in HTML potentially
function RadioIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </svg>
  );
}