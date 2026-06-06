import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export function useRepartosProyecto(projectId) {
  return useQuery({
    queryKey: ['dividendos-proyecto', projectId],
    queryFn: () => apiRequest(API_ENDPOINTS.DIVIDENDOS_PROYECTO(projectId)),
    enabled: !!projectId,
    staleTime: 60_000,
  })
}

export function useMisReclamos() {
  return useQuery({
    queryKey: ['dividendos-mis-reclamos'],
    queryFn: () => apiRequest(API_ENDPOINTS.DIVIDENDOS_MIS_RECLAMOS),
    staleTime: 30_000,
  })
}

export function useReclamarDividendos(projectId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ wallet }) =>
      apiRequest(`${API_ENDPOINTS.DIVIDENDOS_RECLAMAR(projectId)}?wallet=${encodeURIComponent(wallet)}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dividendos-mis-reclamos'] })
    },
  })
}
