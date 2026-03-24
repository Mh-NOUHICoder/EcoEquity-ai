"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Satellite, ShieldCheck, Activity, Globe, Wifi } from "lucide-react";

interface LoadingScreenProps {
  isLoading: boolean;
  message?: string;
}

const BOOT_LOGS = [
  { text: "INITIALIZING NEURAL CORE...", icon: Cpu },
  { text: "ESTABLISHING SATELLITE LINK...", icon: Satellite },
  { text: "SYNCHRONIZING ORBITAL DATA...", icon: Globe },
  { text: "CALIBRATING GEOSPATIAL ENGINE...", icon: Activity },
  { text: "VERIFYING ENCRYPTION PROTOCOLS...", icon: ShieldCheck },
  { text: "SYSTEMS ONLINE. READY.", icon: Wifi }
];

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const [logIndex, setLogIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    
    // Simulate fast boot logs
    const logInterval = setInterval(() => {
      setLogIndex((prev) => (prev < BOOT_LOGS.length - 1 ? prev + 1 : prev));
    }, 600);

    // Simulate progress bar 0 to 100
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.floor(Math.random() * 8) + 2; // jump by 2-10%
      });
    }, 150);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.05,
            filter: "blur(10px)",
            transition: { duration: 0.8, ease: "easeInOut" } 
          }}
          className="fixed inset-0 z-[9999] bg-[#02050A] overflow-hidden flex flex-col items-center justify-center font-mono select-none"
        >
          {/* Cyberpunk Grid & Vignette */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#02050A_100%)] opacity-90" />
          
          {/* Decorative Radar Sweep */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/10 rounded-full opacity-50 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] border border-emerald-500/20 rounded-full" />
            <div className="w-[200px] h-[200px] border border-emerald-500/30 rounded-full" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
              style={{ background: "conic-gradient(from 0deg, transparent 70%, rgba(16,185,129,0.1) 100%)" }}
            />
          </div>

          <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">
            {/* Hexagon Core Ring */}
            <div className="relative mb-12 flex items-center justify-center">
               <motion.div 
                 animate={{ rotate: -360 }}
                 transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                 className="absolute w-32 h-32 border-[2px] border-dashed border-emerald-500/40 rounded-full"
               />
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                 className="absolute w-24 h-24 border border-cyan-500/50 rounded-full border-t-cyan-400"
               />
               <div className="w-16 h-16 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/50 flex items-center justify-center rounded-xl shadow-[0_0_40px_rgba(16,185,129,0.4)] relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent -skew-y-12 animate-scan" />
                 <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="relative z-10 flex items-center justify-center">
                    <Image src="/favicon.ico" alt="Neural Core" width={36} height={36} className="drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                 </motion.div>
               </div>
            </div>

            {/* Title / Header */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black tracking-[0.5em] text-white uppercase mb-2 text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            >
              ECO<span className="text-emerald-400">EQUITY</span>
            </motion.h1>
            <p className="text-[9px] text-emerald-400/60 uppercase tracking-widest mb-12 font-bold">
              Autonomous Geospatial Intelligence
            </p>

            {/* Loading Bar Container */}
            <div className="w-full bg-[#05080D] border border-emerald-500/20 rounded-xl p-2 mb-6 backdrop-blur-sm relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
              <div className="flex items-center justify-between px-2 mb-2 relative z-10">
                <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest flex items-center gap-2">
                  <Activity size={12} /> System Boot Protocol
                </span>
                <span className="text-[10px] font-mono text-white tracking-widest font-black">
                  {Math.min(progress, 100)}%
                </span>
              </div>
              
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden relative z-10">
                <motion.div 
                  className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,1)] relative"
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ ease: "circOut" }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/50 blur-[2px]" />
                </motion.div>
              </div>
            </div>

            {/* Boot Sequence Log output */}
            <div className="w-full h-24 relative flex flex-col justify-end">
               <AnimatePresence mode="popLayout">
                 {BOOT_LOGS.slice(0, logIndex + 1).map((log, i) => {
                   const Icon = log.icon;
                   const isLast = i === logIndex;
                   return (
                     <motion.div
                       key={i}
                       layout
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: isLast ? 1 : 0.4, x: 0 }}
                       exit={{ opacity: 0 }}
                       transition={{ duration: 0.2 }}
                       className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-black mb-1.5"
                     >
                       <span className={`${isLast ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400/40'} w-1.5 h-1.5 shrink-0 rounded-full`} />
                       <span className={isLast ? 'text-white' : 'text-slate-500'}>
                         {log.text}
                       </span>
                     </motion.div>
                   );
                 })}
               </AnimatePresence>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
