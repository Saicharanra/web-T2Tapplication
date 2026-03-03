"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, Award, Recycle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  level: string;
  points: number;
  status: string;
  createdAt: string;
  totalSubmissions: number;
  verifiedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newThisWeek: number;
  topContributors: number;
}

const getLevelColor = (level: string) => {
  switch (level) {
    case "PLATINUM":
      return "bg-gradient-to-r from-slate-400 to-slate-600 text-white";
    case "GOLD":
      return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    case "SILVER":
      return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    case "BRONZE":
      return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
    default:
      return "bg-gray-200 text-gray-700";
  }
};

export default function UsersPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newThisWeek: 0,
    topContributors: 0,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users from /api/admin/users...');

      const response = await fetch('/api/admin/users');
      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);

        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }

        if (response.status === 403) {
          toast({
            title: "❌ Access Denied",
            description: "You need admin privileges to view this page.",
            variant: "destructive",
          });
          return;
        }

        throw new Error(error.error || 'Failed to fetch users');
      }

      const data = await response.json();
      console.log('✅ Users data received:', {
        userCount: data.users?.length || 0,
        stats: data.stats
      });

      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
      setStats(data.stats || {
        totalUsers: 0,
        activeUsers: 0,
        newThisWeek: 0,
        topContributors: 0,
      });

    } catch (error) {
      console.error('💥 Error fetching users:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to load users. Please check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userStatsConfig = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Users", value: stats.activeUsers, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { title: "New This Week", value: stats.newThisWeek, icon: UserPlus, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Top Contributors", value: stats.topContributors, icon: Award, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Recycle className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-1">Monitor and manage registered users</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userStatsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value.toLocaleString()}</p>
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

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm ? "Try adjusting your search" : "Users will appear here when they sign up"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Level</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Points</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Submissions</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white font-semibold">
                            {getInitials(user.name)}
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(user.level)}`}>
                          {user.level}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-green-600">{user.points.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">{user.totalSubmissions}</div>
                          <div className="text-xs text-gray-500">
                            ✅ {user.verifiedSubmissions} • ⏳ {user.pendingSubmissions} • ❌ {user.rejectedSubmissions}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${user.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
