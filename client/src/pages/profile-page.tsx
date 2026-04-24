import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationDetector } from "@/components/user/location-detector";
import { DeleteAccount } from "@/components/user/delete-account";
import { t } from "@/i18n";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, MapPin, Shield } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth?returnTo=/profile");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto py-8 px-4 pb-16 sm:pb-6 flex-grow">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-8 px-4 pb-16 sm:pb-6 flex-grow">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => setLocation("/home")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("Back")}
        </Button>
        <h1 className="text-2xl font-bold">{t("My Profile")}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t("User Information")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Username")}</p>
                  <p>{user.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Name")}</p>
                  <p>{user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("Email")}</p>
                  <p>{user.email}</p>
                </div>
                {user.locationConfirmed && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-muted-foreground flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 inline" />
                      {t("Location")}
                    </p>
                    <p className="text-sm mt-1">
                      {[(user as any).city, (user as any).region, (user as any).country].filter(Boolean).join(", ")}
                    </p>
                    
                    {user.latitude && user.longitude && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-muted-foreground">{t("Coordinates")}</p>
                        <p className="text-sm font-mono">
                          {user.latitude}, {user.longitude}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("Location Settings")}</CardTitle>
                <CardDescription>
                  {t("Update your location to participate in location-restricted polls")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LocationDetector />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  {t("Account Management")}
                </CardTitle>
                <CardDescription>
                  {t("Manage your account settings and preferences")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <DeleteAccount />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
    </div>
  );
}