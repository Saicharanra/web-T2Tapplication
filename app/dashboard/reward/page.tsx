"use client";
import Image from "next/image";
import CoffeeImg from "@/assets/Coffee.png";
import Bamboo from "@/assets/Bamboo.png";
import shopping from "@/assets/shopping.png";
import rewardBanner from "@/assets/gift.png"; 
import { Gift, Star, } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const rewards = [
  {
    id: 1,
    name: "Coffee Shop Voucher",
    desc: "₹100 voucher for your favorite coffee chain",
    points: 200,
    img: CoffeeImg, 
    tag: { label: "Popular", color: "bg-green-600" },
    available: true,
    creditsText: "200 Credits",
  },
  {
    id: 2,
    name: "Eco Bamboo Bottle",
    desc: "Sustainable bamboo water bottle - 500ml",
    points: 350,
    img: Bamboo,
    tag: { label: "Eco", color: "bg-blue-500" },
    available: true,
    creditsText: "350 Credits",
  },
  {
    id: 3,
    name: "Shopping Voucher",
    desc: "₹500 voucher for major shopping malls",
    points: 950,
    img: shopping,
    tag: null,
    available: true,
    creditsText: "950 Credits",
  },
];

const userCredits = 150;
const nextRewardCredits = 200;
const creditsToNext = nextRewardCredits - userCredits;

export default function RewardPage() {
  return (
    <section className="w-full">
      {/* Reward Header Banner */}
      <div className="w-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-xl flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 mb-10">
        {/* Left text area */}
        <div className="flex-1 min-w-[230px]">
          <h2 className="font-extrabold text-white text-lg md:text-2xl mb-1 flex items-center gap-2">
            Turn Your Impact Into Rewards! <Gift className="inline-block h-6 w-6 text-yellow-200 drop-shadow ml-1" />
          </h2>
          <p className="text-white/90 text-sm md:text-base mb-4">
            Redeem your credits for amazing rewards and keep making a difference
          </p>
          <div className="bg-white/30 rounded-lg px-3 py-2 w-full max-w-xs">
            <div className="text-xs text-white font-medium mb-1">
              {`You're just ${creditsToNext} credits away from your next reward`}
            </div>
            <div className="w-full bg-white/40 rounded-full h-2 relative overflow-hidden">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${(userCredits / nextRewardCredits) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        {/* Right image area */}
        <div className="shrink-0 flex items-center justify-center">
          {/* Image shown in the provided screenshot example */}
          <Image
            src={rewardBanner}
            alt="Gifts with recycling icons"
            width={150}
            height={150}
            className="rounded-xl shadow-lg bg-white/20"
            priority
          />
        </div>
      </div>

      {/* Rewards Header & Progress */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h2 className="font-bold text-xl md:text-2xl text-gray-900 mb-1">Available Rewards</h2>
          <div className="flex items-center text-xs text-gray-500 gap-1 font-medium">
            <span>Sort by:</span>
            <span className="flex items-center font-semibold">
              Credits (Low <span className="mx-0.5">→</span> High)
            </span>
          </div>
        </div>
      </div>
      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {rewards.map((reward) => (
          <Card
            key={reward.id}
            className="group relative flex flex-col bg-white shadow-xl rounded-xl overflow-hidden border hover:border-green-500 transition"
          >
            {/* Tag label */}
            {reward.tag && (
              <span
                className={`${reward.tag.color} text-white px-3 py-1 absolute top-3 left-3 text-xs font-semibold rounded-full shadow`}
              >
                {reward.tag.label}
              </span>
            )}
            {/* Reward Image */}
            <div className="flex justify-center items-center bg-gray-50 p-4 h-32">
              <Image
                src={reward.img}
                alt={reward.name}
                width={110}
                height={90}
                className="object-contain h-20 rounded-md"
              />
            </div>
            {/* Reward Info */}
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-base font-bold text-gray-900">{reward.name}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-1">
              <p className="text-sm text-gray-600 mb-2">{reward.desc}</p>
              <div className="flex items-center justify-between flex-wrap gap-3 mt-2">
                <span className="text-green-600 font-bold text-base flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 mr-0.5" />
                  {reward.creditsText}
                </span>
                <Button
                  size="sm"
                  className="bg-green-600 text-white font-semibold px-5 py-1.5 rounded-full shadow hover:bg-green-700 transition"
                >
                  Redeem Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}