 "use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  email: string;
  points: number;
  level: string;
  submissions: number;
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
  switch (level) {
    case "PLATINUM":
      return "from-slate-400 to-slate-600";
    case "GOLD":
      return "from-yellow-400 to-yellow-600";
    case "SILVER":
      return "from-gray-300 to-gray-500";
    case "BRONZE":
      return "from-orange-400 to-orange-600";
    default:
      return "from-gray-400 to-gray-600";
  }
};

export default function LeaderboardPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leaderboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      setCurrentUser(data.currentUser);
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load leaderboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading leaderboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🏆 Leaderboard</h1>
        <p className="text-gray-600 mt-1">Compete with other eco-warriors in Telangana</p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaderboard.slice(0, 3).map((user, index) => (
          <Card
            key={user.rank}
            className={`${
              index === 0
                ? "md:order-2 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300"
                : index === 1
                ? "md:order-1 bg-gradient-to-br from-gray-100 to-gray-200"
                : "md:order-3 bg-gradient-to-br from-orange-100 to-orange-200"
            }`}
          >
            <CardContent className="p-6 text-center">
              <div className="text-5xl mb-3">{getRankIcon(user.rank)}</div>
              <div
                className={`h-20 w-20 rounded-full bg-gradient-to-br ${getLevelGradient(
                  user.level
                )} mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold shadow-lg`}
              >
                {user.avatar}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{user.level} Level</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl">🪙</span>
                <span className="text-2xl font-bold text-green-600">{user.points.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600">{user.submissions} submissions</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Your Ranking */}
      {currentUser && (
        <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {currentUser.avatar}
                </div>
                <div>
                  <p className="text-white/80 text-sm">Your Ranking</p>
                  <h3 className="text-2xl font-bold">Rank #{currentUser.rank}</h3>
                  <p className="text-white/80 text-sm">
                    {currentUser.rank <= 10 ? "Amazing! You're in the top 10!" : "Keep going! You're doing great!"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm">{currentUser.submissions} submissions</span>
                </div>
                <p className="text-3xl font-bold">{currentUser.points.toLocaleString()}</p>
                <p className="text-white/80 text-sm">points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Eco-Warriors ({leaderboard.length} users)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No users on the leaderboard yet</p>
              <p className="text-sm text-gray-400 mt-2">Be the first to start earning points!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    currentUser && user.id === currentUser.id
                      ? "bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300"
                      : "bg-white border border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold w-12 text-center">
                      {getRankIcon(user.rank)}
                    </div>
                    <div
                      className={`h-12 w-12 rounded-full bg-gradient-to-br ${getLevelGradient(
                        user.level
                      )} flex items-center justify-center text-white font-bold shadow-md`}
                    >
                      {user.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {user.name}
                        {currentUser && user.id === currentUser.id && (
                          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {user.level} Level
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Submissions</p>
                      <p className="font-bold text-gray-900">{user.submissions}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Points</p>
                      <div className="flex items-center gap-1">
                        <span className="text-xl">🪙</span>
                        <p className="font-bold text-green-600 text-lg">{user.points.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
