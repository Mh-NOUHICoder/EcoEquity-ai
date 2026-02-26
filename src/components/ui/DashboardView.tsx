"use client";

import { motion } from "framer-motion";
import {
  Thermometer,
  TreePine,
  Users,
  AlertTriangle,
  Leaf,
  Globe,
  ArrowRight,
} from "lucide-react";
import { NDVI_GEOJSON, CITY_AVG_NDVI } from "@/lib/data";
import { getColor, getHeatLevel } from "@/lib/ndvi";
import { useApp } from "@/context/AppContext";
import SentinelData from "./SentinelData";

export default function DashboardView() {
  const { dispatch } = useApp();

  const features = NDVI_GEOJSON.features;
  const criticalZones = features.filter((f) => f.properties.ndvi < 0.2);
  const moderateZones = features.filter(
    (f) => f.properties.ndvi >= 0.2 && f.properties.ndvi < 0.4
  );
  const healthyZones = features.filter((f) => f.properties.ndvi >= 0.4);
  const totalPop = features.reduce((s, f) => s + f.properties.population, 0);
  const totalTrees = features.reduce((s, f) => s + f.properties.treeCount, 0);
  const avgTemp =
    features.reduce((s, f) => s + f.properties.avgTemp, 0) / features.length;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-5 overflow-y-auto h-full space-y-5"
    >
      {/* Hero header */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-widest mb-2">
                Urban Heat Intelligence · Berlin, DE
              </p>
              <h1 className="font-display text-2xl text-white leading-tight mb-2">
                City Thermal Overview
              </h1>
              <p className="text-sm text-white/40 max-w-md leading-relaxed">
                Real-time NDVI analysis across {features.length} districts. {criticalZones.length}{" "}
                zones require urgent intervention affecting{" "}
                {(
                  criticalZones.reduce((s, f) => s + f.properties.population, 0) /
                  1000
                ).toFixed(0)}
                k residents.
              </p>
            </div>
            <div className="shrink-0 hidden md:flex flex-col items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <span className="text-2xl font-display font-bold text-amber-400">
                {CITY_AVG_NDVI.toFixed(2)}
              </span>
              <span className="text-[9px] font-mono text-white/30 uppercase">
                Avg NDVI
              </span>
            </div>
          </div>

          {/* Zone breakdown bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                Zone Distribution
              </span>
              <span className="text-[10px] font-mono text-white/30">
                {features.length} districts
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(criticalZones.length / features.length) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-red-500 rounded-l-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(moderateZones.length / features.length) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="h-full bg-amber-500"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(healthyZones.length / features.length) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="h-full bg-emerald-500 rounded-r-full"
              />
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <Legend color="bg-red-500" label={`Critical (${criticalZones.length})`} />
              <Legend color="bg-amber-500" label={`Moderate (${moderateZones.length})`} />
              <Legend color="bg-emerald-500" label={`Healthy (${healthyZones.length})`} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Thermometer size={16} />} label="Avg Surface Temp" value={`${avgTemp.toFixed(1)}°C`} sub="+4.2°C above baseline" color="red" />
        <StatCard icon={<TreePine size={16} />} label="Total Trees" value={totalTrees.toLocaleString()} sub="urban canopy" color="green" />
        <StatCard icon={<Users size={16} />} label="Population" value={`${(totalPop / 1000).toFixed(0)}k`} sub="residents tracked" color="blue" />
        <StatCard icon={<AlertTriangle size={16} />} label="Heat Alerts" value={criticalZones.length.toString()} sub="zones critical" color="red" />
      </motion.div>

      {/* District rankings */}
      <motion.div variants={item} className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf size={14} className="text-emerald-400" />
            <h2 className="font-display text-sm text-white">
              District Rankings by NDVI
            </h2>
          </div>
          <button
            onClick={() => dispatch({ type: "SET_VIEW", payload: "map" })}
            className="flex items-center gap-1 text-[11px] text-emerald-400/60 hover:text-emerald-400 transition-colors"
          >
            View Map <ArrowRight size={11} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {[...features]
            .sort((a, b) => a.properties.ndvi - b.properties.ndvi)
            .map((f, i) => {
              const { name, ndvi, avgTemp } = f.properties;
              const color = getColor(ndvi);
              const level = getHeatLevel(ndvi);
              return (
                <motion.div
                  key={name}
                  variants={item}
                  className="flex items-center gap-4 group"
                >
                  <span className="text-[11px] font-mono text-white/20 w-4 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm text-white/80 font-medium truncate">
                        {name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-white/30 font-mono">
                          {avgTemp}°C
                        </span>
                        <span
                          className="text-[11px] font-mono font-semibold"
                          style={{ color }}
                        >
                          {ndvi.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ndvi * 100}%` }}
                        transition={{ duration: 0.7, delay: i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                      level === "critical"
                        ? "heat-badge-critical"
                        : level === "moderate"
                        ? "heat-badge-moderate"
                        : "heat-badge-healthy"
                    }`}
                  >
                    {level.toUpperCase()}
                  </span>
                </motion.div>
              );
            })}
        </div>
      </motion.div>

      {/* Equity note */}
      <motion.div
        variants={item}
        className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15"
      >
        <Globe size={14} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-400/70 leading-relaxed">
          <span className="text-amber-400 font-medium">Equity note:</span>{" "}
          Districts with NDVI &lt; 0.2 have 2.4× lower median income than green
          zones. Urban heat is not just environmental — it&apos;s a social justice
          issue.
        </p>
      </motion.div>
      <motion.div variants={item}>
        <SentinelData />
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: "red" | "green" | "blue" | "amber"; }) {
  const colors = {
    red: { bg: "from-red-500/5", border: "border-red-500/15", icon: "text-red-400", text: "text-red-400" },
    green: { bg: "from-emerald-500/5", border: "border-emerald-500/15", icon: "text-emerald-400", text: "text-emerald-400" },
    blue: { bg: "from-blue-500/5", border: "border-blue-500/15", icon: "text-blue-400", text: "text-blue-400" },
    amber: { bg: "from-amber-500/5", border: "border-amber-500/15", icon: "text-amber-400", text: "text-amber-400" },
  }[color];

  return (
    <div className={`glass-card rounded-xl p-4 bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
      <div className={`${colors.icon} mb-2`}>{icon}</div>
      <div className={`text-2xl font-display font-bold ${colors.text} mb-0.5`}>{value}</div>
      <div className="text-[11px] text-white/50 mt-1">{label}</div>
      <div className="text-[10px] font-mono text-white/30 leading-tight">{sub}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] text-white/30 font-mono">{label}</span>
    </div>
  );
}