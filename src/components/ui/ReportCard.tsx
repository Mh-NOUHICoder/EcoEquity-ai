"use client";

import { motion } from "framer-motion";
import { ThumbsUp, MapPin, SearchCode, ArrowUpRight, ShieldAlert, Thermometer, TreePine, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { CommunityReport, HeatLevel } from "@/types";
import { formatNDVI, getColor } from "@/lib/ndvi";
import { useApp } from "@/context/AppContext";
import { translations } from "@/lib/translations";
import Tooltip from "./Tooltip";

interface ReportCardProps {
  report: CommunityReport;
  index: number;
}

const heatStyles = {
  critical: {
    bg: "bg-red-500/10 border-red-500/20 text-red-400",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    icon: <ShieldAlert size={12} className="animate-pulse" />
  },
  moderate: {
    bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    icon: <AlertCircle size={12} />
  },
  healthy: {
    bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    icon: <CheckCircle2 size={12} />
  }
};

export default function ReportCard({ report, index }: ReportCardProps) {
  const { state, dispatch } = useApp();
  const t = translations[state.language];
  const [upvoted, setUpvoted] = useState(false);
  const [votes, setVotes] = useState(report.upvotes);

  const getHeatLabel = (level: HeatLevel) => {
    if (level === "critical") return t.criticalRiskArea;
    if (level === "moderate") return t.moderateStressZone;
    return t.stableEcosystem;
  };

  const style = heatStyles[report.heatLevel];
  const label = getHeatLabel(report.heatLevel);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvoted(!upvoted);
    setVotes((v) => (upvoted ? v - 1 : v + 1));
  };

  const handleViewOnMap = () => {
    dispatch({ type: "SET_FOCUS_COORDS", payload: report.coordinates });
    dispatch({ type: "SET_VIEW", payload: "map" });
  };

  const handleAnalyze = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "SET_FOCUS_COORDS", payload: report.coordinates });
    dispatch({ type: "SET_VIEW", payload: "sentinel" });
  };

  return (
    <motion.article
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={handleViewOnMap}
      className="glass rounded-[2rem] border border-white/10 p-6 group cursor-pointer relative overflow-hidden active:scale-95 transition-all shadow-xl bg-gradient-to-br from-white/[0.04] to-transparent hover:border-white/20"
    >
      {/* Decorative Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0">
            <div className={`absolute inset-0 rounded-[1.25rem] blur-xl opacity-20 ${report.heatLevel === "critical" ? "bg-red-500" : report.heatLevel === "moderate" ? "bg-amber-500" : "bg-emerald-500"}`} />
            <div className="relative w-14 h-14 rounded-[1.25rem] bg-obsidian-900 border border-white/10 flex items-center justify-center shadow-inner group-hover:border-emerald-500/30 transition-colors">
              <span className="text-[14px] font-black text-white/90 uppercase tracking-widest">{report.avatar || (report.author === "Anonymous Operative" ? t.anonymousOperative.charAt(0) : report.author.charAt(0))}</span>
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-[13px] font-black text-white tracking-widest uppercase transition-colors group-hover:text-emerald-400">
                {report.author === "Anonymous Operative" ? t.anonymousOperative : report.author}
            </h4>
            <div className="flex items-center gap-2 text-white/40">
              <MapPin size={10} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">{report.district}</span>
            </div>
          </div>
        </div>

        {/* Improved Label Badge (Icons for accessibility, not color alone) */}
        <div className={`shrink-0 flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border shadow-2xl ${style.bg} ${style.glow}`}>
          {style.icon}
          {label}
        </div>
      </div>

      {/* Message Body */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] mb-6 relative group-hover:bg-white/[0.04] transition-colors overflow-hidden">
        <p className="text-[13px] lg:text-[14px] text-white/70 leading-relaxed font-medium italic italic">
          &quot;{report.message}&quot;
        </p>
      </div>

      {/* Metrics Row */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{t.environmentalIndex}</span>
                <Tooltip id={`ndvi-report-tip-${report.id}`} content={t.ndviExplanation} />
            </div>
            <span className="text-[12px] font-mono font-black" style={{ color: getColor(report.ndvi) }}>
                NDVI {report.ndvi.toFixed(3)}
            </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5 shadow-inner">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${report.ndvi * 100}%` }}
                className="h-full rounded-full"
                style={{ backgroundColor: getColor(report.ndvi), boxShadow: `0 0 15px ${getColor(report.ndvi)}50` }}
            />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-5 border-t border-white/5">
        <div className="flex items-center gap-4">
             <span className="text-[10px] font-black text-white/20 uppercase tracking-widest tabular-nums">{report.timestamp}</span>
             <div className="w-1 h-1 rounded-full bg-white/10" />
             <motion.button 
                whileHover={{ scale: 1.05, x: 4 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAnalyze}
                className="flex items-center gap-2 text-emerald-400/60 hover:text-emerald-400 transition-colors bg-emerald-400/5 px-4 py-2 rounded-xl border border-emerald-400/10 hover:border-emerald-400/30 shadow-lg"
             >
                <SearchCode size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.analyzeSpatialData}</span>
             </motion.button>
        </div>
        
        <div className="flex items-center gap-3">
            <motion.button
                onClick={handleUpvote}
                whileTap={{ scale: 0.9 }}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border ${
                    upvoted
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "bg-white/[0.04] border-white/5 text-white/30 hover:text-white hover:bg-white/[0.08]"
                }`}
            >
                <ThumbsUp size={14} className={upvoted ? "fill-emerald-400" : ""} />
                {votes}
            </motion.button>
            <div className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/10 group-hover:text-white/40 transition-colors">
                <ArrowUpRight size={18} />
            </div>
        </div>
      </div>
    </motion.article>
  );
}