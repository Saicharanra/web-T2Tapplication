"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, Leaf, BarChart3, Images, Users, TrendingUp,
  Coins, Settings, Circle, Loader2, Gift, ChevronRight,
  Bell, Search, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserButton, useUser, RedirectToSignIn } from "@clerk/nextjs";

const navigationBase = [
  { name: "Dashboard", href: "/admin", icon: BarChart3, section: "MAIN", description: "Overview & analytics" },
  { name: "Submissions", href: "/admin/submissions", icon: Images, badge: null, section: "MAIN", description: "Review waste reports" },
  { name: "Rewards", href: "/admin/rewards", icon: Gift, section: "MAIN", description: "Manage reward catalog" },
  { name: "Users", href: "/admin/users", icon: Users, section: "MAIN", description: "User management" },
  { name: "Reports", href: "/admin/reports", icon: TrendingUp, section: "ANALYTICS", description: "Progress analytics" },
  { name: "Points History", href: "/admin/points", icon: Coins, section: "ANALYTICS", description: "Point transactions" },
  { name: "Settings", href: "/admin/settings", icon: Settings, section: "SYSTEM", description: "System configuration" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();
  const { isLoaded, isSignedIn, user } = useUser();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const res = await fetch("/api/submissions/count?status=pending");
        if (res.ok) {
          const data = await res.json();
          setPendingCount(typeof data.count === "number" ? data.count : null);
        }
      } catch {
        setPendingCount(null);
      }
    }
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function checkAdminRole() {
      if (!isLoaded || !isSignedIn) return;
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    }
    checkAdminRole();
  }, [isLoaded, isSignedIn]);

  const navigation = navigationBase.map((item) => {
    if (item.name === "Submissions") {
      return { ...item, badge: pendingCount !== null && pendingCount > 0 ? String(pendingCount) : null };
    }
    return item;
  });

  const mainNav = navigation.filter(item => item.section === "MAIN");
  const analyticsNav = navigation.filter(item => item.section === "ANALYTICS");
  const systemNav = navigation.filter(item => item.section === "SYSTEM");

  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4 relative z-10" />
        </div>
        <p className="text-gray-600 font-medium mt-4">Verifying admin access...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-100/50 p-12 text-center max-w-md mx-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200">
            <X className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">You do not have admin privileges. Your role in the database does not permit access to this panel.</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-200 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.name}
        href={item.href}
        onMouseEnter={() => setHoveredItem(item.name)}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
          isActive
            ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 shadow-sm"
            : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
        )}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
        )}

        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0",
          isActive
            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/50"
            : "bg-gray-100/80 text-gray-500 group-hover:bg-gray-200/80 group-hover:text-gray-700"
        )}>
          <Icon className="h-[18px] w-[18px]" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="block truncate">{item.name}</span>
          {(hoveredItem === item.name || isActive) && (
            <span className="block text-[10px] text-gray-400 truncate font-normal -mt-0.5 animate-in fade-in duration-200">
              {item.description}
            </span>
          )}
        </div>

        {item.badge && (
          <span className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full shadow-sm animate-pulse">
            {item.badge}
          </span>
        )}

        {isActive && (
          <ChevronRight className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-gray-100 lg:hidden rounded-xl"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-base text-gray-900 leading-tight tracking-tight">
                  T2T Admin
                </h1>
                <p className="text-[11px] text-gray-400 font-medium">Trash2Treasure Telangana</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Bar (desktop) */}
            <div className="hidden xl:flex items-center gap-2 px-4 py-2 bg-gray-50/80 rounded-xl border border-gray-200/50 w-64 group focus-within:border-emerald-300 focus-within:bg-white transition-all duration-300">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none flex-1"
              />
              <kbd className="hidden lg:inline text-[10px] text-gray-400 bg-gray-200/60 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </div>

            {/* Live Status */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200/50">
              <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Live</span>
            </div>

            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              {pendingCount && pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Button>

            {/* User Section */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200/60">
              <div className="hidden sm:block text-right">
                <div className="font-semibold text-sm text-gray-900 line-clamp-1 max-w-[110px]">
                  {user?.fullName || user?.firstName || "Admin"}
                </div>
                <div className="text-[11px] text-gray-400 font-medium">Administrator</div>
              </div>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 ring-2 ring-emerald-100 ring-offset-1"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Premium Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 bottom-0 w-[270px] bg-white/80 backdrop-blur-xl border-r border-gray-200/50 transition-all duration-500 ease-out z-40 flex flex-col",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin">
          {/* Main Section */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">
              Main Menu
            </h3>
            <div className="space-y-1">
              {mainNav.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>
          </div>

          {/* Analytics Section */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">
              Analytics
            </h3>
            <div className="space-y-1">
              {analyticsNav.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>
          </div>

          {/* System Section */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">
              System
            </h3>
            <div className="space-y-1">
              {systemNav.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer - User Card */}
        <div className="p-4 border-t border-gray-100/80">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {(user?.fullName || user?.firstName || "A").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.fullName || user?.firstName || "Admin User"}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium">System Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-[270px] pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}