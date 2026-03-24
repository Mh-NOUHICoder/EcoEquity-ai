'use client';

import Link from 'next/link';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Trash2, 
  Shield, 
  Activity, 
  ChevronUp, 
  ChevronDown, 
  Zap, 
  Target, 
  Cpu, 
  Compass,
  Radar,
  Radio,
  Settings,
  X,
  MessageSquare,
  Waves,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useLiveAgent } from '../agent/useLiveAgent';
import { useAppStore } from '../store/useAppStore';

// --- Constants for Premium HUD ---
const HUD_GLASS = `relative bg-[#05080D]/90 backdrop-blur-[40px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)]`;

export const AgentPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    heatGuardianMode, 
    toggleHeatGuardianMode, 
    agentStatus, 
    agentMessages, 
    clearMessages,
    userLocation,
    agentMuted,
    setAgentMuted,
    activeModel,
    setActiveModel
  } = useAppStore();

  const { sendMessage, isProcessing, error } = useLiveAgent();
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [agentMessages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;
    const text = inputText;
    setInputText('');
    await sendMessage(text);
  };

  const getAgentColor = () => {
    switch (agentStatus) {
        case 'alert': return '#ef4444';
        case 'processing': return '#38bdf8';
        case 'action': return '#fbbf24';
        case 'monitoring': return '#10b981';
        default: return '#64748b';
    }
  };

  const agentColor = getAgentColor();

  return (
    <div className="fixed bottom-10 ltr:right-4 rtl:left-4 z-[1200] flex flex-col items-end gap-3 pointer-events-none px-4">
      
      {/* HUB PANEL CONTENT */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="mb-4 w-[300px] md:w-[340px] bg-slate-950/95 backdrop-blur-3xl border border-emerald-500/20 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden pointer-events-auto flex flex-col relative"
          >
            {/* HUD Corner Accents */}
            <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-emerald-500/40 pointer-events-none" />
            <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-emerald-500/40 pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-emerald-500/40 pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-emerald-500/40 pointer-events-none" />

            {/* Cyber Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center relative overflow-hidden">
                    <Cpu size={18} className="text-emerald-500/60" />
                    <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-emerald-500/10" />
                </div>
                <div>
                   <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t('coreProtocol')}</h3>
                   <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-tighter">{t('syncActive')}</span>
                   </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content Swirl */}
            <div className="flex flex-col">
              {/* Telemetry Strip - Advanced Controls */}
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 relative">
                 <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => setAgentMuted(!agentMuted)}
                        className={`p-1.5 rounded-lg transition-all border ${agentMuted ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'}`}
                    >
                        {agentMuted ? (
                            <div className="flex items-center gap-1.5 px-0.5">
                                <VolumeX size={10} className="animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest">{t('mute')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-0.5">
                                <Volume2 size={10} className="animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest">{t('live')}</span>
                            </div>
                        )}
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <div className="relative group/model">
                        <button 
                            onClick={() => {
                                const el = document.getElementById('model-dropdown');
                                if (el) el.classList.toggle('hidden');
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-400 min-w-[110px]"
                        >
                            <Cpu size={11} className="text-emerald-500/60" />
                            {activeModel.split('-').slice(1, 3).join('-') || 'v1.5'}
                            <ChevronDown size={11} className="ml-auto opacity-40" />
                        </button>
                        
                        <div id="model-dropdown" className="hidden absolute top-full right-0 mt-2 w-52 bg-[#05080D]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[5000]">
                            <div className="p-2.5 border-b border-white/5 bg-white/5">
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] px-2">{t('selectNeuralCore')}</span>
                            </div>
                            <div className="p-1.5 flex flex-col gap-1">
                                {[
                                    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Preview)', sub: t('neuralFlagship') },
                                    { id: 'gemini-3-flash-preview', label: 'Gemini 3.0 Flash (Preview)', sub: t('extremeSpeed') },
                                    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', sub: t('balancedPower') },
                                    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', sub: t('deepLogic') },
                                    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', sub: t('standardLink') }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            setActiveModel(m.id);
                                            document.getElementById('model-dropdown')?.classList.add('hidden');
                                        }}
                                        className={`
                                            w-full flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-xl transition-all text-left group
                                            ${activeModel === m.id 
                                                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                                                : 'hover:bg-white/5 border border-transparent'}
                                        `}
                                    >
                                        <span className={`text-[12px] font-bold uppercase tracking-wider ${activeModel === m.id ? 'text-emerald-400' : 'text-white/60 group-hover:text-white'}`}>
                                            {m.label}
                                        </span>
                                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{m.sub}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Message Feed with Scanline Effect */}
              <div ref={scrollRef} className="h-[240px] overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar bg-black/60 relative select-text selection:bg-emerald-500/30">
                {/* Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                {error ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-red-950/20 border border-red-500/20 rounded-2xl">
                    <Radio size={24} className="text-red-500 animate-pulse mb-3" />
                    <p className="text-[9px] font-black uppercase text-red-500 tracking-[0.2em]">{t('commLinkFault')}</p>
                    <p className="text-[10px] text-red-400/60 mt-2 font-mono">{error}</p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => { clearMessages(); setIsOpen(false); }} className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-[8px] font-black text-red-400 border border-red-500/30 uppercase tracking-widest transition-all">{t('reInit')}</button>
                      <button 
                        onClick={() => useAppStore.getState().setActiveModel('gemini-1.5-flash')}
                        className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-[8px] font-black text-emerald-400 border border-emerald-500/30 uppercase tracking-widest transition-all flex items-center gap-1"
                      >
                        <Zap size={8} /> {t('recover')}: v1.5
                      </button>
                    </div>
                  </div>
                ) : agentMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 scale-90">
                    <Activity size={32} className="text-emerald-500 animate-pulse mb-3" />
                    <p className="text-xs uppercase font-black tracking-[0.5em] text-emerald-400">{t('environmentStandby')}</p>
                  </div>
                ) : (
                  agentMessages.map((msg) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[90%] px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed border ${msg.role === 'user' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium' : 'bg-white/5 text-slate-300 border-white/5 backdrop-blur-md'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[7px] font-mono text-white/10 uppercase mt-1 tracking-widest px-1">
                        [{msg.role === 'user' ? 'USER' : 'CORE'}]
                      </span>
                    </motion.div>
                  ))
                )}
                {isProcessing && (
                  <div className="flex gap-1.5 items-center pl-1">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}
              </div>

              {/* Input Dock - Integrated */}
              <div className="p-5 bg-emerald-950/10 border-t border-white/5 space-y-4">
                <div onClick={toggleHeatGuardianMode} className={`p-2.5 rounded-2xl border cursor-pointer transition-all ${heatGuardianMode ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <Shield size={12} className={heatGuardianMode ? 'text-red-500' : 'text-white/20'} />
                            <span className={`text-xs font-black uppercase tracking-widest ${heatGuardianMode ? 'text-red-400' : 'text-white/40'}`}>Heat Guardian</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${heatGuardianMode ? 'bg-red-500/40' : 'bg-white/10'}`}>
                            <motion.div animate={{ x: heatGuardianMode ? 16 : 0 }} className="w-3 h-3 bg-white rounded-full" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                   <div className="flex-1 bg-black/80 border border-white/5 rounded-2xl px-4 py-2 flex items-center focus-within:border-emerald-500/50 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all min-h-[48px] ring-offset-0 ring-0 outline-none group/input">
                      <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={t('neuralInput')}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder-white/20 resize-none h-6 scrollbar-none py-1 outline-none ring-0 focus:outline-none"
                      />
                      <button 
                        onClick={clearMessages} 
                        className="p-1.5 text-white/10 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Clear Data"
                      >
                        <Trash2 size={14} />
                      </button>
                   </div>
                   <button 
                    onClick={handleSend} 
                    disabled={isProcessing || !inputText.trim()} 
                    className="h-12 w-12 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-2xl flex items-center justify-center disabled:opacity-20 transition-all shrink-0 shadow-lg shadow-emerald-500/5 hover:scale-105 active:scale-95"
                   >
                    <Send size={18} />
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODERN AGENT TRIGGER: NEURAL PULSE */}
      <div className="relative pointer-events-auto group/pulse">
        {/* Glow Aura */}
        <div className={`absolute inset-0 bg-emerald-500/20 blur-[30px] rounded-full scale-150 transition-all duration-700 ${isOpen ? 'opacity-40 animate-pulse' : 'opacity-0'}`} />
        
        <motion.button 
          whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            relative z-10 w-20 h-20 rounded-[2rem] 
            flex flex-col items-center justify-center 
            transition-all duration-500 overflow-hidden
            ${HUD_GLASS} border-emerald-500/20 shadow-[0_20px_40px_rgba(0,0,0,0.8)]
            hover:border-emerald-500/50 hover:shadow-emerald-500/10
          `}
          style={{ borderColor: isOpen ? `${agentColor}cc` : '' }}
        >
          {/* Internal Neural Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-2 border-[0.5px] border-emerald-500/10 border-dashed rounded-[1.5rem] opacity-40 pointer-events-none"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="absolute inset-4 border-[0.5px] border-cyan-500/10 border-dashed rounded-[1rem] opacity-20 pointer-events-none"
          />

          {/* Central Core Icon */}
          <div className="relative z-20 flex items-center justify-center">
             <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div key="open" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <X size={26} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </motion.div>
                ) : (
                    <motion.div key="closed" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex flex-col items-center gap-1.5 translate-y-1">
                        <Cpu size={24} className={`transition-all duration-500 ${isProcessing ? 'text-emerald-400 animate-spin-slow' : 'text-white/60 group-hover/pulse:text-white'}`} />
                        <span className="text-[7px] font-black text-white/30 tracking-[0.3em] uppercase group-hover/pulse:text-emerald-400/60 transition-colors">Core</span>
                    </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* Activity Scanline */}
          <motion.div 
            animate={{ y: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none"
          />
        </motion.button>

        {/* Message Notifications Badge */}
        <AnimatePresence>
          {agentMessages.length > 0 && !isOpen && (
            <motion.div 
              initial={{ scale: 0, x: 10, y: -10 }}
              animate={{ scale: 1, x: 0, y: 0 }}
              exit={{ scale: 0 }}
              className="absolute -top-2 -right-2 z-30 w-7 h-7 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-1 ring-emerald-500/50"
            >
              <span className="text-[10px] font-black text-white leading-none tabular-nums">
                {agentMessages.length}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Indicator Pulse */}
        <div className="absolute -bottom-1 -left-1 z-30 flex items-center gap-2 pointer-events-none">
            <div className={`w-3.5 h-3.5 rounded-full border-2 border-slate-950 shadow-lg ${agentStatus !== 'idle' ? 'animate-pulse' : 'opacity-40 grayscale'}`} style={{ backgroundColor: agentColor }} />
            {!isOpen && (
                <div className="bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 opacity-0 group-hover/pulse:opacity-100 transition-opacity translate-y-1">
                    <span className="text-[7px] font-bold text-white/60 uppercase tracking-widest">{t(agentStatus)}</span>
                </div>
            )}
        </div>
      </div>

    </div>
  );
};
