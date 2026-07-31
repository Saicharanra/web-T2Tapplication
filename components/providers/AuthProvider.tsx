"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: string;
  level: string;
  points: number;
  imageUrl?: string | null;
  photoURL?: string | null;
  displayName?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserSession = async (sessionUser: any) => {
    const name = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split("@")[0] || "User";
    const email = sessionUser.email || "";
    const imageUrl = sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || null;

    try {
      const syncRes = await fetch("/api/auth/supabase-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sessionUser.id,
          name,
          email,
          imageUrl,
        }),
      });

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        const finalUserId = syncData.userId || sessionUser.id;
        localStorage.setItem("t2t_user_id", finalUserId);
        setUser({
          uid: finalUserId,
          email,
          name,
          role: syncData.role || "USER",
          level: syncData.level || "BRONZE",
          points: syncData.points ?? 0,
          imageUrl,
          photoURL: imageUrl,
          displayName: name,
        });
        return;
      }
    } catch (err) {
      console.error("⚠️ Supabase Auth session sync failed:", err);
    }

    // Fallback: populate user state directly from Supabase session if API sync failed
    localStorage.setItem("t2t_user_id", sessionUser.id);
    setUser({
      uid: sessionUser.id,
      email,
      name,
      role: "USER",
      level: "BRONZE",
      points: 0,
      imageUrl,
      photoURL: imageUrl,
      displayName: name,
    });
  };

  useEffect(() => {
    // 1. Listen to Auth State Changes (triggers on mount and active sessions)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔑 Auth State Event: ${event}`);
      if (session?.user) {
        await syncUserSession(session.user);
      } else {
        localStorage.removeItem("t2t_user_id");
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await syncUserSession(session.user);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("⚠️ Error signing out from Supabase Auth:", err);
    }
    localStorage.removeItem("t2t_user_id");
    setUser(null);
    window.location.href = "/sign-in";
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
