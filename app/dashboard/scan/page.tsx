"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trophy, TrendingUp, Calendar, Award, Flame, Recycle, X, Camera, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { usePoints } from "../context/PointsContext";
import { useUser } from "@clerk/nextjs";

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
  streak: number;
};

const badges: { name: string; emoji: string; earned: boolean }[] = [
  { name: "First Upload", emoji: "🎯", earned: true },
  { name: "Eco Warrior", emoji: "🌱", earned: true },
  { name: "100 Points", emoji: "💯", earned: true },
  { name: "Weekly Streak", emoji: "🔥", earned: true },
];

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

// ==== Camera Only Section Below ====

export default function UserDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
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
    streak: 0,
  });

  // Form state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [wasteType, setWasteType] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    fetchSubmissions();
    fetchUserStats();
    getLocation();
    // Refresh points from DB to ensure context is in sync
    if (typeof refreshPoints === "function") refreshPoints();

    // Auto-refresh stats every 30 seconds to stay in sync with DB
    const interval = setInterval(() => {
      fetchUserStats();
      fetchSubmissions();
      if (typeof refreshPoints === "function") refreshPoints();
    }, 30000);

    return () => {
      stopCamera();
      clearInterval(interval);
    };
    // eslint-disable-next-line
  }, []);

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

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
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
      const response = await fetch('/api/users/stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats({
          totalPoints: typeof data.totalPoints === "number" ? data.totalPoints : 0,
          level: typeof data.level === "string" ? data.level : "BRONZE",
          totalSubmissions: typeof data.totalSubmissions === "number" ? data.totalSubmissions : 0,
          streak: typeof data.streak === "number" ? data.streak : 0,
        });
      }
    } catch {
      // Do not update userStats, keep defaults
    }
  };

  // ==== CAMERA ACCESS & CAPTURE FUNCTIONS ====

  const startCamera = async () => {
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
    setImageDataUrl(dataUrl);
    stopCamera();
  };

  const clearPhoto = () => {
    setImageDataUrl(null);
  };

  const handleUpload = async () => {
    if (!imageDataUrl || !wasteType || !location) {
      toast({
        title: "❌ Missing Information",
        description: "Please fill all fields and capture an image",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Convert dataURL to Blob
      let blob: Blob;
      if (imageDataUrl.startsWith("data:")) {
        const binary = typeof window !== "undefined" ? window.atob(imageDataUrl.split(",")[1]) : "";
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        blob = new Blob([array], { type: "image/jpeg" });
      } else {
        const resp = await fetch(imageDataUrl);
        blob = await resp.blob();
      }
      const file = new File([blob], "waste.jpg", { type: blob.type });

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
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
      };

      const submissionResponse = await fetch('/api/submissions', {
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
        description: "Your submission is pending verification.",
      });

      clearPhoto();
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {user && typeof user.firstName === "string" ? user.firstName : 'User'}! 👋</h1>
        <p className="text-white/90">Keep up the great work! You&apos;re making a real difference.</p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Points</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{pointsContext?.points ?? userStats.totalPoints}</p>
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
                <p className="text-3xl font-bold text-purple-900 mt-1">{userStats.totalSubmissions}</p>
              </div>
              <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Day Streak</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{userStats.streak}</p>
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
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-3">
                AI Waste Scanner
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Point your camera at any recyclable item. Our AI will identify it and instantly reward you with points.
              </p>
            </div>

            <div className="space-y-6">
              {!imageDataUrl && !cameraActive && (
                <div className="max-w-md w-full mx-auto">
                  <button
                    type="button"
                    onClick={startCamera}
                    suppressHydrationWarning
                    className="group relative w-full h-48 rounded-2xl border-2 border-dashed border-green-400 bg-green-50/50 hover:bg-green-50 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center gap-4 shadow-inner px-2"
                  >
                    {/* Hover Scanning Line Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-400 opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2s_ease-in-out_infinite]" />
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Camera className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-bold text-green-800 truncate">Tap to Open Scanner</span>
                      <span className="text-sm text-green-600/80">Camera access required</span>
                    </div>
                  </button>
                </div>
              )}
              {cameraActive && (
                <div className="relative max-w-md mx-auto group">
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
              {imageDataUrl && (
                <div className="relative w-full max-w-md mx-auto">
                  <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden border-2 border-green-400 shadow-xl">
                    <Image
                      src={imageDataUrl}
                      alt="Captured preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 right-4 text-center z-10">
                      <span className="bg-green-500/90 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm backdrop-blur-sm border border-white/20">
                        Image Captured!
                      </span>
                    </div>
                  </div>
                  <button
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md transition-colors border border-white/20"
                    onClick={clearPhoto}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              {/* Form Fields */}
              <div className="max-w-md mx-auto space-y-4 sm:space-y-5 bg-white/40 p-4 sm:p-6 rounded-2xl border border-white/60 shadow-sm backdrop-blur-sm mt-6 sm:mt-8">
                <div className="space-y-2">
                  <Label htmlFor="wasteType" className="text-gray-700 font-semibold ml-1">Waste Type</Label>
                  <select
                    id="wasteType"
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    suppressHydrationWarning
                    className="w-full p-3 bg-white/70 border border-white shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow text-gray-800"
                  >
                    <option value="">Select waste type...</option>
                    {wasteTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
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
                  disabled={uploading || !imageDataUrl || !wasteType || !location}
                  suppressHydrationWarning
                >
                  {uploading ? (
                    <>
                      <Recycle className="mr-2 h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Submit Waste Image"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
            {badges.map((badge) => (
              <div
                key={badge.name}
                className={`p-4 rounded-lg text-center transition-all ${badge.earned
                  ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300"
                  : "bg-gray-100 opacity-50"
                  }`}
              >
                <div className="text-4xl mb-2">{badge.emoji}</div>
                <p className="text-sm font-semibold text-gray-900">{badge.name}</p>
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
                      src={submission.imageUrl}
                      alt={submission.wasteType}
                      fill
                      className="object-cover"
                      unoptimized={!!submission.imageUrl && typeof submission.imageUrl === "string" && submission.imageUrl.startsWith("data:")}
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${submission.status === "VERIFIED"
                          ? "bg-green-500 text-white"
                          : submission.status === "REJECTED"
                            ? "bg-red-500 text-white"
                            : "bg-yellow-500 text-white"
                          }`}
                      >
                        {submission.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900">{submission.wasteType}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">
                        {
                          (() => {
                            try {
                              if (
                                typeof submission.createdAt === "string" &&
                                !Number.isNaN(Date.parse(submission.createdAt))
                              ) {
                                return new Date(submission.createdAt).toLocaleDateString();
                              }
                              return submission.createdAt;
                            } catch {
                              return submission.createdAt;
                            }
                          })()
                        }
                      </span>
                      <span className="font-bold text-green-600">
                        +{typeof submission.pointsAwarded === "number" ? submission.pointsAwarded : "?"}
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

