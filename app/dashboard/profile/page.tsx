"use client";
import Image from "next/image";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Award, Calendar, Trophy, LogOut, Recycle, Trash2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { usePoints } from "../context/PointsContext";
import { MyEcoTree } from "@/components/MyEcoTree";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Eye, MapPin } from "lucide-react";

interface Submission {
  id: string;
  wasteType: string;
  status: string;
  imageUrl: string;
  pointsAwarded: number;
  createdAt: string;
  location: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  level: string;
  points: number;
  status: string;
  location?: string;
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
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { points: globalPoints } = usePoints();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Profile update and password update states
  const [profileName, setProfileName] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Contact Us form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserStats();
      fetchRecentSubmissions();
    }
  }, [user]);

  useEffect(() => {
    if (!userStats) return;
    const badges = [
      { id: "first_upload", name: "First Upload", emoji: "🎯", earned: (userStats?.totalSubmissions || 0) >= 1 },
      { id: "eco_warrior", name: "Eco Warrior", emoji: "🌱", earned: globalPoints >= 500 },
      { id: "100_points", name: "100 Points", emoji: "💯", earned: globalPoints >= 100 },
      { id: "weekly_streak", name: "Weekly Streak", emoji: "🔥", earned: (userStats?.streak || 0) >= 7 },
      { id: "top_10", name: "Top 10", emoji: "🏆", earned: !!(userStats?.rank && userStats.rank <= 10 && userStats.rank > 0) },
      { id: "recycling_pro", name: "Recycling Pro", emoji: "♻️", earned: (userStats?.verifiedSubmissions || 0) >= 10 },
    ];
    const currentEarnedIds = badges.filter(b => b.earned).map(b => b.id);
    const storedEarned = localStorage.getItem('earned_badges');
    const previousEarned = storedEarned ? JSON.parse(storedEarned) : null;

    if (previousEarned !== null) {
      const newlyEarned = currentEarnedIds.filter(id => !previousEarned.includes(id));
      if (newlyEarned.length > 0) {
        newlyEarned.forEach(id => {
          const badge = badges.find(b => b.id === id);
          toast({
            title: `Badge Unlocked! ${badge?.emoji}`,
            description: `Congratulations! You've earned the "${badge?.name}" badge.`,
          });
        });
        localStorage.setItem('earned_badges', JSON.stringify([...previousEarned, ...newlyEarned]));
      }
    } else if (currentEarnedIds.length > 0) {
      localStorage.setItem('earned_badges', JSON.stringify(currentEarnedIds));
    }
  }, [userStats, globalPoints, toast]);

  const fetchUserData = async () => {
    try {
      const response = await fetchWithAuth('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        console.warn('Backend API unavailable. Mocking user data.');
        setUserData({
          id: user?.uid || "mock-id",
          name: user?.displayName || "Eco Warrior",
          email: user?.email || "",
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

  const fetchRecentSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      const response = await fetchWithAuth('/api/submissions?limit=5');
      if (response.ok) {
        const data = await response.json();
        setRecentSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetchWithAuth('/api/users/profile/stats');
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
        const lbResponse = await fetchWithAuth('/api/leaderboard');
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
      await firebaseSignOut(auth);
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

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      const res = await fetchWithAuth("/api/users/delete", {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete account");
      }

      await firebaseSignOut(auth);

      toast({
        title: "🗑️ Account Deleted",
        description: "Your account and data have been successfully deleted.",
      });
      router.push("/");
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      toast({
        title: "❌ Deletion Failed",
        description: err.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      setDeletingAccount(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!profileName.trim()) {
      toast({
        title: "❌ Name Required",
        description: "Please enter a valid display name.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingProfile(true);
    try {
      const { updateProfile: firebaseUpdateProfile } = await import("firebase/auth");
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase-client");
      const { notify } = await import("@/lib/notifications/notify");

      // 1. Update Firebase Auth Profile
      await firebaseUpdateProfile(user, {
        displayName: profileName.trim(),
      });

      // 2. Update Firestore User Document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: profileName.trim(),
        location: profileLocation.trim() || "Not specified",
        updatedAt: new Date(),
      });

      // 3. Dispatch Coordinated Profile Updated alert
      await notify({
        userId: user.uid,
        email: user.email || "",
        type: "profile_updated",
        title: "Profile Updated 👤",
        message: "Your profile information has been successfully updated.",
      });

      toast({
        title: "✅ Profile Updated",
        description: "Your profile details have been saved successfully.",
      });

      fetchUserData();
      setShowEditProfileModal(false);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast({
        title: "❌ Profile Update Failed",
        description: err.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      toast({
        title: "❌ Passwords Match Error",
        description: "New password and confirmation password do not match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "❌ Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { updatePassword: firebaseUpdatePassword } = await import("firebase/auth");
      const { notify } = await import("@/lib/notifications/notify");

      // 1. Update Firebase Auth Password
      await firebaseUpdatePassword(user, newPassword);

      // 2. Dispatch Coordinated Password Changed alert
      await notify({
        userId: user.uid,
        email: user.email || "",
        type: "password_changed",
        title: "Password Changed Successfully 🔒",
        message: "Your account password has been successfully updated.",
      });

      toast({
        title: "✅ Password Updated",
        description: "Your password has been changed successfully.",
      });

      setNewPassword("");
      setConfirmPassword("");
      setShowChangePasswordModal(false);
    } catch (err: any) {
      console.error("Failed to update password:", err);
      if (err.code === "auth/requires-recent-login") {
        toast({
          title: "🔑 Reauthentication Needed",
          description: "For security reasons, please log out and log back in before changing your password.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Password Update Failed",
          description: err.message || "Failed to update password. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setChangingPassword(false);
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
      <title>Your Profile | Trash2Treasure</title>
      <meta name="description" content="Manage your account profile and eco-achievements." />
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
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full flex items-center justify-center border-4 border-white/60 shadow-xl overflow-hidden shrink-0 bg-white/20 mx-auto sm:mx-0 relative">
              {user?.photoURL ? (
                <Image src={user.photoURL} alt={user?.displayName || "User"} fill className="object-cover" unoptimized />
              ) : (
                <div className="text-4xl font-bold">
                  {userData?.name ? getInitials(userData.name) : user?.displayName?.[0] || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-md">
                {userData?.name || user?.displayName || 'Eco Warrior'}
              </h2>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-white/90 text-sm sm:text-base break-all">
                    {userData?.email || user?.email || 'No email'}
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
                  <span className="text-white/90 text-sm sm:text-base" suppressHydrationWarning={true}>
                    Joined {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto flex flex-wrap justify-center sm:justify-end gap-3 mt-4 sm:mt-0 shrink-0">
              {/* Edit Profile Dialog */}
              <Dialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/30 text-white gap-2 rounded-xl transition-all"
                    onClick={() => {
                      setProfileName(userData?.name || user?.displayName || "");
                      setProfileLocation(userData?.location || "Not specified");
                    }}
                  >
                    ✏️ Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur-xl border-white/50 rounded-[2rem] max-w-md p-6 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      👤 Edit Profile Details
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateProfile} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Full Name</label>
                      <Input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Eco Warrior"
                        required
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Location</label>
                      <Input
                        value={profileLocation}
                        onChange={(e) => setProfileLocation(e.target.value)}
                        placeholder="e.g. Bangalore, India"
                        required
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowEditProfileModal(false)}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-md"
                        disabled={updatingProfile}
                      >
                        {updatingProfile ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Change Password Dialog */}
              <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/30 text-white gap-2 rounded-xl transition-all"
                  >
                    🔒 Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur-xl border-white/50 rounded-[2rem] max-w-md p-6 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      🔒 Update Password
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowChangePasswordModal(false)}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-md"
                        disabled={changingPassword}
                      >
                        {changingPassword ? "Updating..." : "Change Password"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={showDeleteAccountModal} onOpenChange={setShowDeleteAccountModal}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/30 dark:text-rose-455 dark:hover:bg-rose-950/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-3xl bg-glass border border-white/50 dark:border-slate-800/50 backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-rose-600 dark:text-rose-450 flex items-center gap-2">
                      ⚠️ Delete Your Account?
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-gray-700 dark:text-slate-350 leading-relaxed">
                      This action is <strong className="text-rose-600 dark:text-rose-450">permanent and cannot be undone</strong>. 
                      All your recycling submissions, points history, claimed rewards, and notifications will be deleted forever.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Are you absolutely sure you want to proceed?
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteAccountModal(false)}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-md gap-2"
                      disabled={deletingAccount}
                    >
                      {deletingAccount ? (
                        <>
                          <Recycle className="h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Confirm Delete
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="destructive"
                className="gap-2 rounded-xl"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              { id: "first_upload", name: "First Upload", emoji: "🎯", earned: (userStats?.totalSubmissions || 0) >= 1 },
              { id: "eco_warrior", name: "Eco Warrior", emoji: "🌱", earned: globalPoints >= 500 },
              { id: "100_points", name: "100 Points", emoji: "💯", earned: globalPoints >= 100 },
              { id: "weekly_streak", name: "Weekly Streak", emoji: "🔥", earned: (userStats?.streak || 0) >= 7 },
              { id: "top_10", name: "Top 10", emoji: "🏆", earned: !!(userStats?.rank && userStats.rank <= 10 && userStats.rank > 0) },
              { id: "recycling_pro", name: "Recycling Pro", emoji: "♻️", earned: (userStats?.verifiedSubmissions || 0) >= 10 },
            ].map((badge) => (
              <div
                key={badge.name}
                className={`p-4 rounded-xl text-center transition-all duration-300 ${badge.earned
                  ? "bg-gradient-to-br from-yellow-100 to-amber-200 border border-yellow-300 shadow-md hover:scale-110"
                  : "bg-gray-100 border border-gray-200 opacity-60 grayscale hover:grayscale-0"
                  }`}
              >
                <div className="text-4xl mb-2 drop-shadow-sm">{badge.emoji}</div>
                <p className="text-xs font-bold text-gray-900">{badge.name}</p>
                {!badge.earned && (
                  <div className="mt-2 text-[10px] text-gray-500 font-medium tracking-tighter">🔒 LOCKED</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-600" />
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Recycle className="h-5 w-5" />
            Recent Submissions
          </CardTitle>
          <Link href="/dashboard/wallet">
            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
              View All History
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {submissionsLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Recycle className="h-8 w-8 animate-spin text-green-600 mb-2" />
              <p className="text-gray-500 text-sm">Loading your activity...</p>
            </div>
          ) : recentSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">♻️</div>
              <p className="text-gray-900 font-semibold text-lg">No submissions yet</p>
              <p className="text-gray-500 max-w-xs mx-auto mt-2">Start your eco-journey by uploading your first recycling proof!</p>
              <Link href="/dashboard/scan">
                <Button className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full px-8">
                  Get Started
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSubmissions.map((sub) => (
                <div 
                  key={sub.id} 
                  onClick={() => setSelectedSubmission(sub)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-white shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 relative">
                    <Image 
                      src={sub.imageUrl} 
                      alt={sub.wasteType} 
                      fill
                      className="object-cover transition-transform group-hover:scale-110 duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="text-white h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-900 truncate pr-2">
                        {sub.wasteType}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                        sub.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-gray-500 flex items-center gap-1" suppressHydrationWarning={true}>
                        <Calendar className="h-3 w-3" />
                        {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-2">
                        {sub.status === 'VERIFIED' && (
                          <p className="text-xs font-bold text-green-600 mr-2">
                            +{sub.pointsAwarded} pts
                          </p>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 px-3 text-[10px] border-green-200 text-green-700 hover:bg-green-50 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(sub);
                          }}
                        >
                          View Photo
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Photo Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-white/50 p-0 overflow-hidden rounded-[2rem] shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Submission Photo Preview</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="flex flex-col">
              <div className="relative aspect-video w-full bg-gray-100">
                <Image 
                  src={selectedSubmission.imageUrl} 
                  alt={selectedSubmission.wasteType}
                  fill
                  className="object-contain"
                  unoptimized
                />
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                  selectedSubmission.status === 'VERIFIED' ? 'bg-green-500 text-white' :
                  selectedSubmission.status === 'REJECTED' ? 'bg-red-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {selectedSubmission.status}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedSubmission.wasteType}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1" suppressHydrationWarning={true}>
                        <Calendar className="h-4 w-4" />
                        {new Date(selectedSubmission.createdAt).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedSubmission.location}
                      </span>
                    </div>
                  </div>
                  {selectedSubmission.status === 'VERIFIED' && (
                    <div className="bg-green-50 px-4 py-2 rounded-2xl border border-green-100 text-center">
                      <span className="block text-[10px] text-green-600 font-bold uppercase tracking-wider">Points Awarded</span>
                      <span className="text-2xl font-black text-green-700">+{selectedSubmission.pointsAwarded}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <Button 
                    onClick={() => setSelectedSubmission(null)}
                    className="bg-gray-900 hover:bg-black text-white rounded-xl px-8"
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Us */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/50 shadow-sm relative overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Contact Us
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">Send us a message and we&apos;ll get back to you via email.</p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setSendingContact(true);
              try {
                const res = await fetch("/api/contact", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: contactName,
                    email: contactEmail,
                    subject: contactSubject,
                    message: contactMessage,
                  }),
                });
                if (!res.ok) {
                  const errData = await res.json();
                  throw new Error(errData.error || "Failed to send message.");
                }
                toast({
                  title: "✅ Message Sent!",
                  description: "We've received your message and will reply to your email shortly.",
                });
                setContactName("");
                setContactEmail("");
                setContactSubject("");
                setContactMessage("");
              } catch (err: any) {
                toast({
                  title: "❌ Failed to Send",
                  description: err.message || "Something went wrong. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setSendingContact(false);
              }
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Name</label>
                <Input
                  placeholder="Enter your name"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  disabled={sendingContact}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={sendingContact}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <Input
                placeholder="What is this regarding?"
                required
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                disabled={sendingContact}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all"
                placeholder="Type your message here..."
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                disabled={sendingContact}
              />
            </div>
            <Button
              type="submit"
              disabled={sendingContact}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            >
              {sendingContact ? (
                <>
                  <Recycle className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
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
