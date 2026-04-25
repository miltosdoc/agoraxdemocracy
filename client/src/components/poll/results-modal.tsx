import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistance } from "date-fns";
import { el } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Download, User, Calendar } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { HtmlContent } from "@/components/ui/html-content";

interface ResultsModalProps {
  pollId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface PollComment {
  id: number;
  text: string;
  createdAt: string;
  user: {
    name: string;
    username: string;
  };
}

export function ResultsModal({ pollId, isOpen, onClose }: ResultsModalProps) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();

  const { data: poll, isLoading: pollLoading } = useQuery({
    queryKey: [`/api/polls/${pollId}`],
    enabled: isOpen,
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: [`/api/polls/${pollId}/results`],
    enabled: isOpen,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: [`/api/polls/${pollId}/comments`],
    enabled: isOpen && poll?.allowComments,
  });

  const isLoading = pollLoading || resultsLoading || (poll?.allowComments && commentsLoading);

  const handleExportResults = () => {
    if (!results || !poll) return;

    let csvContent = "";
    
    // Check if it's a ranking poll
    if (results.length > 0 && results[0].isRanking) {
      // For ranking polls, include detailed stats
      csvContent = "Option,Points,Percentage,FirstPlaceVotes,AverageRank\n";
      results.forEach((result: any) => {
        csvContent += `"${result.optionText}",${result.rankingStats.totalPoints},${result.percentage.toFixed(2)}%,${result.rankingStats.firstPlaceVotes},${result.rankingStats.averageRank}\n`;
      });
    } else {
      // For regular polls
      csvContent = "Option,Votes,Percentage\n";
      results.forEach((result: any) => {
        csvContent += `"${result.optionText}",${result.voteCount},${result.percentage.toFixed(2)}%\n`;
      });
    }

    // Add UTF-8 BOM to ensure proper encoding in Excel and other spreadsheet apps
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${poll.title.replace(/\s+/g, "_")}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t('general.success'),
      description: "Τα αποτελέσματα εξήχθησαν επιτυχώς",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Poll Results")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{poll?.title}</h3>
              <HtmlContent html={poll?.description || ""} className="text-sm text-muted-foreground mb-4" />

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center">
                  <BarChart className="h-4 w-4 mr-1" />
                  {poll?.voteCount} {t("total votes")}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {poll?.isActive 
                    ? `${t("Expires in")} ${formatDistance(new Date(poll.endDate), new Date(), { locale: el })}`
                    : `${t("Completed on")} ${format(new Date(poll.endDate), "d MMM", { locale: el })}`
                  }
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium mb-3">{t('general.results')}:</h4>

              <div className="space-y-4">
                {results?.map((result: any) => (
                  <div key={result.optionId} className="border border-border rounded-md p-3">
                    {result.isRanking ? (
                      <>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{result.optionText}</span>
                          <span className="text-sm font-medium">
                            {result.percentage.toFixed(1)}% ({result.rankingStats.totalPoints} {t("points")})
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 mb-3">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${result.percentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-2 mt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium">{t("First place votes")}: </span>
                              {result.rankingStats.firstPlaceVotes}
                            </div>
                            <div>
                              <span className="font-medium">{t("Average rank")}: </span>
                              {result.rankingStats.averageRank}
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <span className="font-medium block mb-1">{t("Rank distribution")}:</span>
                            <div className="flex gap-1 flex-wrap">
                              {Object.entries(result.rankingStats.rankDistribution).map(([rank, count]) => (
                                <div 
                                  key={rank} 
                                  className="px-2 py-1 bg-muted rounded text-xs flex flex-col items-center"
                                  title={`${count} ${t("voters ranked this option as their")} #${rank} ${t("choice")}`}
                                >
                                  <span className="font-medium">#{rank}</span>
                                  <span>{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{result.optionText}</span>
                          <span className="text-sm font-medium">
                            {result.percentage.toFixed(1)}% ({result.voteCount} {t('analytics.votes')})
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${result.percentage}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {poll?.allowComments && comments?.length > 0 && (
              <div className="mb-6 border-t border-border pt-4">
                <h4 className="font-medium mb-3">{t("Top Comments")}:</h4>

                <div className="space-y-4 max-h-40 overflow-y-auto">
                  {comments.slice(0, 3).map((comment: PollComment) => (
                    <div key={comment.id} className="p-3 bg-muted rounded-md">
                      <div className="flex items-start">
                        <User className="h-5 w-5 text-muted-foreground mr-2" />
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-sm">{comment.user.name}</span>
                            <span className="mx-1 text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), "d MMM yyyy", { locale: el })}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleExportResults}
                className="flex items-center"
              >
                <Download className="mr-1 h-4 w-4" />
                {t("Export Results")}
              </Button>
              <Button onClick={onClose}>{t('general.close')}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
