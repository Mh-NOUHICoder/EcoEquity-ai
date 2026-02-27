"use client";

import { useApp } from "@/context/AppContext";
import { MAP_THEMES } from "@/lib/mapThemes";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Map, Layers, Check } from "lucide-react";

export default function MapThemeSwitcher({ className, align = "left" }: { className?: string, align?: "left" | "right" }) {
  const { state, dispatch } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = MAP_THEMES.find((t) => t.id === state.mapTheme) || MAP_THEMES[0];

  return (
    <div className={className || "absolute top-6 left-6 z-[1000]"}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-3 px-5 py-3 rounded-2xl 
            bg-[#05080D]/70 backdrop-blur-[24px] 
            border border-white/10 
            shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]
            hover:border-white/20 transition-all duration-300 group
          `}
        >
          <Layers className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-black font-mono text-white/90 uppercase tracking-widest">
            {currentTheme.name}
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`
                absolute top-full ${align === "right" ? "right-0" : "left-0"} mt-3 w-64 p-2.5 grid gap-1.5 rounded-[1.5rem]
                bg-[#05080D]/80 backdrop-blur-[32px] 
                border border-white/10 
                shadow-[0_40px_80px_rgba(0,0,0,0.8)]
              `}
            >
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-400 font-black">
                  Select Terrain
                </p>
              </div>
              {MAP_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    dispatch({ type: "SET_MAP_THEME", payload: theme.id });
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    state.mapTheme === theme.id
                      ? "bg-cyan-500/20 border border-cyan-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                      state.mapTheme === theme.id 
                        ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" 
                        : "bg-white/10"
                    }`} />
                    <span className={`text-[12px] font-bold tracking-wide ${
                      state.mapTheme === theme.id ? "text-white" : "text-white/60"
                    }`}>
                      {theme.name}
                    </span>
                  </div>
                  {state.mapTheme === theme.id && (
                    <Check className="w-3.5 h-3.5 text-cyan-400" strokeWidth={3} />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
