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
import { getTreeRequests } from "@/lib/supabase/supabase";
import { CommunityReport } from "@/types";
import { useTranslation } from "react-i18next";

// Map Loader Component for Translated Load states
const MapLoader = ({ messageKey, color = "emerald" }: { messageKey: string; color?: "emerald" | "sky" }) => {
  const { t } = useTranslation();
  const colorClasses = color === "emerald" ? "border-emerald-500/30 border-t-emerald-400" : "border-sky-500/30 border-t-sky-400";
  const textClasses = color === "emerald" ? "text-white/30" : "text-slate-400";
  
  return (
    <div className={`w-full h-full flex items-center justify-center ${color === "emerald" ? "bg-obsidian-950" : "bg-slate-900"}`}>
      <div className="flex flex-col items-center gap-3">
        <div className={`w-8 h-8 border-2 rounded-full animate-spin ${colorClasses}`} />
        <p className={`text-sm font-mono tracking-widest uppercase ${textClasses}`}>{t(messageKey) || "Loading..."}</p>
      </div>
    </div>
  );
};

// Dynamic import of the map (no SSR)
const EcoMap = dynamic(() => import("@/components/maps/EcoMap"), {
  ssr: false,
  loading: () => <MapLoader messageKey="initializingSectorLink" color="emerald" />,
});

const SentinelMap = dynamic(() => import("@/components/maps/SentinelMap"), {
    ssr: false,
    loading: () => <MapLoader messageKey="loadingSentinelViewer" color="sky" />,
});

export default function MainDashboard() {
  const { state, dispatch } = useApp();
  const { activeView, language } = state;
  const { t } = useTranslation();

  // 1. Global Geolocation Sync
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation && !state.userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          dispatch({ type: "SET_USER_LOCATION", payload: [latitude, longitude] });
        },
        () => console.log("Geolocation deferred."),
        { enableHighAccuracy: true }
      );
    }
  }, [dispatch, state.userLocation]);

  // 2. Global Community Reports Fetch
  useEffect(() => {
    async function fetchReports() {
        try {
            const data = await getTreeRequests();
            const mapped: CommunityReport[] = (data || []).map((req: any) => ({
                id: req.id.toString(),
                author: req.name || t('anonymousOperative'),
                avatar: (req.name || (language === 'en' ? "A" : language === 'fr' ? "A" : language === 'es' ? "A" : "ع")).charAt(0).toUpperCase(),
                district: req.district || t('fieldObservation'),
                message: req.reason || "",
                heatLevel: "moderate" as const,
                ndvi: 0.35,
                timestamp: new Date(req.created_at).toLocaleDateString(language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: '2-digit' }),
                upvotes: 0,
                coordinates: [req.lat, req.lng],
            }));
            dispatch({ type: "SET_REPORTS", payload: mapped });
        } catch (err) {
            console.error("Failed to fetch community reports:", err);
        }
    }
    fetchReports();
  }, [dispatch, language, t]);

  const isMapView = activeView === "map";
  const isDashboard = activeView === "dashboard";
  const isAI = activeView === "ai";
  const isCommunity = activeView === "community";
  const isSentinelView = activeView === "sentinel";

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden relative bg-obsidian-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-obsidian-950 via-[#0d1f33] to-obsidian-950 pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      
      <Sidebar />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10 pt-16 lg:pt-0">
        <AnimatePresence mode="wait">
          {/* MAP-BASED VIEWS (Persistent Map instance) */}
          {(isMapView || isAI) && (
            <motion.div
              key="map-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full"
            >
              <div className="flex-1 relative min-h-[400px]">
                <EcoMap />
              </div>
              
              <motion.div 
                key={isAI ? "ai-panel" : "community-panel"}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.06] overflow-hidden glass max-h-[50vh] lg:max-h-none"
              >
                {isAI ? <AIInsightsPanel /> : <CommunityFeed />}
              </motion.div>
            </motion.div>
          )}

          {/* DASHBOARD VIEW */}
          {isDashboard && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 overflow-hidden flex flex-col xl:flex-row h-full"
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <DashboardView />
              </div>
              <div className="hidden xl:block w-96 shrink-0 border-l border-white/[0.06] overflow-hidden glass">
                <CommunityFeed />
              </div>
            </motion.div>
          )}

          {/* SENTINEL HUB */}
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

          {/* FIELD FEED / COMMUNITY VIEW (Dedicated) */}
          {isCommunity && (
            <motion.div
              key="community"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden h-full"
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