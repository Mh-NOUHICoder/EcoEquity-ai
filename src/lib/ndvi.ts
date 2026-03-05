import { HeatLevel } from "@/types";

export function getColor(ndvi: number): string {
  if (ndvi < 0.2) return "#ef4444"; // Red/Critical
  if (ndvi < 0.4) return "#f59e0b"; // Amber/Moderate
  return "#22c55e"; // Green/Healthy
}

export function getHeatLevel(ndvi: number): HeatLevel {
  if (ndvi < 0.2) return "critical";
  if (ndvi < 0.4) return "moderate";
  return "healthy";
}

export function getOpacity(ndvi: number): number {
  if (ndvi < 0.2) return 0.6;
  if (ndvi < 0.4) return 0.4;
  return 0.2;
}

export function formatNDVI(ndvi: number): string {
  return ndvi.toFixed(2);
}

export const getDynamicNDVI = (lat: number, lng: number) => {
  const seed = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
  return 0.1 + (seed - Math.floor(seed)) * 0.75;
};

export const getSmoothColor = (value: number) => {
  // Value 0.1 (High Risk) to 0.8 (Healthy)
  // Normalize to 0-1
  const t = Math.max(0, Math.min(1, (value - 0.1) / 0.7));
  
  if (t < 0.5) {
    // Red (0.1) to Yellow (0.45)
    const factor = t * 2;
    const r = 239;
    const g = Math.round(68 + (158 - 68) * factor);
    const b = Math.round(68 + (11 - 68) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow (0.45) to Green (0.8)
    const factor = (t - 0.5) * 2;
    const r = Math.round(245 + (34 - 245) * factor);
    const g = Math.round(158 + (197 - 158) * factor);
    const b = Math.round(11 + (94 - 11) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }
};