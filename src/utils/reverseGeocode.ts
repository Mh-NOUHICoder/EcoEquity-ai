export interface GeocodeResult {
    name: string;
    isGreenSpace: boolean;
    isWater: boolean;
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult> {
    const fallback = `${lat.toFixed(3)}N/${lon.toFixed(3)}E`;
    const result: GeocodeResult = { name: fallback, isGreenSpace: false, isWater: false };
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
        if (!response.ok) return result;
        
        const data = await response.json();
        
        // Accurate real-world terrain detection via OSM classes/types
        const isGreen = 
            data?.class === 'leisure' && ['park', 'garden', 'nature_reserve', 'golf_course'].includes(data.type) ||
            data?.class === 'natural' && ['wood', 'scrub', 'heath', 'grassland', 'forest'].includes(data.type) ||
            data?.class === 'landuse' && ['forest', 'grass', 'meadow', 'orchard', 'village_green', 'recreation_ground'].includes(data.type);
            
        const isWater = 
            data?.class === 'natural' && ['water', 'beach', 'coastline'].includes(data.type) ||
            data?.class === 'waterway';
            
        if (isGreen) result.isGreenSpace = true;
        if (isWater) result.isWater = true;
        
        if (data && data.address) {
            const addr = data.address;
            const place = addr.road || addr.park || addr.forest || addr.neighbourhood || addr.suburb || addr.city_district || addr.city || addr.town || addr.village;
            if (place) {
                result.name = place;
                return result;
            }
        }
        
        if (data.display_name) {
            result.name = data.display_name.split(',')[0];
        }
        
        return result;
    } catch (error) {
        console.error("Reverse geocoding failed", error);
        return result;
    }
}
