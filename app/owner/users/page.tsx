"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
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

export default function UsersPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newThisWeek: 0,
    topContributors: 0,
  });

  // 🔥 Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetchWithAuth('/api/admin/users');

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 403) {
          toast({
            title: "❌ Access Denied",
            description: "You need admin privileges to view this page.",
            variant: "destructive",
          });
          return;
        }

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
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 🔥 Combined Filter (Search + Role)
  useEffect(() => {
    let filtered = users;

    // Search
    if (searchTerm !== "") {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
      .toUpperCase()
      .slice(0, 2);
  };

  const userStatsConfig = [
    { title: "Total Users", value: stats.totalUsers, icon: Users },
    { title: "Active Users", value: stats.activeUsers, icon: TrendingUp },
    { title: "New This Week", value: stats.newThisWeek, icon: UserPlus },
    { title: "Top Contributors", value: stats.topContributors, icon: Award },
  ];
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // 🔥 Update User Role
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      const response = await fetchWithAuth(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      toast({
        title: "✅ Success",
        description: "User role updated successfully",
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // 🔄 Loading
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
      <title>Manage Users | Admin Panel</title>
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage registered users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {userStatsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <h4 className="text-2xl font-bold">
                    {stat.value?.toLocaleString?.() || 0}
                  </h4>
                </div>
                <Icon className="h-6 w-6 text-gray-500" />
              </CardContent>
            </Card>
          );
        })}
      </div>

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
            <div className="text-center py-10 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Role</th>
                    <th className="py-3 px-4 text-left">Level</th>
                    <th className="py-3 px-4 text-left">Points</th>
                    <th className="py-3 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          {getInitials(user.name)}
                        </div>
                        {user.name}
                      </td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            disabled={updatingUserId === user.id}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="border rounded px-2 py-1 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          {updatingUserId === user.id && (
                            <Recycle className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{user.level}</td>
                      <td className="py-3 px-4">{user.points}</td>
                      <td className="py-3 px-4">{user.status}</td>
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