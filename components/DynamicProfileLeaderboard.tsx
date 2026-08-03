"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Search, ArrowRight, RefreshCw, Zap, Award, Sparkles } from "lucide-react";
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
}

const getRankBadge = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

export function DynamicProfileLeaderboard({ userPoints = 0 }: { userPoints?: number }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [filterTab, setFilterTab] = useState<"points" | "streak" | "submissions">("points");
  const [searchQuery, setSearchQuery] = useState("");

  const loadLeaderboard = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetchWithAuth("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
        }
      }
    } catch (err) {
      console.warn("Could not load dynamic leaderboard on profile:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const filteredList = useMemo(() => {
    let list = [...leaderboard];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if ((filterTab as string) === "only_me") {
      if (currentUser) {
        list = list.filter(u => u.id === currentUser.id);
      }
    } else if (filterTab === "streak") {
      list.sort((a, b) => (b.streak || 0) - (a.streak || 0) || b.points - a.points);
    } else if (filterTab === "submissions") {
      list.sort((a, b) => (b.submissions || 0) - (a.submissions || 0) || b.points - a.points);
    } else {
      list.sort((a, b) => b.points - a.points);
    }

    return list;
  }, [leaderboard, filterTab, searchQuery, currentUser]);

  return (
    <Card id="dynamic-leaderboard-section" className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-[2rem] overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-500" />
      
      <CardHeader className="p-6 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-bold mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Live Ranking & Daily Streaks
            </div>
            <CardTitle className="text-2xl font-black text-gray-900 flex items-center gap-2">
              🏆 Live Leaderboard
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Real-time rankings calculated from verified uploads & active daily upload dates.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadLeaderboard(true)}
              disabled={refreshing}
              className="rounded-full border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              Sync
            </Button>
            <Link href="/dashboard/leaderboard">
              <Button size="sm" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md">
                Full Page <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full w-full sm:w-auto">
            <button
              onClick={() => setFilterTab("points")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                filterTab === "points" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🪙 Points
            </button>
            <button
              onClick={() => setFilterTab("streak")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                filterTab === "streak" ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🔥 Streaks
            </button>
            <button
              onClick={() => setFilterTab("submissions")}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                filterTab === "submissions" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ♻️ Submissions
            </button>
            <button
              onClick={() => setFilterTab("only_me" as any)}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                (filterTab as string) === "only_me" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              👤 Only Me
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search warrior..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs rounded-full border-gray-200 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-2 space-y-4">
        {/* Current User Live Banner */}
        {currentUser && (
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 p-0.5 flex items-center justify-center font-bold text-lg overflow-hidden relative shadow-inner">
                {currentUser.avatar && currentUser.avatar.startsWith("http") ? (
                  <Image src={currentUser.avatar} alt={currentUser.name} fill className="object-cover rounded-full" unoptimized />
                ) : (
                  currentUser.avatar || "YOU"
                )}
              </div>
              <div>
                <p className="text-[11px] text-emerald-100 font-medium">Your Current Rank</p>
                <p className="text-xl font-extrabold flex items-center gap-2">
                  #{currentUser.rank} <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Active Competitor</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-100 font-medium">Daily Streak</p>
              <p className="text-lg font-black text-amber-300">
                🔥 {currentUser.streak || 0} Days
              </p>
            </div>
          </div>
        )}

        {/* Dynamic User List */}
        {loading ? (
          <div className="py-12 text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs text-gray-500">Loading live leaderboard data...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            No eco-warriors match the criteria yet. Be the first to submit recycling photos!
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            <AnimatePresence>
              {filteredList.slice(0, 10).map((user, idx) => {
                const isYou = currentUser && user.id === currentUser.id;
                const rankNum = filterTab === "points" ? user.rank : idx + 1;

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isYou
                        ? "bg-emerald-50 border-2 border-emerald-400 shadow-sm"
                        : "bg-white/60 border border-gray-100 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 text-center text-lg font-black text-gray-700 shrink-0">
                        {getRankBadge(rankNum)}
                      </span>
                      
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shrink-0 relative overflow-hidden text-white font-bold flex items-center justify-center text-xs">
                        {user.avatar && user.avatar.startsWith("http") ? (
                          <Image src={user.avatar} alt={user.name} fill className="object-cover rounded-full" unoptimized />
                        ) : (
                          user.avatar || user.name.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-gray-900 text-sm truncate">{user.name}</p>
                          {isYou && (
                            <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {user.submissions || 0} Submissions • {user.level || "BRONZE"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <p className={`text-xs font-black ${user.streak > 0 ? "text-orange-600" : "text-gray-400"}`}>
                          🔥 {user.streak > 0 ? `${user.streak}d` : "0d"}
                        </p>
                      </div>
                      <div className="min-w-[60px]">
                        <p className="text-xs font-black text-emerald-600">
                          🪙 {user.points.toLocaleString()}
                        </p>
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
  );
}
