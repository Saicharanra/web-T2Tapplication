"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

interface PointsContextType {
  points: number;
  pointsLoading: boolean;
  refreshPoints: () => Promise<void>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState<number>(0);
  const [pointsLoading, setPointsLoading] = useState(true);
  const { user } = useUser();

  const refreshPoints = useCallback(async () => {
    if (!user) {
      setPointsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/stats', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPoints(data.totalPoints || 0);
      } else {
        console.error('Failed to fetch points:', response.status);
        setPoints(0);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
      setPoints(0);
    } finally {
      setPointsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshPoints();
  }, [refreshPoints]);

  return (
    <PointsContext.Provider value={{ points, pointsLoading, refreshPoints }}>
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
