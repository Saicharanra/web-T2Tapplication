"use client";

import { useEffect } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { UserLocation } from "@/types/find-bins";

interface UserLocationMarkerProps {
  location: UserLocation;
}

// Custom CSS-based glowing pulsing marker for the user
const userDivIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center h-8 w-8">
      <div class="absolute h-6 w-6 bg-blue-500 rounded-full animate-ping opacity-60"></div>
      <div class="absolute h-4.5 w-4.5 bg-blue-400 rounded-full opacity-40"></div>
      <div class="relative h-3 w-3 bg-blue-600 border-2 border-white rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
    </div>
  `,
  className: "custom-user-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export function UserLocationMarker({ location }: UserLocationMarkerProps) {
  const map = useMap();

  // Automatically fly to user location on initial load
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [location, map]);

  return (
    <Marker position={[location.lat, location.lng]} icon={userDivIcon}>
      <Popup className="custom-popup rounded-2xl overflow-hidden shadow-xl">
        <div className="p-2 text-center">
          <p className="font-bold text-slate-800 text-sm">📍 Your Location</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Accurate to {location.accuracy?.toFixed(0) || "10"} meters
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
