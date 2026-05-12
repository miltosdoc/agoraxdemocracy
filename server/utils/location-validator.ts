/**
 * Location validation utilities for poll restrictions
 * Simplified for GPS-only implementation (no country/region/city hierarchy)
 */
import { Poll, User } from "../../shared/schema";

/**
 * Validates if a user is eligible to participate in a poll based on location restrictions
 * @param poll The poll to check eligibility for
 * @param user The user attempting to participate
 * @returns boolean indicating if the user is eligible, and a message explaining why if not
 */
export function isUserEligibleForPoll(poll: Poll, user: User): { isEligible: boolean; message?: string } {
  console.log("[Location Validation] Starting eligibility check");
  console.log("[Location Validation] Poll:", {
    id: poll.id,
    title: poll.title,
    locationScope: poll.locationScope,
    centerLat: poll.centerLat,
    centerLng: poll.centerLng,
    radiusKm: poll.radiusKm
  });
  console.log("[Location Validation] User:", {
    id: user.id,
    username: user.username,
    latitude: user.latitude,
    longitude: user.longitude,
    locationConfirmed: user.locationConfirmed
  });
  
  // If poll has no location restrictions, user is eligible
  if (!poll.locationScope || poll.locationScope === 'global') {
    console.log("[Location Validation] Poll has no location restrictions");
    return { isEligible: true };
  }
  
  // If user has not confirmed their location, they are not eligible
  if (!user.locationConfirmed) {
    console.log("[Location Validation] User has not confirmed their location");
    return { 
      isEligible: false, 
      message: "Πρέπει να επιβεβαιώσετε την τοποθεσία σας για να συμμετάσχετε σε αυτή την ψηφοφορία" 
    };
  }

  // Check geofence restriction (GPS coordinates)
  if (poll.locationScope === 'geofenced' && poll.centerLat && poll.centerLng && poll.radiusKm) {
    // User must have GPS coordinates to participate in geofence polls
    if (!user.latitude || !user.longitude) {
      return { 
        isEligible: false, 
        message: "Η ψηφοφορία αυτή απαιτεί εντοπισμό GPS. Παρακαλώ ενημερώστε την τοποθεσία σας." 
      };
    }

    // Calculate the distance between the user and the poll center
    const distance = calculateDistance(
      parseFloat(user.latitude), 
      parseFloat(user.longitude),
      parseFloat(poll.centerLat),
      parseFloat(poll.centerLng)
    );

    // Check if user is within the geofence radius
    if (distance > poll.radiusKm) {
      return { 
        isEligible: false, 
        message: `Δεν βρίσκεστε εντός της περιοχής της ψηφοφορίας (${Math.round(distance - poll.radiusKm)}km μακριά)` 
      };
    }

    return { isEligible: true };
  }

  // If all checks pass or locationScope is not recognized, user is eligible
  return { isEligible: true };
}

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of first point in decimal degrees
 * @param lon1 Longitude of first point in decimal degrees
 * @param lat2 Latitude of second point in decimal degrees
 * @param lon2 Longitude of second point in decimal degrees
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert degrees to radians
  const toRad = (deg: number): number => deg * Math.PI / 180;
  
  // Get differences in radians
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in kilometers
  return R * c;
}
import { z } from 'zod';

/**
 * Zod schema for location validation.
 */
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

/**
 * Verify location data against the schema.
 * @param data - Location data to validate
 * @returns Validation result
 */
export function verifyLocationSchema(data: unknown): { success: boolean; data?: any; error?: string } {
  const result = locationSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}
