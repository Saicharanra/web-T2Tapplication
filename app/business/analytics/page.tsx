"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye, ShoppingBag, UserPlus, Users, MapPin, TrendingUp,
  RefreshCw, AlertCircle, Sparkles, ShieldCheck, PieChart,
  BarChart2, ArrowUpRight, Award, Zap
} from "lucide-react";
import CountUp from "react-countup";

interface LocationStat {
  location: string;
  redemptions: number;
  uniqueCustomers: number;
  percentage: number;
}

interface CouponEngagement {
  reward_id: number;
  title: string;
  category: string;
  views: number;
  redemptions: number;
  conversionRate: number;
}

interface RecentRedemption {
  redemption_id: number;
  couponTitle: string;
  customerName: string;
  customerEmail: string;
  location: string;
  code: string;
  redeemed_at: string;
}

interface AnalyticsData {
  totalViews: number;
  totalRedemptions: number;
  totalUniqueCustomers: number;
  newCustomersAcquired: number;
  returningCustomers: number;
  conversionRate: number;
  repeatCustomerRate: number;
  avgRedemptionsPerCustomer: number;
  locations: LocationStat[];
  couponEngagement: CouponEngagement[];
  recentRedemptions: RecentRedemption[];
}

export default function CustomerAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchWithAuth("/api/business/analytics");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load customer analytics");
      }
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
          <RefreshCw className="h-10 w-10 animate-spin text-emerald-600 mb-3 relative z-10" />
        </div>
        <span className="text-gray-600 font-semibold mt-2">Aggregating Customer Insights...</span>
        <p className="text-gray-400 text-xs mt-1">Analyzing views, conversions, and locations</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50/80 border border-rose-200 rounded-3xl p-10 text-center max-w-xl mx-auto my-12 shadow-sm">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-rose-800 mb-2">Analytics Unavailable</h3>
        <p className="text-rose-600 text-sm mb-6">{error || "Failed to load customer data."}</p>
        <Button onClick={() => { setLoading(true); fetchAnalytics(); }} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold px-6">
          Retry Loading
        </Button>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Coupon Views",
      value: data.totalViews,
      subtitle: "Impressions across partner store",
      icon: Eye,
      gradient: "from-cyan-500 to-blue-600",
      lightBg: "bg-cyan-50 text-cyan-600"
    },
    {
      title: "Total Redemptions",
      value: data.totalRedemptions,
      subtitle: `${data.conversionRate}% Conversion Rate`,
      icon: ShoppingBag,
      gradient: "from-purple-500 to-indigo-600",
      lightBg: "bg-purple-50 text-purple-600"
    },
    {
      title: "New Customers Acquired",
      value: data.newCustomersAcquired,
      subtitle: "First-time coupon redeemers",
      icon: UserPlus,
      gradient: "from-emerald-500 to-teal-600",
      lightBg: "bg-emerald-50 text-emerald-600"
    },
    {
      title: "Returning Customers",
      value: data.returningCustomers,
      subtitle: `${data.repeatCustomerRate}% Repeat Rate`,
      icon: Users,
      gradient: "from-amber-500 to-orange-600",
      lightBg: "bg-amber-50 text-amber-600"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <title>Customer Analytics | Partner Portal</title>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Customer Analytics Dashboard
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Customer Insights
            </span>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Understand customer behavior, track repeat redemptions, and view top active geographic locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 font-semibold rounded-xl bg-white shadow-sm transition-all"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* 4 Core Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.lightBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 tracking-tight">
                  <CountUp end={card.value} duration={1.5} />
                </span>
              </div>

              <p className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Customer Insights Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Conversion & Retention Ratios */}
        <Card className="lg:col-span-1 bg-white/90 backdrop-blur-md border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-600" />
              Customer Retention Rate
            </CardTitle>
            <CardDescription className="text-xs">
              Ratio of repeat buyers versus first-time users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Repeat Customer Share</span>
                <span className="text-sm font-bold text-emerald-600">{data.repeatCustomerRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(data.repeatCustomerRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/50">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Avg Redemptions</span>
                <p className="text-xl font-extrabold text-emerald-900 mt-1">
                  {data.avgRedemptionsPerCustomer} <span className="text-xs font-normal text-emerald-700">/ user</span>
                </p>
              </div>

              <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100/50">
                <span className="text-[11px] font-bold text-purple-800 uppercase">Conversion Rate</span>
                <p className="text-xl font-extrabold text-purple-900 mt-1">
                  {data.conversionRate}% <span className="text-xs font-normal text-purple-700">views</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-gray-800">
                <Zap className="h-4 w-4 text-amber-500" /> Insight Recommendation
              </div>
              <p className="leading-relaxed">
                {data.repeatCustomerRate > 30
                  ? "High customer loyalty! Consider launching exclusive VIP tiers to boost retention further."
                  : "Boost repeat visits by offering higher discount percentages on second redemptions."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Most Active Locations */}
        <Card className="lg:col-span-2 bg-white/90 backdrop-blur-md border-gray-100 shadow-sm rounded-2xl flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Most Active Customer Locations
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Top geographic areas where your customers redeem coupons
                </CardDescription>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold">
                Geographic Reach
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {data.locations.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <MapPin className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium">No location data collected yet</p>
                <p className="text-xs text-gray-400">Location insights update automatically when customers redeem rewards.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.locations.map((loc, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm font-semibold text-gray-800">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {loc.location}
                      </span>
                      <span className="text-xs text-gray-500 font-normal">
                        <strong className="text-gray-900 font-bold">{loc.redemptions}</strong> redemptions ({loc.percentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(loc.percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Engagement & Coupon Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coupon Level Engagement Table */}
        <Card className="lg:col-span-2 bg-white/90 backdrop-blur-md border-gray-100 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-emerald-600" />
              Coupon Engagement & Conversion Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Performance metrics for each active or past coupon offer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.couponEngagement.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No coupon engagement recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase">
                      <th className="pb-3 pl-1">Coupon Title</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3 text-center">Views</th>
                      <th className="pb-3 text-center">Claims</th>
                      <th className="pb-3 text-right pr-1">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.couponEngagement.map((coupon) => (
                      <tr key={coupon.reward_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 pl-1 font-semibold text-gray-900 truncate max-w-[200px]">
                          {coupon.title}
                        </td>
                        <td className="py-3">
                          <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-md">
                            {coupon.category}
                          </span>
                        </td>
                        <td className="py-3 text-center font-medium text-gray-600">
                          {coupon.views}
                        </td>
                        <td className="py-3 text-center font-bold text-emerald-700">
                          {coupon.redemptions}
                        </td>
                        <td className="py-3 text-right pr-1 font-mono font-bold text-purple-700">
                          {coupon.conversionRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Engagement Feed */}
        <Card className="lg:col-span-1 bg-white/90 backdrop-blur-md border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Recent Redemptions Log
            </CardTitle>
            <CardDescription className="text-xs">
              Live customer activity feed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {data.recentRedemptions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No recent customer activity.</p>
            ) : (
              data.recentRedemptions.map((item) => (
                <div key={item.redemption_id} className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-gray-900">{item.customerName}</span>
                    <span className="font-mono text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700">
                      {item.code}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 font-medium truncate">{item.couponTitle}</p>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" /> {item.location}
                    </span>
                    <span>{new Date(item.redeemed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
