import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, getStoredToken } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export const notificationKeys = {
  all: ['notifications'],
  lists: () => [...notificationKeys.all, 'list'],
  list: (page) => [...notificationKeys.lists(), page],
  unreadCount: () => [...notificationKeys.all, 'unread-count'],
}

export function useNotifications(page = 0, size = 20) {
  return useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: () =>
      apiRequest(API_ENDPOINTS.NOTIFICATIONS, {
        params: { page, size },
      }),
    enabled: !!getStoredToken(),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => apiRequest(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT),
    refetchInterval: !!getStoredToken() ? 30_000 : false,
    staleTime: 10_000,
    enabled: !!getStoredToken(),
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) =>
      apiRequest(API_ENDPOINTS.NOTIFICATION_READ(id), { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
