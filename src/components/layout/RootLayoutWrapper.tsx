"use client";

import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import LoadingScreen from "@/components/ui/LoadingScreen";
import GlobalHUDFx from "@/components/ui/GlobalHUDFx";
import ClimateTicker from "@/components/ui/ClimateTicker";
import NeuralSidebar from "@/components/ui/NeuralSidebar";
import { VoiceAgent } from "@/components/ui/VoiceAgent";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

export default function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, dispatch } = useApp();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language) {
      document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);

  useEffect(() => {
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
  }, [dispatch, state.isHydrated, state.isAppLoading]);

  return (
    <>
      <LoadingScreen isLoading={state.isAppLoading} message={t('initializingSectorLink')} />
      {!state.isAppLoading && (
        <>
          <GlobalHUDFx />
          <ClimateTicker />
          <NeuralSidebar />
          <VoiceAgent />
        </>
      )}
      <main className={state.isAppLoading ? "hidden" : "block h-full w-full"}>
        {children}
      </main>
    </>
  );
}
