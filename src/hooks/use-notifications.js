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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })

      queryClient.setQueriesData({ queryKey: notificationKeys.lists() }, (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          content: oldData.content?.map((n) =>
            n.id === id ? { ...n, readAt: new Date().toISOString() } : n
          ),
        }
      })

      queryClient.setQueryData(notificationKeys.unreadCount(), (old) => {
        return typeof old === 'number' ? Math.max(0, old - 1) : old
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
