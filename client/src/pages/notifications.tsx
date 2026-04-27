import { useState } from "react";
import { useNotifications, useMarkAllAsRead } from "@/hooks/use-notifications";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCheck } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import AppShell from "@/components/layout/AppShell";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const markAllAsRead = useMarkAllAsRead();
  
  const { data, isLoading } = useNotifications({ 
    unreadOnly: filter === "unread",
    limit: 100 
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <AppShell
      title={t('notification.title')}
      actions={
        unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            {t('notification.markAllRead')}
          </Button>
        )
      }
    >
      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            {t('notification.all')}
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            {t('notification.unread')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Bell className="mr-2 h-5 w-5 animate-pulse" />
              {t('notification.loading')}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="text-lg font-medium">{t('notification.empty')}</p>
              <p className="text-sm mt-1">{t('notification.noNew')}</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden bg-background">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onClick={() => {
                    if (notif.actionUrl) {
                      window.location.href = notif.actionUrl;
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
