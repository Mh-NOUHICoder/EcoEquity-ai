"use client";

import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import LoadingScreen from "@/components/ui/LoadingScreen";
import GlobalHUDFx from "@/components/ui/GlobalHUDFx";
import ClimateTicker from "@/components/ui/ClimateTicker";
import NeuralSidebar from "@/components/ui/NeuralSidebar";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

export default function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, dispatch } = useApp();
  const { t, i18n } = useTranslation();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && i18n.language) {
      document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    
    // Safety timeout: force clear loading after 6 seconds even if hydration hangs
    const safetyTimer = setTimeout(() => {
      if (state.isAppLoading) {
        console.warn("Hydration timeout: forcing app load");
        dispatch({ type: "SET_APP_LOADING", payload: false });
      }
    }, 6000);

    if (!state.isHydrated) return;

    // Standard cinematic delay
    const timer = setTimeout(() => {
      dispatch({ type: "SET_APP_LOADING", payload: false });
    }, 2800);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [dispatch, state.isHydrated, state.isAppLoading, isMounted]);

  // First render on client MUST match the server exactly.
  // The server renders isAppLoading=true and 'en' language.
  const loadingMessage = isMounted ? t('initializingSectorLink') : "Initializing Systems...";

  return (
    <>
      <LoadingScreen isLoading={state.isAppLoading} message={loadingMessage} />
      {isMounted && !state.isAppLoading && (
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
