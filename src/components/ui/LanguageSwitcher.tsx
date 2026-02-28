"use client";

import { useApp } from "@/context/AppContext";
import { Language } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const languages: { id: Language; label: string; flag: string }[] = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "ar", label: "العربية", flag: "🇸🇦" },
  { id: "es", label: "Español", flag: "🇪🇸" },
];

export default function LanguageSwitcher({ 
  className = "",
  variant = "default" 
}: { 
  className?: string;
  variant?: "default" | "floating";
}) {
  const { state, dispatch } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.id === state.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={
          variant === "floating"
            ? "flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#05080D]/70 backdrop-blur-[24px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-white/20 transition-all duration-300 group"
            : "flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all group"
        }
      >
        <div className={
          variant === "floating"
            ? "w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors shrink-0"
            : "w-5 h-5 xl:w-6 xl:h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors shrink-0"
        }>
          <Globe className={
            variant === "floating" 
              ? "w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" 
              : "w-3 h-3 xl:w-3.5 xl:h-3.5 text-emerald-400"
          } />
        </div>
        <span className={
          variant === "floating"
            ? "text-[10px] font-black font-mono text-white/90 uppercase tracking-widest mt-0.5"
            : "text-[10px] font-black text-white/70 uppercase tracking-widest hidden sm:block lg:hidden xl:block"
        }>
          {variant === "floating" ? currentLang.label : currentLang.id}
        </span>
        <ChevronDown className={`transition-transform duration-300 ${
          variant === "floating"
            ? "w-4 h-4 text-white/40 ml-1"
            : "w-3 h-3 text-white/30 hidden sm:block lg:hidden xl:block"
        } ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={
              variant === "floating"
                ? "absolute top-full mt-3 right-0 w-56 p-2.5 grid gap-1.5 rounded-[1.5rem] bg-[#05080D]/80 backdrop-blur-[32px] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] z-[500]"
                : "absolute top-full mt-2 right-0 w-44 bg-[#05080D]/95 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden z-[500]"
            }
          >
            {variant === "floating" ? (
              <>
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-emerald-400 font-black">
                    Select Language
                  </p>
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      dispatch({ type: "SET_LANGUAGE", payload: lang.id });
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      state.language === lang.id
                        ? "bg-emerald-500/20 border border-emerald-500/30"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{lang.flag}</span>
                      <span className={`text-[11px] font-bold uppercase tracking-wide mt-0.5 ${
                        state.language === lang.id ? "text-white" : "text-white/60"
                      }`}>
                        {lang.label}
                      </span>
                    </div>
                    {state.language === lang.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </>
            ) : (
              <div className="p-1.5 space-y-1">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      dispatch({ type: "SET_LANGUAGE", payload: lang.id });
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${
                      state.language === lang.id
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{lang.flag}</span>
                      <span className="text-[11px] font-bold uppercase tracking-tight">{lang.label}</span>
                    </div>
                    {state.language === lang.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
