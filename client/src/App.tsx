import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import PollDetailsPage from "@/pages/poll-details";
import MyPollsPage from "@/pages/my-polls";
import PollCreatePage from "@/pages/poll-create";
import PollExtendPage from "@/pages/poll-extend";
import SurveyCreatePage from "@/pages/survey-create";
import ProfilePage from "@/pages/profile-page";
import GroupsPage from "@/pages/groups-page";
import HowItWorksPage from "@/pages/how-it-works";
import FAQPage from "@/pages/faq";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import AdminAccountsPage from "@/pages/admin-accounts";
import CommunityDashboardPage from "@/pages/community-dashboard";
import ProposalDetailPage from "@/pages/proposal-detail";
import SortitionScoringPage from "@/pages/sortition-scoring";
import DeliberationWalkthrough from "@/pages/deliberation-walkthrough";
import { CommunityList } from "@/components/community/community-list";
import { ProposalForm } from "@/components/proposal/proposal-form";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import BottomNav from "@/components/layout/bottom-nav";

function CommunitiesPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <CommunityList />
    </div>
  );
}

function ProposalFormPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <ProposalForm />
    </div>
  );
}

function Router() {
  const { user } = useAuth();

  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/home" component={HomePage} />
        <ProtectedRoute path="/my-polls" component={MyPollsPage} />
        <ProtectedRoute path="/polls/create" component={PollCreatePage} />
        <ProtectedRoute path="/polls/:id/edit" component={PollCreatePage} />
        <ProtectedRoute path="/polls/:id/extend" component={PollExtendPage} />
        <ProtectedRoute path="/surveys/create" component={SurveyCreatePage} />
        <ProtectedRoute path="/surveys/:id/edit" component={SurveyCreatePage} />
        <ProtectedRoute path="/analytics" component={AnalyticsDashboard} />
        <ProtectedRoute path="/admin/accounts" component={AdminAccountsPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/groups" component={GroupsPage} />
        <ProtectedRoute path="/communities" component={CommunitiesPage} />
        <ProtectedRoute path="/communities/:id" component={CommunityDashboardPage} />
        <ProtectedRoute path="/proposals/new" component={ProposalFormPage} />
        <ProtectedRoute path="/proposals/:id" component={ProposalDetailPage} />
        <ProtectedRoute path="/sortition/:id" component={SortitionScoringPage} />
        <Route path="/walkthrough" component={DeliberationWalkthrough} />
        <Route path="/polls/:id" component={PollDetailsPage} />
        <Route path="/how-it-works" component={HowItWorksPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route component={NotFound} />
      </Switch>
      {user && <BottomNav user={user} />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
