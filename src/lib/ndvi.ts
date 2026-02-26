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