"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/lib/translations";
import { NDVI_GEOJSON, MOCK_REPORTS } from "@/lib/data";
import { getColor, getHeatLevel, getOpacity } from "@/lib/ndvi";
import { NDVIFeature } from "@/types";
import { MAP_THEMES } from "@/lib/mapThemes";
import { Navigation, Crosshair } from "lucide-react";
import { useMap } from "react-leaflet";

import MapThemeSwitcher from "./MapThemeSwitcher";

let L: typeof import("leaflet") | null = null;

// Cinematic Focus Component (Works like Sentinel Hub)
function MapInitialFocus({ center }: { center: [number, number] }) {
  const map = useMap();
  const hasFocused = useRef(false);

  useEffect(() => {
    if (!hasFocused.current && map) {
        map.flyTo(center, 13, { duration: 3, easeLinearity: 0.25 });
        hasFocused.current = true;
    }
  }, [center, map]);
  return null;
}

export default function EcoMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const currentTileLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const geoJsonLayerRef = useRef<import("leaflet").GeoJSON | null>(null);
  const markersRef = useRef<import("leaflet").LayerGroup | null>(null);
  
  const { state, dispatch } = useApp();
  const t = translations[state.language];
  const [isReady, setIsReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(state.userLocation || [30.998043, -6.755833]);
  const [locationLoaded, setLocationLoaded] = useState(!!state.userLocation);

  // Dynamic Leaflet Import
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import("leaflet").then((leaflet) => {
        L = leaflet.default;
        setIsReady(true);
      });
    }

    // Attempt to lock location early
    if (navigator.geolocation && !state.userLocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setMapCenter([latitude, longitude]);
                dispatch({ type: "SET_USER_LOCATION", payload: [latitude, longitude] });
                setLocationLoaded(true);
            },
            () => setLocationLoaded(true),
            { enableHighAccuracy: true }
        );
    } else if (state.userLocation) {
        setLocationLoaded(true);
    } else {
        setLocationLoaded(true);
    }
  }, [dispatch, state.userLocation]);

  const handleLocateUser = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([latitude, longitude], 13, { duration: 2 });
            }
        },
        () => {},
        { enableHighAccuracy: true }
    );
  };

  // Main Map Controller
  useEffect(() => {
    if (!isReady || !L || !mapRef.current) return;
    const Leaflet = L;

    // 1. Initialize Map Instance
    if (!mapInstanceRef.current) {
      const map = Leaflet.map(mapRef.current, {
        center: [20, 0], // Start global for orbital effect
        zoom: 3,
        zoomControl: false, 
        attributionControl: false,
      });
      mapInstanceRef.current = map;
      Leaflet.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('moveend', () => {
          const center = map.getCenter();
          const newCoords: [number, number] = [center.lat, center.lng];
          setMapCenter(newCoords);
          dispatch({ type: "SET_USER_LOCATION", payload: newCoords });
      });
    }

    const map = mapInstanceRef.current;

    // 2. Clear Existing Layers
    if (currentTileLayerRef.current) map.removeLayer(currentTileLayerRef.current);
    if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current);
    if (markersRef.current) map.removeLayer(markersRef.current);

    // 3. Add Tile Layer
    const theme = MAP_THEMES.find(t => t.id === state.mapTheme) || MAP_THEMES[0];
    currentTileLayerRef.current = Leaflet.tileLayer(theme.url, { maxZoom: 22 }).addTo(map);

    // 4. Add District Polygons with Corrected CSS
    geoJsonLayerRef.current = Leaflet.geoJSON(NDVI_GEOJSON as any, {
        style: (feature) => {
            const ndvi = (feature as NDVIFeature).properties.ndvi;
            return {
                fillColor: getColor(ndvi), weight: 1.5, opacity: 0.1,
                color: "rgba(255,255,255,0.05)", fillOpacity: getOpacity(ndvi),
            };
        },
        onEachFeature: (feature, layer) => {
            const f = feature as NDVIFeature;
            const { name, ndvi } = f.properties;
            const color = getColor(ndvi);
            layer.bindTooltip(
                `<div style="font-family:'DM Sans', sans-serif; font-weight:700;">
                  <div>${name}</div>
                  <div style="color:${color}; font-size:10px; font-mono; margin-top:4px; text-transform:uppercase;">NDVI ${ndvi.toFixed(3)}</div>
                </div>`,
                { className: "eco-tooltip", sticky: true, offset: [0, -8] }
            );
            layer.on("click", () => {
               dispatch({ type: "SELECT_FEATURE", payload: f });
               dispatch({ type: "SET_VIEW", payload: "ai" });
            });
        }
    }).addTo(map);

    // 5. Add Community Markers with Corrected CSS
    const markerGroup = Leaflet.layerGroup();
    const allReports = [...state.reports, ...MOCK_REPORTS];
    allReports.forEach(report => {
        const color = report.heatLevel === 'critical' ? '#ef4444' : report.heatLevel === 'moderate' ? '#f59e0b' : '#10b981';
        const customIcon = Leaflet.divIcon({
            className: 'custom-div-icon',
            html: `<div style="position:relative;"><div style="background:${color}; width:10px; height:10px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${color};"></div></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7]
        });
        const heatLabel = report.heatLevel === 'critical' ? t.criticalRiskArea : report.heatLevel === 'moderate' ? t.moderateStressZone : t.stableEcosystem;
        const author = report.author === "Anonymous Operative" ? t.anonymousOperative : report.author;

        Leaflet.marker(report.coordinates, { icon: customIcon })
               .addTo(markerGroup)
               .bindPopup(`<div style="padding:10px; min-width:200px; color:white; font-family:'DM Sans', sans-serif;">
                   <strong style="display:block; margin-bottom:4px;">${author}</strong>
                   <p style="font-size:12px; opacity:0.7; margin-bottom:8px; line-height:1.4;">${report.message}</p>
                   <div style="font-size:10px; font-weight:900; letter-spacing:0.1em; color:${color}; text-transform:uppercase;">${heatLabel}</div>
               </div>`, { className: 'eco-popup' });
    });
    markerGroup.addTo(map);
    markersRef.current = markerGroup;

    // Trigger flyTo once location is confirmed
    if (locationLoaded) {
        map.flyTo(mapCenter, 13, { duration: 3 });
    }

    return () => { };
  }, [isReady, state.mapTheme, locationLoaded, dispatch]);

  // Handle Focus Coords
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;
    if (state.focusCoords) {
        map.flyTo(state.focusCoords, 16, { duration: 1.5 });
        dispatch({ type: "SET_FOCUS_COORDS", payload: null });
    }
  }, [state.focusCoords, dispatch]);

  return (
    <div className="relative w-full h-full group overflow-hidden bg-obsidian-950">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-obsidian-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">{t.mappingNeuralNetwork}...</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full grayscale-[10%] brightness-[90%]" />

      {/* Map Controls - MOBILE OPTIMIZED (Top-20 for better header clearance) */}
      <div className="absolute top-20 right-4 lg:top-8 lg:right-8 z-[1002]">
          <MapThemeSwitcher align="right" className="relative scale-90 lg:scale-100" />
      </div>

      <div className="absolute top-20 left-4 lg:top-8 lg:left-8 z-[1002]">
          <button 
             onClick={handleLocateUser}
             className="glass rounded-xl lg:rounded-2xl p-2 lg:p-4 flex items-center gap-2 lg:gap-3 border-cyan-500/20 hover:border-cyan-500/50 shadow-2xl transition-all group"
          >
             <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                <Navigation className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
             </div>
             <div className="flex flex-col text-left">
                <span className="text-[7px] lg:text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-0.5 lg:mb-1">{t.satelliteLink}</span>
                <span className="text-[9px] lg:text-[11px] font-black text-white uppercase tracking-tighter">{t.locateMe}</span>
             </div>
          </button>
      </div>

      {/* Telemetry Display - Compact for Mobile */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1002] w-full max-w-sm px-6">
          <div className="glass px-4 lg:px-6 py-3 lg:py-4 rounded-[1.5rem] lg:rounded-[2rem] border-white/10 shadow-2xl backdrop-blur-3xl">
              <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1 lg:mb-2">
                      <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[7px] lg:text-[9px] font-black text-emerald-400 uppercase tracking-widest opacity-80">{t.sectorLock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="text-sm lg:text-lg font-mono font-black text-white tabular-nums tracking-tighter leading-none">
                        {mapCenter[0].toFixed(6)}°N <span className="opacity-20 mx-1">/</span> {mapCenter[1].toFixed(6)}°E
                     </div>
                     <Crosshair size={12} className="text-white/20 animate-spin-slow hidden sm:block" />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}