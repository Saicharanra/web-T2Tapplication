"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "../../assets/logo.png";
import { Poppins } from "next/font/google";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { PointsProvider, usePoints } from "./context/PointsContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const navigation = [
  { name: "Home", href: "/dashboard/home", icon: Home },
  { name: "Scan Earn", href: "/dashboard/scan", icon: Camera },
  { name: "Dashboard", href: "/dashboard/wallet", icon: Wallet },
  { name: "Reward", href: "/dashboard/reward", icon: Gift },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

function DashboardHeader() {
  const { points, pointsLoading, refreshPoints } = usePoints();
  const { user } = useAuth();
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
        <Link href="/" className="flex items-center shrink-0 z-20 transition-transform hover:scale-105">
          <div>
            <Image
              src={logo}
              alt="Trash2Treasure"
              className="h-7 w-auto"
              priority
            />
          </div>
          <div className="flex items-center pointer-events-auto">
        <span className={`${poppins.className} font-bold text-lg sm:text-xl lg:text-2xl leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 hidden sm:inline-block`}>
  Trash2Treasure
</span>
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

        {/* Points and User Button */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 z-10 pointer-events-auto">
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
          
          {/* Real-time In-App Notification Bell */}
          <NotificationBell />

          <Link href="/dashboard/profile" className="p-0.5 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 shadow-lg flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto">
            <div className="bg-white dark:bg-[#0B1527] rounded-full p-0.5 flex items-center justify-center h-[34px] w-[34px] sm:h-[40px] sm:w-[40px] overflow-hidden relative">
              {user?.photoURL ? (
                <Image src={user.photoURL} alt="Profile" className="h-full w-full object-cover" width={40} height={40} unoptimized />
              ) : (
                <User className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </Link>
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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const handleFirstLoginNotification = async () => {
        try {
          const { doc, getDoc, updateDoc } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase-client");
          const { notify } = await import("@/lib/notifications/notify");
          
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.firstLoginPending !== false && !data.hasLoggedInBefore) {
              await notify({
                userId: user.uid,
                email: user.email || "",
                type: "first_login",
                title: "First Login Registered 🔑",
                message: "Welcome back for your first session! Let's start scanning and saving the planet.",
              });

              await updateDoc(userRef, {
                firstLoginPending: false,
                hasLoggedInBefore: true,
                updatedAt: new Date()
              });
            }
          }
        } catch (err) {
          console.error("⚠️ Failed to check or trigger First Login notification:", err);
        }
      };

      handleFirstLoginNotification();
    }
  }, [user]);

  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;
    
    const startTime = Date.now();
    const currentPath = pathname;

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent < 1) return;

      import("firebase/firestore").then(async ({ collection, addDoc, serverTimestamp }) => {
        try {
          const { db } = await import("@/lib/firebase-client");
          await addDoc(collection(db, "analytics"), {
            userId: user.uid,
            userName: user.displayName || user.email || "Anonymous",
            userEmail: user.email || "",
            pathname: currentPath,
            timeSpent: timeSpent,
            timestamp: serverTimestamp(),
          });
        } catch (err) {
          console.error("⚠️ Failed to write user engagement tracking log:", err);
        }
      });
    };
  }, [pathname, user]);

  return (
    <PointsProvider>
      <div className="min-h-screen bg-gradient-subtle flex flex-col w-full overflow-hidden">
        {/* Top Header */}
        <DashboardHeader />

        {/* Main content - Dynamic padding for mobile bottom nav */}
        <main className="flex-1 pt-20 sm:pt-24 pb-24 md:pb-8 animate-fade-in relative z-0 w-full max-w-[1920px] mx-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">{children}</div>
        </main>

        {/* Bottom Navigation (Mobile Only) */}
        <MobileNav />
      </div>
    </PointsProvider>
  );
}