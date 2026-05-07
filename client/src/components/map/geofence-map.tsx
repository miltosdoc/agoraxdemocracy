import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import { SearchIcon as Search, MapPin } from 'lucide-react';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { reverseGeocode, LocationInfo } from '@/lib/geofencing';
import { useTranslation } from "@/hooks/use-translation";

// Make sure the Leaflet CSS is properly imported
import 'leaflet/dist/leaflet.css';

// Fix the Leaflet icon path issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issue
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// This component helps initialize the map properly
function MapInitializer() {
  const map = useMap();
  
  useEffect(() => {
    // Force the map to recalculate its size to fix tile rendering issues
    setTimeout(() => {
      map.invalidateSize(true);
    }, 200);
    
    // Add a resize handler to ensure map displays properly after window resize
    const handleResize = () => {
      map.invalidateSize(true);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  
  return null;
}

// This component is used to set the center of the map
// It's needed because we can't directly modify the MapContainer's props 
interface MapSetterProps {
  center: [number, number];
}

function MapSetter({ center }: MapSetterProps) {
  const map = useMap();
  map.setView(center);
  return null;
}

// This component will trigger map events
function MapEvents({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) {
  const map = useMap();
  
  useEffect(() => {
    map.on('click', onMapClick);
    
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

interface GeofenceMapProps {
  onCenterChange: (lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
  onLocationInfoChange?: (locationInfo: LocationInfo) => void;
  initialCenter?: [number, number]; // [lat, lng]
  initialRadius?: number; // in km
}

export function GeofenceMap({ 
  initialCenter = [37.7749, -122.4194], // Default: San Francisco
  initialRadius = 5, // Default: 5km
  onCenterChange,
  onRadiusChange,
  onLocationInfoChange,
}: GeofenceMapProps) {
  const { t } = useTranslation();
  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [radius, setRadius] = useState(initialRadius);
  const [postalCode, setPostalCode] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  
  // Function to handle map clicks - updates center
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    const newCenter: [number, number] = [lat, lng];
    setCenter(newCenter);
    onCenterChange(lat, lng);
    
    // After updating the center, perform reverse geocoding to get location info
    fetchLocationInfo(lat, lng);
  }, [onCenterChange]);
  
  // Function to fetch location info from coordinates
  const fetchLocationInfo = async (lat: number, lng: number) => {
    try {
      const info = await reverseGeocode(lat, lng);
      setLocationInfo(info);
      
      if (info && onLocationInfoChange) {
        onLocationInfoChange(info);
      }
    } catch (error) {
      // Error fetching location info
    }
  };
  
  // Effect to fetch location info when component mounts
  useEffect(() => {
    fetchLocationInfo(center[0], center[1]);
  }, []);
  
  // Use browser geolocation API to get user's location
  const getUserLocation = () => {
    setGpsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCenter: [number, number] = [latitude, longitude];
        setCenter(newCenter);
        onCenterChange(latitude, longitude);
        fetchLocationInfo(latitude, longitude);
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        // TODO: Show error toast
      }
    );
  };
  
  // Search by postal code using Nominatim
  const searchPostalCode = async () => {
    if (!postalCode.trim()) return;
    
    setSearchLoading(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCenter: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setCenter(newCenter);
        onCenterChange(parseFloat(lat), parseFloat(lon));
        fetchLocationInfo(parseFloat(lat), parseFloat(lon));
      } else {
        // No results found for postal code
      }
    } catch (error) {
      // Error searching postal code
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Handle radius change from slider
  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    setRadius(newRadius);
    onRadiusChange(newRadius);
  };
  
  // Add a ref to store the map instance
  const mapRef = useRef<L.Map | null>(null);
  
  // Force map to refresh tiles after rendering
  useEffect(() => {
    if (mapRef.current) {
      // Small timeout to ensure map has initialized properly
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("Geofence Area")}</CardTitle>
          <CardDescription>
            {t("Define the area where users can participate by setting a center point and radius")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="leaflet-container" style={{ height: '400px', width: '100%', position: 'relative' }}>
            <MapContainer 
              center={center} 
              zoom={12} 
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={center} />
              <Circle 
                center={center}
                radius={radius * 1000} // Convert km to meters
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
              />
              <MapSetter center={center} />
              <MapEvents onMapClick={handleMapClick} />
              <MapInitializer />
            </MapContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex space-x-2">
        <Button
          type="button"
          onClick={getUserLocation}
          disabled={gpsLoading}
          variant="secondary"
          className="flex-1"
        >
          <MapPin className="h-4 w-4 mr-1" />
          {gpsLoading ? t('Getting location...') : t('Use My Location')}
        </Button>
        
        <div className="flex-1">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t('Enter postal code')}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPostalCode()}
              />
              <p className="text-xs text-muted-foreground mt-1 ml-1">
                {t('Format example')}: 123 45
              </p>
            </div>
            <Button 
              type="button" 
              onClick={searchPostalCode}
              disabled={searchLoading}
              variant="outline"
              size="icon"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('Radius')}:</span>
          <span className="font-medium">{radius} km</span>
        </div>
        <Slider
          value={[radius]}
          min={1}
          max={100}
          step={1}
          onValueChange={handleRadiusChange}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        <div>
          <span className="font-medium">{t('Latitude')}:</span> {center[0].toFixed(6)}
        </div>
        <div>
          <span className="font-medium">{t('Longitude')}:</span> {center[1].toFixed(6)}
        </div>
      </div>
      
      {locationInfo && (
        <div className="text-sm border rounded-md p-3 bg-muted/30">
          <div className="font-medium mb-1">{t('notification.location')}: {locationInfo.displayName}</div>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div>{t('City')}: {locationInfo.city}</div>
            <div>{t('Region')}: {locationInfo.region}</div>
            <div>{t('Country')}: {locationInfo.country}</div>
          </div>
        </div>
      )}
    </div>
  );
}