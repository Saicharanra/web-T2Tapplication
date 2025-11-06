"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Camera,
  Wallet,
  Trophy,
  BookOpen,
  User,
  Gift,
  Leaf,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { PointsProvider, usePoints } from "./context/PointsContext";

// Force dynamic rendering to prevent header access issues
export const dynamic = 'force-dynamic';

const navigation = [
  { name: "Home", href: "/dashboard/home", icon: Home },
  { name: "Scan Waste", href: "/dashboard/scan", icon: Camera },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Reward", href: "/dashboard/reward", icon: Gift },
  { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  { name: "Learn", href: "/dashboard/learn", icon: BookOpen },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

function DashboardHeader() {
  const { points, pointsLoading, refreshPoints } = usePoints();
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo and App Name */}
        <Link href="/" className="flex items-center gap-2">
          <Leaf className="h-8 w-8 text-green-600" />
          <div className="hidden md:block">
            <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Trash2Treasure
            </h1>
            <p className="text-xs text-gray-600">Turn Trash Into Treasure</p>
          </div>
        </Link>
        {/* Centered Navigation */}
        <nav className="flex-1 flex justify-center">
          <ul className="flex gap-2 sm:gap-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg scale-105"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Points and User Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
            <span className="text-2xl">🪙</span>
            {pointsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-green-700" />
            ) : (
              <span className="font-bold text-lg text-green-700">
                {points.toLocaleString()}
              </span>
            )}
            <span className="text-sm text-gray-600">points</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshPoints}
              className="h-6 w-6 p-0 hover:bg-green-200"
              disabled={pointsLoading}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </Button>
          </div>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-10 w-10",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PointsProvider>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        {/* Header & Navbar */}
        <DashboardHeader />
        {/* Main content */}
        <main className="pt-16 min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </PointsProvider>
  );
}
