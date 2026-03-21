'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  CheckCircle2, 
  Cpu, 
  Search, 
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Zap,
  Shield,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface ModelInfo {
  name: string;
  id: string;
  description: string;
  displayName: string;
}

export default function ModelDiscoveryPage() {
  const { activeModel, setActiveModel } = useAppStore();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchModels() {
      try {
        const resp = await fetch('/api/models');
        if (!resp.ok) throw new Error('Satellite Link Failure');
        const data = await resp.json();
        setModels(data.models || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, []);

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background HUD elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:40px_40px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-500/60 hover:text-emerald-400 text-xs font-black uppercase tracking-[0.2em] transition-colors mb-8 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 italic bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/20">
                Neural Link Discovery
              </h1>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                Protocol: <span className="text-emerald-500/80">Model Calibration & Swap</span>
              </p>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-[10px] text-slate-500 font-mono uppercase">Current Active Satellite</div>
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black">
                {activeModel}
              </div>
            </div>
          </div>
        </header>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Available Links', val: models.length, icon: Database, color: 'text-blue-400' },
            { label: 'Sync Status', val: 'Operational', icon: Shield, color: 'text-emerald-400' },
            { label: 'Latency', val: 'Low-Tier', icon: Clock, color: 'text-amber-400' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon size={16} className={stat.color} />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className="text-xl font-black">{stat.val}</div>
            </div>
          ))}
        </div>

        {/* Search & Feedback */}
        <div className="mb-8 flex gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-500" size={18} />
            <input 
              type="text" 
              placeholder="Search available models (e.g., 2.0-flash, pro)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Models List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-3xl">
            <Zap className="text-emerald-500 animate-pulse mb-4" size={32} />
            <p className="text-[10px] font-mono text-slate-500 uppercase animate-pulse">Scanning Satellite Array...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-1">Satellite Link Failure</h3>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 rounded-full text-xs font-black uppercase tracking-widest transition-all">Retry Link</button>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <p className="text-slate-500 font-mono text-xs uppercase italic">No matching neural links found in sector</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {filteredModels.map((m) => {
                const isActive = activeModel === m.name;
                return (
                  <motion.button
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 8 }}
                    onClick={() => setActiveModel(m.name)}
                    className={`flex items-center text-left p-5 rounded-3xl transition-all border group relative overflow-hidden ${
                      isActive 
                        ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20' 
                        : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                    }`}
                  >
                    {/* Active Gradient Glow */}
                    {isActive && (
                      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    )}

                    <div className={`p-3 rounded-2xl mr-5 transition-colors ${
                      isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500 group-hover:text-emerald-400'
                    }`}>
                      <Cpu size={24} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {m.displayName || m.name}
                        </h3>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/30">
                            <CheckCircle2 size={8} /> Primary Link
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed max-w-xl">
                        {m.description || 'General neural-environmental monitoring link.'}
                      </p>
                    </div>

                    <div className={`px-4 transition-all ${isActive ? 'translate-x-0' : 'translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}>
                      <ChevronRight size={20} className={isActive ? 'text-emerald-400' : 'text-slate-600'} />
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <footer className="mt-20 pt-8 border-t border-white/5 text-center">
          <div className="inline-block px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
             <p className="text-[9px] text-slate-600 font-mono uppercase tracking-[0.3em]">
               Satellite Matrix Control Group | EU-CODE WEEK Hackathon
             </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
