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
import { NDVI_GEOJSON, CITY_AVG_NDVI } from "@/lib/data";
import { getColor, getHeatLevel } from "@/lib/ndvi";
import { generateAIInsight } from "@/lib/gemini";
import { NDVIFeature } from "@/types";

export default function AIInsightsPanel() {
  const { state, dispatch } = useApp();

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
    const insight = await generateAIInsight(feature);
    dispatch({ type: "SET_AI_INSIGHT", payload: insight });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-emerald-400" />
          <h2 className="font-display text-sm text-white">AI Insights</h2>
          <span className="ml-auto text-[10px] font-mono text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
            GEMINI PRO
          </span>
        </div>
        <p className="text-[11px] text-white/30">
          Click a district to generate AI analysis
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Avg NDVI" value={avgNDVI.toFixed(2)} sub="city avg" color="amber" icon={<BarChart3 size={12} />} />
          <StatCard label="Hot Zones" value={criticalZones.length.toString()} sub="critical" color="red" icon={<AlertTriangle size={12} />} />
          <StatCard label="At Risk" value={`${(totalPopAtRisk / 1000).toFixed(0)}k`} sub="residents" color="red" icon={<Zap size={12} />} />
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
            <Sparkles size={12} className="text-emerald-400" />
            <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
              {state.selectedFeature ? state.selectedFeature.properties.name : "Select a District"}
            </span>
          </div>

          <div className="p-4 min-h-[100px]">
            <AnimatePresence mode="wait">
              {state.isLoadingInsight ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
                  {[100, 85, 92, 60].map((w, i) => (
                    <div key={i} className="h-3 rounded-full bg-white/[0.06] animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }} />
                  ))}
                </motion.div>
              ) : state.aiInsight ? (
                <motion.p key="insight" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-sm text-white/70 leading-relaxed">
                  {state.aiInsight}
                </motion.p>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-4 text-center">
                  <Sparkles size={20} className="text-white/10 mb-2" />
                  <p className="text-[12px] text-white/25">
                    Select a district to generate an AI environmental analysis
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2 px-1">
            Districts · Click to Analyze
          </p>
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
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isSelected ? "bg-white/[0.06] border border-white/[0.12]" : "hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm text-white/80 font-medium truncate">{name}</span>
                          <span className="text-[11px] font-mono shrink-0" style={{ color }}>{ndvi.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ndvi * 100}%`, backgroundColor: color, opacity: 0.7 }} />
                          </div>
                          <span className="text-[10px] font-mono text-white/30 shrink-0">{avgTemp}°C</span>
                          {diff < 0 && (
                            <span className="text-[10px] font-mono text-red-400/70 shrink-0">
                              <TrendingDown size={8} className="inline" /> {Math.abs(diff).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TreePine size={13} className="text-emerald-400" />
            <span className="text-[11px] font-mono text-white/40 uppercase tracking-wider">
              Equity Gap Analysis
            </span>
          </div>
          <div className="space-y-2">
            {NDVI_GEOJSON.features
              .filter((f) => f.properties.ndvi < 0.3)
              .sort((a, b) => a.properties.ndvi - b.properties.ndvi)
              .slice(0, 3)
              .map((f) => {
                const treesNeeded = Math.round((f.properties.population / 14 - f.properties.treeCount));
                return (
                  <div key={f.properties.name} className="flex items-center justify-between">
                    <span className="text-[12px] text-white/60">{f.properties.name}</span>
                    <span className="text-[11px] font-mono text-red-400">
                      +{treesNeeded > 0 ? treesNeeded.toLocaleString() : 0} trees needed
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: "red" | "amber" | "green";
  icon: React.ReactNode;
}) {
  const colors = {
    red: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-400",
      icon: "text-red-500/40",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-400",
      icon: "text-amber-500/40",
    },
    green: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      icon: "text-emerald-500/40",
    },
  }[color];

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-xl p-2.5 text-center`}
    >
      <div className={`${colors.icon} mb-1 flex justify-center`}>{icon}</div>
      <div className={`text-lg font-display font-bold ${colors.text}`}>
        {value}
      </div>
      <div className="text-[9px] font-mono text-white/30 uppercase leading-tight mt-0.5">
        {label}
        <br />
        {sub}
      </div>
    </div>
  );
}