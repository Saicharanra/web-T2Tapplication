"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, Coins, Users as UsersIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Stat {
  title: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bg: string;
}

interface Activity {
  user: string;
  action: string;
  time: string;
  status: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  points: number;
  level: string;
  createdAt: string;
  totalSubmissions: number;
  verifiedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newThisWeek: number;
  topContributors: number;
  recentSubmissions: number;
  totalPoints: number;
}

interface DashboardData {
  stats: DashboardStats;
  users: UserData[];
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async (useFallback = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching dashboard data from", useFallback ? "/api/admin/dashboard/fallback" : "/api/admin/dashboard");
      
      // Fetch admin dashboard data
      const response = await fetch(useFallback ? "/api/admin/dashboard/fallback" : "/api/admin/dashboard");
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        if (!useFallback) {
        
          console.log("Trying fallback API...");
          return fetchDashboardData(true);
        }
        
        const errorText = await response.text();
        console.error("API Error response:", errorText);
        throw new Error(`Failed to fetch dashboard data: ${response.status} - ${errorText}`);
      }
      
      const rawData: unknown = await response.json();
      console.log("Received raw data:", rawData);
      
      // Type guard to check if data has expected structure
      const isValidDashboardData = (data: unknown): data is { 
        stats?: Partial<DashboardStats>; 
        users?: UserData[] 
      } => {
        return typeof data === 'object' && data !== null;
      };
      
      if (!isValidDashboardData(rawData)) {
        throw new Error('Invalid dashboard data structure received');
      }
      
      const data: DashboardData = {
        stats: {
          totalUsers: rawData.stats?.totalUsers || 0,
          activeUsers: rawData.stats?.activeUsers || 0,
          newThisWeek: rawData.stats?.newThisWeek || 0,
          topContributors: rawData.stats?.topContributors || 0,
          recentSubmissions: rawData.stats?.recentSubmissions || 0,
          totalPoints: rawData.stats?.totalPoints || 0,
        },
        users: Array.isArray(rawData.users) ? rawData.users : []
      };
      
      console.log("Processed data:", data);
      setDashboardData(data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      
      if (!useFallback) {
        // Try fallback API
        console.log("Trying fallback API due to error...");
        return fetchDashboardData(true);
      }
      
      const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  const stats: Stat[] = dashboardData ? [
    {
      title: "Total Users",
      value: dashboardData.stats.totalUsers.toString(),
      icon: UsersIcon,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Active Users",
      value: dashboardData.stats.activeUsers.toString(),
      icon: UsersIcon,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Pending Submissions",
      value: dashboardData.stats.recentSubmissions.toString(),
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      title: "Verified Submissions",
      value: dashboardData.users.reduce((sum, user) => sum + (user.verifiedSubmissions || 0), 0).toString(),
      icon: CheckCircle2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Points Awarded",
      value: dashboardData.stats.totalPoints.toLocaleString(),
      icon: Coins,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ] : [

    {
      title: "Total Users",
      value: "0",
      icon: UsersIcon,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Active Users",
      value: "0",
      icon: UsersIcon,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Pending Submissions",
      value: "0",
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      title: "Verified Submissions",
      value: "0",
      icon: CheckCircle2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Points Awarded",
      value: "0",
      icon: Coins,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  // Generate recent activity from users (most recent first)
  const recentActivity: Activity[] = dashboardData && dashboardData.users.length > 0 ? 
    [...dashboardData.users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(user => ({
        user: user.name || "Unknown User",
        action: `Joined as ${user.role?.toLowerCase() || "user"}`,
        time: getTimeAgo(new Date(user.createdAt)),
        status: user.status?.toLowerCase() || "active"
      })) : [];

  // Helper function to calculate time ago
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Loading dashboard data...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Error loading dashboard</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error: {error}</p>
              <button 
                onClick={() => fetchDashboardData()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Monitor and manage your Trash2Treasure Telangana system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title || index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Recent User Activity
              <button onClick={() => fetchDashboardData()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-green-600" : "text-gray-500 hover:text-green-600"}`} />
              </button>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white font-semibold">
                      {activity.user.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.user}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{activity.time}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        activity.status === "active"
                          ? "bg-green-100 text-green-700"
                          : activity.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent activity found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}