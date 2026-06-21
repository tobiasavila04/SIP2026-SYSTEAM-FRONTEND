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

export function useDividendosPendientes(projectId, wallet) {
  return useQuery({
    queryKey: ['dividendos-pendientes', projectId, wallet],
    queryFn: () => apiRequest(`${API_ENDPOINTS.DIVIDENDOS_PENDIENTES(projectId)}?wallet=${encodeURIComponent(wallet)}`),
    enabled: !!projectId && !!wallet,
    staleTime: 60_000,
  })
}

export function useReclamarDividendos(projectId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ wallet, txHash, amount }) =>
      apiRequest(`${API_ENDPOINTS.DIVIDENDOS_RECLAMAR(projectId)}?wallet=${encodeURIComponent(wallet)}&txHash=${encodeURIComponent(txHash)}${amount != null ? `&amount=${encodeURIComponent(amount)}` : ''}`, {
        method: 'POST',
      }),
    onSuccess: (_, { wallet }) => {
      // Actualizar historial de reclamos
      queryClient.invalidateQueries({ queryKey: ['dividendos-mis-reclamos'] })
      // MUY IMPORTANTE: Setear pendientes a 0 manualmente para evitar el lag del RPC
      queryClient.setQueryData(['dividendos-pendientes', projectId, wallet], { pendientes: 0 })
      // También invalidamos por las dudas para refresco posterior
      queryClient.invalidateQueries({ queryKey: ['dividendos-pendientes', projectId, wallet] })
    },
  })
}
