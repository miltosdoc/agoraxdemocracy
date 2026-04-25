import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, isAfter } from "date-fns";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, ChevronLeft, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import type { Poll, User } from "@shared/schema";

type PollExtendData = Poll & {
  creator?: User;
  isCreator?: boolean;
};

export default function PollExtendPage() {
  const { t, locale } = useTranslation();
  const params = useParams();
  const pollId = params.id ? parseInt(params.id) : 0;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Default new end date and time
  const [newEndDate, setNewEndDate] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  // Fetch poll data
  const { data: poll, isLoading, isError } = useQuery<PollExtendData>({
    queryKey: [`/api/polls/${pollId}`],
    enabled: pollId > 0,
  });

  useEffect(() => {
    if (poll?.endDate) {
      const currentEndDate = new Date(poll.endDate);
      const defaultExtendDate = addDays(currentEndDate, 7);
      setNewEndDate(format(defaultExtendDate, "yyyy-MM-dd"));
      setNewEndTime(format(currentEndDate, "HH:mm"));
    }
  }, [poll]);

  // Extend poll mutation
  const extendMutation = useMutation({
    mutationFn: async () => {
      try {
        // Direct approach: Parse the date components
        let newEndDateTime;
        
        if (newEndDate.includes('-')) {
          // Format: YYYY-MM-DD
          const [year, month, day] = newEndDate.split('-').map(Number);
          const [hour, minute] = newEndTime.split(':').map(Number);
          
          newEndDateTime = new Date(year, month - 1, day, hour, minute);
        } else if (newEndDate.includes('/')) {
          // Format: MM/DD/YYYY or DD/MM/YYYY
          let parts = newEndDate.split('/').map(Number);
          const [hour, minute] = newEndTime.split(':').map(Number);
          
          // Assuming MM/DD/YYYY format as common in some browsers
          if (parts.length === 3) {
            // If the last part is a 4-digit year, assume MM/DD/YYYY
            if (parts[2] > 999) {
              newEndDateTime = new Date(parts[2], parts[0] - 1, parts[1], hour, minute);
            } else {
              // Otherwise assume DD/MM/YYYY
              newEndDateTime = new Date(parts[2], parts[1] - 1, parts[0], hour, minute);
            }
          }
        } else {
          throw new Error('Unrecognized date format');
        }
        
        // Validate the date object
        if (!newEndDateTime || isNaN(newEndDateTime.getTime())) {
          throw new Error('Invalid end date or time. Please check the format.');
        }
        
        return await apiRequest("PATCH", `/api/polls/${pollId}/extend`, {
          newEndDate: newEndDateTime.toISOString(),
        });
      } catch (error) {
        throw new Error('Invalid end date or time. Please check the format.');
      }
    },
    onSuccess: () => {
      toast({
        title: t('general.success'),
        description: t("Poll extended successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      navigate(`/polls/${pollId}`);
    },
    onError: (error: Error) => {
      toast({
        title: t('general.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEndDate) {
      toast({
        title: t('general.error'),
        description: "Παρακαλώ επιλέξτε νέα ημερομηνία λήξης",
        variant: "destructive",
      });
      return;
    }

    if (!newEndTime) {
      toast({
        title: t('general.error'),
        description: "Παρακαλώ επιλέξτε νέα ώρα λήξης",
        variant: "destructive",
      });
      return;
    }

    try {
      // Direct approach: Parse the date components
      let newEndDateTime;
      
      if (newEndDate.includes('-')) {
        // Format: YYYY-MM-DD
        const [year, month, day] = newEndDate.split('-').map(Number);
        const [hour, minute] = newEndTime.split(':').map(Number);
        
        newEndDateTime = new Date(year, month - 1, day, hour, minute);
      } else if (newEndDate.includes('/')) {
        // Format: MM/DD/YYYY or DD/MM/YYYY
        let parts = newEndDate.split('/').map(Number);
        const [hour, minute] = newEndTime.split(':').map(Number);
        
        // Assuming MM/DD/YYYY format as common in some browsers
        if (parts.length === 3) {
          // If the last part is a 4-digit year, assume MM/DD/YYYY
          if (parts[2] > 999) {
            newEndDateTime = new Date(parts[2], parts[0] - 1, parts[1], hour, minute);
          } else {
            // Otherwise assume DD/MM/YYYY
            newEndDateTime = new Date(parts[2], parts[1] - 1, parts[0], hour, minute);
          }
        }
      } else {
        throw new Error('Unrecognized date format');
      }
      
      // Validate the date object
      if (!newEndDateTime || isNaN(newEndDateTime.getTime())) {
        throw new Error('Invalid end date or time. Please check the format.');
      }
      
      const currentEndDate = poll?.endDate ? new Date(poll.endDate) : new Date();

      // Validate that the new end date is after the current end date
      if (!isAfter(newEndDateTime, currentEndDate)) {
        toast({
          title: t('general.error'),
          description: "Η νέα ημερομηνία και ώρα λήξης πρέπει να είναι μετά την τρέχουσα",
          variant: "destructive",
        });
        return;
      }
      
      // Call mutation if validation passes
      extendMutation.mutate();
    } catch (error) {
      toast({
        title: t('general.error'),
        description: 'Invalid date or time format. Please check your input.',
        variant: "destructive",
      });
    }
  };

  const handleBackClick = () => {
    navigate(`/polls/${pollId}`);
  };

  // Redirect if loading fails or poll does not exist
  useEffect(() => {
    if (!isLoading && (isError || !poll)) {
      navigate("/not-found");
    }
  }, [isLoading, isError, poll, navigate]);

  // Check if user is not the creator
  useEffect(() => {
    if (poll?.creator && poll.isCreator === false) {
      toast({
        title: t('general.error'),
        description: "Δεν έχετε δικαίωμα να επεκτείνετε αυτή την ψηφοφορία",
        variant: "destructive",
      });
      navigate(`/polls/${pollId}`);
    }
  }, [poll, navigate, toast, pollId]);

  // Redirect if poll is not active or does not allow extension
  useEffect(() => {
    if (poll && (!poll.isActive || !poll.allowExtension)) {
      toast({
        title: t('general.error'),
        description: !poll.isActive 
          ? "Δεν μπορείτε να επεκτείνετε μια ολοκληρωμένη ψηφοφορία" 
          : "Η επέκταση δεν επιτρέπεται για αυτή την ψηφοφορία",
        variant: "destructive",
      });
      navigate(`/polls/${pollId}`);
    }
  }, [poll, navigate, toast, pollId]);

  if (isLoading) {
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

  if (!poll) return null;

  return (
    <div className="min-h-screen flex flex-col">
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

        <h1 className="text-2xl font-bold mb-6">{t("Extend Poll Duration")}</h1>

        <div className="max-w-xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{poll?.title || ""}</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("Current end date")}
                  </label>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    {poll?.endDate ? format(new Date(poll.endDate), "dd/MM/yyyy HH:mm") : ""}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t("New end date")}
                    </label>
                    <Input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t("New end time")}
                    </label>
                    <Input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackClick}
                  >
                    {t('general.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={extendMutation.isPending}
                  >
                    {extendMutation.isPending ? t('general.loading') + "..." : t('general.next')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
