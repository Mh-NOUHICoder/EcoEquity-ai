"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapContainer, TileLayer } from "react-leaflet";

// Dynamically import the layer to ensure Leaflet only loads on the client
const NDVIMapLayer = dynamic(() => import("./NDVIMapLayer"), { ssr: false });

import "leaflet/dist/leaflet.css";

const EcoEquityMap = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="h-screen w-full bg-zinc-900" />;

  return (
    <MapContainer
      center={[40.416775, -3.70379]} // Centered on Madrid
      zoom={10}
      className="h-screen w-full" // Use Tailwind classes for sizing
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <NDVIMapLayer />
    </MapContainer>
  );
};

export default EcoEquityMap;