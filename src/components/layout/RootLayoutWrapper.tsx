"use client";

import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import LoadingScreen from "@/components/ui/LoadingScreen";
import GlobalHUDFx from "@/components/ui/GlobalHUDFx";
import ClimateTicker from "@/components/ui/ClimateTicker";
import NeuralSidebar from "@/components/ui/NeuralSidebar";
import { useTranslation } from "react-i18next";

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
    if (!state.isHydrated) return;

    // Minimum display time for the cinematic loader
    const timer = setTimeout(() => {
      dispatch({ type: "SET_APP_LOADING", payload: false });
    }, 2800);

    return () => clearTimeout(timer);
  }, [dispatch, state.isHydrated]);

  return (
    <>
      <LoadingScreen isLoading={state.isAppLoading} message={t('initializingSectorLink')} />
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
