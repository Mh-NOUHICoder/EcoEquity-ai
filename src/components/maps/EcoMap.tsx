"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup, useMapEvents, Rectangle, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Navigation, 
    Crosshair, 
    Zap, 
    Loader2,
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
    Satellite,
    Monitor,
    Command,
    CheckCircle2
} from "lucide-react";

import { useApp } from "@/context/AppContext";
import { NDVIFeature } from "@/types";
import { NDVI_GEOJSON, MOCK_REPORTS } from "@/lib/data";
import { getColor, getHeatLevel, getDynamicNDVI, findDistrictByCoords, getAIStrategies } from "@/lib/ndvi";
import { MAP_THEMES } from "@/lib/mapThemes";
import MapThemeSwitcher from "./MapThemeSwitcher";
import { HeatRiskLayer } from "./HeatRiskLayer";
import { MapSearch } from "./MapSearch";
import { useTranslation } from "react-i18next";
import { calculateHeatRisk } from "@/utils/calculateHeatRisk";
import { reverseGeocode } from "@/utils/reverseGeocode";
import { useAppStore } from "@/store/useAppStore";

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
    const isRTL = state.language === 'ar';
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
            className={`absolute ${isRTL ? 'bottom-32 right-10' : 'top-44 left-10'} z-[1200] ${isCollapsed ? 'w-16' : 'w-80'} transition-all duration-500 pointer-events-auto hidden lg:block`}
        >
            <div dir={isRTL ? "rtl" : "ltr"} className={`${HUD_GLASS} rounded-[2.5rem] border-cyan-500/30 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col backdrop-blur-3xl`}>
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
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl relative overflow-hidden group/s">
                                <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{t('riskScore') || "Risk Score"}</div>
                                <div className="text-2xl font-mono font-black text-white truncate">{score}<span className="text-[10px] opacity-20 ml-1">/100</span></div>
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
                                {getAIStrategies(feature).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/10 rounded-2xl hover:bg-white/10 transition-colors shadow-lg shadow-black/20 relative z-10">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                            {item.type === 'water' ? <Droplets size={12} /> : item.type === 'infra' ? <Maximize2 size={12} /> : <TreePine size={12} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[9px] font-bold text-white/70 truncate uppercase tracking-tight">{t(item.text)}</div>
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

// --- Community Reports ---

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

const HeatZoneMarkers = () => {
    const heatZones = useAppStore(s => s.heatZones);
    return (
        <>
            {heatZones.map(zone => (
                <Circle 
                    key={zone.id}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius}
                    pathOptions={{
                        fillColor: '#ef4444',
                        fillOpacity: zone.intensity * 0.4,
                        color: zone.intensity > 0.8 ? '#ef4444' : 'transparent',
                        weight: 2,
                        dashArray: '5, 5'
                    }}
                >
                    <Popup className="eco-popup">
                        <div className="p-2 text-white">
                            <div className="text-[10px] font-black text-red-500 uppercase mb-1 flex items-center gap-2">
                                <Zap size={10} className="animate-pulse" />
                                Thermal Anomaly Detected
                            </div>
                            <strong className="block text-sm">{zone.label}</strong>
                            <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: `${zone.intensity * 100}%` }} />
                            </div>
                            <p className="text-[9px] mt-1 opacity-60">Intensity: {(zone.intensity * 100).toFixed(0)}%</p>
                        </div>
                    </Popup>
                </Circle>
            ))}
        </>
    );
};

const LiveRouteLayer = () => {
    const activeRoute = useAppStore(s => s.activeRoute);
    if (!activeRoute) return null;
    return (
        <Polyline 
            positions={activeRoute.map(r => [r.lat, r.lng])}
            pathOptions={{
                color: '#10b981',
                weight: 5,
                opacity: 0.6,
                dashArray: '10, 10',
                lineJoin: 'round'
            }}
        />
    );
};

const MapInitialFocus = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  const { state } = useApp();
  const hasFocused = useRef(false);
  const flyToCoords = useRef<string | null>(null);

  useEffect(() => {
    const isVal = (c: any) => 
      Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number' && !isNaN(c[0]) && !isNaN(c[1]);

    const coordKey = isVal(center) ? `${center[0].toFixed(4)},${center[1].toFixed(4)}` : null;

    if (!state.focusCoords && isVal(center) && coordKey !== flyToCoords.current && !(center[0] === 20 && center[1] === 0)) {
        try {
            // Priority: if we have a user location, we should eventually fly to it on entry
            // If the current center is the user location, we mark as focused
            const isUserLoc = state.userLocation && 
                             Math.abs(center[0] - state.userLocation[0]) < 0.001 && 
                             Math.abs(center[1] - state.userLocation[1]) < 0.001;

            if (!hasFocused.current || isUserLoc) {
                map.flyTo(center, 14, { duration: 3.5, animate: true, easeLinearity: 0.1 });
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

const MapFocusHandler = () => {
    const map = useMap();
    const { state, dispatch } = useApp();
    const { t } = useTranslation();
    const lastFlownTo = useRef<string | null>(null);
    const agentFocus = useAppStore(s => s.focusCoords);
    const setAgentFocus = useAppStore(s => s.setFocusCoords);
    
    useEffect(() => {
        const isVal = (c: any) => 
            Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number' && !isNaN(c[0]) && !isNaN(c[1]);

        // 1. AppContext focusCoords
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

        // 2. Zustand Store focusCoords (Agent Focus)
        if (agentFocus) {
            const coordKey = `agent-${agentFocus.lat.toFixed(5)},${agentFocus.lng.toFixed(5)}`;
            if (lastFlownTo.current !== coordKey) {
                lastFlownTo.current = coordKey;
                map.flyTo([agentFocus.lat, agentFocus.lng], 16, { duration: 3, animate: true });
                setAgentFocus(null);
            }
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
    }, [state.focusCoords, state.selectedFeature, map, dispatch, t, agentFocus, setAgentFocus]);
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
  const isRTL = state.language === 'ar';
  const theme = MAP_THEMES.find(th => th.id === state.mapTheme) || MAP_THEMES[0];
  const defaultCenter: [number, number] = [30.998043, -6.755833];
  
  const initialCenter = useMemo(() => {
    const isVal = (c: any) => Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number' && !isNaN(c[0]) && !isNaN(c[1]);
    
    // Priority: 1. User Location (Most relevant for "Fly to local on entry")
    // 2. Last known map center
    if (isVal(state.userLocation)) return state.userLocation as [number, number];
    if (isVal(state.lastMapCenter)) return state.lastMapCenter as [number, number];
    return defaultCenter;
  }, [state.userLocation, state.lastMapCenter]);

  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileCard, setActiveMobileCard] = useState<string | null>(null);
  const [showReports, setShowReports] = useState(true);

  // Synchronize state mapCenter if initialCenter changes (e.g. hydration or location detection)
  useEffect(() => {
    setMapCenter(initialCenter);
  }, [initialCenter]);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (mobile) setShowReports(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
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
                            // Popups disabled per user request - analysis is shown in the side panel
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
                 <HeatZoneMarkers />
                 <LiveRouteLayer />

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
      </MapContainer>

      {/* COMMAND DECK */}
      <div className="absolute top-16 lg:top-14 left-1/2 -translate-x-1/2 z-[1005] w-full max-w-sm lg:max-w-xl px-4 pointer-events-none">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col gap-3">
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 pointer-events-auto`}>
                  {!isMobile && (
                    <MapThemeSwitcher 
                      showText={false} 
                      align={isRTL ? "right" : "left"} 
                      direction="down" 
                      className="relative shrink-0" 
                    />
                  )}
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

          <div className={`pointer-events-auto flex ${isRTL ? 'lg:flex-row-reverse' : 'lg:flex-row'} flex-col items-end lg:justify-between gap-4 w-full`}>
            
            {/* Desktop Metrics HUD */}
            {!isMobile && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex gap-2">
                    <button 
                        onClick={handleLocateUser}
                        className={`${HUD_GLASS} rounded-[1.5rem] p-2.5 flex items-center gap-3 border-cyan-500/10 hover:border-cyan-500/30 transition-all group`}
                    >
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/5 flex items-center justify-center border border-white/5 group-hover:bg-cyan-500/20 transition-all">
                            <Monitor className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex flex-col text-left pr-2">
                            <span className="text-[7px] font-black text-white/20 uppercase tracking-[.2em] mb-0.5">{t('satelliteLink')}</span>
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">{t('locateMe')}</span>
                        </div>
                    </button>
                </motion.div>
            )}

            {/* Mobile View Toggles */}
            {isMobile && (
                <div className="flex gap-2">
                    <button onClick={handleLocateUser} className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center border-cyan-500/20 active:scale-95 transition-all shadow-2xl`}><Navigation size={20} className="text-cyan-400" /><span className="text-[7px] font-black text-white/50 uppercase">Locate</span></button>
                    <button onClick={() => setActiveMobileCard(activeMobileCard === 'metrics' ? null : 'metrics')} className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center border-emerald-500/20 ${activeMobileCard === 'metrics' ? 'bg-emerald-500/20' : ''}`}><Crosshair size={20} className={activeMobileCard === 'metrics' ? 'text-emerald-400' : 'text-white/30'} /><span className="text-[7px] font-black text-white/50 uppercase">Metrics</span></button>
                </div>
            )}

            <div className="flex gap-2 items-end">
                {/* Desktop Center HUD: Target Coordinates */}
                {!isMobile && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-1 max-w-sm hidden lg:block">
                        <div className={`${HUD_GLASS} px-6 py-3 rounded-[2rem] border-white/5 shadow-3xl backdrop-blur-3xl overflow-hidden relative group`}>
                            <div className="relative z-10 flex items-center justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                        <Target size={16} className="text-cyan-400 group-hover:rotate-45 transition-transform duration-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.3em] mb-0.5">{t('targetLockCoords') || "Target Lock"}</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono font-black text-white tracking-widest tabular-nums font-bold">
                                                {mapCenter[0].toFixed(5)}°N
                                            </div>
                                            <div className="w-1 h-px bg-white/20" />
                                            <div className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono font-black text-white tracking-widest tabular-nums font-bold">
                                                {mapCenter[1].toFixed(5)}°E
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end opacity-60">
                                    <span className="text-[6px] font-mono text-white/20 uppercase tracking-widest mb-0.5 text-right">{new Date().toISOString().split('T')[0]}</span>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="w-0.5 h-0.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[6px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap">ECO-SYNC ACTIVE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}


                
                {isMobile ? (
                    <div className="flex gap-2">
                        {state.selectedFeature && (
                            <button onClick={() => setActiveMobileCard(activeMobileCard === 'intelligence' ? null : 'intelligence')} className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center border-emerald-500/20 ${activeMobileCard === 'intelligence' ? 'bg-emerald-500/20' : ''}`}><Brain size={20} className={activeMobileCard === 'intelligence' ? 'text-emerald-400' : 'text-white/30'} /><span className="text-[7px] font-black text-white/50 uppercase">Intel</span></button>
                        )}
                        <button onClick={() => setActiveMobileCard(activeMobileCard === 'telemetry' ? null : 'telemetry')} className={`${HUD_GLASS} w-16 h-16 rounded-3xl flex flex-col items-center justify-center border-cyan-500/20 ${activeMobileCard === 'telemetry' ? 'bg-cyan-500/20' : ''}`}><Target size={20} className={activeMobileCard === 'telemetry' ? 'text-cyan-400' : 'text-white/30'} /><span className="text-[7px] font-black text-white/50 uppercase">Target</span></button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        {state.selectedFeature && (
                            <button 
                                onClick={() => dispatch({ type: "SET_VIEW", payload: "ai" })}
                                className={`${HUD_GLASS} px-4 h-12 rounded-2xl flex items-center gap-3 border-emerald-500/10 hover:border-emerald-500/40 transition-all group bg-emerald-500/5`}
                            >
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-white/5 group-hover:bg-emerald-500/30 transition-all">
                                    <Brain className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex flex-col text-left pr-2">
                                    <span className="text-[7px] font-black text-white/20 uppercase tracking-[.2em] mb-0.5">{t('aiInsights')}</span>
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Intelligence</span>
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>
          </div>
      </div>
    </div>
  );
}