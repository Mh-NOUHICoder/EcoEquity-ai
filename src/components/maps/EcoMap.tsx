"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { NDVI_GEOJSON } from "@/lib/data";
import { getColor, getHeatLevel, getOpacity } from "@/lib/ndvi";
import { generateAIInsight } from "@/lib/gemini";
import { NDVIFeature } from "@/types";
import { MAP_THEMES } from "@/lib/mapThemes";

import MapThemeSwitcher from "./MapThemeSwitcher";

let L: typeof import("leaflet") | null = null;

export default function EcoMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const currentTileLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { state, dispatch } = useApp();

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      L = leaflet.default;
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isReady || !L || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [52.51, 13.38],
        zoom: 11.5,
        zoomControl: true,
        attributionControl: true,
      });
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    
    // Theme switching logic
    if (currentTileLayerRef.current) {
        map.removeLayer(currentTileLayerRef.current);
    }

    const theme = MAP_THEMES.find(t => t.id === state.mapTheme) || MAP_THEMES[0];
    
    currentTileLayerRef.current = L.tileLayer(theme.url, {
      attribution: theme.attribution,
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    if (map.getPanes().overlayPane.innerHTML === "") {
        L.geoJSON(NDVI_GEOJSON as GeoJSON.FeatureCollection, {
      style: (feature) => {
        const ndvi = (feature as NDVIFeature).properties.ndvi;
        return {
          fillColor: getColor(ndvi),
          weight: 1.5,
          opacity: 0.8,
          color: "rgba(255,255,255,0.2)",
          fillOpacity: getOpacity(ndvi),
        };
      },
      onEachFeature: (feature, layer) => {
        const f = feature as NDVIFeature;
        const { name, ndvi, avgTemp, population, treeCount } = f.properties;
        const heatLevel = getHeatLevel(ndvi);
        const color = getColor(ndvi);

        layer.bindTooltip(
          `<div style="font-family:'DM Sans',sans-serif"><div style="font-weight:600;margin-bottom:2px">${name}</div><div style="color:${color};font-family:'JetBrains Mono',monospace;font-size:11px">NDVI ${ndvi.toFixed(2)}</div></div>`,
          { className: "eco-tooltip", sticky: true, offset: [0, -8] }
        );

        layer.bindPopup(
          `<div style="font-family:'DM Sans',sans-serif;min-width:200px;padding:4px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <h3 style="font-weight:600;font-size:15px;margin:0">${name}</h3>
              <span style="font-size:10px;padding:3px 8px;border-radius:20px;background:${heatLevel === "critical" ? "rgba(239,68,68,0.15)" : heatLevel === "moderate" ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)"};color:${color};border:1px solid ${color}40;font-family:'JetBrains Mono',monospace">${heatLevel.toUpperCase()}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
              <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px">
                <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:2px">NDVI Score</div>
                <div style="font-size:18px;font-weight:700;color:${color};font-family:'JetBrains Mono',monospace">${ndvi.toFixed(2)}</div>
              </div>
              <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px">
                <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:2px">Avg Temp</div>
                <div style="font-size:18px;font-weight:700;color:${color};font-family:'JetBrains Mono',monospace">${avgTemp}°C</div>
              </div>
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:4px">Population: <span style="color:white">${population.toLocaleString()}</span></div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:12px">Trees: <span style="color:white">${treeCount.toLocaleString()}</span></div>
            ${
              heatLevel === "critical"
                ? `<button onclick="window.__openTreeModal({ district: '${name}', lat: ${(layer as import("leaflet").Polygon).getBounds().getCenter().lat}, lng: ${(layer as import("leaflet").Polygon).getBounds().getCenter().lng} })" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(239,68,68,0.4);background:rgba(239,68,68,0.1);color:#fca5a5;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500;transition:all 0.2s">🌳 Request a Tree Here</button>`
                : `<div style="font-size:11px;color:rgba(34,197,94,0.6);text-align:center">✓ This zone has adequate tree coverage</div>`
            }
          </div>`,
          { maxWidth: 260, minWidth: 220 }
        );

        layer.on("mouseover", () => {
          (layer as import("leaflet").Path).setStyle({
            weight: 2.5,
            color: "rgba(255,255,255,0.5)",
            fillOpacity: Math.min(getOpacity(ndvi) + 0.15, 0.9),
          });
        });

        layer.on("mouseout", () => {
          (layer as import("leaflet").Path).setStyle({
            weight: 1.5,
            color: "rgba(255,255,255,0.2)",
            fillOpacity: getOpacity(ndvi),
          });
        });

        layer.on("click", async () => {
          dispatch({ type: "SELECT_FEATURE", payload: f });
          dispatch({ type: "SET_LOADING_INSIGHT", payload: true });
          dispatch({ type: "SET_VIEW", payload: "ai" });
          const insight = await generateAIInsight(f);
          dispatch({ type: "SET_AI_INSIGHT", payload: insight });
        });
      },
    }).addTo(map);
    }

    (window as any).__openTreeModal = (payload: { district: string; lat: number; lng: number }) => {
      dispatch({
        type: "OPEN_TREE_MODAL",
        payload: {
          coords: [payload.lat, payload.lng],
          district: payload.district,
        },
      });
      map.closePopup();
    };

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      delete (window as any).__openTreeModal;
    };
  }, [isReady, dispatch, state.mapTheme]);

  useEffect(() => {
    if (!mapInstanceRef.current || !state.selectedFeature || !L) return;
    const coords = state.selectedFeature.geometry.coordinates[0];
    const lats = coords.map((c) => c[1]);
    const lngs = coords.map((c) => c[0]);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    mapInstanceRef.current.flyTo([centerLat, centerLng], 13, {
      duration: 1.2,
      easeLinearity: 0.5,
    });
  }, [state.selectedFeature]);

  return (
    <div className="relative w-full h-full">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-obsidian-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-white/40 text-sm font-mono">
              Loading map data...
            </p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />

      <MapThemeSwitcher />

      <div className="absolute bottom-6 left-4 glass-card rounded-xl p-3 z-[400]">
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2">
          NDVI Scale
        </p>
        <div className="space-y-1.5">
          <LegendItem color="#ef4444" label="&lt; 0.2 · Critical" />
          <LegendItem color="#f59e0b" label="0.2–0.4 · Moderate" />
          <LegendItem color="#22c55e" label="&gt; 0.4 · Healthy" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
        <div
        className="w-3 h-3 rounded-sm shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.1)]"
        style={{ backgroundColor: color, opacity: 1 }}
      />
      <span className="text-[11px] text-white font-bold font-mono drop-shadow-sm">{label}</span>
    </div>
  );
}