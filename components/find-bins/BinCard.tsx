"use client";

import { BinDocument } from "@/types/find-bins";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BinCardProps {
  bin: BinDocument;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function BinCard({ bin, isSelected, onSelect }: BinCardProps) {
  
  // Format distance in meters or kilometers
  const formatDistance = (dist?: number) => {
    if (dist === undefined) return "";
    if (dist < 1) {
      return `${(dist * 1000).toFixed(0)} meters`;
    }
    return `${dist.toFixed(2)} km`;
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${bin.latitude},${bin.longitude}`;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative p-5 rounded-3xl bg-glass border border-white/50 dark:border-slate-800/50 shadow-sm transition-all duration-300 cursor-pointer flex flex-col justify-between hover:shadow-md hover:scale-[1.01] overflow-hidden",
        isSelected
          ? "border-emerald-500/50 dark:border-emerald-400/50 bg-white/60 dark:bg-slate-900/60 shadow-[0_0_20px_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/20"
          : "hover:bg-white/50 dark:hover:bg-slate-900/50"
      )}
    >
      <div className="flex flex-col gap-2">
        {/* Title */}
        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-tight mt-1 line-clamp-2">
          {bin.name}
        </h4>

        {/* Distance and Address */}
        <div className="flex items-start gap-1.5 mt-1">
          <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            {bin.distance !== undefined && (
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                {formatDistance(bin.distance)} away
              </span>
            )}
            {bin.address && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                {bin.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigate Action Button */}
      <div className="mt-4">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block w-full"
        >
          <Button
            variant="default"
            size="sm"
            className="w-full py-5 text-xs font-black rounded-xl bg-gradient-eco text-white hover:opacity-90 shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Navigation className="h-3.5 w-3.5" />
            Navigate
          </Button>
        </a>
      </div>
    </div>
  );
}
