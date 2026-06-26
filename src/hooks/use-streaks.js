import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export const streakKeys = {
  me: () => ['streak', 'me'],
}

export function useStreakStatus() {
  return useQuery({
    queryKey: streakKeys.me(),
    queryFn: () => apiRequest(API_ENDPOINTS.STREAK_ME),
    staleTime: 60_000,
  })
}

export function useStreakCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiRequest(API_ENDPOINTS.STREAK_CHECK_IN, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: streakKeys.me() })
    },
  })
}
