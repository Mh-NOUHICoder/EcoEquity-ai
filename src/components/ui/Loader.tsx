"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface LoaderProps {
  isLoading?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ isLoading = true }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 0.5,
            filter: "blur(20px)",
            transition: { 
              duration: 0.8, 
              ease: [0.4, 0, 0.2, 1] 
            } 
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#05080D] overflow-hidden"
        >
          {/* 1. ATMOSPHERIC DEPTH (Enhanced) */}
          <div className="absolute inset-0 z-0">
             <motion.div 
               animate={{ 
                 scale: [1, 1.2, 1],
                 opacity: [0.03, 0.08, 0.03]
               }}
               transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-emerald-500/10 rounded-full blur-[160px]" 
             />
             <motion.div 
               animate={{ 
                 scale: [1.2, 1, 1.2],
                 opacity: [0.05, 0.02, 0.05]
               }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-blue-500/10 rounded-full blur-[120px]" 
             />
          </div>

          {/* 2. THE NEURAL CORE (Enhanced Favicon Animation) */}
          <div className="relative z-10">
             {/* Dynamic Energy Rings */}
             {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ 
                    rotate: { duration: 15 + i * 5, repeat: Infinity, ease: "linear" },
                    scale: { duration: 3, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" },
                    opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute inset-[-60px] rounded-full border border-white/5"
                  style={{ margin: i * -20 }}
                />
             ))}

             {/* The Favicon Core */}
             <motion.div
               animate={{ 
                 scale: [1, 1.08, 1],
                 rotate: [0, 5, -5, 0],
                 filter: [
                   "drop-shadow(0 0 20px rgba(16, 185, 129, 0.2))", 
                   "drop-shadow(0 0 40px rgba(34, 211, 238, 0.4))", 
                   "drop-shadow(0 0 20px rgba(16, 185, 129, 0.2))"
                 ]
               }}
               transition={{ 
                 duration: 4, 
                 repeat: Infinity, 
                 ease: "easeInOut" 
               }}
               className="w-24 h-24 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 flex items-center justify-center p-6 relative overflow-hidden group"
             >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 animate-pulse" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
                
                <Image
                  src="/favicon.ico"
                  alt="Neural Core"
                  width={56}
                  height={56}
                  className="relative z-10 drop-shadow-2xl"
                />

                {/* Scanning Light Effect */}
                <motion.div 
                  animate={{ top: ["-100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent -skew-y-12"
                />
             </motion.div>
          </div>

          {/* 3. MINIMAL TEXT */}
          <div className="mt-16 relative z-10 flex flex-col items-center">
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="flex flex-col items-center gap-3"
             >
                <h1 className="text-3xl font-black tracking-[0.2em] text-white uppercase italic">
                   ECO<span className="text-emerald-400">EQUITY</span>
                </h1>
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
                      Neural Uplink Active
                   </span>
                </div>
             </motion.div>
          </div>

          {/* 4. LOADING PROGRESS */}
          <div className="absolute bottom-20 w-full max-w-xs px-8">
             <div className="flex justify-between items-end mb-3">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Quantum Sequencing</span>
                <span className="text-[11px] font-mono font-black text-emerald-400 tracking-tighter">100% SYNC</span>
             </div>
             <div className="h-[1px] w-full bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  animate={{ left: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                />
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;
