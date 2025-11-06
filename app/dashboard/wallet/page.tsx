"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, TrendingUp, Download, Gift, ArrowUpRight, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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
        throw new Error('Failed to fetch wallet data');
      }

      const data = await response.json();
      console.log('✅ Wallet data received:', data);

      setWalletData(data);

    } catch (error) {
      console.error('❌ Error fetching wallet data:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
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
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading wallet...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Digital Wallet</h1>
            <p className="text-gray-600 mt-1">Manage your points and redeem rewards</p>
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
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 mb-2">Total Balance</p>
              <div className="flex items-center gap-3">
                <span className="text-5xl">🪙</span>
                <span className="text-5xl font-bold">
                  {walletData.totalPoints.toLocaleString()}
                </span>
              </div>
              <p className="text-white/80 mt-2">Points</p>
            </div>
            <div className="space-y-3">
              <Button variant="secondary" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Statement
              </Button>
              <Button variant="secondary" className="w-full">
                <Gift className="h-4 w-4 mr-2" />
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

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Available Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rewards.map((reward) => (
              <div
                key={reward.name}
                className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-3">{reward.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{reward.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-green-600">{reward.points} pts</span>
                  <Button size="sm" variant="outline">
                    Redeem
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                      <span className="text-xl">{getTransactionIcon(transaction.type)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
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
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.type === 'REDEEMED' ? 'text-red-600' : 'text-green-600'
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
