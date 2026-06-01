"use client";

import { BinDocument } from "@/types/find-bins";
import { BinCard } from "./BinCard";
import { ShieldAlert, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BinListProps {
  bins: BinDocument[];
  selectedBinId: string | null;
  onSelectBin: (bin: BinDocument) => void;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function BinList({
  bins,
  selectedBinId,
  onSelectBin,
  loading,
  error,
  onRetry,
}: BinListProps) {
  // Skeleton Loading Cards
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-4 rounded-3xl bg-white/30 dark:bg-slate-900/30 border border-white/40 dark:border-slate-800/40 shadow-sm animate-pulse flex flex-col gap-3"
          >
            <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="flex gap-2 items-center">
              <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-3.5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded-xl mt-1" />
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-center flex flex-col items-center justify-center gap-4">
        <div className="p-3.5 bg-rose-500/10 rounded-full text-rose-500">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            Location Services Inactive
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
            {error}
          </p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            className="rounded-xl border border-rose-500/30 text-rose-500 bg-white/20 hover:bg-rose-500/10 transition-all text-xs"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Retry GPS Hook
          </Button>
        )}
      </div>
    );
  }

  // Empty State (No Bins found)
  if (bins.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center flex flex-col items-center justify-center gap-4">
        <div className="p-3.5 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400">
          <Trash2 className="h-7 w-7" />
        </div>
        <div>
          <h4 className="font-bold text-slate-855 dark:text-slate-200 text-sm">
            No Nearby Disposals Detected
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
            No disposal locations match your search or current range.
          </p>
        </div>
      </div>
    );
  }

  // Render Scrollable Bin List
  return (
    <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-240px)] pr-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
      {bins.map((bin) => (
        <BinCard
          key={bin.id}
          bin={bin}
          isSelected={bin.id === selectedBinId}
          onSelect={() => onSelectBin(bin)}
        />
      ))}
    </div>
  );
}
