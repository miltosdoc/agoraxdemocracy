import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SortitionNotification, NotificationsResponse } from "@/types/notifications";

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: ["/api/sortition-notifications/unread-count"],
    refetchInterval: 30000,
  });
}

export function useNotifications(options?: { unreadOnly?: boolean; limit?: number }) {
  const { unreadOnly = false, limit = 50 } = options || {};
  return useQuery<NotificationsResponse>({
    queryKey: ["/api/sortition-notifications", { unreadOnly, limit }],
  });
}

export function useMarkAsRead() {
  return useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest("POST", `/api/sortition-notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sortition-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sortition-notifications/unread-count"] });
    },
  });
}

export function useMarkAllAsRead() {
  return useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/sortition-notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sortition-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sortition-notifications/unread-count"] });
    },
  });
}
