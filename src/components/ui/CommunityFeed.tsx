"use client";

import { motion } from "framer-motion";
import { MessageSquare, TreePine, TrendingUp, Plus, MapPin, Info } from "lucide-react";
import { useState } from "react";
import ReportCard from "@/components/ui/ReportCard";
import { MOCK_REPORTS } from "@/lib/data";
import { HeatLevel } from "@/types";
import { useApp } from "@/context/AppContext";
import { useTranslation } from "react-i18next";

export default function CommunityFeed() {
  const { state, dispatch } = useApp();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<HeatLevel | "all">("all");

  const localizedFilters: { label: string; value: HeatLevel | "all" }[] = [
    { label: t('all'), value: "all" },
    { label: t('criticalRiskArea') || "Critical", value: "critical" },
    { label: t('moderateStressZone') || "Moderate", value: "moderate" },
    { label: t('stableEcosystem') || "Healthy", value: "healthy" },
  ];

  const allReports = [...state.reports, ...MOCK_REPORTS];

  const filtered =
    activeFilter === "all"
      ? allReports
      : allReports.filter((r) => r.heatLevel === activeFilter);

  const handleOpenReportModal = () => {
    dispatch({ type: "SET_VIEW", payload: "map" });
    const coords = state.userLocation || [30.998043, -6.755833];
    dispatch({ 
      type: "OPEN_TREE_MODAL", 
      payload: { coords, district: "Field Observation" } 
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-obsidian-950/20">
      {/* Header section */}
      <div className="p-6 lg:p-8 border-b border-white/[0.08] shrink-0 bg-white/[0.02] shadow-2xl relative z-10">
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <MessageSquare size={18} className="text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-sm lg:text-base font-black text-white uppercase tracking-widest leading-none">{t('fieldFeed')}</h2>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{t('liveSync')}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* NEW DESCRIPTION */}
            <p className="text-[11px] lg:text-xs text-white/60 font-medium leading-relaxed max-w-xs">
                {t('communityReportsDescription')}
            </p>
        </div>

        {/* Global Stats bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-2 text-[9px] font-black text-white/60 bg-white/[0.03] px-4 py-2.5 rounded-2xl border border-white/5 uppercase tracking-widest shadow-lg">
            <TrendingUp size={12} className="text-emerald-400" />
            <span>{allReports.reduce((s, r) => s + r.upvotes, 0)} Engagement</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-white/60 bg-white/[0.03] px-4 py-2.5 rounded-2xl border border-white/5 uppercase tracking-widest shadow-lg">
            <TreePine size={12} className="text-emerald-400" />
            <span>{allReports.length} Reports</span>
          </div>
        </div>

        {/* Creative "Submit Report" Action Button */}
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenReportModal}
            className="w-full mb-8 relative p-1 rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent shadow-[0_20px_40px_rgba(0,0,0,0.5)] group overflow-hidden"
        >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
            
            <div className="relative h-full bg-[#05080D]/90 backdrop-blur-xl rounded-[1.85rem] border border-emerald-500/30 overflow-hidden flex items-center justify-between p-5 transition-colors group-hover:border-emerald-400/60">
                {/* Scanning Laser Line */}
                <motion.div 
                    initial={{ y: "-100%" }}
                    animate={{ y: "400%" }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent opacity-50 pointer-events-none"
                />

                <div className="flex items-center gap-4 relative z-10 w-full">
                    <div className="relative w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all overflow-hidden">
                        <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-[2px] border-dashed border-emerald-500/30 rounded-2xl scale-125"
                        />
                        <Plus size={22} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col items-start flex-1">
                        <span className="text-[12px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1 group-hover:text-emerald-300 transition-colors">
                            {t('submitRequest')}
                        </span>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                           <span className="text-[9px] font-mono font-bold text-white/50 tracking-widest uppercase">
                               AWAITING_FIELD_INTEL
                           </span>
                        </div>
                    </div>
                    
                    {/* Targeting Crosshair */}
                    <div className="relative w-8 h-8 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                        <div className="absolute inset-0 border border-emerald-500/40 rounded-full" />
                        <div className="absolute top-1/2 left-0 w-full h-px bg-emerald-500/40" />
                        <div className="absolute left-1/2 top-0 h-full w-px bg-emerald-500/40" />
                        <MapPin size={10} className="text-emerald-400 absolute" />
                    </div>
                </div>
            </div>
        </motion.button>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {localizedFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border shadow-md shrink-0 ${
                activeFilter === f.value
                  ? f.value === "critical"
                    ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    : f.value === "moderate"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                    : f.value === "healthy"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : "bg-white/10 border-white/20 text-white shadow-xl"
                  : "bg-transparent text-white/40 border-white/5 hover:border-white/20 hover:text-white/80 hover:bg-white/[0.04]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed list area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar pb-32 lg:pb-8 relative bg-black/20">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <div className="w-24 h-24 rounded-[3rem] bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-inner">
                <MessageSquare size={40} className="text-white/[0.03]" />
            </div>
            <p className="text-[12px] font-black text-white/20 uppercase tracking-[0.4em]">{t('selectLocation')}</p>
          </div>
        ) : (
          filtered.map((report, i) => (
            <ReportCard key={report.id} report={report} index={i} />
          ))
        )}
      </div>
    </div>
  );
}