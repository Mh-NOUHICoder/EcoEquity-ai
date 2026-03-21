"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, Zap, Shield, Cpu, Binary } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'neural';
  message: string;
  module: string;
}

export const LiveAgentTerminal: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const modules = ['NEURAL_CORE', 'SATELLITE_LINK', 'GEO_ANALYTICS', 'RISK_ENGINE', 'EQUITY_TRACKER'];
    const initialLogs: LogEntry[] = [
      {
        id: '0',
        timestamp: new Date().toLocaleTimeString(),
        type: 'neural',
        message: 'EcoEquity Agent Intelligence Synchronized.',
        module: 'CORE'
      },
      {
        id: '1',
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        message: 'Establishing live connection to Sentinel-Hub...',
        module: 'SATELLITE'
      }
    ];
    setLogs(initialLogs);

    const interval = setInterval(() => {
      const randomModule = modules[Math.floor(Math.random() * modules.length)];
      const eventTypes: LogEntry['type'][] = ['info', 'info', 'success', 'neural', 'neural'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const messages = [
        'Scanning sector NDVI gradients...',
        'Surface energy anomaly detected in residential grid.',
        'Thermal distribution model updated.',
        'Biosphere integrity check: 98.4%',
        'Cross-referencing equity gaps with population density.',
        'Updating local heat-risk probability mapping.',
        'Synchronizing community field reports.',
        'Optimizing reforestation priority list.',
        'Cloud cover interference within acceptable threshold.',
        'Neural weights recalibrated for localized urban analysis.'
      ];
      
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: randomType,
        message: messages[Math.floor(Math.random() * messages.length)],
        module: randomModule
      };

      setLogs(prev => [...prev.slice(-19), newLog]);
    }, 4000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={`fixed bottom-0 left-0 z-50 transition-all duration-500 ease-in-out ${isExpanded ? 'w-full px-4 mb-4' : 'w-72 ml-4 mb-4'}`}>
      <div className="bg-slate-950/80 backdrop-blur-xl border border-emerald-500/20 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-2 border-b border-emerald-500/10 flex items-center justify-between bg-emerald-950/20 cursor-pointer hover:bg-emerald-950/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Agent Telemetry Feed</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Console Body */}
        <div 
          ref={scrollRef}
          className={`px-3 py-1 font-mono text-[9px] overflow-y-auto custom-scrollbar transition-all duration-300 ${isExpanded ? 'max-h-60' : 'max-h-32'}`}
        >
          <div className="space-y-1.5 py-2">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2 items-start group">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span className={`font-bold shrink-0 ${
                  log.type === 'neural' ? 'text-purple-400' : 
                  log.type === 'success' ? 'text-emerald-400' : 
                  'text-cyan-400'
                }`}>
                  {log.module}:
                </span>
                <span className="text-slate-300 group-hover:text-white transition-colors">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {isExpanded && (
          <div className="px-3 py-1.5 border-t border-emerald-500/10 bg-slate-900/40 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <Shield size={10} className="text-emerald-500" />
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Secure Link</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Binary size={10} className="text-blue-500" />
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">ECC Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                        animate={{ x: ['-100%', '100%'] }} 
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="h-full w-1/2 bg-emerald-500/40" 
                    />
                </div>
                <span className="text-[8px] text-emerald-600 font-bold uppercase">Processing</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
