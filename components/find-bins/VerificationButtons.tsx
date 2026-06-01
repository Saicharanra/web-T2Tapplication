"use client";

import { Check, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface VerificationButtonsProps {
  binId: string;
  verificationCount: number;
  reportCount: number;
  onVerify: () => Promise<void>;
  onReport: () => Promise<void>;
}

export function VerificationButtons({
  binId,
  verificationCount,
  reportCount,
  onVerify,
  onReport,
}: VerificationButtonsProps) {
  const [loading, setLoading] = useState<"verify" | "report" | null>(null);
  const [hasVoted, setHasVoted] = useState<"verify" | "report" | null>(null);

  const handleVerify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVoted) return;
    setLoading("verify");
    try {
      await onVerify();
      setHasVoted("verify");
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVoted) return;
    setLoading("report");
    try {
      await onReport();
      setHasVoted("report");
    } catch (err) {
      console.error("Reporting failed:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2 w-full mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
      {/* Verify Button */}
      <Button
        onClick={handleVerify}
        disabled={loading !== null || hasVoted !== null}
        variant="outline"
        size="sm"
        className={`flex-1 rounded-xl text-xs font-semibold py-1.5 transition-all ${
          hasVoted === "verify"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold"
            : "hover:bg-emerald-50/50 hover:text-emerald-600 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        }`}
      >
        {loading === "verify" ? (
          <div className="h-3.5 w-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-1"></div>
        ) : hasVoted === "verify" ? (
          <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />
        ) : (
          <Check className="h-3.5 w-3.5 mr-1" />
        )}
        Verify Exists ({verificationCount + (hasVoted === "verify" ? 1 : 0)})
      </Button>

      {/* Report Button */}
      <Button
        onClick={handleReport}
        disabled={loading !== null || hasVoted !== null}
        variant="outline"
        size="sm"
        className={`rounded-xl text-xs font-semibold py-1.5 transition-all ${
          hasVoted === "report"
            ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold"
            : "hover:bg-rose-50/50 hover:text-rose-600 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
        }`}
        title="Report wrong coordinates or removed bin"
      >
        {loading === "report" ? (
          <div className="h-3.5 w-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mr-1"></div>
        ) : hasVoted === "report" ? (
          <ShieldAlert className="h-3.5 w-3.5 mr-1 stroke-[3]" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
        )}
        Report ({reportCount + (hasVoted === "report" ? 1 : 0)})
      </Button>
    </div>
  );
}
