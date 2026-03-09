export async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
        if (!response.ok) return `${lat.toFixed(3)}N/${lon.toFixed(3)}E`;
        
        const data = await response.json();
        
        if (data && data.address) {
            const addr = data.address;
            const place = addr.road || addr.neighbourhood || addr.suburb || addr.city_district || addr.city || addr.town || addr.village;
            if (place) {
                return place;
            }
        }
        
        return data.display_name?.split(',')[0] || `${lat.toFixed(3)}N/${lon.toFixed(3)}E`;
    } catch (error) {
        console.error("Reverse geocoding failed", error);
        return `${lat.toFixed(3)}N/${lon.toFixed(3)}E`;
    }
}
