import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, MapPin, Navigation, Crosshair } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { reverseGeocode, LocationInfo } from "@/lib/geofencing";
import { GeofenceMap } from "@/components/map/geofence-map";

interface LocationData {
  // Display information (from reverse geocoding)
  locationDescription?: string;
  
  // Coordinates (primary data for GPS-based approach)
  latitude?: string;
  longitude?: string;
  
  // State
  locationConfirmed?: boolean;
}

export function LocationDetector({ onComplete }: { onComplete?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>({
    // Display information from reverse geocoding
    locationDescription: "",
    
    // Coordinates (primary data for GPS-based approach)
    latitude: user?.latitude || "",
    longitude: user?.longitude || "",
    
    // State
    locationConfirmed: user?.locationConfirmed || false
  });
  const [error, setError] = useState<string | null>(null);
  
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [isGpsLocation, setIsGpsLocation] = useState<boolean>(
    !!(user?.latitude && user?.longitude)
  );

  // Effect to check if user's location is already confirmed
  useEffect(() => {
    if (user?.locationConfirmed) {
      setLocationData({
        // Location description will be generated from coordinates if available
        locationDescription: "",
        
        // Coordinates
        latitude: user.latitude || "",
        longitude: user.longitude || "",
        
        // State
        locationConfirmed: true
      });
      
      // If coordinates are available, try to get a human-readable location description
      if (user.latitude && user.longitude) {
        setIsGpsLocation(true);
        reverseGeocode(parseFloat(user.latitude), parseFloat(user.longitude))
          .then(locationInfo => {
            if (locationInfo) {
              const description = [
                locationInfo.city,
                locationInfo.region,
                locationInfo.country
              ].filter(Boolean).join(", ");
              
              setLocationData(prev => ({
                ...prev,
                locationDescription: description
              }));
            }
          })
          .catch(err => console.error("Error getting location description:", err));
      } else {
        setIsGpsLocation(false);
      }
    }
  }, [user]);

  // Function to detect user's location using browser geolocation API
  const detectLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error(t("Geolocation is not supported by your browser"));
      }

      // Get user's position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            // Use reverse geocoding to get a human-readable description of the location
            const locationInfo = await reverseGeocode(latitude, longitude);
            
            // Create location data with GPS coordinates
            const updatedLocationData: LocationData = {
              // Coordinates (primary data for GPS-based approach)
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              locationConfirmed: true
            };
            
            // Add human-readable description if available
            if (locationInfo) {
              const description = [
                locationInfo.city, 
                locationInfo.region,
                locationInfo.country
              ].filter(Boolean).join(", ");
              
              updatedLocationData.locationDescription = description;
            }

            // Update state with coordinates and description
            setLocationData(updatedLocationData);

            // Save location to server
            await updateUserLocation(updatedLocationData);
            
            // Update the isGpsLocation state
            setIsGpsLocation(true);

            toast({
              title: t("Location Detected"),
              description: t("Your location has been updated successfully"),
            });

            if (onComplete) {
              onComplete();
            }
          } catch (error: any) {
            setError(error.message || t("Failed to process location data"));
            setLoading(false);
          }
        },
        (geoError) => {
          let errorMessage;
          switch (geoError.code) {
            case 1:
              errorMessage = t("Location access denied. Please enable location services.");
              break;
            case 2:
              errorMessage = t("Location unavailable. Please try again later.");
              break;
            case 3:
              errorMessage = t("Location request timed out. Please try again.");
              break;
            default:
              errorMessage = t("Error detecting location");
          }
          setError(errorMessage);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (error: any) {
      setError(error.message || t("Failed to detect location"));
      setLoading(false);
    }
  };

  // Function to update user's location on the server
  const updateUserLocation = async (data: LocationData) => {
    try {
      await apiRequest("PATCH", "/api/user/location", data);
      setLoading(false);
    } catch (error: any) {
      setError(error.message || t("Failed to update location"));
      setLoading(false);
      throw error; // Re-throw to handle in caller
    }
  };

  // Function to manually set location (for testing or when automatic detection fails)
  const manuallySetLocation = async (data: LocationData) => {
    setLoading(true);
    setError(null);

    try {
      await updateUserLocation(data);
      setLocationData(data);
      
      toast({
        title: t("Location Updated"),
        description: t("Your location has been updated successfully"),
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      setError(error.message || t("Failed to update location"));
    }
  };

  const [editLocation, setEditLocation] = useState(false);
  
  if (user?.locationConfirmed && !editLocation) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            {t("Location Confirmed")}
          </CardTitle>
          <CardDescription>
            {t("Your location is set and can be used for geofenced polls.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              {locationData.locationDescription && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{locationData.locationDescription}</span>
                </div>
              )}
              
              {locationData.latitude && locationData.longitude && (
                <div className="text-xs text-muted-foreground font-mono pl-5">
                  {locationData.latitude}, {locationData.longitude}
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditLocation(true)}
              className="w-full"
            >
              <Navigation className="h-3.5 w-3.5 mr-1" />
              {t("Update Location")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{t("Location Detection")}</CardTitle>
        <CardDescription>
          {t("Detect your location to participate in regional polls")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('general.error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex space-x-2 w-full">
            <Button 
              onClick={detectLocation} 
              disabled={loading}
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-1" />
              {loading ? t("Detecting...") : t("Detect Using GPS")}
            </Button>

            <Button
              onClick={() => setShowManualSelection(!showManualSelection)}
              variant="outline"
              type="button"
              className="flex items-center"
            >
              {showManualSelection ? t("Hide Location Options") : t("Manual Input")}
            </Button>
          </div>
          
          {/* Manual location selection */}
          {showManualSelection && (
            <div className="p-4 border rounded-md space-y-4">
              <h4 className="font-medium">{t("Your Location")}</h4>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("Set your location coordinates to participate in geofenced polls")}
                </p>
                
                {/* Interactive Map for Coordinates */}
                <GeofenceMap 
                  initialCenter={
                    locationData.latitude && locationData.longitude 
                      ? [parseFloat(locationData.latitude), parseFloat(locationData.longitude)]
                      : [37.9838, 23.7275] // Default to Athens, Greece
                  }
                  initialRadius={5}
                  onCenterChange={(lat, lng) => {
                    setLocationData(prev => ({
                      ...prev,
                      latitude: lat.toString(),
                      longitude: lng.toString()
                    }));
                  }}
                  onRadiusChange={() => {/* We don't need radius for user location */}}
                  onLocationInfoChange={(locationInfo: LocationInfo) => {
                    // Create a description from location info
                    const description = [
                      locationInfo.city,
                      locationInfo.region,
                      locationInfo.country
                    ].filter(Boolean).join(", ");
                      
                    setLocationData(prev => ({
                      ...prev,
                      locationDescription: description
                    }));
                  }}
                />
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">{t('Latitude')}:</span> {locationData.latitude}
                  </div>
                  <div>
                    <span className="font-medium">{t('Longitude')}:</span> {locationData.longitude}
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    // Validate coordinates before submitting
                    const lat = parseFloat(locationData.latitude || '0');
                    const lng = parseFloat(locationData.longitude || '0');
                    
                    if (isNaN(lat) || isNaN(lng)) {
                      setError(t("Please enter valid coordinates"));
                      return;
                    }
                    
                    if (lat < -90 || lat > 90) {
                      setError(t("Latitude must be between -90 and 90"));
                      return;
                    }
                    
                    if (lng < -180 || lng > 180) {
                      setError(t("Longitude must be between -180 and 180"));
                      return;
                    }
                    
                    // Prepare location data for saving
                    const updatedLocation = {
                      ...locationData,
                      longitude: lng.toString(),
                      latitude: lat.toString(),
                      locationConfirmed: true
                    };
                      
                    // Save coordinates
                    manuallySetLocation(updatedLocation);
                  }}
                  disabled={loading || !locationData.latitude || !locationData.longitude}
                  className="w-full"
                >
                  <Crosshair className="h-4 w-4 mr-1" />
                  {t("Save Coordinates")}
                </Button>
              </div>
            </div>
          )}
          
          {/* Automatic location detection display */}
          {locationData.locationDescription && 
           !locationData.locationConfirmed && 
           !showManualSelection && (
            <div className="p-4 border rounded-md">
              <h4 className="font-medium mb-2">{t("Detected Location:")}</h4>
              <div className="space-y-1 text-sm">
                <div>{locationData.locationDescription}</div>
                {locationData.latitude && locationData.longitude && (
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    {locationData.latitude}, {locationData.longitude}
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => manuallySetLocation({...locationData, locationConfirmed: true})}
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={loading}
              >
                {t("Confirm Location")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}