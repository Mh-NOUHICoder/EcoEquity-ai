import { HeatLevel, NDVIFeature, NDVIGeoJSON } from "@/types";

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

export const findDistrictByCoords = (lat: number, lng: number, geojson: NDVIGeoJSON): NDVIFeature | undefined => {
  return geojson.features.find(f => {
    if (f.geometry.type !== "Polygon") return false;
    const coords = f.geometry.coordinates[0];
    const lats = coords.map((c: any) => c[1]);
    const lngs = coords.map((c: any) => c[0]);
    return lat >= Math.min(...lats) && lat <= Math.max(...lats) &&
           lng >= Math.min(...lngs) && lng <= Math.max(...lngs);
  });
};

export function getAIStrategies(feature: NDVIFeature) {
  const ndvi = feature.properties.ndvi;
  const name = feature.properties.name.toLowerCase();
  
  const strategies = [];
  
  if (ndvi < 0.25) {
    strategies.push(
      { text: "criticalThermalMitigation", prob: "98%", type: "critical" },
      { text: "emergencyTreeCanopy", prob: "94%", type: "urgent" },
      { text: "highAlbedoPavement", prob: "89%", type: "infra" }
    );
  } else if (ndvi < 0.45) {
    strategies.push(
      { text: "heatIslandReduction", prob: "85%", type: "moderate" },
      { text: "pocketParkIntegration", prob: "91%", type: "soft" },
      { text: "smartIrrigation", prob: "87%", type: "water" }
    );
  } else {
    strategies.push(
      { text: "biodiversityCorridor", prob: "93%", type: "healthy" },
      { text: "greenRoofNetwork", prob: "88%", type: "healthy" },
      { text: "sustainableWaterRetention", prob: "95%", type: "water" }
    );
  }

  // Specific overrides for key locations
  if (name.includes("gran vía")) {
    return [
      { text: "verticalForest", prob: "96%", type: "high-tech" },
      { text: "subterraneanCooling", prob: "92%", type: "infra" },
      { text: "shadeOptimization", prob: "95%", type: "soft" }
    ];
  }
  
  if (name.includes("salamanca")) {
    return [
        { text: "historicFacade", prob: "94%", type: "heritage" },
        { text: "permeablePlaza", prob: "88%", type: "water" },
        { text: "greenTransit", prob: "97%", type: "transit" }
    ];
  }

  if (name.includes("castromonte")) {
    return [
        { text: "soilSensorArray", prob: "98%", type: "data" },
        { text: "microMisting", prob: "91%", type: "soft" },
        { text: "shadowModulation", prob: "89%", type: "critical" }
    ];
  }

  return strategies;
}