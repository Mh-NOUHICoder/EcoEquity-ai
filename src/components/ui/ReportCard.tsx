"use client";

import { motion } from "framer-motion";
import { ThumbsUp, MapPin, SearchCode, ArrowUpRight, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { CommunityReport, HeatLevel } from "@/types";
import { formatNDVI, getColor } from "@/lib/ndvi";
import { useApp } from "@/context/AppContext";

interface ReportCardProps {
  report: CommunityReport;
  index: number;
}

const heatConfig: Record<HeatLevel, { bg: string; dot: string; label: string; glow: string }> = {
  critical: { bg: "bg-red-500/10 border-red-500/20 text-red-400", dot: "bg-red-400", label: "Critical Risk Area", glow: "shadow-[0_0_15px_rgba(239,68,68,0.3)]" },
  moderate: { bg: "bg-amber-500/10 border-amber-500/20 text-amber-400", dot: "bg-amber-400", label: "Moderate Stress Zone", glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]" },
  healthy: { bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", dot: "bg-emerald-400", label: "Stable Ecosystem", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]" },
};

export default function ReportCard({ report, index }: ReportCardProps) {
  const { dispatch } = useApp();
  const [upvoted, setUpvoted] = useState(false);
  const [votes, setVotes] = useState(report.upvotes);
  const config = heatConfig[report.heatLevel];

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
      initial={{ opacity: 0, x: -20, rotateY: 10 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ duration: 0.6, delay: index * 0.05, type: "spring" }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={handleViewOnMap}
      className="glass rounded-[1.75rem] border border-white/10 p-5 group cursor-pointer relative overflow-hidden active:scale-95 transition-all shadow-xl bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/30"
    >
      {/* Decorative Spatial Grid Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] blur-3xl rounded-full pointer-events-none" />

      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 shrink-0">
            <div className={`absolute inset-0 rounded-2xl blur-md opacity-30 ${report.heatLevel === "critical" ? "bg-red-500" : report.heatLevel === "moderate" ? "bg-amber-500" : "bg-emerald-500"}`} />
            <div className="relative w-12 h-12 rounded-[1rem] bg-obsidian-900 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-emerald-500/30 transition-colors">
              <span className="text-[11px] font-black text-white/90 uppercase tracking-widest">{report.avatar}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-white tracking-tight uppercase">{report.author}</h4>
            <div className="flex items-center gap-1.5 opacity-40">
              <MapPin size={10} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">{report.district}</span>
            </div>
          </div>
        </div>

        <div className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${config.bg} ${config.glow}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${report.heatLevel === "critical" ? "animate-pulse" : ""}`} />
          {config.label}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.04] mb-5 group-hover:bg-white/[0.05] transition-colors relative overflow-hidden">
        {report.heatLevel === 'critical' && <ShieldAlert size={14} className="absolute top-3 right-3 text-red-500/30" />}
        <p className="text-[13px] text-white/70 leading-relaxed font-medium">
          &quot;{report.message}&quot;
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Environmental Index</span>
                <span className="text-[11px] font-mono font-black" style={{ color: getColor(report.ndvi) }}>
                    NDVI {report.ndvi.toFixed(3)}
                </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${report.ndvi * 100}%` }}
                    transition={{ duration: 1.2, delay: index * 0.1 + 0.4 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: getColor(report.ndvi), boxShadow: `0 0 10px ${getColor(report.ndvi)}40` }}
                />
            </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{report.timestamp}</span>
             <div className="w-1 h-1 rounded-full bg-white/10" />
             <motion.button 
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAnalyze}
                className="flex items-center gap-2 text-emerald-400/60 hover:text-emerald-400 transition-colors bg-emerald-400/5 px-3 py-1.5 rounded-lg border border-emerald-400/10 hover:border-emerald-400/30 shadow-lg"
             >
                <SearchCode size={13} />
                <span className="text-[10px] font-black uppercase tracking-tighter">Analyze Spatial Data</span>
             </motion.button>
        </div>
        
        <div className="flex items-center gap-2">
            <motion.button
                onClick={handleUpvote}
                whileTap={{ scale: 0.9 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                    upvoted
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-white/[0.04] border-white/5 text-white/30 hover:text-white/80 hover:bg-white/[0.08]"
                }`}
            >
                <ThumbsUp size={12} className={upvoted ? "fill-emerald-400" : ""} />
                {votes}
            </motion.button>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={16} />
            </div>
        </div>
      </div>
    </motion.article>
  );
}