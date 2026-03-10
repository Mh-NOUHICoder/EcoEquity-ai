"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Crosshair, Zap, Loader2 } from "lucide-react";

import { useApp } from "@/context/AppContext";
import { NDVIFeature } from "@/types";
import { NDVI_GEOJSON, MOCK_REPORTS } from "@/lib/data";
import { getColor, getHeatLevel, getDynamicNDVI, findDistrictByCoords } from "@/lib/ndvi";
import { MAP_THEMES } from "@/lib/mapThemes";
import { HeatRiskLayer } from "./HeatRiskLayer";
import { MapSearch } from "./MapSearch";
import { useTranslation } from "react-i18next";
import { calculateHeatRisk } from "@/utils/calculateHeatRisk";
import { reverseGeocode } from "@/utils/reverseGeocode";
import { 
    MapPin, 
    Sparkles, 
    TreePine, 
    Maximize2, 
    Droplets, 
    Activity, 
    ArrowRight, 
    X, 
    Target,
    Brain,
    Satellite
} from "lucide-react";

// --- Constants ---
const HUD_GLASS = `relative bg-[#05080D]/90 backdrop-blur-[40px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)]`;

// --- Helpers ---
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    const interval = setInterval(() => {
      map.invalidateSize();
    }, 500);
    
    setTimeout(() => clearInterval(interval), 3000);
    return () => clearInterval(interval);
  }, [map]);
  return null;
}

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
    const level = isSpecialCase ? "Medium" : risk.riskLevel;

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
                            <span className="text-[10px] font-black text-white/60 uppercase lg:tracking-[0.3em]">{t('tacticalAnalysis') || "Tactical Analysis"}</span>
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
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="p-6 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 flex-1">
                                <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{feature.properties.name}</h3>
                                <div className="flex items-center gap-2">
                                    <MapPin size={10} className="text-cyan-400" />
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{feature.properties.district}</span>
                                </div>
                            </div>
                            {/* Tactical Visualizer */}
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
                                <div className="text-2xl font-mono font-black text-white truncate">{score}<span className="text-[10px] opacity-20 ml-1">/100</span></div>
                                <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-400/5 rotate-45 translate-x-4 -translate-y-4" />
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

    return (
        <>
            {allReports.map(report => {
                const color = report.heatLevel === 'critical' ? '#ef4444' : report.heatLevel === 'moderate' ? '#f59e0b' : '#10b981';
                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="position:relative;"><div style="background:${color}; width:10px; height:10px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${color}; animate: pulse 2s infinite;"></div></div>`,
                    iconSize: [14, 14], iconAnchor: [7, 7]
                });
                return (
                    <Marker key={report.id} position={report.coordinates} icon={icon}>
                        <Popup className="eco-popup">
                            <div className="p-2 min-w-[180px] text-white">
                                <strong className="block mb-1">{report.author === "Anonymous Operative" ? t('anonymousOperative') : report.author}</strong>
                                <p className="text-xs opacity-80 mb-2">{report.message}</p>
                                <div className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
                                    {report.heatLevel === 'critical' ? t('criticalRiskArea') : report.heatLevel === 'moderate' ? t('moderateStressZone') : t('stableEcosystem')}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

const MapInitialFocus = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  const { state } = useApp();
  const hasFocused = useRef(false);

  useEffect(() => {
    const isVal = (c: any) => 
      Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number' && !isNaN(c[0]) && !isNaN(c[1]);

    if (!hasFocused.current && !state.focusCoords && isVal(center) && !(center[0] === 20 && center[1] === 0)) {
        try {
            map.flyTo(center, 14, { duration: 3.5, animate: true, easeLinearity: 0.1 });
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

const MapFocusHandler = () => {
    const map = useMap();
    const { state, dispatch } = useApp();
    const { t } = useTranslation();
    const lastFlownTo = useRef<string | null>(null);
    
    useEffect(() => {
        const isVal = (c: any) => 
            Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number' && !isNaN(c[0]) && !isNaN(c[1]);

        if (state.focusCoords && isVal(state.focusCoords)) {
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
                            const finalNdvi = placeInfo.isGreenSpace ? Math.max(0.75, ndvi) : (placeInfo.isWater ? Math.max(0.85, ndvi) : ndvi);
                            
                            dispatch({ type: "SELECT_FEATURE", payload: {
                                type: "Feature",
                                properties: {
                                    name: placeInfo.name,
                                    district: t('dynamicAnalysisArea') || "Search Result",
                                    ndvi: finalNdvi,
                                    population: Math.floor(Math.random() * 20000 + 5000),
                                    treeCount: Math.floor(finalNdvi * 1100),
                                    avgTemp: 34 - (finalNdvi * 7),
                                },
                                geometry: { type: "Point", coordinates: [lng, lat] }
                            } as NDVIFeature });
                        }
                    }, 500);
                    dispatch({ type: "SET_FOCUS_COORDS", payload: null });
                } catch (e) { console.error("Search flyTo failed", e); }
            }
            return;
        }

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
}

function MapMoveHandler({ onMove }: { onMove: (coords: [number, number]) => void }) {
    const map = useMap();
    const { dispatch } = useApp();
    useEffect(() => {
        const handleMove = () => {
            const center = map.getCenter();
            const coords: [number, number] = [center.lat, center.lng];
            onMove(coords);
            dispatch({ type: "SET_MAP_CENTER", payload: coords });
        };
        map.on("moveend", handleMove);
        return () => { map.off("moveend", handleMove); };
    }, [map, onMove, dispatch]);
    return null;
}

function MapClickHandler() {
    const { dispatch } = useApp();
    const { t } = useTranslation();

    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            const matchedFeature = findDistrictByCoords(lat, lng, NDVI_GEOJSON);

            if (matchedFeature) {
                dispatch({ type: "SELECT_FEATURE", payload: matchedFeature });
                dispatch({ type: "SET_VIEW", payload: "ai" });
            } else {
                const ndvi = getDynamicNDVI(lat, lng);
                const placeInfo = await reverseGeocode(lat, lng);
                const formattedName = placeInfo.name !== `${lat.toFixed(3)}N/${lng.toFixed(3)}E` 
                    ? placeInfo.name 
                    : `${t('gridSector') || "Sector"} ${lat.toFixed(3)}N/${lng.toFixed(3)}E`;

                const finalNdvi = placeInfo.isGreenSpace ? Math.max(0.75, ndvi) : (placeInfo.isWater ? Math.max(0.85, ndvi) : ndvi);
                const finalPop = placeInfo.isGreenSpace || placeInfo.isWater ? Math.floor(Math.random() * 500) : Math.floor(Math.random() * 30000 + 5000);
                const finalTemp = 34 - (finalNdvi * 8);

                const clickFeature = {
                    type: "Feature",
                    properties: {
                        name: formattedName,
                        district: t('dynamicAnalysisArea') || "Dynamic Analysis Area",
                        ndvi: finalNdvi,
                        population: finalPop,
                        treeCount: Math.floor(finalNdvi * 1200),
                        avgTemp: finalTemp,
                    },
                    geometry: { type: "Point", coordinates: [lng, lat] }
                } as NDVIFeature;
                dispatch({ type: "SELECT_FEATURE", payload: clickFeature });
                dispatch({ type: "SET_VIEW", payload: "ai" });
            }
        }
    });
    return null;
}

export default function EcoMap() {
  const { state, dispatch } = useApp();
  const { t } = useTranslation();
  const theme = MAP_THEMES.find(th => th.id === state.mapTheme) || MAP_THEMES[0];
  const defaultCenter: [number, number] = [30.998043, -6.755833];
  
  const initialCenter = useMemo(() => {
    const isVal = (c: any) => Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number' && !isNaN(c[0]) && !isNaN(c[1]);
    if (isVal(state.lastMapCenter)) return state.lastMapCenter as [number, number];
    if (isVal(state.userLocation)) return state.userLocation as [number, number];
    return defaultCenter;
  }, [state.lastMapCenter, state.userLocation]);

  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileCard, setActiveMobileCard] = useState<string | null>(null);
  const [showReports, setShowReports] = useState(true);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (mobile) setShowReports(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

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

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLocateUser = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            dispatch({ type: "SET_FOCUS_COORDS", payload: [pos.coords.latitude, pos.coords.longitude] });
        });
    }
  };

  return (
    <div id="main-map-container" className="relative w-full h-full min-h-screen group overflow-hidden bg-obsidian-950">
      <FloatingAnalysisPanel key={state.selectedFeature?.properties.name || 'none'} />

      <MapContainer center={[20, 0]} zoom={3} zoomControl={false} style={{ height: "100%", width: "100%" }} className="bg-obsidian-950 h-full w-full">
        <MapResizer />
        <TileLayer url={theme.url} attribution={theme.attribution} />
        <MapInitialFocus center={mapCenter} />
        
        {locationLoaded && (
            <>
                <MapMoveHandler onMove={setMapCenter} />
                <MapFocusHandler />
                <MapClickHandler />

                {state.heatRiskMode ? (
                    <HeatRiskLayer />
                ) : (
                    <GeoJSON 
                        data={NDVI_GEOJSON as any} 
                        pointToLayer={(feature, latlng) => {
                            const isSelected = state.selectedFeature?.properties.name === feature.properties.name;
                            const color = getColor(feature.properties.ndvi);
                            return L.marker(latlng, {
                                icon: L.divIcon({
                                    className: 'tactical-sector-icon',
                                    html: `
                                        <div class="relative flex items-center justify-center transition-all duration-500 scale-${isSelected ? '125' : '100'}">
                                            <div class="absolute w-8 h-8 rounded-full bg-emerald-500/10 animate-pulse"></div>
                                            <div class="absolute w-3 h-3 rounded-full border border-white/50 shadow-[0_0_10px_${color}88]" style="background-color: ${color};"></div>
                                            ${isSelected ? `<div class="absolute -inset-1 border border-emerald-400/50 rounded-full animate-ping"></div>` : ''}
                                        </div>
                                    `,
                                    iconSize: [32, 32], iconAnchor: [16, 16]
                                })
                            });
                        }}
                        style={(feature) => {
                            const isSelected = state.selectedFeature?.properties.name === feature?.properties.name;
                            return {
                                fillColor: getColor(feature?.properties.ndvi),
                                weight: isSelected ? 3 : 1.5,
                                opacity: isSelected ? 0.8 : 0.2,
                                color: isSelected ? "#10b981" : "rgba(255,255,255,0.1)",
                                fillOpacity: isSelected ? 0.6 : 0.4,
                                dashArray: isSelected ? "5, 5" : ""
                            };
                        }}
                        onEachFeature={(feature, layer) => {
                            const { name, ndvi } = feature.properties;
                            layer.bindTooltip(`<div class="font-sans text-[10px] font-bold p-1"><div class="text-white/60 mb-0.5">${name}</div><div style="color:${getColor(ndvi)}">NDVI ${ndvi.toFixed(3)}</div></div>`, { sticky: true, className: "eco-tooltip" });
                            layer.on("click", (e) => {
                                L.DomEvent.stopPropagation(e as any);
                                dispatch({ type: "SELECT_FEATURE", payload: feature as NDVIFeature });
                                dispatch({ type: "SET_VIEW", payload: "ai" });
                            });
                         }}
                     />
                 )}

                <Marker position={state.userLocation ?? mapCenter} icon={L.divIcon({
                    className: 'user-lock-icon',
                    html: `<div class="relative group" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;"><div class="absolute w-10 h-10 bg-cyan-500/20 rounded-full animate-ping"></div><div class="absolute w-4 h-4 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div></div>`,
                    iconSize: [40, 40], iconAnchor: [20, 20]
                })} />

                {showReports && <ReportMarkers />}

                {state.aiInsight?.recommendations && state.selectedFeature && (
                    <>
                        {state.aiInsight.recommendations.map((rec, i) => {
                            const center = state.selectedFeature!.geometry.type === 'Point' 
                                ? [state.selectedFeature!.geometry.coordinates[1], state.selectedFeature!.geometry.coordinates[0]]
                                : [state.selectedFeature!.geometry.coordinates[0][0][1], state.selectedFeature!.geometry.coordinates[0][0][0]];
                            const pos: [number, number] = [(center[0] as number) + (i - 1) * 0.002, (center[1] as number) + Math.sin(i) * 0.002];
                            const color = rec.impact === 'high' ? '#10b981' : rec.impact === 'medium' ? '#f59e0b' : '#3b82f6';

                            return (
                                <Marker key={rec.id} position={pos} icon={L.divIcon({
                                    className: 'neural-intel-marker',
                                    html: `<div class="relative group" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;"><div class="absolute w-8 h-8 rounded-full animate-ping opacity-20" style="background-color: ${color}"></div><div class="absolute w-3 h-3 rounded-full border border-white shadow-2xl" style="background-color: ${color}"></div></div>`,
                                    iconSize: [30, 30], iconAnchor: [15, 15]
                                })} />
                            );
                        })}
                    </>
                )}
            </>
        )}
      </MapContainer>

      {/* COMMAND DECK */}
      <div className="absolute top-16 lg:top-14 left-1/2 -translate-x-1/2 z-[1005] w-full max-w-sm lg:max-w-xl px-4 pointer-events-none">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pointer-events-auto">
                  <div className="flex-1 min-w-0"><MapSearch /></div>
                  <div className={`${HUD_GLASS} px-2 py-2 rounded-3xl border-emerald-500/20 flex items-center gap-1 shadow-2xl shrink-0`}>
                    <button onClick={() => dispatch({ type: "TOGGLE_HEAT_RISK" })} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!state.heatRiskMode ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>Grid</button>
                    <button onClick={() => dispatch({ type: "TOGGLE_HEAT_RISK" })} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${state.heatRiskMode ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/40 hover:text-white/60'}`}><Zap size={12} />Risk</button>
                  </div>
              </div>

              {isMobile && (
                <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 bg-[#05080D]/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl pointer-events-auto">
                    <div className="shrink-0 relative">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 overflow-hidden"><Satellite size={14} className="text-emerald-400 animate-pulse" /></div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#05080D] animate-ping" />
                    </div>
                    <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Target Sector Data</span>
                            <span className="text-lg font-mono font-black text-white">{getDynamicNDVI(mapCenter[0], mapCenter[1]).toFixed(3)}</span>
                        </div>
                        <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= (getDynamicNDVI(mapCenter[0], mapCenter[1]) * 5) ? 'bg-emerald-400' : 'bg-white/10'}`} />)}
                        </div>
                    </div>
                </motion.div>
              )}
          </motion.div>
      </div>

      <div className="absolute bottom-16 lg:bottom-24 left-6 right-6 lg:left-12 lg:right-12 z-[1002] pointer-events-none">
          <AnimatePresence mode="wait">
            {isMobile && activeMobileCard && (
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="pointer-events-auto w-full mb-4">
                  <div className={`${HUD_GLASS} p-6 rounded-[2.5rem] border-cyan-500/20 overflow-hidden relative shadow-inner backdrop-blur-3xl`}>
                     <div className="absolute top-4 right-4 z-20"><button onClick={() => setActiveMobileCard(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/40 active:bg-cyan-500/20 active:text-white transition-all"><X size={14} /></button></div>
                     
                     {activeMobileCard === 'metrics' && (
                        <div className="space-y-4">
                           <div className="flex items-center gap-3 border-b border-white/5 pb-3"><Crosshair className="w-4 h-4 text-emerald-400" /><span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Sector Analysis</span></div>
                           <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1"><span className="text-[8px] font-black text-white/30 uppercase tracking-widest">NDVI</span><div className="text-sm font-mono font-black text-emerald-400">{getDynamicNDVI(mapCenter[0], mapCenter[1]).toFixed(3)}</div></div>
                               <div className="space-y-1 border-l border-white/5 pl-4"><span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Health</span><div className="text-[10px] font-mono font-black uppercase text-emerald-400">Stable</div></div>
                           </div>
                        </div>
                     )}

                     {activeMobileCard === 'intelligence' && state.selectedFeature && (
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                               <Brain className="w-4 h-4 text-emerald-400" />
                               <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Tactical Intelligence</span>
                           </div>
                           <div className="flex items-start justify-between gap-4">
                               <div className="space-y-1">
                                   <h3 className="text-lg font-black text-white uppercase">{state.selectedFeature.properties.name}</h3>
                                   <div className="flex items-center gap-1.5"><MapPin size={10} className="text-cyan-400" /><span className="text-[8px] font-bold text-white/30 truncate">{state.selectedFeature.properties.district}</span></div>
                               </div>
                               <div className="relative w-12 h-12 shrink-0 rounded-xl bg-emerald-500/10 border border-white/10 overflow-hidden flex items-center justify-center">
                                   <motion.div animate={{ y: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute top-0 w-full h-0.5 bg-emerald-400 z-10" />
                                   <Satellite size={20} className="text-emerald-400/40" />
                               </div>
                           </div>
                           
                           {state.isLoadingInsight ? <div className="flex items-center justify-center h-20"><Loader2 className="animate-spin text-emerald-400" /></div> : (
                               <div className="space-y-4">
                                   <div className="grid grid-cols-2 gap-2">
                                       <div className="bg-white/5 p-3 rounded-2xl border border-white/5"><div className="text-[7px] text-white/30 uppercase mb-1">Risk Score</div><div className="text-lg font-mono font-black text-white">{calculateHeatRisk({ndvi: state.selectedFeature.properties.ndvi, temperature: state.selectedFeature.properties.avgTemp, urbanDensity: state.selectedFeature.properties.population / 150000 }).score}</div></div>
                                       <div className="bg-white/5 p-3 rounded-2xl border border-white/5"><div className="text-[7px] text-white/30 uppercase mb-1">Status</div><div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Optimal</div></div>
                                   </div>
                               </div>
                           )}
                        </div>
                     )}

                     {activeMobileCard === 'telemetry' && (
                        <div className="space-y-4">
                           <div className="flex items-center gap-3 border-b border-white/5 pb-3"><Target className="w-4 h-4 text-cyan-400" /><span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Sector Coordinates</span></div>
                           <div className="text-xl font-mono font-black text-white tracking-widest">{mapCenter[0].toFixed(5)}°N / {mapCenter[1].toFixed(5)}°E</div>
                        </div>
                     )}
                  </div>
               </motion.div>
            )}
          </AnimatePresence>

          <div className="pointer-events-auto flex items-end justify-between w-full">
            <div className="flex gap-2">
                <button onClick={handleLocateUser} className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center border-cyan-500/20 active:scale-95 transition-all shadow-2xl`}><Navigation size={20} className="text-cyan-400" /><span className="text-[7px] font-black text-white/50 uppercase">Locate</span></button>
                <button onClick={() => setActiveMobileCard(activeMobileCard === 'metrics' ? null : 'metrics')} className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center border-emerald-500/20 ${activeMobileCard === 'metrics' ? 'bg-emerald-500/20' : ''}`}><Crosshair size={20} className={activeMobileCard === 'metrics' ? 'text-emerald-400' : 'text-white/30'} /><span className="text-[7px] font-black text-white/50 uppercase">Metrics</span></button>
            </div>
            <div className="flex gap-2">
                {state.selectedFeature && (
                    <button onClick={() => setActiveMobileCard(activeMobileCard === 'intelligence' ? null : 'intelligence')} className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center border-emerald-500/20 ${activeMobileCard === 'intelligence' ? 'bg-emerald-500/20' : ''}`}><Brain size={20} className={activeMobileCard === 'intelligence' ? 'text-emerald-400' : 'text-white/30'} /><span className="text-[7px] font-black text-white/50 uppercase">Intel</span></button>
                )}
                <button onClick={() => setActiveMobileCard(activeMobileCard === 'telemetry' ? null : 'telemetry')} className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center border-cyan-500/20 ${activeMobileCard === 'telemetry' ? 'bg-cyan-500/20' : ''}`}><Target size={20} className={activeMobileCard === 'telemetry' ? 'text-cyan-400' : 'text-white/30'} /><span className="text-[7px] font-black text-white/50 uppercase">Target</span></button>
            </div>
          </div>
      </div>
    </div>
  );
}