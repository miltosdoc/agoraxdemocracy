import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, ApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format, formatDistance } from "date-fns";
import { el } from "date-fns/locale";
import { PollWithOptions } from "@shared/schema";
import { Vote, Clock, MapPin, AlertTriangle, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LocationDetector } from "@/components/user/location-detector";
import { isWithinGeofence, calculateDistance } from "@/lib/geofencing";
import { useTranslation } from "@/hooks/use-translation";
import { RankingVote } from "./ranking-vote";
import { ErrorMessage } from "@/components/ui/error-message";
import { HtmlContent } from "@/components/ui/html-content";
import { VerifyGovgrModal } from "../user/verify-govgr-modal";

interface VoteModalProps {
  poll: PollWithOptions;
  isOpen: boolean;
  onClose: () => void;
  onVoteSubmit?: () => void;
}

export function VoteModal({ poll, isOpen, onClose, onVoteSubmit }: VoteModalProps) {
  const { t, locale } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [rankedOptions, setRankedOptions] = useState<number[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<Error | ApiError | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [locationState, setLocationState] = useState<"checking" | "eligible" | "ineligible" | "needsDetection" | "needsVerification">("checking");
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Location verification mutation
  const verifyLocationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/user/verify-location`, {
        verified: true
      });
    },
    onSuccess: () => {
      toast({
        title: t("Location Verified"),
        description: t("Your location has been verified. You may now vote in this poll."),
        variant: "default",
      });
      setLocationState("eligible");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: t('general.error'),
        description: error.message || t("Failed to verify location. Please try again."),
        variant: "destructive",
      });
    }
  });

  // Location rejection mutation
  const rejectLocationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/user/verify-location`, {
        verified: false
      });
    },
    onSuccess: () => {
      toast({
        title: t("Location Rejected"),
        description: t("Your manually entered coordinates have been rejected. Please use GPS detection."),
      });
      setLocationState("needsDetection");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: t('general.error'),
        description: error.message || t("Failed to reject location. Please try again."),
        variant: "destructive",
      });
    }
  });

  // Check if user is eligible to vote based on location restrictions
  useEffect(() => {
    if (!user || !poll) return;

    // If poll is global, user is always eligible
    if (poll.locationScope === "global") {
      setLocationState("eligible");
      return;
    }

    // Special case: If poll creator is equal to current user, they can always vote
    if (poll.creatorId === user.id) {
      setLocationState("eligible");
      return;
    }

    // Check if location needs verification (when coordinates are manually entered but not verified yet)
    if (user.locationConfirmed && !user.locationVerified) {
      // For manually entered coordinates that require verification
      setLocationState("needsVerification");
      return;
    }

    // If user hasn't confirmed their location yet, they need to detect it
    if (!user.locationConfirmed) {
      setLocationState("needsDetection");
      return;
    }

    // Helper function for case-insensitive location matching
    const locationMatches = (pollLocation: string | null | undefined, userLocation: string | null | undefined): boolean => {
      if (!pollLocation || !userLocation) return false;

      // Convert to lowercase and trim for comparison
      const normalizedPoll = pollLocation.toLowerCase().trim();
      const normalizedUser = userLocation.toLowerCase().trim();

      // Check exact match or if one contains the other
      return normalizedPoll === normalizedUser ||
        normalizedPoll.includes(normalizedUser) ||
        normalizedUser.includes(normalizedPoll);
    };

    // Check if user's location matches poll restrictions
    let isEligible = false;

    switch (poll.locationScope) {
      case "geofenced":
        // For geofenced polls, we need to check if the user is within the radius
        if (poll.centerLat && poll.centerLng && poll.radiusKm &&
          user.latitude && user.longitude) {

          // Check if user is within the geofence
          isEligible = isWithinGeofence(
            parseFloat(user.latitude),
            parseFloat(user.longitude),
            parseFloat(poll.centerLat),
            parseFloat(poll.centerLng),
            poll.radiusKm
          );
        }
        break;
    }

    setLocationState(isEligible ? "eligible" : "ineligible");
  }, [user, poll]);

  const voteMutation = useMutation({
    mutationFn: async () => {
      console.log("🗳️ VOTE SUBMISSION STARTED");
      console.log("Poll type:", poll.pollType);
      console.log("Selected options:", selectedOptions);
      console.log("Selected option:", selectedOption);

      // Clear any previous errors
      setError(null);

      let voteData;

      // Handle different poll types with different vote data formats
      switch (poll.pollType) {
        case "singleChoice":
          if (!selectedOption) {
            throw new Error(t("Please select an option"));
          }
          voteData = {
            optionId: selectedOption
          };
          break;

        case "multipleChoice":
          if (selectedOptions.length === 0) {
            throw new Error(t("Please select at least one option"));
          }
          // For multiple choice, send each option as a separate vote
          voteData = {
            optionIds: selectedOptions
          };
          break;

        case "ranking":
          if (rankedOptions.length === 0 || rankedOptions.length !== poll.options.length) {
            throw new Error(t("Please rank all options"));
          }
          voteData = {
            orderedOptionIds: rankedOptions
          };
          break;

        default:
          if (!selectedOption || selectedOption === 0) {
            throw new Error(t("Please select an option"));
          }
          voteData = {
            optionId: selectedOption
          };
      }

      // Debug logging to help identify the issue
      console.log("Vote data being sent:", voteData);
      console.log("Poll options:", poll.options.map(opt => ({ id: opt.id, text: opt.text })));
      console.log("Selected option:", selectedOption);
      console.log("Selected options array:", selectedOptions);
      console.log("Poll type:", poll.pollType);

      // Validate that the option ID exists in the poll options
      if (voteData.optionId && !poll.options.some(opt => opt.id === voteData.optionId)) {
        throw new Error(t("Invalid option selected. Please try again."));
      }

      // For multiple choice, validate all option IDs
      if (voteData.optionIds && Array.isArray(voteData.optionIds)) {
        for (const optionId of voteData.optionIds) {
          if (!poll.options.some(opt => opt.id === optionId)) {
            throw new Error(t("Invalid option selected. Please try again."));
          }
        }
      }

      // First, cast the vote
      const voteResult = await apiRequest("POST", `/api/polls/${poll.id}/vote`, voteData);

      // Then, if there's a comment, add it separately
      if (comment.trim()) {
        await apiRequest("POST", `/api/polls/${poll.id}/comments`, {
          text: comment.trim()
        });
      }

      return voteResult;
    },
    onSuccess: () => {
      toast({
        title: t('general.success'),
        description: t("Vote successful"),
      });
      // Invalidate both polls and comments queries
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: [`/api/polls/${poll.id}/comments`] });
      if (onVoteSubmit) onVoteSubmit();
      onClose();
    },
    onError: (error: Error | ApiError) => {
      // Store the error for display in the UI
      setError(error);

      // Also show a toast notification
      toast({
        title: t('general.error'),
        description: error instanceof ApiError
          ? error.message
          : t("An error occurred while submitting your vote. Please try again."),
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    voteMutation.mutate();
  };

  const timeLeft = formatDistance(new Date(poll.endDate), new Date(), {
    addSuffix: false,
    locale: el
  });

  // Calculate duration bar percentage
  const getDurationProgress = () => {
    const start = new Date(poll.startDate).getTime();
    const end = new Date(poll.endDate).getTime();
    const now = new Date().getTime();

    const totalDuration = end - start;
    const elapsed = now - start;

    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };

  // Helper function to get geographical scope text
  const getLocationScopeText = () => {
    switch (poll.locationScope) {
      case "global":
        return t("Global");
      case "country":
        return `${t("Country")}: ${poll.locationCountry}`;
      case "region":
        return `${t("Region")}: ${poll.locationRegion}, ${poll.locationCountry}`;
      case "city":
        return `${t("City")}: ${poll.locationCity}, ${poll.locationRegion}, ${poll.locationCountry}`;
      case "geofenced":
        if (poll.centerLat && poll.centerLng && poll.radiusKm) {
          return `${t("This poll is restricted to users within a radius of")} ${poll.radiusKm} ${t("km from the center point")} (${parseFloat(poll.centerLat).toFixed(5)}, ${parseFloat(poll.centerLng).toFixed(5)})`;
        }
        return t("Geofenced area");
      default:
        return t("Unknown");
    }
  };

  // When user is not authenticated
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("Login Required")}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t("Authentication Required")}</AlertTitle>
              <AlertDescription>
                {t("You need to be logged in to vote in this poll.")}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col space-y-2 mt-4">
              <Button
                onClick={() => {
                  window.location.href = `/auth?returnTo=/polls/${poll.id}`;
                }}
                className="w-full"
              >
                {t('auth.login')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = `/auth?tab=register&returnTo=/polls/${poll.id}`;
                }}
                className="w-full"
              >
                {t('auth.register')}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {t('general.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // When location is being checked
  if (locationState === "checking") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("Checking Eligibility")}</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>{t("Checking your location eligibility...")}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // When user needs to detect location
  if (locationState === "needsDetection") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Location Required")}</DialogTitle>
          </DialogHeader>

          <div className="mb-4">
            <Alert className="mb-4">
              <MapPin className="h-4 w-4" />
              <AlertTitle>{t("Location Restricted Poll")}</AlertTitle>
              <AlertDescription>
                {t("This poll is only available to voters in")} {getLocationScopeText()}.
                {t("Please detect your location to continue.")}
              </AlertDescription>
            </Alert>

            <LocationDetector onComplete={() => setLocationState("checking")} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {t('general.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // When user is ineligible
  if (locationState === "ineligible") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("Location Restriction")}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t("Not Eligible to Vote")}</AlertTitle>
              <AlertDescription>
                {t("This poll is only available to voters in")} {getLocationScopeText()}.
                {t("Your location does not match the poll's restrictions.")}
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              {user?.latitude && user?.longitude && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <div>
                    <span className="font-medium">{t("Your location")}:</span> {user.latitude}, {user.longitude}
                  </div>
                </div>
              )}
              {user?.latitude && user?.longitude && poll.locationScope === "geofenced" && poll.centerLat && poll.centerLng && poll.radiusKm && (
                <div className="pl-6">
                  <div className="text-xs">
                    {t("Distance from poll center")}: {
                      (calculateDistance(
                        parseFloat(user.latitude),
                        parseFloat(user.longitude),
                        parseFloat(poll.centerLat),
                        parseFloat(poll.centerLng)
                      )).toFixed(2)
                    } km
                  </div>
                  <div className="text-xs text-destructive">
                    {t("Required to be within")}: {poll.radiusKm} km
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {t('general.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // When location needs verification
  if (locationState === "needsVerification") {

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("Location Verification Required")}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t("Manual Location Verification")}</AlertTitle>
              <AlertDescription>
                {t("This poll requires verification of manually entered coordinates.")}
                {t("Please confirm that your entered location is accurate.")}
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <div>
                  <span className="font-medium">{t("Your coordinates")}:</span> {user?.latitude}, {user?.longitude}
                </div>
              </div>
              {poll.locationScope === "geofenced" && poll.centerLat && poll.centerLng && poll.radiusKm && (
                <div className="pl-6 mt-2">
                  <div className="text-xs">
                    {t("Distance from poll center")}: {
                      (calculateDistance(
                        parseFloat(user?.latitude || "0"),
                        parseFloat(user?.longitude || "0"),
                        parseFloat(poll.centerLat),
                        parseFloat(poll.centerLng)
                      )).toFixed(2)
                    } km
                  </div>
                  <div className="text-xs">
                    {t("Poll radius")}: {poll.radiusKm} km
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2 mt-4">
              <p className="text-sm text-center mb-2">{t("Please verify that your location is correct:")}</p>
              <Button
                onClick={() => verifyLocationMutation.mutate()}
                disabled={verifyLocationMutation.isPending}
              >
                {verifyLocationMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    {t("Verifying...")}
                  </div>
                ) : t("Verify Location")}
              </Button>
              <Button
                variant="outline"
                onClick={() => rejectLocationMutation.mutate()}
                disabled={rejectLocationMutation.isPending}
              >
                {rejectLocationMutation.isPending ? t("Resetting...") : t("Reset Location")}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {t('general.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // When user is not Gov.gr verified
  // This is now mandatory for ALL polls as per update
  if (user && !user.govgrVerified) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("Identity Verification Required")}</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <Alert className="mb-4 border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Shield className="h-4 w-4 stroke-amber-600 dark:stroke-amber-400" />
                <AlertTitle>{t("Authentication Required")}</AlertTitle>
                <AlertDescription>
                  {t("To ensure the integrity of the vote, you must verify your identity with Gov.gr before voting.")}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col space-y-4 mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("Verification is simple, fast and secure. It is done once and is valid for all future votes.")}
                </p>

                <Button
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Shield className="h-4 w-4" />
                  {t('ballot.verify')}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                {t('general.cancel')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <VerifyGovgrModal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
        />
      </>
    );
  }

  // Normal voting view (user is eligible)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Voting")}</DialogTitle>
        </DialogHeader>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{poll.title}</h3>
          <HtmlContent html={poll.description} className="text-sm text-muted-foreground mb-4" />

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <Vote className="h-4 w-4 mr-1" />
              {poll.voteCount} {t('analytics.votes')}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {t("Expires in")} {timeLeft}
            </div>
          </div>

          <div className="h-1 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: `${getDurationProgress()}%` }}
            ></div>
          </div>

          {poll.locationScope !== "global" && (
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{t("Location restricted poll")}: {getLocationScopeText()}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {poll.pollType === "singleChoice" && (
            <>
              <h4 className="font-medium">{t("Select an option")}:</h4>

              <RadioGroup
                value={selectedOption?.toString()}
                onValueChange={(value) => setSelectedOption(parseInt(value))}
              >
                <div className="space-y-2">
                  {poll.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center p-3 border border-input rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedOption(option.id)}
                    >
                      <RadioGroupItem
                        value={option.id.toString()}
                        id={`option-${option.id}`}
                      />
                      <Label
                        htmlFor={`option-${option.id}`}
                        className="ml-2 cursor-pointer flex-1"
                      >
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </>
          )}

          {poll.pollType === "multipleChoice" && (
            <>
              <h4 className="font-medium">{t("Select one or more options")}:</h4>
              <div className="space-y-2">
                {poll.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center p-3 border border-input rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      if (selectedOptions.includes(option.id)) {
                        setSelectedOptions(selectedOptions.filter(id => id !== option.id));
                      } else {
                        setSelectedOptions([...selectedOptions, option.id]);
                      }
                    }}
                  >
                    <Checkbox
                      id={`option-${option.id}`}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedOptions([...selectedOptions, option.id]);
                        } else {
                          setSelectedOptions(selectedOptions.filter(id => id !== option.id));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`option-${option.id}`}
                      className="ml-2 cursor-pointer flex-1"
                    >
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            </>
          )}

          {poll.pollType === "ranking" && (
            <>
              <h4 className="font-medium">{t("Rank the options in order of preference")}:</h4>
              <RankingVote
                options={poll.options}
                onChange={(orderedIds) => setRankedOptions(orderedIds)}
              />
            </>
          )}

          {poll.allowComments && (
            <div className="mt-4">
              <Label htmlFor="comment">{t("Comment (optional)")}</Label>
              <Textarea
                id="comment"
                placeholder={t("Add a comment about your vote...")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          {/* Display validation errors or API errors */}
          {error && (
            <ErrorMessage error={error} className="mt-4" />
          )}
        </div>

        <DialogFooter className="flex justify-between mt-4">
          <Button variant="outline" onClick={onClose}>
            {t('general.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              (poll.pollType === "singleChoice" && !selectedOption) ||
              (poll.pollType === "multipleChoice" && selectedOptions.length === 0) ||
              (poll.pollType === "ranking" && rankedOptions.length !== poll.options.length) ||
              voteMutation.isPending
            }
            className="flex items-center"
          >
            <Vote className="mr-1 h-4 w-4" />
            {t("Submit Vote")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
