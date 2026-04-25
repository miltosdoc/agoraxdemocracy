import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PollCard } from "./poll-card";
import { PollFilters } from "./poll-filters";
import { Loader2, Filter } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";
import type { PollWithOptions } from "@shared/schema";

export function PollList() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "active",
    category: "",
    sort: "newest", 
    page: 1,
    pageSize: 9,
    locationScope: "",
    locationCountry: "",
    locationRegion: "",
    locationCity: "",
    groupId: undefined as number | undefined,
  });

  // Fetch a large result set for client-side filtering and pagination
  const FETCH_PAGE_SIZE = 100;

  // Query for all polls - fetch large result set for client-side filtering
  const { data: pollsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/polls", { ...filters, pageSize: FETCH_PAGE_SIZE }],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Query for user's polls
  const { data: myPollsData, isLoading: myPollsLoading } = useQuery({
    queryKey: ["/api/polls/my"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && activeTab === "my-polls",
  });

  // Query for participated polls
  const { data: participatedData, isLoading: participatedLoading } = useQuery({
    queryKey: ["/api/polls/participated"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && activeTab === "participated",
  });

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handleApplyFilters = () => {
    setIsFilterDrawerOpen(false);
  };

  const handleClearAllFilters = () => {
    setFilters({
      ...filters,
      category: "",
      sort: "newest",
      locationScope: "",
      locationCountry: "",
      locationRegion: "",
      locationCity: "",
      groupId: undefined,
      page: 1,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.sort && filters.sort !== "newest") count++;
    if (filters.locationScope) count++;
    if (filters.locationCountry) count++;
    if (filters.locationRegion) count++;
    if (filters.locationCity) count++;
    if (filters.groupId) count++;
    return count;
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "active") {
      setFilters({ ...filters, status: "active", page: 1 });
    } else if (value === "completed") {
      setFilters({ ...filters, status: "completed", page: 1 });
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };
  
  const matchesLocationFilters = (poll: PollWithOptions) => {
    // If no location filters are set, return true
    if (!filters.locationScope && !filters.locationCountry && !filters.locationRegion && !filters.locationCity) {
      return true;
    }
    
    // First check location scope (global vs geofenced)
    if (filters.locationScope === "geofenced" && poll.locationScope !== "geofenced") {
      return false;
    }
    
    if (filters.locationScope === "global" && poll.locationScope !== "global") {
      return false;
    }
    
    // If filtering only by scope (not by country/region/city), we're done
    if (!filters.locationCountry && !filters.locationRegion && !filters.locationCity) {
      return true;
    }
    
    // ===== COORDINATES-BASED APPROACH =====
    
    // If poll has coordinates, we'll use them for matching
    const hasCoordinates = !!(poll.centerLat && poll.centerLng);
    let pollLat = 0;
    let pollLng = 0;
    
    if (hasCoordinates) {
      pollLat = parseFloat(poll.centerLat || "0");
      pollLng = parseFloat(poll.centerLng || "0");
    }
    
    // Get the poll's location data, using new fields with fallback to legacy fields
    const pollCountry = (poll.locationCountry || poll.country || '').toLowerCase().trim();
    const pollRegion = (poll.locationRegion || poll.region || '').toLowerCase().trim();
    const pollCity = (poll.locationCity || poll.city || '').toLowerCase().trim();
    
    // Get filter values and normalize
    const countryFilter = filters.locationCountry ? filters.locationCountry.toLowerCase().trim() : '';
    const regionFilter = filters.locationRegion ? filters.locationRegion.toLowerCase().trim() : '';
    const cityFilter = filters.locationCity ? filters.locationCity.toLowerCase().trim() : '';
    
    // ===== REGION COORDINATE BOUNDARIES =====
    
    // Define common regions by coordinates (bounding boxes)
    const regionBoundaries: Record<string, { minLat: number, maxLat: number, minLng: number, maxLng: number }> = {
      // Add all Greek regions here
      "aegean": { minLat: 36.0, maxLat: 41.0, minLng: 24.0, maxLng: 28.0 },
      "attica": { minLat: 37.8, maxLat: 38.1, minLng: 23.6, maxLng: 24.1 },
      "macedonia and thrace": { minLat: 40.2, maxLat: 41.7, minLng: 22.5, maxLng: 26.5 },
      "central macedonia": { minLat: 40.2, maxLat: 41.3, minLng: 22.5, maxLng: 24.0 },
      "western macedonia": { minLat: 39.9, maxLat: 40.8, minLng: 21.0, maxLng: 22.5 },
      "epirus": { minLat: 39.0, maxLat: 40.1, minLng: 20.0, maxLng: 21.5 },
      "thessaly": { minLat: 39.0, maxLat: 40.0, minLng: 21.5, maxLng: 23.5 },
      "central greece": { minLat: 38.3, maxLat: 39.3, minLng: 21.8, maxLng: 24.5 },
      "ionian islands": { minLat: 38.1, maxLat: 39.8, minLng: 19.3, maxLng: 21.0 },
      "western greece": { minLat: 37.8, maxLat: 39.0, minLng: 21.0, maxLng: 22.5 },
      "peloponnese": { minLat: 36.5, maxLat: 38.3, minLng: 21.0, maxLng: 23.6 },
      "crete": { minLat: 34.8, maxLat: 35.7, minLng: 23.4, maxLng: 26.3 }
    };
    
    // ===== COUNTRY FILTERING =====
    
    // Country filter applied
    if (countryFilter) {
      // Check by text fields
      const countryMatches = pollCountry === countryFilter || pollCountry.includes(countryFilter);
      
      // Check by coordinates (Greece bounding box)
      const isInGreece = hasCoordinates && 
                        pollLat >= 34.8 && pollLat <= 41.8 && 
                        pollLng >= 19.4 && pollLng <= 29.6;
      
      // If filtering for Greece, match anything in Greece
      const countryCoordMatches = (countryFilter === 'greece' || countryFilter === 'ελλάδα') && isInGreece;
      
      // Country must match by text or coordinates
      if (!countryMatches && !countryCoordMatches) {
        return false;
      }
    }
    
    // ===== REGION FILTERING =====
    
    if (regionFilter) {
      // Try text-based matching first if we have region text
      const regionMatches = pollRegion === regionFilter || 
                           pollRegion.includes(regionFilter) || 
                           regionFilter.includes(pollRegion);
      
      // Try coordinate-based matching if we have coordinates
      let regionCoordMatches = false;
      
      if (hasCoordinates) {
        // Normalize region filter to match our region boundaries keys
        const normalizedRegionFilter = regionFilter
          .replace(/-/g, ' ')
          .replace(/&/g, 'and')
          .toLowerCase();
        
        // Check if we have boundaries for this region
        const regionBoundary = regionBoundaries[normalizedRegionFilter];
        
        if (regionBoundary) {
          regionCoordMatches = pollLat >= regionBoundary.minLat && 
                              pollLat <= regionBoundary.maxLat && 
                              pollLng >= regionBoundary.minLng && 
                              pollLng <= regionBoundary.maxLng;
        } else {
          // Special handling for "macedonia" which could be in multiple regions
          if (normalizedRegionFilter.includes('macedonia') || normalizedRegionFilter.includes('μακεδονία')) {
            // Check if coordinates fall within any Macedonia region
            regionCoordMatches = (pollLat >= 40.2 && pollLat <= 41.7 && 
                                pollLng >= 22.0 && pollLng <= 26.5);
          }
        }
      }
      
      // Region must match by text or coordinates
      if (!regionMatches && !regionCoordMatches) {
        return false;
      }
    }
    
    // ===== CITY FILTERING =====
    
    if (cityFilter) {
      // Clean up city filter (remove "municipality of", etc.)
      const cleanCityFilter = cityFilter
        .replace(/municipality\s+of\s+/i, '')
        .replace(/\s+municipality/i, '')
        .trim();
      
      // Try text-based matching with cleaned city name
      const cityMatches = pollCity === cityFilter || 
                         pollCity.includes(cleanCityFilter) || 
                         cleanCityFilter.includes(pollCity);
      
      // If no match by name, try coordinates for common cities
      let cityCoordMatches = false;
      
      if (hasCoordinates && !cityMatches) {
        // Polygyros coordinates
        if (cleanCityFilter.includes('polygyros') && 
            pollLat >= 40.35 && pollLat <= 40.43 && 
            pollLng >= 23.42 && pollLng <= 23.48) {
          cityCoordMatches = true;
        }
        // Athens coordinates
        else if (cleanCityFilter.includes('athens') && 
                pollLat >= 37.90 && pollLat <= 38.10 && 
                pollLng >= 23.60 && pollLng <= 23.80) {
          cityCoordMatches = true;
        }
        // Nisyros coordinates
        else if (cleanCityFilter.includes('nisyros') && 
                pollLat >= 36.55 && pollLat <= 36.65 && 
                pollLng >= 27.10 && pollLng <= 27.20) {
          cityCoordMatches = true;
        }
        // Kavala coordinates
        else if (cleanCityFilter.includes('kavala') && 
                pollLat >= 40.90 && pollLat <= 41.00 && 
                pollLng >= 24.35 && pollLng <= 24.45) {
          cityCoordMatches = true;
        }
      }
      
      // City must match by text or coordinates
      if (!cityMatches && !cityCoordMatches) {
        return false;
      }
    }
    
    // If we made it here, the poll matches all the specified filters
    return true;
  };

  // Get the right data for the active tab
  const getActiveData = () => {
    if (activeTab === "my-polls" && user) {
      return { polls: myPollsData || [], isLoading: myPollsLoading };
    } else if (activeTab === "participated" && user) {
      return { polls: participatedData || [], isLoading: participatedLoading };
    } else {
      // Apply client-side location filtering to the polls
      const filteredPolls = (pollsData?.polls || []).filter(matchesLocationFilters);
      
      // Implement client-side pagination
      const startIndex = (filters.page - 1) * filters.pageSize;
      const endIndex = startIndex + filters.pageSize;
      const paginatedPolls = filteredPolls.slice(startIndex, endIndex);
      
      return { 
        polls: paginatedPolls, 
        total: filteredPolls.length,
        isLoading 
      };
    }
  };

  const { polls, total, isLoading: dataLoading } = getActiveData();
  // Recalculate pageCount based on filtered total
  const pageCount = total ? Math.ceil(total / filters.pageSize) : 0;

  const activeFilterCount = getActiveFilterCount();
  const showFiltersForTab = activeTab === "active" || activeTab === "completed";

  return (
    <div className="space-y-4">
      {/* Mobile Filter Button - Only visible on mobile when filters are needed */}
      {showFiltersForTab && (
        <div className="sm:hidden">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 text-base"
            data-testid="button-open-filters"
          >
            <Filter className="h-5 w-5" />
            {activeFilterCount > 0 ? (
              <span>
                {t("Filters")} ({activeFilterCount})
              </span>
            ) : (
              <span>{t("Filters")}</span>
            )}
          </Button>
        </div>
      )}

      {/* Mobile Filter Drawer */}
      <Sheet open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto sm:hidden">
          <SheetHeader>
            <SheetTitle>{t("Filter Polls")}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <PollFilters 
              onFilterChange={handleFilterChange}
              category={filters.category}
              sort={filters.sort}
              locationScope={filters.locationScope}
              locationCountry={filters.locationCountry}
              locationRegion={filters.locationRegion}
              locationCity={filters.locationCity}
              groupId={filters.groupId}
            />
          </div>
          <SheetFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleClearAllFilters}
              className="w-full"
              data-testid="button-clear-filters"
            >
              {t("Clear All Filters")}
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="w-full"
              data-testid="button-apply-filters"
            >
              {t("Apply Filters")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 sm:mb-6 w-full grid grid-cols-2 sm:flex sm:w-auto h-auto sm:h-10 gap-1 sm:gap-0 p-1">
          <TabsTrigger 
            value="active" 
            className="h-11 sm:h-9 text-sm sm:text-base min-w-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            data-testid="tab-active"
          >
            {t('poll.activePolls')}
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="h-11 sm:h-9 text-sm sm:text-base min-w-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            data-testid="tab-completed"
          >
            {t('poll.completed')}
          </TabsTrigger>
          {user && (
            <TabsTrigger 
              value="my-polls" 
              className="h-11 sm:h-9 text-sm sm:text-base min-w-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              data-testid="tab-my-polls"
            >
              {t("My Polls Tab")}
            </TabsTrigger>
          )}
          {user && (
            <TabsTrigger 
              value="participated" 
              className="h-11 sm:h-9 text-sm sm:text-base min-w-[44px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              data-testid="tab-participated"
            >
              {t("Participations")}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Desktop Filters - Hidden on mobile */}
        <TabsContent value="active" className="mt-0">
          <div className="hidden sm:block">
            <PollFilters 
              onFilterChange={handleFilterChange}
              category={filters.category}
              sort={filters.sort}
              locationScope={filters.locationScope}
              locationCountry={filters.locationCountry}
              locationRegion={filters.locationRegion}
              locationCity={filters.locationCity}
              groupId={filters.groupId}
            />
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <div className="hidden sm:block">
            <PollFilters 
              onFilterChange={handleFilterChange}
              category={filters.category}
              sort={filters.sort}
              locationScope={filters.locationScope}
              locationCountry={filters.locationCountry}
              locationRegion={filters.locationRegion}
              locationCity={filters.locationCity}
              groupId={filters.groupId}
            />
          </div>
        </TabsContent>

        {/* My polls and participated don't need filters */}
        <TabsContent value="my-polls" className="mt-0" />
        <TabsContent value="participated" className="mt-0" />
      </Tabs>

      {dataLoading ? (
        <div className="flex flex-col justify-center items-center py-16 sm:py-20 space-y-4">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">{t("Loading polls...")}</p>
        </div>
      ) : polls.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
            {polls.map((poll: PollWithOptions) => (
              <PollCard 
                key={poll.id} 
                poll={poll} 
                onVote={refetch}
              />
            ))}
          </div>

          {/* Only show pagination for normal listings, not my-polls or participated */}
          {activeTab !== "my-polls" && activeTab !== "participated" && pageCount > 1 && (
            <Pagination className="mt-6 sm:mt-8">
              <PaginationContent className="flex-wrap gap-1 sm:gap-0">
                {filters.page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(filters.page - 1);
                      }}
                      className="h-9 sm:h-10 min-w-[44px]"
                      data-testid="button-prev-page"
                    />
                  </PaginationItem>
                )}
                
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  let pageNum;
                  if (pageCount <= 5) {
                    pageNum = i + 1;
                  } else if (filters.page <= 3) {
                    pageNum = i + 1;
                  } else if (filters.page >= pageCount - 2) {
                    pageNum = pageCount - 4 + i;
                  } else {
                    pageNum = filters.page - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={pageNum === filters.page}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                        className="h-9 sm:h-10 min-w-[44px] text-sm sm:text-base"
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {filters.page < pageCount && (
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(filters.page + 1);
                      }}
                      className="h-9 sm:h-10 min-w-[44px]"
                      data-testid="button-next-page"
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-16 sm:py-20 space-y-3">
          <div className="text-4xl sm:text-5xl mb-2">🔍</div>
          <p className="text-base sm:text-lg font-medium text-foreground">{t("No polls found")}</p>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
            {activeFilterCount > 0 
              ? t("Try adjusting your filters to see more results")
              : t("There are no polls available at the moment")}
          </p>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAllFilters}
              className="mt-4"
              data-testid="button-clear-all-filters"
            >
              {t("Clear All Filters")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
