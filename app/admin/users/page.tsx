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

<<<<<<< HEAD
export default function UsersPage() {
  const { toast } = useToast();

=======
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
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
<<<<<<< HEAD
  const [roleFilter, setRoleFilter] = useState("ALL");

=======
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newThisWeek: 0,
    topContributors: 0,
  });

<<<<<<< HEAD
  // 🔥 Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/users");

      if (!response.ok) {
        const errorText = await response.text();
=======
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
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46

        if (response.status === 403) {
          toast({
            title: "❌ Access Denied",
            description: "You need admin privileges to view this page.",
            variant: "destructive",
          });
          return;
        }

<<<<<<< HEAD
        throw new Error(errorText || "Failed to fetch users");
      }

      const data = await response.json();

      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
      setStats(data.stats || {});
    } catch (error) {
      toast({
        title: "❌ Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load users",
=======
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
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

<<<<<<< HEAD
  // 🔥 Combined Filter (Search + Role)
  useEffect(() => {
    let filtered = users;

    // Search
    if (searchTerm !== "") {
      filtered = filtered.filter(
=======
  useEffect(() => {
    // Filter users based on search term
    if (searchTerm === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
<<<<<<< HEAD
    }

    // Role Filter
    if (roleFilter !== "ALL") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
=======
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
      .toUpperCase()
      .slice(0, 2);
  };

  const userStatsConfig = [
<<<<<<< HEAD
    { title: "Total Users", value: stats.totalUsers, icon: Users },
    { title: "Active Users", value: stats.activeUsers, icon: TrendingUp },
    { title: "New This Week", value: stats.newThisWeek, icon: UserPlus },
    { title: "Top Contributors", value: stats.topContributors, icon: Award },
  ];

  // 🔄 Loading
=======
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Users", value: stats.activeUsers, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { title: "New This Week", value: stats.newThisWeek, icon: UserPlus, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Top Contributors", value: stats.topContributors, icon: Award, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
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
<<<<<<< HEAD
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage registered users
        </p>
      </div>

      {/* Stats */}
=======
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-1">Monitor and manage registered users</p>
      </div>

      {/* Stats Grid */}
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {userStatsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
<<<<<<< HEAD
            <Card key={stat.title}>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <h4 className="text-2xl font-bold">
                    {stat.value?.toLocaleString?.() || 0}
                  </h4>
                </div>
                <Icon className="h-6 w-6 text-gray-500" />
=======
            <Card key={stat.title} className="relative overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-gray-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-blue-600"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-gray-500">{stat.title}</p>
                  <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-sm ${stat.title === "Total Users" ? "bg-gradient-to-br from-blue-500 to-blue-700" :
                    stat.title === "Active Users" ? "bg-gradient-to-br from-green-500 to-green-700" :
                      stat.title === "New This Week" ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                        "bg-gradient-to-br from-purple-500 to-purple-700"
                    }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</h4>
                </div>
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
              </CardContent>
            </Card>
          );
        })}
      </div>

<<<<<<< HEAD
      {/* 🔍 Search + 🎛 Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm w-full sm:w-[180px]"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
=======
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
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
<<<<<<< HEAD
            <div className="text-center py-10 text-gray-500">
              No users found
=======
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm ? "Try adjusting your search" : "Users will appear here when they sign up"}
              </p>
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
<<<<<<< HEAD
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Role</th>
                    <th className="py-3 px-4 text-left">Level</th>
                    <th className="py-3 px-4 text-left">Points</th>
                    <th className="py-3 px-4 text-left">Status</th>
=======
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Level</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Points</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Submissions</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">Joined</th>
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
<<<<<<< HEAD
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          {getInitials(user.name)}
                        </div>
                        {user.name}
                      </td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{user.role}</td>
                      <td className="py-3 px-4">{user.level}</td>
                      <td className="py-3 px-4">{user.points}</td>
                      <td className="py-3 px-4">{user.status}</td>
=======
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white font-semibold">
                            {getInitials(user.name)}
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-md text-xs font-semibold ${user.role === 'ADMIN'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${user.level === 'PLATINUM' ? 'bg-indigo-100 text-indigo-800' :
                          user.level === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                            user.level === 'SILVER' ? 'bg-gray-100 text-gray-700' :
                              'bg-amber-100 text-amber-900' // BRONZE
                          }`}>
                          {user.level}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-green-600">{user.points.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">{user.totalSubmissions}</div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            ✅ {user.verifiedSubmissions} • ⏳ {user.pendingSubmissions} • ❌ {user.rejectedSubmissions}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${user.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
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
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
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