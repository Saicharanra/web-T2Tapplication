"use client";

export const dynamic = 'force-dynamic';

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trophy, TrendingUp, Calendar, Award, Flame, Recycle, X, Camera, MapPin, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { usePoints } from "../context/PointsContext";
import { useAuth } from "@/components/providers/AuthProvider";
import CountUp from "react-countup";

// Only define types, not interfaces (for better compatibility in TS/Next builds)
type Submission = {
  id: string;
  wasteType: string;
  imageUrl: string;
  pointsAwarded: number;
  status: string;
  createdAt: string;
  location: string;
};

type UserStats = {
  totalPoints: number;
  level: string;
  totalSubmissions: number;
  verifiedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
  streak: number;
};

// Static badges moved to inline render

const wasteTypes: string[] = [
  "Plastic Bottles",
  "Paper Waste",
  "Metal Cans",
  "Glass Bottles",
  "Cardboard",
  "E-Waste",
  "Organic Waste",
  "Mixed Recyclables",
];

const DEFAULT_POINTS_GUIDE = [
  { category: "Plastic Bottles", points: 15, reason: "Highly recyclable but very common", color: "bg-blue-400" },
  { category: "Paper Waste", points: 10, reason: "Easy to recycle but low processing cost", color: "bg-yellow-400" },
  { category: "Metal Cans", points: 25, reason: "High recycling value", color: "bg-gray-400" },
  { category: "Glass Bottles", points: 20, reason: "Recyclable but requires sorting", color: "bg-teal-400" },
  { category: "Cardboard", points: 12, reason: "Recyclable but bulky", color: "bg-amber-600" },
  { category: "E-Waste", points: 50, reason: "High environmental risk & valuable recovery", color: "bg-purple-500" },
  { category: "Organic Waste", points: 18, reason: "Useful for compost but less recycling value", color: "bg-lime-500" },
  { category: "Mixed Recyclables", points: 8, reason: "Lower points because sorting required", color: "bg-slate-400" },
];

const streakBonuses = [
  { days: "5 Days", bonus: 20, emoji: "🔥" },
  { days: "10 Days", bonus: 50, emoji: "⚡" },
  { days: "15 Days", bonus: 100, emoji: "🌟" },
  { days: "30 Days", bonus: 150, emoji: "👑" },
];

// ==== Camera Only Section Below ====

export default function UserDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  // Defensive: Check if usePoints returns a valid object
  const pointsContext = usePoints();
  const refreshPoints = pointsContext ? pointsContext.refreshPoints : undefined;

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    level: "BRONZE",
    totalSubmissions: 0,
    verifiedSubmissions: 0,
    pendingSubmissions: 0,
    rejectedSubmissions: 0,
    streak: 0,
  });
  const [pointsGuide, setPointsGuide] = useState(DEFAULT_POINTS_GUIDE);

  // Form state
  const [wasteImage, setWasteImage] = useState<string | null>(null);
  const [binImage, setBinImage] = useState<string | null>(null);
  const [wasteType, setWasteType] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [activeScanner, setActiveScanner] = useState<1 | 2 | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
      fetchUserStats();
      fetchPointsConfig();
      getLocation();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (!userStats) return;
    const currentPoints = pointsContext?.points ?? userStats.totalPoints;
    const badgesList = [
      { id: "first_upload", name: "First Upload", emoji: "🎯", earned: userStats.totalSubmissions >= 1 },
      { id: "eco_warrior", name: "Eco Warrior", emoji: "🌱", earned: currentPoints >= 500 },
      { id: "100_points", name: "100 Points", emoji: "💯", earned: currentPoints >= 100 },
      { id: "weekly_streak", name: "Weekly Streak", emoji: "🔥", earned: userStats.streak >= 7 },
    ];
    const currentEarnedIds = badgesList.filter(b => b.earned).map(b => b.id);
    const storedEarned = localStorage.getItem('earned_badges');
    const previousEarned = storedEarned ? JSON.parse(storedEarned) : null;

    if (previousEarned !== null) {
      const newlyEarned = currentEarnedIds.filter(id => !previousEarned.includes(id));
      if (newlyEarned.length > 0) {
        newlyEarned.forEach(id => {
          const badge = badgesList.find(b => b.id === id);
          toast({
            title: `Badge Unlocked! ${badge?.emoji}`,
            description: `Congratulations! You've earned the "${badge?.name}" badge.`,
          });
        });
        localStorage.setItem('earned_badges', JSON.stringify([...previousEarned, ...newlyEarned]));
      }
    } else if (currentEarnedIds.length > 0) {
      localStorage.setItem('earned_badges', JSON.stringify(currentEarnedIds));
    }
  }, [userStats, pointsContext?.points, toast]);

  const getLocation = () => {
    setLocationLoading(true);
    if (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      "geolocation" in navigator
    ) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude);
          setLongitude(longitude);
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (!response.ok) {
              setLocation(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
              toast({
                title: "⚠️ Location Fetch Failed",
                description: "Failed to get precise address, using coordinates.",
                variant: "destructive",
              });
              setLocationLoading(false);
              return;
            }
            const data = await response.json();
            const address = data.address || {};
            const detailedLocation = [
              address.amenity || address.building,
              address.road,
              address.suburb || address.neighbourhood,
              address.city || address.town || address.village,
              address.state,
              address.postcode
            ].filter(Boolean).join(", ");

            const finalLocation = detailedLocation || "Unknown Location";
            setLocation(finalLocation);
            toast({
              title: "📍 Location Detected",
              description: finalLocation,
            });
          } catch {
            setLocation(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
            toast({
              title: "⚠️ Error Getting Location Name",
              description: "Could not look up location details.",
              variant: "destructive",
            });
          } finally {
            setLocationLoading(false);
          }
        },
        () => {
          toast({
            title: "⚠️ Location Access Denied",
            description: "Please enable location access or enter manually",
            variant: "destructive",
          });
          setLocationLoading(false);
        }
      );
    } else {
      toast({
        title: "❌ Location Not Supported",
        description: "Your browser doesn&apos;t support geolocation",
        variant: "destructive",
      });
      setLocationLoading(false);
    }
  };

  const fetchPointsConfig = async () => {
    try {
      // Use the public settings API to get current points
      const response = await fetch('/api/settings/points');
      if (response.ok) {
        const data = await response.json();
        if (data.pointsConfig) {
          const updatedGuide = DEFAULT_POINTS_GUIDE.map(item => ({
            ...item,
            points: data.pointsConfig[item.category] || item.points
          }));
          setPointsGuide(updatedGuide);
        }
      }
    } catch (error) {
      console.error("Failed to fetch points config:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetchWithAuth('/api/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
      } else {
        setSubmissions([]);
      }
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetchWithAuth('/api/users/profile/stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats({
          totalPoints: typeof data.totalPoints === "number" ? data.totalPoints : 0,
          level: typeof data.level === "string" ? data.level : "BRONZE",
          totalSubmissions: typeof data.totalSubmissions === "number" ? data.totalSubmissions : 0,
          verifiedSubmissions: typeof data.verifiedSubmissions === "number" ? data.verifiedSubmissions : 0,
          pendingSubmissions: typeof data.pendingSubmissions === "number" ? data.pendingSubmissions : 0,
          rejectedSubmissions: typeof data.rejectedSubmissions === "number" ? data.rejectedSubmissions : 0,
          streak: typeof data.streak === "number" ? data.streak : 0,
        });
      }
    } catch {
      // Do not update userStats, keep defaults
    }
  };

  // ==== CAMERA ACCESS & CAPTURE FUNCTIONS ====

  const startCamera = async (scannerNumber: 1 | 2) => {
    setActiveScanner(scannerNumber);
    setCameraActive(true);
    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        toast({
          title: "❌ Camera Not Supported",
          description: "Your browser does not support camera access.",
          variant: "destructive",
        });
        setCameraActive(false);
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        try {
          (videoRef.current as HTMLVideoElement).srcObject = mediaStream;
        } catch {
          // fallback for older browsers (should not be needed in modern builds)
          //(videoRef.current as any).src = window.URL.createObjectURL(mediaStream);
        }
      }
    } catch {
      toast({
        title: "❌ Camera Access Denied",
        description: "Please allow camera access to take photo!",
        variant: "destructive",
      });
      setCameraActive(false);
      setStream(null);
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const width = videoRef.current.videoWidth || 640;
    const height = videoRef.current.videoHeight || 480;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx && videoRef.current) ctx.drawImage(videoRef.current, 0, 0, width, height);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");
    if (activeScanner === 1) {
      setWasteImage(dataUrl);
    } else if (activeScanner === 2) {
      setBinImage(dataUrl);
    }
    stopCamera();
    setActiveScanner(null);
  };

  const handleUpload = async () => {
    if (!wasteImage || !binImage || !wasteType || !location) {
      toast({
        title: "❌ Missing Information",
        description: "Please capture both images and fill all fields",
        variant: "destructive",
      });
      return;
    }

    if (latitude === null || longitude === null) {
      toast({
        title: "❌ GPS Coordinates Required",
        description: "Please allow GPS location access to automatically map this disposal spot.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Stitch images vertically
      const canvas = document.createElement('canvas');
      const img1 = new window.Image();
      const img2 = new window.Image();

      await Promise.all([
        new Promise(resolve => { img1.onload = resolve; img1.src = wasteImage; }),
        new Promise(resolve => { img2.onload = resolve; img2.src = binImage; })
      ]);

      canvas.width = Math.max(img1.width, img2.width);
      canvas.height = img1.height + img2.height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img1, 0, 0);
        ctx.drawImage(img2, 0, img1.height);
      }

      const stitchedDataUrl = canvas.toDataURL("image/jpeg", 0.8);

      // Convert dataURL to Blob
      let blob: Blob;
      if (stitchedDataUrl.startsWith("data:")) {
        const binary = typeof window !== "undefined" ? window.atob(stitchedDataUrl.split(",")[1]) : "";
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        blob = new Blob([array], { type: "image/jpeg" });
      } else {
        const resp = await fetch(stitchedDataUrl);
        blob = await resp.blob();
      }
      const file = new File([blob], "waste.jpg", { type: blob.type });

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetchWithAuth('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        let errorMsg = 'Upload failed';
        try {
          const error = await uploadResponse.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch { }
        throw new Error(errorMsg);
      }

      const uploadData = await uploadResponse.json();

      if (!uploadData.imageUrl || !uploadData.submissionId) {
        throw new Error("Unexpected upload response. Try again.");
      }

      const submissionPayload = {
        wasteType,
        imageUrl: uploadData.imageUrl,
        imagePath: uploadData.imagePath,
        imageSize: uploadData.fileSize,
        imageMimeType: uploadData.mimeType,
        location,
        submissionId: uploadData.submissionId,
        latitude,
        longitude,
      };

      const submissionResponse = await fetchWithAuth('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload),
      });

      if (!submissionResponse.ok) {
        let errorMessage = 'Submission failed';
        try {
          const error = await submissionResponse.json();
          if (error.message) {
            errorMessage = error.message;
          } else if (error.error) {
            errorMessage = error.error;
          }
          if (error.hint) {
            errorMessage += `\n\nHint: ${error.hint}`;
          }
          if (error.userId) {
            errorMessage += `\n\nYour User ID: ${error.userId}`;
          }
        } catch { }
        throw new Error(errorMessage);
      }

      toast({
        title: "✅ Upload Successful!",
        description: "Your dual submission is pending verification.",
      });

      setWasteImage(null);
      setBinImage(null);
      setWasteType("");
      setLocation("");
      fetchSubmissions();
      fetchUserStats();
      if (typeof refreshPoints === "function") refreshPoints();
    } catch (error: unknown) {
      let message: string;
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as Error).message === "string"
      ) {
        message = (error as Error).message;
      } else {
        message = "Please try again";
      }
      toast({
        title: "❌ Upload Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <title>Scan & Earn | Trash2Treasure</title>
      <meta name="description" content="Upload pictures of sorted waste to earn credits instantly." />
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {user && typeof user.displayName === "string" ? user.displayName.split(' ')[0] : 'User'}! 👋</h1>
        <p className="text-white/90">Keep up the great work! You&apos;re making a real difference.</p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Points</p>
                <p className="text-3xl font-bold text-green-900 mt-1"><CountUp end={pointsContext?.points ?? userStats.totalPoints} duration={2.5} separator="," /></p>
              </div>
              <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">🪙</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Current Level</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{userStats.level}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Submissions</p>
                <p className="text-3xl font-bold text-purple-900 mt-1"><CountUp end={userStats.totalSubmissions} duration={2.5} separator="," /></p>
              </div>
              <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-700" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-purple-200/50 text-[11px] sm:text-xs font-semibold text-purple-800">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Pending: {userStats.pendingSubmissions}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>Accepted: {userStats.verifiedSubmissions}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Rejected: {userStats.rejectedSubmissions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Day Streak</p>
                <p className="text-3xl font-bold text-orange-900 mt-1"><CountUp end={userStats.streak} duration={2.5} separator="," /></p>
              </div>
              <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
                <Flame className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Camera Only Upload Section */}
      <Card className="border-0 bg-glass shadow-2xl overflow-hidden relative mx-0 sm:mx-auto">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-blue-500/10 animate-pulse pointer-events-none" />
        <CardContent className="p-3 sm:p-8 relative z-10">
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-green-500/30 blur-xl rounded-full group-hover:bg-green-500/50 transition-all duration-500"></div>
                  <div className="relative h-20 w-20 bg-gradient-eco rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 group-hover:scale-105 transition-transform duration-300">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Two-Step Waste Scanner
              </h3>
              <p className="text-gray-600 font-medium max-w-lg mx-auto mb-1">
                Step 1: Collection of Waste
              </p>
              <p className="text-gray-600 font-medium max-w-lg mx-auto">
                Step 2: Disposed in Dustbin
              </p>
            </div>

            <div className="space-y-6">
              {!cameraActive && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl mx-auto">
                  {/* Step 1 Box */}
                  <div className="bg-white/50 p-4 rounded-2xl shadow-sm border border-white/60 backdrop-blur-sm">
                    <h4 className="font-bold text-gray-800 mb-3 text-center">1. Collected Waste</h4>
                    {!wasteImage ? (
                      <button
                        type="button"
                        onClick={() => startCamera(1)}
                        suppressHydrationWarning
                        className="group relative w-full h-40 sm:h-48 rounded-xl border-2 border-dashed border-green-400 bg-green-50/50 hover:bg-green-50 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center gap-3"
                      >
                        {/* Hover Scanning Line Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-400 opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2s_ease-in-out_infinite]" />
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform relative z-10">
                          <Camera className="h-6 w-6 text-green-600" />
                        </div>
                        <span className="font-medium text-green-800">Scan Waste</span>
                      </button>
                    ) : (
                      <div className="relative h-40 sm:h-48 rounded-xl overflow-hidden shadow-md border-2 border-green-400">
                        <Image src={wasteImage} alt="Waste" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                        <button
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors"
                          onClick={() => setWasteImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">Captured</span>
                      </div>
                    )}
                  </div>

                  {/* Step 2 Box */}
                  <div className="bg-white/50 p-4 rounded-2xl shadow-sm border border-white/60 backdrop-blur-sm">
                    <h4 className="font-bold text-gray-800 mb-3 text-center">2. Disposal in Bin</h4>
                    {!binImage ? (
                      <button
                        type="button"
                        onClick={() => startCamera(2)}
                        suppressHydrationWarning
                        className="group relative w-full h-40 sm:h-48 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center gap-3"
                      >
                        {/* Hover Scanning Line Effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2s_ease-in-out_infinite]" />
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform relative z-10">
                          <Camera className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="font-medium text-blue-800">Scan Dustbin</span>
                      </button>
                    ) : (
                      <div className="relative h-40 sm:h-48 rounded-xl overflow-hidden shadow-md border-2 border-blue-400">
                        <Image src={binImage} alt="Dustbin" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                        <button
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors"
                          onClick={() => setBinImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">Captured</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {cameraActive && (
                <div className="relative max-w-md mx-auto group">
                  <div className="text-center mb-4">
                    <span className="inline-block bg-green-100 text-green-800 font-bold px-4 py-1.5 rounded-full shadow-sm border border-green-200">
                      {activeScanner === 1 ? "Scanning Collected Waste..." : "Scanning Disposal in Bin..."}
                    </span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border-2 border-green-400/50 shadow-2xl relative">
                    {/* Active Laser Overlay */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      <div className="w-full h-1 bg-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                      <div className="absolute inset-x-0 inset-y-1/2 -translate-y-1/2 flex items-center justify-center opacity-30">
                        <div className="w-3/4 h-3/4 border-2 border-white/40 rounded-3xl" />
                      </div>
                    </div>

                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 sm:h-80 object-cover bg-black"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="flex justify-center mt-6 gap-4">
                    <button
                      className="flex-1 flex justify-center items-center gap-2 py-3 px-6 rounded-full bg-gradient-eco text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                      onClick={capturePhoto}
                    >
                      <Camera className="h-5 w-5" />
                      Capture
                    </button>
                    <button
                      className="flex justify-center items-center gap-2 py-3 px-6 rounded-full bg-red-500/10 text-red-600 font-bold hover:bg-red-500/20 transition-all border border-red-200"
                      onClick={stopCamera}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
              {/* Form Fields */}
              <div className="max-w-md mx-auto space-y-4 sm:space-y-5 bg-white/40 p-4 sm:p-6 rounded-2xl border border-white/60 shadow-sm backdrop-blur-sm mt-6 sm:mt-8">
                <div className="space-y-2 relative">
                  <Label htmlFor="wasteType" className="text-gray-700 font-semibold ml-1">Waste Type</Label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      suppressHydrationWarning
                      className="w-full p-4 bg-white/80 border border-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] rounded-xl flex items-center justify-between text-gray-800 hover:bg-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {wasteType ? (
                        <span className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${pointsGuide.find(p => p.category === wasteType)?.color || 'bg-green-500'} shadow-sm`}></div>
                          <span className="font-medium text-gray-900">{wasteType}</span>
                        </span>
                      ) : (
                        <span className="text-gray-500 font-medium">Select waste type...</span>
                      )}
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setDropdownOpen(false)}
                        ></div>
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden z-50 transform origin-top transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                          <div className="max-h-60 overflow-y-auto w-full hide-scrollbar">
                            {pointsGuide.map((item) => (
                              <button
                                key={item.category}
                                type="button"
                                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors border-b border-gray-50 last:border-0 hover:bg-green-50/80 ${wasteType === item.category ? 'bg-green-50/50' : ''}`}
                                onClick={() => {
                                  setWasteType(item.category);
                                  setDropdownOpen(false);
                                }}
                              >
                                <span className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`}></div>
                                  <span className={`font-medium ${wasteType === item.category ? 'text-green-700' : 'text-gray-800'}`}>{item.category}</span>
                                </span>
                                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full shadow-sm">{item.points} Pts</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2 text-gray-700 font-semibold ml-1">
                    <MapPin className="h-4 w-4 text-green-600" />
                    Location
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., Hyderabad, Telangana"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={locationLoading}
                      suppressHydrationWarning
                      className="flex-1 bg-white/70 border-white shadow-sm rounded-xl focus-visible:ring-green-500 h-12"
                    />
                    <Button
                      type="button"
                      onClick={getLocation}
                      disabled={locationLoading}
                      variant="outline"
                      suppressHydrationWarning
                      className="shrink-0 h-12 w-12 rounded-xl bg-white border-white shadow-sm hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      {locationLoading ? (
                        <Recycle className="h-5 w-5 animate-spin text-green-600" />
                      ) : (
                        <MapPin className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 ml-1">
                    {locationLoading
                      ? "Detecting your location..."
                      : "Click 📍 to auto-detect location"}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-gradient-eco hover:shadow-xl hover:scale-[1.02] text-white rounded-xl h-14 font-bold text-lg transition-all"
                  onClick={handleUpload}
                  disabled={uploading || !wasteImage || !binImage || !wasteType || !location}
                  suppressHydrationWarning
                >
                  {uploading ? (
                    <>
                      <Recycle className="mr-2 h-5 w-5 animate-spin" />
                      Uploading Dual Image...
                    </>
                  ) : (
                    "Submit Scans for Verification"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Points & Bonuses Guide */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-0 shadow-md bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl text-green-800">
              <Recycle className="h-6 w-6 text-green-600" />
              Waste Categories & Points
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-green-800 uppercase bg-green-50/50">
                  <tr>
                    <th className="px-6 py-4 font-bold">Waste Category</th>
                    <th className="px-6 py-4 font-bold text-center">Points</th>
                    <th className="px-6 py-4 font-bold hidden sm:table-cell">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pointsGuide.map((item, idx) => (
                    <tr key={idx} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm shrink-0`}></div>
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs shrink-0 whitespace-nowrap shadow-sm">
                          {item.points} Pts
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500 hidden sm:table-cell text-xs leading-relaxed max-w-xs">
                        {item.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white overflow-hidden flex flex-col">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl text-orange-800">
              <Flame className="h-6 w-6 text-orange-600" />
              Streak Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="p-4 sm:p-5 text-sm text-gray-600 bg-orange-50/30 border-b border-orange-50 font-medium">
              Maintain a daily scanning streak and earn massive bonuses on top of your regular points!
            </div>
            <ul className="divide-y divide-gray-100 flex-1 flex flex-col">
              {streakBonuses.map((streak, idx) => (
                <li key={idx} className="flex items-center justify-between p-4 sm:p-5 hover:bg-orange-50/30 transition-colors flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl filter drop-shadow-sm">{streak.emoji}</span>
                    <span className="font-bold text-gray-800 text-base">{streak.days}</span>
                  </div>
                  <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 font-bold shadow-sm whitespace-nowrap">
                    +{streak.bonus} Pts
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: "first_upload", name: "First Upload", emoji: "🎯", earned: userStats.totalSubmissions >= 1 },
              { id: "eco_warrior", name: "Eco Warrior", emoji: "🌱", earned: (pointsContext?.points ?? userStats.totalPoints) >= 500 },
              { id: "100_points", name: "100 Points", emoji: "💯", earned: (pointsContext?.points ?? userStats.totalPoints) >= 100 },
              { id: "weekly_streak", name: "Weekly Streak", emoji: "🔥", earned: userStats.streak >= 7 },
            ].map((badge) => (
              <div
                key={badge.name}
                className={`p-4 rounded-xl text-center transition-all duration-300 ${badge.earned
                  ? "bg-gradient-to-br from-yellow-100 to-amber-200 border border-yellow-300 shadow-md hover:scale-110"
                  : "bg-gray-100 border border-gray-200 opacity-60 grayscale hover:grayscale-0"
                  }`}
              >
                <div className="text-4xl mb-2 drop-shadow-sm">{badge.emoji}</div>
                <p className="text-xs font-bold text-gray-900">{badge.name}</p>
                {!badge.earned && (
                  <div className="mt-2 text-[10px] text-gray-500 font-medium tracking-tighter">🔒 LOCKED</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Recycle className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No submissions yet. Upload your first waste image above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {submissions.slice(0, 6).map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-32">
                    <Image
                      src={submission.imageUrl || "/icon.png"}
                      alt={submission.wasteType || (submission as any).category || "Recycling submission"}
                      fill
                      className="object-cover"
                      unoptimized={!!submission.imageUrl && typeof submission.imageUrl === "string" && submission.imageUrl.startsWith("data:")}
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                          (submission.status || "").toUpperCase() === "VERIFIED" || (submission.status || "").toUpperCase() === "APPROVED"
                          ? "bg-green-500 text-white"
                          : (submission.status || "").toUpperCase() === "REJECTED"
                            ? "bg-red-500 text-white"
                            : "bg-amber-500 text-white shadow-sm animate-pulse"
                          }`}
                      >
                        {(submission.status || "PENDING").toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900">{submission.wasteType || (submission as any).category || "Waste Item"}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600" suppressHydrationWarning={true}>
                        {
                          (() => {
                            try {
                              if (
                                typeof submission.createdAt === "string" &&
                                !Number.isNaN(Date.parse(submission.createdAt))
                              ) {
                                return new Date(submission.createdAt).toLocaleDateString();
                              }
                              if (
                                typeof submission.createdAt === "object" &&
                                submission.createdAt &&
                                "seconds" in submission.createdAt
                              ) {
                                return new Date((submission.createdAt as any).seconds * 1000).toLocaleDateString();
                              }
                              return String(submission.createdAt || "");
                            } catch {
                              return "Recently";
                            }
                          })()
                        }
                      </span>
                      <span className={`font-bold ${
                        (submission.status || "").toUpperCase() === 'VERIFIED' || (submission.status || "").toUpperCase() === 'APPROVED'
                          ? 'text-green-600'
                          : (submission.status || "").toUpperCase() === 'REJECTED'
                          ? 'text-red-500'
                          : 'text-amber-600'
                      }`}>
                        +{(submission.status || "").toUpperCase() === 'REJECTED'
                          ? 0
                          : (submission.pointsAwarded && submission.pointsAwarded > 0)
                          ? submission.pointsAwarded
                          : (pointsGuide.find(p => p.category === (submission.wasteType || (submission as any).category))?.points || 15)
                        } pts {(submission.status || "").toUpperCase() === 'PENDING' && '(Pending)'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}