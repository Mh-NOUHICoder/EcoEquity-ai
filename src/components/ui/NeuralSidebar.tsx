"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Cpu, BarChart3, ShieldAlert, 
  Activity, ArrowRight, X, Satellite 
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getColor } from "@/lib/ndvi";
import { useTranslation } from "react-i18next";

const NeuralSidebar: React.FC = () => {
  const { state, dispatch } = useApp();
  const { t, i18n } = useTranslation();
  const feature = state.selectedFeature;

  if (!feature) return null;

  const { name, ndvi, population, treeCount, avgTemp } = feature.properties;
  const color = getColor(ndvi);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: i18n.language === 'ar' ? -400 : 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: i18n.language === 'ar' ? -400 : 400, opacity: 0 }}
        className="fixed top-24 ltr:right-8 rtl:left-8 bottom-12 w-80 lg:w-96 z-[1001] bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Cpu size={14} className="text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{t('districtAnalysis')}</h3>
              <p className="text-sm font-black text-white uppercase tracking-tight">{name}</p>
            </div>
          </div>
          <button 
            onClick={() => dispatch({ type: "SELECT_FEATURE", payload: null })}
            className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-white/40" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Main Metric */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t('ndviIndex')}</span>
              <span className="text-xs font-mono font-black py-1 px-3 rounded-md border border-white/5" style={{ color }}>{ndvi.toFixed(4)}</span>
            </div>
            <div className="h-24 relative flex items-end gap-1">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.random() * 60 + 20}%` }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.05 }}
                  className="flex-1 rounded-t-sm"
                  style={{ backgroundColor: i / 20 < ndvi ? color : "rgba(255,255,255,0.05)" }}
                />
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-blue-400" />
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t('residents')}</span>
              </div>
              <div className="text-xl font-mono font-black text-white">{(population / 1000).toFixed(1)}k</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-amber-400" />
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t('surfaceEnergy')}</span>
              </div>
              <div className="text-xl font-mono font-black text-white">{avgTemp.toFixed(1)}°C</div>
            </div>
          </div>

          {/* AI Intelligence Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Satellite size={48} />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">{t('aiInsights')}</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-medium">
              {t('sector')} <span className="text-white font-black">{name}</span> {t('exhibits')} {ndvi < 0.3 ? t('criticalThermalRetention') : t('stableBiosyntheticOutput')}. 
              {t('priorityIntervention')}: {ndvi < 0.3 ? t('immediateReforestation') : t('maintainCanopy')}
            </p>
            <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
              {t('requestCanopy')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer Telemetry */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">{t('encryptionMessage').substring(0, 15)}...</span>
            <span className="text-[9px] font-mono text-white/40 italic uppercase">{t('stableOps')}</span>
          </div>
          <div className="h-6 w-12 rounded bg-black/40 border border-white/5 flex items-center justify-center">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1 h-3 bg-emerald-500/40 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NeuralSidebar;
