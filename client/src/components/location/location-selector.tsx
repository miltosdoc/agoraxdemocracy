import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  getCountries,
  getRegionsByCountry,
  getCitiesByRegion,
  CountryItem,
  RegionItem,
  CityItem
} from "@/lib/geo-data";

export interface LocationSelectorProps {
  initialValues?: {
    country?: string;
    region?: string;
    city?: string;
  };
  required?: boolean;
  scope?: 'global' | 'country' | 'region' | 'city';
  onLocationChange: (location: {
    // Display names (localized)
    countryName?: string;
    regionName?: string;
    cityName?: string;
    
    // Legacy properties (may be used in older code)
    country?: string;
    region?: string;
    city?: string;
    
    // Standardized IDs (English)
    countryId?: string;
    regionId?: string;
    cityId?: string;
  }) => void;
  disabled?: boolean;
  showValidationErrors?: boolean;
  className?: string;
}

export function LocationSelector({
  initialValues,
  required = false,
  scope = 'country',
  onLocationChange,
  disabled = false,
  showValidationErrors = false,
  className = ""
}: LocationSelectorProps) {
  const { t } = useTranslation();
  // State for drop-down selectors
  const [countries] = useState<CountryItem[]>(getCountries());
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState<string>(initialValues?.country || "");
  const [selectedRegion, setSelectedRegion] = useState<string>(initialValues?.region || "");
  const [selectedCity, setSelectedCity] = useState<string>(initialValues?.city || "");
  
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Reset region when country changes
  useEffect(() => {
    if (selectedCountry) {
      setRegions(getRegionsByCountry(selectedCountry));
      
      // If we have a new country, reset region and city
      if (!initialValues?.country || initialValues.country !== selectedCountry) {
        setSelectedRegion("");
        setSelectedCity("");
      }
    } else {
      setRegions([]);
      setSelectedRegion("");
      setSelectedCity("");
    }
  }, [selectedCountry, initialValues?.country]);
  
  // Reset city when region changes
  useEffect(() => {
    if (selectedCountry && selectedRegion) {
      setCities(getCitiesByRegion(selectedCountry, selectedRegion));
      
      // If we have a new region, reset city
      if (!initialValues?.region || initialValues.region !== selectedRegion) {
        setSelectedCity("");
      }
    } else {
      setCities([]);
      setSelectedCity("");
    }
  }, [selectedRegion, selectedCountry, initialValues?.region]);
  
  // Validate based on scope
  useEffect(() => {
    if (!required || !showValidationErrors) {
      setValidationError(null);
      return;
    }
    
    if (scope === 'country' && !selectedCountry) {
      setValidationError(t("Country selection is required"));
    } else if (scope === 'region' && (!selectedCountry || !selectedRegion)) {
      setValidationError(t("Country and region selections are required"));
    } else if (scope === 'city' && (!selectedCountry || !selectedRegion || !selectedCity)) {
      setValidationError(t("Country, region and city selections are required"));
    } else {
      setValidationError(null);
    }
  }, [selectedCountry, selectedRegion, selectedCity, scope, required, showValidationErrors]);
  
  // If initial values are provided, populate the selectors on mount
  useEffect(() => {
    if (initialValues?.country) {
      setSelectedCountry(initialValues.country);
      setRegions(getRegionsByCountry(initialValues.country));
      
      if (initialValues.region) {
        setSelectedRegion(initialValues.region);
        setCities(getCitiesByRegion(initialValues.country, initialValues.region));
        
        if (initialValues.city) {
          setSelectedCity(initialValues.city);
        }
      }
    }
  }, []);
  
  // Handle country selection
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    
    // Find the country name
    const country = countries.find(c => c.id === value);
    
    // Notify parent component
    onLocationChange({
      // Legacy fields
      country: value,
      countryName: country?.name,
      region: undefined,
      regionName: undefined,
      city: undefined,
      cityName: undefined,
      
      // Standardized ID fields
      countryId: value,
      regionId: undefined,
      cityId: undefined
    });
  };
  
  // Handle region selection
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    
    // Find the region name
    const region = regions.find(r => r.id === value);
    
    // Notify parent component
    onLocationChange({
      // Legacy fields
      country: selectedCountry,
      countryName: countries.find(c => c.id === selectedCountry)?.name,
      region: value,
      regionName: region?.name,
      city: undefined,
      cityName: undefined,
      
      // Standardized ID fields
      countryId: selectedCountry,
      regionId: value,
      cityId: undefined
    });
  };
  
  // Handle city selection
  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    
    // Find the city name
    const city = cities.find(c => c.id === value);
    
    // Notify parent component
    onLocationChange({
      // Legacy fields
      country: selectedCountry,
      countryName: countries.find(c => c.id === selectedCountry)?.name,
      region: selectedRegion,
      regionName: regions.find(r => r.id === selectedRegion)?.name,
      city: value,
      cityName: city?.name,
      
      // Standardized ID fields
      countryId: selectedCountry,
      regionId: selectedRegion,
      cityId: value
    });
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {validationError && showValidationErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("Validation Error")}</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="country-select">{t("Country")}</Label>
          <Select
            onValueChange={handleCountryChange}
            value={selectedCountry}
            disabled={disabled}
          >
            <SelectTrigger id="country-select">
              <SelectValue placeholder={t("Select a country")} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {(scope === 'region' || scope === 'city') && (
          <div className="space-y-1">
            <Label htmlFor="region-select">{t("Region")}</Label>
            <Select
              onValueChange={handleRegionChange}
              value={selectedRegion}
              disabled={!selectedCountry || regions.length === 0 || disabled}
            >
              <SelectTrigger id="region-select">
                <SelectValue placeholder={t("Select a region")} />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {scope === 'city' && (
          <div className="space-y-1">
            <Label htmlFor="city-select">{t("City")}</Label>
            <Select
              onValueChange={handleCityChange}
              value={selectedCity}
              disabled={!selectedRegion || cities.length === 0 || disabled}
            >
              <SelectTrigger id="city-select">
                <SelectValue placeholder={t("Select a city")} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}