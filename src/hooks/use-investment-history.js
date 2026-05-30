import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export function useInvestmentHistory(page = 0, size = 10) {
  return useQuery({
    queryKey: ['investment-history', page, size],
    queryFn: () =>
      apiRequest(
        `${API_ENDPOINTS.INVESTMENTS_HISTORY}?page=${page}&size=${size}`
      ),
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useProjectInvestments(projectId) {
  return useQuery({
    queryKey: ['project-investments', projectId],
    queryFn: () =>
      apiRequest(API_ENDPOINTS.INVESTMENTS_PROJECT(projectId)),
    enabled: !!projectId,
  })
}
