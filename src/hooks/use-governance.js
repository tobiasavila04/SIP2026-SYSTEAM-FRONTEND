import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { toast } from 'sonner'

// ── Query Keys ──────────────────────────────────────────────

export const eventoKeys = {
  all: ['eventos'],
  list: (filters) => [...eventoKeys.all, 'list', filters],
  detail: (id) => [...eventoKeys.all, 'detail', id],
  asistencias: (eventoId) => [...eventoKeys.all, 'asistencias', eventoId],
}

// ── Eventos Hooks ───────────────────────────────────────────

export function useEventos(page = 0, size = 10) {
  return useQuery({
    queryKey: eventoKeys.list({ page, size }),
    queryFn: () =>
      apiRequest(API_ENDPOINTS.EVENTOS, {
        params: { page, size },
      }),
  })
}

export function useEvento(id) {
  return useQuery({
    queryKey: eventoKeys.detail(id),
    queryFn: () => apiRequest(API_ENDPOINTS.EVENTO_BY_ID(id)),
    enabled: !!id,
  })
}

export function useCreateEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.EVENTOS, {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventoKeys.all })
      toast.success('Evento creado exitosamente')
    },
  })
}

export function useUpdateEvento(id) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.EVENTO_BY_ID(id), {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventoKeys.all })
      toast.success('Evento actualizado exitosamente')
    },
  })
}

export function useDeleteEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) =>
      apiRequest(API_ENDPOINTS.EVENTO_BY_ID(id), {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventoKeys.all })
      toast.success('Evento eliminado exitosamente')
    },
  })
}

export function useConfirmAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventoId, userId }) =>
      apiRequest(API_ENDPOINTS.EVENTO_ASISTENCIA(eventoId), {
        method: 'POST',
        body: { userId },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: eventoKeys.asistencias(variables.eventoId),
      })
      toast.success('Asistencia confirmada exitosamente')
    },
  })
}

export function useAsistencias(eventoId) {
  return useQuery({
    queryKey: eventoKeys.asistencias(eventoId),
    queryFn: () => apiRequest(API_ENDPOINTS.EVENTO_ASISTENCIAS(eventoId)),
    enabled: !!eventoId,
  })
}
