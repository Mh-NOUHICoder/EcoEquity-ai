"use client";

import { useEffect } from "react";
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
  const { state, dispatch } = useApp();
  const { activeView } = state;

  // Global Geolocation Sync on Mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation && !state.userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          dispatch({ type: "SET_USER_LOCATION", payload: [latitude, longitude] });
        },
        () => {
          // Fallback if needed, but we keep it null in state if failed
          console.log("Geolocation sync deferred.");
        },
        { enableHighAccuracy: true }
      );
    }
  }, [dispatch, state.userLocation]);

  const isMapView = activeView === "map";
  const isDashboard = activeView === "dashboard";
  const isAI = activeView === "ai";
  const isCommunity = activeView === "community";
  const isSentinelView = activeView === "sentinel";

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden relative bg-obsidian-950 text-white">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-obsidian-950 via-[#0d1f33] to-obsidian-950 pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-blue-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar - Component handles its own mobile/desktop behavior */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10 pt-16 lg:pt-0">
        <AnimatePresence mode="wait">
          {/* DASHBOARD */}
          {isDashboard && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="flex-1 overflow-hidden flex flex-col xl:flex-row"
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <DashboardView />
              </div>
              <div className="hidden xl:block w-96 shrink-0 border-l border-white/[0.06] overflow-hidden glass">
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
              className="flex-1 flex flex-col lg:flex-row overflow-hidden"
            >
              <div className="flex-1 relative min-h-[400px]">
                <EcoMap />
              </div>
              <div className="hidden xl:block w-96 shrink-0 border-l border-white/[0.06] overflow-hidden glass">
                <CommunityFeed />
              </div>
            </motion.div>
          )}

          {/* SENTINEL VIEW */}
          {isSentinelView && (
            <motion.div
              key="sentinel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="p-3 sm:p-5 lg:p-6 w-full h-full lg:flex lg:items-center lg:justify-center overflow-y-auto"
            >
                <div className="w-full max-w-[1600px] mx-auto min-h-[600px]">
                    <SentinelMap />
                </div>
            </motion.div>
          )}

          {/* AI INSIGHTS */}
          {isAI && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col lg:flex-row overflow-hidden"
            >
              <div className="flex-1 relative min-h-[400px]">
                <EcoMap />
              </div>
              <div className="w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.06] overflow-hidden glass max-h-[50vh] lg:max-h-none">
                <AIInsightsPanel />
              </div>
            </motion.div>
          )}

          {/* COMMUNITY */}
          {isCommunity && (
            <motion.div
              key="community"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden"
            >
              <div className="h-full overflow-y-auto">
                <CommunityFeed />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <TreeRequestModal />
    </div>
  );
}