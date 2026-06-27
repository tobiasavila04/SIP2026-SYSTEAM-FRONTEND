import { useParams, useNavigate } from 'react-router-dom'
import { useProject, useCreateProject, useUpdateProject } from '@/hooks/use-projects'
import { ProjectForm } from '@/components/features/projects/project-form'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { AlertCircle, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

export default function ProjectEditorPage() {
  const { id } = useParams()
  const projectId = id ? Number(id) : null
  const navigate = useNavigate()
  const isEdit = !!projectId
  const user = useAuthStore((s) => s.user)
  const { isConnected, address } = useAccount()

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

  if (!isEdit && user?.kycStatus !== 'VERIFIED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">Verificación Requerida</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Para crear un proyecto y recaudar fondos en Systeam, por motivos regulatorios es obligatorio verificar tu identidad.
        </p>
        <Link
          to="/perfil?tab=kyc"
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
        >
          Ir a verificar identidad
        </Link>
      </div>
    )
  }

  const hasWallet = (user?.walletAddress && user.walletAddress.trim() !== '') || (isConnected && address)

  if (!isEdit && !hasWallet) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">Billetera Requerida</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Para crear un proyecto y poder recibir los fondos recaudados, necesitás conectar una billetera Web3 a tu cuenta.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
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
            hitos: project.hitos ?? [{ titulo: '', porcentaje: 100 }],
          }}
        onSubmit={handleSubmit}
        isEdit
        projectState={project.estado}
      />
    )
  }

  return <ProjectForm onSubmit={handleSubmit} />
}
