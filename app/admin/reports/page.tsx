"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, MapPin } from "lucide-react";

const regionalStats = [
  { region: "Hyderabad", submissions: 1247, points: 48920, users: 543, color: "from-blue-500 to-blue-600" },
  { region: "Warangal", submissions: 892, points: 34560, users: 387, color: "from-green-500 to-green-600" },
  { region: "Nizamabad", submissions: 645, points: 25880, users: 241, color: "from-purple-500 to-purple-600" },
  { region: "Others", submissions: 423, points: 16740, users: 163, color: "from-orange-500 to-orange-600" },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly" | "yearly">("monthly");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Progress Reports</h1>
        <p className="text-gray-600 mt-1">Analyze system performance and regional statistics</p>
      </div>

      {/* Time Range Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">View:</span>
            <div className="flex gap-2">
              <Button
                variant={timeRange === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("weekly")}
              >
                Weekly
              </Button>
              <Button
                variant={timeRange === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("monthly")}
              >
                Monthly
              </Button>
              <Button
                variant={timeRange === "yearly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("yearly")}
              >
                Yearly
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Submissions Over Time ({timeRange})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto" />
              <p className="text-gray-600 font-medium">
                Chart visualization showing {timeRange} submission trends
              </p>
              <p className="text-sm text-gray-500">
                Integration with Recharts/Chart.js for real-time data visualization
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Statistics */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Regional Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {regionalStats.map((region) => (
            <Card key={region.region} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-2 bg-gradient-to-r ${region.color}`} />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <h3 className="text-xl font-bold text-gray-900">{region.region}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Submissions</span>
                    <span className="text-lg font-bold text-gray-900">
                      {region.submissions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Points Awarded</span>
                    <span className="text-lg font-bold text-green-600">
                      {region.points.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="text-lg font-bold text-blue-600">
                      {region.users.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Avg Points/User</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round(region.points / region.users)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
