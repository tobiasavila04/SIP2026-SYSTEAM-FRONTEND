import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

/**
 * Hook to retrieve general dashboard metrics and distributions.
 * Configured with a 1-minute staleTime as per requirements.
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiRequest(API_ENDPOINTS.DASHBOARD_STATS),
    staleTime: 60_000,
    retry: 1,
  })
}

/**
 * Hook to check the health/status of active microservices.
 * Executed conditionally if enabled (normally for admins).
 */
export function useModulesStatus(enabled = false) {
  return useQuery({
    queryKey: ['modules', 'status'],
    queryFn: async () => {
      try {
        return await apiRequest(API_ENDPOINTS.MODULES_STATUS)
      } catch (error) {
        // Silently handle 404 — the route may not exist in the gateway
        if (error?.status === 404) return []
        throw error
      }
    },
    enabled: !!enabled,
    staleTime: 30_000,
    retry: false,
    placeholderData: [],
  })
}
