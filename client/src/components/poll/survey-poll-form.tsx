import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSurveyPollSchema, CreateSurveyPoll, PollWithQuestions } from "@shared/schema";
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
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { 
  Trash2, 
  PlusCircle, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { 
  getCountries, 
  getRegionsByCountry, 
  getCitiesByRegion,
  findCountryByName,
  findRegionByName,
  CountryItem,
  RegionItem,
  CityItem
} from "@/lib/geo-data";
import { GeofenceMap } from "@/components/map/geofence-map";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export function SurveyPollForm({ pollId }: { pollId?: number }) {
  const { t, locale } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!pollId;
  
  // State for location dropdowns
  const [countries, setCountries] = useState<CountryItem[]>(getCountries());
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  
  // State for geofencing
  const [geofenceCenterLat, setGeofenceCenterLat] = useState<number>(37.98);
  const [geofenceCenterLng, setGeofenceCenterLng] = useState<number>(23.72);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(5);

  // State for question hierarchy management
  const [nextTempId, setNextTempId] = useState<number>(4);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);

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
    queryKey: [`/api/surveys/${pollId}`],
    enabled: isEditing,
  });

  // Process default form values
  const getDefaultQuestions = () => {
    return [
      {
        id: 1,
        text: "",
        questionType: "singleChoice",
        required: true,
        order: 0,
        parentId: undefined,
        parentAnswerId: undefined,
        answers: [
          { id: 2, text: "", order: 0 },
          { id: 3, text: "", order: 1 }
        ]
      }
    ];
  };
  
  // Default values for the form
  const defaultValues: CreateSurveyPoll = {
    poll: {
      title: "",
      description: "", 
      category: "Άλλο",
      startDate: format(new Date(), "yyyy-MM-dd"),
      startTime: format(new Date(), "HH:mm"),
      endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      endTime: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "HH:mm"),
      visibility: "public",
      pollType: "surveyPoll",
      allowExtension: true,
      showResults: false,
      allowComments: true,
      requireVerification: false,
      creatorId: 0,
      isActive: true,
      locationScope: "global",
      locationCity: "",
      locationRegion: "",
      locationCountry: ""
    },
    questions: getDefaultQuestions()
  };

  // Create form with validation
  const form = useForm<CreateSurveyPoll>({
    resolver: zodResolver(createSurveyPollSchema),
    defaultValues,
  });
  
  // Mutation for submitting the form
  const mutation = useMutation({
    mutationFn: async (data: CreateSurveyPoll) => {
      // Pre-process data
      let processedData = { ...data };
      
      // Combine date and time fields
      if (typeof processedData.poll.startDate === 'string' && processedData.poll.startTime) {
        const [year, month, day] = processedData.poll.startDate.split('-').map(num => parseInt(num));
        const [hours, minutes] = processedData.poll.startTime.split(':').map(num => parseInt(num));
        processedData.poll.startDate = new Date(year, month - 1, day, hours, minutes);
      }
      
      if (typeof processedData.poll.endDate === 'string' && processedData.poll.endTime) {
        const [year, month, day] = processedData.poll.endDate.split('-').map(num => parseInt(num));
        const [hours, minutes] = processedData.poll.endTime.split(':').map(num => parseInt(num));
        processedData.poll.endDate = new Date(year, month - 1, day, hours, minutes);
      }
      
      // Remove the time fields as they're only used for the UI
      const { startTime, endTime, ...pollWithoutTimes } = processedData.poll;
      processedData.poll = pollWithoutTimes;
      
      // Convert centerLat and centerLng to numbers if they're strings
      if (processedData.poll.locationScope === "geofenced") {
        if (typeof processedData.poll.centerLat === 'string') {
          processedData.poll.centerLat = parseFloat(processedData.poll.centerLat);
        }
        
        if (typeof processedData.poll.centerLng === 'string') {
          processedData.poll.centerLng = parseFloat(processedData.poll.centerLng);
        }
      } else {
        // Clear geofencing data if not using geofencing
        processedData.poll.centerLat = undefined;
        processedData.poll.centerLng = undefined;
        processedData.poll.radiusKm = undefined;
      }
      
      // Handle location data based on scope
      if (processedData.poll.locationScope === "global") {
        processedData.poll.locationCountry = undefined;
        processedData.poll.locationRegion = undefined;
        processedData.poll.locationCity = undefined;
      } else if (processedData.poll.locationScope === "country") {
        processedData.poll.locationRegion = undefined;
        processedData.poll.locationCity = undefined;
      } else if (processedData.poll.locationScope === "region") {
        processedData.poll.locationCity = undefined;
      }
      
      // Ensure questions have proper IDs
      processedData.questions = processedData.questions.map((question, idx) => ({
        ...question,
        id: question.id || idx + 1,
        order: idx,
        answers: question.answers.map((answer, ansIdx) => ({
          ...answer,
          id: answer.id || ansIdx + 1,
          order: ansIdx
        }))
      }));
      
      // Send request to the appropriate endpoint
      const endpoint = isEditing 
        ? `/api/surveys/${pollId}` 
        : "/api/surveys";
      
      const method = isEditing ? "PATCH" : "POST";
      const response = await apiRequest(method, endpoint, processedData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/polls/my"] });
      
      toast({
        title: isEditing 
          ? t("Survey Poll Updated") 
          : t("Survey Poll Created"),
        description: isEditing
          ? t("Your survey poll has been updated successfully.")
          : t("Your survey poll has been created successfully."),
      });
      
      navigate(`/polls/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: t('general.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Load poll data for editing
  useEffect(() => {
    if (pollData && isEditing) {
      // Process poll data for form
      const pollWithDateStrings = {
        ...pollData,
        startDate: format(new Date(pollData.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(pollData.endDate), "yyyy-MM-dd"),
        startTime: format(new Date(pollData.startDate), "HH:mm"),
        endTime: format(new Date(pollData.endDate), "HH:mm"),
        groupId: pollData.groupId || undefined,
      };
      
      // Transform questions data structure
      const questionsData = pollData.questions.map(question => {
        return {
          id: question.id,
          text: question.text,
          questionType: question.questionType,
          required: question.required,
          order: question.order,
          parentId: question.parentId,
          parentAnswerId: question.parentAnswerId,
          answers: question.answers.map(answer => ({
            id: answer.id,
            text: answer.text,
            order: answer.order
          }))
        };
      });
      
      // Set form values
      form.reset({
        poll: pollWithDateStrings,
        questions: questionsData
      });
      
      // Set location states
      if (pollData.locationCountry) {
        setSelectedCountry(pollData.locationCountry);
        const countryObj = findCountryByName(pollData.locationCountry);
        if (countryObj) {
          setRegions(getRegionsByCountry(countryObj.id));
        }
      }
      
      if (pollData.locationRegion) {
        setSelectedRegion(pollData.locationRegion);
        const countryObj = findCountryByName(pollData.locationCountry || "");
        const regionObj = countryObj && findRegionByName(countryObj.id, pollData.locationRegion);
        if (countryObj && regionObj) {
          setCities(getCitiesByRegion(countryObj.id, regionObj.id));
        }
      }
      
      // Set geofencing state
      if (pollData.centerLat && pollData.centerLng && pollData.radiusKm) {
        setGeofenceCenterLat(parseFloat(pollData.centerLat));
        setGeofenceCenterLng(parseFloat(pollData.centerLng));
        setGeofenceRadius(pollData.radiusKm);
      }
      
      // Update temp ID counter
      const highestId = Math.max(
        ...questionsData.flatMap(q => [
          q.id || 0, 
          ...q.answers.map(a => a.id || 0)
        ])
      );
      setNextTempId(highestId + 1);
    }
  }, [pollData, isEditing, form]);
  
  // Field arrays for managing questions and answers
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion, update: updateQuestion } = 
    useFieldArray({
      control: form.control,
      name: "questions",
    });

  // Track current location scope for UI updates
  const locationScope = form.watch("poll.locationScope");
  
  // Handler for country selection change
  const handleCountryChange = (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    if (country) {
      form.setValue("poll.locationCountry", country.name);
      setSelectedCountry(country.name);
      setRegions(getRegionsByCountry(countryId));
      setSelectedRegion("");
      form.setValue("poll.locationRegion", "");
      form.setValue("poll.locationCity", "");
      setCities([]);
    }
  };
  
  // Handler for region selection change
  const handleRegionChange = (regionId: string) => {
    const countryObj = findCountryByName(selectedCountry);
    if (countryObj) {
      const region = regions.find(r => r.id === regionId);
      if (region) {
        form.setValue("poll.locationRegion", region.name);
        setSelectedRegion(region.name);
        setCities(getCitiesByRegion(countryObj.id, regionId));
        form.setValue("poll.locationCity", "");
      }
    }
  };
  
  // Handler for city selection change
  const handleCityChange = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      form.setValue("poll.locationCity", city.name);
    }
  };
  
  // Add a new question
  const addQuestion = () => {
    const newId = nextTempId;
    setNextTempId(prevId => prevId + 3); // Reserve space for 2 default answers
    
    appendQuestion({
      id: newId,
      text: "",
      questionType: "singleChoice",
      required: true,
      order: questionFields.length,
      parentId: undefined,
      parentAnswerId: undefined,
      answers: [
        { id: newId + 1, text: "", order: 0 },
        { id: newId + 2, text: "", order: 1 }
      ]
    });
  };
  
  // Add a new subquestion
  const addSubQuestion = (parentQuestionIdx: number, parentAnswerId: number) => {
    const newId = nextTempId;
    setNextTempId(prevId => prevId + 3); // Reserve space for 2 default answers
    
    const parentQuestion = questionFields[parentQuestionIdx];
    
    appendQuestion({
      id: newId,
      text: "",
      questionType: "singleChoice",
      required: true,
      order: questionFields.length,
      parentId: parentQuestion.id,
      parentAnswerId: parentAnswerId,
      answers: [
        { id: newId + 1, text: "", order: 0 },
        { id: newId + 2, text: "", order: 1 }
      ]
    });
  };
  
  // Add a new answer to a question
  const addAnswer = (questionIdx: number) => {
    const question = form.getValues(`questions.${questionIdx}`);
    const answers = question.answers || [];
    const newId = nextTempId;
    setNextTempId(prevId => prevId + 1);
    
    const updatedQuestion = {
      ...question,
      answers: [
        ...answers,
        { id: newId, text: "", order: answers.length }
      ]
    };
    
    updateQuestion(questionIdx, updatedQuestion);
  };
  
  // Remove an answer from a question
  const removeAnswer = (questionIdx: number, answerIdx: number) => {
    const question = form.getValues(`questions.${questionIdx}`);
    const answers = [...question.answers];
    
    if (answers.length <= 2) {
      toast({
        title: t("Cannot Remove Answer"),
        description: t("Questions must have at least two answer options."),
        variant: "destructive",
      });
      return;
    }
    
    answers.splice(answerIdx, 1);
    
    // Update order values
    const updatedAnswers = answers.map((answer, idx) => ({
      ...answer,
      order: idx
    }));
    
    const updatedQuestion = {
      ...question,
      answers: updatedAnswers
    };
    
    updateQuestion(questionIdx, updatedQuestion);
    
    // We also need to check if this answer has any child questions and remove them
    const removedAnswerId = question.answers[answerIdx].id;
    const childQuestionIndices = questionFields.reduce<number[]>((indices, q, idx) => {
      if (q.parentId === question.id && q.parentAnswerId === removedAnswerId) {
        indices.push(idx);
      }
      return indices;
    }, []);
    
    // Remove child questions in reverse order to avoid index shifting issues
    [...childQuestionIndices].reverse().forEach(idx => {
      removeQuestion(idx);
    });
  };
  
  // Get all questions that are children of a given answer
  const getChildQuestions = (questionId: number, answerId: number) => {
    return questionFields.filter(q => q.parentId === questionId && q.parentAnswerId === answerId);
  };
  
  // Find the index of a question by its ID
  const findQuestionIndex = (id: number) => {
    return questionFields.findIndex(q => q.id === id);
  };
  
  // Check if a question is a child question
  const isChildQuestion = (questionId: number) => {
    return questionFields.some(q => q.parentId === questionId);
  };
  
  // Toggle active question for editing
  const toggleActiveQuestion = (id: number) => {
    setActiveQuestion(currentActive => currentActive === id ? null : id);
  };
  
  // Check if a question has parent (is a subquestion)
  const hasParent = (question: any) => {
    return question.parentId !== undefined && question.parentAnswerId !== undefined;
  };
  
  // Find parent question and answer for a given question
  const getParentInfo = (question: any) => {
    if (!hasParent(question)) return null;
    
    const parentQuestion = questionFields.find(q => q.id === question.parentId);
    if (!parentQuestion) return null;
    
    const parentAnswer = parentQuestion.answers.find(a => a.id === question.parentAnswerId);
    if (!parentAnswer) return null;
    
    return {
      question: parentQuestion,
      answer: parentAnswer
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
        <div className="space-y-8">
          {/* Warning banner when editing survey with responses */}
          {isEditing && pollData && parseInt(pollData.voteCount) > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    {t("Editing Restrictions")}
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    {t("This survey has")} {pollData.voteCount} {t("responses")}. {t("You can only edit the title, description, category, and dates. Questions and answers cannot be modified to preserve data integrity.")}
                  </p>
                </div>
              </div>
            </div>
          )}
          
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
                      placeholder="π.χ. Έρευνα για τη Δημόσια Συγκοινωνία" 
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
                      placeholder="Περιγράψτε λεπτομερώς την έρευνα..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="poll.category"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>{t("Category")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select a category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category: any) => (
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
          
          {/* Duration */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("Duration")}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          {/* Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("Settings")}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="poll.visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Visibility")}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select visibility")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">{t("Public")}</SelectItem>
                        <SelectItem value="restricted">{t("Restricted")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "public" 
                        ? t("Anyone can see this poll") 
                        : t("Only users with the link can see this poll")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="poll.allowExtension"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t("Allow Extension")}</FormLabel>
                      <FormDescription>
                        {t("Allow extending the poll duration")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="poll.showResults"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t("Show Results")}</FormLabel>
                      <FormDescription>
                        {t("Show results in real-time")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="poll.allowComments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t("Allow Comments")}</FormLabel>
                      <FormDescription>
                        {t("Enable comments on this poll")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="poll.requireVerification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t("Require Verification")}</FormLabel>
                      <FormDescription>
                        {t("Users must have verified accounts to vote")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Location Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('profile.locationSettings')}</h3>
            
            <FormField
              control={form.control}
              name="poll.locationScope"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>{t("Location Scope")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select location scope")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="global">{t("Global")}</SelectItem>
                      <SelectItem value="country">{t("Country")}</SelectItem>
                      <SelectItem value="region">{t("Region")}</SelectItem>
                      <SelectItem value="city">{t("City")}</SelectItem>
                      <SelectItem value="geofenced">{t("Geofenced")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === "global" && t("Anyone can vote")}
                    {field.value === "country" && t("Only users from the selected country can vote")}
                    {field.value === "region" && t("Only users from the selected region can vote")}
                    {field.value === "city" && t("Only users from the selected city can vote")}
                    {field.value === "geofenced" && t("Only users within the specified area can vote")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {locationScope === "geofenced" && (
              <div className="mb-4">
                <FormLabel>{t("Geofencing")}</FormLabel>
                <FormDescription className="mb-2">
                  {t("Set the center and radius for the geofenced area")}
                </FormDescription>
                
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-4">
                  <FormField
                    control={form.control}
                    name="poll.centerLat"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("Latitude")}</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="37.98" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              setGeofenceCenterLat(parseFloat(e.target.value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="poll.centerLng"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("Longitude")}</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            placeholder="23.72" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              setGeofenceCenterLng(parseFloat(e.target.value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="poll.radiusKm"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("Radius (km)")}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0.1" 
                            max="1000" 
                            step="0.1" 
                            placeholder="5"
                            {...field} 
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(value);
                              setGeofenceRadius(value || 0);
                            }}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="h-[400px] rounded-md border overflow-hidden">
                  <GeofenceMap 
                    centerLat={geofenceCenterLat}
                    centerLng={geofenceCenterLng}
                    radius={geofenceRadius}
                    onCenterChange={(lat, lng) => {
                      setGeofenceCenterLat(lat);
                      setGeofenceCenterLng(lng);
                      form.setValue("poll.centerLat", lat.toString());
                      form.setValue("poll.centerLng", lng.toString());
                    }}
                    onRadiusChange={(radius) => {
                      setGeofenceRadius(radius);
                      form.setValue("poll.radiusKm", radius);
                    }}
                  />
                </div>
              </div>
            )}
            
            {locationScope === "country" && (
              <FormField
                control={form.control}
                name="poll.locationCountry"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>{t("Country")}</FormLabel>
                    <Select
                      value={countries.find(c => c.name === field.value)?.id || ""}
                      onValueChange={handleCountryChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select a country")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {(locationScope === "region" || locationScope === "city") && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="poll.locationCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Country")}</FormLabel>
                      <Select
                        value={countries.find(c => c.name === field.value)?.id || ""}
                        onValueChange={handleCountryChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select a country")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
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
                  name="poll.locationRegion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Region")}</FormLabel>
                      <Select
                        value={regions.find(r => r.name === field.value)?.id || ""}
                        onValueChange={handleRegionChange}
                        disabled={regions.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select a region")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {!selectedCountry && t("Please select a country first")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {locationScope === "city" && (
                  <FormField
                    control={form.control}
                    name="poll.locationCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("City")}</FormLabel>
                        <Select
                          value={cities.find(c => c.name === field.value)?.id || ""}
                          onValueChange={handleCityChange}
                          disabled={cities.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("Select a city")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {!selectedRegion && t("Please select a region first")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Questions Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t("Questions")}</h3>
              <Button
                type="button"
                onClick={addQuestion}
                variant="outline"
                size="sm"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("Add Question")}
              </Button>
            </div>
            
            <div className="space-y-6">
              {questionFields.map((question, index) => {
                // Only show top-level questions directly in the main view
                if (hasParent(question)) return null;
                
                return (
                  <Card key={question.id} className="relative">
                    <CardContent className="pt-6 pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <FormItem className="flex-1 mb-0">
                          <FormLabel>{t("Question")} #{index + 1}</FormLabel>
                          <FormControl>
                            <Input
                              {...form.register(`questions.${index}.text` as const)}
                              placeholder={t("Enter your question")}
                            />
                          </FormControl>
                          <FormMessage>
                            {form.formState.errors.questions?.[index]?.text?.message}
                          </FormMessage>
                        </FormItem>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActiveQuestion(question.id)}
                          >
                            {activeQuestion === question.id ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (questionFields.length > 1) {
                                removeQuestion(index);
                              } else {
                                toast({
                                  title: t("Cannot Remove"),
                                  description: t("Survey must have at least one question"),
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      {activeQuestion === question.id && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`questions.${index}.questionType` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("Question Type")}</FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("Select question type")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="singleChoice">{t("Single Choice")}</SelectItem>
                                      <SelectItem value="multipleChoice">{t("Multiple Choice")}</SelectItem>
                                      <SelectItem value="ordering">{t("Ordering")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    {field.value === "singleChoice" && t("Respondents can select one option")}
                                    {field.value === "multipleChoice" && t("Respondents can select multiple options")}
                                    {field.value === "ordering" && t("Respondents can order the options by preference")}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`questions.${index}.required` as const}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-[82px]">
                                  <div className="space-y-0.5">
                                    <FormLabel>{t("Required")}</FormLabel>
                                    <FormDescription>
                                      {t("Make this question mandatory")}
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <FormLabel>{t("Answer Options")}</FormLabel>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => addAnswer(index)}
                              >
                                <PlusCircle className="h-4 w-4 mr-1" />
                                {t("Add Option")}
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {question.answers?.map((answer, answerIndex) => (
                                <div key={answer.id} className="relative">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex-1">
                                      <Input
                                        {...form.register(`questions.${index}.answers.${answerIndex}.text` as const)}
                                        placeholder={`${t("Option")} ${answerIndex + 1}`}
                                      />
                                      <FormMessage>
                                        {form.formState.errors.questions?.[index]?.answers?.[answerIndex]?.text?.message}
                                      </FormMessage>
                                    </div>
                                    
                                    <div className="flex space-x-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => addSubQuestion(index, answer.id)}
                                        title={t("Add Sub-Question")}
                                      >
                                        <ArrowRight className="h-4 w-4" />
                                      </Button>
                                      
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeAnswer(index, answerIndex)}
                                        title={t("Remove Option")}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Sub-questions linked to this answer */}
                                  {getChildQuestions(question.id, answer.id).length > 0 && (
                                    <div className="ml-8 mt-2 pl-4 border-l-2 border-border">
                                      <Badge variant="outline" className="mb-2">
                                        {t("Sub-Questions")}
                                      </Badge>
                                      
                                      {getChildQuestions(question.id, answer.id).map((childQuestion) => {
                                        const childIndex = findQuestionIndex(childQuestion.id);
                                        return (
                                          <div key={childQuestion.id} className="mb-2">
                                            <div className="flex items-start">
                                              <ArrowLeft className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />
                                              <div className="flex-1">
                                                <Input
                                                  {...form.register(`questions.${childIndex}.text` as const)}
                                                  placeholder={t("Enter sub-question")}
                                                  className="mb-1"
                                                />
                                                <FormMessage>
                                                  {form.formState.errors.questions?.[childIndex]?.text?.message}
                                                </FormMessage>
                                                
                                                <div className="flex justify-between items-center mt-2">
                                                  <FormField
                                                    control={form.control}
                                                    name={`questions.${childIndex}.questionType` as const}
                                                    render={({ field }) => (
                                                      <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                      >
                                                        <FormControl>
                                                          <SelectTrigger className="w-[150px]">
                                                            <SelectValue placeholder={t("Type")} />
                                                          </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                          <SelectItem value="singleChoice">{t("Single Choice")}</SelectItem>
                                                          <SelectItem value="multipleChoice">{t("Multiple Choice")}</SelectItem>
                                                          <SelectItem value="ordering">{t("Ordering")}</SelectItem>
                                                        </SelectContent>
                                                      </Select>
                                                    )}
                                                  />
                                                  
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleActiveQuestion(childQuestion.id)}
                                                  >
                                                    {activeQuestion === childQuestion.id ? t("Hide Answer Options") : t("Show Options")}
                                                  </Button>
                                                  
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeQuestion(childIndex)}
                                                  >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                  </Button>
                                                </div>
                                                
                                                {activeQuestion === childQuestion.id && (
                                                  <div className="mt-2 space-y-2">
                                                    {childQuestion.answers?.map((childAnswer, childAnswerIndex) => (
                                                      <div key={childAnswer.id} className="flex items-center">
                                                        <Input
                                                          {...form.register(`questions.${childIndex}.answers.${childAnswerIndex}.text` as const)}
                                                          placeholder={`${t("Option")} ${childAnswerIndex + 1}`}
                                                          className="flex-1"
                                                        />
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="icon"
                                                          onClick={() => removeAnswer(childIndex, childAnswerIndex)}
                                                          className="ml-2"
                                                        >
                                                          <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                      </div>
                                                    ))}
                                                    
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => addAnswer(childIndex)}
                                                      className="w-full mt-1"
                                                    >
                                                      <PlusCircle className="h-4 w-4 mr-2" />
                                                      {t("Add Option")}
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              {questionFields.length === 0 && (
                <div className="p-8 text-center border rounded-md">
                  <p className="text-muted-foreground mb-4">{t("No questions added yet")}</p>
                  <Button
                    type="button"
                    onClick={addQuestion}
                    variant="outline"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {t("Add your first question")}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/home")}
            >
              {t('general.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isEditing ? t("Save Changes") : t("Create Survey Poll")}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}