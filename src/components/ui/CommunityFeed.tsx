"use client";

import { motion } from "framer-motion";
import { MessageSquare, TreePine, TrendingUp, Plus, MapPin } from "lucide-react";
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
  const { state, dispatch } = useApp();

  const allReports = [...state.reports, ...MOCK_REPORTS];

  const filtered =
    activeFilter === "all"
      ? allReports
      : allReports.filter((r) => r.heatLevel === activeFilter);

  const handleOpenReportModal = () => {
    // Spatial linking: Open the map and the modal
    dispatch({ type: "SET_VIEW", payload: "map" });
    
    // Use global user location if available, else fallback to default
    const coords = state.userLocation || [30.998043, -6.755833];
    dispatch({ 
      type: "OPEN_TREE_MODAL", 
      payload: { coords, district: "Field Observation" } 
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-obsidian-950/20">
      {/* Header section */}
      <div className="p-4 lg:p-6 border-b border-white/[0.08] shrink-0 bg-white/[0.02] shadow-2xl relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <MessageSquare size={16} className="text-emerald-400" />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Global Field Feed</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_#10b98120]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">
              Live Feed Active
            </span>
          </div>
        </div>

        {/* Global Stats bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-white/40 bg-white/[0.03] px-3.5 py-2 rounded-[1rem] border border-white/5 uppercase tracking-widest">
            <TrendingUp size={13} className="text-emerald-400" />
            <span>{allReports.reduce((s, r) => s + r.upvotes, 0)} Engagement</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-white/40 bg-white/[0.03] px-3.5 py-2 rounded-[1rem] border border-white/5 uppercase tracking-widest">
            <TreePine size={13} className="text-emerald-400" />
            <span>{allReports.length} Reports</span>
          </div>
        </div>

        {/* Action Button: Create New Report */}
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenReportModal}
            className="w-full mb-6 p-4 rounded-[1.5rem] bg-gradient-to-r from-emerald-600 to-emerald-500 border border-white/20 flex items-center justify-center gap-3 shadow-xl hover:shadow-emerald-500/20 transition-all group"
        >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 group-hover:bg-white/30 transition-colors">
                <Plus size={18} className="text-white" />
            </div>
            <div className="flex flex-col items-start">
                <span className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-1">Report Spatial Issue</span>
                <span className="text-[9px] font-bold text-white/60 tracking-tight uppercase">Automatically Geolocation Synchronized</span>
            </div>
            <MapPin size={16} className="ml-auto text-white/40" />
        </motion.button>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border shrink-0 ${
                activeFilter === f.value
                  ? f.value === "critical"
                    ? "bg-red-500/20 border-red-500/40 text-red-400"
                    : f.value === "moderate"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                    : f.value === "healthy"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-white/10 border-white/30 text-white"
                  : "bg-transparent text-white/30 border-transparent hover:border-white/10 hover:text-white/60 hover:bg-white/[0.02]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed list area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar pb-32 lg:pb-6 relative bg-black/10">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
                <MessageSquare size={32} className="text-white/5" />
            </div>
            <p className="text-[12px] font-black text-white/20 uppercase tracking-[0.3em]">No Spatial Data Found in Segment</p>
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