"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Leaf, BarChart3, Images, Users, TrendingUp, Coins, Settings, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";

// Move the navigation out, badge will be set below with dynamic value
const navigationBase = [
  { name: "Dashboard", href: "/admin", icon: BarChart3, section: "MAIN" },
  { name: "Submissions", href: "/admin/submissions", icon: Images, badge: null, section: "MAIN" },
  { name: "Users", href: "/admin/users", icon: Users, section: "MAIN" },
  { name: "Progress Reports", href: "/admin/reports", icon: TrendingUp, section: "SYSTEM" },
  { name: "Points History", href: "/admin/points", icon: Coins, section: "SYSTEM" },
  { name: "Settings", href: "/admin/settings", icon: Settings, section: "SYSTEM" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  // Fetch pending submissions count
  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const res = await fetch("/api/submissions/count?status=pending");
        if (res.ok) {
          const data = await res.json();
          setPendingCount(
            typeof data.count === "number" ? data.count : null
          );
        }
      } catch {
        setPendingCount(null); // fallback, e.g., no badge if error
      }
    }
    fetchPendingCount();
    // Optionally: refresh count every minute for live badge
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update navigation's badge dynamically
  const navigation = navigationBase.map((item) => {
    if (item.name === "Submissions") {
      return { ...item, badge: pendingCount !== null && pendingCount > 0 ? String(pendingCount) : null };
    }
    return item;
  });

  const mainNav = navigation.filter(item => item.section === "MAIN");
  const systemNav = navigation.filter(item => item.section === "SYSTEM");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg z-50">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <div className="flex items-center gap-2">
              <Leaf className="h-8 w-8" />
              <div className="hidden md:block">
                <h1 className="font-bold text-lg leading-tight">T2T Admin Dashboard</h1>
                <p className="text-xs text-white/80">Trash2Treasure Telangana</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
              <Circle className="h-2 w-2 fill-green-300 text-green-300 animate-pulse" />
              <span className="text-sm">Live Updates</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <div className="font-semibold text-sm">{user?.fullName || user?.firstName || "Admin User"}</div>
                <div className="text-xs text-white/80">System Administrator</div>
              </div>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-40",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="p-4 space-y-6">
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              MAIN
            </h3>
            <div className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-gradient-to-r from-green-50 to-blue-50 text-green-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              SYSTEM
            </h3>
            <div className="space-y-1">
              {systemNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-green-50 to-blue-50 text-green-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
