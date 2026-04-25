import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, BarChart3, TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { PollWithQuestions } from "@shared/schema";
import { HtmlContent } from "@/components/ui/html-content";
import { ErrorMessage } from "@/components/ui/error-message";

interface SurveyResultsModalProps {
  poll: PollWithQuestions;
  isOpen: boolean;
  onClose: () => void;
}

interface AnswerResult {
  answerId: number;
  answerText: string;
  count: number;
  percentage: number;
}

interface QuestionResult {
  questionId: number;
  answerResults: AnswerResult[];
}

export function SurveyResultsModal({ poll, isOpen, onClose }: SurveyResultsModalProps) {
  const { t, locale } = useTranslation();
  const { data: results, isLoading, error } = useQuery<QuestionResult[]>({
    queryKey: [`/api/surveys/${poll.id}/results`],
    enabled: isOpen,
  });

  const getQuestion = (questionId: number) => {
    return poll.questions.find(q => q.id === questionId);
  };

  const getTotalResponses = (questionResult: QuestionResult) => {
    const question = getQuestion(questionResult.questionId);
    
    if (question?.questionType === "multipleChoice") {
      // For multiple choice, find the unique user count (max count among answers represents unique users)
      // Since users can select multiple answers, we can't just sum them
      return questionResult.answerResults.length > 0 
        ? Math.max(...questionResult.answerResults.map(r => r.count))
        : 0;
    }
    
    // For single choice and ordering, sum up the counts
    return questionResult.answerResults.reduce((sum, result) => sum + result.count, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("Survey Poll")} - {t('general.results')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">{poll.title}</h3>
            <p className="text-sm text-muted-foreground">
              {t('notification.totalVotes')}: {poll.voteCount || 0}
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t('general.loading')}...</span>
            </div>
          )}

          {error && (
            <div className="py-4">
              <ErrorMessage error={error} />
            </div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-8">
              {results.map((questionResult, index) => {
                const question = getQuestion(questionResult.questionId);
                if (!question) return null;

                const totalResponses = getTotalResponses(questionResult);

                return (
                  <div 
                    key={questionResult.questionId} 
                    className="space-y-4 p-4 border rounded-lg bg-muted/30"
                    data-testid={`question-result-${questionResult.questionId}`}
                  >
                    <div className="space-y-2">
                      <h4 className="font-semibold text-base">
                        {t("Question")} {index + 1}: <HtmlContent html={question.text} />
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {question.questionType === "singleChoice" && t("Single Choice")}
                          {question.questionType === "multipleChoice" && t("Multiple Choice")}
                          {question.questionType === "ordering" && t("Ranking")}
                        </span>
                        <span>•</span>
                        <span>
                          {totalResponses} {t('analytics.votes')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(question.questionType === "singleChoice" || question.questionType === "multipleChoice") && (
                        questionResult.answerResults.map((result) => (
                          <div 
                            key={result.answerId} 
                            className="space-y-2"
                            data-testid={`answer-result-${result.answerId}`}
                          >
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium">{result.answerText}</span>
                              <span className="text-muted-foreground">
                                {result.count} ({result.percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress 
                              value={result.percentage} 
                              className="h-3"
                            />
                          </div>
                        ))
                      )}

                      {question.questionType === "ordering" && (
                        <div className="space-y-3">
                          {questionResult.answerResults
                            .sort((a, b) => b.percentage - a.percentage)
                            .map((result, rankIndex) => {
                              const avgRank = question.answers.length - 
                                ((result.percentage / 100) * (question.answers.length - 1));

                              return (
                                <div 
                                  key={result.answerId} 
                                  className="p-3 border rounded bg-background"
                                  data-testid={`ranking-result-${result.answerId}`}
                                >
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                        {rankIndex + 1}
                                      </div>
                                      <span className="font-medium">{result.answerText}</span>
                                    </div>
                                    <div className="text-right space-y-1">
                                      <div className="flex items-center gap-1 text-sm">
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-semibold">
                                          {avgRank.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {t("Average rank")}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{result.count} {t('analytics.votes')}</span>
                                    <span>•</span>
                                    <span>{result.percentage.toFixed(1)}% {t("points")}</span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {results && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("No results found")}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-results">
            {t('general.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
