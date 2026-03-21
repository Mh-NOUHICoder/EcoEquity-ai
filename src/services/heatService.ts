import { useAppStore, HeatZone } from '../store/useAppStore';

const MOCK_ZONES: HeatZone[] = [
  { id: 'zone-1', lat: 35.75, lng: -5.83, radius: 500, intensity: 0.82, label: 'Tangier North-East Sector' },
  { id: 'zone-2', lat: 35.76, lng: -5.81, radius: 300, intensity: 0.65, label: 'Central Urban Core' },
  { id: 'zone-3', lat: 35.74, lng: -5.82, radius: 400, intensity: 0.91, label: 'Industrial District South' },
];

export const startLiveHeatTracking = () => {
    // Initialize data
    useAppStore.getState().setHeatZones(MOCK_ZONES);

    // Simulate real-time updates every 10 seconds
    const interval = setInterval(() => {
        const { heatZones, setHeatZones, userLocation } = useAppStore.getState();
        
        const updated = heatZones.map(zone => {
            // Fluctuating intensity
            const delta = (Math.random() - 0.5) * 0.05;
            const newIntensity = Math.min(1.0, Math.max(0.1, zone.intensity + delta));
            
            // Subtle geographic drift (simulation of atmospheric shift)
            const latVar = (Math.random() - 0.5) * 0.0001;
            const lngVar = (Math.random() - 0.5) * 0.0001;
            
            return {
                ...zone,
                intensity: newIntensity,
                lat: zone.lat + latVar,
                lng: zone.lng + lngVar
            };
        });

        setHeatZones(updated);
        
        // Check if user is near a high-risk zone (Auto-Guardian logic)
        if (userLocation) {
            const nearestHighRisk = updated.find(zone => {
                const dist = Math.sqrt(Math.pow(zone.lat - userLocation.lat, 2) + Math.pow(zone.lng - userLocation.lng, 2));
                return dist < 0.005 && zone.intensity > 0.8; // Roughly 500m threshold
            });

            if (nearestHighRisk) {
                // This will be caught by the hook but we can trigger internal console logs or telemetry here
                console.log(`[HeatService] TRIGGERED: User entered danger zone: ${nearestHighRisk.label}`);
            }
        }
    }, 10000);

    return () => clearInterval(interval);
};
