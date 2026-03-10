"use client";

import React from "react";
import { motion } from "framer-motion";

const GlobalHUDFx: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[80] overflow-hidden">
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.03]" />
      
      {/* Frame Brackets */}
      {/* Top Left */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-white/10" />
      {/* Top Right */}
      <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-white/10" />
      {/* Bottom Left */}
      <div className="absolute bottom-16 left-8 w-12 h-12 border-b-2 border-l-2 border-white/10" />
      {/* Bottom Right */}
      <div className="absolute bottom-16 right-8 w-12 h-12 border-b-2 border-r-2 border-white/10" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:40px_40px]" />
      
      {/* Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Lateral Data Stream */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-10 opacity-20 hidden lg:flex">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-1 h-32 bg-white/5 rounded-full relative overflow-hidden">
              <motion.div
                animate={{ height: ["0%", "100%", "0%"] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 right-0 bg-white/20"
              />
            </div>
            <span className="text-[7px] font-mono text-white/40 tracking-widest rotate-90 my-8">
              DATA_LINK_S{i}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobalHUDFx;
