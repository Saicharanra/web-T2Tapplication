"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

interface PointsContextType {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  pointsLoading: boolean;
  refreshPoints: () => Promise<void>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState<number>(0);
  const [pointsLoading, setPointsLoading] = useState(true);
  const { user } = useAuth();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refreshPoints = useCallback(async () => {
    if (!user) {
      if (isMounted.current) {
        setPointsLoading(false);
      }
      return;
    }

    try {
      const response = await fetchWithAuth('/api/users/stats', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (isMounted.current) {
          setPoints(data.totalPoints ?? 0);
        }
      } else {
        console.warn('Backend API unavailable. Points will show 0 until database is connected.');
        if (isMounted.current) {
          setPoints(0);
        }
      }
    } catch (error) {
      console.warn('Backend API unavailable or network error.', error);
      if (isMounted.current) {
        setPoints(0);
      }
    } finally {
      if (isMounted.current) {
        setPointsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    refreshPoints();
  }, [refreshPoints]);

  return (
    <PointsContext.Provider value={{ points, setPoints, pointsLoading, refreshPoints }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
}
