"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Waves, AlertTriangle, Camera, Cpu, MapPin, Zap } from 'lucide-react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';

interface VoiceAgentProps {
  onMapNavigate?: (lat: number, lng: number, zoom?: number, label?: string) => void;
  onHighlightZone?: (lat: number, lng: number, severity: string, reason: string) => void;
  getMapCanvas?: () => HTMLElement | null;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  onMapNavigate,
  onHighlightZone,
  getMapCanvas,
}) => {
  const {
    status,
    isListening,
    transcript,
    response,
    functionCalls,
    isProcessing,
    connect,
    disconnect,
    toggleListening,
    captureAndAnalyze,
    error,
  } = useGeminiLive();

  const [isOpen, setIsOpen] = useState(false);

  // Auto-connect when opened
  useEffect(() => {
    if (isOpen && status === 'disconnected') {
      connect();
    }
  }, [isOpen, status, connect]);

  // Handle function calls from the agent
  useEffect(() => {
    if (!functionCalls.length) return;
    for (const fc of functionCalls) {
      if (fc.name === 'move_map_to_location' && onMapNavigate) {
        onMapNavigate(fc.args.lat, fc.args.lng, fc.args.zoom, fc.args.label);
      }
      if (fc.name === 'highlight_risk_zone' && onHighlightZone) {
        onHighlightZone(fc.args.lat, fc.args.lng, fc.args.severity, fc.args.reason);
      }
    }
  }, [functionCalls, onMapNavigate, onHighlightZone]);

  const handleCapture = useCallback(async () => {
    if (!getMapCanvas) return;
    const element = getMapCanvas();
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        logging: false,
        backgroundColor: '#010408',
      });
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      captureAndAnalyze(imageBase64);
    } catch (err) {
      console.error('Failed to capture map:', err);
    }
  }, [getMapCanvas, captureAndAnalyze]);

  const statusColor = (({
    connected: 'bg-emerald-500',
    connecting: 'bg-yellow-400',
    disconnected: 'bg-slate-500',
    error: 'bg-red-500',
  } as Record<string, string>)[status]) || 'bg-slate-500';

  const statusLabel = (({
    connected: 'ONLINE',
    connecting: 'INITIALIZING',
    disconnected: 'OFFLINE',
    error: 'ERROR',
  } as Record<string, string>)[status]) || 'OFFLINE';

  return (
    <div className="fixed bottom-10 right-10 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="mb-4 w-[340px] bg-slate-950/95 backdrop-blur-2xl border border-emerald-500/20 rounded-2xl shadow-[0_0_80px_rgba(16,185,129,0.12)] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-emerald-500/10 flex justify-between items-center bg-gradient-to-r from-emerald-950/40 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className={cn('w-2 h-2 rounded-full', statusColor)} />
                  {status === 'connected' && (
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-60" />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 block">
                    EcoEquity Agent
                  </span>
                  <span className="text-[9px] text-emerald-600 uppercase tracking-widest">{statusLabel}</span>
                </div>
              </div>
              <button
                onClick={() => { setIsOpen(false); disconnect(); }}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col items-center gap-5">
              {status === 'connecting' ? (
                <div className="flex flex-col items-center gap-4 py-10">
                  <div className="relative">
                    <div className="w-14 h-14 border-2 border-emerald-500/20 rounded-full" />
                    <div className="absolute inset-0 w-14 h-14 border-2 border-t-emerald-500 rounded-full animate-spin" />
                    <Cpu size={20} className="absolute inset-0 m-auto text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-emerald-400 font-medium">Initializing Vertex AI</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">gemini-1.5-flash · us-central1</p>
                  </div>
                  <button
                    onClick={() => { disconnect(); connect(); }}
                    className="text-[10px] text-emerald-600 hover:text-emerald-400 underline mt-2 transition-colors"
                  >
                    Reset connection
                  </button>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center px-3">
                  <AlertTriangle size={28} className="text-red-500" />
                  <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                  <button
                    onClick={() => { disconnect(); connect(); }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400 border border-red-500/20 transition-colors"
                  >
                    Reinitialize Agent
                  </button>
                </div>
              ) : (
                <>
                  {/* Mic Button with Pulse */}
                  <div className="relative flex items-center justify-center">
                    <AnimatePresence>
                      {(isListening || isProcessing) && (
                        <>
                          <motion.div
                            initial={{ scale: 1, opacity: 0.4 }}
                            animate={{ scale: 1.6, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                            className="absolute w-20 h-20 rounded-full bg-emerald-500/20"
                          />
                          <motion.div
                            initial={{ scale: 1, opacity: 0.3 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.8, delay: 0.4, ease: 'easeOut' }}
                            className="absolute w-20 h-20 rounded-full bg-emerald-500/10"
                          />
                        </>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={toggleListening}
                      disabled={status !== 'connected' || isProcessing}
                      className={cn(
                        'relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50',
                        isListening
                          ? 'bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-800/80 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50'
                      )}
                    >
                      {isProcessing ? (
                        <Cpu size={28} className="animate-pulse text-emerald-400" />
                      ) : isListening ? (
                        <Mic size={28} />
                      ) : (
                        <MicOff size={28} />
                      )}
                    </button>
                  </div>

                  {/* Canvas Capture Button */}
                  {getMapCanvas && (
                    <button
                      onClick={handleCapture}
                      disabled={isProcessing || status !== 'connected'}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 transition-colors disabled:opacity-40"
                    >
                      <Camera size={13} />
                      Analyze Current Map View
                    </button>
                  )}

                  {/* Conversation Area */}
                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
                      <Waves size={12} className="text-emerald-500" />
                      <span>Live Analysis Feed</span>
                    </div>

                    <div className="min-h-[80px] max-h-[120px] overflow-y-auto space-y-2 pr-1">
                      {transcript && (
                        <div className="flex gap-2 items-start">
                          <span className="text-[9px] font-bold text-slate-500 mt-0.5 shrink-0 uppercase">You</span>
                          <p className="text-[11px] text-slate-400 italic leading-relaxed">{transcript}</p>
                        </div>
                      )}

                      {isProcessing && !response && (
                        <div className="flex gap-2 items-center">
                          <span className="text-[9px] font-bold text-emerald-500 shrink-0 uppercase">AI</span>
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <div
                                key={i}
                                className="w-1 h-1 rounded-full bg-emerald-500/60 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {response && (
                        <div className="flex gap-2 items-start">
                          <span className="text-[9px] font-bold text-emerald-400 mt-0.5 shrink-0 uppercase">AI</span>
                          <p className="text-[11px] text-slate-200 leading-relaxed">{response}</p>
                        </div>
                      )}

                      {!transcript && !response && !isProcessing && (
                        <p className="text-[11px] italic text-slate-600">
                          {isListening
                            ? 'Speak now — analyzing environmental data...'
                            : 'Click the mic to speak. Ask about heat risks, NDVI, or locations.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Function Calls / Agent Actions */}
                  {functionCalls.length > 0 && (
                    <div className="w-full space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
                        <Zap size={11} className="text-yellow-500" />
                        <span>Agent Actions</span>
                      </div>
                      {functionCalls.map((fc, i) => (
                        <div key={i} className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-3 py-2">
                          <MapPin size={11} className="text-yellow-500 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-yellow-400">{fc.name.replace(/_/g, ' ')}</p>
                            <p className="text-[9px] text-slate-500">
                              {Object.entries(fc.args).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Prompt Chips */}
                  {!isListening && !response && !isProcessing && (
                    <div className="w-full flex flex-wrap gap-1.5">
                      <span className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5 block w-full">Try asking</span>
                      {['Heat risk here', 'Analyze NDVI', 'Navigate Tangier', 'Equity gaps'].map(chip => (
                        <span
                          key={chip}
                          className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded-md text-[10px] text-slate-400 cursor-default"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 flex justify-between items-center border-t border-emerald-500/10 bg-emerald-950/20">
              <span className="text-[9px] text-emerald-700 uppercase tracking-widest">Vertex AI · Gemini 1.5</span>
              <span className="text-[9px] text-emerald-700 uppercase tracking-widest">Google Cloud</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(o => !o)}
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 relative',
          isOpen
            ? 'bg-slate-900 border border-emerald-500/50 text-emerald-500'
            : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
        )}
      >
        {isOpen ? (
          <X size={26} />
        ) : (
          <>
            <Waves size={26} />
            {status === 'connected' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
            )}
          </>
        )}
      </motion.button>
    </div>
  );
};
