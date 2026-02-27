import { NDVIGeoJSON, CommunityReport } from "@/types";

export const NDVI_GEOJSON: NDVIGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Sector Delta-1",
        district: "Global Zone A",
        ndvi: 0.12,
        population: 85000,
        treeCount: 420,
        avgTemp: 38.2,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [13.32, 52.535],
            [13.35, 52.535],
            [13.35, 52.545],
            [13.32, 52.545],
            [13.32, 52.535],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Sector Gamma-4",
        district: "Global Zone B",
        ndvi: 0.35,
        population: 120000,
        treeCount: 2200,
        avgTemp: 32.5,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [13.38, 52.49],
            [13.42, 52.49],
            [13.42, 52.51],
            [13.38, 52.51],
            [13.38, 52.49],
          ],
        ],
      },
    }
  ],
};

export const MOCK_REPORTS: CommunityReport[] = [
  {
    id: "1",
    author: "User_Alpha",
    avatar: "UA",
    district: "Sector Grid-09",
    message: "High thermal stress detected in coastal urban areas. Immediate canopy intervention recommended.",
    heatLevel: "critical" as const,
    ndvi: 0.12,
    timestamp: "2h ago",
    upvotes: 45,
    coordinates: [52.538, 13.337] as [number, number],
  },
  {
    id: "2",
    author: "Eco_Guardian",
    avatar: "EG",
    district: "Sector Grid-22",
    message: "Successful reforestation initiative in progress. Local biodiversity index increasing.",
    heatLevel: "healthy" as const,
    ndvi: 0.58,
    timestamp: "5h ago",
    upvotes: 92,
    coordinates: [52.498, 13.401] as [number, number],
  }
];

export const CITY_AVG_NDVI = 0.28;