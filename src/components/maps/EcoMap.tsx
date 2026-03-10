"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup, Rectangle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Crosshair, Zap } from "lucide-react";

import { useApp } from "@/context/AppContext";
import { NDVIFeature } from "@/types";
import { NDVI_GEOJSON, MOCK_REPORTS } from "@/lib/data";
import { getColor, getHeatLevel, getOpacity, getDynamicNDVI, getSmoothColor, findDistrictByCoords } from "@/lib/ndvi";
import { MAP_THEMES } from "@/lib/mapThemes";
import MapThemeSwitcher from "./MapThemeSwitcher";
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
    Target 
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
    
    // Also periodic check for container size changes during animations
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
    const { t } = useTranslation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!state.selectedFeature) return null;

    const feature = state.selectedFeature;
    const risk = calculateHeatRisk({
        ndvi: feature.properties.ndvi,
        temperature: feature.properties.avgTemp,
        urbanDensity: feature.properties.population / 150000
    });

    // Special handling for case studies (Calle de Alfonso XI)
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
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="p-6 space-y-6"
                    >
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
                                <div className="text-2xl font-mono font-black text-white truncate">{score}<span className="text-[10px] opacity-20 ml-1">/100</span></div>
                                <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-400/5 rotate-45 translate-x-4 -translate-y-4" />
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
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
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

    // Proceed if we haven't animated yet, and we have valid target coords, and we are not starting at global view [20,0]
    if (!hasFocused.current && !state.focusCoords && isVal(center) && !(center[0] === 20 && center[1] === 0)) {
        try {
            // Cinematic smooth flyTo!
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
            Array.isArray(c) && 
            c.length === 2 && 
            typeof c[0] === 'number' && 
            typeof c[1] === 'number' && 
            !isNaN(c[0]) && 
            !isNaN(c[1]);

        // 1. Handle explicit Search Focus
        if (state.focusCoords && isVal(state.focusCoords)) {
            const [lat, lng] = state.focusCoords;
            const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
            
            if (lastFlownTo.current !== coordKey) {
                lastFlownTo.current = coordKey;
                try {
                    map.flyTo(state.focusCoords, 16, { duration: 3, animate: true });
                    
                    // Auto-select feature at destination
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

        // 2. Handle Selection Focus (only if distance is significant to avoid "wobble")
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
    const { state, dispatch } = useApp();
    const { t } = useTranslation();

    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            
            // Use standardized matching utility
            const matchedFeature = findDistrictByCoords(lat, lng, NDVI_GEOJSON);

            let clickFeature = matchedFeature;

            if (matchedFeature) {
                dispatch({ type: "SELECT_FEATURE", payload: matchedFeature });
                dispatch({ type: "SET_VIEW", payload: "ai" });
            } else {
                // Dynamic analysis for points outside predefined sectors
                const ndvi = getDynamicNDVI(lat, lng);
                const placeInfo = await reverseGeocode(lat, lng);
                const formattedName = placeInfo.name !== `${lat.toFixed(3)}N/${lng.toFixed(3)}E` 
                    ? placeInfo.name 
                    : `${t('gridSector') || "Sector"} ${lat.toFixed(3)}N/${lng.toFixed(3)}E`;

                // Adapt to true landscape data from OSM
                const finalNdvi = placeInfo.isGreenSpace ? Math.max(0.75, ndvi) : (placeInfo.isWater ? Math.max(0.85, ndvi) : ndvi);
                const finalPop = placeInfo.isGreenSpace || placeInfo.isWater ? Math.floor(Math.random() * 500) : Math.floor(Math.random() * 30000 + 5000);
                const finalTemp = 34 - (finalNdvi * 8);

                clickFeature = {
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

            if (clickFeature) {
                // Feature selection already triggers the AI Insights Panel, so we maintain a clean map by skipping popups.
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

  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
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
      
      <FloatingAnalysisPanel />

      <MapContainer 
        center={[20, 0]} 
        zoom={3} 
        zoomControl={false} 
        style={{ height: "100%", width: "100%" }}
        className="bg-obsidian-950 h-full w-full"
      >
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
                            layer.bindTooltip(
                                `<div class="font-sans text-[10px] font-bold p-1">
                                    <div class="text-white/60 mb-0.5">${name}</div>
                                    <div style="color:${getColor(ndvi)}">NDVI ${ndvi.toFixed(3)}</div>
                                 </div>`, 
                                { sticky: true, className: "eco-tooltip" }
                            );
                            layer.on("click", (e) => {
                                L.DomEvent.stopPropagation(e as any);
                                dispatch({ type: "SELECT_FEATURE", payload: feature as NDVIFeature });
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
                                ${t('sectorLock')}
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

                {/* AI Neural Intervention Pulse Markers */}
                {state.aiInsight?.recommendations && state.selectedFeature && (
                    <>
                        {state.aiInsight.recommendations.map((rec, i) => {
                            // Calculate a point within or near the feature for visual feedback
                            const center = state.selectedFeature!.geometry.type === 'Point' 
                                ? [state.selectedFeature!.geometry.coordinates[1], state.selectedFeature!.geometry.coordinates[0]]
                                : [state.selectedFeature!.geometry.coordinates[0][0][1], state.selectedFeature!.geometry.coordinates[0][0][0]];
                            
                            // Add some offset for each marker so they don't stack
                            const offsetLat = (i - 1) * 0.002;
                            const offsetLng = Math.sin(i) * 0.002;
                            const pos: [number, number] = [(center[0] as number) + offsetLat, (center[1] as number) + offsetLng];
                            const color = rec.impact === 'high' ? '#10b981' : rec.impact === 'medium' ? '#f59e0b' : '#3b82f6';

                            return (
                                <Marker 
                                    key={rec.id} 
                                    position={pos} 
                                    icon={L.divIcon({
                                        className: 'neural-intel-marker',
                                        html: `
                                            <div class="relative group" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                                                <div class="absolute w-8 h-8 rounded-full animate-ping opacity-20" style="background-color: ${color}"></div>
                                                <div class="absolute w-3 h-3 rounded-full border border-white shadow-2xl" style="background-color: ${color}"></div>
                                                <div class="absolute -top-10 scale-0 group-hover:scale-100 transition-transform origin-bottom bg-[#05080D]/90 px-3 py-1 rounded-xl border border-white/10 backdrop-blur-md text-[9px] font-black text-white uppercase whitespace-nowrap shadow-2xl">
                                                    ${rec.title}
                                                </div>
                                            </div>
                                        `,
                                        iconSize: [30, 30], iconAnchor: [15, 15]
                                    })}
                                />
                            );
                        })}
                    </>
                )}
                {/* Popups removed for a cleaner, tactical map view. All diagnostics available in the AI Insights Panel. */}
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
                  {t('theme_terrain')}
                </button>
                <div className="w-[1px] h-4 bg-white/10" />
                <button
                  onClick={() => dispatch({ type: "TOGGLE_HEAT_RISK" })}
                  className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${state.heatRiskMode ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Zap size={12} className={state.heatRiskMode ? 'fill-emerald-400' : ''} />
                  {t('heatRisk')}
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
                        <span className="text-[8px] lg:text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{t('satelliteLink')}</span>
                        <span className="text-[10px] lg:text-[12px] font-black text-white uppercase tracking-tighter">{t('locateMe')}</span>
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
                              <span className="text-[8px] font-black text-emerald-400/80 uppercase tracking-[0.3em]">{t('sectorLock')}</span>
                              <div className="w-1 h-1 rounded-full bg-white/20 mx-1" />
                              <span className="text-[8px] font-mono text-white/50 uppercase tracking-widest">DATA DATE: {new Date().toISOString().split('T')[0]}</span>
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
                  <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pr-4">{t('selectTerrain')}</div>
                  <MapThemeSwitcher align="right" direction="up" className="relative scale-90 lg:scale-100" />
              </motion.div>
          </div>
      </div>

      {/* 3. AI SCAN CROSSHAIR (Only in AI View) */}
      <AnimatePresence>
          {state.activeView === "ai" && !state.selectedFeature && (
              <motion.div 
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 z-[1001] flex items-center justify-center pointer-events-none"
              >
                  <div className="relative flex items-center justify-center">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute w-64 h-64 border border-emerald-500/30 rounded-full"
                      />
                      <div className="absolute w-48 h-48 border border-emerald-500/20 rounded-full" />
                      <div className="absolute w-32 h-32 border border-emerald-500/40 rounded-full" />
                      
                      {/* Central Crosshair */}
                      <div className="w-8 h-8 relative flex items-center justify-center">
                          <div className="absolute w-full h-[1px] bg-emerald-400/60 shadow-[0_0_10px_#10b981]" />
                          <div className="absolute h-full w-[1px] bg-emerald-400/60 shadow-[0_0_10px_#10b981]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_15px_#10b981]" />
                      </div>
                      
                      {/* Corner Brackets */}
                      <div className="absolute -top-10 -left-10 w-4 h-4 border-t-2 border-l-2 border-emerald-500/40" />
                      <div className="absolute -top-10 -right-10 w-4 h-4 border-t-2 border-r-2 border-emerald-500/40" />
                      <div className="absolute -bottom-10 -left-10 w-4 h-4 border-b-2 border-l-2 border-emerald-500/40" />
                      <div className="absolute -bottom-10 -right-10 w-4 h-4 border-b-2 border-r-2 border-emerald-500/40" />
                      
                      <div className="absolute top-12 whitespace-nowrap">
                          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.4em] bg-obsidian-950/80 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md">
                             {t('tacticalScanZone')}
                          </span>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
}