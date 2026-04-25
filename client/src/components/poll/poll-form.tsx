import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPollSchema, CreatePoll } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormRichText } from "@/components/ui/form-rich-text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Trash2, PlusCircle, MapPinned } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { GeofenceMap } from "@/components/map/geofence-map";

export function PollForm({ pollId }: { pollId?: number }) {
  const { t, locale } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!pollId;
  
  // State for geofencing
  const [geofenceCenterLat, setGeofenceCenterLat] = useState<number>(37.98);
  const [geofenceCenterLng, setGeofenceCenterLng] = useState<number>(23.72);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(5);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch user's groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ["/api/groups"],
  });

  // Fetch poll data if editing
  const { data: pollData, isLoading } = useQuery({
    queryKey: [`/api/polls/${pollId}`],
    enabled: isEditing,
  });

  // Default values for the form
  const defaultValues: CreatePoll = {
    poll: {
      title: "",
      description: "", 
      category: "Άλλο",
      // Use strings for dates in the form, they'll be converted to Date objects when submitting
      startDate: format(new Date(), "yyyy-MM-dd"),
      startTime: format(new Date(), "HH:mm"),
      endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      endTime: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "HH:mm"),
      visibility: "public",
      pollType: "singleChoice",
      allowExtension: true,
      showResults: false,
      allowComments: true,
      requireVerification: false,
      creatorId: 0,
      isActive: true,
      locationScope: "global",
      // Geofencing coordinates
      centerLat: "",
      centerLng: "",
      radiusKm: 5
    },
    options: [
      { text: "", order: 0 },
      { text: "", order: 1 },
    ],
  };

  // Create form with validation
  const form = useForm<CreatePoll>({
    resolver: zodResolver(createPollSchema),
    defaultValues,
  });

  // Setup field array for options
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });
  
  // Handle country selection change
  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedRegion(""); // Reset region selection
    
    // Find the country to get its display name
    const country = countries.find(c => c.id === countryId);
    
    // Set both the display name and standardized ID
    form.setValue("poll.locationCountry", country?.name || "");
    form.setValue("poll.location_country_id", countryId);
    
    // Reset region and city values
    form.setValue("poll.locationRegion", "");
    form.setValue("poll.location_region_id", "");
    form.setValue("poll.locationCity", "");
    form.setValue("poll.location_city_id", "");
    
    // Update regions based on selected country
    const newRegions = getRegionsByCountry(countryId);
    setRegions(newRegions);
    setCities([]);
  };
  
  // Handle region selection change
  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    
    // Find the region to get its display name
    const region = regions.find(r => r.id === regionId);
    
    // Set both the display name and standardized ID
    form.setValue("poll.locationRegion", region?.name || "");
    form.setValue("poll.location_region_id", regionId);
    
    // Reset city values
    form.setValue("poll.locationCity", "");
    form.setValue("poll.location_city_id", "");
    
    // Update cities based on selected country and region
    const newCities = getCitiesByRegion(selectedCountry, regionId);
    setCities(newCities);
  };
  
  // Update form with poll data when editing
  useEffect(() => {
    if (isEditing && pollData) {
      // Debug what we're getting
      console.log("Poll data for editing:", pollData);
      
      // Update the form with poll data
      const startDate = new Date(pollData.startDate);
      const endDate = new Date(pollData.endDate);
      
      console.log("Parsed dates:", { startDate, endDate });
      
      // Set all form values at once for better performance
      form.reset({
        poll: {
          title: pollData.title,
          description: pollData.description,
          category: pollData.category,
          startDate: format(startDate, "yyyy-MM-dd"),
          startTime: format(startDate, "HH:mm"),
          endDate: format(endDate, "yyyy-MM-dd"),
          endTime: format(endDate, "HH:mm"),
          visibility: pollData.visibility,
          pollType: pollData.pollType,
          allowExtension: pollData.allowExtension,
          showResults: pollData.showResults,
          allowComments: pollData.allowComments,
          requireVerification: pollData.requireVerification,
          locationScope: pollData.locationScope || "global",
          // Display names
          locationCity: pollData.locationCity || "",
          locationRegion: pollData.locationRegion || "",
          locationCountry: pollData.locationCountry || "",
          // Standardized IDs
          location_city_id: pollData.location_city_id || "",
          location_region_id: pollData.location_region_id || "",
          location_country_id: pollData.location_country_id || "",
          creatorId: 0,
          isActive: true,
          centerLat: pollData.centerLat || "",
          centerLng: pollData.centerLng || "",
          radiusKm: pollData.radiusKm || 5,
          groupId: pollData.groupId || undefined
        },
        options: pollData.options.map((option, index) => ({
          text: option.text,
          order: option.order || index,
        })),
      });

      // Setup location related fields and state
      if (pollData.locationScope === "geofenced" && pollData.centerLat && pollData.centerLng) {
        setGeofenceCenterLat(parseFloat(pollData.centerLat));
        setGeofenceCenterLng(parseFloat(pollData.centerLng));
        setGeofenceRadius(pollData.radiusKm || 5);
        
        // Set form values for geofencing
        form.setValue("poll.centerLat", pollData.centerLat);
        form.setValue("poll.centerLng", pollData.centerLng);
        form.setValue("poll.radiusKm", pollData.radiusKm || 5);
      }
      // Setup regular location fields if not geofenced
      else if (pollData.locationCountry) {
        // Use the standardized ID if available, otherwise use the display name
        const countryId = pollData.location_country_id || pollData.locationCountry;
        setSelectedCountry(countryId);
        setRegions(getRegionsByCountry(countryId));
        
        if (pollData.locationRegion) {
          // Use the standardized ID if available, otherwise use the display name
          const regionId = pollData.location_region_id || pollData.locationRegion;
          setSelectedRegion(regionId);
          setCities(getCitiesByRegion(countryId, regionId));
          
          // Make sure both standardized ID and display name are set
          if (pollData.location_region_id && !pollData.locationRegion) {
            const region = regions.find(r => r.id === pollData.location_region_id);
            if (region) {
              form.setValue("poll.locationRegion", region.name);
            }
          }
          
          if (pollData.locationCity || pollData.location_city_id) {
            // Make sure both standardized ID and display name are set
            if (pollData.location_city_id && !pollData.locationCity) {
              const city = cities.find(c => c.id === pollData.location_city_id);
              if (city) {
                form.setValue("poll.locationCity", city.name);
              }
            }
          }
        }
        
        // Make sure both standardized ID and display name are set for country
        if (pollData.location_country_id && !pollData.locationCountry) {
          const country = countries.find(c => c.id === pollData.location_country_id);
          if (country) {
            form.setValue("poll.locationCountry", country.name);
          }
        }
      }
    } 
    // Otherwise, if user has location data, use that as default
    else if (user && user.country) {
      const countryItem = findCountryByName(user.country);
      if (countryItem) {
        setSelectedCountry(countryItem.id);
        // Set both display name and standardized ID
        form.setValue("poll.locationCountry", countryItem.name);
        form.setValue("poll.location_country_id", countryItem.id);
        setRegions(getRegionsByCountry(countryItem.id));
        
        if (user.region) {
          const regionItem = findRegionByName(countryItem.id, user.region);
          if (regionItem) {
            setSelectedRegion(regionItem.id);
            // Set both display name and standardized ID
            form.setValue("poll.locationRegion", regionItem.name);
            form.setValue("poll.location_region_id", regionItem.id);
            setCities(getCitiesByRegion(countryItem.id, regionItem.id));
            
            if (user.city) {
              const cityItem = getCitiesByRegion(countryItem.id, regionItem.id)
                .find(city => city.name.toLowerCase() === user.city?.toLowerCase());
              if (cityItem) {
                // Set both display name and standardized ID
                form.setValue("poll.locationCity", cityItem.name);
                form.setValue("poll.location_city_id", cityItem.id);
              }
            }
          }
        }
      }
    }
  }, [isEditing, pollData, user, form]);

  // Create/Edit poll mutation
  const mutation = useMutation({
    mutationFn: async (data: CreatePoll) => {
      // Combine date and time for start and end dates
      const processedData = { ...data };
      
      if (processedData.poll.startDate && processedData.poll.startTime) {
        try {
          // Check if startDate is already a Date object or an ISO string
          let startDateString = typeof processedData.poll.startDate === 'string' 
            ? processedData.poll.startDate 
            : format(processedData.poll.startDate, "yyyy-MM-dd");
          
          // If startDate is already an ISO string, convert it back to yyyy-MM-dd format
          if (startDateString.includes('T')) {
            startDateString = startDateString.split('T')[0];
          }
          
          const startTimeStr = processedData.poll.startTime;
          
          // Create date string in format YYYY-MM-DDT00:00:00
          const combinedStartStr = `${startDateString}T${startTimeStr}:00`;
          
          // Parse the combined date and time
          const startDate = new Date(combinedStartStr);
          
          if (isNaN(startDate.getTime())) {
            throw new Error('Invalid start date or time format');
          }
          
          processedData.poll.startDate = startDate.toISOString();
          console.log("Processed start date:", startDate.toISOString());
        } catch (error) {
          console.error("Error parsing start date/time:", error, 
            typeof processedData.poll.startDate, processedData.poll.startDate, 
            processedData.poll.startTime);
          throw new Error('Invalid start date or time. Please check the format.');
        }
      }
      
      if (processedData.poll.endDate && processedData.poll.endTime) {
        try {
          // Check if endDate is already a Date object or an ISO string
          let endDateString = typeof processedData.poll.endDate === 'string' 
            ? processedData.poll.endDate 
            : format(processedData.poll.endDate, "yyyy-MM-dd");
          
          // If endDate is already an ISO string, convert it back to yyyy-MM-dd format
          if (endDateString.includes('T')) {
            endDateString = endDateString.split('T')[0];
          }
          
          const endTimeStr = processedData.poll.endTime;
          
          // Create date string in format YYYY-MM-DDT00:00:00
          const combinedEndStr = `${endDateString}T${endTimeStr}:00`;
          
          // Parse the combined date and time
          const endDate = new Date(combinedEndStr);
          
          if (isNaN(endDate.getTime())) {
            throw new Error('Invalid end date or time format');
          }
          
          processedData.poll.endDate = endDate.toISOString();
          console.log("Processed end date:", endDate.toISOString());
        } catch (error) {
          console.error("Error parsing end date/time:", error, 
            typeof processedData.poll.endDate, processedData.poll.endDate, 
            processedData.poll.endTime);
          throw new Error('Invalid end date or time. Please check the format.');
        }
      }
      
      // Validate that end date is after start date
      const startDate = new Date(processedData.poll.startDate);
      const endDate = new Date(processedData.poll.endDate);
      
      if (endDate <= startDate) {
        throw new Error(t("End date must be after start date"));
      }
      
      // Keep time fields for validation
      processedData.startTime = processedData.poll.startTime;
      processedData.endTime = processedData.poll.endTime;
      
      // Remove time fields from poll object since they're combined with dates
      delete processedData.poll.startTime;
      delete processedData.poll.endTime;
      
      if (isEditing) {
        await apiRequest("PATCH", `/api/polls/${pollId}`, processedData.poll);
      } else {
        await apiRequest("POST", "/api/polls", processedData);
      }
    },
    onSuccess: () => {
      toast({
        title: t('general.success'),
        description: isEditing
          ? t("Poll updated successfully")
          : t("Poll created successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: t('general.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isEditing && isLoading) {
    return <div className="text-center py-8">Φόρτωση...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
        <div className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("Basic Information")}</h3>
            
            <FormField
              control={form.control}
              name="poll.title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Poll Title")}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="π.χ. Ανάπλαση πλατείας" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="poll.description"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>{t("Description")}</FormLabel>
                  <FormControl>
                    <FormRichText
                      name="poll.description"
                      control={form.control}
                      placeholder="Περιγράψτε λεπτομερώς την πρόταση ψηφοφορίας..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name="poll.category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Category")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select category")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="poll.visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Visibility")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Επιλέξτε προβολή" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">
                          {t("Public - Visible to all")}
                        </SelectItem>
                        <SelectItem value="restricted">
                          {t("Restricted - Only via link")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="poll.groupId"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>{t("Visible only to group")}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "public" ? undefined : parseInt(value))}
                    value={field.value ? String(field.value) : "public"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-group-visibility">
                        <SelectValue placeholder={t("Select group")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">{t("Public")}</SelectItem>
                      {isLoadingGroups ? (
                        <SelectItem value="loading" disabled>
                          {t("Loading groups...")}
                        </SelectItem>
                      ) : (
                        groups.map((group: any) => (
                          <SelectItem key={group.id} value={String(group.id)}>
                            {group.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value 
                      ? t("Only members of the selected group can see this poll")
                      : t("Anyone can see this poll")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Poll Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("Poll Options")}</h3>
            
            <FormField
              control={form.control}
              name="poll.pollType"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>{t("Poll Type")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Επιλέξτε τύπο ψηφοφορίας" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="singleChoice">{t("Single choice")}</SelectItem>
                      <SelectItem value="multipleChoice">{t("Multiple choice")}</SelectItem>
                      <SelectItem value="ranking">{t("Ranking")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>{t("Options")}</FormLabel>
              
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center">
                    <FormField
                      control={form.control}
                      name={`options.${index}.text`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input
                              placeholder={`${t("Option")} ${index + 1}`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (fields.length > 2) remove(index);
                      }}
                      disabled={fields.length <= 2}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ text: "", order: fields.length })}
                className="mt-2"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                {t("Add option")}
              </Button>
            </div>
          </div>
          
          {/* Duration */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("Poll Duration")}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="poll.startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Start Date")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="poll.startTime"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>{t("Start Time")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="poll.endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("End Date")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="poll.endTime"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>{t("End Time")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="poll.allowExtension"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-start space-x-2 space-y-0 mt-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>{t("Allow duration extension")}</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Additional Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("Additional Settings")}</h3>
            
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="poll.showResults"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-start space-x-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>{t("Show results in real-time")}</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="poll.allowComments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-start space-x-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>{t("Allow comments")}</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="poll.requireVerification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-start space-x-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>{t("Require account verification")}</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Location Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('profile.locationSettings')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("Restrict this poll to voters in specific geographic areas. Users outside the selected areas won't be able to vote.")}
            </p>
            
            <FormField
              control={form.control}
              name="poll.locationScope"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>{t("Geographic Restriction")}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset location fields when changing scope
                      if (value === "global") {
                        form.setValue("poll.centerLat", "");
                        form.setValue("poll.centerLng", "");
                        form.setValue("poll.radiusKm", undefined);
                      }
                      // If changing to geofenced, set initial values for the map
                      else if (value === "geofenced") {
                        form.setValue("poll.centerLat", String(geofenceCenterLat));
                        form.setValue("poll.centerLng", String(geofenceCenterLng));
                        form.setValue("poll.radiusKm", geofenceRadius);
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select geographic scope")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="global">{t("Global - No restriction")}</SelectItem>
                      <SelectItem value="geofenced">
                        <div className="flex items-center gap-2">
                          <MapPinned className="h-4 w-4" />
                          <span>{t("Geofenced - Restrict by radius")}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("Choose whether to restrict voting by location")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("poll.locationScope") !== "global" && (
              <div className="space-y-4">
                {form.watch("poll.locationScope") === "geofenced" && (
                  <div className="mt-4">
                    <FormLabel>{t("Geofence Area")}</FormLabel>
                    <FormDescription>
                      {t("Define the area where users can participate by setting a center point and radius")}
                    </FormDescription>
                    
                    <div className="mt-2">
                      <GeofenceMap 
                        initialCenter={[geofenceCenterLat, geofenceCenterLng]}
                        initialRadius={geofenceRadius}
                        onCenterChange={(lat, lng) => {
                          setGeofenceCenterLat(lat);
                          setGeofenceCenterLng(lng);
                          form.setValue("poll.centerLat", String(lat));
                          form.setValue("poll.centerLng", String(lng));
                        }}
                        onRadiusChange={(radius) => {
                          setGeofenceRadius(radius);
                          form.setValue("poll.radiusKm", radius);
                        }}
                        onLocationInfoChange={(locationInfo) => {
                          // Only log geocoded info for debugging, no longer storing hierarchical info
                          console.log("Geocoded location info:", locationInfo);
                        }}
                      />
                    </div>
                    
                    <FormDescription className="mt-4">
                      {t("Users must be within this radius of the center point to participate in the poll")}
                    </FormDescription>
                  </div>
                )}
                
                {/* We've removed all country/region/city selection UI as part of
                the move to GPS-only location restrictions */}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
            >
              {t('general.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isEditing ? t("Save Changes") : t("Create Poll")}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
