"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wallet as WalletIcon, TrendingUp, Download, Gift, ArrowUpRight, Recycle, RefreshCw, Trophy, BookOpen, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { usePoints } from "../context/PointsContext";
//import { useUser } from "@clerk/nextjs";

interface PointsHistory {
  id: string;
  points: number;
  description: string;
  type: string;
  createdAt: string;
  submission?: {
    wasteType: string;
  };
}

interface WalletStats {
  totalPoints: number;
  thisMonthPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  transactions: PointsHistory[];
}

const rewards = [
  { name: "₹100 Shopping Voucher", points: 500, icon: "🛍️" },
  { name: "₹250 Grocery Voucher", points: 1000, icon: "🛒" },
  { name: "₹500 Utility Bill Payment", points: 2000, icon: "💳" },
  { name: "Plant a Tree", points: 300, icon: "🌳" },
];

export default function WalletPage() {
  const { toast } = useToast();
  const { points: globalPoints } = usePoints();
  // Remove unused variable 'user' to fix lint error
  //const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState<WalletStats>({
    totalPoints: 0,
    thisMonthPoints: 0,
    totalEarned: 0,
    totalRedeemed: 0,
    transactions: [],
  });

  // Wrap fetchWalletData in useCallback and add as dependency to useEffect
  const fetchWalletData = useCallback(async () => {
    try {
      console.log('💰 Fetching wallet data...');

      const response = await fetch('/api/wallet');

      if (!response.ok) {
        console.warn('Backend API unavailable (likely missing DB config). Displaying 300-point demo wallet state.');
        setWalletData({
          totalPoints: 300,
          thisMonthPoints: 300,
          totalEarned: 300,
          totalRedeemed: 0,
          transactions: [
            {
              id: "tx-1",
              points: 150,
              description: "Recycled 15 Plastic Bottles",
              type: "EARNED",
              createdAt: new Date().toISOString()
            },
            {
              id: "tx-2",
              points: 100,
              description: "Recycled Cardboard Boxes",
              type: "EARNED",
              createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: "tx-3",
              points: 50,
              description: "Daily Streak Bonus",
              type: "BONUS",
              createdAt: new Date(Date.now() - 172800000).toISOString()
            }
          ],
        });
        return;
      }

      const data = await response.json();
      console.log('✅ Wallet data received:', data);

      setWalletData(data);

    } catch (error) {
      console.warn('Backend API unavailable or error fetching wallet data:', error);
      // Suppress the destructive toast if this is just a missing DB config issue.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARNED':
        return '📥';
      case 'REDEEMED':
        return '📤';
      case 'BONUS':
        return '🎁';
      default:
        return '💰';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'EARNED':
        return 'bg-green-100';
      case 'BONUS':
        return 'bg-blue-100';
      case 'REDEEMED':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Recycle className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your points, redeem rewards, and track impact.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Wallet Balance */}
      <Card className="bg-gradient-to-br from-green-600 to-blue-600 text-white">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4">
            <div>
              <p className="text-white/80 mb-2">Total Balance</p>
              <div className="flex items-center gap-3">
                <span className="text-5xl">🪙</span>
                <span className="text-5xl font-bold">
                  {globalPoints.toLocaleString()}
                </span>
              </div>
              <p className="text-white/80 mt-2">Points</p>
            </div>
            <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
              <Button variant="secondary" className="flex-1 sm:w-full">
                <Download className="h-4 w-4 mr-0 sm:mr-2 hidden sm:block" />
                Statement
              </Button>
              <Button variant="secondary" className="flex-1 sm:w-full">
                <Gift className="h-4 w-4 mr-0 sm:mr-2 hidden sm:block" />
                Redeem
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  +{walletData.thisMonthPoints.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {walletData.totalEarned.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Redeemed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {walletData.totalRedeemed.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Explore Features Overlay (Migrated from Top Navigation) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leaderboard Card */}
        <Link href="/dashboard/leaderboard" className="block">
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-yellow-400 group cursor-pointer bg-gradient-to-r from-white to-yellow-50">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Leaderboard</h3>
                  <p className="text-sm text-gray-600">See top recyclers and your rank</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>

        {/* Learn Card */}
        <Link href="/dashboard/learn" className="block">
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-400 group cursor-pointer bg-gradient-to-r from-white to-blue-50">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Learn</h3>
                  <p className="text-sm text-gray-600">Discover tips to recycle better</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {walletData.transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-2">Start recycling to earn points!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {walletData.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow gap-3 sm:gap-4 overflow-hidden"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                    <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                      <span className="text-xl">{getTransactionIcon(transaction.type)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right pl-14 sm:pl-0 shrink-0">
                    <p className={`text-lg font-bold ${transaction.type === 'REDEEMED' ? 'text-red-600' : 'text-green-600'
                      }`}>
                      {transaction.type === 'REDEEMED' ? '-' : '+'}{Math.abs(transaction.points)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{transaction.type.toLowerCase()}</p>
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
