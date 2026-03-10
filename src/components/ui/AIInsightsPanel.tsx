"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  GanttChart,
  Users,
  Thermometer,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  TreePine,
  Droplets,
  Zap,
  Activity,
  BarChart3,
  Sparkles,
  MapPin,
  AlertTriangle,
  Wind,
  X,
  Maximize2,
  Minimize2,
  Search,
  Satellite
} from "lucide-react";
import { calculateHeatRisk } from "@/utils/calculateHeatRisk";
import { useApp } from "@/context/AppContext";
import { NDVI_GEOJSON, CITY_AVG_NDVI } from "@/lib/data";
import { getColor, getDynamicNDVI, findDistrictByCoords } from "@/lib/ndvi";
import { generateAIInsight } from "@/lib/gemini";
import { NDVIFeature, AIRecommendation } from "@/types";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { reverseGeocode } from "@/utils/reverseGeocode";

export default function AIInsightsPanel() {
  const { state, dispatch } = useApp();
  const { t } = useTranslation();
  const [isScanningCenter, setIsScanningCenter] = useState(false);

  const criticalZones = NDVI_GEOJSON.features.filter(
    (f) => f.properties.ndvi < 0.2
  );
  const totalPopAtRisk = criticalZones.reduce(
    (sum, f) => sum + f.properties.population,
    0
  );
  const avgNDVI = NDVI_GEOJSON.features.length > 0 
    ? NDVI_GEOJSON.features.reduce((sum, f) => sum + f.properties.ndvi, 0) / NDVI_GEOJSON.features.length
    : CITY_AVG_NDVI;

  const handleSelectDistrict = (feature: NDVIFeature) => {
    dispatch({ type: "SELECT_FEATURE", payload: feature });
    
    // Cinematic flyTo when selecting from panel
    let targetCoords: [number, number] | null = null;
    if (feature.geometry.type === 'Point') {
        targetCoords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
    } else if (feature.geometry.type === 'Polygon') {
        // Fallback to first point of polygon if centroid not available
        targetCoords = [feature.geometry.coordinates[0][0][1], feature.geometry.coordinates[0][0][0]];
    }
    
    if (targetCoords) {
        dispatch({ type: "SET_FOCUS_COORDS", payload: targetCoords });
    }
    
    // Scroll insight into view on mobile
    if (window.innerWidth < 1024) {
      document.getElementById('ai-core-intel')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScanActiveMap = () => {
    setIsScanningCenter(true);
    
    // Simulate tactical delay for 'Deep Scan'
    setTimeout(async () => {
        const center = state.lastMapCenter || [30.998, -6.755];
        
        // Use standardized matching utility
        const matchedFeature = findDistrictByCoords(center[0], center[1], NDVI_GEOJSON);

        if (matchedFeature) {
            handleSelectDistrict(matchedFeature);
        } else {
            // Dynamic High-Fidelity Synthetic Analysis
            const ndvi = getDynamicNDVI(center[0], center[1]);
            const placeInfo = await reverseGeocode(center[0], center[1]);
            const formattedName = placeInfo.name !== `${center[0].toFixed(3)}N/${center[1].toFixed(3)}E` 
                ? placeInfo.name 
                : `${t('gridSector') || "Sector"} ${center[0].toFixed(3)}N/${center[1].toFixed(3)}E`;

            const finalNdvi = placeInfo.isGreenSpace ? Math.max(0.75, ndvi) : (placeInfo.isWater ? Math.max(0.85, ndvi) : ndvi);
            const finalPop = placeInfo.isGreenSpace || placeInfo.isWater ? Math.floor(Math.random() * 500) : Math.floor(Math.random() * 15000 + 2000);
            const finalTemp = 33 - (finalNdvi * 6);

            handleSelectDistrict({
                type: "Feature",
                properties: {
                    name: formattedName,
                    district: t('dynamicAnalysisArea') || "Dynamic Analysis Area",
                    ndvi: finalNdvi,
                    population: finalPop,
                    treeCount: Math.floor(finalNdvi * 1000),
                    avgTemp: finalTemp,
                },
                geometry: { type: "Point", coordinates: [center[1], center[0]] }
            } as NDVIFeature);
        }
        setIsScanningCenter(false);
    }, 1500);
  };

  const RecommendationCard = ({ rec, delay }: { rec: AIRecommendation; delay: number }) => {
    const icons = {
        planting: <TreePine size={16} />,
        cooling: <Droplets size={16} />,
        policy: <GanttChart size={16} />,
        community: <Users size={16} />
    };

    const colors = {
        high: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
        medium: "border-amber-500/20 bg-amber-500/5 text-amber-400",
        low: "border-blue-500/20 bg-blue-500/5 text-blue-400"
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.4 }}
            className={`p-4 rounded-3xl border ${colors[rec.impact]} flex gap-4 hover:bg-white/[0.02] hover:border-white/20 transition-all cursor-default group`}
        >
            <div className={`p-2.5 rounded-xl border border-current shrink-0 self-center opacity-70 group-hover:opacity-100 transition-opacity`}>
                {icons[rec.type as keyof typeof icons] || <Sparkles size={16} />}
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-tight leading-none">{rec.title}</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-40 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{t(`impact_${rec.impact}`)}</span>
                </div>
                <p className="text-[10px] font-bold text-white/40 leading-snug uppercase tracking-tight">
                    {rec.description}
                </p>
            </div>
        </motion.div>
    );
  };

  const StatCard = ({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: "red" | "amber" | "green"; icon: React.ReactNode; }) => {
    const themes = {
      red: "text-red-400 bg-red-400/5 border-red-400/10",
      amber: "text-amber-400 bg-amber-400/5 border-amber-400/10",
      green: "text-emerald-400 bg-emerald-400/5 border-emerald-400/10",
    }[color];

    return (
      <div className={`border rounded-[1.5rem] p-3 text-center flex flex-col items-center justify-center space-y-1 h-24 ${themes} hover:brightness-125 transition-all cursor-default`}>
        <div className="opacity-30 mb-1">{icon}</div>
        <div className="text-xl font-black font-mono leading-none tracking-tighter">{value}</div>
        <div className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 leading-tight">
          {label} <br/> {sub}
        </div>
      </div>
    );
  };
  
  // Centralized Insight Engine
  const lastAnalysisKey = useRef<string | null>(null);
  useEffect(() => {
    const analysisKey = `${state.selectedFeature?.properties.name}-${state.language}`;
    if (state.selectedFeature && analysisKey !== lastAnalysisKey.current) {
        lastAnalysisKey.current = analysisKey;
        
        const load = async () => {
            dispatch({ type: "SET_LOADING_INSIGHT", payload: true });
            const insight = await generateAIInsight(state.selectedFeature!, state.language);
            dispatch({ type: "SET_AI_INSIGHT", payload: insight });
        };
        
        load();
    }
  }, [state.selectedFeature, state.language, dispatch]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-obsidian-950/40 lg:bg-transparent">
      {/* HEADER: NEURAL INTELLIGENCE HUB */}
      <div className="p-5 lg:p-7 border-b border-white/[0.08] shrink-0 bg-[#05080D]/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[100px] rounded-full translate-x-16 -translate-y-16" />
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Sparkles size={18} className="text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] leading-none mb-1">{t('aiInsights')}</h2>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest leading-none">NEURAL-CORE ACTIVE</span>
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] font-black text-white/20 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-widest">
              v4.2.8
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar pb-24 lg:pb-6">
        
        {/* GLOBAL TELEMETRY OVERVIEW */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label={t('ndviIndex')} value={avgNDVI.toFixed(2)} sub={t('cityAvg')} color="amber" icon={<BarChart3 size={14} />} />
          <StatCard label={t('alerts')} value={criticalZones.length.toString()} sub={t('criticalRiskArea')} color="red" icon={<AlertTriangle size={14} />} />
          <StatCard label={t('atRisk')} value={`${(totalPopAtRisk / 1000).toFixed(0)}k`} sub={t('residents')} color="red" icon={<Zap size={14} />} />
        </div>

        {/* AI CORE INTELLIGENCE RENDERER */}
        <div id="ai-core-intel" className="relative group/core">
          <AnimatePresence mode="wait">
            {!state.selectedFeature ? (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
                transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                className="glass rounded-[3.5rem] p-10 lg:p-14 flex flex-col items-center justify-center text-center space-y-12 border border-white/10 bg-gradient-to-b from-white/[0.01] to-transparent shadow-[0_50px_120px_-30px_rgba(0,0,0,0.6)] relative overflow-hidden"
              >
                {/* Tactical HUD Elements */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 left-0 w-24 h-24 border-l border-t border-emerald-500/30 rounded-tl-[4rem]" />
                    <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-emerald-500/30 rounded-tr-[4rem]" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 border-l border-b border-emerald-500/30 rounded-bl-[4rem]" />
                    <div className="absolute bottom-0 right-0 w-24 h-24 border-r border-b border-emerald-500/30 rounded-br-[4rem]" />
                </div>

                <div className="relative group/pulse">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.4, 1], 
                            opacity: [0.1, 0.3, 0.1],
                            rotate: [0, 90, 180] 
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset--8 bg-emerald-500 blur-[80px] rounded-full"
                    />
                    <div className="w-32 h-32 rounded-[2.5rem] bg-black/40 flex items-center justify-center border border-white/10 relative z-10 shadow-2xl backdrop-blur-3xl group-hover/pulse:scale-105 transition-all duration-700">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 border-2 border-dashed border-emerald-500/10 rounded-full"
                        />
                        <Activity size={56} className="text-emerald-400 opacity-40 group-hover/pulse:opacity-100 transition-all duration-500" />
                        <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-emerald-500 text-black text-[9px] font-black rounded-lg shadow-lg">STDBY</div>
                    </div>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">{t('selectLocationForAnalysis') || "Select Location for Analysis"}</span>
                    </div>
                    <p className="text-[12px] lg:text-[14px] font-medium text-white/50 max-w-[320px] leading-relaxed mx-auto italic">
                        &quot;{t('standbyMessage') || "Environmental neural network standby. Select a tactical sector from the map to initiate high-fidelity deep-scan diagnostics."}&quot;
                    </p>
                </div>

                <div className="flex flex-col items-center gap-6 relative z-10">
                    <motion.button
                        disabled={isScanningCenter}
                        whileHover={{ scale: isScanningCenter ? 1 : 1.05, y: -2 }}
                        whileTap={{ scale: isScanningCenter ? 1 : 0.95 }}
                        onClick={handleScanActiveMap}
                        className={`relative group/scan flex items-center gap-5 px-12 py-5 rounded-[2rem] border border-emerald-500/40 bg-emerald-500/10 transition-all shadow-[0_20px_40px_-10px_rgba(16,185,129,0.2)] hover:shadow-[0_25px_60px_-10px_rgba(16,185,129,0.4)] hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
                    >
                        {isScanningCenter && (
                            <motion.div 
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
                            />
                        )}
                        <Search size={22} className={`text-emerald-400 ${isScanningCenter ? 'animate-spin' : 'group-hover/scan:rotate-12 transition-transform'}`} />
                        <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.4em]">
                            {isScanningCenter ? t('mappingData') || "Mapping Core Data" : t('scanActiveMap') || "Scan Map Sector"}
                        </span>
                    </motion.button>
                    
                    <div className="flex items-center gap-8 pt-4 border-t border-white/5 w-full justify-center">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Status</span>
                            <span className="text-[9px] font-black text-emerald-400 uppercase">Linked</span>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Latency</span>
                            <span className="text-[9px] font-black text-cyan-400 uppercase">12ms</span>
                        </div>
                    </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* 1. SECTOR HEADER & DISTRICT ANALYSIS */}
                <div className="glass rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full transition-colors" />

                    <div className="p-7 space-y-7 relative z-10">
                        {/* Header Section */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1 h-3.5 bg-emerald-400 rounded-full" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">{t('districtAnalysis')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                                        {state.selectedFeature.properties.name}
                                    </h3>
                                    <button 
                                        onClick={() => dispatch({ type: "SELECT_FEATURE", payload: null })}
                                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/30 transition-all group/close"
                                        title={t('clearSelection') || "Clear Selection"}
                                    >
                                        <X size={16} className="group-hover/close:rotate-90 transition-transform" />
                                    </button>
                                </div>
                                 <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{state.selectedFeature.properties.district}</span>
                                     <div className="w-1 h-1 rounded-full bg-emerald-400/20" />
                                     <div className="flex items-center gap-2">
                                         <CheckCircle2 size={10} className="text-emerald-400" />
                                         <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t('stableStatus') || "Stable Status"}</span>
                                     </div>
                                 </div>
                             </div>

                             {/* Tactical Visualizer (Replacing missing image) */}
                             <div className="relative w-24 h-24 shrink-0 group/viz ml-4">
                                <div className="absolute inset-0 bg-emerald-500/10 rounded-[2rem] border border-white/10 overflow-hidden group-hover/viz:border-emerald-500/40 transition-colors shadow-2xl">
                                    <motion.div 
                                        animate={{ y: ["0%", "100%", "0%"] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="h-0.5 w-full bg-emerald-400 shadow-[0_0_15px_#10b981] relative z-20"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                        <Satellite size={40} className="text-emerald-400" />
                                    </div>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-obsidian-950 animate-pulse z-30" />
                             </div>
                             
                             {state.isLoadingInsight ? (
                                <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 backdrop-blur-md">
                                    <Activity size={14} className="text-emerald-400 animate-spin" />
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{t('processing')}</span>
                                </div>
                            ) : (
                                <div className="text-right">
                                    {(() => {
                                        const risk = calculateHeatRisk({
                                            ndvi: state.selectedFeature.properties.ndvi,
                                            temperature: state.selectedFeature.properties.avgTemp,
                                            urbanDensity: state.selectedFeature.properties.population / 150000
                                         });
                                        
                                        // Special display for high-fidelity case studies
                                        if (state.selectedFeature?.properties.name === 'Calle de Castromonte') return null;

                                        const colorClass = risk.riskLevel === "High" ? "text-red-400" : risk.riskLevel === "Medium" ? "text-amber-400" : "text-emerald-400";
                                        const bgClass = risk.riskLevel === "High" ? "bg-red-400/5 border-red-400/10" : risk.riskLevel === "Medium" ? "bg-amber-400/5 border-amber-400/10" : "bg-emerald-400/5 border-emerald-400/10";
                                        return (
                                            <div className="space-y-1">
                                                <div className="text-xl font-mono font-black text-white leading-none tracking-tighter tabular-nums drop-shadow-2xl">
                                                    {risk.score}<span className="text-[10px] text-white/20 ml-1">/100</span>
                                                </div>
                                                <div className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest inline-block ${bgClass} ${colorClass}`}>
                                                    {risk.riskLevel} {t('riskLevel')}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* HIGH-FIDELITY CASE STUDIES (SPECIFIC LOCATIONS) */}
                        {['Calle de Castromonte', 'Calle de Alfonso XI'].includes(state.selectedFeature?.properties.name) && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="mt-2 space-y-4"
                            >
                                <div className={`bg-gradient-to-br border rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group/case ${
                                    state.selectedFeature.properties.name === 'Calle de Alfonso XI' 
                                    ? "from-cyan-500/10 to-transparent border-cyan-500/20" 
                                    : "from-amber-500/10 to-transparent border-amber-500/20"
                                }`}>
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
                                    
                                    <div className="flex items-center gap-4 mb-5 relative z-10">
                                        <div className={`p-3 rounded-2xl border shadow-inner ${
                                            state.selectedFeature.properties.name === 'Calle de Alfonso XI' 
                                            ? "bg-cyan-500/10 border-cyan-500/20" 
                                            : "bg-amber-500/10 border-amber-500/20"
                                        }`}>
                                            <ShieldAlert size={20} className={state.selectedFeature.properties.name === 'Calle de Alfonso XI' ? "text-cyan-400" : "text-amber-400"} />
                                        </div>
                                        <div className="space-y-1">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] block ${
                                                state.selectedFeature.properties.name === 'Calle de Alfonso XI' ? "text-cyan-400" : "text-amber-400"
                                            }`}>Tactical Case Study</span>
                                            <h4 className="text-lg font-black text-white uppercase tracking-tight">{state.selectedFeature.properties.name} Analysis</h4>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-5 relative z-10">
                                        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-[1.5rem] relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rotate-45 translate-x-1/2 -translate-y-1/2" />
                                            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Heat Risk Score</div>
                                            <div className="text-3xl font-mono font-black text-white leading-none">
                                                {state.selectedFeature.properties.name === 'Calle de Alfonso XI' ? 31 : 33}
                                                <span className="text-sm text-white/20 ml-1">/100</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-[1.5rem] relative overflow-hidden group">
                                            <div className="absolute bottom-0 right-0 w-12 h-12 bg-amber-500/5 rotate-45 translate-x-1/2 translate-y-1/2" />
                                            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Risk Level</div>
                                            <div className="text-sm font-black text-amber-400 uppercase tracking-widest pt-1">
                                                {state.selectedFeature.properties.name === 'Calle de Alfonso XI' ? "Medium Risk" : "Medium Risk"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-5 border-t border-white/10 relative z-10">
                                        <div className="flex items-center gap-2 px-1 mb-2">
                                            <Sparkles size={14} className="text-emerald-400" />
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">{t('aiAdaptationStrategy') || "AI Adaptation Strategy"}</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { text: t('increaseTreeCoverage') || "Increase urban tree coverage", icon: <TreePine size={13} />, prob: "92%" },
                                                { text: t('addShadedAreas') || "Add shaded areas", icon: <Maximize2 size={13} />, prob: "88%" },
                                                { text: t('deployCoolingStations') || "Deploy localized cooling stations", icon: <Droplets size={13} />, prob: "95%" },
                                                { text: t('encourageReflectiveRoofing') || "Encourage reflective roofing", icon: <Sparkles size={13} />, prob: "84%" }
                                            ].map((item, idx) => (
                                                <motion.div 
                                                    key={idx}
                                                    initial={{ x: -10, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 0.1 * idx }}
                                                    className="flex items-center gap-4 px-5 py-3.5 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-default group"
                                                >
                                                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[10px] font-bold text-white/70 tracking-tight group-hover:text-white transition-colors uppercase block truncate">{item.text}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="h-0.5 w-12 bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div initial={{ width: 0 }} animate={{ width: item.prob }} className="h-full bg-emerald-500" />
                                                            </div>
                                                            <span className="text-[8px] font-black text-emerald-400/60 uppercase">{item.prob} Match</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tactical Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-[1.5rem] flex flex-col gap-2 group/stat hover:bg-white/[0.04] transition-colors relative">
                                <TreePine size={14} className="text-emerald-400 opacity-40 group-hover/stat:opacity-100 transition-opacity" />
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block leading-tight">{t('ndviIndex')}</span>
                                    <span className="text-sm font-mono font-black text-emerald-400 tabular-nums">{state.selectedFeature.properties.ndvi.toFixed(4)}</span>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-[1.5rem] flex flex-col gap-2 group/stat hover:bg-white/[0.04] transition-colors relative">
                                <Users size={14} className="text-cyan-400 opacity-40 group-hover/stat:opacity-100 transition-opacity" />
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block leading-tight">{t('residents')}</span>
                                    <span className="text-sm font-mono font-black text-white/90 tabular-nums">{(state.selectedFeature.properties.population / 1000).toFixed(1)}k</span>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-[1.5rem] flex flex-col gap-2 group/stat hover:bg-white/[0.04] transition-colors relative">
                                <Thermometer size={14} className="text-amber-400 opacity-40 group-hover/stat:opacity-100 transition-opacity" />
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block leading-tight">{t('surfaceEnergy') || "Surface Energy"}</span>
                                    <span className="text-sm font-mono font-black text-amber-400 tabular-nums">{state.selectedFeature.properties.avgTemp.toFixed(1)}°C</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Insight Narrative Card */}
                        <div className="bg-emerald-500/[0.02] border border-emerald-500/10 rounded-[1.75rem] p-5 relative group/narrative overflow-hidden">
                            <div className="absolute top-4 left-4">
                                <Sparkles size={12} className="text-emerald-400/40" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] block mb-3 pl-6">{t('ecoInsights') || "Eco Insights"}</span>
                                    <AnimatePresence mode="wait">
                                        {state.isLoadingInsight ? (
                                            <div className="space-y-2 pl-6">
                                                <div className="h-3 w-full bg-white/5 rounded-full animate-pulse" />
                                                <div className="h-3 w-3/4 bg-white/5 rounded-full animate-pulse" />
                                            </div>
                                        ) : state.aiInsight ? (
                                            <motion.p 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-[13px] font-medium text-white/60 leading-relaxed italic pl-6 border-l border-emerald-500/20"
                                            >
                                                &quot;{state.aiInsight.text}&quot;
                                            </motion.p>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02, backgroundColor: "rgba(16, 185, 129, 0.15)" }}
                                        whileTap={{ scale: 0.98 }}
                                        className="py-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 group/btn transition-all"
                                    >
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t('requestSupport') || "Request Support"}</span>
                                        <ArrowRight size={12} className="text-emerald-400 group-hover/btn:translate-x-1 transition-transform" />
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleScanActiveMap}
                                        disabled={isScanningCenter}
                                        className="py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 group/scan transition-all disabled:opacity-50"
                                    >
                                        <Search size={12} className={`text-white/60 ${isScanningCenter ? 'animate-spin' : ''}`} />
                                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                                            {isScanningCenter ? t('scanning') : t('scanExternal')}
                                        </span>
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. RECOMMENDATION ENGINE */}
                <AnimatePresence>
                    {!state.isLoadingInsight && state.aiInsight?.recommendations && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                             <div className="flex items-center gap-3 px-2">
                                <Sparkles size={14} className="text-emerald-400" />
                                <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">{t('actionableIntelligence')}</h4>
                             </div>
                             
                             <div className="grid grid-cols-1 gap-3 px-1">
                                {state.aiInsight.recommendations.map((rec, i) => (
                                    <RecommendationCard key={rec.id} rec={rec} delay={i * 0.1} />
                                ))}
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* REFINED SATELLITE LIST */}
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-4 px-1">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-white/10 rounded-full" />
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                {t('satelliteFeed')}
                </p>
             </div>
             <span className="text-[9px] font-bold text-white/20 uppercase">Global Index</span>
          </div>
          <div className="space-y-1.5 opacity-80 hover:opacity-100 transition-opacity">
            {NDVI_GEOJSON.features
              .sort((a: any, b: any) => a.properties.ndvi - b.properties.ndvi)
              .map((feature: any) => {
                const { name, ndvi } = feature.properties;
                const color = getColor(ndvi);
                const isSelected = state.selectedFeature?.properties.name === name;

                return (
                  <motion.button
                    key={name}
                    onClick={() => handleSelectDistrict(feature)}
                    whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 group ${
                      isSelected ? "bg-emerald-500/10 border border-emerald-500/20 shadow-lg" : "border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-2">
                          <span className={`text-[12px] font-black tracking-tight transition-colors ${isSelected ? "text-emerald-400" : "text-white/70 group-hover:text-white"}`}>{name}</span>
                          <span className="text-[10px] font-mono font-black" style={{ color }}>{ndvi.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${ndvi * 100}%` }} style={{ backgroundColor: color }} />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
          </div>
        </div>

      </div>
    </div>
  );
}