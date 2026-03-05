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
import { MapSearch } from "./MapSearch";
import { getColor, getHeatLevel, getDynamicNDVI } from "@/lib/ndvi";
import { MOCK_REPORTS, NDVI_GEOJSON } from "@/lib/data";

// --- Constants for Premium Global HUD ---
const HUD_GLASS = `relative bg-[#05080D]/90 backdrop-blur-[40px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)]`;

// --- Helpers ---

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
  const [activeMobileCard, setActiveMobileCard] = useState<string | null>(null);

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
            <GeoJSON 
              data={NDVI_GEOJSON as any} 
              style={(feature) => ({
                fillColor: getColor(feature?.properties.ndvi),
                weight: 1.5,
                opacity: 0.6,
                color: 'white',
                fillOpacity: 0.4,
              })}
              onEachFeature={(feature, layer) => {
                layer.on({
                  click: (e) => {
                    dispatch({ type: "SELECT_FEATURE", payload: feature as any });
                    (e as any).originalEvent.stopPropagation();
                  },
                  mouseover: (e) => {
                    const l = e.target;
                    l.setStyle({ fillOpacity: 0.6, weight: 3 });
                  },
                  mouseout: (e) => {
                    const l = e.target;
                    l.setStyle({ fillOpacity: 0.4, weight: 1.5 });
                  }
                });
              }}
            />
            {/* User / Focus Marker Pulse */}
            <Marker position={state.userLocation ?? currentCenter} icon={L.divIcon({
                className: 'user-lock-icon',
                html: `
                    <div class="relative group" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                        <div class="absolute w-12 h-12 bg-cyan-500/10 rounded-full animate-ping"></div>
                        <div class="absolute w-6 h-6 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_20px_rgba(34,211,238,1)] flex items-center justify-center">
                            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        <div class="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[#0A0F1A]/90 px-4 py-1.5 rounded-xl border border-white/10 backdrop-blur-xl text-[9px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap shadow-2xl">
                           <div class="flex items-center gap-2">
                               <div class="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
                               ${t.targetLockCoords}
                           </div>
                        </div>
                    </div>
                `,
                iconSize: [60, 60], iconAnchor: [30, 30]
            })} />

            <MapMoveHandler onMove={setCurrentCenter} />
            <MapInitialFocus center={currentCenter} />
            <MapFocusHandler />
            <ReportMarkers />
          </>
        )}
      </MapContainer>

      {/* --- PREMIUM UNIFIED COMMAND BRIDGE --- */}
      
      {/* 1. VISION BAR (Top Center) - Minimalist AR Search */}
      <div className="absolute top-16 lg:top-14 left-1/2 -translate-x-1/2 z-[1005] w-full max-w-sm lg:max-w-xl px-4 pointer-events-none">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 pointer-events-auto"
          >
            <div className="flex-1 min-w-0">
               <MapSearch />
            </div>
            {/* Mobile-only Theme Switcher Next to Search */}
            <div className="lg:hidden flex-shrink-0">
               <MapThemeSwitcher align="right" direction="down" className="relative scale-90" showText={false} />
            </div>
          </motion.div>
      </div>

      {/* 2. TACTICAL OVERLAY (The Side Indicators) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Side Glows */}
        <div className="absolute top-1/4 -left-20 w-40 h-96 bg-emerald-500/5 blur-[100px] rounded-full" />
        <div className="absolute top-1/4 -right-20 w-40 h-96 bg-cyan-500/5 blur-[100px] rounded-full" />
      </div>

      {/* 3. COMMAND BRIDGE DOCK (Tactical Refactor) */}
      <div className="absolute bottom-16 lg:bottom-24 left-6 right-6 lg:left-12 lg:right-12 z-[1002] pointer-events-none">
        {/* Mobile View: High-Visibility Minimalist Dock */}
        <AnimatePresence mode="wait">
          {isMobile && activeMobileCard && (
             <motion.div
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 20, opacity: 0 }}
               className="pointer-events-auto w-full mb-4"
             >
                <div className={`${HUD_GLASS} p-6 rounded-[2.5rem] border-cyan-500/20 overflow-hidden relative shadow-inner backdrop-blur-3xl`}>
                   <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse" />
                   <div className="absolute top-4 right-4 z-20">
                      <button 
                        onClick={() => setActiveMobileCard(null)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/40 active:bg-cyan-500/20 active:text-white transition-all shadow-xl"
                      >
                         ✕
                      </button>
                   </div>
                   
                   {activeMobileCard === 'metrics' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                              <Command className="w-4 h-4 text-emerald-400" />
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">{t.commandOverview}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t.elevation}</span>
                                  <div className="text-sm font-mono font-black text-white/90">{hoveredCell ? (Math.random()*40 + 1160).toFixed(0) : "---"}m</div>
                              </div>
                              <div className="space-y-1 border-l border-white/5 pl-4">
                                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t.atmosphere}</span>
                                  <div className="text-[10px] font-mono font-black text-emerald-400 uppercase">{t.pristine}</div>
                              </div>
                          </div>
                      </motion.div>
                   )}

                   {activeMobileCard === 'telemetry' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                         <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                            <Target className="w-4 h-4 text-cyan-400" />
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">{t.targetLockCoords}</span>
                         </div>
                         <div className="text-xl font-mono font-black text-white tracking-widest tabular-nums mb-2">
                             {currentCenter[0].toFixed(5)}°N / {currentCenter[1].toFixed(5)}°E
                         </div>
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 w-fit">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">{t.stableOps}</span>
                         </div>
                      </motion.div>
                   )}
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4 lg:gap-6">
          
          {/* Mobile Icon Column vs Desktop Cards */}
          <div className="pointer-events-auto flex lg:flex-row flex-col items-end lg:justify-between gap-3 w-full">
             
             {/* LEFT: Sector Metrics (Icon on Mobile, Card on Desktop) */}
             {!isMobile ? (
                <motion.div initial={{ x: -20 }} animate={{ x: 0 }} className="hidden lg:block">
                   <div className={`${HUD_GLASS} px-10 py-8 rounded-[3rem] border-white/5 w-80 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-[60px] group overflow-hidden relative`}>
                        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-emerald-500/40 rounded-tl-xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                                <Command className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">{t.commandOverview}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t.elevation}</span>
                                    <div className="text-sm font-mono font-black text-white/90">{hoveredCell ? (Math.random()*40 + 1160).toFixed(0) : "---"}m</div>
                                </div>
                                <div className="space-y-1 border-l border-white/5 pl-4">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t.atmosphere}</span>
                                    <div className="text-[10px] font-mono font-black text-emerald-400 uppercase">{t.pristine}</div>
                                </div>
                            </div>
                        </div>
                   </div>
                </motion.div>
             ) : (
                <div className="flex flex-col gap-3">
                   <button 
                      onClick={() => setActiveMobileCard(activeMobileCard === 'metrics' ? null : 'metrics')}
                      className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center gap-1.5 border-emerald-500/20 active:scale-90 transition-all ${activeMobileCard === 'metrics' ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.4)]' : ''}`}
                   >
                      <Command size={20} className={activeMobileCard === 'metrics' ? 'text-emerald-400' : 'text-white/30'} />
                      <span className="text-[7px] font-black text-white/50 uppercase tracking-tighter whitespace-nowrap">{t.commandOverview.split(' ')[0]}</span>
                   </button>
                </div>
             )}

             {/* CENTER: Main Telemetry Bridge (Icon on Mobile, Card on Desktop) */}
             {!isMobile ? (
                <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex-1 max-w-2xl hidden lg:block">
                   <div className={`${HUD_GLASS} px-10 py-6 rounded-[3rem] border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-[60px] relative group overflow-hidden`}>
                        <div className="relative z-10 flex items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <Target size={20} className="text-cyan-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">{t.targetLockCoords}</span>
                                    <div className="text-2xl font-mono font-black text-white tracking-widest tabular-nums leading-none">
                                        {currentCenter[0].toFixed(5)}°N / {currentCenter[1].toFixed(5)}°E
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">{t.stableOps}</span>
                            </div>
                        </div>
                   </div>
                </motion.div>
             ) : (
                <div className="flex flex-col gap-3">
                   <button 
                      onClick={() => setActiveMobileCard(activeMobileCard === 'telemetry' ? null : 'telemetry')}
                      className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center gap-1.5 border-cyan-500/20 active:scale-90 transition-all ${activeMobileCard === 'telemetry' ? 'bg-cyan-500/20 border-cyan-500/40 shadow-[0_0_25px_rgba(34,211,238,0.4)]' : ''}`}
                   >
                      <Target size={20} className={activeMobileCard === 'telemetry' ? 'text-cyan-400' : 'text-white/30'} />
                      <span className="text-[7px] font-black text-white/50 uppercase tracking-tighter">{t.targetLockCoords.split(' ')[0]}</span>
                   </button>
                </div>
             )}

             {/* Desktop-only Theme Switcher (already handled for mobile in header) */}
             {!isMobile && (
                <div className="hidden lg:flex flex-col items-end gap-3 ml-auto">
                   <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] pr-4">{t.selectTerrain}</div>
                   <MapThemeSwitcher align="right" direction="up" className="relative" />
                </div>
             )}

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
                initial={{ y: -20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="fixed top-42 left-4 right-4 z-[6000] pointer-events-none"
            >
                <div className="flex items-center gap-3 bg-[#05080D]/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 overflow-hidden">
                           <Satellite size={14} className="text-emerald-400 animate-pulse" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#05080D] animate-ping" />
                    </div>
                    
                    <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">{t.liveSectorData}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-mono font-black text-white leading-none">
                                    <SmoothValue value={hoveredCell.ndvi} />
                                </span>
                                <div className="h-3 w-px bg-white/10" />
                                <span className="text-[9px] font-black uppercase tracking-tighter truncate" style={{ color: getColor(hoveredCell.ndvi) }}>
                                    {getHeatLevel(hoveredCell.ndvi) === 'critical' ? t.criticalRiskArea.split(' ')[0] : getHeatLevel(hoveredCell.ndvi) === 'moderate' ? t.moderateStressZone.split(' ')[0] : t.stableEcosystem.split(' ')[0]}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                            <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className={`w-1 h-3 rounded-full ${i <= (hoveredCell.ndvi * 5) ? 'bg-emerald-400' : 'bg-white/10'}`} />
                                ))}
                            </div>
                            <span className="text-[6px] font-mono text-white/20 mt-1 uppercase tracking-widest">Signal: Optimal</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SentinelMap;