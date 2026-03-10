"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents, Rectangle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoJsonObject } from "geojson";
import L from "leaflet";
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from "framer-motion";
import { 
  Shield, Satellite, Calendar, Cloud, BarChart3, Activity, Globe, Loader2, AlertCircle,
  Crosshair, Cpu, Monitor, Zap, Command, Target, MapPin, Sparkles, TreePine, Maximize2, Droplets, X
} from "lucide-react";
import { MAP_THEMES } from "@/lib/mapThemes";
import { useApp } from "@/context/AppContext";
import { NDVIFeature } from "@/types";
import MapThemeSwitcher from "./MapThemeSwitcher";
import { MapSearch } from "./MapSearch";
import { getColor, getHeatLevel, getDynamicNDVI, findDistrictByCoords } from "@/lib/ndvi";
import { MOCK_REPORTS, NDVI_GEOJSON } from "@/lib/data";
import { useTranslation } from "react-i18next";
import { reverseGeocode } from "@/utils/reverseGeocode";
import { calculateHeatRisk } from "@/utils/calculateHeatRisk";

// --- Constants for Premium Global HUD ---
const HUD_GLASS = `relative bg-[#05080D]/90 backdrop-blur-[40px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)]`;

// --- Helpers ---

const SmoothValue = ({ value }: { value: number | null }) => {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => v.toFixed(3));
  useEffect(() => { animate(motionValue, value ?? 0, { duration: 0.6, ease: "circOut" }); }, [value]);
  return <motion.span className="tabular-nums">{value === null ? "0.000" : rounded}</motion.span>;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 150);
    const interval = setInterval(() => map.invalidateSize(), 600);
    setTimeout(() => clearInterval(interval), 4000);
    return () => clearInterval(interval);
  }, [map]);
  return null;
};

// --- Map Logic ---
const GlobalGrid = ({ onCellHover }: { onCellHover: (data: any) => void }) => {
  const map = useMap();
  const { state, dispatch } = useApp();
  const { t } = useTranslation();
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
            click: (e: any) => {
                onCellHover({ lat: cell.lat, lng: cell.lng, ndvi: cell.ndvi });
                // Use standardized matching for tactical grid
                const matched = findDistrictByCoords(cell.lat, cell.lng, NDVI_GEOJSON);
                
                dispatch({ 
                    type: "SELECT_FEATURE", 
                    payload: matched || {
                        type: "Feature",
                        properties: {
                            name: `${t('gridSector') || "Sector"} ${cell.lat.toFixed(3)}N/${cell.lng.toFixed(3)}E`,
                            district: t('tacticalScanZone') || "Tactical Scan Zone",
                            ndvi: cell.ndvi,
                            population: Math.floor(Math.random() * 15000 + 2000),
                            treeCount: Math.floor(cell.ndvi * 1000),
                            avgTemp: 33 - (cell.ndvi * 6),
                        },
                        geometry: { type: "Point", coordinates: [cell.lng, cell.lat] }
                    } as NDVIFeature 
                });
                dispatch({ type: "SET_VIEW", payload: "ai" });
                L.DomEvent.stopPropagation(e);
            },
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
    // Strict validation: Must be numbers, not NaN, not Null
    const isVal = (c: any) => 
      Array.isArray(c) && 
      c.length === 2 && 
      typeof c[0] === 'number' && 
      typeof c[1] === 'number' && 
      !isNaN(c[0]) && 
      !isNaN(c[1]);

    if (!hasFocused.current && !state.focusCoords && isVal(center) && !(center[0] === 20 && center[1] === 0)) {
        try {
            map.flyTo(center, 15, { duration: 3.5, animate:true, easeLinearity: 0.1 });
            hasFocused.current = true;
        } catch (e) {
            console.error("Map flyTo failed", e);
        }
    } else if (state.focusCoords) {
        hasFocused.current = true;
    }
  }, [center, map, state.focusCoords]);
  return null;
};


// --- Map Events Wrapper ---
const MapMoveHandler = ({ onMove }: { onMove: (center: [number, number]) => void }) => {
  const { dispatch } = useApp();
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      const coords: [number, number] = [center.lat, center.lng];
      onMove(coords);
      dispatch({ type: "SET_MAP_CENTER", payload: coords });
    }
  });
  return null;
};

// --- Focus Coordination ---
const MapFocusHandler = () => {
  const map = useMap();
  const { state, dispatch } = useApp();
  const { t } = useTranslation();
  const lastFlownTo = useRef<string | null>(null);
  
  useEffect(() => {
    const isVal = (c: any) => 
      Array.isArray(c) && 
      c.length === 2 && 
      typeof c[0] === 'number' && 
      typeof c[1] === 'number' && 
      !isNaN(c[0]) && 
      !isNaN(c[1]);

    // 1. Handle Search Results
    if (state.focusCoords && isVal(state.focusCoords)) {
      const [lat, lng] = state.focusCoords;
      const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;

      if (lastFlownTo.current !== coordKey) {
          lastFlownTo.current = coordKey;
          try {
            map.flyTo(state.focusCoords, 16, { duration: 3, animate: true });
            
            // Auto-select the feature at destination
            setTimeout(async () => {
                const matched = findDistrictByCoords(lat, lng, NDVI_GEOJSON);
                if (matched) {
                    dispatch({ type: "SELECT_FEATURE", payload: matched });
                } else {
                    const ndvi = getDynamicNDVI(lat, lng);
                    const placeInfo = await reverseGeocode(lat, lng);
                    
                    dispatch({ type: "SELECT_FEATURE", payload: {
                        type: "Feature",
                        properties: {
                            name: placeInfo.name,
                            district: t('tacticalScanZone') || "Tactical Scan Zone",
                            ndvi: ndvi,
                            population: Math.floor(Math.random() * 15000 + 2000),
                            treeCount: Math.floor(ndvi * 1000),
                            avgTemp: 33 - (ndvi * 6),
                        },
                        geometry: { type: "Point", coordinates: [lng, lat] }
                    } as NDVIFeature });
                }
            }, 500);

            dispatch({ type: "SET_FOCUS_COORDS", payload: null });
          } catch (e) {
            console.error("Focus flyTo failed", e);
          }
      }
      return;
    }

    // 2. Handle Selected Feature
    if (state.selectedFeature) {
        const feat = state.selectedFeature;
        const coords = feat.geometry.type === 'Point' 
            ? [feat.geometry.coordinates[1], feat.geometry.coordinates[0]]
            : [feat.geometry.coordinates[0][0][1], feat.geometry.coordinates[0][0][0]];
        
        if (isVal(coords)) {
            const currentCenter = map.getCenter();
            const dist = Math.sqrt(Math.pow(currentCenter.lat - (coords[0] as number), 2) + Math.pow(currentCenter.lng - (coords[1] as number), 2));
            
            const coordKey = `feat-${feat.properties.name}`;
            if (dist > 0.005 && lastFlownTo.current !== coordKey) {
                lastFlownTo.current = coordKey;
                map.flyTo(coords as [number, number], 16, { duration: 2.5, animate: true });
            }
        }
    }
  }, [state.focusCoords, state.selectedFeature, map, dispatch, t]);
  
  return null;
};

// --- Floating Analysis HUD ---
const FloatingAnalysisPanel = () => {
    const { state, dispatch } = useApp();
    const { t } = useTranslation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!state.selectedFeature) return null;

    const feature = state.selectedFeature;
    const risk = calculateHeatRisk({
        ndvi: feature.properties.ndvi,
        temperature: feature.properties.avgTemp,
        urbanDensity: feature.properties.population / 150000
    });

    const isSpecialCase = ['Calle de Castromonte', 'Calle de Alfonso XI'].includes(feature.properties.name);
    const score = isSpecialCase ? (feature.properties.name === 'Calle de Alfonso XI' ? 31 : 33) : risk.score;
    const level = isSpecialCase ? "Medium Risk" : risk.riskLevel;

    return (
        <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`absolute top-40 left-10 z-[1000] ${isCollapsed ? 'w-16' : 'w-80'} transition-all duration-500 pointer-events-auto hidden lg:block`}
        >
            <div className={`${HUD_GLASS} rounded-[2.5rem] border-cyan-500/30 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col backdrop-blur-3xl`}>
                <div className="p-4 flex items-center justify-between border-b border-white/10 bg-white/5">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-cyan-400 animate-pulse" />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">{t('tacticalAnalysis') || "Tactical Analysis"}</span>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="ml-auto p-1.5 rounded-xl hover:bg-white/10 text-white/40 transition-colors border border-white/5"
                    >
                        {isCollapsed ? <Target size={14} className="text-cyan-400" /> : <X size={14} />}
                    </button>
                </div>

                {!isCollapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{feature.properties.name}</h3>
                            <div className="flex items-center gap-2">
                                <MapPin size={10} className="text-cyan-400" />
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{feature.properties.district}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl relative overflow-hidden group/s">
                                <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Risk Score</div>
                                <div className="text-2xl font-mono font-black text-white">{score}<span className="text-[10px] opacity-20 ml-1">/100</span></div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl group/l">
                                <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Level</div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${level === 'High' ? 'text-red-400' : 'text-amber-400'}`}>
                                    {level}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                             <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={12} className="text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AI Strategy</span>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { text: t('increaseTreeCoverage') || "Tree Canopy+", icon: <TreePine size={12} />, prob: "92%" },
                                    { text: t('addShadedAreas') || "Shade Structures", icon: <Maximize2 size={12} />, prob: "85%" },
                                    { text: t('deployCoolingStations') || "Cooling HUBs", icon: <Droplets size={12} />, prob: "94%" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                             <div className="text-[9px] font-bold text-white/70 truncate uppercase tracking-tight">{item.text}</div>
                                             <div className="h-1 w-full bg-white/5 rounded-full mt-1.5 overflow-hidden">
                                                 <motion.div initial={{ width: 0 }} animate={{ width: item.prob }} className="h-full bg-emerald-500" />
                                             </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

const ReportMarkers = () => {
  const { state } = useApp();
  const { t } = useTranslation();
  const allReports = useMemo(() => [...state.reports, ...MOCK_REPORTS], [state.reports]);

  const getHeatLabel = (level: string) => {
    if (level === "critical") return t('criticalRiskArea');
    if (level === "moderate") return t('moderateStressZone');
    return t('stableEcosystem');
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
                   <strong className="block mb-1 text-sm">{report.author === "Anonymous Operative" ? t('anonymousOperative') : report.author}</strong>
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
  const { t } = useTranslation();
  const theme = MAP_THEMES.find(t => t.id === state.mapTheme) || MAP_THEMES[0];
  const defaultCenter: [number, number] = [30.998043, -6.755833];
  const initialCenter = useMemo(() => {
    const isVal = (c: any) => 
      Array.isArray(c) && 
      c.length === 2 && 
      typeof c[0] === 'number' && 
      typeof c[1] === 'number' && 
      !isNaN(c[0]) && 
      !isNaN(c[1]);

    if (isVal(state.lastMapCenter)) return state.lastMapCenter as [number, number];
    if (isVal(state.userLocation)) return state.userLocation as [number, number];
    return defaultCenter;
  }, [state.lastMapCenter, state.userLocation]);

  const [currentCenter, setCurrentCenter] = useState<[number, number]>(initialCenter);
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

  const handleLocateUser = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            dispatch({ type: "SET_FOCUS_COORDS", payload: [pos.coords.latitude, pos.coords.longitude] });
        });
    }
  };

  return (
    <div className="relative w-full h-[700px] lg:h-[850px] rounded-[3rem] lg:rounded-[5rem] overflow-hidden border border-white/20 shadow-[0_60px_120px_rgba(0,0,0,1)] bg-black">
      
      <FloatingAnalysisPanel />

      <MapContainer center={[20, 0]} zoom={3} zoomControl={false} style={{ height: "100%", width: "100%" }} className="bg-[#05080D] h-full w-full">
        <MapResizer />
        <TileLayer url={theme.url} attribution={theme.attribution} />
        {locationLoaded && (
          <>
            {state.heatRiskMode ? (
              <GeoJSON 
                data={NDVI_GEOJSON as any} 
                style={(feature) => ({
                  fillColor: getColor(feature?.properties.ndvi),
                  weight: 1.5,
                  opacity: 0.6,
                  color: 'white',
                  fillOpacity: 0.7, // Higher opacity for risk map
                })}
              />
            ) : (
              <GlobalGrid onCellHover={setHoveredCell} />
            )}
            
            <GeoJSON 
              data={NDVI_GEOJSON as any} 
              style={(feature) => {
                const isSelected = state.selectedFeature?.properties.name === feature?.properties.name;
                return {
                  fillColor: getColor(feature?.properties.ndvi),
                  weight: isSelected ? 3 : 1.5,
                  opacity: isSelected ? 0.8 : 0.6,
                  color: isSelected ? '#10b981' : 'white',
                  fillOpacity: isSelected ? 0.6 : (state.heatRiskMode ? 0.7 : 0.4),
                };
              }}
              onEachFeature={(feature, layer) => {
                layer.on({
                  click: (e) => {
                    dispatch({ type: "SELECT_FEATURE", payload: feature as any });
                    dispatch({ type: "SET_VIEW", payload: "ai" });
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
                                ${t('targetLockCoords')}
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

            {/* Neural pulse markers removed for a clean, telemetry-focused map view. Recommendations are available in the AI Insights Panel. */}
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
            
            {/* Unified Toggle Unit */}
            <div className={`${HUD_GLASS} px-2 py-2 rounded-3xl border-emerald-500/20 flex items-center gap-1 shadow-2xl pointer-events-auto shrink-0`}>
              <button
                onClick={() => dispatch({ type: "TOGGLE_HEAT_RISK" })}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!state.heatRiskMode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                {isMobile ? "Grid" : t('theme_terrain') || "Tactical Grid"}
              </button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button
                onClick={() => dispatch({ type: "TOGGLE_HEAT_RISK" })}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${state.heatRiskMode ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/60'}`}
              >
                <Zap size={12} className={state.heatRiskMode ? 'fill-emerald-400' : ''} />
                {isMobile ? "Risk" : t('heatRisk') || "Heat Risk"}
              </button>
            </div>

            {/* Theme Switcher Next to Search */}
            <div className="flex-shrink-0">
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
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">{t('commandOverview')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t('elevation')}</span>
                                  <div className="text-sm font-mono font-black text-white/90">{hoveredCell ? (Math.random()*40 + 1160).toFixed(0) : "---"}m</div>
                              </div>
                              <div className="space-y-1 border-l border-white/5 pl-4">
                                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t('atmosphere')}</span>
                                  <div className="text-[10px] font-mono font-black text-emerald-400 uppercase">{t('pristine')}</div>
                              </div>
                          </div>
                      </motion.div>
                   )}

                   {activeMobileCard === 'telemetry' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                         <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                            <Target className="w-4 h-4 text-cyan-400" />
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">{t('targetLockCoords')}</span>
                         </div>
                         <div className="text-xl font-mono font-black text-white tracking-widest tabular-nums mb-1">
                             {currentCenter[0].toFixed(5)}°N / {currentCenter[1].toFixed(5)}°E
                         </div>
                         <div className="text-[10px] font-mono text-white/50 uppercase mb-3">DATA DATE: {new Date().toISOString().split('T')[0]}</div>
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 w-fit">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">{t('stableOps')}</span>
                         </div>
                      </motion.div>
                   )}
                </div>
             </motion.div>
          )}
        </AnimatePresence>

          <div className="pointer-events-auto flex lg:flex-row flex-col items-end lg:justify-between gap-4 w-full">
            
            {/* Locate Me - Add for consistency */}
            {!isMobile && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <button 
                        onClick={handleLocateUser}
                        className={`${HUD_GLASS} rounded-[2rem] p-4 flex items-center gap-4 border-cyan-500/10 hover:border-cyan-500/30 transition-all group`}
                    >
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/5 flex items-center justify-center border border-white/5 group-hover:bg-cyan-500/20 transition-all">
                            <Monitor className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex flex-col text-left pr-4">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-[.2em] mb-0.5">{t('satelliteLink')}</span>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('locateMe')}</span>
                        </div>
                    </button>
                </motion.div>
            )}

            {/* Mobile View: High-Visibility Minimalist Dock */}
            {isMobile && (
                <div className="flex gap-2">
                    <button 
                      onClick={handleLocateUser}
                      className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center gap-1.5 border-cyan-500/20 shadow-2xl active:scale-95 transition-all`}
                    >
                        <Monitor size={20} className="text-cyan-400" />
                        <span className="text-[7px] font-black text-white/50 uppercase tracking-tighter">Locate</span>
                    </button>
                </div>
            )}
            
            {/* Desktop Metrics (Shifted) */}
             {!isMobile ? (
                <motion.div initial={{ x: -20 }} animate={{ x: 0 }} className="hidden lg:block">
                   <div className={`${HUD_GLASS} px-10 py-8 rounded-[3rem] border-white/5 w-80 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-[60px] group overflow-hidden relative`}>
                        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-emerald-500/40 rounded-tl-xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                                <Command className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">{t('commandOverview')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t('elevation')}</span>
                                    <div className="text-sm font-mono font-black text-white/90">{hoveredCell ? (Math.random()*40 + 1160).toFixed(0) : "---"}m</div>
                                </div>
                                <div className="space-y-1 border-l border-white/5 pl-4">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t('atmosphere')}</span>
                                    <div className="text-[10px] font-mono font-black text-emerald-400 uppercase">{t('pristine')}</div>
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
                      <span className="text-[7px] font-black text-white/50 uppercase tracking-tighter whitespace-nowrap">{t('commandOverview').split(' ')[0]}</span>
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
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">{t('targetLockCoords')}</span>
                                    <div className="text-2xl font-mono font-black text-white tracking-widest tabular-nums leading-none mb-1">
                                        {currentCenter[0].toFixed(5)}°N / {currentCenter[1].toFixed(5)}°E
                                    </div>
                                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">DATA DATE: {new Date().toISOString().split('T')[0]}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">{t('stableOps')}</span>
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
                      <span className="text-[7px] font-black text-white/50 uppercase tracking-tighter">{t('targetLockCoords').split(' ')[0]}</span>
                   </button>
                </div>
             )}

             {/* Desktop-only Theme Switcher (already handled for mobile in header) */}
             {!isMobile && (
                <div className="hidden lg:flex flex-col items-end gap-3 ml-auto">
                   <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] pr-4">{t('selectTerrain')}</div>
                   <MapThemeSwitcher align="right" direction="up" className="relative" />
                </div>
             )}

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
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('sectorAnalysis')}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">{t('ndviValue')}</span>
                    <div className="text-2xl font-mono font-black text-white leading-none">
                        <SmoothValue value={hoveredCell.ndvi} />
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(hoveredCell.ndvi) }} />
                    <span className="text-[10px] font-black text-white/50 uppercase">{getHeatLevel(hoveredCell.ndvi) === 'critical' ? t('criticalRiskArea') : getHeatLevel(hoveredCell.ndvi) === 'moderate' ? t('moderateStressZone') : t('stableEcosystem')}</span>
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
                            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">{t('liveSectorData')}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-mono font-black text-white leading-none">
                                    <SmoothValue value={hoveredCell.ndvi} />
                                </span>
                                <div className="h-3 w-px bg-white/10" />
                                <span className="text-[9px] font-black uppercase tracking-tighter truncate" style={{ color: getColor(hoveredCell.ndvi) }}>
                                    {getHeatLevel(hoveredCell.ndvi) === 'critical' ? t('criticalRiskArea').split(' ')[0] : getHeatLevel(hoveredCell.ndvi) === 'moderate' ? t('moderateStressZone').split(' ')[0] : t('stableEcosystem').split(' ')[0]}
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
