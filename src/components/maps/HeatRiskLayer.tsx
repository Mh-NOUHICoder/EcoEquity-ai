"use client";

import { useMemo, useState } from "react";
import { Rectangle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { getDynamicNDVI, getSmoothColor } from "@/lib/ndvi";

export const HeatRiskLayer = () => {
  const map = useMap();
  const [bounds, setBounds] = useState(map.getBounds());
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    dragend: () => setBounds(map.getBounds()),
    zoomend: () => {
      setZoom(map.getZoom());
      setBounds(map.getBounds());
    },
  });

  const heatCells = useMemo(() => {
    // Zoom levels mapping to resolution
    const res = zoom >= 15 ? 0.0025 : zoom >= 14 ? 0.006 : zoom >= 13 ? 0.015 : zoom >= 12 ? 0.03 : 0.08;
    
    // Performance limit
    if (zoom < 11) return [];

    const cells = [];
    const n = Math.ceil(bounds.getNorth() / res) * res;
    const s = Math.floor(bounds.getSouth() / res) * res;
    const e = Math.ceil(bounds.getEast() / res) * res;
    const w = Math.floor(bounds.getWest() / res) * res;

    for (let lat = s; lat < n; lat += res) {
      for (let lng = w; lng < e; lng += res) {
        const intensity = getDynamicNDVI(lat + res / 2, lng + res / 2);
        cells.push({
          id: `${lat}-${lng}`,
          bounds: [[lat, lng], [lat + res, lng + res]] as L.LatLngBoundsExpression,
          intensity,
        });
      }
    }
    return cells.slice(0, 500);
  }, [bounds, zoom]);

  return (
    <>
      {heatCells.map((cell) => (
        <Rectangle
          key={cell.id}
          bounds={cell.bounds}
          pathOptions={{
            fillColor: getSmoothColor(cell.intensity),
            fillOpacity: zoom >= 15 ? 0.35 : 0.25,
            stroke: false, // NO GRID LINES
          }}
        />
      ))}
    </>
  );
};
