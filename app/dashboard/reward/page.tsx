"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, Star, History, CheckCircle2 } from "lucide-react";
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

const rewards = [
  {
    id: 1,
    name: "Coffee Shop Voucher",
    desc: "₹100 voucher for your favorite coffee chain",
    points: 200,
    img: "/rewards/coffee.jpg",
    tag: { label: "Popular", color: "bg-green-600" },
    available: true,
    creditsText: "200 Credits",
  },
  {
    id: 2,
    name: "Eco Bamboo Bottle",
    desc: "Sustainable bamboo water bottle - 500ml",
    points: 350,
    img: "/rewards/bamboo_v2.png",
    tag: { label: "Eco", color: "bg-blue-500" },
    available: true,
    creditsText: "350 Credits",
  },
  {
    id: "3",
    name: "Shopping Voucher",
    desc: "₹500 off at partner eco-friendly stores",
    points: 1000,
    img: "/rewards/shopping.jpg",
    tag: { label: "Premium", color: "bg-purple-600" },
    available: true,
    creditsText: "1000 Credits",
    claimAction: "Redeem Now",
  },
  {
    id: "4",
    name: "1 Month OTT Pass",
    desc: "Free 1-month subscription to your favorite OTT platform",
    points: 800,
    img: "/rewards/ott_v2.png",
    tag: { label: "Entertainment", color: "bg-blue-600" },
    available: true,
    creditsText: "800 Credits",
    claimAction: "Claim Reward",
  },
  {
    id: "5",
    name: "Starbucks Card",
    desc: "₹250 Starbucks Gift Card for a refreshing treat",
    points: 400,
    img: "/rewards/starbucks.jpg",
    tag: { label: "Cafe", color: "bg-emerald-600" },
    available: true,
    creditsText: "400 Credits",
    claimAction: "Redeem Card",
  },
  {
    id: "6",
    name: "Burger King Meal",
    desc: "Free Whopper meal valid at any Burger King outlet",
    points: 350,
    img: "/rewards/burgerking_v2.png",
    tag: { label: "Food", color: "bg-orange-600" },
    available: true,
    creditsText: "350 Credits",
    claimAction: "Get Meal Code",
  },
  {
    id: "7",
    name: "McDonald's Pass",
    desc: "Enjoy a free McVeggies or Chicken burger",
    points: 300,
    img: "/rewards/mcdonalds.jpg",
    tag: { label: "Food", color: "bg-red-600" },
    available: true,
    creditsText: "300 Credits",
    claimAction: "Claim Offer",
  },
  {
    id: 8,
    name: "Domino's Pizza Pass",
    desc: "Free medium pizza with cheese burst",
    points: 450,
    img: "/rewards/dominos.jpg",
    tag: { label: "Food", color: "bg-orange-500" },
    available: true,
    creditsText: "450 Credits",
  },
];

export default function RewardPage() {
  const { points: userCredits, setPoints } = usePoints();
  const { toast } = useToast();

  const getNextRewardCredits = (credits: number) => {
    const upcoming = rewards.filter(r => r.points > credits).sort((a, b) => a.points - b.points);
    return upcoming.length > 0 ? upcoming[0].points : credits + 100;
  };
  const nextRewardCredits = getNextRewardCredits(userCredits);
  const creditsToNext = Math.max(0, nextRewardCredits - userCredits);

  const [redeemedReward, setRedeemedReward] = useState<any>(null);
  const [redemptionCode, setRedemptionCode] = useState<string>("");
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const [history, setHistory] = useState<any[]>([
    { id: 101, name: "Eco Bamboo Bottle", date: "2026-02-28", code: "ECOB-44D1-9F08" },
    { id: 102, name: "Coffee Shop Voucher", date: "2026-02-15", code: "COFF-78A9-2B3C" },
  ]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const handleRedeem = (reward: any) => {
    if (userCredits < reward.points) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${reward.points - userCredits} more credits to redeem ${reward.name}. Keep recycling!`,
        variant: "destructive",
      });
      return;
    }

    // Deduct points locally
    setPoints(prev => prev - reward.points);

    // Generate a fake code
    const baseCode = reward.name.substring(0, 4).toUpperCase().replace(/\s/g, 'X');
    const code = `${baseCode}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    setRedeemedReward(reward);
    setRedemptionCode(code);
    setIsRedeemDialogOpen(true);
    setIsCelebrating(true);

    // Trigger confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#fde047', '#0ea5e9']
    });

    // Wait for celebration animation before showing the code
    setTimeout(() => {
      setIsCelebrating(false);
      setHistory(prev => [{
        id: Date.now(),
        name: reward.name,
        date: new Date().toISOString().split('T')[0],
        code
      }, ...prev]);
    }, 2800);
  };

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
                animate={{ width: `${(userCredits / nextRewardCredits) * 100}%` }}
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
            <span>Sort by:</span>
            <span className="flex items-center font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition">
              Credits (Low <span className="mx-1">→</span> High)
            </span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {rewards.map((reward, i) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="group flex flex-col h-full bg-glass shadow-xl rounded-2xl overflow-hidden border border-white/50 hover:shadow-2xl transition-all duration-300 relative">
              {/* Tag label */}
              {reward.tag && (
                <span
                  className={`${reward.tag.color} text-white px-4 py-1.5 absolute top-4 left-4 text-xs font-bold rounded-full shadow-md z-10`}
                >
                  {reward.tag.label}
                </span>
              )}
              {/* Reward Image */}
              <div className="relative w-full h-48 bg-gradient-to-tr from-gray-50 to-gray-100">
                <Image
                  src={reward.img}
                  alt={reward.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              {/* Reward Info */}
              <CardHeader className="pb-2 pt-5 px-6">
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                  {reward.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-1 flex flex-col flex-1 justify-between">
                <p className="text-sm text-muted-foreground font-medium mb-4 leading-relaxed line-clamp-2">
                  {reward.desc}
                </p>
                <div className="flex items-center justify-between gap-3 mt-auto">
                  <span className="text-green-700 font-extrabold text-lg flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg">
                    <Star className="h-5 w-5 text-yellow-500 mr-0.5 fill-yellow-500" />
                    {reward.creditsText}
                  </span>
                  <Button
                    onClick={() => handleRedeem(reward)}
                    className="bg-gradient-eco text-white font-bold px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

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
                  You have successfully redeemed <strong className="text-emerald-700">{redeemedReward?.name}</strong>. Enjoy your reward and thank you for making a positive impact!
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
                <p className="font-medium">You haven't claimed any rewards yet.</p>
                <p className="text-sm">Keep earning credits!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}