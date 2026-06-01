"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-emerald-500/70 dark:text-emerald-400/70" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search bins by name, address, or type..."
        className="w-full pl-11 pr-10 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-emerald-100 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm hover:border-emerald-300 dark:hover:border-slate-700"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-rose-500 text-slate-400 transition-colors"
          title="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
