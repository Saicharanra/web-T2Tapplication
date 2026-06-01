"use client";

import { useState, useEffect, useCallback } from "react";
import { UserLocation, UseLocationResult } from "@/types/find-bins";

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
        setError(null);
      },
      (geoError) => {
        setLoading(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError(
              "GPS permission denied. Please allow location access in your browser settings to find recycling bins near you."
            );
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError(
              "Location information is unavailable. Please check your device's GPS or network connection."
            );
            break;
          case geoError.TIMEOUT:
            setError(
              "Location request timed out. Please check your connection and try again."
            );
            break;
          default:
            setError("An unknown error occurred while retrieving your location.");
        }
      },
      options
    );
  }, []);

  // Request location on load
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {
    location,
    loading,
    error,
    requestPermission,
  };
}
