"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoJsonObject } from "geojson";
import L from "leaflet";
import { MAP_THEMES } from "@/lib/mapThemes";
import { useApp } from "@/context/AppContext";
import MapThemeSwitcher from "./MapThemeSwitcher";
import { STACFeatureCollection, STACFeature } from "@/types";

// Helper for dynamic coloring based on cloud cover
function getCloudColor(cloud: number): string {
  if (cloud <= 10) return "#00c853";       // Green
  if (cloud <= 30) return "#aeea00";       // Light green
  if (cloud <= 60) return "#ffab00";       // Orange
  return "#d50000";                        // Red
}

// A simple debounce hook
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

interface SentinelMapProps {
  bbox: number[];
  datetime: string;
  collections: string[];
}

const FitBounds = ({
  geoJsonData,
  isInitialLoad,
}: {
  geoJsonData: GeoJsonObject | null;
  isInitialLoad: React.MutableRefObject<boolean>;
}) => {
  const map = useMap();
  useEffect(() => {
    if (geoJsonData && isInitialLoad.current) {
      const geoJsonLayer = L.geoJSON(geoJsonData);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
        isInitialLoad.current = false;
      }
    }
  }, [geoJsonData, map, isInitialLoad]);
  return null;
};

const MapEvents = ({
  onBoundsChange,
}: {
  onBoundsChange: (bbox: number[]) => void;
}) => {
  const onMoveEnd = useDebounce((map: L.Map) => {
    const bounds = map.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    onBoundsChange(bbox);
  }, 500);

  useMapEvents({
    moveend(e) {
      onMoveEnd(e.target);
    },
    zoomend(e) {
      onMoveEnd(e.target);
    }
  });

  return null;
};

// We remove the static geoJSONStyle and apply it dynamically on the component

const SentinelMap: React.FC<SentinelMapProps> = ({
  bbox: initialBbox,
  datetime,
  collections,
}) => {
  const { state } = useApp();
  const theme = MAP_THEMES.find(t => t.id === state.mapTheme) || MAP_THEMES[0];
  const [currentBbox, setCurrentBbox] = useState<number[]>(initialBbox);
  const [geoJsonData, setGeoJsonData] = useState<STACFeatureCollection | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const isInitialLoad = useRef<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const response = await fetch("/api/sentinel/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bbox: currentBbox.join(","),
            datetime,
            collections: collections.join(","),
          }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Request Failed: ${response.status}`);
        }
        const data: STACFeatureCollection = await response.json();
        
        // Defensive: Check if features exist and map them
        if (data && Array.isArray(data.features)) {
          // Filter out missing geometries
          data.features = data.features.filter(f => f.geometry);
          setGeoJsonData(data);
        } else {
           setGeoJsonData(null);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [currentBbox, datetime, collections]);

  const handleBoundsChange = (newBbox: number[]) => {
    if (!isInitialLoad.current) {
      setCurrentBbox(newBbox);
    }
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    // Cast to explicit STAC type for safe property extraction
    const stacFeature = feature as STACFeature;

    if (stacFeature.properties) {
      const collection = stacFeature.collection || "Unknown Collection";
      const datetime = stacFeature.properties.datetime;
      const formattedDate = datetime ? new Date(datetime).toLocaleDateString() : 'N/A';
      
      // Default to 100% cloud cover if undefined
      const cloud = stacFeature.properties["eo:cloud_cover"] ?? 100;

      const popupContent = `
        <div class="p-3 font-sans min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-2 h-2 rounded-full animate-pulse shadow-md" style="background-color: ${getCloudColor(cloud)}"></span>
            <span class="text-[10px] uppercase tracking-widest text-gray-400 font-bold">STAC Scene</span>
          </div>
          <h3 class="text-white font-mono text-sm font-bold mb-3 truncate w-full border-b border-white/10 pb-2">${stacFeature.id}</h3>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-500">Date</span>
              <span class="text-white font-mono">${formattedDate}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Collection</span>
              <span class="text-cyan-400 font-mono italic">${collection}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Cloud Cover</span>
              <span class="text-white font-mono" style="color: ${getCloudColor(cloud)}">${cloud.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      `;
      layer.bindPopup(popupContent, { className: 'eco-popup' });
      
      layer.bindTooltip(`
        <strong>${stacFeature.id}</strong><br/>
        Date: ${formattedDate}<br/>
        Cloud: ${cloud.toFixed(1)}%<br/>
        Collection: ${collection}
      `, { sticky: true });
    }

    layer.on({
      mouseover: (e) => {
        const targetLayer = e.target;
        targetLayer.setStyle({
          weight: 3,
          fillOpacity: 0.4,
          color: "#fff",
        });
      },
      mouseout: (e) => {
        if (geoJsonLayerRef.current) {
          geoJsonLayerRef.current.resetStyle(e.target);
        }
      },
    });
  };

  if (isFetching && isInitialLoad.current) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[600px] bg-obsidian-950 border border-white/5 rounded-2xl glass">
        <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-xs uppercase tracking-widest animate-pulse">
          Sychronizing Satellite Streams...
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      <MapContainer
        center={[52.51, 13.38]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        className="bg-obsidian-950"
      >
        <TileLayer
          url={theme.url}
          attribution={theme.attribution}
        />
        {geoJsonData && geoJsonData.features && geoJsonData.features.length === 0 && !isFetching && (
          <div className="absolute inset-0 flex items-center justify-center z-[500] bg-obsidian-950/80 backdrop-blur-sm">
             <div className="glass px-6 py-4 rounded-xl border border-white/10 shadow-2xl flex flex-col items-center">
               <span className="text-2xl mb-2">🔭</span>
               <p className="text-white font-mono text-sm tracking-wide">No scenes found</p>
               <p className="text-gray-400 font-mono text-xs mt-1">Try adjusting the requested timeframe</p>
             </div>
          </div>
        )}
        {geoJsonData && geoJsonData.features && geoJsonData.features.length > 0 && (
          <GeoJSON
            key={`${currentBbox.join("-")}-${collections.join("-")}`}
            ref={geoJsonLayerRef}
            data={geoJsonData as GeoJsonObject}
            onEachFeature={onEachFeature}
            style={(feature) => {
              const stacFeature = feature as unknown as STACFeature;
              const cloud = stacFeature?.properties?.["eo:cloud_cover"] ?? 100;
              const color = getCloudColor(cloud);
              return {
                color: color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.5
              };
            }}
          />
        )}
        <FitBounds geoJsonData={geoJsonData} isInitialLoad={isInitialLoad} />
        <MapEvents onBoundsChange={handleBoundsChange} />
      </MapContainer>

      <MapThemeSwitcher />

      {isFetching && !isInitialLoad.current && (
        <div className="absolute top-6 right-6 z-[1000] p-3 bg-obsidian-900/80 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
          <div className="w-5 h-5 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute bottom-6 left-6 z-[1000] p-4 bg-red-500/10 backdrop-blur-md rounded-xl border border-red-500/20 shadow-xl max-w-sm animate-in fade-in slide-in-from-bottom-2">
           <h3 className="font-bold text-red-400 text-xs uppercase tracking-widest flex items-center gap-2 mb-1">
             <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
             Connection Error
           </h3>
           <p className="text-red-300/80 text-[10px] font-mono leading-relaxed">{error}</p>
        </div>
      )}
      
      <div className="absolute bottom-6 right-6 z-[1000] p-3 bg-obsidian-950/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-1.5">
          <p className="text-[10px] uppercase font-black text-cyan-400 tracking-wider mb-1 px-1 border-b border-white/10 pb-1">
            Cloud Cover Status
          </p>
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-sm shrink-0 shadow-[0_0_8px_rgba(0,200,83,0.5)]" style={{ backgroundColor: '#00c853', opacity: 1 }}></div>
             <span className="text-[11px] text-white font-bold font-mono drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">0-10% (Clear)</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-sm shrink-0 shadow-[0_0_8px_rgba(174,234,0,0.5)]" style={{ backgroundColor: '#aeea00', opacity: 1 }}></div>
             <span className="text-[11px] text-white font-bold font-mono drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">11-30%</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-sm shrink-0 shadow-[0_0_8px_rgba(255,171,0,0.5)]" style={{ backgroundColor: '#ffab00', opacity: 1 }}></div>
             <span className="text-[11px] text-white font-bold font-mono drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">31-60%</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-sm shrink-0 shadow-[0_0_8px_rgba(213,0,0,0.5)]" style={{ backgroundColor: '#d50000', opacity: 1 }}></div>
             <span className="text-[11px] text-white font-bold font-mono drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">61%+ (Obscured)</span>
          </div>
      </div>
    </div>
  );
};

export default SentinelMap;