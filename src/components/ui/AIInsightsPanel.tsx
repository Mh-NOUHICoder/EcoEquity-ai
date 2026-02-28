"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  TreePine,
  BarChart3,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/lib/translations";
import { NDVI_GEOJSON, CITY_AVG_NDVI } from "@/lib/data";
import { getColor } from "@/lib/ndvi";
import { generateAIInsight } from "@/lib/gemini";
import { NDVIFeature } from "@/types";

export default function AIInsightsPanel() {
  const { state, dispatch } = useApp();
  const t = translations[state.language];

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

  const handleSelectDistrict = async (feature: NDVIFeature) => {
    dispatch({ type: "SELECT_FEATURE", payload: feature });
    dispatch({ type: "SET_LOADING_INSIGHT", payload: true });
    // Scroll insight into view on mobile
    if (window.innerWidth < 1024) {
      document.getElementById('insight-result')?.scrollIntoView({ behavior: 'smooth' });
    }
    const insight = await generateAIInsight(feature);
    dispatch({ type: "SET_AI_INSIGHT", payload: insight });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-obsidian-950/40 lg:bg-transparent">
      <div className="p-4 lg:p-6 border-b border-white/[0.08] shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={16} className="text-emerald-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">{t.aiInsights}</h2>
          <span className="ml-auto text-[9px] font-black text-emerald-400/60 bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/20 uppercase tracking-tighter">
            {t.geminiCore}
          </span>
        </div>
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-tight">
          {t.districtAnalysis}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar pb-24 lg:pb-6">
        {/* Rapid Stats Dashboard */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label={t.ndviIndex} value={avgNDVI.toFixed(2)} sub={t.cityAvg} color="amber" icon={<BarChart3 size={14} />} />
          <StatCard label={t.alerts} value={criticalZones.length.toString()} sub={t.criticalRiskArea} color="red" icon={<AlertTriangle size={14} />} />
          <StatCard label={t.atRisk} value={`${(totalPopAtRisk / 1000).toFixed(0)}k`} sub={t.residents} color="red" icon={<Zap size={14} />} />
        </div>

        {/* Dynamic Insight Card */}
        <div id="insight-result" className="glass rounded-[2rem] overflow-hidden border border-white/10 shadow-xl bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Sparkles size={14} className="text-emerald-400 transition-pulse" />
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                    {state.selectedFeature ? state.selectedFeature.properties.name : (t.systemIdle || "System Idle")}
                </span>
            </div>
            {state.isLoadingInsight && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
          </div>

          <div className="p-5 min-h-[140px]">
            <AnimatePresence mode="wait">
              {state.isLoadingInsight ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {[100, 85, 92].map((w, i) => (
                    <div key={i} className="h-4 rounded-lg bg-white/[0.06] animate-shimmer" style={{ width: `${w}%` }} />
                  ))}
                </motion.div>
              ) : state.aiInsight ? (
                <motion.p key="insight" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-medium text-white/70 leading-relaxed italic">
                  &quot;{state.aiInsight}&quot;
                </motion.p>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/5 flex items-center justify-center mb-4 border border-emerald-500/10">
                    <Sparkles size={24} className="text-white/10" />
                  </div>
                  <p className="text-[12px] font-bold text-white/20 uppercase tracking-widest">
                    {t.selectLocation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* District Selection Area */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
             <div className="w-1.5 h-3.5 bg-emerald-500 rounded-full" />
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
               {t.satelliteFeed}
             </p>
          </div>
          <div className="space-y-1.5">
            {NDVI_GEOJSON.features
              .sort((a, b) => a.properties.ndvi - b.properties.ndvi)
              .map((feature) => {
                const { name, ndvi, avgTemp } = feature.properties;
                const color = getColor(ndvi);
                const isSelected = state.selectedFeature?.properties.name === name;
                const diff = ((ndvi - CITY_AVG_NDVI) / CITY_AVG_NDVI) * 100;

                return (
                  <motion.button
                    key={name}
                    onClick={() => handleSelectDistrict(feature)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                      isSelected ? "bg-emerald-500/10 border border-emerald-500/20 shadow-lg" : "hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full shrink-0 border-2 border-white/10" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}30` }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className={`text-[13px] font-black transition-colors ${isSelected ? "text-emerald-400" : "text-white/80 group-hover:text-white"}`}>{name}</span>
                          <span className="text-[11px] font-mono font-black" style={{ color }}>{ndvi.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${ndvi * 100}%` }} style={{ backgroundColor: color }} />
                          </div>
                          <span className="text-[10px] font-mono text-white/20 shrink-0 font-bold">{avgTemp}°C</span>
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

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: "red" | "amber" | "green"; icon: React.ReactNode; }) {
  const themes = {
    red: "text-red-400 bg-red-400/5 border-red-400/10 icon-red-400",
    amber: "text-amber-400 bg-amber-400/5 border-amber-400/10 icon-amber-400",
    green: "text-emerald-400 bg-emerald-400/5 border-emerald-400/10 icon-emerald-400",
  }[color];

  return (
    <div className={`border rounded-2xl p-3 text-center flex flex-col items-center justify-center space-y-1 h-24 ${themes}`}>
      <div className="opacity-40 mb-1">{icon}</div>
      <div className="text-xl font-black font-mono leading-none">{value}</div>
      <div className="text-[7px] font-black uppercase tracking-widest opacity-40 leading-tight">
        {label} <br/> {sub}
      </div>
    </div>
  );
}