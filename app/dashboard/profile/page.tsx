"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Award, Calendar, Trophy, LogOut, Recycle } from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { usePoints } from "../context/PointsContext";
import { MyEcoTree } from "@/components/MyEcoTree";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  level: string;
  points: number;
  status: string;
  createdAt: string;
}

interface UserStats {
  totalSubmissions: number;
  verifiedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
  totalPoints: number;
  mostRecycledType: string;
  mostRecycledCount: number;
  streak: number;
  verificationRate: number;
  rank: number;
}

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { toast } = useToast();
  const { points: globalPoints } = usePoints();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        console.warn('Backend API unavailable. Mocking user data.');
        setUserData({
          id: user?.id || "mock-id",
          name: user?.fullName || user?.firstName || "Eco Warrior",
          email: user?.primaryEmailAddress?.emailAddress || "",
          role: "USER",
          level: "BRONZE",
          points: 300,
          status: "ACTIVE",
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('Error fetching user data, falling back to mock:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/users/profile/stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      } else {
        console.warn('Backend API unavailable. Mocking user stats.');
        setUserStats({
          totalSubmissions: 3,
          verifiedSubmissions: 3,
          pendingSubmissions: 0,
          rejectedSubmissions: 0,
          totalPoints: 300,
          mostRecycledType: "Plastic Bottle",
          mostRecycledCount: 15,
          streak: 2,
          verificationRate: 100,
          rank: 0
        });
      }

      // Helper to calculate rank against the standard mock profiles from leaderboard
      const calculateRank = (points: number) => {
        if (points >= 8500) return 1;
        if (points >= 6200) return 2;
        if (points >= 4800) return 3;
        if (points >= 3900) return 4;
        if (points >= 2100) return 5;
        // Basic decaying rank estimation for below the top 5
        return Math.floor(15 - (points / 300));
      };

      // Also fetch rank directly from leaderboard API for source-of-truth 
      // This ensures profile rank perfectly matches leaderboard page
      try {
        const lbResponse = await fetch('/api/leaderboard');
        if (lbResponse.ok) {
          const lbData = await lbResponse.json();
          // Set to the fetched rank if present, otherwise calculate fallback
          setUserStats((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              rank: lbData?.currentUser?.rank ? lbData.currentUser.rank : calculateRank(globalPoints)
            };
          });
        } else {
          // If backend is down, use mock calculation
          setUserStats(prev => prev ? { ...prev, rank: calculateRank(globalPoints) } : prev);
        }
      } catch (lbError) {
        console.warn("Could not sync leaderboard rank:", lbError);
        setUserStats(prev => prev ? { ...prev, rank: calculateRank(globalPoints) } : prev);
      }

    } catch (error) {
      console.warn('Error fetching user stats, falling back to mock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setSigningOut(true);
      await signOut();
      toast({
        title: "👋 Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "❌ Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
      setSigningOut(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'PLATINUM':
        return 'text-purple-600';
      case 'GOLD':
        return 'text-yellow-600';
      case 'SILVER':
        return 'text-gray-600';
      default:
        return 'text-orange-600';
    }
  };

  const getLevelEmoji = (level: string) => {
    switch (level) {
      case 'PLATINUM':
        return '💎';
      case 'GOLD':
        return '🏆';
      case 'SILVER':
        return '🥈';
      default:
        return '🥉';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Recycle className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10 w-full animate-fade-in">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-800 drop-shadow-sm">👤 Your Profile</h1>
        <p className="text-gray-600 mt-2 text-lg">Manage your account and view your eco-achievements</p>
      </div>

      {/* Profile Header */}
      <Card className="bg-glass border-white/40 shadow-2xl relative overflow-hidden backdrop-blur-md transition-all duration-300">
        {/* Animated Gradient Behind */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 to-blue-600/90 mix-blend-multiply opacity-95 pointer-events-none" />

        <CardContent className="p-6 md:p-8 relative z-10 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-wrap text-center sm:text-left">
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full flex items-center justify-center border-4 border-white/60 shadow-xl overflow-hidden shrink-0 bg-white/20 mx-auto sm:mx-0">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={user?.fullName || "User"} className="h-full w-full object-cover" />
              ) : (
                <div className="text-4xl font-bold">
                  {userData?.name ? getInitials(userData.name) : user?.firstName?.[0] || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-md">
                {userData?.name || user?.fullName || user?.firstName || 'Eco Warrior'}
              </h2>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-white/90 text-sm sm:text-base break-all">
                    {userData?.email || user?.primaryEmailAddress?.emailAddress || 'No email'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span className="text-white/90 font-semibold text-sm sm:text-base">
                    {userData?.role || 'USER'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-white/90 text-sm sm:text-base">
                    Joined {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto flex justify-center sm:justify-end mt-2 sm:mt-0">
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleLogout}
                disabled={signingOut}
              >
                {signingOut ? (
                  <Recycle className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {signingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/60 backdrop-blur-md border border-white/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-2 drop-shadow-sm">🪙</div>
              <p className="text-3xl font-bold text-green-600 drop-shadow-sm">
                {globalPoints.toLocaleString()}
              </p>
              <p className="text-sm text-gray-700 mt-1 font-medium">Total Points</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border border-white/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-2 drop-shadow-sm">📊</div>
              <p className="text-3xl font-bold text-blue-600">
                {userStats?.totalSubmissions || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Submissions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border border-white/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-2 drop-shadow-sm">
                {getLevelEmoji(userData?.level || 'BRONZE')}
              </div>
              <p className={`text-3xl font-bold drop-shadow-sm ${getLevelColor(userData?.level || 'BRONZE')}`}>
                {userData?.level || 'BRONZE'}
              </p>
              <p className="text-sm text-gray-700 mt-1 font-medium">Current Level</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border border-white/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-2 font-bold drop-shadow-sm">#{userStats?.rank ? userStats.rank : '--'}</div>
              <p className="text-3xl font-bold text-purple-600 drop-shadow-sm">Rank</p>
              <p className="text-sm text-gray-700 mt-1 font-medium">Leaderboard</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My EcoTree Feature */}
      <MyEcoTree streak={userStats?.streak || 0} />

      {/* Achievements */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements & Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "First Upload", emoji: "🎯", earned: true },
              { name: "Eco Warrior", emoji: "🌱", earned: true },
              { name: "100 Points", emoji: "💯", earned: true },
              { name: "Weekly Streak", emoji: "🔥", earned: false },
              { name: "Top 10", emoji: "🏆", earned: true },
              { name: "Recycling Pro", emoji: "♻️", earned: false },
            ].map((badge) => (
              <div
                key={badge.name}
                className={`p-4 rounded-xl text-center transition-all duration-300 hover:scale-110 ${badge.earned
                  ? "bg-gradient-to-br from-yellow-100 to-amber-200 border border-yellow-300 shadow-md"
                  : "bg-white/40 border border-white/50 opacity-60"
                  }`}
              >
                <div className="text-4xl mb-2 drop-shadow-sm">{badge.emoji}</div>
                <p className="text-xs font-bold text-gray-900">{badge.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Us */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/50 shadow-sm relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-500" />
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast({ title: "Message Sent", description: "We've received your message and will get back to you soon." }); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Name</label>
                <Input placeholder="Enter your name" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <Input type="email" placeholder="Enter your email" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <Input placeholder="What is this regarding?" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                placeholder="Type your message here..."
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/50 shadow-sm mb-12 relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Most Recycled</p>
                <p className="text-sm text-gray-600">
                  {userStats?.mostRecycledType || 'N/A'} - {userStats?.mostRecycledCount || 0} submissions
                </p>
              </div>
              <div className="text-3xl">♻️</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Current Streak</p>
                <p className="text-sm text-gray-600">
                  {userStats?.streak || 0} days in a row
                </p>
              </div>
              <div className="text-3xl">🔥</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Verification Rate</p>
                <p className="text-sm text-gray-600">
                  {userStats?.verificationRate || 0}% of submissions approved
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg gap-3 sm:gap-0 text-center sm:text-left">
              <div>
                <p className="font-semibold text-gray-900">Submission Status</p>
                <div className="text-sm text-gray-600 flex flex-col sm:flex-row gap-1 sm:gap-2 mt-1 sm:mt-0">
                  <span>✅ {userStats?.verifiedSubmissions || 0} verified</span>
                  <span className="hidden sm:inline">•</span>
                  <span>⏳ {userStats?.pendingSubmissions || 0} pending</span>
                  <span className="hidden sm:inline">•</span>
                  <span>❌ {userStats?.rejectedSubmissions || 0} rejected</span>
                </div>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
