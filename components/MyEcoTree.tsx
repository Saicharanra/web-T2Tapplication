"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Share2, Trophy, Pencil, Sparkles, AlertCircle, Info } from "lucide-react";
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

// Define tree stages
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

    // State to handle previewing different stages
    const [previewStageIndex, setPreviewStageIndex] = useState<number | null>(null);

    // Load personalization from local storage if available
    useEffect(() => {
        const savedName = localStorage.getItem("t2t_treeName");
        if (savedName) setTreeName(savedName);
    }, []);

    const handleSaveName = () => {
        localStorage.setItem("t2t_treeName", treeName);
        setIsEditingName(false);
    };

    // Determine actual stage based on streak
    const currentStageIndex = TREE_STAGES.findIndex(
        (stage) => streak >= stage.min && streak <= stage.max
    );
    const actualStageIndex = currentStageIndex === -1 ? TREE_STAGES.length - 1 : currentStageIndex;

    // The currently *shown* stage (either previewed or actual)
    const activeStageIndex = previewStageIndex !== null ? previewStageIndex : actualStageIndex;
    const currentStage = TREE_STAGES[activeStageIndex];

    // Effect to clear preview automatically after a delay
    useEffect(() => {
        if (previewStageIndex !== null) {
            const timer = setTimeout(() => {
                setPreviewStageIndex(null); // Return to default actual stage
            }, 5000); // Wait for 5 seconds before reverting

            return () => clearTimeout(timer);
        }
    }, [previewStageIndex]);

    // Calculate progress to next stage
    const nextStage = activeStageIndex < TREE_STAGES.length - 1 ? TREE_STAGES[activeStageIndex + 1] : null;
    const daysToNextStage = nextStage ? nextStage.min - streak : 0;

    // Progress percentage within the total 90 days
    const totalLifeProgress = Math.min((streak / 90) * 100, 100);

    // Visual state based on streak
    const isDull = streak === 0;

    return (
        <Card className="bg-gradient-to-b from-green-50 to-emerald-50/30 border-green-100 shadow-md relative overflow-hidden transition-all duration-500">

            {/* Background soft glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-300/20 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200/20 blur-[60px] rounded-full pointer-events-none" />

            <CardContent className="p-6 relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 group">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={treeName}
                                        onChange={(e) => setTreeName(e.target.value)}
                                        className="h-8 max-w-[150px] bg-white border-green-200"
                                        autoFocus
                                        onBlur={handleSaveName}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    />
                                </div>
                            ) : (
                                <h3 className="text-xl font-bold border-b-2 border-transparent hover:border-green-200 cursor-pointer flex items-center gap-2 text-gray-800 transition-all" onClick={() => setIsEditingName(true)}>
                                    {treeName} <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity" />
                                </h3>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Your personal impact, growing every day</p>
                    </div>

                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold shadow-sm ${streak > 0 ? 'bg-white text-orange-500 border border-orange-100' : 'bg-gray-100 text-gray-500'}`}
                    >
                        🔥 {streak} Days
                    </motion.div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${streak > 0 ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`} />
                    <span className={`text-sm font-medium ${streak > 0 ? 'text-green-700' : 'text-orange-600'}`}>
                        {streak > 0 ? "Your EcoTree is growing" : "Your streak broke! Start again."}
                    </span>
                </div>

                {/* Tree Visualization (Center) */}
                <div className="relative py-12 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStage.name}
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                                y: [0, -10, 0]
                            }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            transition={{
                                y: {
                                    repeat: Infinity,
                                    duration: 4,
                                    ease: "easeInOut"
                                },
                                scale: { type: "spring", bounce: 0.5 },
                                opacity: { duration: 0.3 }
                            }}
                            className={`relative text-[120px] leading-none drop-shadow-2xl z-10 ${isDull && previewStageIndex === null ? 'grayscale opacity-80' : ''} ${previewStageIndex !== null ? 'drop-shadow-[0_0_40px_rgba(74,222,128,0.6)] scale-110' : ''}`}
                        >
                            {currentStage.emoji}

                            {/* Sparkles animation if active OR previewing */}
                            {(streak > 0 || previewStageIndex !== null) && (
                                <>
                                    <motion.div
                                        animate={{ y: [0, -10, 0], opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 2, delay: 0.1 }}
                                        className="absolute top-0 right-0 text-3xl text-yellow-400 pointer-events-none"
                                    >
                                        ✨
                                    </motion.div>
                                    <motion.div
                                        animate={{ y: [0, -15, 0], opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 2.5, delay: 0.8 }}
                                        className="absolute bottom-4 left-[-20px] text-2xl text-yellow-400 pointer-events-none"
                                    >
                                        ✨
                                    </motion.div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <motion.p
                        className={`text-2xl font-bold mt-4 ${previewStageIndex !== null ? "text-gray-500" : "text-green-800"}`}
                        key={currentStage.name + "text"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {currentStage.name} {previewStageIndex !== null && <span className="text-sm font-normal block text-center">(Preview)</span>}
                    </motion.p>
                </div>

                {/* Life Progress Box */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 mb-4 shadow-sm border border-white/60">
                    <div className="flex justify-between text-sm mb-2 font-medium">
                        <span className="text-gray-700">Life Progress</span>
                        <span className="text-gray-500">
                            {nextStage ? `Next: ${nextStage.name}` : "Max Stage Reached!"}
                        </span>
                    </div>

                    {/* Custom Progress Bar */}
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${totalLifeProgress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                        />
                    </div>

                    {/* Stepper bubbles */}
                    <div className="flex justify-between px-1 relative">
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -z-10 -translate-y-1/2" />

                        {TREE_STAGES.map((stage, index) => {
                            const isPastOrEarned = actualStageIndex >= index;
                            const isCurrentlyShown = activeStageIndex === index;
                            return (
                                <div
                                    key={stage.name}
                                    className={`flex flex-col items-center gap-1 z-10 bg-white/50 rounded-full p-1 cursor-pointer transition-transform hover:scale-105 ${isCurrentlyShown && previewStageIndex !== null ? "ring-2 ring-gray-300" : ""}`}
                                    onClick={() => setPreviewStageIndex(index === actualStageIndex ? null : index)}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isCurrentlyShown ? 'bg-green-100 ring-2 ring-green-400 shadow-md transform scale-110'
                                        : isPastOrEarned ? 'bg-green-50 opacity-100' : 'bg-gray-50 opacity-40 grayscale hover:grayscale-0'
                                        }`}>
                                        {stage.emoji}
                                    </div>
                                    <span className={`text-[10px] font-medium ${isCurrentlyShown ? 'text-green-700' : isPastOrEarned ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {stage.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Countdown to next stage */}
                {nextStage && (
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-3 flex justify-center items-center gap-2 font-semibold text-green-800 mb-6 shadow-sm">
                        <Trophy className="w-5 h-5 text-green-600" />
                        <span>Next Growth Stage in {daysToNextStage} Day{daysToNextStage !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* Motivational Message */}
                <div className="text-center mb-6">
                    <p className="text-gray-600 italic font-medium">"Care daily, grow forever 🌱"</p>
                    <p className="text-sm text-gray-500 mt-1">Consistency builds life. Don't break the streak.</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                    <Button variant="outline" className="bg-white hover:bg-green-50 hover:text-green-700 border-green-100 flex flex-col items-center h-auto py-3 gap-1 shadow-sm">
                        <Calendar className="w-5 h-5" />
                        <span className="text-xs">History</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-white hover:bg-green-50 hover:text-green-700 border-green-100 flex flex-col items-center h-auto py-3 gap-1 shadow-sm"
                        onClick={() => setShowShare(true)}
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="text-xs">Share</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-white hover:bg-green-50 hover:text-green-700 border-green-100 flex flex-col items-center h-auto py-3 gap-1 shadow-sm"
                        onClick={() => setShowRules(true)}
                    >
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-xs">Rules</span>
                    </Button>
                </div>
            </CardContent>

            {/* Rules Dialog */}
            <Dialog open={showRules} onOpenChange={setShowRules}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-green-500" />
                            LifeTree Rules
                        </DialogTitle>
                        <DialogDescription>
                            How to grow your tree and make a real-world impact.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-3 items-start p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl">🌱</div>
                            <div>
                                <h4 className="font-semibold text-green-900">Grow through consistency</h4>
                                <p className="text-sm text-green-700">Scan and recycle every day to grow your virtual tree. Missing a day will cause your tree to dry up!</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl">🌍</div>
                            <div>
                                <h4 className="font-semibold text-blue-900">Real World Impact</h4>
                                <p className="text-sm text-blue-700">Reach a 90-day streak (LifeTree) and we will plant a real tree in your name! You will receive a certificate with coordinates.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start p-3 bg-orange-50 rounded-lg">
                            <div className="text-2xl">⚠️</div>
                            <div>
                                <h4 className="font-semibold text-orange-900">Streak Mechanics</h4>
                                <p className="text-sm text-orange-700">1 day missed = Tree looks dull.<br />3 days missed = Leaves fall.<br />7 days missed = Tree fully resets.</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Share Dialog */}
            <Dialog open={showShare} onOpenChange={setShowShare}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Share Your Impact</DialogTitle>
                        <DialogDescription>
                            Inspire others by sharing your EcoTree progress!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 flex flex-col items-center justify-center">
                        <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-2xl text-center text-white shadow-xl max-w-[280px]">
                            <div className="text-6xl mb-2">{currentStage.emoji}</div>
                            <h3 className="font-bold text-xl mb-1">{treeName}</h3>
                            <p className="text-green-100 font-medium mb-4">Level: {currentStage.name}</p>
                            <div className="bg-white/20 px-4 py-2 rounded-full font-bold inline-block">
                                🔥 {streak} Day Streak!
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-3">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                            Share to Twitter
                        </Button>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            Share to LinkedIn
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </Card>
    );
}
