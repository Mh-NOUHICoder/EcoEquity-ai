import { NDVIGeoJSON } from "@/types";

export const NDVI_GEOJSON: NDVIGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Moabit",
        district: "Berlin-Mitte",
        ndvi: 0.12,
        population: 78000,
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
        name: "Wedding",
        district: "Berlin-Mitte",
        ndvi: 0.18,
        population: 95000,
        treeCount: 580,
        avgTemp: 36.8,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [13.35, 52.545],
            [13.38, 52.545],
            [13.38, 52.558],
            [13.35, 52.558],
            [13.35, 52.545],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Kreuzberg",
        district: "Friedrichshain-Kreuzberg",
        ndvi: 0.29,
        population: 152000,
        treeCount: 2100,
        avgTemp: 34.1,
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
    },
    {
      type: "Feature",
      properties: {
        name: "Prenzlauer Berg",
        district: "Pankow",
        ndvi: 0.44,
        population: 165000,
        treeCount: 4800,
        avgTemp: 30.5,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [13.42, 52.53],
            [13.46, 52.53],
            [13.46, 52.55],
            [13.42, 52.55],
            [13.42, 52.53],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Tiergarten",
        district: "Berlin-Mitte",
        ndvi: 0.65,
        population: 12000,
        treeCount: 18000,
        avgTemp: 27.3,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [13.33, 52.505],
            [13.38, 52.505],
            [13.38, 52.525],
            [13.33, 52.525],
            [13.33, 52.505],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Neukölln",
        district: "Neukölln",
        ndvi: 0.15,
        population: 325000,
        treeCount: 750,
        avgTemp: 37.9,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [13.42, 52.46],
            [13.47, 52.46],
            [13.47, 52.49],
            [13.42, 52.49],
            [13.42, 52.46],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Steglitz",
        district: "Steglitz-Zehlendorf",
        ndvi: 0.51,
        population: 108000,
        treeCount: 9200,
        avgTemp: 29.8,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [13.32, 52.455],
            [13.36, 52.455],
            [13.36, 52.47],
            [13.32, 52.47],
            [13.32, 52.455],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Tempelhof",
        district: "Tempelhof-Schöneberg",
        ndvi: 0.22,
        population: 188000,
        treeCount: 1100,
        avgTemp: 35.6,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [13.38, 52.46],
            [13.42, 52.46],
            [13.42, 52.49],
            [13.38, 52.49],
            [13.38, 52.46],
          ],
        ],
      },
    },
  ],
};

export const MOCK_REPORTS = [
  {
    id: "1",
    author: "Fatima Al-Rashid",
    avatar: "FA",
    district: "Moabit",
    message: "The asphalt here gets scorching hot. Kids can't play outside. We desperately need shade trees on Turmstraße.",
    heatLevel: "critical" as const,
    ndvi: 0.12,
    timestamp: "2h ago",
    upvotes: 47,
    coordinates: [52.538, 13.337] as [number, number],
  },
  {
    id: "2",
    author: "Jonas Berger",
    avatar: "JB",
    district: "Wedding",
    message: "Temperature readings in our block hit 42°C last August. Elderly residents are suffering. This is a health crisis.",
    heatLevel: "critical" as const,
    ndvi: 0.18,
    timestamp: "4h ago",
    upvotes: 83,
    coordinates: [52.551, 13.362] as [number, number],
  },
  {
    id: "3",
    author: "Maria Santos",
    avatar: "MS",
    district: "Neukölln",
    message: "Petition for 50 new trees on Karl-Marx-Straße now has 1,200 signatures. The city must act on climate equity.",
    heatLevel: "critical" as const,
    ndvi: 0.15,
    timestamp: "6h ago",
    upvotes: 124,
    coordinates: [52.471, 13.441] as [number, number],
  },
  {
    id: "4",
    author: "Erik Lindström",
    avatar: "EL",
    district: "Tempelhof",
    message: "Progress! Two new pocket parks announced for southern Tempelhof. Community advocacy is working!",
    heatLevel: "moderate" as const,
    ndvi: 0.22,
    timestamp: "1d ago",
    upvotes: 56,
    coordinates: [52.473, 13.399] as [number, number],
  },
  {
    id: "5",
    author: "Amara Diallo",
    avatar: "AD",
    district: "Kreuzberg",
    message: "Görlitzer Park expansion approved. Green infrastructure investment finally reaching lower-income areas.",
    heatLevel: "moderate" as const,
    ndvi: 0.29,
    timestamp: "1d ago",
    upvotes: 91,
    coordinates: [52.498, 13.401] as [number, number],
  },
  {
    id: "6",
    author: "Sophie Müller",
    avatar: "SM",
    district: "Prenzlauer Berg",
    message: "Our neighborhood's green canopy has grown 12% since the 2022 planting initiative. Other districts deserve the same.",
    heatLevel: "healthy" as const,
    ndvi: 0.44,
    timestamp: "2d ago",
    upvotes: 38,
    coordinates: [52.54, 13.441] as [number, number],
  },
];

export const CITY_AVG_NDVI = 0.31;