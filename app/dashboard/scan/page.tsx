"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trophy, TrendingUp, Calendar, Award, Flame, Loader2, X, Camera, MapPin } from "lucide-react";
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
    return () => {
      stopCamera();
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
            const locationName =
              address.city ||
              address.town ||
              address.village ||
              address.state ||
              "Unknown Location";
            const state = address.state || "Telangana";
            setLocation(`${locationName}, ${state}`);
            toast({
              title: "📍 Location Detected",
              description: `${locationName}, ${state}`,
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
        } catch {}
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
        } catch {}
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
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user && typeof user.firstName === "string" ? user.firstName : 'User'}! 👋</h1>
        <p className="text-white/90">Keep up the great work! You&apos;re making a real difference.</p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Points</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{userStats.totalPoints}</p>
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
      <Card className="border-2 border-dashed border-green-300 bg-gradient-to-br from-green-50 to-blue-50">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Your Waste</h3>
              <p className="text-gray-600">
                <span>Take a photo of your recyclable waste and earn points!</span>
              </p>
            </div>
            <div className="space-y-4">
              {!imageDataUrl && !cameraActive && (
                <div className="max-w-md mx-auto space-y-3">
                  <Button
                    type="button"
                    onClick={startCamera}
                    className="w-full h-32 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-2 border-dashed border-blue-300"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="h-12 w-12" />
                      <span className="text-lg font-semibold">📸 Open Camera</span>
                      <span className="text-sm opacity-90">Use your camera to capture waste</span>
                    </div>
                  </Button>
                  <div className="text-center mt-2 text-sm text-gray-500">Camera required. File upload disabled.</div>
                </div>
              )}
              {cameraActive && (
                <div className="relative max-w-md mx-auto">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 rounded-lg object-cover border-2 border-gray-300 bg-black"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  <div className="flex justify-center mt-3 gap-3">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      onClick={capturePhoto}
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Capture Photo
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={stopCamera}
                    >
                      <X className="mr-2 h-5 w-5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {imageDataUrl && (
                <div className="relative w-full max-w-md mx-auto">
                  <div className="relative h-64 rounded-lg overflow-hidden border-2 border-gray-300">
                    <Image
                      src={imageDataUrl}
                      alt="Captured preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearPhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {/* Form Fields */}
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <Label htmlFor="wasteType">Waste Type</Label>
                  <select
                    id="wasteType"
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    className="w-full mt-1.5 p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select waste type...</option>
                    {wasteTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., Hyderabad, Telangana"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={locationLoading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={getLocation}
                      disabled={locationLoading}
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                    >
                      {locationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {locationLoading
                      ? "Detecting your location..."
                      : "Click 📍 to auto-detect location"}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  onClick={handleUpload}
                  disabled={uploading || !imageDataUrl || !wasteType || !location}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
                className={`p-4 rounded-lg text-center transition-all ${
                  badge.earned
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
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
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
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          submission.status === "VERIFIED"
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

