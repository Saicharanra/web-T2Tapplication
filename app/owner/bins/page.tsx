"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { fetchBins, createBin, deleteBin } from "@/lib/supabase/bins";
import { supabase } from "@/lib/supabase-client";

import { BinDocument } from "@/types/find-bins";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Plus,
  Trash2,
  Search,
  Filter,
  Loader2,
  Map,
  Navigation,
  ShieldAlert,
  Layers,
  Sparkles
} from "lucide-react";

export default function AdminBinsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [bins, setBins] = useState<BinDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formType, setFormType] = useState("collection_point");
  const [formLat, setFormLat] = useState<number | "">("");
  const [formLng, setFormLng] = useState<number | "">("");
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  // 1. Load bins + Supabase Realtime subscription
  useEffect(() => {
    setLoading(true);

    const loadBins = async () => {
      try {
        const data = await fetchBins();
        setBins(data);
      } catch (err) {
        console.error("Failed to fetch bins:", err);
        toast({
          title: "❌ Connection Error",
          description: "Failed to load bins from Supabase.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBins();

    // Listen for real-time changes on Bin table
    const channel = supabase
      .channel("admin-bins-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "Bin" }, () => loadBins())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [toast]);


  // 2. Filter Bins
  const filteredBins = useMemo(() => {
    return bins.filter((bin) => {
      const matchesSearch =
        bin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bin.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bin.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === "ALL" || bin.locationType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [bins, searchTerm, typeFilter]);

  // 3. Stats Calculation
  const stats = useMemo(() => {
    const total = bins.length;
    const smartBins = bins.filter((b) => b.locationType === "smart_bin").length;
    const collectionPoints = bins.filter((b) => b.locationType === "collection_point").length;
    const crowdsourced = bins.filter((b) => b.addedBy && b.addedBy !== (user?.uid || "admin")).length;

    return { total, smartBins, collectionPoints, crowdsourced };
  }, [bins, user]);

  // 4. Request device GPS
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "❌ Geolocation Unsupported",
        description: "Your browser does not support geolocation tracking.",
        variant: "destructive",
      });
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormLat(Number(position.coords.latitude.toFixed(6)));
        setFormLng(Number(position.coords.longitude.toFixed(6)));
        setGpsLoading(false);
        toast({
          title: "📍 Location Detected",
          description: `Successfully locked GPS coordinates.`,
        });
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsLoading(false);
        toast({
          title: "❌ Location Refused",
          description: "Could not access location. Please input coordinates manually.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 5. Submit Bin Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formAddress.trim() || formLat === "" || formLng === "") {
      toast({
        title: "⚠️ Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await createBin(user?.uid || "admin", {
        name: formName.trim(),
        address: formAddress.trim(),
        latitude: Number(formLat),
        longitude: Number(formLng),
        locationType: formType,
        photoUrl: formPhotoUrl.trim() || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400",
      });

      toast({
        title: "✅ Success",
        description: "Successfully added new waste bin location.",
      });

      // Reset Form State
      setFormName("");
      setFormAddress("");
      setFormType("collection_point");
      setFormLat("");
      setFormLng("");
      setFormPhotoUrl("");
      setIsAddOpen(false);
    } catch (err: any) {
      console.error("Failed to add bin:", err);
      toast({
        title: "❌ Creation Failed",
        description: err.message || "An error occurred while pinning the bin.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Delete Bin Location
  const handleDeleteBin = async (binId: string, binName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${binName}"? This will immediately remove it from the live map.`)) {
      return;
    }

    try {
      await deleteBin(binId);
      toast({
        title: "🗑️ Bin Removed",
        description: `Successfully deleted "${binName}" from the database.`,
      });
    } catch (err: any) {
      console.error("Failed to delete bin:", err);
      toast({
        title: "❌ Deletion Failed",
        description: err.message || "Failed to delete the bin.",
        variant: "destructive",
      });
    }
  };

  const getTypeBadgeStyles = (type: string) => {
    switch (type) {
      case "smart_bin":
        return "bg-cyan-50 text-cyan-700 border-cyan-150 dark:bg-cyan-950/20 dark:text-cyan-400";
      case "recycling_center":
        return "bg-blue-50 text-blue-700 border-blue-150 dark:bg-blue-950/20 dark:text-blue-400";
      case "collection_point":
        return "bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-950/20 dark:text-emerald-400";
      default:
        return "bg-slate-50 text-slate-700 border-slate-150 dark:bg-slate-950/20 dark:text-slate-400";
    }
  };

  const formatTypeLabel = (type: string) => {
    return type
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <title>Manage Bins | Admin Panel</title>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📍</span> Waste-Bins Management
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            Manually add, review, and remove crowdsourced or smart eco-bins on the live map.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md rounded-xl font-bold gap-2 px-5 py-2.5 transition-all">
              <Plus className="h-5 w-5" />
              Add Waste Bin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/95 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5 border-b pb-3">
                <span>🚮</span> Pin New Waste Location
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Name *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Park North Recycling Station"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Type *</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="collection_point">🚮 Collection Point</option>
                  <option value="smart_bin">🤖 Smart Bin</option>
                  <option value="recycling_center">♻️ Recycling Center</option>
                  <option value="trash_bin">🗑️ Trash Bin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Street Address *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Corner of Oak Road, beside Park Gate"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-850 dark:bg-slate-950 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Latitude *</label>
                  <Input
                    type="number"
                    step="0.000001"
                    required
                    placeholder="e.g. 37.774929"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value === "" ? "" : Number(e.target.value))}
                    className="rounded-xl border-slate-200 dark:border-slate-850 dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Longitude *</label>
                  <Input
                    type="number"
                    step="0.000001"
                    required
                    placeholder="e.g. -122.419418"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value === "" ? "" : Number(e.target.value))}
                    className="rounded-xl border-slate-200 dark:border-slate-850 dark:bg-slate-950"
                  />
                </div>
              </div>

              {/* GPS helper */}
              <Button
                type="button"
                onClick={handleGetLocation}
                variant="outline"
                disabled={gpsLoading}
                className="w-full flex items-center justify-center gap-2 border-dashed border-emerald-500/30 text-emerald-600 hover:bg-emerald-50/50 hover:text-emerald-700 dark:hover:bg-emerald-950/20 py-2.5 rounded-xl font-semibold"
              >
                {gpsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                ) : (
                  <Navigation className="h-4 w-4 text-emerald-500 animate-pulse" />
                )}
                Lock Current Coordinates
              </Button>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Photo URL (Optional)</label>
                <Input
                  type="url"
                  placeholder="e.g. https://example.com/bin.jpg"
                  value={formPhotoUrl}
                  onChange={(e) => setFormPhotoUrl(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-850 dark:bg-slate-950 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl py-2.5 text-xs font-bold border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xs shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Pinning...
                    </>
                  ) : (
                    "Pin Location"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Section */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="h-28 bg-gray-100/50 dark:bg-slate-800/20 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-white/50 bg-white/70 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/60 backdrop-blur-md">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Bins</p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.total}</h4>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl">
                <Map className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/50 bg-white/70 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/60 backdrop-blur-md">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Smart Bins</p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.smartBins}</h4>
              </div>
              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-2xl">
                <Sparkles className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/50 bg-white/70 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/60 backdrop-blur-md">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Collection Points</p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.collectionPoints}</h4>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-2xl">
                <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/50 bg-white/70 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/60 backdrop-blur-md">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Crowdsourced</p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.crowdsourced}</h4>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-2xl">
                <Navigation className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 🔍 Search + Filters */}
      <Card className="rounded-2xl border-white/50 bg-white/70 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/60 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          {/* Search Box */}
          <div className="relative w-full flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, address, or identifier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-slate-200 dark:border-slate-850 dark:bg-slate-950 focus-visible:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-gray-500 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full md:w-[200px] p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-sm font-medium focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="collection_point">🚮 Collection Point</option>
              <option value="smart_bin">🤖 Smart Bin</option>
              <option value="recycling_center">♻️ Recycling Center</option>
              <option value="trash_bin">🗑️ Trash Bin</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bins Table Workspace */}
      <Card className="rounded-2xl border-white/50 bg-white/70 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/60 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-gray-100 dark:border-slate-800/80 px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span>🚮</span> Registered Locations ({filteredBins.length})
          </CardTitle>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/15 px-2.5 py-1 rounded-full">
            Firestore Live Synced
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Syncing database collections...</p>
            </div>
          ) : filteredBins.length === 0 ? (
            <div className="text-center py-16 text-gray-400 flex flex-col items-center justify-center gap-3">
              <MapPin className="h-12 w-12 text-slate-300 dark:text-slate-700" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-350">No locations mapped</p>
                <p className="text-xs text-slate-400 mt-0.5">Try refining your search term or add a new bin point above.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-bold">
                    <th className="py-3.5 px-6 text-left">Bin Details</th>
                    <th className="py-3.5 px-4 text-left">Location / Type</th>
                    <th className="py-3.5 px-4 text-left">Coordinates</th>
                    <th className="py-3.5 px-4 text-left">Creator ID</th>
                    <th className="py-3.5 px-4 text-left">Date Mapped</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80 text-sm">
                  {filteredBins.map((bin) => (
                    <tr key={bin.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      {/* Name / Info */}
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0 bg-slate-100 flex items-center justify-center relative">
                          {bin.photoUrl ? (
                            <Image src={bin.photoUrl} alt="Bin" fill className="object-cover" unoptimized />
                          ) : (
                            <MapPin className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]" title={bin.name}>
                            {bin.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-[120px]" title={bin.id}>
                            ID: {bin.id}
                          </p>
                        </div>
                      </td>

                      {/* Address & Type */}
                      <td className="py-4 px-4">
                        <div className="min-w-0 max-w-[220px]">
                          <p className="text-xs text-gray-600 dark:text-gray-300 truncate" title={bin.address}>
                            {bin.address}
                          </p>
                          <span className={`inline-block border px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold ${getTypeBadgeStyles(bin.locationType)}`}>
                            {formatTypeLabel(bin.locationType)}
                          </span>
                        </div>
                      </td>

                      {/* GPS coordinates */}
                      <td className="py-4 px-4 font-mono text-xs text-gray-650 dark:text-gray-400">
                        <span className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 px-2.5 py-1 rounded-lg">
                          {bin.latitude.toFixed(6)}, {bin.longitude.toFixed(6)}
                        </span>
                      </td>

                      {/* Creator */}
                      <td className="py-4 px-4 font-mono text-xs text-gray-400 dark:text-gray-500">
                        {bin.addedBy === (user?.uid || "admin") ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 border border-emerald-250/20 rounded-md">
                            Admin (System)
                          </span>
                        ) : (
                          <span className="truncate max-w-[80px] inline-block" title={bin.addedBy}>
                            {bin.addedBy || "Anonymous"}
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-xs text-gray-500 dark:text-gray-450">
                        {bin.createdAt ? (
                          new Date(bin.createdAt).toLocaleDateString()
                        ) : (
                          "N/A"
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBin(bin.id, bin.name)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
