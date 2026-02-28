"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, TreePine, MapPin, User, Mail, FileText, CheckCircle2, Sprout, ShieldCheck } from "lucide-react";
import { useState, FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import { translations } from "@/lib/translations";
import { submitTreeRequest } from "@/lib/supabase/supabase";

export default function TreeRequestModal() {
  const { state, dispatch } = useApp();
  const t = translations[state.language];
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
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Valid email required";
    if (!form.reason.trim() || form.reason.length < 10)
      newErrors.reason = "Please provide more detail (min 10 chars)";
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
        author: form.name || "Anonymous Operative",
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
              <div className="relative bg-[#0A0F1A]/90 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
                
                {/* Top Gloss Header */}
                <div className="relative p-6 lg:p-8 border-b border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <Sprout size={24} className="text-emerald-400" />
                      </div>
                      <div className="flex flex-col">
                        <h2 className="text-lg lg:text-xl font-black text-white uppercase tracking-tighter">
                          {t.requestCanopy}
                        </h2>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">
                             {t.district}: {state.treeModalDistrict || "Global_Unassigned"}
                           </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={close}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 lg:p-8">
                  <AnimatePresence mode="wait">
                    {submitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center py-10 text-center"
                      >
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                          <CheckCircle2 size={40} className="text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                          {t.protocolConfirmed}
                        </h3>
                        <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-8 font-medium">
                          {t.uplinkMessage}
                        </p>
                        <button
                          onClick={close}
                          className="w-full py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                        >
                          {t.terminateLink}
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
                          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                            <MapPin size={14} className="text-cyan-400" />
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{t.targetCoords}</span>
                               <span className="text-[11px] font-mono font-bold text-white/60">
                                 {state.treeModalCoords[0].toFixed(6)}°N // {state.treeModalCoords[1].toFixed(6)}°E
                               </span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField icon={<User size={14} />} label={t.fullName} error={errors.name}>
                              <input
                                type="text"
                                placeholder={t.anonymousPlaceholder}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-transparent text-sm text-white placeholder-white/10 outline-none font-bold"
                              />
                            </FormField>
                            <FormField icon={<Mail size={14} />} label={t.communicationId} error={errors.email}>
                              <input
                                type="email"
                                placeholder={t.emailPlaceholder}
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-transparent text-sm text-white placeholder-white/10 outline-none font-bold"
                              />
                            </FormField>
                        </div>

                        <FormField icon={<FileText size={14} />} label={t.reason} error={errors.reason}>
                          <textarea
                            placeholder={t.reasonPlaceholder}
                            rows={3}
                            value={form.reason}
                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            className="w-full bg-transparent text-sm text-white placeholder-white/10 outline-none resize-none font-medium leading-relaxed"
                          />
                        </FormField>

                        <div className="flex items-center gap-3 px-4 py-3 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                           <ShieldCheck size={16} className="text-emerald-400" />
                           <p className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest leading-tight">
                             {t.encryptionMessage}
                           </p>
                        </div>

                        {errors.submit && <p className="text-[11px] text-red-400 text-center font-black uppercase tracking-widest">{errors.submit}</p>}

                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-5 rounded-[1.75rem] bg-gradient-to-r from-emerald-600 to-emerald-500 border border-white/20 text-white text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <TreePine size={18} />
                          )}
                          {loading ? t.transmitting : t.submitRequest}
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
    <div className="flex flex-col gap-1.5">
      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
        {icon}
        {label}
      </label>
      <div
        className={`px-4 py-3.5 rounded-2xl bg-white/[0.03] border transition-all duration-300 ${
          error ? "border-red-500/40 bg-red-500/5" : "border-white/10 focus-within:border-emerald-500/50 focus-within:bg-white/[0.06]"
        }`}
      >
        {children}
      </div>
      {error && <p className="text-[10px] font-black text-red-500/80 uppercase tracking-tighter mt-1 ml-1">{error}</p>}
    </div>
  );
}