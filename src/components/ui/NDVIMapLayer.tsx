"use client";

import { useEffect, useState } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L, { Layer } from "leaflet";
import type { FeatureCollection } from "geojson";

// Function to fetch local GeoJSON data from the /public directory
const fetchGeoJSONData = async (): Promise<FeatureCollection> => {
  const response = await fetch("/data/madrid-ndvi.json");
  if (!response.ok) {
    throw new Error("Failed to fetch GeoJSON data");
  }
  return response.json();
};

// Style function to color features based on the NDVI property
const styleGeoJSON = (feature?: GeoJSON.Feature) => {
  const ndvi = feature?.properties?.NDVI;

  let color = "#808080"; // Grey for default/no data

  if (typeof ndvi === "number") {
    if (ndvi > 0.6) {
      color = "#006400"; // Dark Green: Healthy Vegetation
    } else if (ndvi > 0.2) {
      color = "#ADFF2F"; // Yellow/Light Green: Sparse/Stressed Vegetation
    } else {
      color = "#FF4136"; // Red: Urban/Artificial Surfaces
    }
  }

  return {
    fillColor: color,
    weight: 0.5,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7,
  };
};

// Function to bind a popup to each feature
const onEachFeature = (feature: GeoJSON.Feature, layer: Layer) => {
  if (feature.properties && typeof feature.properties.NDVI === "number") {
    layer.bindPopup(`<strong>NDVI:</strong> ${feature.properties.NDVI.toFixed(4)}`);
  }
};

const NDVIMapLayer = () => {
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const map = useMap();

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchGeoJSONData();
        setGeoJsonData(data);
        console.log("GeoJSON Data loaded:", data);

        // Automatically center the map on the GeoJSON bounds
        const geoJsonLayer = L.geoJSON(data);
        map.fitBounds(geoJsonLayer.getBounds());
      } catch (error) {
        console.error("Error loading GeoJSON data:", error);
      }
    };

    getData();
  }, [map]);

  if (!geoJsonData) {
    return null; // Or a loading spinner
  }

  return (
    <GeoJSON data={geoJsonData} style={styleGeoJSON} onEachFeature={onEachFeature} />
  );
};

export default NDVIMapLayer;