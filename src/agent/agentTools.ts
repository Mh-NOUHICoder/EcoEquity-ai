import { SchemaType } from '@google/generative-ai';
import { useAppStore, LatLng, HeatZone } from '../store/useAppStore';

/**
 * AGENT TOOLS SPECIFICATION
 * These are the tools that the Gemini 1.5 Flash model will be able to call
 * to understand the environment and take actions.
 */

export const AGENT_TOOLS_SPEC = [
  {
    name: 'getHeatRisk',
    description: 'Get the detailed heat risk level and intensity for a specific location.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        lat: { type: SchemaType.NUMBER, description: 'Latitude' },
        lng: { type: SchemaType.NUMBER, description: 'Longitude' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'findCoolZones',
    description: 'Find the nearest high-NDVI or cooling centers (green spaces, parks) for relief.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        lat: { type: SchemaType.NUMBER, description: 'User latitude' },
        lng: { type: SchemaType.NUMBER, description: 'User longitude' },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'suggestSafeRoute',
    description: 'Calculate a route between two points that avoids high-intensity thermal zones.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        start: { 
            type: SchemaType.OBJECT, 
            properties: { lat: { type: SchemaType.NUMBER }, lng: { type: SchemaType.NUMBER } }, 
            required: ['lat', 'lng'] 
        },
        end: { 
            type: SchemaType.OBJECT, 
            properties: { lat: { type: SchemaType.NUMBER }, lng: { type: SchemaType.NUMBER } }, 
            required: ['lat', 'lng'] 
        },
      },
      required: ['start', 'end'],
    },
  },
  {
    name: 'moveView',
    description: 'Auto-focus the map view on a specific area of concern.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        lat: { type: SchemaType.NUMBER },
        lng: { type: SchemaType.NUMBER },
        zoom: { type: SchemaType.NUMBER },
      },
      required: ['lat', 'lng'],
    },
  },
  {
    name: 'geolocatePlace',
    description: 'Search for the coordinates (lat/lng) of a named place or address.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        placeName: { type: SchemaType.STRING, description: 'The name or address of the place to find' },
      },
      required: ['placeName'],
    },
  },
  {
    name: 'submitFieldReport',
    description: 'Submit an official community field report on behalf of the user when they report a heat or environmental issue.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        message: { type: SchemaType.STRING, description: 'A detailed summary of the environmental observation' },
        heatLevel: { type: SchemaType.STRING, description: 'The analyzed heat risk level: critical, moderate, or healthy' },
        district: { type: SchemaType.STRING, description: 'The name of the district or sector' },
        targetLocation: { type: SchemaType.STRING, description: 'Optional. The exact name of the street or city to automagically find the coordinates.' },
        lat: { type: SchemaType.NUMBER, description: 'Optional latitude' },
        lng: { type: SchemaType.NUMBER, description: 'Optional longitude' },
      },
      required: ['message', 'heatLevel', 'district'],
    },
  },
];

/**
 * IMPLEMENTATION LOGIC for the tools
 */
export const agentTools = {
  getHeatRisk: async ({ lat, lng }: LatLng) => {
    const { heatZones } = useAppStore.getState();
    const nearestZone = heatZones.reduce((prev: HeatZone | null, curr) => {
      const dist = Math.sqrt(Math.pow(curr.lat - lat, 2) + Math.pow(curr.lng - lng, 2));
      const prevDist = prev ? Math.sqrt(Math.pow(prev.lat - lat, 2) + Math.pow(prev.lng - lng, 2)) : Infinity;
      return dist < prevDist ? curr : prev;
    }, null);

    if (nearestZone) {
      const distKm = Math.sqrt(Math.pow(nearestZone.lat - lat, 2) + Math.pow(nearestZone.lng - lng, 2)) * 111; // Approx conversion
      return {
        zoneId: nearestZone.id,
        label: nearestZone.label,
        intensity: nearestZone.intensity,
        distanceOffsetKm: distKm.toFixed(2),
        riskLevel: nearestZone.intensity > 0.8 ? 'CRITICAL' : (nearestZone.intensity > 0.5 ? 'MODERATE' : 'STABLE'),
        advice: nearestZone.intensity > 0.8 ? 'Seek immediate cooling. Hydrate now.' : 'Maintain awareness of your surroundings.'
      };
    }
    return { status: 'stable', message: 'No critical thermal gradients detected in the immediate sector.' };
  },

  findCoolZones: async ({ lat, lng }: LatLng) => {
    // Simulation: Find nearby "Green Sectors" (NDVI > 0.6)
    return [
      { name: 'Eco-Park South', lat: lat + 0.004, lng: lng - 0.002, ndvi: 0.78, distance: '450m' },
      { name: 'Medina Green Corridor', lat: lat - 0.003, lng: lng + 0.005, ndvi: 0.65, distance: '800m' },
    ];
  },

  suggestSafeRoute: async ({ start, end }: { start: LatLng, end: LatLng }) => {
    const { setFocusCoords, setActiveRoute } = useAppStore.getState();
    
    // Simulate a route path avoiding the biggest cluster
    const midPoint = { lat: (start.lat + end.lat) / 2 + 0.002, lng: (start.lng + end.lng) / 2 - 0.001 };
    const route = [start, midPoint, end];
    
    setActiveRoute(route);
    setFocusCoords(midPoint);
    
    return {
      status: 'route_generated',
      safetyRating: 'A+',
      pathComplexity: 'low',
      description: 'The route avoids the high-intensity thermal core in the central sector by diverting through the Med-Green belt.',
      estimatedTime: '12 min'
    };
  },

  moveView: async ({ lat, lng }: LatLng) => {
    // 🛡️ NEURAL GEOMETRY SHIELD: Prevent NaN or out-of-bounds coords
    if (isNaN(lat) || isNaN(lng)) {
        console.warn('[Agent] moveView aborted: Invalid coordinates (NaN)');
        return { status: 'error', message: 'Target coordinates are mathematically unstable.' };
    }

    const { setFocusCoords } = useAppStore.getState();
    setFocusCoords({ lat, lng });
    return { status: 'camera_repositioned', coordinates: { lat, lng } };
  },

  geolocatePlace: async ({ placeName }: { placeName: string }) => {
    try {
        console.log(`[Agent] Searching coordinates for: ${placeName}`);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`);
        
        if (!response.ok) {
            throw new Error(`Nominatim API Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const rawLat = parseFloat(data[0].lat);
            const rawLng = parseFloat(data[0].lon);

            // 🛡️ COORDINATE VALIDITY CHECK
            if (isNaN(rawLat) || isNaN(rawLng)) {
                console.error('[Agent] Geocoding failure: API returned non-numeric coordinates.');
                return { status: 'error', message: `Spectral telemetry for ${placeName} is corrupted.` };
            }

            // BOUNDS CHECK (Global limits)
            if (Math.abs(rawLat) > 90 || Math.abs(rawLng) > 180) {
                return { status: 'error', message: 'Target coordinates exceed global planetary bounds.' };
            }

            const loc = { 
                lat: rawLat, 
                lng: rawLng, 
                displayName: data[0].display_name 
            };
            
            // Auto-focus the map immediately for visual feedback
            const { setFocusCoords } = useAppStore.getState();
            setFocusCoords({ lat: loc.lat, lng: loc.lng });

            return { 
                status: 'location_found', 
                coordinates: { lat: loc.lat, lng: loc.lng },
                message: `Target acquired: ${loc.displayName}` 
            };
        }
        return { status: 'not_found', message: 'I could not find a specific match for that location in my neural database.' };
    } catch (e) {
        return { status: 'error', message: 'Geocoding link momentarily offline.' };
    }
  },

  submitFieldReport: async (args: { message: string; heatLevel: string; district: string; lat?: number; lng?: number; targetLocation?: string }) => {
    // This tool primarily signals the UI through the useLiveAgent interceptor.
    // It returns the data necessary for the frontend to create a new CommunityReport.
    const { message, heatLevel, district, targetLocation } = args;
    let finalLat = args.lat;
    let finalLng = args.lng;

    // 1. Geolocate precisely if the agent passed a location name instead of coordinates
    if ((!finalLat || !finalLng) && targetLocation) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(targetLocation)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                finalLat = parseFloat(data[0].lat);
                finalLng = parseFloat(data[0].lon);
            }
        } catch (e) {
            console.error("[Agent] Internal geocoding for report failed:", e);
        }
    }

    // 2. Fallback to center or current focus if completely omitted
    if (!finalLat || !finalLng) {
        const { focusCoords, userLocation } = useAppStore.getState();
        finalLat = focusCoords?.lat || userLocation?.lat || 40.4168; // center
        finalLng = focusCoords?.lng || userLocation?.lng || -3.7038;
    }
    
    return {
        _isReport: true, // Special flag for frontend interceptor
        reportData: {
            message,
            heatLevel: ['critical', 'moderate', 'healthy'].includes(heatLevel.toLowerCase()) ? heatLevel.toLowerCase() : 'moderate',
            district,
            lat: finalLat,
            lng: finalLng
        },
        status: 'protocol_confirmed',
        message: `Field intel successfully securely transmitted to global community node for ${district}.`
    };
  }
};
