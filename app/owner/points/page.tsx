"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Coins,
  TrendingUp,
  Award,
  Calendar,
  Recycle,
  Search,
  User,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  role: string;
  level: string;
  points: number;
  status: string;
  location: string;
  joinedAt: string;
}

interface Transaction {
  id: string;
  userId: string;
  user: string;
  role: string;
  email: string;
  action: string;
  amount: number;
  wasteType: string;
  date: string;
}

interface PointsStats {
  totalDistributed: number;
  todayDistribution: number;
  topEarner: string;
  averagePerSubmission: number;
}

export default function PointsHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PointsStats>({
    totalDistributed: 0,
    todayDistribution: 0,
    topEarner: "None",
    averagePerSubmission: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isAuditingOpen, setIsAuditingOpen] = useState(false);

  const { toast } = useToast();

  const fetchPointsData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth("/api/admin/points");
      if (!res.ok) throw new Error("Failed to fetch points data");

      const data = await res.json();

      setStats(
        data.stats || {
          totalDistributed: 0,
          todayDistribution: 0,
          topEarner: "None",
          averagePerSubmission: 0,
        }
      );
      setTransactions(data.transactions || []);
      setUsers(data.users || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "❌ Error",
        description: "Failed to load points history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPointsData();
  }, [fetchPointsData]);

  const handleUserClick = (user: UserDetail) => {
    setSelectedUser(user);
    setIsAuditingOpen(true);
  };

  const getUserStats = (userId: string) => {
    const userTx = transactions.filter((t) => t.userId === userId);
    const totalEarned = userTx.reduce((sum, t) => sum + t.amount, 0);
    return {
      submissionsCount: userTx.length,
      totalPointsEarned: totalEarned,
      transactions: userTx,
    };
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pointsStatsConfig = [
    {
      title: "Total Points Awarded",
      value: stats.totalDistributed.toLocaleString(),
      subtitle: `+${stats.todayDistribution.toLocaleString()} today`,
      icon: Coins,
      color: "from-purple-500 to-purple-700",
    },
    {
      title: "Avg Points/Submission",
      value: stats.averagePerSubmission.toString(),
      subtitle: "System Wide",
      icon: TrendingUp,
      color: "from-green-500 to-green-700",
    },
    {
      title: "Top Earner",
      value: stats.topEarner,
      subtitle: "Top Contributor",
      icon: Award,
      color: "from-blue-500 to-blue-700",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Recycle className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading points history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <title>Points History | Admin Panel</title>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Points History</h1>
        <p className="text-gray-600 mt-1">Track all point transactions and rewards by user</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {pointsStatsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-gray-200"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-90 transition-opacity ${stat.color}`}
              ></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-gray-500">{stat.title}</p>
                  <div
                    className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-sm bg-gradient-to-br ${stat.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-3xl font-bold text-gray-900">{stat.value}</h4>
                  <div
                    className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                      stat.title === "Top Earner" ? "text-blue-600" : "text-green-600"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {stat.subtitle}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-205 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50"
          />
        </div>
        <div className="text-sm font-semibold text-gray-500">
          Showing {filteredUsers.length} of {users.length} contributors
        </div>
      </div>

      {/* Unique Contributors Table */}
      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-gray-500" />
            Unique Contributors
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/20">
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">User Profile</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Role & Level</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Current Points</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Total Submissions</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Total Points Earned</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No contributors found matching search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const userStats = getUserStats(user.id);
                    return (
                      <tr
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {user.imageUrl ? (
                              <div className="h-10 w-10 rounded-full overflow-hidden relative border border-gray-100 flex-shrink-0 shadow-sm">
                                <img
                                  src={user.imageUrl}
                                  alt={user.name}
                                  className="object-cover h-full w-full"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0 uppercase">
                                {user.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-gray-900 block">{user.name}</span>
                              <span className="text-xs text-gray-500 block">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit tracking-wide shadow-sm
                              ${
                                user.role === "ADMIN" || user.role === "OWNER"
                                  ? "bg-red-50 text-red-700 border border-red-100"
                                  : "bg-blue-50 text-blue-700 border border-blue-100"
                              }`}
                            >
                              {user.role}
                            </span>
                            <span className="text-xs text-gray-500 font-bold tracking-wider uppercase">
                              {user.level} LEVEL
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-900">🪙 {user.points}</td>
                        <td className="py-4 px-6 text-gray-600 font-medium">
                          {userStats.submissionsCount} submissions
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-green-600 font-bold text-lg">
                            +{userStats.totalPointsEarned} pts
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserClick(user);
                            }}
                            className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-bold px-4 py-1.5 rounded-lg text-xs shadow-sm hover:shadow transition-all"
                          >
                            Audit details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Auditing Modal */}
      <Dialog open={isAuditingOpen} onOpenChange={setIsAuditingOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-gray-150 p-6 shadow-2xl">
          {selectedUser && (
            <>
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                  <User className="h-6 w-6 text-green-600" />
                  User Profile & Audit
                </DialogTitle>
                <DialogDescription className="text-gray-500 font-medium">
                  Review complete profile history and contributions for {selectedUser.name}.
                </DialogDescription>
              </DialogHeader>

              {/* Profile Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b text-left">
                <div className="flex flex-col items-center justify-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {selectedUser.imageUrl ? (
                    <div className="h-20 w-20 rounded-full overflow-hidden relative border-2 border-white shadow-md mb-3">
                      <img
                        src={selectedUser.imageUrl}
                        alt={selectedUser.name}
                        className="object-cover h-full w-full"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white font-bold text-2xl shadow-md mb-3 uppercase">
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                  <h4 className="font-extrabold text-lg text-gray-900">{selectedUser.name}</h4>
                  <p className="text-xs text-gray-500 font-medium flex items-center justify-center gap-1 mt-1 break-all w-full">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {selectedUser.email}
                  </p>
                </div>

                <div className="md:col-span-2 space-y-4 flex flex-col justify-center">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Status
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1
                        ${
                          selectedUser.status === "ACTIVE"
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {selectedUser.status}
                      </span>
                    </div>

                    <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Points Balance
                      </span>
                      <span className="text-base font-bold text-gray-900 flex items-center gap-1 mt-1">
                        🪙 {selectedUser.points}
                      </span>
                    </div>

                    <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Location
                      </span>
                      <span
                        className="text-xs font-bold text-gray-700 mt-1 flex items-center gap-1 truncate"
                        title={selectedUser.location}
                      >
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {selectedUser.location}
                      </span>
                    </div>

                    <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Joined Date
                      </span>
                      <span className="text-xs font-bold text-gray-700 mt-1 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {selectedUser.joinedAt}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Transaction list */}
              <div className="py-4 text-left">
                <h5 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-1.5">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Transaction Log ({getUserStats(selectedUser.id).submissionsCount})
                </h5>

                <div className="border border-gray-150 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto shadow-inner">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-150 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-xs">Submission ID</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-xs">Waste Category</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-xs">Points Awarded</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-xs">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getUserStats(selectedUser.id).transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">
                            No point transactions on record.
                          </td>
                        </tr>
                      ) : (
                        getUserStats(selectedUser.id).transactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                                {tx.id.substring(0, 8).toUpperCase()}
                              </code>
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-700 capitalize">
                              {tx.wasteType}
                            </td>
                            <td className="py-3 px-4 text-green-600 font-bold">+{tx.amount}</td>
                            <td className="py-3 px-4 text-gray-500 text-xs">{tx.date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <DialogFooter className="mt-4 sm:justify-end">
                <Button
                  onClick={() => setIsAuditingOpen(false)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold h-11 px-8 rounded-xl"
                >
                  Close Audit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}