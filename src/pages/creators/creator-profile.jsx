import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Wallet, Calendar, User, ArrowLeft, Copy, Check } from 'lucide-react'
import { useCreatorProfile, useCreatorProjects } from '@/hooks/use-projects'
import { ProjectCard } from '@/components/features/projects/project-card'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function CreatorProfile() {
  const { id } = useParams()
  const [copied, setCopied] = useState(false)
  
  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    error: profileError 
  } = useCreatorProfile(id)

  const { 
    data: projectsData, 
    isLoading: isProjectsLoading, 
    error: projectsError 
  } = useCreatorProjects(id, 0, 50) // Traemos hasta 50 proyectos para no paginar en la V1

  if (profileError) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <ErrorState 
          title="Error al cargar el perfil" 
          message="No se pudo encontrar la información de este creador." 
        />
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline">
            <Link to="/proyectos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al catálogo
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Helper para truncar la wallet (0x1234...abcd)
  const formatWallet = (wallet) => {
    if (!wallet) return 'Billetera no disponible'
    return `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`
  }

  const handleCopyWallet = () => {
    if (profile?.walletAddress) {
      navigator.clipboard.writeText(profile.walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      {/* Botón Volver */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
          <Link to="/proyectos" className="flex items-center text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Link>
        </Button>
      </div>

      {/* Header del Creador */}
      <div className="relative border border-white/10 rounded-3xl p-8 md:p-12 mb-12 shadow-2xl overflow-hidden backdrop-blur-xl bg-card/40">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent pointer-events-none" />
        
        {/* Glow animado de fondo */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl mix-blend-screen pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none" />

        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <User className="w-64 h-64" />
        </div>
        
        {isProfileLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/4" />
          </div>
        ) : (
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar Glow */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-full ring-4 ring-background/50 shadow-xl">
                <User className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {profile?.name}
              </h1>
              
              <div className="flex flex-col sm:flex-row gap-3 text-muted-foreground">
                <div className="flex items-center bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 shadow-inner">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">Miembro desde {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}</span>
                </div>
                
                <button 
                  onClick={handleCopyWallet}
                  disabled={!profile?.walletAddress}
                  className="flex items-center bg-black/20 hover:bg-black/40 transition-colors backdrop-blur-md px-4 py-2 rounded-full border border-white/5 shadow-inner cursor-pointer"
                  title="Copiar dirección"
                >
                  <Wallet className="w-4 h-4 mr-2 text-purple-400" />
                  <span className="font-mono text-sm font-medium text-slate-300 mr-2">
                    {formatWallet(profile?.walletAddress)}
                  </span>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400 opacity-70 hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Proyectos */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center">
            Proyectos del creador
            {!isProjectsLoading && projectsData?.content && (
              <span className="ml-3 bg-primary/10 text-primary text-sm py-1 px-3 rounded-full font-medium">
                {projectsData.totalElements}
              </span>
            )}
          </h2>
        </div>

        {isProjectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        ) : projectsError ? (
          <ErrorState 
            title="Error al cargar proyectos" 
            message="Ocurrió un problema al obtener los proyectos de este creador." 
          />
        ) : projectsData?.content?.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground shadow-sm">
            <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary/50" />
            </div>
            <p className="text-lg">Este creador aún no tiene proyectos públicos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsData.content.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
