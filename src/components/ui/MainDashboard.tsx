"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/ui/Sidebar";
import TreeRequestModal from "@/components/ui/TreeRequestModal";
import CommunityFeed from "@/components/ui/CommunityFeed";
import AIInsightsPanel from "@/components/ui/AIInsightsPanel";
import DashboardView from "@/components/ui/DashboardView";
import { useApp } from "@/context/AppContext";

// Dynamic import of the map (no SSR)
const EcoMap = dynamic(() => import("@/components/maps/EcoMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-obsidian-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-white/30 text-sm font-mono">Initializing map...</p>
      </div>
    </div>
  ),
});

const SentinelMap = dynamic(() => import("@/components/maps/SentinelMap"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 text-white">
            <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
            <p className="mt-3 text-slate-400 text-sm">Loading Sentinel Viewer...</p>
        </div>
    ),
});

export default function MainDashboard() {
  const { state } = useApp();
  const { activeView } = state;

  const isMapView = activeView === "map";
  const isDashboard = activeView === "dashboard";
  const isAI = activeView === "ai";
  const isCommunity = activeView === "community";
  const isSentinelView = activeView === "sentinel";

  return (
    <div className="flex h-screen w-screen overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-obsidian-950 via-[#0d1f33] to-obsidian-950 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-20 w-64 h-64 bg-blue-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          {/* DASHBOARD */}
          {isDashboard && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-hidden flex"
            >
              <div className="flex-1 overflow-y-auto">
                <DashboardView />
              </div>
              <div className="w-80 xl:w-96 shrink-0 border-l border-white/[0.06] overflow-hidden">
                <CommunityFeed />
              </div>
            </motion.div>
          )}

          {/* MAP VIEW */}
          {isMapView && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex overflow-hidden"
            >
              <div className="flex-1 relative">
                <EcoMap />
              </div>
              <div className="w-80 xl:w-96 shrink-0 border-l border-white/[0.06] overflow-hidden glass">
                <CommunityFeed />
              </div>
            </motion.div>
          )}

          {/* SENTINEL VIEW */}
          {isSentinelView && (
            <motion.div
              key="sentinel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 w-full"
            >
                <SentinelMap 
                    bbox={[13.08, 52.33, 13.76, 52.68]} // Berlin BBOX
                    datetime={(() => {
                      const end = new Date();
                      const start = new Date();
                      start.setMonth(end.getMonth() - 2); // default range: last 2 months
                      const fmt = (d: Date) => d.toISOString().split('.')[0] + 'Z';
                      return `${fmt(start)}/${fmt(end)}`;
                    })()}
                    collections={["sentinel-2-l2a"]}
                />
            </motion.div>
          )}

          {/* AI INSIGHTS */}
          {isAI && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex overflow-hidden"
            >
              <div className="flex-1 relative min-w-0">
                <EcoMap />
              </div>
              <div className="w-80 xl:w-96 shrink-0 border-l border-white/[0.06] overflow-hidden glass">
                <AIInsightsPanel />
              </div>
            </motion.div>
          )}

          {/* COMMUNITY */}
          {isCommunity && (
            <motion.div
              key="community"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-hidden"
            >
              <CommunityFeed />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Tree Request Modal (global) */}
      <TreeRequestModal />
    </div>
  );
}