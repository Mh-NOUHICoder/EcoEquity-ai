"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
} from "react";
import { ActiveView, CommunityReport, MapTheme, NDVIFeature, Language, AIResult } from "@/types";
import { useEffect, useRef } from "react";
import i18n from "@/lib/i18n";

const STORAGE_KEY = "eco_equity_state_v2"; // Versioned key to avoid old data issues

interface AppState {
  activeView: ActiveView;
  selectedFeature: NDVIFeature | null;
  focusCoords: [number, number] | null;
  lastMapCenter: [number, number] | null; // New persistent center
  showTreeModal: boolean;
  treeModalCoords: [number, number] | null;
  treeModalDistrict: string;
  reports: CommunityReport[];
  aiInsight: AIResult | null;
  isLoadingInsight: boolean;
  submittedRequests: number;
  avgNDVI: number | null;
  hotZones: number | null;
  mapTheme: MapTheme;
  userLocation: [number, number] | null;
  language: Language;
  isAppLoading: boolean;
  heatRiskMode: boolean;
  isHydrated: boolean;
}

type Action =
  | { type: "SET_VIEW"; payload: ActiveView }
  | { type: "SELECT_FEATURE"; payload: NDVIFeature | null }
  | { type: "SET_FOCUS_COORDS"; payload: [number, number] | null }
  | { type: "SET_MAP_CENTER"; payload: [number, number] | null } // New action
  | { type: "OPEN_TREE_MODAL"; payload: { coords: [number, number]; district: string } }
  | { type: "CLOSE_TREE_MODAL" }
  | { type: "SET_AI_INSIGHT"; payload: AIResult }
  | { type: "SET_LOADING_INSIGHT"; payload: boolean }
  | { type: "INCREMENT_REQUESTS" }
  | { type: "SET_REPORTS"; payload: CommunityReport[] }
  | { type: "ADD_REPORT"; payload: CommunityReport }
  | { type: "SET_NDVI_DATA"; payload: { avgNDVI: number; hotZones: number } }
  | { type: "SET_MAP_THEME"; payload: MapTheme }
  | { type: "SET_USER_LOCATION"; payload: [number, number] }
  | { type: "SET_LANGUAGE"; payload: Language }
  | { type: "SET_APP_LOADING"; payload: boolean }
  | { type: "TOGGLE_HEAT_RISK" }
  | { type: "HYDRATE_STATE"; payload: Partial<AppState> };

const initialState: AppState = {
  activeView: "dashboard",
  selectedFeature: null,
  focusCoords: null,
  lastMapCenter: null,
  showTreeModal: false,
  treeModalCoords: null,
  treeModalDistrict: "",
  reports: [],
  aiInsight: null,
  isLoadingInsight: false,
  submittedRequests: 0,
  avgNDVI: null,
  hotZones: null,
  mapTheme: "dark",
  userLocation: null,
  language: "en",
  isAppLoading: true,
  heatRiskMode: false,
  isHydrated: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_VIEW": return { ...state, activeView: action.payload };
    case "SELECT_FEATURE": return { ...state, selectedFeature: action.payload };
    case "SET_FOCUS_COORDS": return { ...state, focusCoords: action.payload };
    case "SET_MAP_CENTER": return { ...state, lastMapCenter: action.payload };
    case "OPEN_TREE_MODAL": return { ...state, showTreeModal: true, treeModalCoords: action.payload.coords, treeModalDistrict: action.payload.district };
    case "CLOSE_TREE_MODAL": return { ...state, showTreeModal: false };
    case "SET_AI_INSIGHT": return { ...state, aiInsight: action.payload, isLoadingInsight: false };
    case "SET_LOADING_INSIGHT": return { ...state, isLoadingInsight: action.payload };
    case "INCREMENT_REQUESTS": return { ...state, submittedRequests: state.submittedRequests + 1 };
    case "SET_REPORTS": return { ...state, reports: action.payload };
    case "ADD_REPORT": return { ...state, reports: [action.payload, ...state.reports] };
    case "SET_NDVI_DATA": return { ...state, avgNDVI: action.payload.avgNDVI, hotZones: action.payload.hotZones };
    case "SET_MAP_THEME": return { ...state, mapTheme: action.payload };
    case "SET_USER_LOCATION": return { ...state, userLocation: action.payload };
    case "SET_LANGUAGE": return { ...state, language: action.payload };
    case "SET_APP_LOADING": return { ...state, isAppLoading: action.payload };
    case "TOGGLE_HEAT_RISK": return { ...state, heatRiskMode: !state.heatRiskMode };
    case "HYDRATE_STATE": return { ...state, ...action.payload, isHydrated: true };
    default: return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    const isVal = (c: any) => Array.isArray(c) && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1]);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        dispatch({
          type: "HYDRATE_STATE",
          payload: {
            activeView: parsed.activeView || "dashboard",
            mapTheme: parsed.mapTheme || "dark",
            language: parsed.language || "en",
            userLocation: isVal(parsed.userLocation) ? parsed.userLocation : null,
            focusCoords: isVal(parsed.focusCoords) ? parsed.focusCoords : null,
            lastMapCenter: isVal(parsed.lastMapCenter) ? parsed.lastMapCenter : null,
          }
        });
      } catch (e) {
        console.error("Failed to parse saved state", e);
        dispatch({ type: "HYDRATE_STATE", payload: {} });
      }
    } else {
      dispatch({ type: "HYDRATE_STATE", payload: {} });
    }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (!state.isHydrated) return;
    
    const isVal = (c: any) => Array.isArray(c) && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1]);

    const stateToSave = {
      activeView: state.activeView,
      mapTheme: state.mapTheme,
      language: state.language,
      userLocation: isVal(state.userLocation) ? state.userLocation : null,
      focusCoords: isVal(state.focusCoords) ? state.focusCoords : null,
      lastMapCenter: isVal(state.lastMapCenter) ? state.lastMapCenter : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [state.activeView, state.mapTheme, state.language, state.userLocation, state.focusCoords, state.lastMapCenter, state.isHydrated]);

  // Sync i18n language with state
  useEffect(() => {
    if (state.language && i18n.language !== state.language) {
      i18n.changeLanguage(state.language);
    }
  }, [state.language]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}