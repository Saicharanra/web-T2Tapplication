"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, Star, History, CheckCircle2, Loader2, AlertCircle, Sparkles, RefreshCw, Recycle, Award, Search, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { usePoints } from "../context/PointsContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

/* ──────────────── Types ──────────────── */

interface Reward {
  reward_id: string;
  title: string;
  description: string;
  points_required: number;
  image_url: string;
  status: string;
  category: string;
  stock: number;
  company_name?: string;
  logo_url?: string;
  banner_url?: string;
  discount_type?: string;
  discount_value?: number;
  original_price?: number | null;
  expiry_date?: string | null;
  min_purchase?: number;
  terms?: string;
  store_location?: string;
  website?: string;
  contact_number?: string;
  allow_multiple?: boolean;
  remaining_redemptions?: number;
}

/* ──────────────── Category Styles & Colors ──────────────── */

const categoryColors: Record<string, string> = {
  Merchandise: "bg-blue-600 border-blue-400/30 text-white",
  Environment: "bg-emerald-600 border-emerald-400/30 text-white",
  "Gift Cards": "bg-purple-600 border-purple-400/30 text-white",
  Experiences: "bg-orange-600 border-orange-400/30 text-white",
  Digital: "bg-indigo-600 border-indigo-400/30 text-white",
  General: "bg-slate-700 border-slate-400/30 text-white",
  Food: "bg-rose-600 border-rose-400/30 text-white",
};

function getCategoryColor(category: string): string {
  return categoryColors[category] || "bg-emerald-600 border-emerald-400/30 text-white";
}

const CATEGORIES = ["All", "Merchandise", "Environment", "Gift Cards", "Food", "Digital"];

export default function RewardPage() {
  const { points: userCredits, setPoints } = usePoints();
  const { toast } = useToast();

  /* ──────────── State ──────────── */

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [redeemedReward, setRedeemedReward] = useState<Reward | null>(null);
  const [redemptionCode, setRedemptionCode] = useState<string>("");
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [history, setHistory] = useState<{
    id: string;
    reward_id: string;
    name: string;
    description: string;
    image_url: string;
    category: string;
    points_required: number;
    date: string;
    code: string;
  }[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const [selectedRedemption, setSelectedRedemption] = useState<{
    id: string;
    reward_id: string;
    name: string;
    description: string;
    image_url: string;
    category: string;
    points_required: number;
    date: string;
    code: string;
  } | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  /* ──────────── Fetch Rewards from API ──────────── */

  const fetchRewards = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchWithAuth("/api/rewards");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch rewards");
      }
      const data = await res.json();
      setRewards(data.rewards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rewards");
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/rewards/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
    fetchHistory();
  }, [fetchRewards, fetchHistory]);

  const handleRetry = () => {
    setIsRetrying(true);
    setLoading(true);
    fetchRewards();
  };

  /* ──────────── Computed values ──────────── */

  const unclaimedRewards = rewards.filter(
    (reward) => (reward as any).allow_multiple || !history.some((h) => h.reward_id === reward.reward_id)
  );

  const filteredRewards = unclaimedRewards.filter((reward) => {
    const matchesCategory = selectedCategory === "All" || reward.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      reward.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reward.company_name && reward.company_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getNextRewardCredits = (credits: number, rewardList: Reward[]) => {
    const upcoming = rewardList.filter((r) => r.points_required > credits).sort((a, b) => a.points_required - b.points_required);
    return upcoming.length > 0 ? upcoming[0].points_required : credits + 100;
  };
  const nextRewardCredits = getNextRewardCredits(userCredits, unclaimedRewards);
  const creditsToNext = Math.max(0, nextRewardCredits - userCredits);

  /* ──────────── Redeem Handler ──────────── */

  const handleRedeem = async (reward: Reward) => {
    if (userCredits < reward.points_required) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${reward.points_required - userCredits} more credits to redeem ${reward.title}. Keep recycling!`,
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);

    try {
      const res = await fetchWithAuth("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reward_id: reward.reward_id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to redeem reward");
      }

      // Update local points
      if (data.newPoints !== undefined) {
        setPoints(data.newPoints);
      }

      const code = data.code || `ECO-${Math.floor(1000 + Math.random() * 9000)}`;

      setRedeemedReward(reward);
      setRedemptionCode(code);
      setIsRedeemDialogOpen(true);
      setIsCelebrating(true);

      // Trigger confetti
      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#fde047", "#0ea5e9", "#ec4899"],
      });

      setTimeout(() => {
        setIsCelebrating(false);
        fetchHistory();
      }, 2600);

      await fetchRewards();
    } catch (err) {
      toast({
        title: "Redemption Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  /* ──────────── Loading State ──────────── */

  if (loading && !isRetrying) {
    return (
      <section className="w-full relative z-10 p-4 max-w-7xl mx-auto">
        <div className="flex flex-col justify-center items-center py-36 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <Sparkles className="w-6 h-6 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-emerald-800 font-bold text-lg animate-pulse">Loading Eco Rewards Catalog...</p>
        </div>
      </section>
    );
  }

  /* ──────────── Render ──────────── */

  return (
    <section className="w-full relative z-10 p-2 md:p-4 max-w-7xl mx-auto">
      <title>Redeem Rewards | Trash2Treasure</title>
      <meta name="description" content="Use your earned recycling credits to redeem exciting prizes." />

      {/* Error / Connection Notice Banner (If Error state) */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-emerald-500/10 border border-rose-200/80 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="p-3.5 rounded-2xl bg-rose-100 text-rose-600 shrink-0 shadow-inner">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-lg font-black text-gray-900">Failed to load rewards live catalog</h4>
              <p className="text-sm text-gray-600 font-medium">{error}. Displaying local preview catalog so you never miss a reward!</p>
            </div>
          </div>
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all shrink-0 gap-2 h-auto cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Connecting..." : "Try Again"}
          </Button>
        </motion.div>
      )}

      {/* Reward Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl flex flex-col md:flex-row items-center p-8 md:p-10 gap-8 mb-10 shadow-2xl relative overflow-hidden"
      >
        {/* Background Decorative Blur Orbs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />

        {/* Left text area */}
        <div className="flex-1 min-w-[240px] z-10 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-extrabold mb-4 shadow-sm border border-white/30">
            <Sparkles className="h-4 w-4 text-yellow-300 fill-yellow-300" /> Eco Impact Store
          </div>
          <h2 className="font-extrabold text-white text-3xl md:text-4xl mb-3 leading-tight drop-shadow-md">
            Turn Your Impact Into Rewards! <Gift className="inline-block h-8 w-8 text-yellow-300 drop-shadow-md ml-1 -mt-1" />
          </h2>
          <p className="text-emerald-50 text-base md:text-lg mb-6 max-w-xl font-medium leading-relaxed drop-shadow-sm">
            Redeem your recycling credits for vouchers, merchandise, eco-products, and native tree planting.
          </p>

          {/* Progress bar box */}
          <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-4 w-full max-w-md shadow-inner">
            <div className="flex justify-between items-center text-sm text-white font-extrabold mb-2.5 drop-shadow-sm">
              <span>{`Next goal: ${creditsToNext} credits away`}</span>
              <span className="text-yellow-300 font-mono text-xs">{userCredits} / {nextRewardCredits}</span>
            </div>
            <div className="w-full bg-emerald-950/40 rounded-full h-3.5 relative overflow-hidden shadow-inner border border-white/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((userCredits / nextRewardCredits) * 100, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="bg-gradient-to-r from-emerald-300 via-teal-200 to-yellow-300 h-full rounded-full shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Right graphic box */}
        <motion.div
          initial={{ scale: 0.9, rotate: -3 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5 }}
          className="shrink-0 flex items-center justify-center z-10"
        >
          <div className="relative w-44 h-44 md:w-56 md:h-56 bg-white/15 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl flex flex-col items-center justify-center p-6 text-center group hover:scale-105 transition-transform">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-yellow-300 to-amber-400 flex items-center justify-center shadow-lg mb-3">
              <Gift className="w-10 h-10 text-emerald-950 drop-shadow-md" />
            </div>
            <span className="text-white font-extrabold text-lg leading-tight drop-shadow-sm">Claim Rewards</span>
            <span className="text-emerald-100 text-xs font-semibold mt-1">Updated Daily</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Rewards Header, Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="font-extrabold text-2xl md:text-3xl bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent mb-1">
            Available Rewards Catalog
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            {filteredRewards.length} reward{filteredRewards.length === 1 ? "" : "s"} found for your balance ({userCredits} Credits)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search rewards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-11 bg-white border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 font-medium shadow-xs"
            />
          </div>

          <Button
            variant="outline"
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold bg-white h-11 rounded-xl shadow-xs shrink-0 cursor-pointer"
            onClick={() => setIsHistoryDialogOpen(true)}
          >
            <History className="w-4.5 h-4.5 mr-2 text-emerald-600" />
            Reward History
          </Button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? "bg-emerald-600 text-white shadow-md scale-105"
                : "bg-white text-gray-600 hover:bg-emerald-50 border border-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      {filteredRewards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-amber-50/70 backdrop-blur-2xl border border-emerald-100 shadow-xl rounded-3xl p-8 md:p-14 text-center overflow-hidden my-6"
        >
          <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 p-0.5 shadow-xl flex items-center justify-center mb-6">
              <div className="w-full h-full bg-white rounded-[1.3rem] flex items-center justify-center">
                <Gift className="h-10 w-10 text-emerald-600" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold mb-3">
              <Award className="h-4 w-4 text-emerald-600" /> Catalog Active & Ready
            </div>

            <h4 className="text-2xl font-black text-gray-900 mb-2">No Matching Rewards Found</h4>
            <p className="text-sm text-gray-600 font-medium leading-relaxed mb-6">
              Try adjusting your category filter or search query. More exciting reward partner offers are added continuously!
            </p>

            <Button
              onClick={() => { setSelectedCategory("All"); setSearchQuery(""); fetchRewards(); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Reset Filters & Refresh
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredRewards.map((reward, i) => {
              const isBannerUrl =
                (reward as any).banner_url?.startsWith("http") ||
                (reward as any).banner_url?.startsWith("/") ||
                reward.image_url.startsWith("http") ||
                reward.image_url.startsWith("/");
              const bannerSource = (reward as any).banner_url || reward.image_url;
              const isLogoUrl = (reward as any).logo_url?.startsWith("http") || (reward as any).logo_url?.startsWith("/");
              const canAfford = userCredits >= reward.points_required;

              return (
                <motion.div
                  key={reward.reward_id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                >
                  <Card className="group flex flex-col h-full bg-white/90 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden border border-emerald-100/70 hover:shadow-2xl transition-all duration-300 relative">
                    {/* Category tag */}
                    <span className={`${getCategoryColor(reward.category)} px-3.5 py-1.5 absolute top-4 left-4 text-xs font-black rounded-full shadow-md z-10 border`}>
                      {reward.category}
                    </span>

                    {/* Stock badge */}
                    {(reward as any).remaining_redemptions !== undefined &&
                      (reward as any).remaining_redemptions > 0 &&
                      (reward as any).remaining_redemptions < 10 && (
                        <span className="bg-amber-500 text-white px-3 py-1 absolute top-4 right-4 text-xs font-bold rounded-full shadow-md z-10">
                          Only {(reward as any).remaining_redemptions} left!
                        </span>
                      )}

                    {/* Banner / Image container */}
                    <div className="relative w-full h-48 bg-gradient-to-tr from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
                      {isBannerUrl ? (
                        <img
                          src={bannerSource}
                          alt={reward.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-7xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                          {reward.image_url}
                        </span>
                      )}
                      {/* Floating company logo */}
                      {isLogoUrl && (
                        <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-md overflow-hidden flex items-center justify-center">
                          <img src={(reward as any).logo_url} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <CardHeader className="pb-2 pt-5 px-6">
                      <div className="min-w-0">
                        {reward.company_name && (
                          <p className="text-xs text-emerald-600 font-extrabold uppercase tracking-wider mb-1">
                            {reward.company_name}
                          </p>
                        )}
                        <CardTitle className="text-xl font-black text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {reward.title}
                        </CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-6 pt-1 flex flex-col flex-1 justify-between">
                      <p className="text-sm text-gray-600 font-medium mb-5 leading-relaxed line-clamp-2">
                        {reward.description}
                      </p>

                      <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Required</span>
                          <span className="text-emerald-700 font-black text-base flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            {reward.points_required} Credits
                          </span>
                        </div>

                        <Button
                          onClick={() => handleRedeem(reward)}
                          disabled={isRedeeming || !canAfford}
                          className={`font-black px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all text-xs cursor-pointer ${
                            canAfford
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed hover:shadow-none"
                          }`}
                        >
                          {isRedeeming ? "..." : canAfford ? "Redeem Now" : "Unlock with Points"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Redeem Success Dialog */}
      <Dialog
        open={isRedeemDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRedeemDialogOpen(false);
            setIsCelebrating(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md text-center border-emerald-100 border-2 shadow-2xl overflow-hidden rounded-3xl p-6">
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          {isCelebrating ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <DialogTitle className="sr-only">Unwrapping Reward</DialogTitle>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-24 h-24 bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-white"
              >
                <Gift className="h-12 w-12 text-white" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Unwrapping your reward...</h3>
                <p className="text-gray-500 font-medium">Making eco-magic happen!</p>
              </motion.div>
            </div>
          ) : (
            <>
              <DialogHeader className="pt-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-md border-4 border-white"
                >
                  <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                </motion.div>
                <DialogTitle className="text-3xl font-black text-center text-gray-900">Congratulations!</DialogTitle>
                <DialogDescription className="text-center text-base mt-2 font-medium text-gray-600">
                  You have successfully claimed <strong className="text-emerald-700">{redeemedReward?.title}</strong>. Thank you for driving sustainable action!
                </DialogDescription>
              </DialogHeader>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-gray-50 border border-gray-200 p-5 rounded-2xl mt-4">
                <p className="text-xs text-gray-500 mb-2 font-extrabold uppercase tracking-widest">Your Unique Voucher Code</p>
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-inner">
                  <p className="text-2xl font-mono font-black text-gray-900 tracking-wider select-all">{redemptionCode}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(redemptionCode);
                      toast({ title: "Copied!", description: "Voucher code copied to clipboard." });
                    }}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg font-bold cursor-pointer"
                  >
                    Copy
                  </Button>
                </div>
              </motion.div>

              <DialogFooter className="mt-6 sm:justify-center">
                <Button onClick={() => setIsRedeemDialogOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full text-base font-bold h-12 rounded-2xl cursor-pointer">
                  Got it, thanks!
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2 text-gray-900">
              <History className="h-6 w-6 text-emerald-600" />
              Reward History
            </DialogTitle>
            <DialogDescription className="text-gray-600 font-medium">
              A complete record of all the rewards you have redeemed.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 pb-4">
            {history.length > 0 ? (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedRedemption(item);
                    setIsDetailsDialogOpen(true);
                  }}
                  className="bg-white border border-gray-200 shadow-xs p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-emerald-300 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer text-left"
                >
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">{item.name}</h4>
                    <p className="text-xs text-gray-500 font-medium mt-1">Claimed on {item.date}</p>
                  </div>
                  <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shrink-0">
                    <span className="font-mono font-bold text-emerald-700 text-sm">{item.code}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Gift className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="font-bold text-gray-700">No redemptions yet</p>
                <p className="text-xs text-gray-500">Keep collecting credits to claim rewards!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Redemption Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md text-center border-emerald-100 border-2 shadow-2xl overflow-hidden rounded-3xl p-6">
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          {selectedRedemption && (
            <>
              <DialogHeader className="pt-4">
                <div className="relative w-20 h-20 mx-auto mb-3 bg-gradient-to-tr from-emerald-50 to-teal-100 flex items-center justify-center rounded-2xl shadow-inner border border-gray-100">
                  <span className="text-4xl">{selectedRedemption.image_url || "🎁"}</span>
                </div>
                <DialogTitle className="text-2xl font-black text-center text-gray-900">
                  {selectedRedemption.name}
                </DialogTitle>
                <DialogDescription className="text-center text-sm mt-2 font-medium text-gray-500 leading-relaxed">
                  {selectedRedemption.description}
                </DialogDescription>
              </DialogHeader>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl mt-4">
                <p className="text-xs text-gray-500 mb-2 font-extrabold uppercase tracking-widest">Redemption Code</p>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-xs">
                  <p className="text-xl font-mono font-black text-gray-900 tracking-wider flex-1 text-center select-all">
                    {selectedRedemption.code}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedRedemption.code);
                      toast({ title: "Copied!", description: "Redemption code copied to clipboard." });
                    }}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg font-bold cursor-pointer"
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-400 font-medium px-1">
                  <span>Date: {selectedRedemption.date}</span>
                  <span>Cost: {selectedRedemption.points_required} credits</span>
                </div>
              </div>

              <DialogFooter className="mt-6 sm:justify-center">
                <Button onClick={() => setIsDetailsDialogOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full font-bold h-11 rounded-xl cursor-pointer">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}