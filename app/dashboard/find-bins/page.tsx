"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import dynamicImport from "next/dynamic";
import { useLocation } from "@/hooks/useLocation";
import { SearchBar } from "@/components/find-bins/SearchBar";
import { BinList } from "@/components/find-bins/BinList";
import { fetchBins } from "@/lib/supabase/bins";
import { supabase } from "@/lib/supabase-client";

import { calculateDistance } from "@/hooks/useNearbyBins";
import { motion } from "framer-motion";
import { Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BinDocument } from "@/types/find-bins";

// Dynamic map load to bypass SSR limitations
const BinMap = dynamicImport(() => import("@/components/find-bins/BinMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] flex flex-col items-center justify-center bg-white/30 dark:bg-slate-900/30 border border-white/50 dark:border-slate-800/50 backdrop-blur-md rounded-3xl animate-pulse">
      <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4">
        Mapping Waste Locations...
      </p>
    </div>
  ),
});

export default function FindBinsPage() {
  const { location, loading: locationLoading, error: locationError, requestPermission } = useLocation();

  // Bins Collections State
  const [allBins, setAllBins] = useState<BinDocument[]>([]);
  const [binsLoading, setBinsLoading] = useState(true);

  // Search/Filters State
  const [searchQuery, setSearchQuery] = useState("");

  // Map & View State
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // 1. Load bins + Supabase Realtime subscription
  useEffect(() => {
    setBinsLoading(true);

    const loadBins = async () => {
      try {
        const data = await fetchBins();
        setAllBins(data);
      } catch (err) {
        console.error("Failed to fetch bins:", err);
      } finally {
        setBinsLoading(false);
      }
    };

    loadBins();

    // Listen for real-time changes on Bin table
    const channel = supabase
      .channel("bins-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "Bin" }, () => loadBins())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. Exact GPS distances, sorting and text filtering
  const bins = useMemo(() => {
    // Default fallback coordinates if GPS is loading to show a general grid
    const centerLat = location?.lat ?? 37.7749;
    const centerLng = location?.lng ?? -122.4194;

    return allBins
      .map((bin) => {
        // Precise Haversine distance from current user coordinates
        const distance = calculateDistance(centerLat, centerLng, bin.latitude, bin.longitude);
        return {
          ...bin,
          distance,
        };
      })
      .filter((bin) => {
        // Search text matching name/address
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const nameMatch = bin.name.toLowerCase().includes(query);
          const addressMatch = bin.address.toLowerCase().includes(query);
          return nameMatch || addressMatch;
        }

        return true;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Sort nearest first
  }, [allBins, location, searchQuery]);

  const handleSelectBin = (bin: BinDocument) => {
    setSelectedBinId(bin.id);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 px-1 md:px-0 animate-in fade-in duration-300">
      <title>Find Recycling Bins | Trash2Treasure</title>
      <meta name="description" content="Locate nearby recycling bins in your community on our interactive map." />
      {/* Dynamic Eco Mapped Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl bg-glass border border-white/50 dark:border-slate-800/50 p-5 md:p-8 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>📍</span> Waste-Location Network
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl text-xs md:text-sm leading-relaxed">
            Shared map highlighting community waste-disposal locations collected automatically from user activity. Select any spot to open precise directions.
          </p>
        </div>
      </motion.div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative min-h-[600px]">
        {/* Left Side List View Panel */}
        <div
          className={`lg:col-span-5 flex flex-col gap-5 ${
            mobileView === "list" ? "block" : "hidden lg:flex"
          }`}
        >
          {/* Controls Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-glass border border-white/50 dark:border-slate-800/50 shadow-sm flex flex-col gap-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* List Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-glass border border-white/50 dark:border-slate-800/50 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-850 dark:text-slate-200 text-sm md:text-base flex items-center gap-1.5">
                <span>🌱</span> Nearby Disposals
                <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full ml-1 font-bold">
                  {bins.length} spots
                </span>
              </h3>

              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                Live Community Activity
              </div>
            </div>

            <BinList
              bins={bins}
              selectedBinId={selectedBinId}
              onSelectBin={handleSelectBin}
              loading={locationLoading || binsLoading}
              error={locationError}
              onRetry={requestPermission}
            />
          </div>
        </div>

        {/* Right Side Map Workspace */}
        <div
          className={`lg:col-span-7 h-[500px] lg:h-[calc(100vh-180px)] sticky top-24 ${
            mobileView === "map" ? "block" : "hidden lg:block"
          }`}
        >
          {locationLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white/30 dark:bg-slate-900/30 border border-white/50 dark:border-slate-800/50 backdrop-blur-md rounded-3xl animate-pulse">
              <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500 mt-4">
                Detecting current coordinates...
              </p>
            </div>
          ) : (
            <BinMap
              bins={bins}
              userLocation={location}
              selectedBinId={selectedBinId}
              onSelectBin={handleSelectBin}
            />
          )}
        </div>
      </div>

      {/* Floating segment toggle for mobile displays */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 lg:hidden pointer-events-auto">
        <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md px-1.5 py-1.5 rounded-2xl flex gap-1 shadow-2xl border border-white/10">
          <Button
            onClick={() => setMobileView("list")}
            size="sm"
            variant="ghost"
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              mobileView === "list"
                ? "bg-gradient-eco text-white hover:bg-emerald-600"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <List className="h-3.5 w-3.5 mr-1" />
            List View
          </Button>
          <Button
            onClick={() => setMobileView("map")}
            size="sm"
            variant="ghost"
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              mobileView === "map"
                ? "bg-gradient-eco text-white hover:bg-emerald-600"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Map className="h-3.5 w-3.5 mr-1" />
            Map View
          </Button>
        </div>
      </div>
    </div>
  );
}
