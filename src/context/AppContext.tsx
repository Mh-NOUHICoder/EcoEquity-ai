"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
} from "react";
import { ActiveView, CommunityReport, MapTheme, NDVIFeature } from "@/types";

interface AppState {
  activeView: ActiveView;
  selectedFeature: NDVIFeature | null;
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
}

type Action =
  | { type: "SET_VIEW"; payload: ActiveView }
  | { type: "SELECT_FEATURE"; payload: NDVIFeature | null }
  | { type: "OPEN_TREE_MODAL"; payload: { coords: [number, number]; district: string } }
  | { type: "CLOSE_TREE_MODAL" }
  | { type: "SET_AI_INSIGHT"; payload: string }
  | { type: "SET_LOADING_INSIGHT"; payload: boolean }
  | { type: "INCREMENT_REQUESTS" }
  | { type: "SET_REPORTS"; payload: CommunityReport[] }
  | { type: "SET_NDVI_DATA"; payload: { avgNDVI: number; hotZones: number } }
  | { type: "SET_MAP_THEME"; payload: MapTheme };

const initialState: AppState = {
  activeView: "dashboard",
  selectedFeature: null,
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
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_VIEW": return { ...state, activeView: action.payload };
    case "SELECT_FEATURE": return { ...state, selectedFeature: action.payload };
    case "OPEN_TREE_MODAL": return { ...state, showTreeModal: true, treeModalCoords: action.payload.coords, treeModalDistrict: action.payload.district };
    case "CLOSE_TREE_MODAL": return { ...state, showTreeModal: false };
    case "SET_AI_INSIGHT": return { ...state, aiInsight: action.payload, isLoadingInsight: false };
    case "SET_LOADING_INSIGHT": return { ...state, isLoadingInsight: action.payload };
    case "INCREMENT_REQUESTS": return { ...state, submittedRequests: state.submittedRequests + 1 };
    case "SET_REPORTS": return { ...state, reports: action.payload };
    case "SET_NDVI_DATA": return { ...state, avgNDVI: action.payload.avgNDVI, hotZones: action.payload.hotZones };
    case "SET_MAP_THEME": return { ...state, mapTheme: action.payload };
    default: return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
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