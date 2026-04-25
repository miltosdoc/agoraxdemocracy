import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, ApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PollWithQuestions, PollQuestionWithAnswers } from "@shared/schema";
import { Vote, Clock, MapPin, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LocationDetector } from "@/components/user/location-detector";
import { isWithinGeofence } from "@/lib/geofencing";
import { useTranslation } from "@/hooks/use-translation";
import { ErrorMessage } from "@/components/ui/error-message";
import { HtmlContent } from "@/components/ui/html-content";
import { RankingVote } from "./ranking-vote";
import { Progress } from "@/components/ui/progress";

interface SurveyVoteModalProps {
  poll: PollWithQuestions;
  isOpen: boolean;
  onClose: () => void;
  onVoteSubmit?: () => void;
}

interface QuestionResponse {
  questionId: number;
  answerId?: number;
  answerValue?: any;
}

export function SurveyVoteModal({ poll, isOpen, onClose, onVoteSubmit }: SurveyVoteModalProps) {
  const { t, locale } = useTranslation();
  const [responses, setResponses] = useState<Record<number, QuestionResponse>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState<Error | ApiError | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [locationState, setLocationState] = useState<"checking" | "eligible" | "ineligible" | "needsDetection" | "needsVerification">("checking");

  // Compute visible questions based on current responses (handles branching/conditional questions)
  const getVisibleQuestions = () => {
    const rootQuestions = poll.questions.filter(q => !q.parentId);
    const visible: typeof poll.questions = [];
    
    const addQuestion = (question: typeof poll.questions[0]) => {
      visible.push(question);
      
      // Check if this question has been answered
      const response = responses[question.id];
      if (!response) return;
      
      // For single choice, check child questions based on selected answer
      if (question.questionType === "singleChoice" && response.answerId) {
        const childQuestions = poll.questions.filter(
          q => q.parentId === question.id && q.parentAnswerId === response.answerId
        );
        childQuestions.forEach(addQuestion);
      }
      
      // For multiple choice, include child questions for all selected answers
      if (question.questionType === "multipleChoice" && Array.isArray(response.answerValue)) {
        const selectedAnswerIds = response.answerValue as number[];
        selectedAnswerIds.forEach(answerId => {
          const childQuestions = poll.questions.filter(
            q => q.parentId === question.id && q.parentAnswerId === answerId
          );
          childQuestions.forEach(addQuestion);
        });
      }
    };
    
    rootQuestions.forEach(addQuestion);
    return visible;
  };

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentQuestionIndex];

  // Calculate progress based on visible questions
  const progress = visibleQuestions.length > 0 
    ? ((currentQuestionIndex + 1) / visibleQuestions.length) * 100 
    : 0;

  // Check location eligibility
  useEffect(() => {
    if (!user || !poll) return;
    
    if (poll.locationScope === "global") {
      setLocationState("eligible");
      return;
    }
    
    if (poll.creatorId === user.id) {
      setLocationState("eligible");
      return;
    }
    
    if (user.locationConfirmed && !user.locationVerified) {
      setLocationState("needsVerification");
      return;
    }
    
    if (!user.locationConfirmed) {
      setLocationState("needsDetection");
      return;
    }
    
    let isEligible = false;
    
    if (poll.locationScope === "geofenced") {
      if (poll.centerLat && poll.centerLng && poll.radiusKm && 
          user.latitude && user.longitude) {
        isEligible = isWithinGeofence(
          parseFloat(user.latitude),
          parseFloat(user.longitude),
          parseFloat(poll.centerLat),
          parseFloat(poll.centerLng),
          poll.radiusKm
        );
      }
    }
    
    setLocationState(isEligible ? "eligible" : "ineligible");
  }, [user, poll]);

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
      });
      setLocationState("eligible");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  // Helper function to validate if a question is properly answered
  const isQuestionAnswered = (question: typeof poll.questions[0]) => {
    const response = responses[question.id];
    if (!response) return false;
    
    // For multiple choice, check if at least one answer is selected
    if (question.questionType === "multipleChoice") {
      const answerIds = response.answerValue as number[] || [];
      return answerIds.length > 0;
    }
    
    // For single choice, check if answerId is set
    if (question.questionType === "singleChoice") {
      return response.answerId !== undefined;
    }
    
    // For ordering, check if answerValue array exists and has items
    if (question.questionType === "ordering") {
      const orderedIds = response.answerValue as number[] || [];
      return orderedIds.length > 0;
    }
    
    return false;
  };

  // Helper function to format responses for submission
  // Multiple choice questions need to be split into separate response records
  const formatResponsesForSubmission = () => {
    const formatted: Array<{
      pollId: number;
      userId: number;
      questionId: number;
      answerId?: number;
      answerValue?: any;
    }> = [];
    
    Object.values(responses).forEach(response => {
      const question = poll.questions.find(q => q.id === response.questionId);
      
      if (question?.questionType === "multipleChoice" && Array.isArray(response.answerValue)) {
        // For multiple choice, create a separate record for each selected answer
        const selectedAnswerIds = response.answerValue as number[];
        selectedAnswerIds.forEach(answerId => {
          formatted.push({
            pollId: poll.id,
            userId: user!.id,
            questionId: response.questionId,
            answerId: answerId,
            answerValue: null,
          });
        });
      } else {
        // For single choice and ordering, keep existing format
        formatted.push({
          pollId: poll.id,
          userId: user!.id,
          questionId: response.questionId,
          answerId: response.answerId,
          answerValue: response.answerValue,
        });
      }
    });
    
    return formatted;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      
      // Validate all required visible questions are answered
      for (const question of visibleQuestions) {
        if (question.required && !isQuestionAnswered(question)) {
          throw new Error(`${t("Question")} "${question.text}" ${t("is required")}`);
        }
      }
      
      // Format responses for API (splits multiple choice into separate records)
      const formattedResponses = formatResponsesForSubmission();
      
      await apiRequest("POST", `/api/surveys/${poll.id}/respond`, {
        responses: formattedResponses
      });
    },
    onSuccess: () => {
      toast({
        title: t('general.success'),
        description: t("Your responses have been submitted successfully."),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/${poll.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      onVoteSubmit?.();
      onClose();
    },
    onError: (error: any) => {
      setError(error);
      toast({
        title: t('general.error'),
        description: error instanceof ApiError 
          ? error.message 
          : t("An error occurred. Please try again."),
        variant: "destructive",
      });
    }
  });

  const handleAnswerChange = (questionId: number, answerId: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        answerId,
      }
    }));
  };

  const handleMultipleChoiceChange = (questionId: number, answerId: number, checked: boolean) => {
    setResponses(prev => {
      const current = prev[questionId];
      let answerIds = current?.answerValue as number[] || [];
      
      if (checked) {
        answerIds = [...answerIds, answerId];
      } else {
        answerIds = answerIds.filter(id => id !== answerId);
      }
      
      return {
        ...prev,
        [questionId]: {
          questionId,
          answerValue: answerIds,
        }
      };
    });
  };

  const handleOrderingChange = (questionId: number, orderedIds: number[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        answerValue: orderedIds,
      }
    }));
  };

  // Auto-initialize ordering questions with default order when first displayed
  useEffect(() => {
    if (!currentQuestion || currentQuestion.questionType !== "ordering") return;
    
    // Only initialize if not already answered
    if (responses[currentQuestion.id]) return;
    
    // Initialize with answers in their original order
    const defaultOrder = currentQuestion.answers
      .sort((a, b) => a.order - b.order)
      .map(answer => answer.id);
    
    handleOrderingChange(currentQuestion.id, defaultOrder);
  }, [currentQuestion?.id, currentQuestion?.questionType]);

  // Clamp currentQuestionIndex when visibleQuestions changes to prevent index drift
  useEffect(() => {
    if (visibleQuestions.length === 0) {
      // Reset to 0 when no visible questions
      if (currentQuestionIndex !== 0) {
        setCurrentQuestionIndex(0);
      }
    } else if (currentQuestionIndex >= visibleQuestions.length) {
      // Clamp to last valid index when list shrinks
      setCurrentQuestionIndex(visibleQuestions.length - 1);
    }
  }, [visibleQuestions.length, currentQuestionIndex]);

  // Clean up responses for questions that are no longer visible
  useEffect(() => {
    const visibleQuestionIds = new Set(visibleQuestions.map(q => q.id));
    const currentResponseIds = Object.keys(responses).map(Number);
    
    const staleResponseIds = currentResponseIds.filter(id => !visibleQuestionIds.has(id));
    
    if (staleResponseIds.length > 0) {
      setResponses(prev => {
        const cleaned = { ...prev };
        staleResponseIds.forEach(id => delete cleaned[id]);
        return cleaned;
      });
    }
  }, [visibleQuestions]);

  const handleNext = () => {
    if (currentQuestion.required && !isQuestionAnswered(currentQuestion)) {
      toast({
        title: t("Required"),
        description: t("Please answer this question before continuing"),
        variant: "destructive",
      });
      return;
    }
    
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate();
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

  if (locationState === "needsDetection") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("Location Detection")}</DialogTitle>
          </DialogHeader>
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertTitle>{t("Location Required")}</AlertTitle>
            <AlertDescription>
              {t("This poll requires location verification. Please detect your location to participate.")}
            </AlertDescription>
          </Alert>
          <LocationDetector onComplete={() => setLocationState("checking")} />
        </DialogContent>
      </Dialog>
    );
  }

  if (locationState === "needsVerification") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("Verify Location")}</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("Location Verification Required")}</AlertTitle>
            <AlertDescription>
              {t("Your location needs to be verified before you can vote in this poll.")}
            </AlertDescription>
          </Alert>
          <Button onClick={() => verifyLocationMutation.mutate()}>
            {t("Verify My Location")}
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (locationState === "ineligible") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("Not Eligible")}</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("Location Restricted")}</AlertTitle>
            <AlertDescription>
              {t("You are not eligible to vote in this poll based on your location.")}
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentQuestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{poll.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t("Question")} {currentQuestionIndex + 1} {t("of")} {visibleQuestions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {currentQuestion.text}
                {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentQuestion.questionType === "singleChoice" && t("Select one option")}
                {currentQuestion.questionType === "multipleChoice" && t("Select one or more options")}
                {currentQuestion.questionType === "ordering" && t("Rank the options in order of preference")}
              </p>
            </div>

            {/* Single Choice */}
            {currentQuestion.questionType === "singleChoice" && (
              <RadioGroup
                value={responses[currentQuestion.id]?.answerId?.toString()}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
              >
                <div className="space-y-2">
                  {currentQuestion.answers.map((answer) => (
                    <div
                      key={answer.id}
                      className="flex items-center p-3 border border-input rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleAnswerChange(currentQuestion.id, answer.id)}
                    >
                      <RadioGroupItem
                        value={answer.id.toString()}
                        id={`answer-${answer.id}`}
                      />
                      <Label
                        htmlFor={`answer-${answer.id}`}
                        className="ml-2 cursor-pointer flex-1"
                      >
                        {answer.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {/* Multiple Choice */}
            {currentQuestion.questionType === "multipleChoice" && (
              <div className="space-y-2">
                {currentQuestion.answers.map((answer) => {
                  const answerIds = (responses[currentQuestion.id]?.answerValue as number[]) || [];
                  const isChecked = answerIds.includes(answer.id);
                  
                  return (
                    <div
                      key={answer.id}
                      className="flex items-center p-3 border border-input rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleMultipleChoiceChange(currentQuestion.id, answer.id, !isChecked)}
                    >
                      <Checkbox
                        id={`answer-${answer.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          handleMultipleChoiceChange(currentQuestion.id, answer.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`answer-${answer.id}`}
                        className="ml-2 cursor-pointer flex-1"
                      >
                        {answer.text}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ordering/Ranking */}
            {currentQuestion.questionType === "ordering" && (
              <RankingVote
                options={currentQuestion.answers}
                onChange={(orderedIds) => handleOrderingChange(currentQuestion.id, orderedIds)}
              />
            )}
          </div>

          {/* Error Display */}
          {error && <ErrorMessage error={error} />}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            {t("Previous")}
          </Button>
          
          <div className="flex gap-2">
            {currentQuestionIndex < visibleQuestions.length - 1 ? (
              <Button onClick={handleNext}>
                {t('general.next')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('general.submit')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
