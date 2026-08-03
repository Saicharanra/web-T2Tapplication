"use client";

import Image from "next/image";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Recycle, Flame, Search, RefreshCw, Award, Zap, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePoints } from "../context/PointsContext";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  email: string;
  points: number;
  level: string;
  submissions: number;
  streak: number;
  avatar: string;
  joinedAt: string;
}

interface CurrentUser extends LeaderboardUser {
  rank: number;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

const getLevelGradient = (level: string) => {
  switch (level?.toUpperCase()) {
    case "PLATINUM":
      return "from-slate-400 to-slate-600 border-slate-300";
    case "GOLD":
      return "from-amber-400 to-yellow-500 border-amber-300";
    case "SILVER":
      return "from-slate-300 to-gray-400 border-slate-200";
    case "BRONZE":
      return "from-amber-600 to-orange-700 border-amber-500";
    default:
      return "from-emerald-400 to-teal-600 border-emerald-300";
  }
};

export default function LeaderboardPage() {
  const { toast } = useToast();
  const { user: clerkUser } = useAuth();
  const { points: globalPoints } = usePoints();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeTab, setActiveTab] = useState<"points" | "streak" | "submissions">("points");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeaderboard = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetchWithAuth('/api/leaderboard');

      if (!response.ok) {
        console.warn('Backend API unavailable. Displaying default leaderboard.');
        const mockLeaderboard: LeaderboardUser[] = [
          { rank: 1, id: "u-1", name: "Anandhi Nallaganti", email: "anandhi@example.com", points: 8500, level: "PLATINUM", submissions: 154, streak: 12, avatar: "https://i.pravatar.cc/150?u=anandhi", joinedAt: new Date().toISOString() },
          { rank: 2, id: "u-2", name: "Rajesh Kumar", email: "rajesh@example.com", points: 6200, level: "GOLD", submissions: 112, streak: 8, avatar: "https://i.pravatar.cc/150?u=rajesh", joinedAt: new Date().toISOString() },
          { rank: 3, id: "u-3", name: "Amit Patel", email: "amit@example.com", points: 4800, level: "SILVER", submissions: 89, streak: 5, avatar: "https://i.pravatar.cc/150?u=amit", joinedAt: new Date().toISOString() },
          { rank: 4, id: "u-4", name: "Suresh Reddy", email: "suresh@example.com", points: 3900, level: "BRONZE", submissions: 65, streak: 3, avatar: "https://i.pravatar.cc/150?u=suresh", joinedAt: new Date().toISOString() },
          { rank: 5, id: "u-5", name: "Neha Gupta", email: "neha@example.com", points: 2100, level: "BRONZE", submissions: 32, streak: 1, avatar: "https://i.pravatar.cc/150?u=neha", joinedAt: new Date().toISOString() },
          {
            rank: 15,
            id: clerkUser?.uid || "curr-user",
            name: clerkUser?.displayName || "You",
            email: clerkUser?.email || "user@example.com",
            points: globalPoints || 300,
            level: "BRONZE",
            submissions: 3,
            streak: 0,
            avatar: clerkUser?.photoURL || "https://i.pravatar.cc/150?u=user",
            joinedAt: new Date().toISOString()
          },
        ];
        setLeaderboard(mockLeaderboard);
        setCurrentUser({ ...mockLeaderboard[5], rank: 15 });
        return;
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      setCurrentUser(data.currentUser);

      if (isManualRefresh) {
        toast({
          title: "⚡ Leaderboard Updated",
          description: "Live rankings and streak data refreshed!",
        });
      }
    } catch (error) {
      console.warn('Error fetching leaderboard:', error);
      setLeaderboard([]);
      setCurrentUser(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clerkUser, globalPoints, toast]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Compute sorted & filtered list dynamically based on active tab & search query
  const filteredLeaderboard = useMemo(() => {
    let result = [...leaderboard];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (activeTab === "streak") {
      result.sort((a, b) => b.streak - a.streak || b.points - a.points);
    } else if (activeTab === "submissions") {
      result.sort((a, b) => b.submissions - a.submissions || b.points - a.points);
    } else {
      result.sort((a, b) => b.points - a.points);
    }

    return result;
  }, [leaderboard, activeTab, searchQuery]);

  // Stats calculation
  const totalSubmissionsSum = useMemo(() => {
    return leaderboard.reduce((acc, u) => acc + (u.submissions || 0), 0);
  }, [leaderboard]);

  const maxStreak = useMemo(() => {
    return Math.max(0, ...leaderboard.map(u => u.streak || 0));
  }, [leaderboard]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Recycle className="h-10 w-10 animate-spin text-green-600" />
        <span className="text-gray-600 font-medium animate-pulse">Fetching live eco-warrior standings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <title>Leaderboard | Trash2Treasure</title>
      <meta name="description" content="Compete with other eco-warriors in Telangana with real-time streak tracking." />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 p-6 sm:p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-200 mb-3 border border-white/20">
            <Sparkles className="h-3.5 w-3.5" /> Live Eco-Warrior Standings
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            🏆 Dynamic Leaderboard
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base mt-2 max-w-xl">
            Earn points with verified waste uploads, maintain your active daily streak 🔥, and rise through the ranks!
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 w-full sm:w-auto">
          <Button
            onClick={() => fetchLeaderboard(true)}
            disabled={refreshing}
            variant="outline"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md rounded-full px-5 py-2 flex items-center gap-2 shadow-lg transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Sync Live"}
          </Button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/80 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 font-bold text-2xl">🏆</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Top Eco-Warriors</p>
              <p className="text-2xl font-black text-amber-950 mt-0.5">{leaderboard.length} Active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/80 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 font-bold text-2xl">♻️</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Recycled</p>
              <p className="text-2xl font-black text-emerald-950 mt-0.5">{totalSubmissionsSum.toLocaleString()} Items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200/80 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-600 font-bold text-2xl">🔥</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Highest Active Streak</p>
              <p className="text-2xl font-black text-orange-950 mt-0.5">{maxStreak} Days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {leaderboard.slice(0, 3).map((user, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`${isFirst ? "md:order-2" : isSecond ? "md:order-1" : "md:order-3"}`}
              >
                <Card
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.03] ${
                    isFirst
                      ? "bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50 border-2 border-yellow-400 shadow-xl"
                      : isSecond
                      ? "bg-gradient-to-b from-slate-50 to-gray-100 border border-slate-300 shadow-lg"
                      : "bg-gradient-to-b from-orange-50 to-amber-100 border border-orange-300 shadow-lg"
                  }`}
                >
                  {isFirst && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-amber-950 font-black text-[10px] uppercase px-3 py-1 rounded-bl-xl tracking-wider flex items-center gap-1 shadow-sm">
                      <Sparkles className="h-3 w-3" /> Champion
                    </div>
                  )}

                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-3 drop-shadow-md">{getRankIcon(user.rank)}</div>
                    
                    <div className="relative mx-auto w-24 h-24 mb-4">
                      <div className={`w-full h-full rounded-full bg-gradient-to-br ${getLevelGradient(user.level)} p-1 shadow-xl relative flex items-center justify-center text-white text-3xl font-extrabold overflow-hidden`}>
                        {user.avatar && user.avatar.startsWith('http') ? (
                          <Image src={user.avatar} alt={user.name} fill className="object-cover rounded-full" unoptimized />
                        ) : (
                          user.avatar || user.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {user.streak > 0 && (
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg border border-white">
                          🔥 {user.streak}d
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 truncate">{user.name}</h3>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3">{user.level} LEVEL</p>

                    <div className="flex items-center justify-center gap-2 mb-3 bg-white/70 backdrop-blur-md py-2 px-4 rounded-xl border border-white/80 shadow-inner">
                      <span className="text-2xl">🪙</span>
                      <span className="text-2xl font-black text-emerald-700">{user.points.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-around text-xs text-gray-600 border-t border-gray-200/60 pt-3">
                      <div>
                        <span className="block font-bold text-gray-900">{user.submissions}</span>
                        <span>Submissions</span>
                      </div>
                      <div className="w-px h-6 bg-gray-300" />
                      <div>
                        <span className="block font-bold text-orange-600 flex items-center justify-center gap-0.5">
                          🔥 {user.streak}
                        </span>
                        <span>Daily Streak</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Logged In User Rank Card */}
      {currentUser && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl rounded-2xl border border-emerald-400/40 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="h-16 w-16 rounded-full bg-white/20 p-1 shrink-0 relative flex items-center justify-center text-2xl font-bold shadow-inner overflow-hidden">
                    {currentUser.avatar && currentUser.avatar.startsWith('http') ? (
                      <Image src={currentUser.avatar} alt={currentUser.name} fill className="object-cover rounded-full" unoptimized />
                    ) : (
                      currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold text-white mb-1">
                      <Zap className="h-3 w-3" /> Your Dynamic Profile Rank
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Rank #{currentUser.rank}</h3>
                    <p className="text-emerald-100 text-xs mt-0.5">
                      {currentUser.rank <= 3
                        ? "🥇 Outstanding! You are on the Podium!"
                        : currentUser.rank <= 10
                        ? "🎉 Great work! You are in the Top 10 Eco-Warriors!"
                        : "Upload waste photos daily to increase points & maintain your streak!"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-white/20">
                  <div className="text-center sm:text-right">
                    <p className="text-xs text-emerald-100 font-medium">Daily Streak</p>
                    <p className="text-xl font-extrabold text-amber-300 flex items-center justify-center sm:justify-end gap-1">
                      🔥 {currentUser.streak || 0} Days
                    </p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-xs text-emerald-100 font-medium">Total Points</p>
                    <p className="text-2xl font-black">{globalPoints.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Interactive Leaderboard Table & Filters */}
      <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Live Standings ({filteredLeaderboard.length})
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">Real-time dynamic ranking updated with daily dates & streaks</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-200/60 p-1 rounded-full w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("points")}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                  activeTab === "points"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🪙 Top Points
              </button>
              <button
                onClick={() => setActiveTab("streak")}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                  activeTab === "streak"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🔥 Streak Leaders
              </button>
              <button
                onClick={() => setActiveTab("submissions")}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                  activeTab === "submissions"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                ♻️ Most Active
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="mt-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search eco-warriors by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-gray-200 bg-white shadow-inner focus:ring-emerald-500"
            />
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {filteredLeaderboard.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-16 w-16 mx-auto text-gray-300 mb-3 animate-bounce" />
              <p className="text-gray-600 font-semibold text-lg">No eco-warriors found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or upload waste to take the lead!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredLeaderboard.map((user, idx) => {
                  const isCurrent = currentUser && user.id === currentUser.id;
                  const displayRank = activeTab === "points" ? user.rank : idx + 1;

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 rounded-2xl transition-all duration-300 ${
                        isCurrent
                          ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-400 shadow-md scale-[1.01]"
                          : "bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto overflow-hidden">
                        <div className="text-xl sm:text-2xl font-extrabold w-10 text-center shrink-0 text-gray-800">
                          {getRankIcon(displayRank)}
                        </div>

                        <div className="relative shrink-0">
                          <div
                            className={`h-12 w-12 rounded-full bg-gradient-to-br ${getLevelGradient(
                              user.level
                            )} p-0.5 flex items-center justify-center text-white font-extrabold shadow-md overflow-hidden relative`}
                          >
                            {user.avatar && user.avatar.startsWith('http') ? (
                              <Image src={user.avatar} alt={user.name} fill className="object-cover rounded-full" unoptimized />
                            ) : (
                              user.avatar || user.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          {user.streak > 0 && (
                            <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow border border-white">
                              🔥{user.streak}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-base truncate">
                              {user.name}
                            </h3>
                            {isCurrent && (
                              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                YOU
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-medium">
                            {user.level} Level
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                        {/* Daily Streak */}
                        <div className="text-left sm:text-right">
                          <p className="text-[11px] text-gray-500 font-semibold uppercase">Daily Streak</p>
                          <p className={`font-black text-sm flex items-center justify-start sm:justify-end gap-1 ${
                            user.streak > 0 ? "text-orange-600" : "text-gray-400"
                          }`}>
                            🔥 {user.streak > 0 ? `${user.streak} Days` : "0 Days"}
                          </p>
                        </div>

                        {/* Submissions */}
                        <div className="text-left sm:text-right">
                          <p className="text-[11px] text-gray-500 font-semibold uppercase">Submissions</p>
                          <p className="font-bold text-gray-900 text-sm">{user.submissions}</p>
                        </div>

                        {/* Points */}
                        <div className="text-right min-w-[80px]">
                          <p className="text-[11px] text-gray-500 font-semibold uppercase">Points</p>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-base">🪙</span>
                            <p className="font-black text-emerald-600 text-base">{user.points.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
