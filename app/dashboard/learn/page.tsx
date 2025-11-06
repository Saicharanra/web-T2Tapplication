"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Leaf, Droplets, Zap, Recycle } from "lucide-react";

const articles = [
  {
    id: "1",
    title: "The Importance of Recycling Plastic",
    category: "Plastic Waste",
    icon: "♻️",
    color: "from-blue-500 to-cyan-500",
    excerpt: "Learn how recycling plastic helps reduce ocean pollution and saves marine life.",
    readTime: "5 min read",
  },
  {
    id: "2",
    title: "Paper Recycling: Save Trees",
    category: "Paper Waste",
    icon: "📄",
    color: "from-green-500 to-emerald-500",
    excerpt: "Discover how recycling one ton of paper can save 17 trees and reduce landfill waste.",
    readTime: "4 min read",
  },
  {
    id: "3",
    title: "E-Waste Management Guide",
    category: "Electronic Waste",
    icon: "📱",
    color: "from-purple-500 to-pink-500",
    excerpt: "Electronic waste contains valuable materials. Learn how to properly dispose of e-waste.",
    readTime: "6 min read",
  },
  {
    id: "4",
    title: "Composting at Home",
    category: "Organic Waste",
    icon: "🌱",
    color: "from-green-600 to-lime-500",
    excerpt: "Turn your kitchen waste into nutrient-rich compost for your garden.",
    readTime: "7 min read",
  },
  {
    id: "5",
    title: "Metal Recycling Benefits",
    category: "Metal Waste",
    icon: "🔩",
    color: "from-gray-500 to-slate-600",
    excerpt: "Recycling metals saves energy and reduces greenhouse gas emissions significantly.",
    readTime: "4 min read",
  },
  {
    id: "6",
    title: "Glass: Infinitely Recyclable",
    category: "Glass Waste",
    icon: "🍾",
    color: "from-cyan-500 to-blue-600",
    excerpt: "Glass can be recycled endlessly without losing quality. Learn the process.",
    readTime: "5 min read",
  },
];

const tips = [
  {
    title: "Reduce Single-Use Plastics",
    description: "Carry reusable bags, bottles, and containers to minimize plastic waste.",
    icon: Recycle,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Save Water",
    description: "Fix leaks, take shorter showers, and use water-efficient appliances.",
    icon: Droplets,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    title: "Conserve Energy",
    description: "Switch to LED bulbs, unplug devices, and use energy-efficient appliances.",
    icon: Zap,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    title: "Plant Trees",
    description: "Trees absorb CO₂, provide oxygen, and create habitats for wildlife.",
    icon: Leaf,
    color: "text-green-600",
    bg: "bg-green-50",
  },
];

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📚 Learn & Grow</h1>
        <p className="text-gray-600 mt-1">Educational resources for sustainable living</p>
      </div>

      {/* Quick Tips */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Daily Eco-Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip) => {
              const Icon = tip.icon;
              return (
                <div
                  key={tip.title}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-full ${tip.bg}`}>
                      <Icon className={`h-6 w-6 ${tip.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{tip.title}</h3>
                      <p className="text-sm text-gray-600">{tip.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Educational Articles */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Educational Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <div className={`h-3 bg-gradient-to-r ${article.color}`} />
              <CardContent className="p-6">
                <div className="text-5xl mb-4">{article.icon}</div>
                <div className="mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {article.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{article.readTime}</span>
                  <span className="text-green-600 font-medium group-hover:underline">
                    Read More →
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Impact Stats */}
      <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6">Your Environmental Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-4xl mb-2">🌍</div>
              <p className="text-white/80 text-sm mb-1">CO₂ Saved</p>
              <p className="text-3xl font-bold">125 kg</p>
            </div>
            <div>
              <div className="text-4xl mb-2">🌳</div>
              <p className="text-white/80 text-sm mb-1">Trees Equivalent</p>
              <p className="text-3xl font-bold">6</p>
            </div>
            <div>
              <div className="text-4xl mb-2">💧</div>
              <p className="text-white/80 text-sm mb-1">Water Saved</p>
              <p className="text-3xl font-bold">840 L</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
        <CardContent className="p-8 text-center">
          <div className="text-5xl mb-4">🌟</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Share Your Knowledge!</h3>
          <p className="text-gray-600 mb-4">
            Help others learn about sustainable living by sharing these articles with friends and family.
          </p>
          <div className="flex gap-3 justify-center">
            <span className="text-3xl cursor-pointer hover:scale-110 transition-transform">📱</span>
            <span className="text-3xl cursor-pointer hover:scale-110 transition-transform">💬</span>
            <span className="text-3xl cursor-pointer hover:scale-110 transition-transform">📧</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
