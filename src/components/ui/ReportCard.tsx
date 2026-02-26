"use client";

import { motion } from "framer-motion";
import { ThumbsUp, MapPin } from "lucide-react";
import { useState } from "react";
import { CommunityReport, HeatLevel } from "@/types";
import { formatNDVI } from "@/lib/ndvi";

interface ReportCardProps {
  report: CommunityReport;
  index: number;
}

const heatConfig: Record<HeatLevel, { bg: string; dot: string; label: string }> = {
  critical: { bg: "heat-badge-critical", dot: "bg-red-400", label: "Critical Heat Zone" },
  moderate: { bg: "heat-badge-moderate", dot: "bg-amber-400", label: "Moderate Heat" },
  healthy: { bg: "heat-badge-healthy", dot: "bg-emerald-400", label: "Healthy Canopy" },
};

export default function ReportCard({ report, index }: ReportCardProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [votes, setVotes] = useState(report.upvotes);
  const config = heatConfig[report.heatLevel];

  const handleUpvote = () => {
    setUpvoted(!upvoted);
    setVotes((v) => (upvoted ? v - 1 : v + 1));
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className="glass-card glass-hover rounded-2xl p-4 group cursor-default"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 shrink-0">
            <div
              className={`absolute inset-0 rounded-full blur-sm opacity-60 ${
                report.heatLevel === "critical"
                  ? "bg-red-500"
                  : report.heatLevel === "moderate"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            <div className="relative w-9 h-9 rounded-full bg-obsidian-950 border border-white/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-white/80">
                {report.avatar}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-white/90">{report.author}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-white/30" />
              <span className="text-[11px] text-white/30">{report.district}</span>
            </div>
          </div>
        </div>

        <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium ${config.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${report.heatLevel === "critical" ? "animate-pulse" : ""}`} />
          {config.label}
        </div>
      </div>

      <p className="text-sm text-white/60 leading-relaxed mb-3 line-clamp-3">
        {report.message}
      </p>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
            NDVI
          </span>
          <span
            className={`text-[11px] font-mono font-medium ${
              report.heatLevel === "critical"
                ? "text-red-400"
                : report.heatLevel === "moderate"
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {formatNDVI(report.ndvi)}
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${report.ndvi * 100}%` }}
            transition={{ duration: 0.8, delay: index * 0.08 + 0.3, ease: "easeOut" }}
            className={`h-full rounded-full ${
              report.heatLevel === "critical"
                ? "ndvi-bar-critical"
                : report.heatLevel === "moderate"
                ? "ndvi-bar-moderate"
                : "ndvi-bar-healthy"
            }`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-white/30">{report.timestamp}</span>
        </div>
        <motion.button
          onClick={handleUpvote}
          whileTap={{ scale: 0.9 }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${
            upvoted
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.07]"
          }`}
        >
          <ThumbsUp size={11} className={upvoted ? "fill-emerald-400" : ""} />
          {votes}
        </motion.button>
      </div>
    </motion.article>
  );
}