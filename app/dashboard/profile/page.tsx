"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Award, Calendar, Trophy, LogOut, Loader2 } from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

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
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/users/profile/stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
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
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">👤 Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account and view your achievements</p>
      </div>

      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold border-4 border-white/30">
              {userData?.name ? getInitials(userData.name) : user?.firstName?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">
                {userData?.name || user?.fullName || user?.firstName || 'User'}
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-white/90">
                    {userData?.email || user?.primaryEmailAddress?.emailAddress || 'No email'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span className="text-white/90 font-semibold">
                    {userData?.role || 'USER'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-white/90">
                    Joined {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
            <Button 
              variant="destructive" 
              className="gap-2"
              onClick={handleLogout}
              disabled={signingOut}
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {signingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🪙</div>
              <p className="text-3xl font-bold text-green-600">
                {userData?.points?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Points</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-3xl font-bold text-blue-600">
                {userStats?.totalSubmissions || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Submissions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">
                {getLevelEmoji(userData?.level || 'BRONZE')}
              </div>
              <p className={`text-3xl font-bold ${getLevelColor(userData?.level || 'BRONZE')}`}>
                {userData?.level || 'BRONZE'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Current Level</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">#{userStats?.rank || '--'}</div>
              <p className="text-3xl font-bold text-purple-600">Rank</p>
              <p className="text-sm text-gray-600 mt-1">Leaderboard</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
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
                className={`p-4 rounded-lg text-center transition-all ${
                  badge.earned
                    ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300"
                    : "bg-gray-100 opacity-50"
                }`}
              >
                <div className="text-4xl mb-2">{badge.emoji}</div>
                <p className="text-xs font-semibold text-gray-900">{badge.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</label>
              <Input 
                value={userData?.name || user?.fullName || ''} 
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Edit in Clerk Dashboard</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
              <Input 
                value={userData?.email || user?.primaryEmailAddress?.emailAddress || ''} 
                type="email" 
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Edit in Clerk Dashboard</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">User ID</label>
              <Input 
                value={userData?.id || user?.id || ''} 
                disabled
                className="bg-gray-50 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Account Status</label>
              <Input 
                value={userData?.status || 'ACTIVE'} 
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              💡 To update your name or email, visit your Clerk account settings
            </p>
            <Button 
              variant="outline"
              onClick={() => window.open('https://accounts.clerk.dev', '_blank')}
            >
              Open Clerk Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card>
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
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Submission Status</p>
                <p className="text-sm text-gray-600">
                  ✅ {userStats?.verifiedSubmissions || 0} verified • 
                  ⏳ {userStats?.pendingSubmissions || 0} pending • 
                  ❌ {userStats?.rejectedSubmissions || 0} rejected
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
