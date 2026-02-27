"use client";

import { motion } from "framer-motion";
import {
  Thermometer, TreePine, Users, AlertTriangle, Leaf, Globe, ArrowRight, Activity, Zap
} from "lucide-react";
import { NDVI_GEOJSON, CITY_AVG_NDVI } from "@/lib/data";
import { getColor, getHeatLevel } from "@/lib/ndvi";
import { useApp } from "@/context/AppContext";
import SentinelData from "./SentinelData";

export default function DashboardView() {
  const { dispatch } = useApp();
  const features = NDVI_GEOJSON.features;
  const criticalZones = features.filter((f) => f.properties.ndvi < 0.2);
  const healthyZones = features.filter((f) => f.properties.ndvi >= 0.4);
  const totalPop = features.reduce((s, f) => s + f.properties.population, 0);
  const totalTrees = features.reduce((s, f) => s + f.properties.treeCount, 0);
  const avgTemp = features.reduce((s, f) => s + f.properties.avgTemp, 0) / features.length;

  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" className="p-4 sm:p-6 space-y-6 max-w-full overflow-x-hidden pb-20 lg:pb-6">
      {/* Hero: GLOBAL OPERATIVE STATUS */}
      <motion.div variants={item} className="glass rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 relative overflow-hidden border border-white/10 shadow-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Global Eco-Intelligence HUD</p>
              </div>
              <h1 className="font-display text-3xl lg:text-5xl text-white font-black tracking-tighter leading-none">
                Command Overview
              </h1>
              <p className="text-sm text-white/40 max-w-lg leading-relaxed font-medium uppercase tracking-tight">
                Synthesizing real-time spectral data across <span className="text-white/80">{features.length} ACTIVE SECTORS</span>. 
                Satellite precision tracking enabled for <span className="text-white/80">{(totalPop / 1000).toFixed(0)}k Residents</span>.
              </p>
            </div>
            
            <div className="flex items-center gap-6 bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-6 lg:p-8 min-w-[200px]">
                <div className="flex flex-col">
                    <span className="text-3xl lg:text-5xl font-mono font-black text-amber-400 leading-none">
                        {CITY_AVG_NDVI.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-2">Avg Global NDVI</span>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="flex flex-col">
                    <Activity className="text-emerald-400 mb-1" size={18} />
                    <span className="text-xs font-black text-white uppercase tracking-tighter">Live Sync</span>
                </div>
            </div>
        </div>
      </motion.div>

      {/* Grid Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Thermometer size={18} />} label="Thermal Alerts" value={criticalZones.length.toString()} sub="Active Focus Areas" color="red" />
        <StatCard icon={<Zap size={18} />} label="Surface Energy" value={`${avgTemp.toFixed(1)}°C`} sub="Core Temperature" color="amber" />
        <StatCard icon={<TreePine size={18} />} label="Biosphere Count" value={totalTrees.toLocaleString()} sub="Vegetation Units" color="green" />
        <StatCard icon={<Globe size={18} />} label="Coverage" value="GLOBAL" sub="Satellite API v2.4" color="blue" />
      </motion.div>

      {/* Section: Sector Registry */}
      <motion.div variants={item} className="glass rounded-[2rem] overflow-hidden border border-white/10">
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-emerald-400" />
            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Active Sector Registry</h2>
          </div>
          <button onClick={() => dispatch({ type: "SET_VIEW", payload: "map" })} className="flex items-center gap-2 text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase">
            Deploy Tactical Map <ArrowRight size={14} />
          </button>
        </div>
        
        <div className="p-4 lg:p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
          {[...features]
            .sort((a, b) => a.properties.ndvi - b.properties.ndvi)
            .map((f, i) => {
              const { name, ndvi, avgTemp: temp } = f.properties;
              const color = getColor(ndvi);
              const level = getHeatLevel(ndvi);
              return (
                <div key={name} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5 group">
                  <span className="text-[10px] font-mono text-white/20 w-8 font-black">S_{(i + 1).toString().padStart(2, '0')}</span>
                  <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-black text-white uppercase tracking-tight">{name}</span>
                        <span className="text-[11px] font-black font-mono" style={{ color }}>{ndvi.toFixed(3)} NDVI</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${ndvi * 100}%` }} className="h-full rounded-full" style={{ backgroundColor: color }} />
                      </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                    level === "critical" ? "text-red-400 border-red-500/30 bg-red-400/5" :
                    level === "moderate" ? "text-amber-400 border-amber-500/30 bg-amber-400/5" : "text-emerald-400 border-emerald-500/30 bg-emerald-400/5"
                  }`}>
                    {level}
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: "red" | "green" | "blue" | "amber"; }) {
  const themes = { red: "text-red-400 bg-red-400/5", green: "text-emerald-400 bg-emerald-400/5", blue: "text-blue-400 bg-blue-400/5", amber: "text-amber-400 bg-amber-400/5" };
  return (
    <div className={`glass rounded-2xl p-6 border border-white/5 transition-all hover:scale-[1.02] shadow-xl`}>
      <div className={`mb-4 w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 ${themes[color]}`}>{icon}</div>
      <div className="text-4xl font-display font-black tracking-tighter text-white mb-1">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{label}</div>
      <div className="text-[10px] font-mono text-white/10 italic">{sub}</div>
    </div>
  );
}