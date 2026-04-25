import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LocationDetector } from "@/components/user/location-detector";
import { DeleteAccount } from "@/components/user/delete-account";
import { VerifyGovgrModal } from "@/components/user/verify-govgr-modal";
import { useTranslation } from "@/hooks/use-translation";
import { useLocation } from "wouter";
import { ArrowLeft, BadgeCheck, Fingerprint, MapPin, Shield, User, Vote } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [verifyOpen, setVerifyOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto flex flex-grow items-center justify-center px-4 py-8 pb-20 sm:pb-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col" data-testid="page-profile-settings">
      <Header />
      <main className="container mx-auto flex-grow px-4 py-6 pb-20 sm:py-8 sm:pb-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-3 -ml-2"
              onClick={() => setLocation("/home")}
              data-testid="button-profile-back"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('general.back')}
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{t('profile.accountSettings')}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t('profile.accountSettingsDescription')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={user.govgrVerified ? "default" : "secondary"} className="min-h-8 px-3">
              <BadgeCheck className="mr-1.5 h-4 w-4" />
              {user.govgrVerified ? t('ballot.verified') : t('ballot.unverified')}
            </Badge>
            {user.isAdmin && (
              <Badge variant="outline" className="min-h-8 px-3">
                <Shield className="mr-1.5 h-4 w-4" />
                {t('profile.adminRole')}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t('profile.userInformation')}
              </CardTitle>
              <CardDescription>{t('profile.securityAndAccess')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('profile.memberId')}</p>
                <p className="font-mono text-sm">#{user.id}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('auth.username')}</p>
                <p className="break-words font-medium">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('profile.name')}</p>
                <p className="break-words">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('auth.email')}</p>
                <p className="break-words">{user.email}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('profile.accountStatus')}</p>
                <p>{user.accountStatus || 'active'}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  {t('profile.identityVerification')}
                </CardTitle>
                <CardDescription>{t('profile.identityVerificationDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium text-muted-foreground">{t('profile.govgrStatus')}</p>
                    <p className="mt-1 font-semibold">
                      {user.govgrVerified ? t('profile.verified') : t('profile.notVerified')}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium text-muted-foreground">{t('profile.locationStatus')}</p>
                    <p className="mt-1 font-semibold">
                      {user.locationConfirmed ? t('profile.confirmed') : t('profile.notConfirmed')}
                    </p>
                  </div>
                </div>
                {!user.govgrVerified && (
                  <Button onClick={() => setVerifyOpen(true)} data-testid="button-profile-verify">
                    <Shield className="mr-2 h-4 w-4" />
                    {t('ballot.verify')}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t('profile.participationSettings')}
                </CardTitle>
                <CardDescription>{t('profile.participationSettingsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <LocationDetector />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5 text-primary" />
                  {t('profile.accountDangerZone')}
                </CardTitle>
                <CardDescription>{t('profile.accountDangerZoneDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <DeleteAccount />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <VerifyGovgrModal isOpen={verifyOpen} onClose={() => setVerifyOpen(false)} />
    </div>
  );
}
