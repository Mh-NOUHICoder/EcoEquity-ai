"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Map,
  Sparkles,
  MessageSquare,
  Leaf,
  Satellite,
  Bug,
  ShieldCheck,
  Zap,
  Globe,
  Clock,
  Terminal,
  Activity,
  Cpu,
  Server,
  Wifi,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ActiveView } from "@/types";
import { useState, useEffect, useMemo } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { t, i18n } = useTranslation();
  const isRTL = typeof i18n.dir === 'function' ? i18n.dir() === 'rtl' : i18n.language === 'ar';

  const navItems = useMemo(() => [
    { id: "dashboard" as ActiveView, label: t('dashboard'), icon: LayoutDashboard, desc: t('commandOverview') },
    { id: "map" as ActiveView, label: t('tacticalMap'), icon: Map, desc: t('thermalAlerts') },
    { id: "sentinel" as ActiveView, label: t('sentinelHub'), icon: Satellite, desc: t('loadingSentinelViewer') },
    { id: "ai" as ActiveView, label: t('neuralCore'), icon: Sparkles, desc: t('aiInsights') },
    { id: "community" as ActiveView, label: t('fieldFeed'), icon: MessageSquare, desc: t('fieldObservation') },
  ], [t]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [time, setTime] = useState("");

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* --- Premium Ultra-Modern Mobile Header --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-24 bg-[#05080D]/90 backdrop-blur-3xl border-b border-white/[0.08] flex items-center justify-between px-6 z-[200] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {/* BIGGER CLEAN LOGO */}
        <div 
          className="relative w-56 h-12 flex items-center group cursor-pointer" 
          onClick={() => dispatch({ type: "SET_VIEW", payload: "dashboard" })}
        >
            <div className="absolute -inset-2 bg-emerald-500/10 blur-2xl rounded-full opacity-50 group-active:opacity-100 transition-opacity" />
            <Image 
                src="/ecoequity-ai.png" 
                alt="EcoEquity AI" 
                fill 
                className="object-contain object-left relative z-10 transition-transform active:scale-95" 
                priority 
            />
        </div>
        
        {/* Language Selection - MOBILE ACCESSIBLE */}
        <LanguageSwitcher className="ml-auto mr-4" />

        {/* Aerospace Menu Toggle */}
        <button 
            onClick={toggleMobileMenu}
            className="relative w-14 h-14 flex items-center justify-center rounded-[1.25rem] bg-white/[0.03] border border-white/10 overflow-hidden group active:scale-90 transition-all duration-300"
        >
            <div className={`absolute inset-0 bg-gradient-to-tr transition-opacity duration-500 ${isMobileMenuOpen ? 'from-emerald-500/30' : 'from-emerald-500/10'} opacity-100`} />
            <div className="flex flex-col gap-2 items-center relative z-10">
                <motion.span 
                    animate={isMobileMenuOpen ? { rotate: 45, y: 10, width: 28 } : { rotate: 0, y: 0, width: 24 }}
                    className="h-[2px] bg-white rounded-full transition-all"
                />
                <motion.span 
                    animate={isMobileMenuOpen ? { opacity: 0, x: 20 } : { opacity: 1, x: 0, width: 14 }}
                    className="h-[2px] bg-emerald-400 rounded-full transition-all"
                />
                <motion.span 
                    animate={isMobileMenuOpen ? { rotate: -45, y: -10, width: 28 } : { rotate: 0, y: 0, width: 20 }}
                    className="h-[2px] bg-white rounded-full transition-all"
                />
            </div>
        </button>
      </div>

      {/* --- INFINTY DRAWER / SURPRISE Menu Opening --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Immersive Glass Overlay */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-[24px] z-[201] lg:hidden"
            />
            
            {/* The "Modern as F***" Drawer */}
            <motion.aside
                initial={{ x: isRTL ? "100%" : "-100%", opacity: 0, scale: 1.1 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: isRTL ? "100%" : "-100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 30, stiffness: 200, mass: 1 }}
                className={`fixed inset-y-0 ${isRTL ? "right-0 border-l" : "left-0 border-r"} w-[85%] max-w-[400px] bg-[#05080D]/95 border-white/10 z-[202] flex flex-col overflow-hidden`}
            >
                {/* Drawer Interior Decoration */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/[0.03] blur-[100px] rounded-full pointer-events-none" />
                
                {/* Header Stats Meta */}
                <div className="p-8 pb-4 border-b border-white/[0.04] relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">{t('systemTime')}</span>
                            <span className="text-xl font-mono font-black text-white/90 tabular-nums">{time}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">{t('telemetry')}</span>
                            <div className="flex items-center gap-1.5 justify-end">
                                <Activity size={10} className="text-emerald-400 animate-pulse" />
                                <span className="text-xs font-mono font-bold text-emerald-400/80 tracking-tighter uppercase">{t('activeOps')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Staggered Navigation */}
                <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
                    {navItems.map((item, idx) => {
                        const isActive = state.activeView === item.id;
                        const Icon = item.icon;
                        return (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, x: isRTL ? 40 : -40, rotateX: -45 }}
                                animate={{ opacity: 1, x: 0, rotateX: 0 }}
                                transition={{ delay: idx * 0.08 + 0.2, type: "spring" }}
                                onClick={() => {
                                    dispatch({ type: "SET_VIEW", payload: item.id });
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`
                                    w-full flex items-center justify-between p-5 rounded-[2rem] transition-all duration-500 group relative overflow-hidden
                                    ${isActive 
                                        ? "bg-white/[0.08] border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.4)]" 
                                        : "hover:bg-white/[0.04] border border-transparent"}
                                `}
                            >
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'bg-white/5 border border-white/5'}`}>
                                        <Icon size={24} className={isActive ? "text-emerald-400" : "text-white/40 group-hover:text-white/80"} />
                                    </div>
                                    <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
                                        <span className={`text-[12px] font-black tracking-[0.2em] uppercase transition-colors ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`}>
                                            {item.label}
                                        </span>
                                        <span className="text-[10px] font-bold text-white/20 tracking-tight uppercase group-hover:text-white/30 transition-colors">
                                            {item.desc}
                                        </span>
                                    </div>
                                </div>
                                {isActive && (
                                    <motion.div layoutId="m_active_ind" className="w-1.5 h-10 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
                                )}
                            </motion.button>
                        );
                    })}
                </nav>

                {/* Footer UI Controls */}
                <div className="p-8 border-t border-white/[0.04] space-y-6 bg-black/40">
                    <div className="flex gap-4">
                        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-4 flex flex-col gap-2 relative group overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             <Terminal size={12} className="text-white/20" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t('coreLink')}</span>
                             <span className="text-xs font-mono font-bold text-white/90 uppercase">{t('stableOps')}</span>
                        </div>
                        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-4 flex flex-col gap-2 relative group overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             <ShieldCheck size={12} className="text-white/20" />
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t('protocol')}</span>
                             <span className="text-xs font-mono font-bold text-white/90 uppercase">{t('encrypted')}</span>
                        </div>
                    </div>
                    
                    <Link 
                        href="/debug/sentinel"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-black text-emerald-400 tracking-[0.3em] uppercase transition-all active:scale-95 active:bg-emerald-500/20 shadow-[0_10px_30px_rgba(16,185,129,0.1)]"
                    >
                        {t('initializeDebug')}
                    </Link>
                </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- Desktop Fixed Sidebar (Preserved and Polished) --- */}
      <motion.aside
        initial={{ x: isRTL ? 100 : -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: isExpanded ? 320 : 96 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`hidden lg:flex h-full bg-[#05080D]/95 ${isRTL ? "border-l" : "border-r"} border-white/[0.08] flex-col relative z-[50] shrink-0`}
      >
        {/* Toggle Button */}
        <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`absolute ${isRTL ? "-left-4" : "-right-4"} top-10 w-8 h-8 flex items-center justify-center bg-[#05080D] border border-emerald-500/30 rounded-full z-[100] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 hover:scale-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] group`}
        >
            <motion.div
                key={isExpanded ? 'close' : 'open'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                {isExpanded ? <PanelLeftClose size={16} className={`group-active:scale-90 transition-transform ${isRTL && 'scale-x-[-1]'}`} /> : <PanelLeftOpen size={16} className={`group-active:scale-90 transition-transform ${isRTL && 'scale-x-[-1]'}`} />}
            </motion.div>
        </button>

        {/* Glow Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[600px] bg-emerald-500/[0.03] blur-[120px]" />
        </div>

        {/* Desktop Logo */}
        <div className={`p-4 py-8 flex items-center justify-center border-b border-white/[0.04] transition-all`}>
          <div className={`relative transition-all duration-500 flex justify-center ${isExpanded ? 'w-48 h-14' : 'w-12 h-12'} group hover:scale-105`}>
            <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {isExpanded ? (
                <Image 
                  src="/ecoequity-ai.png" 
                  alt="Logo" 
                  fill
                  className="object-contain object-left relative z-10"
                  priority
                />
            ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <Leaf size={24} className="text-emerald-400 relative z-10" />
                </div>
            )}
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className={`flex-1 space-y-3 overflow-y-auto mt-6 ${isExpanded ? 'px-6' : 'px-4'}`}>
          {navItems.map((item) => {
            const isActive = state.activeView === item.id;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => dispatch({ type: "SET_VIEW", payload: item.id })}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                whileHover={{ x: isExpanded ? 8 : 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} gap-4 p-2.5 rounded-[1.5rem] transition-all duration-300 group relative
                  ${isActive 
                    ? "bg-white/[0.08] border border-white/20 text-white shadow-[0_15px_30px_rgba(0,0,0,0.3)]" 
                    : "text-white/20 hover:text-white/80 border border-transparent hover:bg-white/[0.02]"}
                `}
              >
                {isActive && (
                  <motion.div layoutId="d_nav_act" className={`absolute ${isRTL ? "right-0 rounded-l-full" : "left-0 rounded-r-full"} w-1.5 h-10 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]`} />
                )}
                <div className={`p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.03] text-white/40 group-hover:text-white/60'} ${!isExpanded && 'mx-auto'}`}>
                    <Icon size={isExpanded ? 20 : 22} className="shrink-0" />
                </div>
                {isExpanded && (
                    <motion.div 
                        initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'} whitespace-nowrap overflow-hidden`}
                    >
                      <span className="text-[12px] font-black tracking-[0.15em]">{item.label}</span>
                      <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter truncate">{item.desc}</span>
                    </motion.div>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Desktop Footer (Real-time Meta) */}
        <div className={`p-4 transition-all duration-300 flex flex-col items-center ${isExpanded ? 'px-6' : 'px-4'} space-y-4 mb-6`}>
            {isExpanded && (
                <div className="w-full mb-2">
                    <DynamicTelemetry />
                </div>
            )}
            
            <Link 
                href="/debug/sentinel"
                className={`flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all group w-full ${isExpanded ? 'h-14' : 'h-14 w-14'}`}
            >
                <Bug size={isExpanded ? 16 : 20} className={`${isExpanded ? 'me-3' : ''} group-hover:rotate-12 transition-transform`} />
                {isExpanded && <span className="uppercase tracking-widest whitespace-nowrap">{t('systemDebug')}</span>}
            </Link>
        </div>
      </motion.aside>

      {/* --- Floating Desktop Language Switcher --- */}
      <div className={`hidden lg:block fixed top-6 ${isRTL ? 'left-6' : 'right-6'} z-[200]`}>
        <LanguageSwitcher variant="floating" />
      </div>
    </>
  );
}

function DynamicTelemetry() {
  const { state } = useApp();
  const { t } = useTranslation();

  const [metrics, setMetrics] = useState({
    ndvi: 0.312,
    nodes: 1284,
    load: 42,
    offset: 142.5,
    signal: 98
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ndvi: +(prev.ndvi + (Math.random() - 0.5) * 0.005).toFixed(3),
        nodes: prev.nodes + (Math.random() > 0.8 ? 1 : 0) - (Math.random() > 0.9 ? 1 : 0),
        load: Math.min(100, Math.max(10, prev.load + Math.floor((Math.random() - 0.5) * 10))),
        offset: +(prev.offset + 0.001).toFixed(3),
        signal: Math.min(100, Math.max(90, prev.signal + Math.floor((Math.random() - 0.5) * 2)))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-6 space-y-5 transition-all hover:border-emerald-500/20 group">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{t('liveTelemetry')}</span>
          </div>
          <div className="flex items-center gap-1.5">
              <Wifi size={10} className="text-emerald-400" />
              <span className="text-[9px] font-mono text-emerald-400/60 font-black">{metrics.signal}%</span>
          </div>
      </div>

      <div className="space-y-4">
          <StatusRow label={t('ndviIndex')} value={metrics.ndvi.toFixed(3)} color={metrics.ndvi < 0.2 ? "red" : metrics.ndvi < 0.4 ? "amber" : "green"} icon={<Activity size={12} />} />
          
          <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                    <Cpu size={10} className="text-white/20" />
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{t('neuralLoad')}</span>
                </div>
                <span className="text-[10px] font-mono font-black text-white/40">{metrics.load}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    animate={{ width: `${metrics.load}%` }}
                    className={`h-full rounded-full ${metrics.load > 80 ? 'bg-red-500/50' : 'bg-emerald-500/50'}`} 
                />
            </div>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">{t('fieldPings')}</span>
                  <span className="text-xs font-mono font-black text-white/60 tabular-nums">{metrics.nodes.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">{t('co2Offset')}</span>
                  <span className="text-xs font-mono font-black text-emerald-400 tabular-nums">+{metrics.offset}kg</span>
              </div>
          </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, color, icon }: { label: string; value: string | number; color: "red" | "amber" | "green" | "blue"; icon: React.ReactNode }) {
  const colors = { 
    red: "text-red-400 bg-red-400/5", 
    amber: "text-amber-400 bg-amber-400/5", 
    green: "text-emerald-400 bg-emerald-400/5",
    blue: "text-blue-400 bg-blue-400/5"
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
          <div className="text-white/20">{icon}</div>
          <span className="text-[11px] font-bold text-white/30 uppercase tracking-tight">{label}</span>
      </div>
      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black ${colors[color]}`}>{value}</span>
    </div>
  );
}