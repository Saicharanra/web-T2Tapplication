"use client";

import { useState, useEffect } from "react";
import { X, Upload, MapPin, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserLocation } from "@/types/find-bins";
import { cn } from "@/lib/utils";

interface AddBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation | null;
  onSubmitBin: (data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    locationType: string;
    photoFile: File | null;
  }) => Promise<void>;
}

export function AddBinModal({
  isOpen,
  onClose,
  userLocation,
  onSubmitBin,
}: AddBinModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [locationType, setLocationType] = useState<string>("public_bin");
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill exact coordinates on mount/load without approximation or manual inputs
  useEffect(() => {
    if (isOpen && userLocation) {
      setLatitude(userLocation.lat);
      setLongitude(userLocation.lng);
    }
  }, [isOpen, userLocation]);

  // Clean preview URLs
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be smaller than 5MB.");
      return;
    }

    setPhotoFile(file);
    setError(null);

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setError("Name and Address are required fields.");
      return;
    }

    if (latitude === "" || longitude === "") {
      setError("GPS location is required to map the exact pin coordinates.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmitBin({
        name,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        locationType,
        photoFile,
      });

      // Reset
      setName("");
      setAddress("");
      setLocationType("public_bin");
      setPhotoFile(null);
      setPhotoPreview(null);
      onClose();
    } catch (err: any) {
      console.error("Error creating bin:", err);
      setError(err?.message || "Failed to register new waste bin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      {/* Form Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10 p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-1.5">
            <span>🚮</span> Pin Shared Waste Spot
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:text-rose-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-start gap-2 text-xs">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs sm:text-sm">
          {/* Bin Name */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Park Entrance Dual Recycle Bin"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-850 dark:text-slate-100"
            />
          </div>

          {/* Type Selector & GPS read-only */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Spot Type *</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-850 dark:text-slate-100"
              >
                <option value="public_bin">🚮 Public Bin</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Exact GPS Coordinates</label>
              <div className="flex items-center gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] font-black truncate">
                  {latitude ? `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}` : "Detecting..."}
                </span>
              </div>
            </div>
          </div>

          {/* Street Address */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Street Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Corner of Oak Road, beside Metro Gate"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-850 dark:text-slate-100"
            />
          </div>

          {/* Photo upload (Optional) */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Photograph (Optional)</label>
            {photoPreview ? (
              <div className="relative w-full h-32 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-slate-950/60 text-white rounded-full hover:bg-rose-650 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="w-full h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-50 transition-all">
                <Upload className="h-6 w-6 text-slate-400" />
                <div className="text-center">
                  <p className="font-bold text-slate-600 dark:text-slate-400 text-xs">Add Spot Photo</p>
                  <p className="text-[10px] text-slate-400">Click or Drag & Drop (Optional)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
              className="flex-1 py-5 rounded-2xl text-xs font-bold border-slate-200 text-slate-750 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || latitude === ""}
              className="flex-1 py-5 rounded-2xl bg-gradient-eco text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Pin Spot
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
