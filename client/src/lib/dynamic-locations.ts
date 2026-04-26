/**
 * Geographic location information
 */
export interface LocationInfo {
  id: string;
  name: string;
  type: 'country' | 'region' | 'city';
  parentId?: string; // For hierarchy (regions have country as parent, cities have region as parent)
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Cache to store already fetched location info
 */
interface LocationCache {
  byId: Record<string, LocationInfo>;
  countries: string[]; // IDs of countries
  regionsByCountry: Record<string, string[]>; // country ID -> region IDs
  citiesByRegion: Record<string, string[]>; // region ID -> city IDs
  locationPromises: Record<string, Promise<LocationInfo | null>>;
}

// In-memory cache
const locationCache: LocationCache = {
  byId: {},
  countries: [],
  regionsByCountry: {},
  citiesByRegion: {},
  locationPromises: {},
};

/**
 * Check if a string is valid for use as a location
 */
const isValidLocationString = (str: string | null | undefined): boolean => {
  return !!str && str.trim().length > 0;
};

/**
 * Create a standardized ID from location names
 */
const createLocationId = (name: string, type: string): string => {
  return `${type}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
};

/**
 * Reverse geocode coordinates to get location details
 */
export const reverseGeocodePoll = async (
  pollId: number,
  latitude: string | null,
  longitude: string | null
): Promise<{
  country?: LocationInfo;
  region?: LocationInfo;
  city?: LocationInfo;
} | null> => {
  if (!latitude || !longitude) return null;
  
  const cacheKey = `poll_${pollId}`;
  
  // Check if we have a promise in the cache
  if (cacheKey in locationCache.locationPromises) {
    try {
      await locationCache.locationPromises[cacheKey];
      // Return data from cache if available
      const countryId = Object.keys(locationCache.byId).find(id => 
        id.startsWith('country_') && 
        locationCache.byId[id].coordinates?.lat === parseFloat(latitude) && 
        locationCache.byId[id].coordinates?.lng === parseFloat(longitude)
      );
      
      if (countryId) {
        const country = locationCache.byId[countryId];
        const regionIds = locationCache.regionsByCountry[countryId] || [];
        const region = regionIds.length > 0 ? locationCache.byId[regionIds[0]] : undefined;
        const cityIds = region ? locationCache.citiesByRegion[region.id] || [] : [];
        const city = cityIds.length > 0 ? locationCache.byId[cityIds[0]] : undefined;
        
        return { country, region, city };
      }
    } catch (error) {
      console.error("Error retrieving cached location data:", error);
    }
  }
  
  // Fetch new data
  const geocodePromise = fetchLocationFromCoordinates(parseFloat(latitude), parseFloat(longitude));
  // Type assertion to fix TypeScript error
  locationCache.locationPromises[cacheKey] = geocodePromise as unknown as Promise<LocationInfo | null>;
  
  try {
    const locationData = await geocodePromise;
    if (!locationData) return null;
    
    // Cache the results
    if (locationData.country) {
      const countryId = locationData.country.id;
      locationCache.byId[countryId] = locationData.country;
      
      if (!locationCache.countries.includes(countryId)) {
        locationCache.countries.push(countryId);
      }
      
      if (locationData.region) {
        const regionId = locationData.region.id;
        locationCache.byId[regionId] = locationData.region;
        
        if (!locationCache.regionsByCountry[countryId]) {
          locationCache.regionsByCountry[countryId] = [];
        }
        
        if (!locationCache.regionsByCountry[countryId].includes(regionId)) {
          locationCache.regionsByCountry[countryId].push(regionId);
        }
        
        if (locationData.city) {
          const cityId = locationData.city.id;
          locationCache.byId[cityId] = locationData.city;
          
          if (!locationCache.citiesByRegion[regionId]) {
            locationCache.citiesByRegion[regionId] = [];
          }
          
          if (!locationCache.citiesByRegion[regionId].includes(cityId)) {
            locationCache.citiesByRegion[regionId].push(cityId);
          }
        }
      }
    }
    
    return locationData;
  } catch (error) {
    console.error("Error in reverseGeocodePoll:", error);
    return null;
  }
};

/**
 * Fetch location information from coordinates
 */
async function fetchLocationFromCoordinates(lat: number, lng: number): Promise<{
  country?: LocationInfo;
  region?: LocationInfo;
  city?: LocationInfo;
} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      {
        headers: {
          'Accept-Language': navigator.language, // Use browser language
          'User-Agent': 'AgoraX-Democracy-Platform',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data?.address) {
      throw new Error('Invalid geocoding response');
    }
    
    const result: { country?: LocationInfo; region?: LocationInfo; city?: LocationInfo } = {};
    
    // Extract country
    if (isValidLocationString(data.address.country)) {
      const countryName = data.address.country as string;
      const countryId = createLocationId(countryName, 'country');
      
      result.country = {
        id: countryId,
        name: countryName,
        type: 'country',
        coordinates: { lat, lng }
      };
    }
    
    // Extract region (state, county, province, etc.)
    if (isValidLocationString(data.address.state) || 
        isValidLocationString(data.address.county) || 
        isValidLocationString(data.address.region)) {
      const regionName = (data.address.state || data.address.county || data.address.region) as string;
      const regionId = createLocationId(regionName, 'region');
      
      result.region = {
        id: regionId,
        name: regionName,
        type: 'region',
        parentId: result.country?.id,
        coordinates: { lat, lng }
      };
    }
    
    // Extract city/town/village
    if (isValidLocationString(data.address.city) || 
        isValidLocationString(data.address.town) || 
        isValidLocationString(data.address.village) ||
        isValidLocationString(data.address.municipality)) {
      const cityName = (data.address.city || 
                       data.address.town || 
                       data.address.village || 
                       data.address.municipality) as string;
      const cityId = createLocationId(cityName, 'city');
      
      result.city = {
        id: cityId,
        name: cityName,
        type: 'city',
        parentId: result.region?.id,
        coordinates: { lat, lng }
      };
    }
    
    return result;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// Return type for getDynamicLocationData
export interface LocationData {
  countries: LocationInfo[];
  regions: LocationInfo[];
  cities: LocationInfo[];
  getRegionsByCountry: (countryId: string) => LocationInfo[];
  getCitiesByRegion: (regionId: string) => LocationInfo[];
}

/**
 * Get all dynamic location data (countries, regions, cities) from the cache
 */
export const getDynamicLocationData = (): LocationData => {
  return {
    countries: locationCache.countries.map(id => locationCache.byId[id]),
    regions: Object.values(locationCache.byId).filter(loc => loc.type === 'region'),
    cities: Object.values(locationCache.byId).filter(loc => loc.type === 'city'),
    getRegionsByCountry: (countryId: string) => 
      (locationCache.regionsByCountry[countryId] || []).map(id => locationCache.byId[id]),
    getCitiesByRegion: (regionId: string) => 
      (locationCache.citiesByRegion[regionId] || []).map(id => locationCache.byId[id])
  };
};

/**
 * Process polls to extract location information from coordinates or explicit fields
 */
export const processPollsForLocations = async (polls: any[]): Promise<LocationData> => {
  try {
    // Process polls with explicit location info first
    const pollsWithExplicitLocations = polls.filter(poll => 
      poll.locationScope === 'geofenced' && 
      (
        (poll.locationCountry && poll.locationCountry.trim() !== '') ||
        (poll.locationRegion && poll.locationRegion.trim() !== '') ||
        (poll.locationCity && poll.locationCity.trim() !== '') ||
        (poll.country && poll.country.trim() !== '') ||
        (poll.region && poll.region.trim() !== '') ||
        (poll.city && poll.city.trim() !== '')
      )
    );

    // Process these explicit locations into our cache
    pollsWithExplicitLocations.forEach(poll => {
      const countryName = poll.locationCountry || poll.country;
      const regionName = poll.locationRegion || poll.region;
      const cityName = poll.locationCity || poll.city;
      
      if (countryName && countryName.trim() !== '') {
        const countryId = createLocationId(countryName, 'country');
        
        // Add country if it doesn't exist
        if (!locationCache.byId[countryId]) {
          locationCache.byId[countryId] = {
            id: countryId,
            name: countryName,
            type: 'country'
          };
          
          if (!locationCache.countries.includes(countryId)) {
            locationCache.countries.push(countryId);
          }
        }
        
        // Add region if it exists
        if (regionName && regionName.trim() !== '') {
          const regionId = createLocationId(regionName, 'region');
          
          if (!locationCache.byId[regionId]) {
            locationCache.byId[regionId] = {
              id: regionId,
              name: regionName,
              type: 'region',
              parentId: countryId
            };
          }
          
          if (!locationCache.regionsByCountry[countryId]) {
            locationCache.regionsByCountry[countryId] = [];
          }
          
          if (!locationCache.regionsByCountry[countryId].includes(regionId)) {
            locationCache.regionsByCountry[countryId].push(regionId);
          }
          
          // Add city if it exists
          if (cityName && cityName.trim() !== '') {
            const cityId = createLocationId(cityName, 'city');
            
            if (!locationCache.byId[cityId]) {
              locationCache.byId[cityId] = {
                id: cityId,
                name: cityName,
                type: 'city',
                parentId: regionId
              };
            }
            
            if (!locationCache.citiesByRegion[regionId]) {
              locationCache.citiesByRegion[regionId] = [];
            }
            
            if (!locationCache.citiesByRegion[regionId].includes(cityId)) {
              locationCache.citiesByRegion[regionId].push(cityId);
            }
          }
        }
      }
    });
    
    // Process polls that have coordinates but no explicit location fields
    const geofencedPollsWithCoordinates = polls.filter(poll => 
      poll.locationScope === 'geofenced' && 
      poll.centerLat && 
      poll.centerLng &&
      !poll.locationCountry && 
      !poll.locationRegion && 
      !poll.locationCity &&
      !poll.country &&
      !poll.region &&
      !poll.city
    );
    
    if (geofencedPollsWithCoordinates.length > 0) {
      // Fetch location data for each poll
      await Promise.all(
        geofencedPollsWithCoordinates.map(poll => 
          reverseGeocodePoll(poll.id, poll.centerLat, poll.centerLng)
        )
      );
    }
    
    // Return current location data (whether or not we added new data)
    return getDynamicLocationData();
  } catch (error) {
    console.error("Error processing polls for locations:", error);
    // Return empty data structure on error
    return {
      countries: [],
      regions: [],
      cities: [],
      getRegionsByCountry: () => [],
      getCitiesByRegion: () => []
    };
  }
};