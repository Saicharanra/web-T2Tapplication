"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { BinDocument, UserLocation } from "@/types/find-bins";
import { UserLocationMarker } from "./UserLocationMarker";
import { Navigation } from "lucide-react";

import "leaflet/dist/leaflet.css";

interface BinMapProps {
  bins: BinDocument[];
  userLocation: UserLocation | null;
  selectedBinId: string | null;
  onSelectBin: (bin: BinDocument) => void;
}

function MapController({
  selectedBin,
}: {
  selectedBin: BinDocument | null;
}) {
  const map = useMap();
  const prevSelectedBinIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedBin) {
      if (prevSelectedBinIdRef.current !== selectedBin.id) {
        prevSelectedBinIdRef.current = selectedBin.id;
        map.flyTo([selectedBin.latitude, selectedBin.longitude], 16, {
          animate: true,
          duration: 1.2,
        });
      }
    }
  }, [selectedBin, map]);

  return null;
}

// Generate premium leaflet divIcon for disposal/bin locations
const getEcoMarkerIcon = (isSelected: boolean) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center rounded-full text-white shadow-xl bg-gradient-to-r from-emerald-500 to-teal-500 ring-emerald-300 ${
        isSelected
          ? "h-11 w-11 ring-4 ring-emerald-400 scale-110 border-2 border-white"
          : "h-9 w-9 ring-2 border border-white"
      } transition-all duration-300 transform hover:scale-115">
        <span class="text-sm select-none">🚮</span>
        <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 ${
          isSelected ? "bg-white border-r border-b border-emerald-400" : "bg-teal-500 border-r border-b border-white/50"
        } rotate-45 z-[-1]"></div>
      </div>
    `,
    className: "custom-bin-marker-wrapper",
    iconSize: isSelected ? [44, 44] : [36, 36],
    iconAnchor: isSelected ? [22, 44] : [18, 36],
    popupAnchor: [0, -36],
  });
};

export default function BinMap({
  bins,
  userLocation,
  selectedBinId,
  onSelectBin,
}: BinMapProps) {
  const selectedBin = bins.find((b) => b.id === selectedBinId) || null;

  const defaultPosition: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [37.7749, -122.4194];

  return (
    <div className="w-full h-full rounded-3xl border border-white/50 dark:border-slate-800/50 overflow-hidden shadow-inner relative bg-slate-100 dark:bg-slate-950/20">
      <MapContainer
        center={defaultPosition}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && <UserLocationMarker location={userLocation} />}

        {bins.map((bin) => {
          const isSelected = bin.id === selectedBinId;
          return (
            <Marker
              key={bin.id}
              position={[bin.latitude, bin.longitude]}
              icon={getEcoMarkerIcon(isSelected)}
              eventHandlers={{
                click: () => onSelectBin(bin),
              }}
            >
              <Popup className="custom-popup rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-2.5 max-w-[200px] flex flex-col gap-2">
                  <div>
                    <h5 className="font-bold text-slate-800 text-[13px] leading-tight line-clamp-2">
                      {bin.name}
                    </h5>
                    {bin.distance !== undefined && (
                      <span className="text-[10px] font-black text-emerald-600">
                        {bin.distance < 1
                          ? `${(bin.distance * 1000).toFixed(0)} meters`
                          : `${bin.distance.toFixed(2)} km`}{" "}
                        away
                      </span>
                    )}
                  </div>

                  {bin.address && (
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {bin.address}
                    </p>
                  )}

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${bin.latitude},${bin.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-bold rounded-lg bg-gradient-eco text-white hover:opacity-90 shadow-sm transition-all text-center"
                  >
                    <Navigation className="h-3 w-3" />
                    Navigate
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapController selectedBin={selectedBin} />
      </MapContainer>

      {/* Map Custom Controls / Legend */}
      <div className="absolute bottom-4 left-4 z-[500] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2.5 rounded-2xl border border-white/50 dark:border-slate-800 shadow-lg text-[10px] font-medium text-slate-500 dark:text-slate-400 flex flex-col gap-1.5">
        <div className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1 mb-1 text-[11px]">
          🌱 Map Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span>Your Current Location</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 border border-white inline-block"></span>
          <span>Community Disposal Spots</span>
        </div>
      </div>
    </div>
  );
}
