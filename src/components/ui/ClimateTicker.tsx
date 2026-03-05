"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Shield, Zap, Globe, Cpu, Leaf } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/lib/translations";

const ClimateTicker: React.FC = () => {
  const { state } = useApp();
  const t = translations[state.language];
  const [logs, setLogs] = useState<string[]>([]);

  const environmentalLogs = [
    "SATELLITE LINK: SENTINEL-2B ACTIVE",
    "REFRESHING SPECTRAL INDICES...",
    "HEAT ANOMALY DETECTED IN SECTOR 07",
    "UPLINK STABLE: 42.8 GBPS",
    "PROCESSING VEGETATION DENSITY DATA",
    "CO2 SEQUESTRATION ESTIMATE: 142.5 KG/H",
    "ATMOSPHERIC TEMPERATURE: 34.2°C",
    "COMMUNITY HEAT REPORTS: 12 NEW ENTRIES",
    "OPTIMIZING LOCAL CANOPY DISTRIBUTION",
    "EQUITABLE RESOURCE ALLOCATION: 94.2%",
  ];

  useEffect(() => {
    setLogs([...environmentalLogs, ...environmentalLogs]);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] h-8 bg-black/90 backdrop-blur-xl border-t border-emerald-500/20 flex items-center overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center px-4 lg:px-6 gap-2 bg-emerald-500/10 h-full border-r border-emerald-500/30">
        <Leaf size={12} className="text-emerald-400 animate-pulse" />
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] whitespace-nowrap">
          {t.liveTelemetry}
        </span>
      </div>
      
      <div className="flex-1 relative overflow-hidden h-full flex items-center">
        <motion.div
          animate={{ x: [0, -2000] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-16 whitespace-nowrap pl-8"
        >
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
              <span className="text-[10px] font-mono text-white/50 tracking-wider font-bold">
                {log}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="hidden lg:flex items-center px-6 gap-8 h-full border-l border-white/5 bg-black/40">
        <div className="flex items-center gap-2">
          <Cpu size={12} className="text-cyan-400" />
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t.neuralLoad}:</span>
          <span className="text-[9px] font-mono font-black text-cyan-400">{(Math.random()*15 + 12).toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe size={12} className="text-emerald-400" />
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t.activeNodes}:</span>
          <span className="text-[9px] font-mono font-black text-emerald-400">1,248</span>
        </div>
      </div>
    </div>
  );
};

export default ClimateTicker;
