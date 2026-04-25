import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "@/lib/utils";
import { Search, MapPin, Globe, Building2, MapPinned, MoreHorizontal, Users } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getDynamicLocationData, processPollsForLocations, LocationInfo, LocationData } from "@/lib/dynamic-locations";
import { useAuth } from "@/hooks/use-auth";
import type { GroupWithMembers } from "@shared/schema";

interface PollFiltersProps {
  onFilterChange: (filters: any) => void;
  category?: string;
  sort?: string;
  locationScope?: string;
  locationCountry?: string;
  locationRegion?: string;
  locationCity?: string;
  groupId?: number;
}

export function PollFilters({
  onFilterChange,
  category = "",
  sort = "newest",
  locationScope = "",
  locationCountry = "",
  locationRegion = "",
  locationCity = "",
  groupId,
}: PollFiltersProps) {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  // Show location filters by default if they're being used
  const [showLocationFilters, setShowLocationFilters] = useState(
    locationScope !== "" || locationCountry !== "" || locationRegion !== "" || locationCity !== ""
  );
  // Initialize with provided values if any
  const [selectedCountry, setSelectedCountry] = useState<string>(locationCountry || "");
  const [selectedRegion, setSelectedRegion] = useState<string>(locationRegion || "");
  const [selectedCity, setSelectedCity] = useState<string>(locationCity || "");
  const [locationData, setLocationData] = useState<{
    countries: LocationInfo[];
    regions: LocationInfo[];
    cities: LocationInfo[];
  }>({
    countries: [],
    regions: [],
    cities: []
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch user's groups
  const { data: userGroups = [] } = useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups"],
    enabled: !!user,
  });
  
  // Fetch polls to get dynamic location data
  const { data: pollsData } = useQuery({
    queryKey: ["/api/polls", { pageSize: 30 }], // Get a decent amount of polls
    select: (data: any) => data.polls,
  });
  
  // Process poll location data when polls are fetched
  useEffect(() => {
    if (pollsData && pollsData.length > 0) {
      // Use a named function for better error handling
      const processLocationData = async () => {
        try {
          // Use the processPollsForLocations function to extract location data
          const result = await processPollsForLocations(pollsData);
          setLocationData({
            countries: result.countries,
            regions: result.regions,
            cities: result.cities
          });
        } catch (error) {
          // Set empty arrays as fallback
          setLocationData({
            countries: [],
            regions: [],
            cities: []
          });
        }
      };
      
      // Call the function
      processLocationData();
    }
  }, [pollsData]);

  // Filter regions based on selected country
  const filteredRegions = selectedCountry 
    ? locationData.regions.filter(region => region.parentId === selectedCountry)
    : [];
    
  // Filter cities based on selected region
  const filteredCities = selectedRegion
    ? locationData.cities.filter(city => city.parentId === selectedRegion)
    : [];

  // Debounced search handler
  const debouncedSearch = debounce((value: string) => {
    onFilterChange({ search: value });
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleCategoryChange = (value: string) => {
    onFilterChange({ category: value === "all" ? "" : value });
  };

  const handleSortChange = (value: string) => {
    onFilterChange({ sort: value });
  };

  const handleLocationScopeChange = (value: string) => {
    // Convert "all" to empty string for the API
    const actualValue = value === "all" ? "" : value;
    
    // Reset child locations when changing scope
    setSelectedCountry("");
    setSelectedRegion("");
    setSelectedCity("");
    
    onFilterChange({ 
      locationScope: actualValue,
      locationCountry: "",
      locationRegion: "",
      locationCity: ""
    });
  };
  
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value === "all" ? "" : value);
    setSelectedRegion("");
    setSelectedCity("");
    
    if (value === "all") {
      onFilterChange({
        locationCountry: "",
        locationRegion: "",
        locationCity: ""
      });
    } else {
      const country = locationData.countries.find(c => c.id === value);
      onFilterChange({
        locationCountry: country?.name || "",
        locationRegion: "",
        locationCity: ""
      });
    }
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value === "all" ? "" : value);
    setSelectedCity("");

    if (value === "all") {
      onFilterChange({
        locationRegion: "",
        locationCity: ""
      });
    } else {
      const region = locationData.regions.find(r => r.id === value);
      onFilterChange({
        locationRegion: region?.name || "",
        locationCity: ""
      });
    }
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value === "all" ? "" : value);

    if (value === "all") {
      onFilterChange({
        locationCity: ""
      });
    } else {
      const city = locationData.cities.find(c => c.id === value);
      onFilterChange({
        locationCity: city?.name || ""
      });
    }
  };

  const clearLocationFilters = () => {
    setSelectedCountry("");
    setSelectedRegion("");
    setSelectedCity("");
    
    onFilterChange({
      locationScope: "",
      locationCountry: "",
      locationRegion: "",
      locationCity: ""
    });
  };

  const handleGroupChange = (value: string) => {
    if (value === "all") {
      onFilterChange({ groupId: undefined });
    } else {
      onFilterChange({ groupId: parseInt(value) });
    }
  };

  useEffect(() => {
    // Cleanup
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder={t("Search polls...")}
            className="pl-10"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={category}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("Category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 text-primary">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                  {t("All Categories")}
                </div>
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={cat} />
                    {cat}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("Sort by")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("Newest first")}</SelectItem>
              <SelectItem value="oldest">{t("Oldest first")}</SelectItem>
              <SelectItem value="mostVotes">{t("Most votes")}</SelectItem>
              <SelectItem value="endingSoon">{t("Ending soon")}</SelectItem>
            </SelectContent>
          </Select>

          {user && userGroups.length > 0 && (
            <Select
              value={groupId ? groupId.toString() : "all"}
              onValueChange={handleGroupChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t("Group")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t("All Groups")}
                  </div>
                </SelectItem>
                {userGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      
      <div className="flex items-center mt-4 mb-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowLocationFilters(!showLocationFilters)}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          {t("Location Filters")}
        </Button>
        {locationScope && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearLocationFilters} 
            className="ml-2 text-xs"
          >
            {t("Clear filters")}
          </Button>
        )}
      </div>
      
      {showLocationFilters && (
        <div className="bg-muted p-4 rounded-md mt-2">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Select
                value={locationScope}
                onValueChange={handleLocationScopeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("Filter by location")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All polls")}</SelectItem>
                  <SelectItem value="global">{t("Global polls")}</SelectItem>
                  <SelectItem value="geofenced">{t("Geofenced polls")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {locationScope === "global" ? 
                  t("Showing polls available to all users regardless of location") :
                  locationScope === "geofenced" ? 
                  t("Showing polls with location restrictions") :
                  t("Select a filter to see polls by location availability")}
              </p>
            </div>
            
            {/* Dynamic location hierarchies below */}
            {locationScope === "geofenced" && (
              <div className="space-y-3 pt-2 border-t border-border">
                <h3 className="text-sm font-medium">{t("Filter by specific locations")}</h3>
                
                {/* Countries dropdown - shown when there are countries available */}
                {locationData.countries.length > 0 && (
                  <div>
                    <div className="flex items-center mb-1">
                      <Globe className="h-3.5 w-3.5 mr-1 text-primary" />
                      <label className="text-xs font-medium text-foreground">{t("Country")}</label>
                    </div>
                    <Select
                      value={selectedCountry}
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("Select country")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("All countries")}</SelectItem>
                        {locationData.countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Regions dropdown - shown when a country is selected and regions are available */}
                {selectedCountry && filteredRegions.length > 0 && (
                  <div>
                    <div className="flex items-center mb-1">
                      <Building2 className="h-3.5 w-3.5 mr-1 text-primary" />
                      <label className="text-xs font-medium text-foreground">{t("Region")}</label>
                    </div>
                    <Select
                      value={selectedRegion}
                      onValueChange={handleRegionChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("Select region")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("All regions")}</SelectItem>
                        {filteredRegions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Cities dropdown - shown when a region is selected and cities are available */}
                {selectedRegion && filteredCities.length > 0 && (
                  <div>
                    <div className="flex items-center mb-1">
                      <MapPinned className="h-3.5 w-3.5 mr-1 text-primary" />
                      <label className="text-xs font-medium text-foreground">{t("Municipality")}</label>
                    </div>
                    <Select
                      value={selectedCity}
                      onValueChange={handleCityChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("Select municipality")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("All municipalities")}</SelectItem>
                        {filteredCities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Message when no locations have been found yet */}
                {locationData.countries.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    {t("Location data is being processed from existing polls. This may take a moment.")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
