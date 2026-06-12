import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { toast } from 'sonner'

export const marketplaceKeys = {
  all: ['marketplace'],
  listings: () => [...marketplaceKeys.all, 'listings'],
}

/**
 * Hook to retrieve all active selling listings from the marketplace.
 */
export function useMarketplaceListings() {
  return useQuery({
    queryKey: marketplaceKeys.listings(),
    queryFn: async () => {
      try {
        const res = await apiRequest(API_ENDPOINTS.MARKETPLACE_LISTINGS)
        // Normalización: Si el backend devuelve un objeto Page de Spring (con .content),
        // extraemos el array del content. De lo contrario, devolvemos el array directamente.
        if (res && typeof res === 'object' && Array.isArray(res.content)) {
          return res.content
        }
        return Array.isArray(res) ? res : []
      } catch (error) {
        // Si el endpoint devuelve 400/404 (ej. servicio no disponible), devolver vacío sin reintentar
        if (error?.status === 400 || error?.status === 404) {
          console.warn('[Marketplace] Endpoint no disponible:', error?.status)
          return []
        }
        // Si el Gateway devuelve 401 transitorio, propagamos para que retry lo maneje
        if (error?.status === 401) {
          throw error
        }
        // Cualquier otro error (network, parsing) → array vacío como fallback
        console.warn('[Marketplace] Error al cargar listings:', error?.message || error)
        return []
      }
    },
    staleTime: 15_000,
    retry: false,
    placeholderData: [],
  })
}

/**
 * Mutation to publish a new sell order to the marketplace.
 */
export function useCreateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.MARKETPLACE_LISTINGS, {
        method: 'POST',
        body: data,
      }),
    meta: { suppressErrorToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.listings() })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'summary'] })
      toast.success('Orden de venta publicada exitosamente')
    },
  })
}

/**
 * Mutation to purchase an active marketplace listing.
 */
export function useBuyListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, cantidad, txHash }) =>
      apiRequest(`${API_ENDPOINTS.MARKETPLACE_LISTINGS}/${id}/buy`, {
        method: 'POST',
        params: { cantidad, txHash },
      }),
    onSuccess: () => {
      // Invalidate both listings and wallet queries to update quantities and balances
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.listings() })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'summary'] })
      toast.success('Compra de sub-tokens procesada con éxito')
    },
  })
}
