export type ActiveView = "dashboard" | "map" | "ai" | "community" | "sentinel";

export type HeatLevel = "critical" | "moderate" | "healthy";

export interface NDVIFeature {
  type: "Feature";
  properties: {
    name: string;
    district: string;
    ndvi: number;
    population: number;
    treeCount: number;
    avgTemp: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface NDVIGeoJSON {
  type: "FeatureCollection";
  features: NDVIFeature[];
}

export interface CommunityReport {
  id: string;
  author: string;
  avatar: string;
  district: string;
  message: string;
  heatLevel: HeatLevel;
  ndvi: number;
  timestamp: string;
  upvotes: number;
  coordinates: [number, number];
}
export interface STACFeature {
  id: string;
  type: "Feature";
  collection: string;
  geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon;
  bbox?: number[];
  properties: {
    datetime: string;
    "eo:cloud_cover"?: number;
    platform?: string;
    constellation?: string;
    [key: string]: any;
  };
}

export interface STACFeatureCollection {
  type: "FeatureCollection";
  features: STACFeature[];
}

export type MapTheme = "dark" | "light" | "satellite" | "terrain";
export type Language = "ar" | "en" | "es" | "fr";