"use client";

import { cn } from "@/lib/utils";

interface FilterBarProps {
  selected: string;
  onChange: (filter: string) => void;
}

interface FilterItem {
  id: string;
  label: string;
  emoji: string;
  activeColor: string;
  hoverColor: string;
}

const filters: FilterItem[] = [
  {
    id: "all",
    label: "All Locations",
    emoji: "🌐",
    activeColor: "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-md",
    hoverColor: "hover:border-slate-300 text-slate-600 dark:text-slate-300",
  },
  {
    id: "public_bin",
    label: "Public Bin",
    emoji: "🚮",
    activeColor: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 border-transparent",
    hoverColor: "hover:border-emerald-200 text-slate-600 dark:text-slate-300",
  },
];

export function FilterBar({ selected, onChange }: FilterBarProps) {
  return (
    <div className="w-full overflow-x-auto pb-1 flex gap-2 no-scrollbar scroll-smooth">
      {filters.map((filter) => {
        const isActive = selected === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-100 dark:border-slate-800 text-xs font-semibold transition-all duration-300 transform active:scale-95 shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm",
              isActive 
                ? filter.activeColor
                : filter.hoverColor
            )}
          >
            <span className="text-sm leading-none select-none">{filter.emoji}</span>
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
