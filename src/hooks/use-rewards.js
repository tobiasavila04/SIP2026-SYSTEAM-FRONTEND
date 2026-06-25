import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

// -- Query Keys ----------------------------------------------------------

export const rewardKeys = {
  all: ['rewards'],
  history: (filters) => [...rewardKeys.all, 'history', filters],
  summary: () => [...rewardKeys.all, 'summary'],
}

// -- Hooks ---------------------------------------------------------------

export function useRewardsHistory(page = 0, size = 20) {
  return useQuery({
    queryKey: rewardKeys.history({ page, size }),
    queryFn: () =>
      apiRequest(API_ENDPOINTS.REWARDS_HISTORY, {
        params: { page, size },
      }),
  })
}

export function useRewardsSummary() {
  return useQuery({
    queryKey: rewardKeys.summary(),
    queryFn: () => apiRequest(API_ENDPOINTS.REWARDS_SUMMARY),
    staleTime: 30_000,
  })
}
