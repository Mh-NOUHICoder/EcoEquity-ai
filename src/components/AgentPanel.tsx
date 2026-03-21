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

      {/* MODERN AGENT BUTTON (Unified Telemetry Trigger) */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto h-20 w-64 bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center p-3 gap-4 group transition-all duration-500 hover:border-emerald-500/30 overflow-hidden"
        style={{ borderColor: isOpen ? `${agentColor}88` : '' }}
      >
        {/* Glowing Indicator Visual */}
        <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors relative overflow-hidden">
                {isOpen ? <MessageSquare size={24} className="text-white animate-pulse" /> : <Radar size={24} className="text-white/40 group-hover:text-white transition-colors animate-pulse" />}
                
                {agentMuted && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-950/20 backdrop-blur-[1px]">
                        <VolumeX size={16} className="text-red-500/60" />
                    </div>
                )}

                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }} className="absolute inset-0 border-[0.5px] border-white/5 rounded-2xl" />
            </div>
            {agentStatus !== 'idle' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 animate-pulse shadow-lg" style={{ backgroundColor: agentColor }} />
            )}
        </div>

        {/* Unified Telemetry Feed */}
        <div className="flex flex-col text-left overflow-hidden">
            <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Eco-Equity</span>
                <div className={`w-1.5 h-1.5 rounded-full ${agentStatus === 'idle' ? 'bg-white/10' : 'bg-emerald-500 animate-pulse'}`} />
            </div>
            <div className="flex flex-col mt-0.5">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] truncate">
                   CORE-{activeModel.split('-')[1] || 'v1.5'}
                </span>
                <AnimatePresence mode="wait">
                    <motion.span 
                        key={agentMessages.length}
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mt-0.5"
                    >
                        LINK_TX: {agentMessages.length.toString().padStart(2, '0')}
                    </motion.span>
                </AnimatePresence>
            </div>
        </div>

        {/* Dynamic Activity Waves */}
        <div className="ml-auto pr-2 flex items-end gap-0.5 h-4 opacity-20 group-hover:opacity-60 transition-opacity">
            {[1, 2, 3, 4].map(i => (
                <motion.div 
                    key={i} 
                    animate={{ height: isProcessing ? [4, 16, 4] : [4, 6, 4] }} 
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} 
                    className="w-0.5 bg-emerald-400 rounded-full" 
                />
            ))}
        </div>
      </motion.button>

    </div>
  );
};
