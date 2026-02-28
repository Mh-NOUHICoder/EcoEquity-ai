"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents, Rectangle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoJsonObject } from "geojson";
import L from "leaflet";
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from "framer-motion";
import { 
  Shield, Satellite, Calendar, Cloud, BarChart3, Activity, Globe, Loader2, AlertCircle,
  Crosshair, Cpu, Monitor, Zap, Command, Target
} from "lucide-react";
import { MAP_THEMES } from "@/lib/mapThemes";
import { useApp } from "@/context/AppContext";
import { translations } from "@/lib/translations";
import MapThemeSwitcher from "./MapThemeSwitcher";
import { STACFeatureCollection, STACFeature } from "@/types";
import { getColor, getHeatLevel } from "@/lib/ndvi";
import { MOCK_REPORTS } from "@/lib/data";

// --- Constants for Premium Global HUD ---
const HUD_GLASS = `relative bg-[#05080D]/90 backdrop-blur-[40px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)]`;

// --- Helpers ---
const getDynamicNDVI = (lat: number, lng: number) => {
  const seed = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
  return 0.1 + (seed - Math.floor(seed)) * 0.75;
};

const SmoothValue = ({ value }: { value: number | null }) => {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => v.toFixed(3));
  useEffect(() => { animate(motionValue, value ?? 0, { duration: 0.6, ease: "circOut" }); }, [value]);
  return <motion.span className="tabular-nums">{value === null ? "0.000" : rounded}</motion.span>;
};

// --- Map Logic ---
const GlobalGrid = ({ onCellHover }: { onCellHover: (data: any) => void }) => {
  const map = useMap();
  const [bounds, setBounds] = useState(map.getBounds());
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({ 
    dragend: () => setBounds(map.getBounds()), 
    zoomend: () => { setZoom(map.getZoom()); setBounds(map.getBounds()); } 
  });

  const cells = useMemo(() => {
    const res = zoom >= 15 ? 0.0025 : zoom >= 14 ? 0.006 : zoom >= 13 ? 0.015 : zoom >= 12 ? 0.03 : 0.08;
    if (zoom < 11) return [];
    
    const list = [];
    const n = Math.ceil(bounds.getNorth() / res) * res;
    const s = Math.floor(bounds.getSouth() / res) * res;
    const e = Math.ceil(bounds.getEast() / res) * res;
    const w = Math.floor(bounds.getWest() / res) * res;

    for (let lat = s; lat < n; lat += res) {
      for (let lng = w; lng < e; lng += res) {
        const ndvi = getDynamicNDVI(lat + res/2, lng + res/2);
        list.push({ 
            id: `${lat}-${lng}`, bounds: [[lat, lng], [lat + res, lng + res]] as L.LatLngBoundsExpression, 
            ndvi, lat: lat + res/2, lng: lng + res/2 
        });
      }
    }
    return list.slice(0, 400); // Limit for performance
  }, [bounds, zoom]);

  return (
    <>
      {cells.map((cell) => (
        <Rectangle 
          key={cell.id} bounds={cell.bounds} 
          pathOptions={{ 
            fillColor: getColor(cell.ndvi), 
            fillOpacity: zoom >= 15 ? 0.25 : 0.15, 
            color: "rgba(255,255,255,0.05)", weight: 0.5 
          }} 
          eventHandlers={{ 
            mouseover: () => onCellHover({ lat: cell.lat, lng: cell.lng, ndvi: cell.ndvi }),
            click: () => onCellHover({ lat: cell.lat, lng: cell.lng, ndvi: cell.ndvi }),
          }} 
        />
      ))}
    </>
  );
};

// --- Auto-Focus Component ---
const MapInitialFocus = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  const { state } = useApp();
  const hasFocused = useRef(false);

  useEffect(() => {
    // If there's a specific coordinate to focus on (e.g. from Analyze button), 
    // we let MapFocusHandler handle it instead of doing the initial fly-to.
    if (!hasFocused.current && !state.focusCoords) {
        map.flyTo(center, 13, { duration: 3, easeLinearity: 0.25 });
        hasFocused.current = true;
    } else if (state.focusCoords) {
        // Mark as focused so we don't interfere later
        hasFocused.current = true;
    }
  }, [center, map, state.focusCoords]);
  return null;
};

// --- Map Events Wrapper ---
const MapMoveHandler = ({ onMove }: { onMove: (center: [number, number]) => void }) => {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onMove([center.lat, center.lng]);
    }
  });
  return null;
};

// --- Focus Coordination ---
const MapFocusHandler = () => {
  const map = useMap();
  const { state, dispatch } = useApp();
  
  useEffect(() => {
    if (state.focusCoords) {
      map.flyTo(state.focusCoords, 15, { duration: 2.5 });
      dispatch({ type: "SET_FOCUS_COORDS", payload: null });
    }
  }, [state.focusCoords, map, dispatch]);
  
  return null;
};

const ReportMarkers = () => {
  const { state } = useApp();
  const t = translations[state.language];
  const allReports = useMemo(() => [...state.reports, ...MOCK_REPORTS], [state.reports]);

  const getHeatLabel = (level: string) => {
    if (level === "critical") return t.criticalRiskArea;
    if (level === "moderate") return t.moderateStressZone;
    return t.stableEcosystem;
  };

  return (
    <>
      {allReports.map((report) => {
        const color = report.heatLevel === 'critical' ? '#ef4444' : report.heatLevel === 'moderate' ? '#f59e0b' : '#10b981';
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="position:relative;"><div style="background:${color}; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 15px ${color}; animate: pulse 2s infinite;"></div></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        return (
          <Marker key={report.id} position={report.coordinates} icon={icon}>
            <Popup className="eco-popup">
               <div className="p-3 min-w-[200px] text-white font-sans">
                   <strong className="block mb-1 text-sm">{report.author === "Anonymous Operative" ? t.anonymousOperative : report.author}</strong>
                   <p className="text-xs opacity-70 mb-2 leading-relaxed">{report.message}</p>
                   <div className="text-[9px] font-black tracking-widest uppercase" style={{ color }}>{getHeatLabel(report.heatLevel)}</div>
               </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

// --- Main Platform HUD ---
const SentinelMap: React.FC = () => {
  const { state, dispatch } = useApp();
  const t = translations[state.language];
  const theme = MAP_THEMES.find(t => t.id === state.mapTheme) || MAP_THEMES[0];
  const [currentCenter, setCurrentCenter] = useState<[number, number]>(state.userLocation || [30.998043, -6.755833]);
  const [hoveredCell, setHoveredCell] = useState<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [locationLoaded, setLocationLoaded] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", (e) => setMousePos({ x: e.clientX, y: e.clientY }));

    // Global Geolocation Sync
    if (navigator.geolocation && !state.userLocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentCenter([latitude, longitude]);
                dispatch({ type: "SET_USER_LOCATION", payload: [latitude, longitude] });
                setLocationLoaded(true);
            },
            () => {
                setLocationLoaded(true); // Proceed with default if blocked
            },
            { enableHighAccuracy: true }
        );
    } else {
        setLocationLoaded(true);
    }

    return () => {
        window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-[700px] lg:h-[850px] rounded-[3rem] lg:rounded-[5rem] overflow-hidden border border-white/20 shadow-[0_60px_120px_rgba(0,0,0,1)] bg-black">
      
      <MapContainer center={[20, 0]} zoom={3} zoomControl={false} style={{ height: "100%", width: "100%" }} className="bg-[#05080D]">
        <TileLayer url={theme.url} attribution={theme.attribution} />
        {locationLoaded && (
          <>
            <GlobalGrid onCellHover={setHoveredCell} />
            <MapMoveHandler onMove={setCurrentCenter} />
            <MapInitialFocus center={currentCenter} />
            <MapFocusHandler />
            <ReportMarkers />
          </>
        )}
      </MapContainer>

      {/* --- COMMAND COCKPIT OVERLAY --- */}

      {/* Global Sector Status (Top Left - MOBILE OPTIMIZED) */}
      <div className="absolute top-24 left-4 lg:top-12 lg:left-12 z-[1002] flex flex-col gap-5">
          <div className={`${HUD_GLASS} p-4 lg:p-7 rounded-[1.5rem] lg:rounded-[2.25rem] border-emerald-500/20 w-[180px] lg:w-72 shadow-2xl`}>
              <div className="flex items-center justify-between mb-3 lg:mb-4 border-b border-white/10 pb-2 lg:pb-3">
                  <div className="flex items-center gap-2 lg:gap-2.5">
                      <Command className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-400" />
                      <span className="text-[8px] lg:text-[9px] font-black text-white uppercase tracking-[0.2em]">{t.commandOverview}</span>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-1.5">
                      <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[7px] lg:text-[8px] font-black text-emerald-400 uppercase tracking-widest">{t.activeOps}</span>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 lg:gap-4">
                  <div className="flex flex-col">
                      <span className="text-[7px] lg:text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{t.elevation.substring(0, 5)}.</span>
                      <span className="text-[9px] lg:text-[11px] font-mono font-black text-white/80">
                         {hoveredCell ? (Math.random()*40 + 1160).toFixed(0) : "---"}m
                      </span>
                  </div>
                  <div className="flex flex-col border-l border-white/5 pl-2 lg:pl-4">
                      <span className="text-[7px] lg:text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{t.atmosphere.substring(0, 4)}.</span>
                      <span className="text-[9px] lg:text-[11px] font-mono font-black text-white/80 uppercase">{t.pristine}</span>
                  </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-cyan-400" />
                      <span className="text-[8px] lg:text-[9px] font-black text-white/40 uppercase tracking-widest">{t.spectralCapture}</span>
                  </div>
                   <span className="text-[9px] lg:text-[10px] font-mono font-black text-cyan-400">
                      {new Date().toLocaleDateString(state.language === 'es' ? 'es-ES' : state.language === 'ar' ? 'ar-SA' : state.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </span>
              </div>
          </div>
      </div>

      {/* FIXED THEME SWITCHER (Top Right - MOBILE OPTIMIZED) */}
      <div className="absolute top-24 right-4 lg:top-12 lg:right-12 z-[1002]">
          <MapThemeSwitcher align="right" className="relative scale-90 lg:scale-100" />
      </div>

      {/* Global Telemetry HUD (Bottom Center) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1002] w-full max-w-xl px-6">
          <div className={`${HUD_GLASS} px-6 lg:px-8 py-4 lg:py-5 rounded-[2rem] lg:rounded-[2.5rem] border-cyan-500/20 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8 group hover:border-cyan-500/40 transition-all duration-500`}>
              <div className="flex items-center gap-4 lg:gap-5">
                  <div className="relative hidden sm:block">
                      <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full animate-pulse" />
                      <div className="relative p-2.5 lg:p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                          <Target className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />
                      </div>
                  </div>
                   <div className="flex flex-col text-center lg:text-left">
                       <span className="text-[7px] lg:text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">{t.targetLockCoords}</span>
                       <div className="text-sm lg:text-xl font-mono font-black text-white tracking-widest tabular-nums leading-none">
                         {currentCenter[0].toFixed(6)}°N <span className="text-cyan-500/30">/</span> {currentCenter[1].toFixed(6)}°E
                       </div>
                   </div>
              </div>

              <div className="hidden lg:flex items-center gap-6 border-l border-white/10 pl-8">
                   <div className="flex flex-col">
                       <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5 text-right">{t.globalStatus || "Global Status"}</span>
                       <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 group-hover:bg-emerald-500/10 transition-all">
                           <Activity className="text-emerald-400 w-3.5 h-3.5" />
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">{t.stableOps}</span>
                       </div>
                   </div>
              </div>
          </div>
      </div>

      {/* Floating Tactical Data (Cursor Hook) */}
      <AnimatePresence>
        {hoveredCell && !isMobile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed z-[6000] pointer-events-none"
            style={{ left: mousePos.x + 30, top: mousePos.y + 30 }}
          >
            <div className={`${HUD_GLASS} px-6 py-5 rounded-[2rem] border-emerald-500/30 shadow-2xl`}>
                <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-2">
                    <Crosshair className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{t.sectorAnalysis}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">{t.ndviValue}</span>
                    <div className="text-2xl font-mono font-black text-white leading-none">
                        <SmoothValue value={hoveredCell.ndvi} />
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(hoveredCell.ndvi) }} />
                    <span className="text-[10px] font-black text-white/50 uppercase">{getHeatLevel(hoveredCell.ndvi) === 'critical' ? t.criticalRiskArea : getHeatLevel(hoveredCell.ndvi) === 'moderate' ? t.moderateStressZone : t.stableEcosystem}</span>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hoveredCell && isMobile && (
            <motion.div 
                initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-32 left-8 right-8 z-[6000] p-6 rounded-[2.5rem] bg-[#05080D] border border-emerald-500/30 backdrop-blur-3xl shadow-2xl text-center"
            >
                <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">{t.liveSectorData}</div>
                <div className="text-3xl font-mono font-black text-white mb-2">
                    <SmoothValue value={hoveredCell.ndvi} />
                </div>
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{getHeatLevel(hoveredCell.ndvi) === 'critical' ? t.criticalRiskArea : getHeatLevel(hoveredCell.ndvi) === 'moderate' ? t.moderateStressZone : t.stableEcosystem} // {t.optimalSync}</div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SentinelMap;