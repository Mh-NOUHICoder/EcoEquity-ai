"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, TreePine, MapPin, User, Mail, FileText, CheckCircle2, Sprout, ShieldCheck, Crosshair, Cpu } from "lucide-react";
import { useState, FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import { submitTreeRequest } from "@/lib/supabase/supabase";
import { useTranslation } from "react-i18next";

const SCAN_LINE = "absolute left-0 w-full h-px bg-emerald-500/30 pointer-events-none";

export default function TreeRequestModal() {
  const { state, dispatch } = useApp();
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", reason: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const close = () => {
    dispatch({ type: "CLOSE_TREE_MODAL" });
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: "", email: "", reason: "" });
      setErrors({});
    }, 300);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = t('nameRequired');
    if (!form.email.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = t('invalidEmail');
    }
    if (!form.reason.trim() || form.reason.length < 10)
      newErrors.reason = t('reasonTooShort');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await submitTreeRequest({
        ...form,
        district: state.treeModalDistrict || "Global Sector",
        coordinates: state.treeModalCoords || [20.0, 0.0],
      });
      
      const newReport = {
        id: Math.random().toString(36).substr(2, 9),
        author: form.name || t('anonymousOperative'),
        avatar: (form.name || "A").charAt(0).toUpperCase(),
        district: state.treeModalDistrict || "Global Sector",
        message: form.reason,
        heatLevel: "moderate" as const, // Defaulting to moderate for new reports
        ndvi: 0.35,
        timestamp: "just now",
        upvotes: 0,
        coordinates: state.treeModalCoords || [20.0, 0.0],
      };

      dispatch({ type: "ADD_REPORT", payload: newReport });
      dispatch({ type: "INCREMENT_REQUESTS" });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Communication link failed. Retry protocol." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {state.showTreeModal && (
        <>
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9998]"
          />

          {/* Centered Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg pointer-events-auto"
            >
              <div className="relative bg-[#05080D]/95 border border-emerald-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)] backdrop-blur-3xl">
                
                {/* Cyberpunk Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
                
                {/* Top Gloss Header */}
                <div className="relative p-6 lg:p-8 border-b border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent">
                  <div className="absolute top-0 left-0 w-1/3 h-[2px] bg-gradient-to-r from-emerald-400 to-transparent" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-2xl bg-[#05080D] border border-emerald-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] overflow-hidden">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border border-emerald-500/30 rounded-full scale-110 border-dashed" />
                        <Sprout size={24} className="text-emerald-400 z-10" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <Cpu size={10} className="text-emerald-400" />
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em]">Neural Uplink Secure</span>
                        </div>
                        <h2 className="text-lg lg:text-xl font-black text-white uppercase tracking-tighter">
                          {t('requestCanopy')}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                           <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                             {t('district')}: {state.treeModalDistrict || "Global_Unassigned"}
                           </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={close}
                      className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all active:scale-90 group"
                    >
                      <X size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>
                </div>

                <div className="p-6 lg:p-8 relative">
                  <motion.div animate={{ y: ["0%", "400%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className={SCAN_LINE} />
                  
                  <AnimatePresence mode="wait">
                    {submitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-10 text-center"
                      >
                        <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                           <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                           <CheckCircle2 size={48} className="text-emerald-400 relative z-10" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-3">
                          {t('protocolConfirmed')}
                        </h3>
                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 max-w-sm mb-8">
                            <p className="text-emerald-400/80 text-[11px] font-mono uppercase tracking-widest">
                                {t('uplinkMessage')}
                            </p>
                        </div>
                        <button
                          onClick={close}
                          className="w-full py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all"
                        >
                          {t('terminateLink')}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        {state.treeModalCoords && (
                          <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-[#05080D]/50 border border-emerald-500/30 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                                    <Crosshair size={18} className="text-emerald-400 animate-spin-slow" />
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[8px] font-black text-emerald-400/60 uppercase tracking-[0.3em] mb-1">{t('targetCoords')}</span>
                                   <span className="text-[13px] font-mono font-black text-emerald-400 tabular-nums">
                                     {state.treeModalCoords[0].toFixed(5)}°N <span className="text-white/20 mx-1">|</span> {state.treeModalCoords[1].toFixed(5)}°E
                                   </span>
                                </div>
                            </div>
                            <div className="relative z-10 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                Locked
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField icon={<User size={14} />} label={t('fullName')} error={errors.name}>
                              <input
                                type="text"
                                placeholder={t('anonymousPlaceholder')}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-transparent text-sm text-white placeholder-white/10 outline-none font-bold"
                              />
                            </FormField>
                            <FormField icon={<Mail size={14} />} label={t('communicationId')} error={errors.email}>
                              <input
                                type="email"
                                placeholder={t('emailPlaceholder')}
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-transparent text-sm text-white placeholder-white/10 outline-none font-bold"
                              />
                            </FormField>
                        </div>

                        <FormField icon={<FileText size={14} />} label={t('reason')} error={errors.reason}>
                          <textarea
                            placeholder={t('reasonPlaceholder')}
                            rows={3}
                            value={form.reason}
                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            className="w-full bg-transparent text-sm text-white placeholder-white/10 outline-none resize-none font-medium leading-relaxed"
                          />
                        </FormField>

                        <div className="flex items-center gap-3 px-5 py-4 border border-emerald-500/30 bg-emerald-500/10 rounded-2xl shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                           <ShieldCheck size={24} className="text-emerald-400 shrink-0" />
                           <p className="text-[10px] font-mono font-black text-emerald-400/80 uppercase tracking-widest leading-relaxed">
                             {t('encryptionMessage')}
                           </p>
                        </div>

                        {errors.submit && <p className="text-[11px] text-red-500 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-center font-black uppercase tracking-widest">{errors.submit}</p>}

                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full relative py-5 rounded-[1.75rem] border border-emerald-400/50 text-emerald-100 text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-[length:200%_auto] animate-gradient" />
                          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay" />
                          <div className="flex items-center justify-center gap-3 relative z-10">
                              {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <TreePine size={18} className="text-emerald-100" />
                              )}
                              <span>{loading ? t('transmitting') : t('submitRequest')}</span>
                          </div>
                        </motion.button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function FormField({ icon, label, error, children }: { icon: React.ReactNode; label: string; error?: string; children: React.ReactNode; }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
        <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20">
            {icon}
        </span>
        {label}
      </label>
      <div
        className={`px-5 py-4 rounded-[1.25rem] bg-[#05080D]/60 border transition-all duration-300 relative overflow-hidden group/input ${
          error ? "border-red-500/40 bg-red-500/5" : "border-emerald-500/20 focus-within:border-emerald-400 focus-within:bg-emerald-500/5 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
        }`}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-1/2 bg-emerald-400 opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
        {children}
      </div>
      {error && <p className="text-[10px] font-black text-red-500/90 uppercase tracking-widest mt-1 ml-2 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />{error}</p>}
    </div>
  );
}