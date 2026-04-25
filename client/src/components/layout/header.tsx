import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, UserCircle, ChevronDown, LogOut, User, BarChart3, Users, Bell, Shield, FileText, MessageSquare, Menu } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { el as dateFnsEl, enUS as dateFnsEn } from "date-fns/locale";
import { useTranslation } from "@/hooks/use-translation";
import logoImage from "../../assets/logo.png";
import { VerifyGovgrModal } from "../user/verify-govgr-modal";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

interface NotificationWithPoll {
  id: number;
  userId: number;
  pollId: number;
  read: boolean;
  createdAt: string;
  poll: {
    id: number;
    title: string;
    groupId: number | null;
    group?: {
      id: number;
      name: string;
    } | null;
  };
}

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const { t, locale } = useTranslation();
  const [, navigate] = useLocation();
  const dateFnsLocale = locale === 'el' ? dateFnsEl : dateFnsEn;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleLogout = () => {
    navigate("/");
    logoutMutation.mutate();
  };

  // Fetch unread notification count
  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread/count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch all notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery<NotificationWithPoll[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user && isNotificationsOpen,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest("POST", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread/count"] });
    },
  });

  const handleNotificationClick = (notification: NotificationWithPoll) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    setIsNotificationsOpen(false);
    navigate(`/polls/${notification.pollId}`);
  };

  const unreadCount = unreadCountData?.count || 0;

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border shadow-md sticky top-0 z-50 transition-smooth">
      <div className="container mx-auto px-4 py-2 sm:py-3 flex justify-between items-center gap-3 sm:gap-4">
        <div className="flex items-center min-w-0">
          <Link
            href={user ? "/home" : "/"}
            className="flex items-center gap-2 sm:gap-3 transition-smooth hover:opacity-80"
            data-testid="logo-link"
          >
            <img
              src={logoImage}
              alt="AgoraX Logo"
              className="h-8 sm:h-10 w-auto flex-shrink-0"
            />
            <div className="min-w-0">
              <span className="text-primary text-xl sm:text-2xl font-bold font-sans block leading-tight">
                AgoraX
              </span>
              <span className="text-muted-foreground text-xs sm:text-sm hidden sm:block leading-tight mt-0.5">
                {t('general.digitalDemocracy')}
              </span>
            </div>
          </Link>
        </div>

        {!user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {/* Desktop buttons */}
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="hidden sm:inline-flex min-h-[44px] min-w-[44px] transition-smooth hover:bg-muted hover:border-primary"
              data-testid="button-login"
            >
              {t('auth.login')}
            </Button>
            <Button
              onClick={() => navigate("/auth?tab=register")}
              className="hidden sm:inline-flex min-h-[44px] min-w-[44px] bg-primary hover:bg-primary/90 text-white transition-smooth shadow-sm hover:shadow-md"
              data-testid="button-register"
            >
              {t('auth.register')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/walkthrough")}
              className="hidden sm:flex items-center gap-2 min-h-[44px] transition-smooth hover:bg-muted"
              data-testid="button-walkthrough"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{t('nav.process')}</span>
            </Button>
            {/* Mobile hamburger */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="sm:hidden min-h-[44px] min-w-[44px] p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuItem onClick={() => navigate("/auth")} className="cursor-pointer">
                  {t('auth.login')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/auth?tab=register")} className="cursor-pointer">
                  {t('auth.register')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/walkthrough")} className="cursor-pointer">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('nav.process')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              className="hidden sm:flex items-center gap-2 min-h-[44px] bg-primary hover:bg-primary/90 text-white transition-smooth shadow-sm hover:shadow-md"
              onClick={() => navigate("/proposals/new")}
              data-testid="button-new-proposal"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{t('nav.newProposal')}</span>
            </Button>
            <Button
              variant="outline"
              className="hidden sm:flex items-center gap-2 min-h-[44px] transition-smooth hover:bg-muted hover:border-primary"
              onClick={() => navigate("/communities")}
              data-testid="button-communities"
            >
              <Users className="h-4 w-4" />
              <span>{t('nav.communities')}</span>
            </Button>

            {/* Notification Bell */}
            <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="relative min-h-[44px] min-w-[44px] transition-smooth hover:bg-muted hover:border-primary"
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                      data-testid="badge-notification-count"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 mt-2" data-testid="popover-notifications">
                <div className="border-b p-4">
                  <h3 className="font-semibold text-sm">{t('notification.title')}</h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground" data-testid="text-loading-notifications">
                      {t('notification.loading')}
                    </div>
                  ) : notifications && notifications.length > 0 ? (
                    <div className="divide-y" data-testid="list-notifications">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 cursor-pointer transition-smooth hover:bg-muted ${!notification.read ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                          data-testid={`notification-item-${notification.id}`}
                        >
                          <div className="flex items-start gap-2">
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" data-testid="indicator-unread" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notification.read ? "font-semibold" : ""}`}>
                                {notification.poll.group
                                  ? `${t('notification.newPollIn')} ${notification.poll.group.name}`
                                  : `${t('notification.newPollIn')} ${t('notification.community')}`
                                }
                              </p>
                              <p className="text-sm text-primary font-medium truncate mt-1" data-testid={`text-poll-title-${notification.id}`}>
                                {notification.poll.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1" data-testid={`text-time-ago-${notification.id}`}>
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                  locale: dateFnsLocale
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground" data-testid="text-no-notifications">
                      {t('notification.empty')}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <LanguageSwitcher />

            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`flex items-center gap-1 sm:gap-2 transition-smooth hover:bg-muted hover:border-primary min-h-[44px] min-w-[44px] ${user.govgrVerified ? "border-green-500 bg-green-50/50" : ""}`}
                  data-testid="button-user-menu"
                >
                  {user.govgrVerified ? (
                    <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <UserCircle className="h-5 w-5 flex-shrink-0" />
                  )}
                  <span className="hidden sm:inline truncate max-w-[120px] md:max-w-[150px]">{user.name}</span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {user.govgrVerified ? (
                    <div className="flex items-center text-green-600 font-medium">
                      <Shield className="mr-1 h-3 w-3" />
                      {t('ballot.verified')}
                    </div>
                  ) : (
                    <span className="text-amber-600">{t('ballot.unverified')}</span>
                  )}
                </div>
                <DropdownMenuSeparator />

                {!user.govgrVerified && (
                  <DropdownMenuItem
                    onClick={() => {
                      setIsVerifyModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer transition-smooth bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800"
                    data-testid="menu-verify"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {t('ballot.verify')}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer transition-smooth"
                  data-testid="menu-profile"
                >
                  <User className="mr-2 h-4 w-4" />
                  {t('nav.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/communities")}
                  className="cursor-pointer transition-smooth"
                  data-testid="menu-communities"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {t('nav.communities')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/proposals/new")}
                  className="cursor-pointer transition-smooth"
                  data-testid="menu-new-proposal"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {t('nav.newProposal')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/walkthrough")}
                  className="cursor-pointer transition-smooth"
                  data-testid="menu-walkthrough"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('nav.walkthrough')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/analytics")}
                  className="cursor-pointer transition-smooth"
                  data-testid="menu-analytics"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {t('nav.analytics')}
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem
                    onClick={() => navigate("/admin/accounts")}
                    className="cursor-pointer transition-smooth"
                    data-testid="menu-admin-accounts"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {t('nav.adminAccounts')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer transition-smooth text-red-600 focus:text-red-600"
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <VerifyGovgrModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </header>
  );
}
