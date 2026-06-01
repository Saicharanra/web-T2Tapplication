"use client";

import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadiusSelectorProps {
  value: number; // radius in km
  onChange: (value: number) => void;
}

const presetRadiuses = [2, 5, 10];

export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Compass className="h-4 w-4 text-emerald-500" /> Range Radius
        </span>
        <span className="text-emerald-600 dark:text-emerald-400">{value} km</span>
      </div>

      <div className="flex gap-2 w-full items-center">
        {/* Presets */}
        <div className="flex gap-1.5 shrink-0">
          {presetRadiuses.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-xl border transition-all active:scale-95",
                value === r
                  ? "bg-emerald-500 border-transparent text-white shadow-sm"
                  : "border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
              )}
            >
              {r}k
            </button>
          ))}
        </div>

        {/* Custom Radius Slider */}
        <div className="flex-1 flex items-center gap-2 pl-1">
          <input
            type="range"
            min="1"
            max="50"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
