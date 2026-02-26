"use client";

import { motion } from "framer-motion";
import { MessageSquare, TreePine, TrendingUp } from "lucide-react";
import { useState } from "react";
import ReportCard from "@/components/ui/ReportCard";
import { MOCK_REPORTS } from "@/lib/data";
import { HeatLevel } from "@/types";
import { useApp } from "@/context/AppContext";

const filters: { label: string; value: HeatLevel | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "Moderate", value: "moderate" },
  { label: "Healthy", value: "healthy" },
];

export default function CommunityFeed() {
  const [activeFilter, setActiveFilter] = useState<HeatLevel | "all">("all");
  const { state } = useApp();

  const filtered =
    activeFilter === "all"
      ? MOCK_REPORTS
      : MOCK_REPORTS.filter((r) => r.heatLevel === activeFilter);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-white/40" />
            <h2 className="font-display text-sm text-white">Community Feed</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400/70">
              LIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/30">
            <TrendingUp size={11} className="text-emerald-400" />
            <span>{MOCK_REPORTS.reduce((s, r) => s + r.upvotes, 0)} total votes</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/30">
            <TreePine size={11} className="text-emerald-400" />
            <span>{state.submittedRequests + 127} tree requests</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                activeFilter === f.value
                  ? f.value === "critical"
                    ? "bg-red-500/15 border border-red-500/30 text-red-400"
                    : f.value === "moderate"
                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                    : f.value === "healthy"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : "bg-white/[0.08] border border-white/[0.12] text-white"
                  : "text-white/30 hover:text-white/50 border border-transparent hover:border-white/[0.06]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <MessageSquare size={20} className="text-white/10 mb-2" />
            <p className="text-sm text-white/25">No reports found</p>
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