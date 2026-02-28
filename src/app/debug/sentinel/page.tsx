"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Feature, FeatureCollection } from "geojson";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";

// Define a more specific type for the expected STAC feature properties
interface StacFeatureProperties {
  datetime: string;
  collection: string;
  "eo:cloud_cover"?: number;
  [key: string]: any;
}

// Combine with GeoJSON Feature
type StacFeature = Feature<GeoJSON.Geometry, StacFeatureProperties>;
type StacFeatureCollection =
  FeatureCollection<GeoJSON.Geometry, StacFeatureProperties>;

interface ValidationResult {
  message: string;
  isError: boolean;
}

const FeatureInspector: React.FC<{ feature: StacFeature; index: number }> = ({
  feature,
  index,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { id, properties, geometry } = feature;
  const { datetime, collection } = properties;
  const cloudCover = properties["eo:cloud_cover"];

  const validationChecks = [
    { key: "id", value: id },
    { key: "collection", value: collection },
    { key: "properties.datetime", value: datetime },
    { key: "geometry", value: geometry },
  ];

  const validationErrors = validationChecks.filter(
    (c) => c.value === undefined || c.value === null
  );

  return (
    <div className="border border-white/10 rounded-xl mb-4 overflow-hidden glass">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left hover:bg-white/[0.03] transition-colors flex justify-between items-center group"
      >
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">
            Feature {index + 1}
          </span>
          <span className="font-mono text-sm text-cyan-400 group-hover:text-cyan-300 transition-colors">
            {id}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {validationErrors.length > 0 && (
            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">
              Issues
            </span>
          )}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="text-gray-500"
          >
            ▼
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="p-4 bg-white/[0.01] border-t border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-gray-400 mb-3 text-xs uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    Key Properties
                  </h4>
                  <div className="space-y-2">
                    <p className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-gray-500">ID</span>
                      <span className="font-mono text-cyan-400/80">{id}</span>
                    </p>
                    <p className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-gray-500">Collection</span>
                      <span className="font-mono text-blue-400/80">
                        {collection}
                      </span>
                    </p>
                    <p className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-gray-500">Sensing Date</span>
                      <span className="font-mono text-white/80 flex items-center gap-2">
                        <Calendar size={12} className="text-cyan-400" />
                        {new Date(datetime).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </p>
                    <p className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-gray-500">Capture Time</span>
                      <span className="font-mono text-white/80 flex items-center gap-2">
                        <Clock size={12} className="text-blue-400" />
                        {new Date(datetime).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">Cloud Cover</span>
                      <span className="font-mono text-white/80">
                        {cloudCover !== undefined
                          ? `${cloudCover.toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-gray-400 mb-3 text-xs uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Geometry
                  </h4>
                  <div className="space-y-2">
                    <p className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-gray-500">Type</span>
                      <span className="font-mono text-white/80">
                        {geometry?.type}
                      </span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500">Coords Pairs</span>
                      <span className="font-mono text-white/80 font-bold">
                        {(geometry as any)?.coordinates?.[0]?.length || 0}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="mt-6 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <h4 className="font-bold text-red-400 mb-2 text-[10px] uppercase tracking-widest">
                    Validation Warnings
                  </h4>
                  <ul className="space-y-1">
                    {validationErrors.map((err) => (
                      <li key={err.key} className="text-red-400/70 text-xs flex gap-2">
                        <span>•</span>
                        <span>
                          Property <code className="text-red-300 font-mono">{err.key}</code> is missing
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SentinelDebugPage() {
  const { state } = useApp();
  const [data, setData] = useState<StacFeatureCollection | null>(null);
  const [rawJson, setRawJson] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>(
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setStatusCode(null);
      setValidationResults([]);
      const end = new Date();
      const start = new Date();
      start.setMonth(end.getMonth() - 1);
      const fmt = (d: Date) => d.toISOString().split('.')[0] + 'Z';
      const dynamicDatetime = `${fmt(start)}/${fmt(end)}`;

      const coords = state.userLocation || [52.51, 13.38];
      const [lat, lng] = coords;
      const bbox = [lng - 0.5, lat - 0.5, lng + 0.5, lat + 0.5];

      const testBody = {
        bbox,
        datetime: dynamicDatetime,
        collections: ["sentinel-2-l2a"],
        limit: 5,
      };

      try {
        const response = await fetch("/api/sentinel/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testBody),
        });

        setStatusCode(response.status);
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.message || `HTTP error! status: ${response.status}`
          );
        }

        setData(responseData);
        setRawJson(JSON.stringify(responseData, null, 2));
        validateData(responseData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        if (err instanceof Error && err.message.includes("Unexpected token")) {
          setError("Failed to parse JSON response from the server.");
        }
      } finally {
        setLoading(false);
      }
    };

    const validateData = (d: StacFeatureCollection) => {
      const results: ValidationResult[] = [];
      if (d?.type === "FeatureCollection") {
        results.push({
          message: 'Root `type` is "FeatureCollection".',
          isError: false,
        });
      } else {
        results.push({
          message: 'Root object `type` is not "FeatureCollection".',
          isError: true,
        });
      }

      if (Array.isArray(d?.features)) {
        results.push({
          message: "Root `features` property is an array.",
          isError: false,
        });
      } else {
        results.push({
          message: "Root `features` property is missing or not an array.",
          isError: true,
        });
      }
      setValidationResults(results);
    };

    fetchData();
  }, [state.userLocation]);

  const hasValidationErrors = validationResults.some((r: ValidationResult) => r.isError);

  return (
    <div className="bg-obsidian-950 text-gray-200 min-h-screen p-4 sm:p-6 lg:p-8 scroll-smooth selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold font-display text-white tracking-tight mb-3">
              Sentinel Hub <span className="text-cyan-400">Debugger</span>
            </h1>
            <p className="text-gray-400 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live inspector for the <code className="bg-white/5 px-2 py-0.5 rounded text-cyan-400 font-mono">/api/sentinel/catalog</code> endpoint.
            </p>
          </motion.div>
        </header>

        {loading && (
          <div className="flex flex-col items-center justify-center h-96 rounded-2xl bg-white/[0.02] border border-white/5 glass">
            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest animate-pulse">
              Intercepting STAC Streams...
            </p>
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 text-red-300 p-6 rounded-2xl glass mb-10"
          >
            <h2 className="font-bold text-xl mb-2 flex items-center gap-2">
              ⚠️ Request Intersection Failed
            </h2>
            {statusCode && <p className="text-xs font-mono text-red-400/60 uppercase mb-4 tracking-wider">Protocol Status: {statusCode}</p>}
            <pre className="text-sm font-mono bg-black/40 p-4 rounded-xl border border-white/5 overflow-auto max-h-48 scrollbar-custom">
              {error}
            </pre>
          </motion.div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left side: Inspectors */}
            <div className="flex flex-col gap-10 overflow-hidden">
              <motion.section 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-bold mb-5 text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <span className="h-px bg-white/10 flex-1" />
                  Telemetry Summary
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl glass">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Status</span>
                        <span className={`font-mono text-sm px-2 py-0.5 rounded inline-block ${
                            statusCode && statusCode >= 200 && statusCode < 300 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>{statusCode} {statusCode === 200 ? 'OK' : 'ERROR'}</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl glass">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Features</span>
                        <span className="text-3xl font-bold font-display text-white leading-none">{data.features.length}</span>
                    </div>
                </div>
              </motion.section>

              <motion.section 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-lg font-bold mb-5 text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <span className="h-px bg-white/10 flex-1" />
                  Protocol Compliance
                </h2>
                <div className={`p-5 rounded-2xl glass border ${hasValidationErrors ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-emerald-500/20 bg-emerald-500/[0.02]'}`}>
                  <div className="space-y-3">
                    {validationResults.map((result: ValidationResult, i: number) => (
                        <p key={i} className={`flex items-center text-sm font-medium ${result.isError ? 'text-red-300' : 'text-emerald-300'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-3 ${result.isError ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            {result.message}
                        </p>
                    ))}
                  </div>
                </div>
              </motion.section>

              <motion.section 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-lg font-bold mb-5 text-gray-500 uppercase tracking-widest flex items-center gap-3">
                  <span className="h-px bg-white/10 flex-1" />
                  Feature Payload
                </h2>
                <div className="space-y-4">
                  {data.features.map((feature: any, i: number) => (
                    <FeatureInspector
                      key={feature.id || i}
                      feature={feature as StacFeature}
                      index={i}
                    />
                  ))}
                </div>
              </motion.section>
            </div>

            {/* Right side: Raw JSON */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <h2 className="text-lg font-bold mb-5 text-gray-500 uppercase tracking-widest flex items-center gap-3">
                <span className="h-px bg-white/10 flex-1" />
                Raw Data Stream
              </h2>
              <div className="relative group">
                {/* Scroll shadows */}
                <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none z-10 opacity-60 rounded-t-2xl" />
                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10 opacity-60 rounded-b-2xl" />
                
                <div className="bg-[#050505] border border-white/5 rounded-2xl h-[calc(100vh-280px)] overflow-auto scrollbar-custom p-6 shadow-2xl">
                  <pre className="text-[11px] font-mono leading-relaxed text-gray-400 selection:bg-cyan-500/20">
                    <code className="text-cyan-500/70">{rawJson}</code>
                  </pre>
                </div>
              </div>
              
              {/* Floating Copy Button or similar could go here */}
              <div className="mt-4 flex justify-end">
                <span className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase">
                  End of Stream — Berlin Region [S2-L2A]
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.4);
        }
      `}</style>
    </div>
  );
}
