import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export function useModulesStatus() {
  return useQuery({
    queryKey: ['modules-status'],
    queryFn: () => apiRequest(API_ENDPOINTS.MODULES_STATUS),
    refetchInterval: 60_000,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiRequest(API_ENDPOINTS.DASHBOARD_STATS),
    refetchInterval: 60_000,
  })
}
