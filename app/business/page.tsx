"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Gift, Star, Eye, ShoppingBag, Clock, Users, ArrowUpRight,
  TrendingUp, RefreshCw, AlertCircle, Sparkles, CheckCircle2, Shield
} from "lucide-react";
import CountUp from "react-countup";

interface Redemption {
  redemption_id: number;
  reward_id: number;
  redeemed_at: string;
  status: string;
  code: string;
  user: {
    name: string;
    email: string;
  };
}

interface Reward {
  reward_id: number;
  title: string;
  description: string;
  points_required: number;
  status: string;
  category: string;
  stock: number;
  max_redemptions: number;
  remaining_redemptions: number;
  views: number;
  redemptionsCount: number;
  company_name: string;
  logo_url: string;
  banner_url: string;
}

interface Stats {
  totalCoupons: number;
  activeCoupons: number;
  redeemedCoupons: number;
  remainingCoupons: number;
  couponViews: number;
}

export default function BusinessDashboard() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCoupons: 0,
    activeCoupons: 0,
    redeemedCoupons: 0,
    remainingCoupons: 0,
    couponViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchWithAuth("/api/business/rewards");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch dashboard data");
      }
      const data = await res.json();
      setRewards(data.rewards || []);
      setRedemptions(data.redemptions || []);
      setStats(data.stats || {
        totalCoupons: 0,
        activeCoupons: 0,
        redeemedCoupons: 0,
        remainingCoupons: 0,
        couponViews: 0,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
        <span className="text-gray-500 font-medium">Loading analytics dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-xl mx-auto my-12">
        <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-rose-700 mb-2">Error Loading Dashboard</h3>
        <p className="text-rose-600 mb-4">{error}</p>
        <Button onClick={() => { setLoading(true); fetchDashboardData(); }} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
          Try Again
        </Button>
      </div>
    );
  }

  const statCards = [
    { title: "Total Coupons", value: stats.totalCoupons, icon: Gift, color: "from-blue-500 to-indigo-600" },
    { title: "Active Coupons", value: stats.activeCoupons, icon: Star, color: "from-emerald-500 to-teal-600" },
    { title: "Total Claims", value: stats.redeemedCoupons, icon: ShoppingBag, color: "from-purple-500 to-violet-600" },
    { title: "Remaining Stock", value: stats.remainingCoupons, icon: Clock, color: "from-amber-500 to-orange-600" },
    { title: "Coupon Views", value: stats.couponViews, icon: Eye, color: "from-cyan-500 to-sky-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <title>Business Analytics | Partner Dashboard</title>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Welcome back, Partner! <Sparkles className="h-6 w-6 text-emerald-500" />
          </h1>
          <p className="text-gray-500 mt-1">Track coupon conversions, view customer redemptions, and monitor campaign performance.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 font-semibold rounded-xl bg-white shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100/80 relative overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-lg cursor-default">
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${stat.color}`}></div>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.title}</h3>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${stat.color} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
                <CountUp end={stat.value} duration={1.5} />
              </p>
            </div>
          );
        })}
      </div>

      {/* Analytics Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Campaign Summary */}
        <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rewards.length === 0 ? (
              <p className="text-sm text-gray-500">No active campaigns. Create a coupon to start earning views.</p>
            ) : (
              rewards.slice(0, 3).map((reward) => {
                const claimRate = reward.max_redemptions > 0 
                  ? ((reward.redemptionsCount / reward.max_redemptions) * 100).toFixed(0) 
                  : "0";
                
                return (
                  <div key={reward.reward_id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-800 truncate max-w-[150px]">{reward.title}</span>
                      <span className="text-gray-500">{claimRate}% Claimed</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${claimRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>{reward.views} Views</span>
                      <span>{reward.remaining_redemptions} left</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Redemption History Log */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Recent Claims
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-medium">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              Privacy Enforced
            </div>
          </CardHeader>
          <CardContent>
            {redemptions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Gift className="h-12 w-12 mx-auto text-gray-200 mb-2" />
                <p className="font-medium text-sm">No coupons claimed yet</p>
                <p className="text-xs">Once users redeem your rewards, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {redemptions.slice(0, 5).map((redemption) => {
                  const reward = rewards.find(r => r.reward_id === redemption.reward_id);
                  return (
                    <div key={redemption.redemption_id} className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-colors gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{reward?.title || "Unknown Coupon"}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="font-medium">{redemption.user.name}</span>
                          <span>•</span>
                          <span>{redemption.user.email}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-sm bg-white border border-gray-200 px-2 py-1 rounded shadow-sm text-gray-700">
                          {redemption.code}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(redemption.redeemed_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
