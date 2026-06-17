import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { toast } from 'sonner'

function mapProjectFormToApi(formData) {
  const apiData = { titulo: formData.titulo, descripcion: formData.descripcion, montoRequerido: formData.montoRequerido }
  if (formData.rubro != null) apiData.rubro = formData.rubro
  if (formData.plazo != null) apiData.plazo = formData.plazo
  if (formData.gobernanzaComunidad != null) apiData.gobernanzaComunidad = formData.gobernanzaComunidad
  if (formData.cupoMaximoTokens != null) apiData.cupoMaximoTokens = formData.cupoMaximoTokens
  if (formData.valorNominalToken != null) apiData.valorNominalToken = formData.valorNominalToken
  if (formData.simbolo) apiData.simbolo = formData.simbolo
  return apiData
}

export const projectKeys = {
  all: ['projects'],
  lists: () => [...projectKeys.all, 'list'],
  list: (filters) => [...projectKeys.lists(), filters],
  details: () => [...projectKeys.all, 'detail'],
  detail: (id) => [...projectKeys.details(), id],
  my: () => [...projectKeys.all, 'my'],
}

export function useProjects(filters = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: async () => {
      const params = {
        page: filters.page ?? 0,
        size: filters.size ?? 10,
      }
      if (filters.estado) params.estado = filters.estado
      if (filters.search) params.search = filters.search

      const data = await apiRequest(API_ENDPOINTS.PROJECTS_CATALOG, { params })
      return data
    },
  })
}

export function useProject(id) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const data = await apiRequest(API_ENDPOINTS.PROJECT_BY_ID(id))
      return data
    },
    enabled: !!id,
  })
}

export function useMyProjects() {
  return useQuery({
    queryKey: projectKeys.my(),
    queryFn: async () => {
      const data = await apiRequest(API_ENDPOINTS.PROJECTS_MY)
      return data
    },
  })
}

export function useAllProjects() {
  return useQuery({
    queryKey: ['projects', 'all'],
    queryFn: async () => {
      const data = await apiRequest(API_ENDPOINTS.PROJECTS_ALL, { params: { page: 0, size: 500 } })
      return data
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.PROJECTS, {
        method: 'POST',
        body: mapProjectFormToApi(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.my() })
      toast.success('Proyecto creado exitosamente')
    },
  })
}

export function useUpdateProject(id) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.PROJECT_BY_ID(id), {
        method: 'PUT',
        body: mapProjectFormToApi(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      toast.success('Proyecto actualizado exitosamente')
    },
  })
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) =>
      apiRequest(API_ENDPOINTS.PROJECT_STATUS(id), {
        method: 'PATCH',
        params: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      toast.success('Estado del proyecto actualizado')
    },
  })
}

export function useCloseProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) =>
      apiRequest(API_ENDPOINTS.PROJECT_CLOSE(id), { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      toast.success('Proyecto cerrado exitosamente')
    },
  })
}

export function useBoostProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, txHash }) =>
      apiRequest(API_ENDPOINTS.PROJECT_BOOST(id), { 
        method: 'POST',
        body: { txHash } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      toast.success('¡Boost aplicado exitosamente!')
    },
  })
}


export function useEvaluateStates() {
  return useMutation({
    mutationFn: () =>
      apiRequest(API_ENDPOINTS.PROJECT_EVALUATE_STATES, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Vencimientos evaluados')
    },
  })
}

export function useSubmitAuditFinding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, resultado, observaciones, kybUrl }) =>
      apiRequest(API_ENDPOINTS.PROJECT_AUDIT(id), {
        method: 'POST',
        body: { resultado, observaciones, kybUrl },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      toast.success('Auditoría registrada exitosamente')
    },
  })
}
