"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, MapPin, Recycle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface RegionStat {
  region: string;
  submissions: number;
  points: number;
  users: number;
  color: string;
}

interface ProgressStat {
  period: string;
  submissions: number;
  verified: number;
  rejected: number;
  points: number;
}

interface ProgressData {
  weekly: ProgressStat[];
  monthly: ProgressStat[];
  yearly: ProgressStat[];
}

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  const [regionalStats, setRegionalStats] = useState<RegionStat[]>([]);
  const [progressData, setProgressData] = useState<ProgressData>({
    weekly: [], monthly: [], yearly: []
  });
  const { toast } = useToast();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reports');
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await response.json();

      let rStats = data.regionalStats || [];
      let pData = data.progressData || { weekly: [], monthly: [], yearly: [] };

<<<<<<< HEAD
      setRegionalStats(rStats);
      setProgressData({
        weekly: pData.weekly || [],
        monthly: pData.monthly || [],
        yearly: pData.yearly || [],
      });
=======
      // Showcase data if empty
      if (rStats.length === 0) {
        rStats = [
          { region: "Hyderabad", submissions: 1247, points: 48920, users: 543, color: "from-blue-500 to-blue-600" },
          { region: "Warangal", submissions: 892, points: 34560, users: 387, color: "from-green-500 to-green-600" },
          { region: "Nizamabad", submissions: 645, points: 25880, users: 241, color: "from-purple-500 to-purple-600" },
          { region: "Others", submissions: 423, points: 16740, users: 163, color: "from-orange-500 to-orange-600" },
        ];
      }

      if (pData.weekly.length === 0) {
        pData = {
          weekly: [
            { period: 'Week 1', submissions: 45, verified: 38, rejected: 7, points: 950 },
            { period: 'Week 2', submissions: 52, verified: 44, rejected: 8, points: 1100 },
            { period: 'Week 3', submissions: 48, verified: 41, rejected: 7, points: 1025 },
            { period: 'Week 4', submissions: 58, verified: 49, rejected: 9, points: 1225 }
          ],
          monthly: [
            { period: 'Jan', submissions: 203, verified: 172, rejected: 31, points: 4300 },
            { period: 'Feb', submissions: 189, verified: 161, rejected: 28, points: 4025 },
            { period: 'Mar', submissions: 234, verified: 198, rejected: 36, points: 4950 },
            { period: 'Apr', submissions: 267, verified: 225, rejected: 42, points: 5625 },
            { period: 'May', submissions: 245, verified: 208, rejected: 37, points: 5200 },
            { period: 'Jun', submissions: 289, verified: 244, rejected: 45, points: 6100 }
          ],
          yearly: [
            { period: '2022', submissions: 1850, verified: 1572, rejected: 278, points: 39300 },
            { period: '2023', submissions: 2340, verified: 1989, rejected: 351, points: 49725 },
            { period: '2024', submissions: 2890, verified: 2456, rejected: 434, points: 61400 }
          ]
        };
      }

      setRegionalStats(rStats);
      setProgressData(pData);
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
    } catch (error) {
      console.error(error);
      toast({
        title: "❌ Error",
        description: "Failed to load report analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Recycle className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading reports statistics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Progress Reports</h1>
        <p className="text-gray-600 mt-1">Analyze system performance and regional statistics</p>
      </div>

      {/* Dynamic Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <CardTitle className="flex items-center gap-2">
            Submission Trends
          </CardTitle>
          <div className="flex gap-2">
            <Button variant={timeRange === "weekly" ? "default" : "outline"} className={timeRange === "weekly" ? "bg-green-600" : ""} size="sm" onClick={() => setTimeRange("weekly")}>Weekly</Button>
            <Button variant={timeRange === "monthly" ? "default" : "outline"} className={timeRange === "monthly" ? "bg-green-600" : ""} size="sm" onClick={() => setTimeRange("monthly")}>Monthly</Button>
            <Button variant={timeRange === "yearly" ? "default" : "outline"} className={timeRange === "yearly" ? "bg-green-600" : ""} size="sm" onClick={() => setTimeRange("yearly")}>Yearly</Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[300px] relative w-full flex flex-col">
            <div className="flex-1 flex items-end gap-4 pb-4">
<<<<<<< HEAD
              {progressData[timeRange]?.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 font-medium pb-8">
                  No submission data available for this range.
                </div>
              ) : progressData[timeRange]?.map((item, idx) => {
=======
              {progressData[timeRange].map((item, idx) => {
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
                const maxValue = Math.max(...progressData[timeRange].map(d => d.submissions));
                const subHeight = (item.submissions / maxValue) * 100;
                const verHeight = (item.verified / maxValue) * 100;
                const rejHeight = (item.rejected / maxValue) * 100;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full h-[200px] flex gap-0.5 sm:gap-1 items-end justify-center group cursor-pointer">
                      <div className="flex-1 rounded-t-md bg-gradient-to-b from-blue-500 to-blue-700 hover:opacity-80 hover:scale-y-105 origin-bottom transition-all" style={{ height: `${subHeight || 5}%` }} title={`Total: ${item.submissions}`}></div>
                      <div className="flex-1 rounded-t-md bg-gradient-to-b from-green-500 to-green-700 hover:opacity-80 hover:scale-y-105 origin-bottom transition-all" style={{ height: `${verHeight || 2}%` }} title={`Verified: ${item.verified}`}></div>
                      <div className="flex-1 rounded-t-md bg-gradient-to-b from-red-500 to-red-700 hover:opacity-80 hover:scale-y-105 origin-bottom transition-all" style={{ height: `${rejHeight || 1}%` }} title={`Rejected: ${item.rejected}`}></div>
                    </div>
                    <div className="text-[10px] sm:text-xs font-medium text-gray-500 text-center">{item.period}</div>
                  </div>
                )
              })}
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-8 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-blue-500 to-blue-700"></div> Total Submissions
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-green-500 to-green-700"></div> Verified
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-red-500 to-red-700"></div> Rejected
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Statistics */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Regional Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
<<<<<<< HEAD
          {regionalStats.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
              No regional performance data available.
            </div>
          ) : regionalStats.map((region) => {
=======
          {regionalStats.map((region) => {
>>>>>>> 351c1400f92eab3797030734c46d278ef1941b46
            // For calculating average points safely without dividing by zero
            const avgPoints = region.users > 0 ? Math.round(region.points / region.users) : 0;
            return (
              <Card key={region.region} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`h-1.5 w-full bg-gradient-to-r ${region.color}`} />
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg bg-gray-50 border`}>
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{region.region}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Submissions</span>
                      <span className="text-xl font-extrabold text-gray-900">
                        {region.submissions.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Points Awarded</span>
                      <span className="text-xl font-extrabold text-green-600">
                        {region.points.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Active Users</span>
                      <span className="text-xl font-extrabold text-blue-600">
                        {region.users.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Avg Points/User</span>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900">
                        <span className="text-amber-500">🪙</span>
                        {avgPoints}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
              <p className="text-sm font-medium text-green-700 mb-2">Total Recycling Impact</p>
              <p className="text-3xl font-bold text-green-900">3,207 kg</p>
              <p className="text-sm text-green-600 mt-1">↑ 12% from last month</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
              <p className="text-sm font-medium text-blue-700 mb-2">CO₂ Saved</p>
              <p className="text-3xl font-bold text-blue-900">1,543 kg</p>
              <p className="text-sm text-blue-600 mt-1">↑ 8% from last month</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
              <p className="text-sm font-medium text-purple-700 mb-2">Verification Rate</p>
              <p className="text-3xl font-bold text-purple-900">94%</p>
              <p className="text-sm text-purple-600 mt-1">↑ 2% from last month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}