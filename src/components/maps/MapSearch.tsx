"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { translations } from "@/lib/translations";
import axios from "axios";

// Using Nominatim (OpenStreetMap) for free Geocoding
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export const MapSearch = () => {
  const { state, dispatch } = useApp();
  const t = translations[state.language];
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setShowResults(true);
    try {
      const response = await axios.get(NOMINATIM_URL, {
        params: {
          q: query,
          format: "json",
          limit: 5,
          addressdetails: 1,
        },
        headers: {
            "Accept-Language": state.language === 'ar' ? 'ar' : state.language === 'fr' ? 'fr' : state.language === 'es' ? 'es' : 'en'
        }
      });
      setResults(response.data);
    } catch (error) {
      console.error("Geocoding error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: any) => {
    const coords: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    dispatch({ type: "SET_FOCUS_COORDS", payload: coords });
    setQuery(result.display_name.split(',')[0]);
    setShowResults(false);
    setResults([]);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-sm lg:max-w-md mx-auto pointer-events-auto">
      <form 
        onSubmit={handleSearch}
        className="relative group h-full"
      >
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-white/40 group-focus-within:text-emerald-400 transition-colors" />
          )}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) {
                setResults([]);
                setShowResults(false);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder={t.searchPlaceholder || "Search location..."}
          className="w-full bg-[#05080D]/60 backdrop-blur-3xl border border-white/10 rounded-2xl lg:rounded-3xl py-3 lg:py-4 pl-12 pr-12 text-[11px] lg:text-sm font-black text-white placeholder:text-white/20 placeholder:uppercase placeholder:tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all shadow-2xl"
        />

        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setShowResults(false); }}
            className="absolute inset-y-0 right-4 flex items-center text-white/20 hover:text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      <AnimatePresence>
        {showResults && query.trim() !== "" && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-3 bg-[#05080D]/95 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] z-[5000]"
          >
            {isLoading ? (
              <div className="p-10 text-center space-y-3">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto opacity-50" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 animate-pulse">{t.searching}</p>
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {results.map((res, i) => (
                  <button
                    key={res.place_id || i}
                    onClick={() => handleSelect(res)}
                    className="w-full flex items-start gap-4 p-5 hover:bg-emerald-500/5 transition-all border-b border-white/[0.03] last:border-none text-left group"
                  >
                    <div className="mt-1 p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-white/40 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5 overflow-hidden">
                      <span className="text-sm font-black text-white leading-tight uppercase tracking-tight truncate group-hover:text-emerald-400 transition-colors">
                        {res.display_name.split(',')[0]}
                      </span>
                      <span className="text-[9px] font-medium text-white/30 leading-normal line-clamp-2 uppercase tracking-wider group-hover:text-white/50 transition-colors">
                        {res.display_name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center space-y-2">
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2 border border-white/10">
                    <X className="w-4 h-4 text-white/20" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{t.noResults}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
