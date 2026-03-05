"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
} from "react";
import { ActiveView, CommunityReport, MapTheme, NDVIFeature, Language } from "@/types";
import { useEffect, useRef } from "react";

const STORAGE_KEY = "eco_equity_state";

interface AppState {
  activeView: ActiveView;
  selectedFeature: NDVIFeature | null;
  focusCoords: [number, number] | null;
  showTreeModal: boolean;
  treeModalCoords: [number, number] | null;
  treeModalDistrict: string;
  reports: CommunityReport[];
  aiInsight: string | null;
  isLoadingInsight: boolean;
  submittedRequests: number;
  avgNDVI: number | null;
  hotZones: number | null;
  mapTheme: MapTheme;
  userLocation: [number, number] | null;
  language: Language;
  isAppLoading: boolean;
  heatRiskMode: boolean;
}

type Action =
  | { type: "SET_VIEW"; payload: ActiveView }
  | { type: "SELECT_FEATURE"; payload: NDVIFeature | null }
  | { type: "SET_FOCUS_COORDS"; payload: [number, number] | null }
  | { type: "OPEN_TREE_MODAL"; payload: { coords: [number, number]; district: string } }
  | { type: "CLOSE_TREE_MODAL" }
  | { type: "SET_AI_INSIGHT"; payload: string }
  | { type: "SET_LOADING_INSIGHT"; payload: boolean }
  | { type: "INCREMENT_REQUESTS" }
  | { type: "SET_REPORTS"; payload: CommunityReport[] }
  | { type: "ADD_REPORT"; payload: CommunityReport }
  | { type: "SET_NDVI_DATA"; payload: { avgNDVI: number; hotZones: number } }
  | { type: "SET_MAP_THEME"; payload: MapTheme }
  | { type: "SET_USER_LOCATION"; payload: [number, number] }
  | { type: "SET_LANGUAGE"; payload: Language }
  | { type: "SET_APP_LOADING"; payload: boolean }
  | { type: "TOGGLE_HEAT_RISK" };

const initialState: AppState = {
  activeView: "dashboard",
  selectedFeature: null,
  focusCoords: null,
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
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_VIEW": return { ...state, activeView: action.payload };
    case "SELECT_FEATURE": return { ...state, selectedFeature: action.payload };
    case "SET_FOCUS_COORDS": return { ...state, focusCoords: action.payload };
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
    default: return state;
  }
}


const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const isHydrated = useRef(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.activeView) dispatch({ type: "SET_VIEW", payload: parsed.activeView });
        if (parsed.mapTheme) dispatch({ type: "SET_MAP_THEME", payload: parsed.mapTheme });
        if (parsed.language) dispatch({ type: "SET_LANGUAGE", payload: parsed.language });
        if (parsed.userLocation) dispatch({ type: "SET_USER_LOCATION", payload: parsed.userLocation });
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    isHydrated.current = true;
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (!isHydrated.current) return;
    
    const stateToSave = {
      activeView: state.activeView,
      mapTheme: state.mapTheme,
      language: state.language,
      userLocation: state.userLocation,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [state.activeView, state.mapTheme, state.language, state.userLocation]);

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