import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { PollCard } from "@/components/poll/poll-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format, addDays, isAfter } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import type { PollWithOptions } from "@shared/schema";

export default function MyPollsPage() {
  const { t, locale } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendPollId, setExtendPollId] = useState<number | null>(null);
  const [newEndDate, setNewEndDate] = useState("");

  // Fetch user's polls
  const { data: myPolls, isLoading, refetch } = useQuery<PollWithOptions[]>({
    queryKey: ["/api/polls/my"],
  });

  // Filtered polls based on active tab
  const filteredPolls = myPolls
    ? activeTab === "active"
      ? myPolls.filter((poll: PollWithOptions) => poll.isActive)
      : activeTab === "completed"
      ? myPolls.filter((poll: PollWithOptions) => !poll.isActive)
      : myPolls
    : [];

  const handleCreatePoll = () => {
    navigate("/polls/create");
  };

  const handleExtendPoll = (pollId: number) => {
    const poll = myPolls?.find((p: PollWithOptions) => p.id === pollId);
    if (!poll) return;

    // Set the default extension date to 7 days after current end date
    const currentEndDate = new Date(poll.endDate);
    const defaultExtendDate = addDays(currentEndDate, 7);
    setNewEndDate(format(defaultExtendDate, "yyyy-MM-dd"));
    
    setExtendPollId(pollId);
    setExtendModalOpen(true);
  };

  const submitExtendPoll = async () => {
    if (!extendPollId || !newEndDate) return;

    const newEndDateTime = new Date(newEndDate);
    const poll = myPolls?.find((p: PollWithOptions) => p.id === extendPollId);
    
    if (!poll) return;
    
    // Validate that the new end date is after the current end date
    const currentEndDate = new Date(poll.endDate);
    if (!isAfter(newEndDateTime, currentEndDate)) {
      toast({
        title: t('general.error'),
        description: "Η νέα ημερομηνία λήξης πρέπει να είναι μετά την τρέχουσα",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest("PATCH", `/api/polls/${extendPollId}/extend`, {
        newEndDate: newEndDateTime.toISOString()
      });
      
      toast({
        title: t('general.success'),
        description: t("Poll extended successfully")
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/polls/my"] });
      refetch();
      
      setExtendModalOpen(false);
      setExtendPollId(null);
    } catch (error: any) {
      toast({
        title: t('general.error'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 pb-16 sm:pb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('nav.myPolls')}</h1>
          <Button
            onClick={handleCreatePoll}
            className="bg-accent hover:bg-accent/80 text-white"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            {t('nav.newPoll')}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">{t('poll.all')}</TabsTrigger>
            <TabsTrigger value="active">{t('poll.activePolls')}</TabsTrigger>
            <TabsTrigger value="completed">{t('poll.completed')}</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {renderPollGrid()}
          </TabsContent>
          <TabsContent value="active" className="mt-0">
            {renderPollGrid()}
          </TabsContent>
          <TabsContent value="completed" className="mt-0">
            {renderPollGrid()}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* Extend Poll Modal */}
      <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Extend Poll Duration")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("Current end date")}
              </label>
              <p className="text-muted-foreground">
                {extendPollId && myPolls
                  ? format(new Date(myPolls.find((p: PollWithOptions) => p.id === extendPollId)?.endDate || ""), "dd/MM/yyyy")
                  : ""}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("New end date")}
              </label>
              <Input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendModalOpen(false)}>
              {t('general.cancel')}
            </Button>
            <Button onClick={submitExtendPoll}>
              {t('general.next')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderPollGrid() {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!filteredPolls.length) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {activeTab === "active"
              ? "Δεν έχετε ενεργές ψηφοφορίες"
              : activeTab === "completed"
              ? "Δεν έχετε ολοκληρωμένες ψηφοφορίες"
              : "Δεν έχετε δημιουργήσει ψηφοφορίες ακόμα"}
          </p>
          <Button
            onClick={handleCreatePoll}
            variant="outline"
            className="mt-4"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            {t("Create your first poll")}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPolls.map((poll: PollWithOptions) => (
          <PollCard
            key={poll.id}
            poll={poll}
            onVote={refetch}
            onExtend={() => handleExtendPoll(poll.id)}
          />
        ))}
      </div>
    );
  }
}
