"use client";

import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import LoadingScreen from "@/components/ui/LoadingScreen";
import GlobalHUDFx from "@/components/ui/GlobalHUDFx";
import ClimateTicker from "@/components/ui/ClimateTicker";
import NeuralSidebar from "@/components/ui/NeuralSidebar";

export default function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, dispatch } = useApp();

  useEffect(() => {
    // Simulate initial loading time for smooth transition
    const timer = setTimeout(() => {
      dispatch({ type: "SET_APP_LOADING", payload: false });
    }, 2800);

    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <>
      <LoadingScreen isLoading={state.isAppLoading} message="Synchronizing Neural Grid..." />
      {!state.isAppLoading && (
        <>
          <GlobalHUDFx />
          <ClimateTicker />
          <NeuralSidebar />
        </>
      )}
      <main className={state.isAppLoading ? "hidden" : "block h-full w-full"}>
        {children}
      </main>
    </>
  );
}
