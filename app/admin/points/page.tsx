"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, Award, Calendar } from "lucide-react";

// If you want stricter typing, add types/interfaces for pointsStats and recentTransactions

const pointsStats = [
  {
    title: "Total Points Awarded",
    value: "126,100",
    icon: Coins,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    title: "Avg Points/Submission",
    value: "42",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Top Earner",
    value: "4,870",
    icon: Award,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const recentTransactions = [
  {
    id: "1",
    user: "Amit Patel",
    submissionId: "SUB-1234",
    points: 100,
    wasteType: "Electronic Waste",
    date: "2024-01-20 14:32",
  },
  {
    id: "2",
    user: "Rahul Kumar",
    submissionId: "SUB-1235",
    points: 50,
    wasteType: "Plastic Bottles",
    date: "2024-01-20 13:18",
  },
  {
    id: "3",
    user: "Vijay Singh",
    submissionId: "SUB-1236",
    points: 45,
    wasteType: "Metal Cans",
    date: "2024-01-20 11:42",
  },
  {
    id: "4",
    user: "Anita Rao",
    submissionId: "SUB-1237",
    points: 25,
    wasteType: "Plastic Bags",
    date: "2024-01-20 10:15",
  },
  {
    id: "5",
    user: "Priya Sharma",
    submissionId: "SUB-1238",
    points: 30,
    wasteType: "Paper Waste",
    date: "2024-01-19 16:48",
  },
  {
    id: "6",
    user: "Sneha Reddy",
    submissionId: "SUB-1239",
    points: 40,
    wasteType: "Glass Bottles",
    date: "2024-01-19 15:22",
  },
  {
    id: "7",
    user: "Karthik Nair",
    submissionId: "SUB-1240",
    points: 35,
    wasteType: "Cardboard",
    date: "2024-01-19 14:05",
  },
  {
    id: "8",
    user: "Deepa Singh",
    submissionId: "SUB-1241",
    points: 55,
    wasteType: "Batteries",
    date: "2024-01-19 12:30",
  },
];

export default function PointsHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Points History</h1>
        <p className="text-gray-600 mt-1">Track all point transactions and rewards</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pointsStats.map((stat, index) => {
          // Moved logic inside a function block, as .map parameter must be an expression or function
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Waste Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Points</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                        {transaction.submissionId}
                      </code>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white font-semibold text-sm">
                          {transaction.user.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{transaction.user}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{transaction.wasteType}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🪙</span>
                        <span className="text-lg font-bold text-green-600">
                          +{transaction.points}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{transaction.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
