"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import {
  Thermometer, TreePine, Users, AlertTriangle, Leaf, Globe, ArrowRight, Activity, Zap, Info, Map as MapIcon, ChevronRight
} from "lucide-react";
import { NDVI_GEOJSON, CITY_AVG_NDVI } from "@/lib/data";
import { getColor, getHeatLevel } from "@/lib/ndvi";
import { useApp } from "@/context/AppContext";
import { translations } from "@/lib/translations";
import SentinelData from "./SentinelData";
import Tooltip from "./Tooltip";

export default function DashboardView() {
  const { state, dispatch } = useApp();
  const t = translations[state.language];
  const features = NDVI_GEOJSON.features;
  const criticalZones = features.filter((f) => f.properties.ndvi < 0.2);
  const totalPop = features.reduce((s, f) => s + f.properties.population, 0);
  const totalTrees = features.reduce((s, f) => s + f.properties.treeCount, 0);
  const avgTemp = features.reduce((s, f) => s + f.properties.avgTemp, 0) / features.length;

  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  const handleScrollToMap = () => {
    dispatch({ type: "SET_VIEW", payload: "map" });
    // In a real scenario, we might scroll to a specific section if they were on the same page.
    setTimeout(() => {
        const mapSection = document.getElementById('main-map-container');
        if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <motion.div initial="hidden" animate="show" className="p-4 sm:p-6 space-y-8 max-w-full overflow-x-hidden pb-20 lg:pb-10">
      
      {/* Hero: ENVIRONMENTAL OVERVIEW */}
      <motion.div variants={item} className="glass rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden border border-white/10 shadow-3xl bg-gradient-to-br from-emerald-500/5 to-transparent">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
                 <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em]">{t.globalEcoHUD}</p>
              </div>
              
              <div className="space-y-2">
                <h1 className="font-display text-4xl lg:text-6xl text-white font-black tracking-tighter leading-none">
                  {t.commandOverview}
                </h1>
                <p className="text-base text-white/70 max-w-xl leading-relaxed font-medium">
                  {t.synthesizingData} <span className="text-white font-bold">{features.length} {t.activeSectors}</span>. 
                  {t.satelliteTracking} <span className="text-white font-bold">{(totalPop / 1000).toFixed(0)}k {t.residents}</span>.
                </p>
              </div>

              {/* PRIMARY CTA - Focuses on community equity */}
              <button 
                onClick={handleScrollToMap}
                className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(16,185,129,0.3)] group"
              >
                <AlertTriangle size={18} className="animate-bounce" />
                {t.identifyPriorityZones}
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="flex flex-col items-end gap-4">
                <div className="flex items-center gap-8 bg-black/40 border border-white/10 rounded-[3rem] p-8 lg:p-10 shadow-2xl backdrop-blur-md">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{t.avgGlobalNDVI}</span>
                            <Tooltip id="ndvi-main-tip" content={t.ndviExplanation} />
                        </div>
                        <span className="text-5xl lg:text-7xl font-mono font-black text-emerald-400 leading-none">
                            {CITY_AVG_NDVI.toFixed(2)}
                        </span>
                    </div>
                    <div className="w-px h-16 bg-white/10" />
                    <div className="flex flex-col items-center">
                        <Activity className="text-emerald-400 mb-3" size={24} />
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{t.liveSync}</span>
                    </div>
                </div>
                <p className="text-[10px] font-mono text-white/20 italic pr-4 uppercase tracking-tighter">REF: ECO-SYNC-STABLE-v4.2</p>
            </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
            icon={<AlertTriangle size={20} />} 
            label={t.thermalAlerts} 
            value={criticalZones.length.toString()} 
            sub={t.activeFocusAreas} 
            color="red" 
            hasAlert={criticalZones.length > 0}
        />
        <StatCard 
            icon={<Thermometer size={20} />} 
            label={t.surfaceEnergy} 
            value={`${avgTemp.toFixed(1)}°C`} 
            sub={t.surfaceTempHelper} 
            color="amber" 
        />
        <StatCard 
            icon={<TreePine size={20} />} 
            label={t.biosphereCount} 
            value={totalTrees.toLocaleString()} 
            sub={t.vegetationUnits} 
            color="green" 
        />
        <StatCard 
            icon={<Globe size={20} />} 
            label={t.coverage} 
            value={t.global.toUpperCase()} 
            sub={t.satelliteLink} 
            color="blue" 
        />
      </motion.div>

      {/* Sector Registry */}
      <motion.div variants={item} className="glass rounded-[2.5rem] overflow-hidden border border-white/10 shadow-xl">
        <div className="px-10 py-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <Zap size={20} className="text-emerald-400" />
            <div className="space-y-0.5">
                <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t.sectorRegistry}</h2>
                <p className="text-[10px] text-white/40 font-medium uppercase">{t.satelliteFeed}</p>
            </div>
          </div>
          <button 
            onClick={() => dispatch({ type: "SET_VIEW", payload: "map" })} 
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black text-emerald-400 hover:bg-emerald-500 hover:text-obsidian-950 transition-all uppercase tracking-widest group"
          >
            <MapIcon size={16} />
            {t.deployMap}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="p-4 lg:p-8 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar bg-black/20">
          {[...features]
            .sort((a, b) => a.properties.ndvi - b.properties.ndvi)
            .map((f, i) => {
              const { name, ndvi, avgTemp: temp } = f.properties;
              const color = getColor(ndvi);
              const level = getHeatLevel(ndvi);
              return (
                <div 
                  key={name} 
                  onClick={() => {
                    dispatch({ type: "SELECT_FEATURE", payload: f });
                    dispatch({ type: "SET_VIEW", payload: "map" });
                  }}
                  className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-3xl hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/10 group cursor-pointer"
                >
                  <span className="hidden sm:block text-[11px] font-mono text-white/20 w-8 font-black">#{ (i + 1).toString().padStart(2, '0') }</span>
                  <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{name}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Spectral Integrity</span>
                                <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                                <span className="text-[10px] text-white/40 uppercase font-mono">{temp.toFixed(1)}°C</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-mono font-black tabular-nums" style={{ color }}>{ndvi.toFixed(3)}</span>
                                <Tooltip id={`ndvi-tip-${name}`} content={t.ndviExplanation} />
                            </div>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">NDVI Index</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden shadow-inner border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${ndvi * 100}%` }} 
                          className="h-full rounded-full" 
                          style={{ 
                            backgroundColor: color,
                            boxShadow: `0 0 15px ${color}44` 
                          }} 
                        />
                      </div>
                  </div>
                  <div className={`px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 min-w-[150px] justify-center ${
                    level === "critical" ? "text-red-400 border-red-500/30 bg-red-400/5" :
                    level === "moderate" ? "text-amber-400 border-amber-500/30 bg-amber-400/5" : "text-emerald-400 border-emerald-500/30 bg-emerald-400/5"
                  }`}>
                    {level === "critical" && <AlertTriangle size={12} className="animate-pulse" />}
                    {level === "critical" ? t.criticalRiskArea : level === "moderate" ? t.moderateStressZone : t.stableEcosystem}
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ 
    icon, label, value, sub, color, hasAlert = false 
}: { 
    icon: React.ReactNode; 
    label: string; 
    value: string; 
    sub: string; 
    color: "red" | "green" | "blue" | "amber";
    hasAlert?: boolean;
}) {
  const themes = { 
    red: "text-red-400 bg-red-400/5 border-red-500/20", 
    green: "text-emerald-400 bg-emerald-400/5 border-emerald-500/20", 
    blue: "text-blue-400 bg-blue-400/5 border-blue-500/20", 
    amber: "text-amber-400 bg-amber-400/5 border-amber-500/20" 
  };
  
  return (
    <div className={`glass rounded-3xl p-8 border border-white/5 transition-all hover:scale-[1.02] shadow-xl group relative overflow-hidden ${hasAlert ? 'ring-2 ring-red-500/20' : ''}`}>
       {hasAlert && (
         <div className="absolute top-0 right-0 p-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
         </div>
       )}
      <div className={`mb-6 w-12 h-12 rounded-2xl flex items-center justify-center border ${themes[color]} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="text-4xl lg:text-5xl font-display font-black tracking-tighter text-white mb-2 leading-none">{value}</div>
      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 group-hover:text-white/60 transition-colors">{label}</div>
      <div className="text-[10px] font-mono text-white/20 italic font-medium">{sub}</div>
    </div>
  );
}