import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { VoteModal } from "@/components/poll/vote-modal";
import { SurveyVoteModal } from "@/components/poll/survey-vote-modal";
import { BallotVoteModal } from "@/components/poll/ballot-vote-modal";
import { ResultsModal } from "@/components/poll/results-modal";
import { SurveyResultsModal } from "@/components/poll/survey-results-modal";
import ShareButtonNew from "@/components/poll/share-button-new";
import { HtmlContent } from "@/components/ui/html-content";
import { CategoryIcon } from "@/components/ui/category-icon";
import { format, formatDistance } from "date-fns";
import { el } from "date-fns/locale";
import { DynamicHead } from "@/components/head/DynamicHead";
import {
  Calendar,
  Clock,
  Edit,
  BarChart,
  User,
  Vote,
  Info,
  ChevronLeft,
  MessageSquare,
  LogIn,
  UserPlus,
  Loader2,
  MapPin,
  Map,
  Building,
  Home,
  Mail,
  Globe,
  Send
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { PollWithOptions, PollWithQuestions } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PollComment {
  id: number;
  text: string;
  createdAt: string;
  user: {
    name: string;
    username: string;
  };
}

// Component to display detailed location information from reverse geocoding API
interface LocationDetailsProps {
  latitude: number | null;
  longitude: number | null;
}

function LocationDetails({ latitude, longitude }: LocationDetailsProps) {
  const { t } = useTranslation();
  const [locationData, setLocationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocationDetails = async () => {
      if (!latitude || !longitude) return;

      setLoading(true);
      setError(null);

      try {
        // Try to fetch detailed location data from OpenStreetMap Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
          {
            headers: {
              'Accept-Language': navigator.language,
              'User-Agent': 'AgoraX-Democracy-Platform',
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();
        setLocationData(data);
      } catch (err) {
        console.error('Error fetching location details:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchLocationDetails();
  }, [latitude, longitude]);

  if (loading) {
    return <div className="text-xs text-muted-foreground"><Loader2 className="h-3 w-3 inline animate-spin mr-1" /> {t("Loading location details...")}</div>;
  }

  if (error) {
    return <div className="text-xs text-muted-foreground">{t("Could not load detailed location information")}</div>;
  }

  if (!locationData || !locationData.address) {
    return null;
  }

  // Extract all relevant address components
  const {
    house_number,
    road,
    neighbourhood,
    suburb,
    village,
    town,
    city,
    municipality,
    county,
    state,
    region,
    postcode,
    country,
    country_code
  } = locationData.address;

  return (
    <div className="space-y-1">
      <h4 className="font-medium text-foreground text-xs">{t("Detailed Location Information")}</h4>

      {/* Street level */}
      {(road || house_number) && (
        <div className="flex items-start">
          <Home className="h-3 w-3 mr-1 text-muted-foreground mt-0.5" />
          <span>
            {road ? road : ""}{house_number ? ` ${house_number}` : ""}
          </span>
        </div>
      )}

      {/* Neighborhood/Suburb level */}
      {(neighbourhood || suburb || village || municipality) && (
        <div className="flex items-start">
          <Building className="h-3 w-3 mr-1 text-muted-foreground mt-0.5" />
          <span>
            {neighbourhood || suburb || village || municipality}
          </span>
        </div>
      )}

      {/* City/Town level */}
      {(city || town) && (
        <div className="flex items-start">
          <MapPin className="h-3 w-3 mr-1 text-muted-foreground mt-0.5" />
          <span>{city || town}</span>
        </div>
      )}

      {/* Region/State level */}
      {(state || county || region) && (
        <div className="flex items-start">
          <Map className="h-3 w-3 mr-1 text-muted-foreground mt-0.5" />
          <span>{state || county || region}</span>
        </div>
      )}

      {/* Country level */}
      {country && (
        <div className="flex items-start">
          <Globe className="h-3 w-3 mr-1 text-muted-foreground mt-0.5" />
          <span>{country}{country_code ? ` (${country_code.toUpperCase()})` : ""}</span>
        </div>
      )}

      {/* Postal code */}
      {postcode && (
        <div className="flex items-start">
          <Mail className="h-3 w-3 mr-1 text-muted-foreground mt-0.5" />
          <span>{postcode}</span>
        </div>
      )}
    </div>
  );
}

export default function PollDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const pollId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [ballotModalOpen, setBallotModalOpen] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const { data: poll, isLoading, refetch, error } = useQuery<PollWithOptions>({
    queryKey: [`/api/polls/${pollId}`]
  });

  // If it's a survey poll, fetch the full survey data with questions
  const { data: surveyPoll, isLoading: surveyLoading, refetch: refetchSurvey } = useQuery<PollWithQuestions>({
    queryKey: [`/api/surveys/${pollId}`],
    enabled: poll?.pollType === "surveyPoll"
  });

  // Use the appropriate data based on poll type
  const isSurveyPoll = poll?.pollType === "surveyPoll";
  const pollData = isSurveyPoll ? surveyPoll : poll;
  const isDataLoading = isLoading || (isSurveyPoll && surveyLoading);

  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = useQuery<PollComment[]>({
    queryKey: [`/api/polls/${pollId}/comments`],
    enabled: !!pollData?.allowComments,
  });

  // Comment submission mutation
  const commentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      return await apiRequest("POST", `/api/polls/${pollId}/comments`, {
        text: commentText
      });
    },
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      toast({
        title: t("Comment Added"),
        description: t("Your comment has been added successfully."),
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: t('general.error'),
        description: error.message || t("Failed to add comment. Please try again."),
        variant: "destructive",
      });
    }
  });

  // Handle authentication redirect for 404 errors
  useEffect(() => {
    if (!isLoading && error && !user) {
      navigate("/");
    } else if (!isLoading && !poll) {
      navigate("/not-found");
    }
  }, [isLoading, error, poll, user, navigate, pollId]);

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Return null if no poll data is available
  if (!pollData) return null;

  // Generate current URL for sharing
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const isCreator = user && pollData.creatorId === user.id;
  const isActive = pollData.isActive;

  const formattedStartDate = format(new Date(pollData.startDate), "d MMMM yyyy", { locale: el });
  const formattedEndDate = format(new Date(pollData.endDate), "d MMMM yyyy", { locale: el });
  const formattedCreatedDate = format(new Date(pollData.createdAt), "d MMMM yyyy", { locale: el });

  const getRemainingTime = () => {
    if (!isActive) {
      return `${t("Completed on")} ${formattedEndDate}`;
    }

    return `${t("Expires in")} ${formatDistance(new Date(pollData.endDate), new Date(), {
      addSuffix: false,
      locale: el
    })}`;
  };

  // Calculate progress bar percentage for duration
  const getDurationProgress = () => {
    if (!isActive) return 100;

    const start = new Date(pollData.startDate).getTime();
    const end = new Date(pollData.endDate).getTime();
    const now = new Date().getTime();

    const totalDuration = end - start;
    const elapsed = now - start;

    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };

  const handleVoteClick = () => {
    setVoteModalOpen(true);
  };

  const handleResultsClick = () => {
    setResultsModalOpen(true);
  };

  const handleEditClick = () => {
    navigate(`/polls/${pollId}/edit`);
  };

  const handleExtendClick = () => {
    navigate(`/polls/${pollId}/extend`);
  };

  const handleBackClick = () => {
    navigate("/");
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment.trim());
  };

  const handleVoteSubmit = () => {
    setVoteModalOpen(false);
    if (isSurveyPoll) {
      refetchSurvey();
    } else {
      refetch();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Dynamic meta tags for social sharing */}
      <DynamicHead
        title={`${pollData.title} | AgoraX`}
        description={pollData.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
        url={currentUrl}
      />
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 pb-16 sm:pb-6">
        <Button
          variant="ghost"
          className="mb-6 flex items-center"
          onClick={handleBackClick}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('general.back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Poll Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{pollData.title}</h1>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <User className="h-4 w-4 mr-1" />
                      <span className="mr-3">
                        {isCreator ? (
                          <span className="text-primary font-medium">{t("You")}</span>
                        ) : (
                          pollData.creator.name
                        )}
                      </span>
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formattedCreatedDate}</span>
                    </div>
                  </div>
                  <Badge variant={isActive ? "default" : "secondary"} className="flex items-center">
                    {isActive ? (
                      <>
                        <Vote className="h-3 w-3 mr-1" />
                        {t("Active")}
                      </>
                    ) : (
                      <>
                        <BarChart className="h-3 w-3 mr-1" />
                        {t("Completed Status")}
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center mb-4">
                  <Badge variant="outline" className="bg-blue-100 text-primary border-blue-200 flex items-center gap-1">
                    <CategoryIcon category={pollData.category} />
                    {pollData.category}
                  </Badge>
                </div>

                <Separator className="my-4" />

                <div className="mb-6">
                  <HtmlContent html={pollData.description} className="text-foreground" />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <div>
                    <span className="font-semibold">{pollData.voteCount}</span> {t('analytics.votes')}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {getRemainingTime()}
                  </div>
                </div>

                {/* Duration progress bar */}
                <div className="h-1 bg-muted rounded-full overflow-hidden mb-6">
                  <div
                    className={`h-full rounded-full ${isActive ? 'bg-accent' : 'bg-secondary'}`}
                    style={{ width: `${getDurationProgress()}%` }}
                  ></div>
                </div>

                <div className="flex flex-wrap gap-4">
                  {/* For creators */}
                  {isCreator && (
                    <>
                      <Button
                        onClick={handleEditClick}
                        variant="outline"
                        className="flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t("Edit Poll")}
                      </Button>
                      {isActive && pollData.allowExtension && (
                        <Button
                          onClick={handleExtendClick}
                          variant="outline"
                          className="flex items-center"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          {t('general.next')}
                        </Button>
                      )}
                    </>
                  )}

                  {/* For logged in users who can vote (including creators) */}
                  {isActive && !pollData.userVoted && user && (
                    <>
                      <Button
                        onClick={handleVoteClick}
                        className="flex items-center bg-primary hover:bg-primary/90"
                      >
                        <Vote className="h-4 w-4 mr-1" />
                        {isCreator
                          ? (isSurveyPoll ? t("Enter the Survey Poll") : t("Vote on Your Poll"))
                          : t('general.vote')}
                      </Button>

                    </>
                  )}

                  {/* For non-logged in users */}
                  {isActive && !user && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate(`/auth?returnTo=${encodeURIComponent(`/polls/${pollId}`)}`)}
                        variant="outline"
                        className="flex items-center"
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        {t('auth.loginToVote')}
                      </Button>
                      <Button
                        onClick={() => navigate(`/auth?tab=register&returnTo=${encodeURIComponent(`/polls/${pollId}`)}`)}
                        variant="secondary"
                        className="flex items-center"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {t('auth.signUp')}
                      </Button>
                    </div>
                  )}

                  {/* Results button for everyone */}
                  <Button
                    onClick={handleResultsClick}
                    className={`flex items-center ${(!isActive || pollData.userVoted || isCreator) ? "" : "variant-outline"}`}
                    variant={(!isActive || pollData.userVoted || isCreator) ? "default" : "outline"}
                  >
                    <BarChart className="h-4 w-4 mr-1" />
                    {t('general.results')}
                  </Button>

                  {/* Share button for everyone */}
                  <ShareButtonNew
                    pollId={pollData.id}
                    pollTitle={pollData.title}
                    pollDescription={pollData.description}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Poll Options or Questions */}
            <Card className="mt-6">
              <CardContent className="p-6">
                {!isSurveyPoll && poll && (
                  <>
                    <h2 className="text-xl font-semibold mb-4">{t("Options")}</h2>
                    <div className="space-y-3">
                      {poll.options.map((option) => (
                        <div
                          key={option.id}
                          className="p-3 border border-border rounded-md hover:bg-muted/50"
                        >
                          {option.text}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {isSurveyPoll && surveyPoll && (
                  <>
                    <h2 className="text-xl font-semibold mb-4">{t("Questions")}</h2>
                    <div className="space-y-4">
                      {surveyPoll.questions.filter(q => !q.parentId).map((question, index) => (
                        <div
                          key={question.id}
                          className="p-4 border border-border rounded-md bg-muted/20"
                        >
                          <div className="font-medium mb-2">
                            {index + 1}. {question.text}
                            {question.required && <span className="text-destructive ml-1">*</span>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t("Type")}: {question.questionType === "singleChoice" ? t("Single Choice") :
                              question.questionType === "multipleChoice" ? t("Multiple Choice") :
                                t("Ordering")}
                          </div>
                          {question.answers && question.answers.length > 0 && (
                            <div className="mt-2 ml-4 space-y-1">
                              {question.answers.map((answer) => (
                                <div key={answer.id} className="text-sm">
                                  • {answer.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            {pollData.allowComments && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                    <h2 className="text-xl font-semibold">{t('general.comments')}</h2>
                  </div>

                  {/* Comment Form for Authenticated Users */}
                  {user ? (
                    <div className="mb-6">
                      <div className="space-y-3">
                        <Textarea
                          placeholder={t("Share your thoughts on this poll...")}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex justify-end">
                          <Button
                            onClick={handleCommentSubmit}
                            disabled={!newComment.trim() || commentMutation.isPending}
                            className="flex items-center"
                          >
                            {commentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            {t("Add Comment")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800 mb-2">{t("Login to join the conversation")}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/auth?returnTo=${encodeURIComponent(`/polls/${pollId}`)}`)}
                        >
                          {t('auth.login')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/auth?tab=register&returnTo=${encodeURIComponent(`/polls/${pollId}`)}`)}
                        >
                          {t('auth.signUp')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {commentsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : comments && comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-4 bg-muted rounded-md">
                          <div className="flex items-start">
                            <User className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap">
                                <span className="font-medium text-sm">{comment.user.name}</span>
                                <span className="mx-1 text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.createdAt), "d MMM yyyy", { locale: el })}
                                </span>
                              </div>
                              <p className="text-sm mt-1 text-foreground">{comment.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>{t("No comments yet")}</p>
                      <p className="text-sm mt-1">{t("Be the first to comment on this poll")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Poll Details Sidebar */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">{t('general.details')}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("Start Date")}</h3>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-primary" />
                      {formattedStartDate}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("End Date")}</h3>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-primary" />
                      {formattedEndDate}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("Poll Type")}</h3>
                    <p className="flex items-center">
                      <Vote className="h-4 w-4 mr-1 text-primary" />
                      {pollData.pollType === "singleChoice"
                        ? t("Single choice")
                        : pollData.pollType === "multipleChoice"
                          ? t("Multiple choice")
                          : t("Ranking")}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("Visibility")}</h3>
                    <p className="flex items-center">
                      <Info className="h-4 w-4 mr-1 text-primary" />
                      {pollData.visibility === "public"
                        ? t("Public - Visible to all")
                        : t("Restricted - Only via link")}
                    </p>
                  </div>
                  {/* Location information */}
                  {pollData.locationScope !== "global" && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("Location Restrictions")}</h3>
                      <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm">
                        <div className="flex items-start mb-2">
                          <MapPin className="h-4 w-4 mr-2 text-blue-500 mt-0.5" />
                          <div>
                            {pollData.locationScope === "geofenced" ? (
                              <>
                                <p className="font-medium text-foreground">{t("Geofenced Poll")}</p>
                                <p className="text-muted-foreground mb-1">
                                  {t("Users must be within")} {pollData.radiusKm} km {t("from center point")}
                                </p>
                                <p className="text-muted-foreground font-medium">
                                  {pollData.locationCity || ""}{pollData.locationCity ? ", " : ""}
                                  {pollData.locationRegion || ""}{pollData.locationRegion ? ", " : ""}
                                  {pollData.locationCountry || ""}
                                </p>

                                {/* Add detailed location information from reverse geocoding */}
                                {pollData.centerLat && pollData.centerLng && (
                                  <div className="mt-3 border-t border-blue-100 pt-2">
                                    <LocationDetails
                                      latitude={parseFloat(pollData.centerLat)}
                                      longitude={parseFloat(pollData.centerLng)}
                                    />
                                  </div>
                                )}

                                {/* Coordinates display */}
                                {pollData.centerLat && pollData.centerLng && (
                                  <p className="text-xs font-mono text-muted-foreground mt-2 border-t border-blue-100 pt-2">
                                    {t('profile.coordinates')}: {pollData.centerLat}, {pollData.centerLng}
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="font-medium text-foreground">
                                  {pollData.locationScope === "country"
                                    ? t("Country restricted")
                                    : pollData.locationScope === "region"
                                      ? t("Region restricted")
                                      : t("City restricted")
                                  }
                                </p>
                                <p className="text-muted-foreground">
                                  {pollData.locationScope === "country" && pollData.locationCountry}
                                  {pollData.locationScope === "region" && `${pollData.locationRegion}, ${pollData.locationCountry}`}
                                  {pollData.locationScope === "city" && `${pollData.locationCity}, ${pollData.locationRegion}, ${pollData.locationCountry}`}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("Settings")}</h3>
                    <ul className="space-y-1 text-sm">
                      <li>
                        {pollData.allowExtension
                          ? "✓ " + t("Allow duration extension")
                          : "✗ " + t("Allow duration extension")}
                      </li>
                      <li>
                        {pollData.showResults
                          ? "✓ " + t("Show results in real-time")
                          : "✗ " + t("Show results in real-time")}
                      </li>
                      <li>
                        {pollData.allowComments
                          ? "✓ " + t("Allow comments")
                          : "✗ " + t("Allow comments")}
                      </li>
                      <li>
                        {pollData.requireVerification
                          ? "✓ " + t("Require account verification")
                          : "✗ " + t("Require account verification")}
                      </li>
                    </ul>
                  </div>

                  <Separator className="my-2" />

                  {/* Share poll section */}
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-3">{t("Share this poll")}</h3>
                    <ShareButtonNew pollId={pollId} pollTitle={pollData.title} pollDescription={pollData.description} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      {voteModalOpen && isSurveyPoll && surveyPoll && (
        <SurveyVoteModal
          poll={surveyPoll}
          isOpen={voteModalOpen}
          onClose={() => setVoteModalOpen(false)}
          onVoteSubmit={handleVoteSubmit}
        />
      )}

      {voteModalOpen && !isSurveyPoll && poll && (
        <VoteModal
          poll={poll}
          isOpen={voteModalOpen}
          onClose={() => setVoteModalOpen(false)}
          onVoteSubmit={handleVoteSubmit}
        />
      )}

      {ballotModalOpen && !isSurveyPoll && poll && (
        <BallotVoteModal
          poll={poll}
          isOpen={ballotModalOpen}
          onClose={() => setBallotModalOpen(false)}
          onVoteSubmit={handleVoteSubmit}
        />
      )}

      {resultsModalOpen && isSurveyPoll && surveyPoll && (
        <SurveyResultsModal
          poll={surveyPoll}
          isOpen={resultsModalOpen}
          onClose={() => setResultsModalOpen(false)}
        />
      )}

      {resultsModalOpen && !isSurveyPoll && (
        <ResultsModal
          pollId={pollId}
          isOpen={resultsModalOpen}
          onClose={() => setResultsModalOpen(false)}
        />
      )}
    </div>
  );
}
