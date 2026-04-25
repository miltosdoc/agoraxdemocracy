import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, PlusCircle, FileText, Users, User } from "lucide-react";
import { User as SelectUser } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface BottomNavProps {
  user: SelectUser | null;
}

export default function BottomNav({ user }: BottomNavProps) {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  if (!user) {
    return null;
  }

  const navItems = [
    {
      label: t('nav.home'),
      icon: Home,
      path: "/home",
      testId: "nav-home",
    },
    {
      label: t('nav.create'),
      icon: PlusCircle,
      path: "/polls/create",
      testId: "nav-create",
      hasDropdown: true,
    },
    {
      label: t('nav.myPolls'),
      icon: FileText,
      path: "/my-polls",
      testId: "nav-my-polls",
    },
    {
      label: t('nav.communities'),
      icon: Users,
      path: "/communities",
      testId: "nav-communities",
    },
    {
      label: t('nav.profile'),
      icon: User,
      path: "/profile",
      testId: "nav-profile",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/polls/create") {
      return location === "/polls/create" || location === "/surveys/create";
    }
    return location === path;
  };

  const handleCreatePoll = () => {
    navigate("/polls/create");
    setIsCreateMenuOpen(false);
  };

  const handleCreateSurvey = () => {
    navigate("/surveys/create");
    setIsCreateMenuOpen(false);
  };

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50 safe-area-inset-bottom"
      data-testid="bottom-navigation"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          if (item.hasDropdown) {
            return (
              <DropdownMenu
                key={item.path}
                open={isCreateMenuOpen}
                onOpenChange={setIsCreateMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] flex-1 relative tap-highlight-none transition-smooth",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                    data-testid={item.testId}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 mb-1 transition-smooth",
                        active && "text-primary"
                      )}
                    />
                    <span className="text-xs font-medium">{item.label}</span>
                    {active && (
                      <span className="absolute top-0 w-12 h-1 bg-primary rounded-b-full transition-smooth" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 mb-2">
                  <DropdownMenuItem onClick={handleCreatePoll}>
                    {t('ballot.standardPoll')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCreateSurvey}>
                    {t('ballot.surveyPoll')}{" "}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({t('ballot.beta')})
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] flex-1 relative tap-highlight-none transition-smooth",
                active ? "text-primary" : "text-muted-foreground"
              )}
              data-testid={item.testId}
            >
              <Icon
                className={cn(
                  "h-6 w-6 mb-1 transition-smooth",
                  active && "text-primary"
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
              {active && (
                <span className="absolute top-0 w-12 h-1 bg-primary rounded-b-full transition-smooth" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
