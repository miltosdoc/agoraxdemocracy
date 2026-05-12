import fetch from 'node-fetch';

/**
 * Location information returned from reverse geocoding
 */
export interface LocationInfo {
  city?: string;
  region?: string;
  country?: string;
  cityId?: string;
  regionId?: string;
  countryId?: string;
}

/**
 * Convert a name to a standardized ID format
 */
function convertToId(name: string | undefined): string {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');     // Remove leading/trailing hyphens
}

/**
 * Reverse geocode coordinates to location information
 * Uses OpenStreetMap Nominatim API
 * 
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @returns Location information or null if geocoding failed
 */
export async function reverseGeocode(
  latitude: string | number | null | undefined, 
  longitude: string | number | null | undefined
): Promise<LocationInfo | null> {
  if (!latitude || !longitude) return null;
  
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
  
  if (isNaN(lat) || isNaN(lng)) return null;
  
  try {
    // Make request for English names (for standardized IDs)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      {
        headers: {
          'Accept-Language': 'en', // Always get English for standardized processing
          'User-Agent': 'AgoraX-Democracy-Platform',
        }
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as any;
    
    if (!data || !data.address) {
      return null;
    }

    // Extract location components from the response
    const city = data.address.city || 
                 data.address.town || 
                 data.address.village ||
                 data.address.municipality;
                 
    const region = data.address.state || 
                   data.address.county || 
                   data.address.region;
                   
    const country = data.address.country;
    
    // Create standardized IDs
    const cityId = convertToId(city);
    const regionId = convertToId(region);
    const countryId = data.address.country_code?.toUpperCase() || convertToId(country);
    
    return {
      city,
      region,
      country,
      cityId,
      regionId,
      countryId
    };
  } catch (error) {
    return null;
  }
}