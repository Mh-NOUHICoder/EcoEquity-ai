"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup, Rectangle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Crosshair, Zap } from "lucide-react";

import { useApp } from "@/context/AppContext";
import { translations } from "@/lib/translations";
import { NDVI_GEOJSON, MOCK_REPORTS } from "@/lib/data";
import { getColor, getHeatLevel, getOpacity, getDynamicNDVI, getSmoothColor } from "@/lib/ndvi";
import { MAP_THEMES } from "@/lib/mapThemes";
import MapThemeSwitcher from "./MapThemeSwitcher";
import { HeatRiskLayer } from "./HeatRiskLayer";
import { MapSearch } from "./MapSearch";

// --- Constants ---
const HUD_GLASS = `relative bg-[#05080D]/90 backdrop-blur-[40px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)]`;

// --- Helpers ---
function MapFocusHandler() {
  const map = useMap();
  const { state, dispatch } = useApp();
  
  useEffect(() => {
    if (state.focusCoords) {
      map.flyTo(state.focusCoords, 15, { duration: 2.5 });
      dispatch({ type: "SET_FOCUS_COORDS", payload: null });
    }
  }, [state.focusCoords, map, dispatch]);
  
  return null;
}

function MapMoveHandler({ onMove }: { onMove: (coords: [number, number]) => void }) {
    const map = useMap();
    useEffect(() => {
        const handleMove = () => {
            const center = map.getCenter();
            onMove([center.lat, center.lng]);
        };
        map.on("moveend", handleMove);
        return () => { map.off("moveend", handleMove); };
    }, [map, onMove]);
    return null;
}

export default function EcoMap() {
  const { state, dispatch } = useApp();
  const t = translations[state.language];
  const theme = MAP_THEMES.find(th => th.id === state.mapTheme) || MAP_THEMES[0];
  
  const [mapCenter, setMapCenter] = useState<[number, number]>(state.userLocation || [30.998043, -6.755833]);
  const [locationLoaded, setLocationLoaded] = useState(false);

  useEffect(() => {
    // Initial Geolocation
    if (navigator.geolocation && !state.userLocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setMapCenter(coords);
                dispatch({ type: "SET_USER_LOCATION", payload: coords });
                setLocationLoaded(true);
            },
            () => setLocationLoaded(true),
            { enableHighAccuracy: true }
        );
    } else {
        setLocationLoaded(true);
    }
  }, []);

  const handleLocateUser = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            dispatch({ type: "SET_FOCUS_COORDS", payload: [pos.coords.latitude, pos.coords.longitude] });
        });
    }
  };

  const allReports = useMemo(() => [...state.reports, ...MOCK_REPORTS], [state.reports]);

  return (
    <div id="main-map-container" className="relative w-full h-full group overflow-hidden bg-obsidian-950">
      
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        zoomControl={false} 
        style={{ height: "100%", width: "100%" }}
        className="bg-obsidian-950"
      >
        <TileLayer url={theme.url} attribution={theme.attribution} />
        
        {locationLoaded && (
            <>
                <MapMoveHandler onMove={setMapCenter} />
                <MapFocusHandler />

                {state.heatRiskMode ? (
                    <HeatRiskLayer />
                ) : (
                    <GeoJSON 
                        data={NDVI_GEOJSON as any} 
                        style={(feature) => ({
                            fillColor: getColor(feature?.properties.ndvi),
                            weight: 1.5,
                            opacity: 0.2,
                            color: "rgba(255,255,255,0.1)",
                            fillOpacity: 0.4
                        })}
                        onEachFeature={(feature, layer) => {
                            const { name, ndvi } = feature.properties;
                            layer.bindTooltip(
                                `<div class="font-sans text-[10px] font-bold p-1">
                                    <div class="text-white/60 mb-0.5">${name}</div>
                                    <div style="color:${getColor(ndvi)}">NDVI ${ndvi.toFixed(3)}</div>
                                 </div>`, 
                                { sticky: true, className: "eco-tooltip" }
                            );
                            layer.on("click", () => {
                                dispatch({ type: "SELECT_FEATURE", payload: feature as any });
                                dispatch({ type: "SET_VIEW", payload: "ai" });
                            });
                        }}
                    />
                )}

                {/* User / Focus Marker Pulse */}
                <Marker position={state.userLocation ?? mapCenter} icon={L.divIcon({
                    className: 'user-lock-icon',
                    html: `
                        <div class="relative group" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                            <div class="absolute w-10 h-10 bg-cyan-500/20 rounded-full animate-ping"></div>
                            <div class="absolute w-4 h-4 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
                            <div class="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[#05080D]/90 px-3 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-md text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap shadow-2xl">
                                ${t.sectorLock}
                            </div>
                        </div>
                    `,
                    iconSize: [40, 40], iconAnchor: [20, 20]
                })} />

                {allReports.map(report => {
                    const color = report.heatLevel === 'critical' ? '#ef4444' : report.heatLevel === 'moderate' ? '#f59e0b' : '#10b981';
                    const icon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="position:relative;"><div style="background:${color}; width:10px; height:10px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${color};"></div></div>`,
                        iconSize: [14, 14], iconAnchor: [7, 7]
                    });
                    return (
                        <Marker key={report.id} position={report.coordinates} icon={icon}>
                            <Popup className="eco-popup">
                                <div className="p-2 min-w-[180px] text-white">
                                    <strong className="block mb-1">{report.author === "Anonymous Operative" ? t.anonymousOperative : report.author}</strong>
                                    <p className="text-xs opacity-80 mb-2">{report.message}</p>
                                    <div className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
                                        {report.heatLevel === 'critical' ? t.criticalRiskArea : report.heatLevel === 'moderate' ? t.moderateStressZone : t.stableEcosystem}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </>
        )}
      </MapContainer>

      {/* --- INTEGRATED COMMAND DECK --- */}
      
      {/* 1. TACTICAL HEADER (Top Center) */}
      <div className="absolute top-24 lg:top-8 left-1/2 -translate-x-1/2 z-[1005] w-full max-w-sm lg:max-w-3xl px-4 pointer-events-none">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 pointer-events-auto"
          >
              <div className="flex-1 w-full">
                <MapSearch />
              </div>

              {/* Seamless Toggle Unit */}
              <div className={`${HUD_GLASS} px-2 py-2 rounded-3xl border-emerald-500/20 flex items-center gap-1 shadow-2xl`}>
                <button
                  onClick={() => dispatch({ type: "TOGGLE_HEAT_RISK" })}
                  className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!state.heatRiskMode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  {t.theme_terrain}
                </button>
                <div className="w-[1px] h-4 bg-white/10" />
                <button
                  onClick={() => dispatch({ type: "TOGGLE_HEAT_RISK" })}
                  className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${state.heatRiskMode ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Zap size={12} className={state.heatRiskMode ? 'fill-emerald-400' : ''} />
                  {t.heatRisk}
                </button>
              </div>
          </motion.div>
      </div>

      {/* 2. VISION BRIDGE (Bottom Bar) */}
      <div className="absolute bottom-10 left-6 right-6 lg:left-12 lg:right-12 z-[1002] pointer-events-none">
          <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-6 w-full">
              
              {/* LEFT: Satellite Link & Location */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="pointer-events-auto"
              >
                  <button 
                    onClick={handleLocateUser}
                    className={`${HUD_GLASS} rounded-3xl p-3 lg:p-4 flex items-center gap-4 border-cyan-500/20 hover:border-cyan-500/50 shadow-2xl transition-all group`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                        <Navigation className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex flex-col text-left pr-4">
                        <span className="text-[8px] lg:text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{t.satelliteLink}</span>
                        <span className="text-[10px] lg:text-[12px] font-black text-white uppercase tracking-tighter">{t.locateMe}</span>
                    </div>
                  </button>
              </motion.div>

              {/* CENTER: Main Telemetry Display */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pointer-events-auto flex-1 max-w-sm lg:max-w-lg hidden sm:block"
              >
                  <div className={`${HUD_GLASS} px-8 py-4 rounded-[2.5rem] border-white/5 shadow-2xl backdrop-blur-3xl relative overflow-hidden group`}>
                      <div className="relative flex flex-col items-center">
                          <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[8px] font-black text-emerald-400/80 uppercase tracking-[0.3em]">{t.sectorLock}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                             <div className="text-lg lg:text-xl font-mono font-black text-white tabular-nums tracking-widest leading-none">
                                {mapCenter[0].toFixed(5)}°N <span className="text-white/5 mx-1">/</span> {mapCenter[1].toFixed(5)}°E
                             </div>
                             <div className="w-px h-5 bg-white/10" />
                             <Crosshair size={14} className="text-white/20 animate-spin-slow group-hover:text-emerald-400 transition-colors" />
                          </div>
                      </div>
                  </div>
              </motion.div>

              {/* RIGHT: Atmosphere & Theme */}
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="pointer-events-auto flex flex-col items-end gap-3"
              >
                  <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pr-4">{t.selectTerrain}</div>
                  <MapThemeSwitcher align="right" direction="up" className="relative scale-90 lg:scale-100" />
              </motion.div>
          </div>
      </div>

    </div>
  );
}