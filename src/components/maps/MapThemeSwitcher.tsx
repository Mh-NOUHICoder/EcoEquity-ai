"use client";

import { useApp } from "@/context/AppContext";
import { MAP_THEMES } from "@/lib/mapThemes";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Map, Layers, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MapThemeSwitcher({ className, align = "left", direction = "down", showText = true }: { 
  className?: string, 
  align?: "left" | "right",
  direction?: "up" | "down",
  showText?: boolean
}) {
  const { state, dispatch } = useApp();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = MAP_THEMES.find((t) => t.id === state.mapTheme) || MAP_THEMES[0];

  return (
    <div className={className || "absolute top-6 left-6 z-[1000]"}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center ${showText ? 'gap-4 px-6' : 'px-4'} py-4 rounded-3xl bg-[#05080D]/40 backdrop-blur-[40px] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.02)] hover:border-white/20 transition-all duration-500 group`}
      >
        <div className="relative">
          <Layers className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform relative z-10" />
          <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {showText && (
          <span className="text-[10px] font-black font-mono text-white/50 group-hover:text-white uppercase tracking-[0.3em] transition-colors">
            {t(`theme_${currentTheme.id}`) || currentTheme.name}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: direction === "up" ? -20 : 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === "up" ? -20 : 20, scale: 0.95 }}
            className={`
              absolute ${direction === "up" ? "bottom-full mb-4" : "top-full mt-4"} 
              ${align === "right" ? "right-0" : "left-0"} w-72 p-3 grid gap-2 rounded-[2.5rem]
              bg-[#05080D]/90 backdrop-blur-[60px] 
              border border-white/5 
              shadow-[0_60px_100px_rgba(0,0,0,0.9)]
              z-[6000]
            `}
          >
            <div className="px-3 py-2 border-b border-white/5 mb-1">
              <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-400 font-black">
                {t('selectTerrain')}
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
                    ? "bg-cyan-500/10 border border-cyan-500/20"
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
                    {t(`theme_${theme.id}`) || theme.name}
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
  );
}
