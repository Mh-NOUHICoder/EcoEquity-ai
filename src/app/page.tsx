"use client";

import { useState, useEffect } from "react";
import MainDashboard from "@/components/ui/MainDashboard";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function HomePage() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Local page-level initialization example
    const timer = setTimeout(() => setIsInitializing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <LoadingScreen isLoading={isInitializing} message="Syncing Regional Nodes" />
      <MainDashboard />
    </>
  );
}