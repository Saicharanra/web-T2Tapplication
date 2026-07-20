"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on role
        if (user.role === "BUSINESS" || user.role === "business") {
          router.push("/business");
        } else if (user.role === "ADMIN") {
          router.push("/owner");
        } else {
          // If a custom redirect path is provided (e.g. for password resets), use it
          const nextPath = searchParams.get("next") || "/dashboard/home";
          router.push(nextPath);
        }
      } else {
        router.push("/sign-in");
      }
    }
  }, [user, loading, router, searchParams]);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
      <p className="text-slate-400 font-medium">Completing verification and signing you in...</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        <p className="text-slate-400 font-medium">Loading session...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
