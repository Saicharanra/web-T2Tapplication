"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Share2,
  Trophy,
  Pencil,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// 🌱 Tree Stages
const TREE_STAGES = [
  { name: "Seed", min: 0, max: 3, emoji: "🌰" },
  { name: "Sprout", min: 4, max: 10, emoji: "🌱" },
  { name: "Plant", min: 11, max: 20, emoji: "🌿" },
  { name: "Tree", min: 21, max: 60, emoji: "🌳" },
  { name: "LifeTree", min: 61, max: 90, emoji: "🌲" },
];

export function MyEcoTree({ streak = 0 }: { streak?: number }) {
  const [treeName, setTreeName] = useState("MyEcoTree");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [previewStageIndex, setPreviewStageIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("t2t_treeName");
    if (savedName) setTreeName(savedName);
  }, []);

  const handleSaveName = () => {
    localStorage.setItem("t2t_treeName", treeName || "MyEcoTree");
    setIsEditingName(false);
  };

  const currentStageIndex = TREE_STAGES.findIndex(
    (stage) => streak >= stage.min && streak <= stage.max
  );
  const actualStageIndex =
    currentStageIndex === -1 ? TREE_STAGES.length - 1 : currentStageIndex;

  const activeStageIndex =
    previewStageIndex !== null ? previewStageIndex : actualStageIndex;

  const currentStage = TREE_STAGES[activeStageIndex];

  useEffect(() => {
    if (previewStageIndex !== null) {
      const timer = setTimeout(() => setPreviewStageIndex(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [previewStageIndex]);

  const nextStage =
    activeStageIndex < TREE_STAGES.length - 1
      ? TREE_STAGES[activeStageIndex + 1]
      : null;

  const daysToNextStage = nextStage ? nextStage.min - streak : 0;
  const totalLifeProgress = Math.min((streak / 90) * 100, 100);
  const isDull = streak === 0;

  return (
    <Card className="bg-gradient-to-b from-green-50 to-emerald-50/30 border-green-100 shadow-md relative overflow-hidden">

      {/* Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-300/20 blur-[80px]" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200/20 blur-[60px]" />

      <CardContent className="p-6 relative z-10">

        {/* Header */}
        <div className="flex justify-between mb-6">
          <div>
            {isEditingName ? (
              <Input
                value={treeName}
                onChange={(e) => setTreeName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                autoFocus
                className="h-8 max-w-[150px]"
              />
            ) : (
              <h3
                className="text-xl font-bold cursor-pointer flex gap-2"
                onClick={() => setIsEditingName(true)}
              >
                {treeName}
                <Pencil className="w-4 h-4 opacity-50" />
              </h3>
            )}
            <p className="text-sm text-gray-500">
              Your personal impact, growing daily
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-white text-orange-500 font-bold">
            🔥 {streak} Days
          </div>
        </div>

        {/* Tree */}
        <div className="flex flex-col items-center py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage.name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className={`text-[120px] ${
                isDull && previewStageIndex === null
                  ? "grayscale opacity-70"
                  : ""
              }`}
            >
              {currentStage.emoji}
            </motion.div>
          </AnimatePresence>

          <p className="text-2xl font-bold mt-4">
            {currentStage.name}
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>
              {nextStage ? `Next: ${nextStage.name}` : "Max reached"}
            </span>
          </div>

          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalLifeProgress}%` }}
              className="h-full bg-green-500"
            />
          </div>

          {/* ✅ FIXED STEPPER */}
          <div className="flex justify-between px-1 relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -z-10 -translate-y-1/2" />

            {TREE_STAGES.map((stage, index) => {
              const isPast = actualStageIndex >= index;
              const isActive = activeStageIndex === index;

              return (
                <div
                  key={stage.name}
                  className="flex flex-col items-center gap-1 z-10 cursor-pointer hover:scale-105 transition"
                  onClick={() =>
                    setPreviewStageIndex(
                      index === actualStageIndex ? null : index
                    )
                  }
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      isActive
                        ? "bg-green-100 ring-2 ring-green-400 scale-110"
                        : isPast
                        ? "bg-green-50"
                        : "bg-gray-50 opacity-40"
                    }`}
                  >
                    {stage.emoji}
                  </div>
                  <span className="text-[10px]">{stage.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Stage */}
        {nextStage && (
          <div className="bg-green-100 p-3 rounded-lg text-center mb-6">
            <Trophy className="inline w-4 h-4" /> Next in {daysToNextStage} days
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowShare(true)} variant="outline">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowRules(true)} variant="outline">
            <AlertCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}