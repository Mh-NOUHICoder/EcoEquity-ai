"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, TreePine, MapPin, User, Mail, FileText, CheckCircle2 } from "lucide-react";
import { useState, FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import { submitTreeRequest } from "@/lib/supabase/supabase";

export default function TreeRequestModal() {
  const { state, dispatch } = useApp();
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
    if (!form.reason.trim() || form.reason.length < 20)
      newErrors.reason = "Please provide at least 20 characters";
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
        district: state.treeModalDistrict,
        coordinates: state.treeModalCoords || [52.51, 13.38],
      });
      dispatch({ type: "INCREMENT_REQUESTS" });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setErrors({ submit: "Failed to submit request. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {state.showTreeModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
          >
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="relative p-5 border-b border-white/[0.06]">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                      <TreePine size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="font-display text-base text-white">
                        Request a Tree
                      </h2>
                      <p className="text-[11px] text-emerald-400/60 font-mono">
                        {state.treeModalDistrict}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={close}
                    className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center py-8 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4"
                      >
                        <CheckCircle2 size={28} className="text-emerald-400" />
                      </motion.div>
                      <h3 className="font-display text-lg text-white mb-2">
                        Request Submitted!
                      </h3>
                      <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                        Your tree request for{" "}
                        <span className="text-emerald-400">
                          {state.treeModalDistrict}
                        </span>{" "}
                        has been logged. The city council will review it.
                      </p>
                      <button
                        onClick={close}
                        className="mt-6 px-5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-all"
                      >
                        Close
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      {state.treeModalCoords && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                          <MapPin size={12} className="text-emerald-400 shrink-0" />
                          <span className="text-[11px] font-mono text-white/40">
                            {state.treeModalCoords[0].toFixed(4)},{" "}
                            {state.treeModalCoords[1].toFixed(4)}
                          </span>
                        </div>
                      )}

                      <FormField
                        icon={<User size={13} />}
                        label="Full Name"
                        error={errors.name}
                      >
                        <input
                          type="text"
                          placeholder="Your name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full bg-transparent text-sm text-white placeholder-white/20 outline-none"
                        />
                      </FormField>

                      <FormField
                        icon={<Mail size={13} />}
                        label="Email"
                        error={errors.email}
                      >
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-transparent text-sm text-white placeholder-white/20 outline-none"
                        />
                      </FormField>

                      <FormField
                        icon={<FileText size={13} />}
                        label="Reason for Request"
                        error={errors.reason}
                      >
                        <textarea
                          placeholder="Describe the heat impact in your area..."
                          rows={3}
                          value={form.reason}
                          onChange={(e) => setForm({ ...form, reason: e.target.value })}
                          className="w-full bg-transparent text-sm text-white placeholder-white/20 outline-none resize-none"
                        />
                      </FormField>

                      {errors.submit && <p className="text-[11px] text-red-400 text-center">{errors.submit}</p>}

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 border border-emerald-500/40 text-white text-sm font-medium hover:from-emerald-500/80 hover:to-emerald-400/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <TreePine size={14} />
                        )}
                        {loading ? "Submitting..." : "Submit Tree Request"}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FormField({ icon, label, error, children }: { icon: React.ReactNode; label: string; error?: string; children: React.ReactNode; }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1.5 flex items-center gap-1">
        <span className="text-white/20">{icon}</span>
        {label}
      </label>
      <div
        className={`px-3 py-2.5 rounded-xl bg-white/[0.03] border transition-colors ${
          error ? "border-red-500/40" : "border-white/[0.08] focus-within:border-emerald-500/40"
        }`}
      >
        {children}
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1 ml-1">{error}</p>}
    </div>
  );
}