import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProject, useCreateProject, useUpdateProject } from '@/hooks/use-projects'
import { ProjectForm } from '@/components/features/projects/project-form'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { ArrowLeft } from 'lucide-react'

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
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  if (isEdit && (isError || !project)) {
    return <ErrorState message="No se pudo cargar el proyecto." onRetry={() => refetch()} />
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        to={isEdit ? `/proyectos/${projectId}` : '/proyectos'}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {isEdit ? 'Volver al proyecto' : 'Volver a proyectos'}
      </Link>

      <PageHeader
        title={isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
        description={isEdit ? 'Actualizá los detalles de tu proyecto' : 'Completá los detalles para crear tu proyecto'}
      />

      <div className="rounded-xl border border-white/5 bg-card p-6">
        {isEdit ? (
          <ProjectForm
            defaultValues={{
              titulo: project.titulo,
              descripcion: project.descripcion,
              montoRequerido: project.montoRequerido,
              plazo: project.plazo,
              gobernanzaComunidad: project.gobernanzaComunidad,
              cupoMaximoTokens: project.cupoMaximoTokens ?? undefined,
              valorNominalToken: project.valorNominalToken ?? undefined,
            }}
            onSubmit={handleSubmit}
            isEdit
          />
        ) : (
          <ProjectForm onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  )
}
