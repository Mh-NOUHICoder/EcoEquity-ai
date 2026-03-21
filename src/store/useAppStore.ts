import { create } from 'zustand';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AgentMessage {
  id: string;
  role: 'agent' | 'user';
  text: string;
  status?: 'monitoring' | 'alert' | 'action';
  timestamp: number;
}

export interface HeatZone {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  intensity: number; // 0-1
  label: string;
}

interface AppState {
  // User Location
  userLocation: LatLng | null;
  setUserLocation: (loc: LatLng) => void;

  // Heat Data
  heatZones: HeatZone[];
  setHeatZones: (zones: HeatZone[]) => void;
  updateHeatZone: (id: string, intensity: number) => void;

  // Agent State
  agentStatus: 'idle' | 'monitoring' | 'alert' | 'processing' | 'action';
  setAgentStatus: (status: AppState['agentStatus']) => void;
  
  agentMessages: AgentMessage[];
  addAgentMessage: (msg: Omit<AgentMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Heat Guardian Mode
  heatGuardianMode: boolean;
  toggleHeatGuardianMode: () => void;

  // Map Controls
  focusCoords: LatLng | null;
  setFocusCoords: (coords: LatLng | null) => void;
  
  activeRoute: LatLng[] | null;
  setActiveRoute: (route: LatLng[] | null) => void;

  // Neural Connection
  agentError: string | null;
  setAgentError: (error: string | null) => void;
  isAgentProcessing: boolean;
  setIsAgentProcessing: (processing: boolean) => void;
  
  // Model Selection
  activeModel: string;
  setActiveModel: (model: string) => void;

  // Voice State
  agentMuted: boolean;
  setAgentMuted: (muted: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  userLocation: null,
  setUserLocation: (loc) => set({ userLocation: loc }),

  heatZones: [],
  setHeatZones: (zones) => set({ heatZones: zones }),
  updateHeatZone: (id, intensity) => set((state) => ({
    heatZones: state.heatZones.map((z) => z.id === id ? { ...z, intensity } : z)
  })),

  agentStatus: 'idle',
  setAgentStatus: (agentStatus) => set({ agentStatus }),

  agentMessages: [],
  addAgentMessage: (msg) => set((state) => ({
    agentMessages: [
      ...state.agentMessages,
      { ...msg, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }
    ]
  })),
  clearMessages: () => set({ agentMessages: [] }),

  heatGuardianMode: false,
  toggleHeatGuardianMode: () => set((state) => ({ heatGuardianMode: !state.heatGuardianMode })),

  focusCoords: null,
  setFocusCoords: (focusCoords) => set({ focusCoords }),

  activeRoute: null,
  setActiveRoute: (activeRoute) => set({ activeRoute }),

  agentError: null,
  setAgentError: (error) => set({ agentError: error }),
  isAgentProcessing: false,
  setIsAgentProcessing: (isAgentProcessing) => set({ isAgentProcessing }),
  
  activeModel: 'gemini-1.5-flash',
  setActiveModel: (activeModel) => set({ activeModel }),

  agentMuted: false,
  setAgentMuted: (agentMuted) => set({ agentMuted }),
}));
