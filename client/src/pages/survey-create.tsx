import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { SurveyPollForm } from "@/components/poll/survey-poll-form";
import { useParams } from "wouter";
import { useTranslation } from "@/hooks/use-translation";

export default function SurveyCreatePage() {
  const { t } = useTranslation();
  // Extract pollId from URL params for editing
  const params = useParams();
  const pollId = params.id ? parseInt(params.id) : undefined;
  const isEditing = !!pollId;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 pb-16 sm:pb-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditing ? t('poll.edit_survey') : t('poll.create_survey')}
        </h1>
        <div className="max-w-4xl mx-auto">
          <SurveyPollForm pollId={pollId} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
