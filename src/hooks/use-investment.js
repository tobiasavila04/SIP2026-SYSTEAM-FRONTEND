import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export function useTokenPrice(projectId) {
  return useQuery({
    queryKey: ['token-price', projectId],
    queryFn: () => apiRequest(API_ENDPOINTS.TOKEN_PRICE(projectId)),
    enabled: !!projectId,
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useTokenInfo(projectId) {
  return useQuery({
    queryKey: ['token', projectId],
    queryFn: () => apiRequest(API_ENDPOINTS.TOKEN_BY_PROJECT(projectId)),
    enabled: !!projectId,
    staleTime: 10_000,
  })
}

export function useValidateInvestment() {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.INVESTMENTS_VALIDATE, {
        method: 'POST',
        body: data,
      }),
  })
}

export function useCreateInvestment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.INVESTMENTS, {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-history'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['project'] })
      queryClient.invalidateQueries({ queryKey: ['token'] })
      queryClient.invalidateQueries({ queryKey: ['token-price'] })
    },
  })
}
