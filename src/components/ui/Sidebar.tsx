"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard,
  Map,
  Sparkles,
  MessageSquare,
  Leaf,
  TreePine,
  Satellite,
  Bug,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ActiveView } from "@/types";

const navItems = [
  { id: "dashboard" as ActiveView, label: "Dashboard", icon: LayoutDashboard },
  { id: "map" as ActiveView, label: "Map View", icon: Map },
  { id: "sentinel" as ActiveView, label: "Sentinel Hub", icon: Satellite },
  { id: "ai" as ActiveView, label: "AI Insights", icon: Sparkles },
  { id: "community" as ActiveView, label: "Community", icon: MessageSquare },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-20 lg:w-64 h-full glass flex flex-col border-r border-white/[0.06] relative z-20 shrink-0"
    >
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 shrink-0">
            <div className="absolute inset-0 rounded-xl bg-emerald-500/20 blur-sm" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
              <TreePine size={18} className="text-emerald-400" />
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="font-display text-base text-white leading-tight">
              EcoEquity
            </h1>
            <p className="text-[10px] text-emerald-400/70 font-mono tracking-widest uppercase">
              AI · Berlin
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = state.activeView === item.id;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => dispatch({ type: "SET_VIEW", payload: item.id })}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${
                  isActive
                    ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-full"
                />
              )}
              <Icon
                size={18}
                className={`shrink-0 ${isActive ? "text-emerald-400" : "group-hover:text-white/60"}`}
              />
              <span className="hidden lg:block text-sm font-medium">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Developer Tools Link */}
      <div className="p-3 lg:p-4">
        <Link
          href="/debug/sentinel"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors group"
        >
          <Bug
            size={16}
            className="shrink-0 text-white/40 group-hover:text-white/60"
          />
          <span className="hidden lg:block">
            Debug Tools
          </span>
        </Link>
      </div>

      {/* Footer stats */}
      <div className="p-4 border-t border-white/[0.06] hidden lg:block">
        <div className="glass-card rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Leaf size={12} className="text-emerald-400" />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              City Status
            </span>
          </div>
          <div className="space-y-1.5">
            <StatusRow label="Avg NDVI" value="0.31" color="amber" />
            <StatusRow label="Hot Zones" value="4" color="red" />
            <StatusRow label="Tree Requests" value={state.submittedRequests + 127} color="green" />
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function StatusRow({ label, value, color }: { label: string; value: string | number; color: "red" | "amber" | "green" }) {
  const colors = { red: "text-red-400", amber: "text-amber-400", green: "text-emerald-400" };
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-white/40">{label}</span>
      <span className={`text-[11px] font-mono font-medium ${colors[color]}`}>{value}</span>
    </div>
  );
}