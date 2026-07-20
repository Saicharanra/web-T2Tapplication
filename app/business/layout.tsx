"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect } from "react";
import { Poppins } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import logo from "../../assets/logo.png";
import {
  Menu, X, Leaf, BarChart3, Gift, Settings, 
  Loader2, LogOut, ChevronRight, LayoutDashboard, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const navigation = [
  { name: "Overview", href: "/business", icon: LayoutDashboard, description: "Performance & stats" },
  { name: "Manage Coupons", href: "/business/coupons", icon: Gift, description: "Create & edit coupons" },
  { name: "Customer Analytics", href: "/business/analytics", icon: BarChart3, description: "Customer insights & engagement" },
];

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setIsOwner(false);
        router.push("/sign-in");
      } else if (user.role === "BUSINESS" || user.role === "business") {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    }
  }, [user, loading, router]);

  if (loading || isOwner === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4 relative z-10" />
        </div>
        <p className="text-gray-600 font-medium mt-4">Verifying partner portal access...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-100/50 p-12 text-center max-w-md mx-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200">
            <X className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            You do not have partner privileges. Your role in the database does not permit access to the Business Dashboard.
          </p>
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

            <Link href="/" className="flex items-center gap-2">
              <Image src={logo} alt="Trash2Treasure" className="h-6 w-auto" />
              <span className={cn(poppins.className, "font-bold text-lg text-emerald-700 hidden sm:inline-block")}>
                Trash2Treasure <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold ml-1">Business Portal</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pr-2 border-r border-gray-200">
              <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                {user?.name ? user.name.slice(0, 2) : "B"}
              </div>
              <span className="text-sm font-semibold text-gray-700 hidden sm:inline-block">
                {user?.name}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-16">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-16 left-0 w-64 bg-white border-r border-gray-200/50 shadow-sm z-40 transform transition-transform duration-300 lg:translate-x-0 flex flex-col p-4 gap-2",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
