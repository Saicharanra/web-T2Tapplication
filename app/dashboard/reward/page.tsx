"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, Star, History, CheckCircle2, Loader2, AlertCircle, Sparkles, RefreshCw, Recycle, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
}

/* ──────────────── Tag colors per category ──────────────── */

const categoryColors: Record<string, string> = {
  Merchandise: "bg-blue-500",
  Environment: "bg-green-600",
  "Gift Cards": "bg-purple-600",
  Experiences: "bg-orange-600",
  Digital: "bg-indigo-600",
  General: "bg-gray-600",
  Food: "bg-red-600",
};

function getCategoryColor(category: string): string {
  return categoryColors[category] || "bg-emerald-600";
}

export default function RewardPage() {
  const { points: userCredits, setPoints } = usePoints();
  const { toast } = useToast();

  /* ──────────── State ──────────── */

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  /* ──────────── Computed values ──────────── */

  const unclaimedRewards = rewards.filter(
    (reward) => (reward as any).allow_multiple || !history.some((h) => h.reward_id === reward.reward_id)
  );

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
      setPoints(data.newPoints);

      const code = data.code;

      setRedeemedReward(reward);
      setRedemptionCode(code);
      setIsRedeemDialogOpen(true);
      setIsCelebrating(true);

      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#fde047", "#0ea5e9"],
      });

      setTimeout(() => {
        setIsCelebrating(false);
        fetchHistory();
      }, 2800);

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

  if (loading) {
    return (
      <section className="w-full relative z-10 p-2">
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <span className="ml-3 text-gray-500 font-medium">Loading rewards...</span>
        </div>
      </section>
    );
  }

  /* ──────────── Error State ──────────── */

  if (error) {
    return (
      <section className="w-full relative z-10 p-2">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-12 text-center">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-rose-700 mb-2">Failed to load rewards</h3>
          <p className="text-rose-600 mb-4">{error}</p>
          <Button onClick={() => { setLoading(true); fetchRewards(); }} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  /* ──────────── Render ──────────── */

  return (
    <section className="w-full relative z-10 p-2">
      <title>Redeem Rewards | Trash2Treasure</title>
      <meta name="description" content="Use your earned recycling credits to redeem exciting prizes." />
      {/* Reward Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-2xl flex flex-col md:flex-row items-center p-8 gap-8 mb-12 shadow-2xl relative overflow-hidden"
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none" />

        {/* Left text area */}
        <div className="flex-1 min-w-[230px] z-10">
          <h2 className="font-extrabold text-white text-2xl md:text-3xl mb-2 flex items-center gap-2 drop-shadow-md">
            Turn Your Impact Into Rewards! <Gift className="inline-block h-8 w-8 text-yellow-300 drop-shadow-md ml-1 -mt-1" />
          </h2>
          <p className="text-white/90 text-sm md:text-lg mb-6 max-w-lg drop-shadow-sm">
            Redeem your credits for amazing, premium eco-friendly rewards and keep making a difference.
          </p>
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-4 w-full max-w-sm shadow-inner">
            <div className="text-sm text-white font-bold mb-3 drop-shadow-sm">
              {`You're just ${creditsToNext} credits away from your next reward`}
            </div>
            <div className="w-full bg-[#10b981] rounded-full h-3 relative overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((userCredits / nextRewardCredits) * 100, 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="bg-gradient-to-r from-[#bbf7d0] to-[#fde047] h-full rounded-full"
              />
            </div>
          </div>
        </div>
        {/* Right image area */}
        <motion.div
          initial={{ scale: 0.9, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5 }}
          className="shrink-0 flex items-center justify-center z-10"
        >
          <div className="relative w-48 h-48 md:w-56 md:h-56 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden flex items-center justify-center">
            <Gift className="w-28 h-28 text-white drop-shadow-lg" />
          </div>
        </motion.div>
      </motion.div>

      {/* Rewards Header & Progress */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8 pl-1">
        <div>
          <h2 className="font-extrabold text-2xl md:text-3xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
            Available Premium Rewards
          </h2>
          <div className="flex items-center text-sm text-gray-500 gap-2 font-medium">
            <span>{unclaimedRewards.length} rewards available</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold bg-white"
          onClick={() => setIsHistoryDialogOpen(true)}
        >
          <History className="w-5 h-5 mr-2" />
          Reward History
        </Button>
      </div>

      {/* Rewards Grid */}
      {unclaimedRewards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-amber-50/80 backdrop-blur-2xl border border-emerald-100/80 shadow-2xl rounded-[2.5rem] p-8 md:p-14 text-center overflow-hidden my-6"
        >
          {/* Decorative background ambient glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Central Floating Badge */}
          <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-400 p-0.5 shadow-xl flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-[1.4rem] flex items-center justify-center relative overflow-hidden">
                  <Gift className="h-12 w-12 text-emerald-600 drop-shadow-sm" />
                </div>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 p-2 rounded-full shadow-md"
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
            </div>

            {/* Badge Pill */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-bold mb-4 shadow-sm">
              <Award className="h-4 w-4 text-emerald-600" /> Catalog Restocking Soon
            </div>

            {/* Title */}
            <h3 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-700 bg-clip-text text-transparent mb-3">
              No Active Rewards Right Now
            </h3>

            {/* Subtext */}
            <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed mb-6">
              You&apos;ve cleared the current catalog! Our partner eco-businesses are uploading new gift cards, vouchers, and exclusive merchandise.
            </p>

            {/* Micro action / Tip box */}
            <div className="bg-white/90 backdrop-blur-md border border-emerald-100 rounded-2xl p-4 w-full shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                  <Recycle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Keep Collecting Credits</p>
                  <p className="text-[11px] text-gray-500">Every recycled item increases your balance so you can claim rewards fast!</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRewards}
                className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0 font-bold text-xs shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh List
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {unclaimedRewards.map((reward, i) => {
            const isBannerUrl = (reward as any).banner_url?.startsWith("http") || (reward as any).banner_url?.startsWith("/") || reward.image_url.startsWith("http") || reward.image_url.startsWith("/");
            const bannerSource = (reward as any).banner_url || reward.image_url;
            const isLogoUrl = (reward as any).logo_url?.startsWith("http") || (reward as any).logo_url?.startsWith("/");
            const canAfford = userCredits >= reward.points_required;

            return (
              <motion.div
                key={reward.reward_id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className="group flex flex-col h-full bg-glass shadow-xl rounded-2xl overflow-hidden border border-white/50 hover:shadow-2xl transition-all duration-300 relative">
                  {/* Category tag */}
                  <span className={`${getCategoryColor(reward.category)} text-white px-4 py-1.5 absolute top-4 left-4 text-xs font-bold rounded-full shadow-md z-10`}>
                    {reward.category}
                  </span>

                  {/* Stock badge */}
                  {(reward as any).remaining_redemptions !== undefined && (reward as any).remaining_redemptions > 0 && (reward as any).remaining_redemptions < 10 && (
                    <span className="bg-amber-500 text-white px-3 py-1 absolute top-4 right-4 text-xs font-bold rounded-full shadow-md z-10">
                      Only {(reward as any).remaining_redemptions} left!
                    </span>
                  )}

                  {/* Reward Banner Image */}
                  <div className="relative w-full h-48 bg-gradient-to-tr from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                    {isBannerUrl ? (
                      <img
                        src={bannerSource}
                        alt={reward.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-7xl">{reward.image_url}</span>
                    )}
                    {/* Floating company logo */}
                    {isLogoUrl && (
                      <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-lg overflow-hidden flex items-center justify-center">
                        <img src={(reward as any).logo_url} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Reward Info */}
                  <CardHeader className="pb-2 pt-5 px-6">
                    <div className="min-w-0">
                      {(reward as any).company_name && (
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">{(reward as any).company_name}</p>
                      )}
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors mt-0.5">
                        {reward.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-1 flex flex-col flex-1 justify-between">
                    <p className="text-sm text-muted-foreground font-medium mb-4 leading-relaxed line-clamp-2">
                      {reward.description}
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-auto">
                      <span className="text-green-700 font-extrabold text-sm flex items-center gap-1 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100/50 shadow-sm shrink-0">
                        <Star className="h-4.5 w-4.5 text-yellow-500 mr-0.5 fill-yellow-500" />
                        {reward.points_required} Credits
                      </span>
                      <Button
                        onClick={() => handleRedeem(reward)}
                        disabled={isRedeeming || !canAfford}
                        className={`font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all
                          ${canAfford
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed hover:shadow-none"
                          }`}
                      >
                        {isRedeeming ? "..." : canAfford ? "Redeem" : "Redeem to Unlock"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Redeem Success Dialog */}
      <Dialog open={isRedeemDialogOpen} onOpenChange={(open) => {
        if (!open) { setIsRedeemDialogOpen(false); setIsCelebrating(false); }
      }}>
        <DialogContent className="sm:max-w-md text-center border-emerald-100 border-2 shadow-2xl overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-eco" />

          {isCelebrating ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <DialogTitle className="sr-only">Unwrapping Reward</DialogTitle>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white"
              >
                <Gift className="h-12 w-12 text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Unwrapping your reward...</h3>
                <p className="text-gray-500">Making some eco-magic happen!</p>
              </motion.div>
            </div>
          ) : (
            <>
              <DialogHeader className="pt-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-md border-4 border-white"
                >
                  <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                </motion.div>
                <DialogTitle className="text-3xl font-extrabold text-center text-gray-900">Congratulations!</DialogTitle>
                <DialogDescription className="text-center text-lg mt-3 font-medium text-gray-600">
                  You have successfully redeemed <strong className="text-emerald-700">{redeemedReward?.title}</strong>. Enjoy your reward and thank you for making a positive impact!
                </DialogDescription>
              </DialogHeader>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 border border-gray-200 p-5 rounded-xl mt-6"
              >
                <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-widest">Your Unique Redemption Code</p>
                <p className="text-3xl font-mono font-bold text-gray-900 tracking-wider bg-white py-3 rounded-lg border border-gray-100 shadow-sm">{redemptionCode}</p>
              </motion.div>
              <DialogFooter className="mt-8 sm:justify-center">
                <Button onClick={() => setIsRedeemDialogOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto px-10 text-lg font-bold h-12 rounded-xl">
                  Got it, thanks!
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <History className="h-6 w-6 text-emerald-600" />
              Reward History
            </DialogTitle>
            <DialogDescription className="text-gray-600 font-medium">
              A record of all the rewards you have successfully claimed.
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
                  className="bg-white border border-gray-100 shadow-sm p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-emerald-200 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer text-left"
                >
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-1">Claimed on {item.date}</p>
                  </div>
                  <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 shrink-0">
                    <span className="font-mono font-bold text-emerald-700">{item.code}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Gift className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="font-medium">You haven&apos;t claimed any rewards yet.</p>
                <p className="text-sm">Keep earning credits!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Redemption Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md text-center border-emerald-100 border-2 shadow-2xl overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-eco" />
          
          {selectedRedemption && (
            <>
              <DialogHeader className="pt-6">
                <div className="relative w-24 h-24 mx-auto mb-4 bg-gradient-to-tr from-gray-50 to-gray-100 flex items-center justify-center rounded-2xl shadow-inner border border-gray-100 overflow-hidden">
                  {selectedRedemption.image_url && (selectedRedemption.image_url.startsWith("http") || selectedRedemption.image_url.startsWith("/")) ? (
                    <Image
                      src={selectedRedemption.image_url}
                      alt={selectedRedemption.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-5xl">{selectedRedemption.image_url || "🎁"}</span>
                  )}
                </div>
                <DialogTitle className="text-2xl font-extrabold text-center text-gray-900">
                  {selectedRedemption.name}
                </DialogTitle>
                <div className="flex justify-center mt-1">
                  <span className={`${getCategoryColor(selectedRedemption.category)} text-white px-3 py-1 text-xs font-bold rounded-full shadow-sm`}>
                    {selectedRedemption.category}
                  </span>
                </div>
                <DialogDescription className="text-center text-sm mt-3 font-medium text-gray-500 px-2 leading-relaxed">
                  {selectedRedemption.description}
                </DialogDescription>
              </DialogHeader>

              <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl mt-4">
                <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-widest">Redemption Code</p>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider flex-1 text-center select-all">
                    {selectedRedemption.code}
                  </p>
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedRedemption.code);
                      toast({
                        title: "Copied!",
                        description: "Redemption code copied to clipboard.",
                      });
                    }}
                    className="h-10 w-10 p-0 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-3a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M19.5 7.875c0-.621-.504-1.125-1.125-1.125H12.75c-.621 0-1.125.504-1.125 1.125v12.375c0 .621.504 1.125 1.125 1.125h5.625c.621 0 1.125-.504 1.125-1.125V7.875z"
                      />
                    </svg>
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-400 font-medium px-1">
                  <span>Redeemed on {selectedRedemption.date}</span>
                  <span>Cost: {selectedRedemption.points_required} credits</span>
                </div>
              </div>

              <DialogFooter className="mt-6 sm:justify-center">
                <Button onClick={() => setIsDetailsDialogOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto px-10 text-base font-bold h-11 rounded-xl">
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