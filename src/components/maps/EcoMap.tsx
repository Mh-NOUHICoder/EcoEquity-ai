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
import { RiskBadge } from "@/components/RiskBadge";
import { AIRecommendationsPanel } from "@/components/AIRecommendationsPanel";

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


function MapFocusHandler() {
  const map = useMap();
  const { state, dispatch } = useApp();
  const { t } = useTranslation();
  
  useEffect(() => {
    const isVal = (c: any) => 
      Array.isArray(c) && 
      c.length === 2 && 
      typeof c[0] === 'number' && 
      typeof c[1] === 'number' && 
      !isNaN(c[0]) && 
      !isNaN(c[1]);

    if (state.focusCoords && isVal(state.focusCoords)) {
      const [lat, lng] = state.focusCoords;
      try {
        map.flyTo(state.focusCoords, 15, { duration: 2.5 });
        
        // Auto-select the feature at search destination for immediate AI analysis
        setTimeout(async () => {
            const matched = findDistrictByCoords(lat, lng, NDVI_GEOJSON);
            if (matched) {
                dispatch({ type: "SELECT_FEATURE", payload: matched });
            } else {
                const ndvi = getDynamicNDVI(lat, lng);
                const placeName = await reverseGeocode(lat, lng);
                const formattedName = placeName !== `${lat.toFixed(3)}N/${lng.toFixed(3)}E` 
                    ? placeName 
                    : `${t('gridSector') || "Sector"} ${lat.toFixed(3)}N/${lng.toFixed(3)}E`;

                dispatch({ type: "SELECT_FEATURE", payload: {
                    type: "Feature",
                    properties: {
                        name: formattedName,
                        district: t('dynamicAnalysisArea') || "Search Result",
                        ndvi: ndvi,
                        population: Math.floor(Math.random() * 20000 + 5000),
                        treeCount: Math.floor(ndvi * 1100),
                        avgTemp: 34 - (ndvi * 7),
                    },
                    geometry: { type: "Point", coordinates: [lng, lat] }
                } as NDVIFeature });
            }
        }, 300); // Slight delay to let flyTo start

        dispatch({ type: "SET_FOCUS_COORDS", payload: null });
      } catch (e) {
        console.error("Focus flyTo failed", e);
      }
    }
  }, [state.focusCoords, map, dispatch, t]);
  
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

function MapClickHandler({ setPopupData }: { setPopupData: any }) {
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
                const placeName = await reverseGeocode(lat, lng);
                const formattedName = placeName !== `${lat.toFixed(3)}N/${lng.toFixed(3)}E` 
                    ? placeName 
                    : `${t('gridSector') || "Sector"} ${lat.toFixed(3)}N/${lng.toFixed(3)}E`;

                clickFeature = {
                    type: "Feature",
                    properties: {
                        name: formattedName,
                        district: t('dynamicAnalysisArea') || "Dynamic Analysis Area",
                        ndvi: ndvi,
                        population: Math.floor(Math.random() * 30000 + 5000),
                        treeCount: Math.floor(ndvi * 1200),
                        avgTemp: 34 - (ndvi * 8),
                    },
                    geometry: { type: "Point", coordinates: [lng, lat] }
                } as NDVIFeature;
                dispatch({ type: "SELECT_FEATURE", payload: clickFeature });
                dispatch({ type: "SET_VIEW", payload: "ai" });
            }

            if (clickFeature) {
                const urbanDensity = clickFeature.properties.population / 150000;
                const risk = calculateHeatRisk({
                    ndvi: clickFeature.properties.ndvi,
                    temperature: clickFeature.properties.avgTemp,
                    urbanDensity
                });

                setPopupData({
                    lat, lng,
                    name: clickFeature.properties.name,
                    score: risk.score,
                    riskLevel: risk.riskLevel
                });
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
  const [popupData, setPopupData] = useState<{
      lat: number;
      lng: number;
      name: string;
      score: number;
      riskLevel: "Low" | "Medium" | "High";
  } | null>(null);

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
                <MapClickHandler setPopupData={setPopupData} />

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

                                const lat = (e as any).latlng.lat;
                                const lng = (e as any).latlng.lng;
                                const urbanDensity = feature.properties.population / 150000;
                                const risk = calculateHeatRisk({
                                    ndvi: feature.properties.ndvi,
                                    temperature: feature.properties.avgTemp,
                                    urbanDensity
                                });

                                setPopupData({
                                    lat, lng,
                                    name: feature.properties.name,
                                    score: risk.score,
                                    riskLevel: risk.riskLevel
                                });
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
                {/* Neural Risk Popup */}
                {popupData && (
                    <Popup position={[popupData.lat, popupData.lng]} className="eco-popup border-none bg-transparent" autoPanPaddingTopLeft={[0, 150]} autoPanPaddingBottomRight={[0, 20]}>
                        <div className="w-[280px] sm:w-[320px] max-w-[85vw] flex flex-col gap-2 sm:gap-3">
                            <div className="bg-[#05080D]/95 border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md">
                                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider mb-2 sm:mb-3 border-b border-white/10 pb-2">
                                    {popupData.name}
                                </h3>
                                
                                <div className="space-y-2 sm:space-y-3 relative z-10 w-full">
                                    <div className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-white/50 tracking-[0.05em] sm:tracking-[0.1em] flex-1 mr-2">{t('heatRiskScore') || "Heat Risk Score"}</span>
                                        <div className="text-base sm:text-lg font-mono font-black text-white tabular-nums drop-shadow-md shrink-0">
                                            {popupData.score}<span className="text-[9px] sm:text-[10px] text-white/30 ml-1">/100</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-white/50 tracking-[0.05em] sm:tracking-[0.1em] flex-1 mr-2">{t('riskLevel') || "Risk Level"}</span>
                                        <div className="shrink-0">
                                            <RiskBadge riskLevel={popupData.riskLevel} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <AIRecommendationsPanel riskLevel={popupData.riskLevel} />
                        </div>
                    </Popup>
                )}
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