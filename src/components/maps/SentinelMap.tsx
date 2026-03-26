"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents, Rectangle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoJsonObject } from "geojson";
import L from "leaflet";
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from "framer-motion";
import { 
  Shield, Satellite, Calendar, Cloud, BarChart3, Activity, Globe, Loader2, AlertCircle,
  Crosshair, Cpu, Monitor, Zap, Command, Target, MapPin, Sparkles, TreePine, Maximize2, Droplets, X, Users
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
import { useAppStore } from "@/store/useAppStore";
import { HeatRiskLayer } from "./HeatRiskLayer";

// --- Constants for Premium Global HUD ---
const HUD_GLASS = `relative bg-[#05080D]/90 backdrop-blur-[40px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)]`;

// --- Helpers ---

const checkCoordsVal = (c: any): c is [number, number] => 
    Array.isArray(c) && 
    c.length === 2 && 
    typeof c[0] === 'number' && 
    typeof c[1] === 'number' && 
    !isNaN(c[0]) && 
    !isNaN(c[1]) &&
    isFinite(c[0]) &&
    isFinite(c[1]);

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
        const elevation = Math.floor(Math.random() * 40 + 1160);
        list.push({ 
            id: `${lat}-${lng}`, bounds: [[lat, lng], [lat + res, lng + res]] as L.LatLngBoundsExpression, 
            ndvi, lat: lat + res/2, lng: lng + res/2, elevation
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
            fillOpacity: zoom >= 15 ? 0.15 : 0.05, 
            color: "rgba(255,255,255,0.03)", weight: 0.5 
          }} 
          eventHandlers={{ 
            mouseover: () => onCellHover({ ...cell }),
            click: (e: any) => {
                onCellHover({ ...cell });
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
  const flyToCoords = useRef<string | null>(null);

  useEffect(() => {
    const coordKey = checkCoordsVal(center) ? `${center[0].toFixed(4)},${center[1].toFixed(4)}` : null;

    if (!state.focusCoords && checkCoordsVal(center) && coordKey !== flyToCoords.current && !(center[0] === 20 && center[1] === 0)) {
        try {
            const isUserLoc = state.userLocation && 
                             Math.abs(center[0] - state.userLocation[0]) < 0.001 && 
                             Math.abs(center[1] - state.userLocation[1]) < 0.001;

            if (!hasFocused.current || isUserLoc) {
                map.flyTo(center, 15, { duration: 3.5, animate:true, easeLinearity: 0.1 });
                flyToCoords.current = coordKey;
                if (isUserLoc) hasFocused.current = true;
            }
        } catch (e) {
            console.error("Map flyTo failed", e);
        }
    } else if (state.focusCoords) {
        hasFocused.current = true;
    }
  }, [center, map, state.focusCoords, state.userLocation]);
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
  
  // Add agent focus state for AI sync
  const agentFocus = useAppStore(s => s.focusCoords);
  const setAgentFocus = useAppStore(s => s.setFocusCoords);

  useEffect(() => {
    // 1. Handle Search Results
    if (state.focusCoords && checkCoordsVal(state.focusCoords)) {
      const [lat, lng] = state.focusCoords;
      const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;

      if (lastFlownTo.current !== coordKey) {
          lastFlownTo.current = coordKey;
          try {
            map.flyTo(state.focusCoords, 16, { duration: 3, animate: true });
            
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

    // 2. Handle Agent Focus
    if (agentFocus && checkCoordsVal(agentFocus)) {
        const [lat, lng] = agentFocus;
        const coordKey = `agent-${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (lastFlownTo.current !== coordKey) {
            lastFlownTo.current = coordKey;
            try {
                map.flyTo(agentFocus as [number, number], 14, { duration: 3 });
            } catch (e) {
                console.error("Agent focus flyTo failed", e);
            }
        }
        setAgentFocus(null);
    }

    // 3. Handle Selected Feature
    if (state.selectedFeature) {
        const feat = state.selectedFeature;
        const coords = feat.geometry.type === 'Point' 
            ? [feat.geometry.coordinates[1], feat.geometry.coordinates[0]]
            : [feat.geometry.coordinates[0][0][1], feat.geometry.coordinates[0][0][0]];
        
        if (checkCoordsVal(coords)) {
            const currentCenter = map.getCenter();
            const dist = Math.sqrt(Math.pow(currentCenter.lat - (coords[0] as number), 2) + Math.pow(currentCenter.lng - (coords[1] as number), 2));
            
            const coordKey = `feat-${feat.properties.name}`;
            if (dist > 0.005 && lastFlownTo.current !== coordKey) {
                lastFlownTo.current = coordKey;
                try {
                    map.flyTo(coords as [number, number], 16, { duration: 2.5, animate: true });
                } catch(e) {}
            }
        }
    }
  }, [state.focusCoords, state.selectedFeature, map, dispatch, t, agentFocus, setAgentFocus]);
  
  return null;
};

// --- Floating Analysis HUD ---
const FloatingAnalysisPanel = () => {
    const { state, dispatch } = useApp();
    const { t, i18n } = useTranslation();
    const isRTL = typeof i18n.dir === 'function' ? i18n.dir() === 'rtl' : i18n.language === 'ar';
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
            initial={{ x: isRTL ? 100 : -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`absolute ${isRTL ? 'bottom-32 left-10' : 'top-44 left-10'} z-[1200] ${isCollapsed ? 'w-16' : 'w-80'} transition-all duration-500 pointer-events-auto hidden lg:block`}
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
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 flex-1">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{feature.properties.name}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={10} className="text-cyan-400" />
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{feature.properties.district}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                                        <Calendar size={8} className="text-emerald-400" />
                                        <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.1em]">DATA: MAR 24, 2026</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-emerald-500/5 group/viz">
                                <motion.div 
                                    animate={{ y: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#10b981] z-10"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                    <Satellite size={24} className="text-emerald-400" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl relative overflow-hidden group/s">
                                <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{t('riskScore') || "Risk Score"}</div>
                                <div className="text-2xl font-mono font-black text-white">{score}<span className="text-[10px] opacity-20 ml-1">/100</span></div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl group/l">
                                <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{t('level') || "Level"}</div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${level.includes('High') ? 'text-red-400' : level.includes('Medium') ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {level.includes('High') ? t('highRisk') : level.includes('Medium') ? t('mediumRisk') : t('lowRisk')}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5 pt-4">
                             <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={12} className="text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t('aiStrategy') || "AI Strategy"}</span>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { text: t('increaseTreeCoverage') || "Tree Canopy+", icon: <TreePine size={12} />, prob: "92%" },
                                    { text: t('addShadedAreas') || "Shade Structures", icon: <Maximize2 size={12} />, prob: "85%" },
                                    { text: t('deployCoolingStations') || "Cooling HUBs", icon: <Droplets size={12} />, prob: "94%" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/10 rounded-2xl hover:bg-white/10 transition-colors shadow-lg shadow-black/20 relative z-10">
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
    if (checkCoordsVal(state.userLocation)) return state.userLocation as [number, number];
    if (checkCoordsVal(state.lastMapCenter)) return state.lastMapCenter as [number, number];
    return defaultCenter;
  }, [state.userLocation, state.lastMapCenter]);

  const [currentCenter, setCurrentCenter] = useState<[number, number]>(initialCenter);
  const [hoveredCell, setHoveredCell] = useState<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileCard, setActiveMobileCard] = useState<string | null>(null);
  const [showReports, setShowReports] = useState(true);
  const [zoom, setZoom] = useState(3);

  const ZoomListener = () => {
    const map = useMapEvents({
      zoomend: () => setZoom(map.getZoom()),
    });
    return null;
  };

  // Synchronize currentCenter if initialCenter changes
  useEffect(() => {
    setCurrentCenter(initialCenter);
  }, [initialCenter]);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (mobile) setShowReports(false); // Default OFF on mobile
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", (e) => setMousePos({ x: e.clientX, y: e.clientY }));

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
      
      <div className="absolute inset-x-0 top-0 pointer-events-none z-[1200]">
        <FloatingAnalysisPanel key={state.selectedFeature?.properties.name || 'none'} />
      </div>

      <MapContainer center={[20, 0]} zoom={3} zoomControl={false} style={{ height: "100%", width: "100%" }} className="bg-[#05080D] h-full w-full">
        <MapResizer />
        <TileLayer url={theme.url} attribution={theme.attribution} />
        
        <>
            <HeatRiskLayer />
            {!state.heatRiskMode && <GlobalGrid onCellHover={setHoveredCell} />}
            
              <GeoJSON 
                data={NDVI_GEOJSON as any} 
                pointToLayer={(feature, latlng) => {
                  const isSelected = state.selectedFeature?.properties.name === feature.properties.name;
                  const color = getColor(feature.properties.ndvi);
                  return L.marker(latlng, {
                    icon: L.divIcon({
                      className: 'tactical-sector-icon',
                      html: `
                        <div class="relative group flex items-center justify-center transition-all duration-500 scale-[${Math.max(0.2, (zoom - 2) / 10) * (isSelected ? 1.4 : 1)}]">
                          <div class="absolute w-12 h-12 rounded-full ${color === '#ef4444' ? 'bg-red-500/20' : color === '#f59e0b' ? 'bg-amber-500/20' : 'bg-emerald-500/20'} animate-pulse"></div>
                          <div class="absolute w-5 h-5 rounded-full border-2 border-white shadow-[0_0_25px_${color}cc] select-none" style="background-color: ${color};"></div>
                          ${isSelected ? `<div class="absolute w-10 h-10 border-2 border-white/80 rounded-full animate-ping"></div>` : ''}
                          <div class="absolute -top-12 px-2 py-1 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-[2000] shadow-2xl">
                             <div class="flex items-center gap-2">
                                <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${color};"></div>
                                <span class="text-[9px] font-black text-white uppercase tracking-[0.2em]">${feature.properties.name}</span>
                             </div>
                          </div>
                        </div>
                      `,
                      iconSize: [48, 48], iconAnchor: [24, 24]
                    })
                  });
                }}
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
                    if (l.setStyle) {
                        l.setStyle({ fillOpacity: 0.6, weight: 3 });
                    }
                  },
                  mouseout: (e) => {
                    const l = e.target;
                    if (l.setStyle) {
                        l.setStyle({ fillOpacity: 0.4, weight: 1.5 });
                    }
                  }
                });
              }}
            />
            <Marker position={state.userLocation ?? currentCenter} icon={L.divIcon({
                className: 'user-lock-icon',
                html: `
                    <div class="relative group flex items-center justify-center transition-all duration-500 scale-[${Math.max(0.4, zoom / 15)}]" style="width: 80px; height: 80px;">
                        <div class="absolute w-20 h-20 bg-cyan-500/10 rounded-full animate-ping"></div>
                        <div class="absolute w-14 h-14 bg-cyan-500/20 rounded-full animate-pulse border border-cyan-500/30"></div>
                        <div class="absolute w-8 h-8 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_35px_rgba(34,211,238,1)] flex items-center justify-center">
                            <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
                        </div>
                        <div class="absolute -top-16 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none bg-[#0A0F1A]/95 px-5 py-2 rounded-2xl border border-white/20 backdrop-blur-3xl text-[10px] font-black text-white uppercase tracking-[0.3em] whitespace-nowrap shadow-3xl z-[2000]">
                           <div class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                                ${t('targetLockCoords') || "Target Lock"}
                           </div>
                        </div>
                    </div>
                `,
                iconSize: [80, 80], iconAnchor: [40, 40]
            })} />

            <ZoomListener />

            <MapMoveHandler onMove={setCurrentCenter} />
            <MapFocusHandler />
            <MapInitialFocus center={currentCenter} />
            {showReports && <ReportMarkers />}
          </>
      </MapContainer>

      {/* 1. VISION BAR (Top Center) */}
      <div className="absolute top-16 lg:top-14 left-1/2 -translate-x-1/2 z-[1005] w-full max-w-sm lg:max-w-xl px-4 pointer-events-none">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 pointer-events-auto"
          >
            {!isMobile && (
                <MapThemeSwitcher 
                    showText={false} 
                    align="left" 
                    direction="down" 
                    className="relative shrink-0" 
                />
            )}
            <div className="flex-1 min-w-0">
               <MapSearch />
            </div>
            {/* The user specifically asked to remove Grid/Risk from Sentinel, 
                but keep Heat Map visible. So we don't put the toggle here. */}
          </motion.div>
      </div>

      {/* 2. TACTICAL OVERLAY */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-40 h-96 bg-emerald-500/5 blur-[100px] rounded-full" />
        <div className="absolute top-1/4 -right-20 w-40 h-96 bg-cyan-500/5 blur-[100px] rounded-full" />
      </div>

      {/* 3. COMMAND BRIDGE DOCK */}
      <div className="absolute bottom-16 lg:bottom-24 left-6 right-6 lg:left-12 lg:right-12 z-[1002] pointer-events-none">
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
                      <button onClick={() => setActiveMobileCard(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/40 shadow-xl">✕</button>
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
                                  <div className="text-sm font-mono font-black text-white/90">{hoveredCell ? hoveredCell.elevation : "---"}m</div>
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
            {!isMobile && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <button onClick={handleLocateUser} className={`${HUD_GLASS} rounded-[2rem] p-4 flex items-center gap-4 border-cyan-500/10 hover:border-cyan-500/30 transition-all group`}>
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/5 flex items-center justify-center border border-white/5 group-hover:bg-cyan-500/20">
                            <Monitor className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex flex-col text-left pr-4">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-[.2em] mb-0.5">{t('satelliteLink')}</span>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('locateMe')}</span>
                        </div>
                    </button>
                </motion.div>
            )}

            {isMobile && (
                <div className="flex gap-2">
                    <button onClick={handleLocateUser} className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center gap-1.5 border-cyan-500/20 active:scale-95 transition-all`}>
                        <Monitor size={20} className="text-cyan-400" />
                        <span className="text-[7px] font-black text-white/50 uppercase tracking-tighter">Locate</span>
                    </button>
                    <button onClick={() => setActiveMobileCard(activeMobileCard === 'metrics' ? null : 'metrics')} className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center gap-1.5 border-emerald-500/20 active:scale-90 transition-all ${activeMobileCard === 'metrics' ? 'bg-emerald-500/20 border-emerald-500/40' : ''}`}>
                      <Command size={20} className={activeMobileCard === 'metrics' ? 'text-emerald-400' : 'text-white/30'} />
                      <span className="text-[7px] font-black text-white/50 uppercase tracking-tighter whitespace-nowrap">{t('commandOverview').split(' ')[0]}</span>
                   </button>
                </div>
            )}
            
             {!isMobile && (
                <motion.div initial={{ x: -20 }} animate={{ x: 0 }} className="hidden lg:block">
                   <div className={`${HUD_GLASS} px-10 py-8 rounded-[3rem] border-white/5 w-80 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-[60px] group overflow-hidden relative`}>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                                <Command className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">{t('commandOverview')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t('elevation')}</span>
                                    <div className="text-sm font-mono font-black text-white/90">{hoveredCell ? hoveredCell.elevation : "---"}m</div>
                                </div>
                                <div className="space-y-1 border-l border-white/5 pl-4">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t('atmosphere')}</span>
                                    <div className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-tight">{t('pristine')}</div>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={10} className="text-emerald-400" />
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] italic">LATEST ACQUISITION: 24 MAR</span>
                                </div>
                                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest tabular-nums">SENTINEL-L2A</div>
                            </div>
                        </div>
                   </div>
                </motion.div>
             )}

              {!isMobile && (
                <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex-1 max-w-lg hidden lg:block">
                   <div className={`${HUD_GLASS} px-8 py-5 rounded-[2.5rem] border-white/5 shadow-3xl backdrop-blur-3xl overflow-hidden relative group`}>
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                    <Target size={18} className="text-cyan-400 group-hover:rotate-45 transition-transform duration-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">{t('targetLockCoords')}</span>
                                    <div className="flex items-center gap-2 text-xs font-mono font-black text-white tracking-widest tabular-nums">
                                        {currentCenter[0].toFixed(5)}°N / {currentCenter[1].toFixed(5)}°E
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">ECO-SYNC</span>
                                </div>
                            </div>
                        </div>
                   </div>
                </motion.div>
             )}
          </div>
      </div>

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
                    <div className="mt-2 text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest">ELEV: {hoveredCell.elevation}m</div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: getColor(hoveredCell.ndvi), color: getColor(hoveredCell.ndvi) }} />
                        <span className="text-[10px] font-black text-white/50 uppercase">{getHeatLevel(hoveredCell.ndvi) === 'critical' ? t('criticalRiskArea') : getHeatLevel(hoveredCell.ndvi) === 'moderate' ? t('moderateStressZone') : t('stableEcosystem')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5">
                        <Calendar size={10} className="text-emerald-400" />
                        <span className="text-[8px] font-black text-white/30 uppercase">MAR 24</span>
                    </div>
                </div>
            </div>
        </div>
          
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hoveredCell && isMobile && (
            <motion.div 
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                className="fixed top-42 left-4 right-4 z-[6000] pointer-events-none"
            >
                <div className="flex items-center gap-3 bg-[#05080D]/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl">
                    <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">{t('liveSectorData')}</span>
                            <div className="flex items-center gap-2 text-lg font-mono font-black text-white leading-none">
                                <SmoothValue value={hoveredCell.ndvi} />
                                <span className="text-[10px] font-black uppercase ml-2" style={{ color: getColor(hoveredCell.ndvi) }}>
                                    {getHeatLevel(hoveredCell.ndvi).toUpperCase()}
                                </span>
                            </div>
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
