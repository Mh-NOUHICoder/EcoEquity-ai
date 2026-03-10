import { NDVIGeoJSON, CommunityReport } from "@/types";

export const NDVI_GEOJSON: NDVIGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Retiro Park",
        district: "Retiro",
        ndvi: 0.78,
        population: 850,
        treeCount: 4500,
        avgTemp: 24.5
      },
      geometry: { type: "Point", coordinates: [-3.682, 40.415] }
    },
    {
      type: "Feature",
      properties: {
        name: "Calle de Alfonso XI",
        district: "Retiro - Jerónimos",
        ndvi: 0.32,
        population: 12000,
        treeCount: 156,
        avgTemp: 31.2
      },
      geometry: { type: "Point", coordinates: [-3.687, 40.417] }
    },
    {
      type: "Feature",
      properties: {
        name: "Calle de Castromonte",
        district: "Puente de Vallecas",
        ndvi: 0.18,
        population: 28500,
        treeCount: 42,
        avgTemp: 34.8
      },
      geometry: { type: "Point", coordinates: [-3.665, 40.385] }
    },
    {
      type: "Feature",
      properties: {
        name: "Gran Vía",
        district: "Centro",
        ndvi: 0.08,
        population: 45000,
        treeCount: 12,
        avgTemp: 36.5
      },
      geometry: { type: "Point", coordinates: [-3.703, 40.420] }
    },
    {
      type: "Feature",
      properties: {
        name: "Salamanca District",
        district: "Salamanca",
        ndvi: 0.22,
        population: 147000,
        treeCount: 840,
        avgTemp: 32.1
      },
      geometry: { type: "Point", coordinates: [-3.680, 40.430] }
    }
  ],
};

export const MOCK_REPORTS: CommunityReport[] = [];

export const CITY_AVG_NDVI = 0.28;