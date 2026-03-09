"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  TreePine,
  BarChart3,
  Zap,
  ShieldCheck,
  Activity,
  Droplets,
  Wind,
  GanttChart
} from "lucide-react";
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
  const avgNDVI =
    NDVI_GEOJSON.features.reduce((s, f) => s + f.properties.ndvi, 0) /
    NDVI_GEOJSON.features.length;

  const handleSelectDistrict = (feature: NDVIFeature) => {
    dispatch({ type: "SELECT_FEATURE", payload: feature });
    
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
            const placeName = await reverseGeocode(center[0], center[1]);
            const formattedName = placeName !== `${center[0].toFixed(3)}N/${center[1].toFixed(3)}E` 
                ? placeName 
                : `${t('gridSector') || "Sector"} ${center[0].toFixed(3)}N/${center[1].toFixed(3)}E`;

            handleSelectDistrict({
                type: "Feature",
                properties: {
                    name: formattedName,
                    district: t('dynamicAnalysisArea') || "Dynamic Analysis Area",
                    ndvi: ndvi,
                    population: Math.floor(Math.random() * 15000 + 2000),
                    treeCount: Math.floor(ndvi * 1000),
                    avgTemp: 33 - (ndvi * 6),
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
        community: <Wind size={16} />
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
            transition={{ delay }}
            className={`p-4 rounded-3xl border ${colors[rec.impact]} flex gap-4 hover:border-white/20 transition-all cursor-default group`}
        >
            <div className={`p-2.5 rounded-xl border border-current shrink-0 self-center opacity-70 group-hover:opacity-100 transition-opacity`}>
                {icons[rec.type]}
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-tight leading-none">{rec.title}</span>
                    <span className="text-[7px] font-black uppercase tracking-tighter opacity-40 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{t(`impact_${rec.impact}`)} {t('impactLabel')}</span>
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
      <div className="p-4 lg:p-6 border-b border-white/[0.08] shrink-0 bg-white/[0.02] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
        <div className="flex items-center gap-2 mb-1.5 relative z-10">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">{t('aiInsights')}</h2>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[9px] font-black text-emerald-400/60 bg-emerald-400/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 uppercase tracking-tighter">
              v4.2-NEURAL
            </span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
          {t('districtAnalysis')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar pb-24 lg:pb-6">
        
        {/* GLOBAL TELEMETRY OVERVIEW */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label={t('ndviIndex')} value={avgNDVI.toFixed(2)} sub={t('cityAvg')} color="amber" icon={<BarChart3 size={14} />} />
          <StatCard label={t('alerts')} value={criticalZones.length.toString()} sub={t('criticalRiskArea')} color="red" icon={<AlertTriangle size={14} />} />
          <StatCard label={t('atRisk')} value={`${(totalPopAtRisk / 1000).toFixed(0)}k`} sub={t('residents')} color="red" icon={<Zap size={14} />} />
        </div>

        {/* AI CORE INTELLIGENCE RENDERER */}
        <div id="ai-core-intel" className="relative group">
          <AnimatePresence mode="wait">
            {!state.selectedFeature ? (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="glass rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-8 border border-white/5 bg-white/[0.01]"
              >
                <div className="relative">
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-0 bg-emerald-500 blur-3xl rounded-full"
                    />
                    <div className="w-20 h-20 rounded-3xl bg-white/[0.03] flex items-center justify-center border border-white/10 relative z-10 shadow-2xl backdrop-blur-xl">
                        <Activity size={40} className="text-emerald-400 opacity-20" />
                    </div>
                </div>
                <div className="space-y-3">
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-[0.4em]">{t('selectLocation')}</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase max-w-[260px] leading-relaxed mx-auto tracking-wide">
                        {t('standbyMessage')}
                    </p>
                </div>
                <motion.button
                    disabled={isScanningCenter}
                    whileHover={{ scale: isScanningCenter ? 1 : 1.05, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                    whileTap={{ scale: isScanningCenter ? 1 : 0.95 }}
                    onClick={handleScanActiveMap}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 transition-all group ${isScanningCenter ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <div className={`w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] ${isScanningCenter ? "animate-ping" : "animate-pulse"}`} />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">
                        {isScanningCenter ? t('transmitting') : t('scanActiveMap')}
                    </span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                key="active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* 1. SECTOR HEADER */}
                <div className="glass rounded-[2rem] p-6 border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent shadow-2xl">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <GanttChart size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none mb-1">
                                    {state.selectedFeature.properties.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{state.selectedFeature.properties.district}</span>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">{t('liveLink')}</span>
                                </div>
                            </div>
                        </div>
                        {state.isLoadingInsight && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{t('processing')}</span>
                            </div>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {state.isLoadingInsight ? (
                            <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-4 rounded-lg bg-white/[0.03] animate-pulse overflow-hidden relative">
                                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                    </div>
                                ))}
                            </motion.div>
                        ) : state.aiInsight ? (
                            <motion.div key="intel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                {/* Risk Assessment Bar */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                                        <span>{t('riskAssessment')}</span>
                                        <span className={state.aiInsight.riskScore > 0.6 ? 'text-red-400' : 'text-emerald-400'}>
                                            {(state.aiInsight.riskScore * 100).toFixed(0)}% {t('intensity')}
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/5 relative overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${state.aiInsight.riskScore * 100}%` }}
                                            className={`h-full rounded-full ${state.aiInsight.riskScore > 0.6 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            style={{ boxShadow: `0 0 10px ${state.aiInsight.riskScore > 0.6 ? 'red' : 'emerald'}` }}
                                        />
                                    </div>
                                </div>

                                {/* Text Narrative */}
                                <div className="relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 rounded-full" />
                                    <p className="text-sm font-medium text-white/70 leading-relaxed pl-5 italic">
                                        &quot;{state.aiInsight.text}&quot;
                                    </p>
                                </div>

                                {/* Health Impact Alert */}
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-start">
                                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                                        <ShieldCheck size={16} className="text-amber-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-amber-400/80 uppercase tracking-widest">{t('healthImpact')}</span>
                                        <p className="text-[11px] font-bold text-white/50 leading-normal uppercase">
                                            {state.aiInsight.healthImpact}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                {/* 2. RECOMMENDATION ENGINE (NEW) */}
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
                             
                             <div className="grid grid-cols-1 gap-3">
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