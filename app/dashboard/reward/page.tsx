"use client";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, Star, History, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
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

  const [history, setHistory] = useState<{ id: string; name: string; date: string; code: string }[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

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

  const getNextRewardCredits = (credits: number) => {
    const upcoming = rewards.filter((r) => r.points_required > credits).sort((a, b) => a.points_required - b.points_required);
    return upcoming.length > 0 ? upcoming[0].points_required : credits + 100;
  };
  const nextRewardCredits = getNextRewardCredits(userCredits);
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

      // Extract real redemption ID
      const realId = data.redemption_id || Math.floor(Math.random() * 10000);
      const code = `RWD-${String(realId).padStart(6, '0')}`;

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
        // Refresh local history list from API directly to ensure DB sync
        fetchHistory();
      }, 2800);

      // Refresh rewards list to update stock
      await fetchRewards();
    } catch (err) {
      toast({
        title: "Reward already Claimed",
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
          <div className="relative w-48 h-48 md:w-56 md:h-56">
            <Image
              src="/rewards/premium_box.png"
              alt="Premium Eco Reward Box"
              fill
              className="object-cover rounded-2xl shadow-xl shadow-black/20 border-2 border-white/20"
              priority
            />
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
            <span>{rewards.length} rewards available</span>
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
      {rewards.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
          <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No rewards available right now</h3>
          <p className="text-gray-400">Check back soon — new rewards are added regularly!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {rewards.map((reward, i) => {
            const isImageUrl = reward.image_url.startsWith("http") || reward.image_url.startsWith("/");
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
                  {reward.stock > 0 && reward.stock < 10 && reward.stock !== 999 && (
                    <span className="bg-amber-500 text-white px-3 py-1 absolute top-4 right-4 text-xs font-bold rounded-full shadow-md z-10">
                      Only {reward.stock} left!
                    </span>
                  )}

                  {/* Reward Image / Emoji */}
                  <div className="relative w-full h-48 bg-gradient-to-tr from-gray-50 to-gray-100 flex items-center justify-center">
                    {isImageUrl ? (
                      <Image
                        src={reward.image_url}
                        alt={reward.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-7xl">{reward.image_url}</span>
                    )}
                  </div>

                  {/* Reward Info */}
                  <CardHeader className="pb-2 pt-5 px-6">
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                      {reward.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-1 flex flex-col flex-1 justify-between">
                    <p className="text-sm text-muted-foreground font-medium mb-4 leading-relaxed line-clamp-2">
                      {reward.description}
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-auto">
                      <span className="text-green-700 font-extrabold text-lg flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg">
                        <Star className="h-5 w-5 text-yellow-500 mr-0.5 fill-yellow-500" />
                        {reward.points_required} Credits
                      </span>
                      <Button
                        onClick={() => handleRedeem(reward)}
                        disabled={isRedeeming || !canAfford}
                        className={`font-bold px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all
                          ${canAfford
                            ? "bg-gradient-eco text-white"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed hover:shadow-none"
                          }`}
                      >
                        {isRedeeming ? "..." : canAfford ? "Redeem" : "Not enough"}
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
                <div key={item.id} className="bg-white border border-gray-100 shadow-sm p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-emerald-200 hover:shadow-md transition-all">
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
    </section>
  );
}