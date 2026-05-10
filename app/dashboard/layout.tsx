"use client";

import Link from "next/link";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  Camera,
  Wallet,
  User,
  Gift,
  Leaf,
  Recycle,
  Settings,
  BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { PointsProvider, usePoints } from "./context/PointsContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import NotificationToast from "@/components/notifications/NotificationToast";


const navigation = [
  { name: "Home", href: "/dashboard/home", icon: Home },
  { name: "Scan Earn", href: "/dashboard/scan", icon: Camera },
  { name: "Dashboard", href: "/dashboard/wallet", icon: Wallet },
  { name: "Reward", href: "/dashboard/reward", icon: Gift },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

function DashboardHeader() {
  const { points, pointsLoading, refreshPoints } = usePoints();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`fixed top-0 sm:top-4 left-0 right-0 z-50 flex justify-center sm:px-4 w-full transition-all duration-300 ${isScrolled ? 'pt-2 sm:pt-0' : 'pt-4 sm:pt-0'}`}>
      <header className={`w-full max-w-7xl h-16 flex items-center justify-between px-2 sm:px-4 transition-all duration-300 relative rounded-none sm:rounded-2xl ${isScrolled
        ? 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-sm'
        : 'bg-transparent border-transparent'
        }`}>
        {/* Logo and App Name */}
        <Link href="/" className="flex items-center gap-2 shrink-0 z-10 transition-transform hover:scale-105">
          <Image src="/dashboard/icon.png" alt="icon" width={45} height={45 }  />
          <div className="flex items-center pointer-events-auto">
            <h1
  className={`${spaceGrotesk.className} 
  font-extrabold 
  text-lg sm:text-2xl lg:text-3xl 
  tracking-[-0.05em] 
  bg-clip-text text-transparent 
  bg-gradient-to-r 
  from-emerald-400 
  via-green-500 
  to-cyan-500 
  drop-shadow-[0_0_12px_rgba(34,197,94,0.35)]
  transition-all duration-300 
  hover:scale-105`}
>
  Trash2Treasure
</h1>

          </div>
        </Link>

        {/* Centered Navigation Pill */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 justify-center hide-scrollbar z-10 pointer-events-auto">
          <ul className={`flex items-center justify-center gap-1 xl:gap-2 px-3 py-1.5 transition-all duration-300 ${isScrolled
            ? 'bg-white/60 dark:bg-slate-800/60 border border-gray-200/50 dark:border-slate-700/50 rounded-full backdrop-blur-md shadow-sm'
            : 'bg-white/90 dark:bg-[#0B1527]/90 border border-gray-200/50 dark:border-blue-900/40 rounded-full backdrop-blur-md shadow-lg'
            }`}>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={item.name}
                    className={cn(
                      "flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 select-none",
                      isActive
                        ? "text-blue-600 dark:text-blue-400 font-semibold bg-gray-100/50 dark:bg-slate-800/50"
                        : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <span className="whitespace-nowrap">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Points, Notifications, and User Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 z-10 pointer-events-auto">
          <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 ${isScrolled
            ? 'bg-white/60 dark:bg-slate-800/60 border border-gray-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-md'
            : 'bg-white/90 dark:bg-[#0B1527]/90 border border-gray-200/50 dark:border-blue-900/40 shadow-lg backdrop-blur-md'
            }`}>
            <span className="text-lg sm:text-xl leading-none">🪙</span>
            <div className="flex flex-col items-center justify-center relative min-w-[2rem] sm:min-w-[3rem]">
              {pointsLoading ? (
                <Recycle className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
              ) : (
                <span className="font-bold text-sm text-gray-800 dark:text-slate-200 leading-none">
                  {points.toLocaleString()}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshPoints}
              className="h-5 w-5 p-0 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors group"
              disabled={pointsLoading}
            >
              <svg className="h-3 w-3 text-gray-500 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
          {/* Notification Bell */}
          <NotificationBell />
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 shadow-lg flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto">
            <div className="bg-white dark:bg-[#0B1527] rounded-full p-0.5 flex items-center justify-center h-[34px] w-[34px] sm:h-[40px] sm:w-[40px]">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 sm:h-9 sm:w-9 rounded-full",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 w-full md:hidden pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300">
        <ul className="flex items-center justify-around h-16 px-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.name} className="flex-1 h-full">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center h-full w-full gap-1 transition-all duration-300 relative group",
                    isActive ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  )}
                >
                  {isActive && (
                    <span className="absolute -top-px w-8 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-b-full shadow-[0_2px_10px_rgba(34,197,94,0.5)]" />
                  )}
                  <Icon className={cn("h-5 w-5 transition-transform duration-300", isActive ? "scale-110 -translate-y-0.5" : "group-hover:scale-110 group-hover:-translate-y-0.5")} />
                  <span className="text-[10px] font-medium leading-none">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PointsProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gradient-subtle flex flex-col w-full overflow-hidden">
          {/* Top Header */}
          <DashboardHeader />

          {/* Main content - Dynamic padding for mobile bottom nav */}
          <main className="flex-1 pt-20 sm:pt-24 pb-24 md:pb-8 animate-fade-in relative z-0 w-full max-w-[1920px] mx-auto">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">{children}</div>
          </main>

          {/* Bottom Navigation (Mobile Only) */}
          <MobileNav />

          {/* Realtime Toast Notifications */}
          <NotificationToast />
        </div>
      </NotificationProvider>
    </PointsProvider>
  );
}