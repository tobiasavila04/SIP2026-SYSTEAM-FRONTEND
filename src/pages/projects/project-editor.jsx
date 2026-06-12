import { useParams, useNavigate } from 'react-router-dom'
import { useProject, useCreateProject, useUpdateProject } from '@/hooks/use-projects'
import { ProjectForm } from '@/components/features/projects/project-form'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton } from '@/components/shared/loading-skeleton'

export default function ProjectEditorPage() {
  const { id } = useParams()
  const projectId = id ? Number(id) : null
  const navigate = useNavigate()
  const isEdit = !!projectId

  const { data: project, isLoading, isError, refetch } = useProject(projectId)
  const createProject = useCreateProject()
  const updateProject = useUpdateProject(projectId)

  const handleSubmit = async (data) => {
    if (isEdit) {
      await updateProject.mutateAsync(data)
      navigate(`/proyectos/${projectId}`)
    } else {
      const p = await createProject.mutateAsync(data)
      navigate(`/proyectos/${p.id}`)
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[160px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    )
  }

  if (isEdit && (isError || !project)) {
    return <ErrorState message="No se pudo cargar el proyecto." onRetry={() => refetch()} />
  }

  if (isEdit) {
    return (
      <ProjectForm
          defaultValues={{
            titulo: project.titulo,
            descripcion: project.descripcion,
            rubro: project.rubro,
            montoRequerido: project.montoRequerido,
            plazo: project.plazo,
            gobernanzaComunidad: project.gobernanzaComunidad,
            cupoMaximoTokens: project.cupoMaximoTokens ?? undefined,
            valorNominalToken: project.valorNominalToken ?? undefined,
            simbolo: project.simbolo ?? '',
          }}
        onSubmit={handleSubmit}
        isEdit
        projectState={project.estado}
      />
    )
  }

  return <ProjectForm onSubmit={handleSubmit} />
}
