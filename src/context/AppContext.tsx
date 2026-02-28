"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
} from "react";
import { ActiveView, CommunityReport, MapTheme, NDVIFeature, Language } from "@/types";

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
  | { type: "SET_LANGUAGE"; payload: Language };

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