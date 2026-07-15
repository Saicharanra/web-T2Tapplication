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
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("t2t_user_id");
    if (!userId) {
      setLoading(false);
      return;
    }

    // Fetch user profile from Supabase
    supabase
      .from("User")
      .select("id, name, email, role, level, points, imageUrl")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          // Invalid stored ID — clear it
          localStorage.removeItem("t2t_user_id");
          setUser(null);
        } else {
          setUser({
            uid: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            level: data.level,
            points: data.points,
            imageUrl: data.imageUrl,
          });
        }
        setLoading(false);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("t2t_user_id");
    setUser(null);
    window.location.href = "/sign-in";
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
