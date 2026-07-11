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
  Check,
  Copy,
  Twitter,
  Facebook,
  MessageCircle,
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [previewStageIndex, setPreviewStageIndex] = useState<number | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState<Record<string, boolean>>({});

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

  // Generate days of the month for the visual streak calendar
  const getCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // First day of current month (0 = Sunday, 1 = Monday, etc.)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Number of days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: { dayNumber: number | null; isActive: boolean; isToday: boolean }[] = [];
    
    // Prefix empty days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, isActive: false, isToday: false });
    }
    
    // Days of the month
    const currentDay = today.getDate();
    for (let d = 1; d <= totalDays; d++) {
      // Determine if this day is part of the streak.
      const isActive = streak > 0 && d <= currentDay && d > currentDay - streak;
      const isToday = d === currentDay;
      days.push({ dayNumber: d, isActive, isToday });
    }
    
    return days;
  };

  const getMonthName = () => {
    return new Date().toLocaleString("default", { month: "long" });
  };

  const toggleEventRegistration = (eventId: string) => {
    setRegisteredEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const shareText = `I've maintained a ${streak}-day green streak on Trash2Treasure! My EcoTree has grown to a ${currentStage.name} ${currentStage.emoji}. Join me in making the planet greener! ♻️🌱`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

          <div className="px-3 py-1.5 rounded-full bg-white text-orange-500 font-bold shadow-sm flex items-center gap-1 select-none">
            <span>🔥</span>
            <span>{streak} Days</span>
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
              className={`text-[120px] select-none ${
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
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-green-100/30">
          <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
            <span>Progress</span>
            <span>
              {nextStage ? `Next: ${nextStage.name}` : "Max reached"}
            </span>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalLifeProgress}%` }}
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
            />
          </div>

          {/* ✅ FIXED STEPPER */}
          <div className="flex justify-between px-1 relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -z-10 -translate-y-1/2" />

            {TREE_STAGES.map((stage, index) => {
              const isPast = actualStageIndex >= index;
              const isActive = activeStageIndex === index;

              return (
                <motion.div
                  key={stage.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                  className="flex flex-col items-center gap-1 z-10 cursor-pointer transition"
                  onClick={() =>
                    setPreviewStageIndex(
                      index === actualStageIndex ? null : index
                    )
                  }
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                      isActive
                        ? "bg-green-100 ring-2 ring-green-400 scale-110 shadow-sm"
                        : isPast
                        ? "bg-green-50/80 border border-green-100"
                        : "bg-gray-50 opacity-40 border border-gray-100"
                    }`}
                  >
                    {stage.emoji}
                  </div>
                  <span className={`text-[10px] font-semibold ${isActive ? "text-green-700 font-bold" : "text-gray-500"}`}>
                    {stage.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Next Stage */}
        {nextStage && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100/50 p-3 rounded-xl text-center mb-6 text-xs font-semibold text-green-800 flex items-center justify-center gap-1.5 select-none">
            <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>Next milestone in {daysToNextStage} days</span>
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="w-full">
            <Button 
              onClick={() => setShowCalendar(true)} 
              variant="outline" 
              className="w-full flex flex-col sm:flex-row items-center justify-center gap-1.5 py-6 h-auto hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 border-green-100/50 hover:border-green-200 transition-all rounded-xl shadow-sm"
            >
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold">Events</span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="w-full">
            <Button 
              onClick={() => setShowShare(true)} 
              variant="outline" 
              className="w-full flex flex-col sm:flex-row items-center justify-center gap-1.5 py-6 h-auto hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 border-green-100/50 hover:border-green-200 transition-all rounded-xl shadow-sm"
            >
              <Share2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold">Share</span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="w-full">
            <Button 
              onClick={() => setShowRules(true)} 
              variant="outline" 
              className="w-full flex flex-col sm:flex-row items-center justify-center gap-1.5 py-6 h-auto hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 border-green-100/50 hover:border-green-200 transition-all rounded-xl shadow-sm"
            >
              <AlertCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold">Rules</span>
            </Button>
          </motion.div>
        </div>

      </CardContent>

      {/* Calendar & Events Dialog */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl p-6 shadow-xl border border-green-100 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-600" />
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Calendar className="h-5 w-5 text-green-600" />
              Streak Calendar & Eco-Events
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              Keep your recycling streak going to grow your tree and unlock extra rewards!
            </DialogDescription>
          </DialogHeader>

          {/* Month & Stats */}
          <div className="flex justify-between items-center bg-green-50/50 border border-green-100 rounded-xl p-3 mb-4 select-none">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Current Month</span>
              <h4 className="text-sm font-bold text-green-800 leading-tight">{getMonthName()} {new Date().getFullYear()}</h4>
            </div>
            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-1 px-3 rounded-full text-xs shadow-sm">
              🔥 {streak} Day Streak
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 mb-5 select-none">
            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {getCalendarDays().map((day, idx) => (
                <div
                  key={idx}
                  className={`h-8 flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                    day.dayNumber === null
                      ? ""
                      : day.isActive
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm shadow-green-500/20 scale-105"
                      : day.isToday
                      ? "bg-white border border-green-500 text-green-600 font-bold"
                      : "bg-white border border-gray-100 hover:border-gray-200 text-gray-600"
                  }`}
                >
                  {day.dayNumber}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Eco Events */}
          <div>
            <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Upcoming Eco-Events (Bonus Points!)
            </h4>
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
              {[
                {
                  id: "cleanup",
                  title: "Green Neighborhood Cleanup",
                  date: "Saturday, July 18",
                  time: "9:00 AM - 12:00 PM",
                  location: "Central Park Community Center",
                  points: "+50 pts",
                  icon: "🧹",
                },
                {
                  id: "ewaste",
                  title: "E-Waste Recycling Drive",
                  date: "Wednesday, July 22",
                  time: "10:00 AM - 4:00 PM",
                  location: "Eco-Hub Parking Lot",
                  points: "+30 pts",
                  icon: "🔌",
                },
                {
                  id: "webinar",
                  title: "Composting & Zero Waste Webinar",
                  date: "Friday, July 24",
                  time: "6:00 PM - 7:30 PM",
                  location: "Zoom Online",
                  points: "+20 pts",
                  icon: "💻",
                },
              ].map((evt) => {
                const isRegistered = registeredEvents[evt.id];
                return (
                  <div
                    key={evt.id}
                    className="flex gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-green-100 hover:shadow-sm transition-all"
                  >
                    <span className="text-2xl select-none">{evt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h5 className="font-bold text-xs text-gray-900 leading-tight truncate">{evt.title}</h5>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md shrink-0">
                          {evt.points}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">{evt.date} • {evt.time}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{evt.location}</p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant={isRegistered ? "default" : "outline"}
                        onClick={() => toggleEventRegistration(evt.id)}
                        className={`h-7 px-2.5 text-[10px] font-bold rounded-lg shrink-0 ${
                          isRegistered
                            ? "bg-green-600 hover:bg-green-700 text-white border-transparent"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {isRegistered ? "Registered" : "Register"}
                      </Button>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="sm:max-w-[420px] bg-white rounded-2xl p-6 shadow-xl border border-green-100 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-600" />
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Share2 className="h-5 w-5 text-green-600" />
              Share Your EcoTree
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              Show off your streak and inspire others to recycle!
            </DialogDescription>
          </DialogHeader>

          {/* Social Card Preview */}
          <div className="relative bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 text-white rounded-2xl p-5 mb-5 shadow-inner overflow-hidden flex flex-col items-center text-center select-none">
            {/* Decorative background elements */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-emerald-400/20 rounded-full blur-2xl" />

            <div className="text-7xl mb-4 animate-bounce select-none">
              {currentStage.emoji}
            </div>
            
            <span className="text-xs uppercase tracking-widest bg-white/20 backdrop-blur-md py-1 px-3 rounded-full font-bold mb-2">
              {currentStage.name} Level
            </span>
            
            <h4 className="text-xl font-black mb-1 drop-shadow-sm truncate max-w-full px-2">
              &ldquo;{treeName}&rdquo;
            </h4>
            
            <p className="text-sm font-semibold text-emerald-100 flex items-center gap-1 mb-4">
              🔥 {streak} Days Green Streak
            </p>

            <div className="w-full h-px bg-white/20 my-2" />
            
            <div className="flex items-center gap-1.5 text-xs text-white/90">
              <span>Growing daily on Trash2Treasure</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 w-full">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full">
                <Button
                  onClick={handleCopy}
                  className={`w-full gap-2 rounded-xl h-11 text-xs font-semibold transition-all border-0 ${
                    copied
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Status Text"}
                </Button>
              </motion.div>
            </div>

            <div className="w-full h-px bg-gray-100 my-2" />

            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-700 hover:text-blue-500 hover:border-blue-200 transition-all group"
              >
                <Twitter className="w-5 h-5 text-gray-500 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                <span className="text-[10px] font-bold">Twitter / X</span>
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-700 hover:text-green-500 hover:border-green-200 transition-all group"
              >
                <MessageCircle className="w-5 h-5 text-gray-500 group-hover:text-green-500 group-hover:scale-110 transition-all" />
                <span className="text-[10px] font-bold">WhatsApp</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://trash2treasure.com")}&quote=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-700 hover:text-blue-600 hover:border-blue-200 transition-all group"
              >
                <Facebook className="w-5 h-5 text-gray-500 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                <span className="text-[10px] font-bold">Facebook</span>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rules & Milestones Dialog */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="sm:max-w-[460px] bg-white rounded-2xl p-6 shadow-xl border border-green-100 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-600" />
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <AlertCircle className="h-5 w-5 text-green-600" />
              EcoTree Growth Rules
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              Learn how to grow your EcoTree and claim rewards.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Rules list */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
            <h4 className="font-bold text-xs text-green-800 uppercase tracking-wider mb-2 select-none">How to Maintain Your Streak:</h4>
            <ul className="space-y-2 text-xs text-green-950 font-medium">
              <li className="flex gap-2 items-start">
                <span className="text-green-600 font-bold">1.</span>
                <span>Submit a new recycling entry daily in the Scanner tab.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-green-600 font-bold">2.</span>
                <span>Once verified by admins, your streak is extended.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-green-600 font-bold">3.</span>
                <span>Each day without a verified submission will reset your streak to 0.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-green-600 font-bold">4.</span>
                <span>Unlock larger badges, level titles, and secret multipliers at higher stages!</span>
              </li>
            </ul>
          </div>

          {/* Milestone List */}
          <div>
            <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-1.5 select-none">
              <Trophy className="w-4 h-4 text-amber-500" />
              EcoTree Milestones
            </h4>
            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {TREE_STAGES.map((stage, idx) => {
                const isActive = actualStageIndex === idx;
                return (
                  <div
                    key={stage.name}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isActive
                        ? "bg-green-50 border-green-300 ring-1 ring-green-400"
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl select-none">{stage.emoji}</span>
                      <div>
                        <h5 className="font-bold text-xs text-gray-900">{stage.name}</h5>
                        <p className="text-[10px] text-gray-400">
                          {stage.min} - {stage.max} Days streak
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider select-none">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </Card>
  );
}