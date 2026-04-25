import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PollWithOptions, PollWithQuestions } from "@shared/schema";
import { format, formatDistance } from "date-fns";
import { el } from "date-fns/locale";
import { Info, Vote, BarChart, Edit, Clock, Settings, Trash2, Share2, MapPin, Loader2, MoreHorizontal, Users, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { VoteModal } from "./vote-modal";
import { ResultsModal } from "./results-modal";
import ShareButtonNew from "./share-button-new";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { useReverseGeocoding, getLocationName } from "@/lib/reverse-geocoding";
import { HtmlContent } from "@/components/ui/html-content";
import { CategoryIcon } from "@/components/ui/category-icon";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PollCardProps {
  poll: PollWithOptions | PollWithQuestions;
  onVote?: () => void;
  onExtend?: () => void;
}

export function PollCard({ poll, onVote, onExtend }: PollCardProps) {
  const { t, locale } = useTranslation();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  

  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Use reverse geocoding to get location details when not in database
  const locationData = useReverseGeocoding(
    poll.locationScope === "geofenced" ? poll.centerLat : null,
    poll.locationScope === "geofenced" ? poll.centerLng : null
  );
  
  const isCreator = user && poll.creatorId === user.id;
  const isActive = poll.isActive;
  
  // Format dates localized to Greek
  const formattedCreatedDate = format(new Date(poll.createdAt), "d MMM yyyy", { locale: el });
  
  // Calculate remaining time for active polls
  const getRemainingTime = () => {
    if (!isActive) {
      const completedDate = format(new Date(poll.endDate), "d MMM", { locale: el });
      return `${t("Completed on")} ${completedDate}`;
    }
    
    const timeLeft = formatDistance(new Date(poll.endDate), new Date(), {
      addSuffix: false,
      locale: el
    });
    
    return `${t("Expires in")} ${timeLeft}`;
  };
  
  // Calculate progress bar percentage for duration
  const getDurationProgress = () => {
    if (!isActive) return 100;
    
    const start = new Date(poll.startDate).getTime();
    const end = new Date(poll.endDate).getTime();
    const now = new Date().getTime();
    
    const totalDuration = end - start;
    const elapsed = now - start;
    
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };
  
  const handleViewDetails = () => {
    navigate(`/polls/${poll.id}`);
  };
  
  const handleVote = () => {
    if (poll.pollType === "surveyPoll") {
      navigate(`/polls/${poll.id}`);
    } else {
      setVoteModalOpen(true);
    }
  };
  
  const handleViewResults = () => {
    if (poll.pollType === "surveyPoll") {
      navigate(`/polls/${poll.id}#results`);
    } else {
      setResultsModalOpen(true);
    }
  };
  
  const handleEdit = () => {
    if (poll.pollType === "surveyPoll") {
      navigate(`/surveys/${poll.id}/edit`);
    } else {
      navigate(`/polls/${poll.id}/edit`);
    }
  };
  
  const handleExtend = () => {
    if (onExtend) onExtend();
  };
  
  const handleVoteSubmit = () => {
    setVoteModalOpen(false);
    if (onVote) onVote();
  };
  
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleViewComments = () => {
    navigate(`/polls/${poll.id}#comments`);
  };
  
  // State for community mode option
  const [communityDialogOpen, setCommunityDialogOpen] = useState(false);
  
  const confirmDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/polls/${poll.id}`);
      
      toast({
        title: t('general.success'),
        description: "Η ψηφοφορία διαγράφηκε επιτυχώς"
      });
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/polls/my"] });
      
      if (onVote) onVote(); // Trigger refresh
    } catch (error: any) {
      // Check if poll has too many participants and offer community mode
      if (error.response?.data?.canSetCommunity) {
        setCommunityDialogOpen(true);
        toast({
          title: t("Cannot Delete"),
          description: error.response?.data?.message || "Δεν μπορείτε να διαγράψετε μια ψηφοφορία με πάνω από 100 συμμετέχοντες, αλλά μπορείτε να την μεταφέρετε στην κοινότητα"
        });
      } else {
        toast({
          title: t('general.error'),
          description: error.message || "Σφάλμα κατά τη διαγραφή της ψηφοφορίας",
          variant: "destructive"
        });
      }
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  // Function to transfer poll to community mode
  const handleTransferToCommunity = async () => {
    try {
      await apiRequest("PATCH", `/api/polls/${poll.id}/community`);
      
      toast({
        title: t('general.success'),
        description: "Η ψηφοφορία μεταφέρθηκε επιτυχώς στην κοινότητα"
      });
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/polls/my"] });
      
      if (onVote) onVote(); // Trigger refresh
    } catch (error: any) {
      toast({
        title: t('general.error'),
        description: error.message || "Σφάλμα κατά τη μεταφορά της ψηφοφορίας",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card 
        className="transition-smooth hover:shadow-lg hover:-translate-y-1 overflow-hidden border border-border rounded-xl bg-card"
        data-testid={`card-poll-${poll.id}`}
      >
        <div className="relative">
          {/* Status badge */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
            <Badge 
              variant={isActive ? "default" : "secondary"} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-sm rounded-lg"
              data-testid={`badge-status-${isActive ? 'active' : 'completed'}`}
            >
              {isActive ? (
                <>
                  <Vote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {t("Active")}
                </>
              ) : (
                <>
                  <BarChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {t("Completed Status")}
                </>
              )}
            </Badge>
          </div>
          
          {/* Category or Admin badge */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
            {isCreator && !poll.communityMode ? (
              <Badge 
                variant="outline" 
                className="bg-amber-50 text-amber-900 border-amber-300 flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-sm rounded-lg"
                data-testid="badge-admin"
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t("Admin")}
              </Badge>
            ) : poll.communityMode ? (
              <Badge 
                variant="outline" 
                className="bg-blue-50 text-blue-900 border-blue-300 flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-sm rounded-lg"
                data-testid="badge-community"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t("Community")}
              </Badge>
            ) : (
              <Badge 
                variant="outline" 
                className="bg-blue-50 text-primary border-blue-300 flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-sm rounded-lg"
                data-testid={`badge-category-${poll.category}`}
              >
                <CategoryIcon category={poll.category} />
                {poll.category}
              </Badge>
            )}
          </div>
          
          <CardContent className="p-5 sm:p-6 lg:p-7">
            <h3 
              className="text-xl sm:text-2xl font-bold mb-3 mt-9 sm:mt-11 leading-tight text-foreground break-words"
              data-testid="text-poll-title"
            >
              {poll.title}
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base mb-4 leading-relaxed">
              <span data-testid="text-created-by">{t("Created by")}</span>{" "}
              <span className="font-semibold">
                {poll.communityMode ? (
                  <span className="text-blue-600" data-testid="text-creator-community">{t("Community")}</span>
                ) : isCreator ? (
                  <span className="text-primary" data-testid="text-creator-you">{t("You")}</span>
                ) : (
                  <span data-testid="text-creator-name">{poll.creator.name}</span>
                )}
              </span>{" "}
              · <span data-testid="text-created-date">{formattedCreatedDate}</span>
            </p>
            <div 
              className="text-sm sm:text-base text-muted-foreground line-clamp-3 mb-4 leading-relaxed" 
              data-testid="text-poll-description"
            >
              <HtmlContent html={poll.description} />
            </div>
          </CardContent>
        </div>
        
        <div className="px-5 sm:px-6 lg:px-7 pb-4">
          <div className="flex justify-between items-center text-sm sm:text-base text-muted-foreground mb-2.5">
            <div className="font-semibold" data-testid="text-vote-count">
              <span className="text-lg sm:text-xl text-foreground">{poll.voteCount}</span>{" "}
              <span className="text-muted-foreground">{t('analytics.votes')}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium" data-testid="text-time-remaining">
              <Clock className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-muted-foreground" />
              <span className="text-xs sm:text-sm">{getRemainingTime()}</span>
            </div>
          </div>
          
          {/* Duration progress bar */}
          <div className="h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden mb-4 shadow-inner" data-testid="progress-duration">
            <div 
              className={`h-full rounded-full transition-smooth ${isActive ? 'bg-primary' : 'bg-secondary'}`} 
              style={{ width: `${getDurationProgress()}%` }}
            ></div>
          </div>
          
          {/* Location information */}
          {poll.locationScope !== "global" && (
            <div 
              className="flex items-start gap-2 text-xs sm:text-sm text-foreground mb-4 bg-gradient-to-r from-blue-50 to-muted/50 rounded-lg p-3 sm:p-3.5 border border-blue-200 shadow-sm" 
              data-testid="text-location-info"
            >
              <MapPin className="h-4 w-4 sm:h-[18px] sm:w-[18px] mt-0.5 flex-shrink-0 text-primary" />
              <div className="flex-1 leading-relaxed">
                {poll.locationScope === "geofenced" ? (
                  <div>
                    <span className="font-bold text-foreground">{t("Geofenced")}</span>{" "}
                    <span className="font-medium">- {poll.radiusKm} km</span>
                    <div className="mt-1.5 text-muted-foreground">
                      {/* First try database fields */}
                      {(poll.locationCity || poll.city) ? (
                        <span>
                          {/* Display city/municipality */}
                          {poll.locationCity || poll.city}
                          
                          {/* Region if available */}
                          {(poll.locationRegion || poll.region) && 
                            <span>, {poll.locationRegion || poll.region}</span>}
                          
                          {/* Country if available */}
                          {(poll.locationCountry || poll.country) && 
                            <span>, {poll.locationCountry || poll.country}</span>}
                        </span>
                      ) : locationData.loading ? (
                        <span className="animate-pulse flex items-center gap-1">
                          <Loader2 className="h-3 w-3 inline-block animate-spin" />
                          {t("Loading location...")}
                        </span>
                      ) : locationData.error ? (
                        <span className="font-mono text-xs">{t("Location Coordinates")}: {Number(poll.centerLat).toFixed(4)}, {Number(poll.centerLng).toFixed(4)}</span>
                      ) : (
                        <span>
                          {/* City/municipality from reverse geocoding */}
                          {(locationData.municipality || locationData.city || locationData.town) && 
                           <span>{locationData.municipality || locationData.city || locationData.town}</span>}
                          
                          {/* Region from reverse geocoding if available */}
                          {locationData.region && <span>, {locationData.region}</span>}
                          
                          {/* Country from reverse geocoding */}
                          {locationData.country && <span>, {locationData.country}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span>
                    <span className="font-bold text-foreground">{t("Location restricted poll")}</span>:{" "}
                    <span className="font-medium">{
                      poll.locationScope === "country" ? poll.locationCountry || poll.country :
                      poll.locationScope === "region" ? `${poll.locationRegion || poll.region}, ${poll.locationCountry || poll.country}` :
                      poll.locationScope === "city" ? `${poll.locationCity || poll.city}, ${poll.locationRegion || poll.region}` : ""
                    }</span>
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Group poll indicator */}
          {poll.groupId && (
            <div 
              className="flex items-center gap-2 text-xs sm:text-sm text-foreground mb-4 bg-gradient-to-r from-purple-50 to-muted/50 rounded-lg p-3 sm:p-3.5 border border-purple-200 shadow-sm" 
              data-testid="text-group-poll-indicator"
            >
              <Users className="h-4 w-4 sm:h-[18px] sm:w-[18px] flex-shrink-0 text-purple-600" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold text-foreground">{t("Group Poll")}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Poll actions */}
        {isCreator && !poll.communityMode ? (
          <div className="px-5 sm:px-6 lg:px-7 pb-5 sm:pb-6 border-t border-border pt-4">
            {/* Desktop layout */}
            <div className="hidden sm:block">
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleViewDetails} 
                    className="min-h-[44px] px-4 transition-smooth hover:bg-muted"
                    data-testid="button-details"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    {t('general.details')}
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleViewResults} 
                    className="min-h-[44px] px-4 transition-smooth hover:bg-muted"
                    data-testid="button-results"
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    {t('general.results')}
                  </Button>

                  {poll.allowComments === true && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleViewComments} 
                      className="min-h-[44px] px-4 transition-smooth hover:bg-muted"
                      data-testid="button-comments"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {t('general.comments')}
                    </Button>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="min-h-[44px] min-w-[44px] transition-smooth hover:bg-muted"
                      data-testid="button-more-options"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem 
                      onClick={handleEdit} 
                      className="cursor-pointer py-3"
                      data-testid="menuitem-edit"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('general.edit')}
                    </DropdownMenuItem>
                    
                    {isActive && poll.allowExtension && (
                      <DropdownMenuItem 
                        onClick={handleExtend} 
                        className="cursor-pointer py-3"
                        data-testid="menuitem-extend"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {t('general.next')}
                      </DropdownMenuItem>
                    )}
                    
                    {/* Community mode option */}
                    <DropdownMenuItem 
                      onClick={() => setCommunityDialogOpen(true)} 
                      className="cursor-pointer py-3"
                      data-testid="menuitem-transfer-community"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {t("Transfer to Community")}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      className="cursor-pointer py-3 text-red-600 focus:text-red-600"
                      data-testid="menuitem-delete"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('general.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Share button */}
              <div data-testid="component-share-button">
                <ShareButtonNew pollId={poll.id} pollTitle={poll.title} pollDescription={poll.description} />
              </div>
              
              {/* Creator vote button on its own row for better visibility */}
              {isActive && !poll.userVoted && (
                <Button 
                  onClick={handleVote} 
                  className="w-full bg-primary text-white hover:bg-primary/90 min-h-[44px] px-6 font-semibold shadow-md transition-smooth mt-3"
                  data-testid="button-vote-creator"
                >
                  <Vote className="h-4 w-4 mr-2" />
                  {poll.pollType === "surveyPoll" ? t("Enter the Survey Poll") : t("Vote on Your Poll")}
                </Button>
              )}
            </div>

            {/* Mobile layout - stacked buttons */}
            <div className="sm:hidden space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleViewDetails} 
                  className="flex-1 min-h-[44px] transition-smooth hover:bg-muted"
                  data-testid="button-details-mobile"
                >
                  <Info className="h-4 w-4 mr-1.5" />
                  {t('general.details')}
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleViewResults} 
                  className="flex-1 min-h-[44px] transition-smooth hover:bg-muted"
                  data-testid="button-results-mobile"
                >
                  <BarChart className="h-4 w-4 mr-1.5" />
                  {t('general.results')}
                </Button>

                {poll.allowComments === true && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleViewComments} 
                    className="flex-1 min-h-[44px] transition-smooth hover:bg-muted"
                    data-testid="button-comments-mobile"
                  >
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    {t('general.comments')}
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 min-h-[44px] transition-smooth"
                      data-testid="button-more-options-mobile"
                    >
                      <MoreHorizontal className="h-4 w-4 mr-1.5" />
                      {t("More")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem 
                      onClick={handleEdit} 
                      className="cursor-pointer py-3"
                      data-testid="menuitem-edit-mobile"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('general.edit')}
                    </DropdownMenuItem>
                    
                    {isActive && poll.allowExtension && (
                      <DropdownMenuItem 
                        onClick={handleExtend} 
                        className="cursor-pointer py-3"
                        data-testid="menuitem-extend-mobile"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {t('general.next')}
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem 
                      onClick={() => setCommunityDialogOpen(true)} 
                      className="cursor-pointer py-3"
                      data-testid="menuitem-transfer-community-mobile"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {t("Transfer to Community")}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      className="cursor-pointer py-3 text-red-600 focus:text-red-600"
                      data-testid="menuitem-delete-mobile"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('general.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div data-testid="component-share-button-mobile">
                  <ShareButtonNew pollId={poll.id} pollTitle={poll.title} pollDescription={poll.description} />
                </div>
              </div>

              {/* Creator vote button - full width on mobile */}
              {isActive && !poll.userVoted && (
                <Button 
                  onClick={handleVote} 
                  className="w-full bg-primary text-white hover:bg-primary/90 min-h-[48px] font-semibold shadow-md transition-smooth"
                  data-testid="button-vote-creator-mobile"
                >
                  <Vote className="h-5 w-5 mr-2" />
                  {poll.pollType === "surveyPoll" ? t("Enter the Survey Poll") : t("Vote on Your Poll")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-5 sm:px-6 lg:px-7 pb-5 sm:pb-6 border-t border-border pt-4">
            {/* Desktop layout */}
            <div className="hidden sm:flex justify-between items-center mb-3">
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleViewDetails} 
                  className="min-h-[44px] px-4 transition-smooth hover:bg-muted"
                  data-testid="button-details-user"
                >
                  <Info className="h-4 w-4 mr-2" />
                  {t('general.details')}
                </Button>
                
                {poll.allowComments === true && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleViewComments} 
                    className="min-h-[44px] px-4 transition-smooth hover:bg-muted"
                    data-testid="button-comments-user"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('general.comments')}
                  </Button>
                )}
                
                {(poll.showResults && isActive && !poll.userVoted) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleViewResults} 
                    className="min-h-[44px] px-4 transition-smooth hover:bg-muted"
                    data-testid="button-results-user-live"
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    {t('general.results')}
                  </Button>
                )}
              </div>
              
              {isActive && !poll.userVoted ? (
                <Button 
                  onClick={handleVote} 
                  className="bg-primary text-white hover:bg-primary/90 min-h-[44px] px-6 font-semibold shadow-md transition-smooth"
                  data-testid="button-vote-user"
                >
                  <Vote className="h-5 w-5 mr-2" />
                  {t('general.vote')}
                </Button>
              ) : (
                <Button 
                  onClick={handleViewResults} 
                  variant="secondary" 
                  className="min-h-[44px] px-6 font-semibold shadow-sm transition-smooth"
                  data-testid="button-view-results-user"
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  {t('general.results')}
                </Button>
              )}
            </div>

            {/* Mobile layout - stacked */}
            <div className="sm:hidden space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleViewDetails} 
                  className="flex-1 min-h-[44px] transition-smooth hover:bg-muted"
                  data-testid="button-details-user-mobile"
                >
                  <Info className="h-4 w-4 mr-1.5" />
                  {t('general.details')}
                </Button>
                
                {poll.allowComments === true && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleViewComments} 
                    className="flex-1 min-h-[44px] transition-smooth hover:bg-muted"
                    data-testid="button-comments-user-mobile"
                  >
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    {t('general.comments')}
                  </Button>
                )}
                
                {(poll.showResults && isActive && !poll.userVoted) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleViewResults} 
                    className="flex-1 min-h-[44px] transition-smooth hover:bg-muted"
                    data-testid="button-results-user-mobile-live"
                  >
                    <BarChart className="h-4 w-4 mr-1.5" />
                    {t('general.results')}
                  </Button>
                )}
              </div>
              
              {isActive && !poll.userVoted ? (
                <Button 
                  onClick={handleVote} 
                  className="w-full bg-primary text-white hover:bg-primary/90 min-h-[48px] font-semibold shadow-md transition-smooth"
                  data-testid="button-vote-user-mobile"
                >
                  <Vote className="h-5 w-5 mr-2" />
                  {t('general.vote')}
                </Button>
              ) : (
                <Button 
                  onClick={handleViewResults} 
                  variant="secondary" 
                  className="w-full min-h-[48px] font-semibold shadow-sm transition-smooth"
                  data-testid="button-view-results-user-mobile"
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  {t('general.results')}
                </Button>
              )}
            </div>
            
            <div className="mt-3" data-testid="component-share-button-user">
              <ShareButtonNew pollId={poll.id} pollTitle={poll.title} pollDescription={poll.description} />
            </div>
          </div>
        )}
      </Card>
      
      {voteModalOpen && (
        <VoteModal 
          poll={poll as PollWithOptions} 
          isOpen={voteModalOpen} 
          onClose={() => setVoteModalOpen(false)}
          onVoteSubmit={handleVoteSubmit}
        />
      )}
      
      {resultsModalOpen && (
        <ResultsModal 
          pollId={poll.id} 
          isOpen={resultsModalOpen} 
          onClose={() => setResultsModalOpen(false)} 
        />
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Poll")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete this poll? This action cannot be undone and all votes and comments will be permanently deleted.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t('general.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600 min-h-[44px]"
              data-testid="button-confirm-delete"
            >
              {t('general.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Community transfer confirmation dialog */}
      <AlertDialog open={communityDialogOpen} onOpenChange={setCommunityDialogOpen}>
        <AlertDialogContent data-testid="dialog-transfer-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Transfer to Community")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This action will transfer your poll to community ownership. Your name will no longer be associated with it, and you will no longer be able to edit or delete it. Are you sure you want to continue?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-transfer">{t('general.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleTransferToCommunity}
              className="bg-blue-500 text-white hover:bg-blue-600 min-h-[44px]"
              data-testid="button-confirm-transfer"
            >
              {t("Transfer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
