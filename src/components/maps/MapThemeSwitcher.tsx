"use client";

import { useApp } from "@/context/AppContext";
import { MAP_THEMES } from "@/lib/mapThemes";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Map, Layers, Check } from "lucide-react";

export default function MapThemeSwitcher() {
  const { state, dispatch } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = MAP_THEMES.find((t) => t.id === state.mapTheme) || MAP_THEMES[0];

  return (
    <div className="absolute top-6 left-6 z-[1000]">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-5 py-3 bg-obsidian-950/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-cyan-500/50 hover:bg-obsidian-900 transition-all group"
        >
          <Layers className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold font-mono text-white uppercase tracking-widest drop-shadow-md">
            {currentTheme.name}
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-3 w-64 bg-obsidian-950/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden p-2.5 grid gap-1.5"
            >
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-black">
                  Select Terrain Style
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
                      ? "bg-cyan-500/20 border border-cyan-500/40 shadow-inner"
                      : "hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-obsidian-950 transition-all ${
                      state.mapTheme === theme.id 
                        ? "bg-cyan-400 ring-cyan-400/50 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" 
                        : "bg-gray-700 ring-transparent"
                    }`} />
                    <span className={`text-[13px] font-bold tracking-wide transition-colors drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${
                      state.mapTheme === theme.id ? "text-white" : "text-gray-100"
                    }`}>
                      {theme.name}
                    </span>
                  </div>
                  {state.mapTheme === theme.id && (
                    <div className="bg-cyan-500/20 p-1 rounded-md">
                      <Check className="w-3.5 h-3.5 text-cyan-400" strokeWidth={3} />
                    </div>
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
