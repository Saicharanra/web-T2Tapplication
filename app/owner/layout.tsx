"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect } from "react";
import { Poppins } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import logo from "../../assets/logo.png";
import {
  Menu, X, Leaf, BarChart3, Images, Users, TrendingUp,
  Coins, Settings, Circle, Loader2, Gift, ChevronRight,
  Bell, Search, LogOut, Cpu, Map, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const navigationBase = [
  { name: "Dashboard", href: "/owner", icon: BarChart3, section: "MAIN", description: "Overview & analytics" },
  { name: "Submissions", href: "/owner/submissions", icon: Images, badge: null, section: "MAIN", description: "Review waste reports" },
  { name: "Manage Bins", href: "/owner/bins", icon: Map, section: "MAIN", description: "Manage & Add waste bins" },
  { name: "Rewards", href: "/owner/rewards", icon: Gift, section: "MAIN", description: "Manage reward catalog" },
  { name: "Users", href: "/owner/users", icon: Users, section: "MAIN", description: "User management" },
  { name: "Reports", href: "/owner/reports", icon: TrendingUp, section: "ANALYTICS", description: "Progress analytics" },
  { name: "User Engagement", href: "/owner/engagement", icon: Clock, section: "ANALYTICS", description: "Time-spent tracking" },
  { name: "Points History", href: "/owner/points", icon: Coins, section: "ANALYTICS", description: "Point transactions" },
  { name: "ML Model Tuning", href: "/owner/model-tuning", icon: Cpu, section: "SYSTEM", description: "Fine-tune & monitor MobileNet" },
  { name: "Settings", href: "/owner/settings", icon: Settings, section: "SYSTEM", description: "System configuration" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const res = await fetchWithAuth("/api/submissions/count?status=PENDING");
        if (res.ok) {
          const data = await res.json();
          setPendingCount(typeof data.count === "number" ? data.count : null);
        }
      } catch {
        setPendingCount(null);
      }
    }
    
    if (user && isAdmin) {
        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 60000);
        return () => clearInterval(interval);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    async function checkAdminRole() {
      if (loading) return;
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const res = await fetchWithAuth("/api/admin/rewards"); // Using rewards as a proxy for admin check
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
  }, [user, loading]);

  const navigation = navigationBase.map((item) => {
    if (item.name === "Submissions") {
      return { ...item, badge: pendingCount !== null && pendingCount > 0 ? String(pendingCount) : null };
    }
    return item;
  });

  const mainNav = navigation.filter(item => item.section === "MAIN");
  const analyticsNav = navigation.filter(item => item.section === "ANALYTICS");
  const systemNav = navigation.filter(item => item.section === "SYSTEM");

  if (!loading && !user) {
    router.push("/sign-in");
    return null;
  }

  if (loading || isAdmin === null) {
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

            <div>
            <Image
              src={logo}
              alt="Trash2Treasure"
              className="h-7 w-auto"
              priority
            />
          </div>
          <div className="flex items-center pointer-events-auto">
  <span
   className={`${poppins.className} font-bold text-lg sm:text-xl lg:text-2xl leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-black to-emerald-700 dark:from-gray-100 dark:to-emerald-400`}
 >
   Admin Panel
 </span>
          </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xl:flex items-center gap-2 px-4 py-2 bg-gray-50/80 rounded-xl border border-gray-200/50 w-64 group focus-within:border-emerald-300 focus-within:bg-white transition-all duration-300">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none flex-1"
              />
              <kbd className="hidden lg:inline text-[10px] text-gray-400 bg-gray-200/60 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200/50">
              <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Live</span>
            </div>

            <Button variant="ghost" size="icon" className="relative rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              {pendingCount && pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Button>

            <div className="flex items-center gap-3 pl-3 border-l border-gray-200/60">
              <div className="hidden sm:block text-right">
                <div className="font-semibold text-sm text-gray-900 line-clamp-1 max-w-[110px]">
                  {user?.displayName || "Admin"}
                </div>
                <div className="text-[11px] text-gray-400 font-medium">Administrator</div>
              </div>
              <div className="w-9 h-9 rounded-full ring-2 ring-emerald-100 ring-offset-1 overflow-hidden bg-emerald-500 flex items-center justify-center text-white font-bold relative">
                {user?.photoURL ? <Image src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" width={36} height={36} unoptimized /> : (user?.displayName || "A").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <aside
        className={cn(
          "fixed top-16 left-0 bottom-0 w-[270px] bg-white/80 backdrop-blur-xl border-r border-gray-200/50 transition-all duration-500 ease-out z-40 flex flex-col",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin">
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

        <div className="p-4 border-t border-gray-100/80">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {(user?.displayName || "A").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.displayName || "Admin User"}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium">System Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-[270px] pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}