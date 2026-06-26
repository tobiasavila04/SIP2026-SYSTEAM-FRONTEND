import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { PageHeader } from '@/components/shared/page-header'
import { Loader2, ShieldCheck, Search, ChevronRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

function AuditRow({ project, onAuditClick }) {
  return (
    <div className="flex items-center justify-between p-4 bg-card border border-white/5 rounded-xl hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">{project.titulo}</h4>
          <p className="text-xs text-slate-400 mt-0.5">Monto Requerido: ${project.montoRequerido.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Link 
          to={`/proyectos/${project.id}`}
          className="text-xs text-slate-400 hover:text-white transition-colors"
          target="_blank"
        >
          Ver detalle
        </Link>
        <button
          onClick={() => onAuditClick(project)}
          className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-sm font-medium rounded-lg transition-colors border border-emerald-500/20"
        >
          Realizar Auditoría
        </button>
      </div>
    </div>
  )
}

export default function AuditsPage() {
  const [selectedProject, setSelectedProject] = useState(null)
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects-to-audit'],
    queryFn: () => apiRequest(API_ENDPOINTS.PROJECTS_CATALOG + '?estado=EN_AUDITORIA'),
  })

  const projects = projectsData?.content || []

  const submitAudit = useMutation({
    mutationFn: (data) => apiRequest(`/api/projects/${selectedProject.id}/audit`, {
      method: 'POST',
      body: {
        kybUrl: "https://example.com/audit",
        resultado: data.dictamen === 'APPROVED' ? 'APROBADO' : 'RECHAZADO',
        observaciones: `Score: ${data.riskScore} | Viabilidad: ${data.financialViabilityScore} | Obs: ${data.observaciones}`
      }
    }),
    onSuccess: () => {
      toast.success('Auditoría enviada correctamente')
      queryClient.invalidateQueries({ queryKey: ['projects-to-audit'] })
      setSelectedProject(null)
      reset()
    },
    onError: (err) => {
      toast.error(err.message || 'Error al enviar auditoría')
    }
  })

  const onSubmit = (data) => {
    submitAudit.mutate(data)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <PageHeader 
        title="Panel de Auditoría" 
        description="Gestión y dictamen de proyectos pendientes de revisión" 
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Todo al día</h3>
          <p className="text-sm text-slate-400">No hay proyectos pendientes de auditoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <AuditRow key={p.id} project={p} onAuditClick={setSelectedProject} />
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur">
              <div>
                <h3 className="text-lg font-semibold text-white">Auditar Proyecto</h3>
                <p className="text-sm text-slate-400">{selectedProject.titulo}</p>
              </div>
              <button 
                onClick={() => { setSelectedProject(null); reset(); }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="audit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Score de Riesgo</label>
                    <select 
                      {...register('riskScore', { required: 'Obligatorio' })}
                      className="w-full h-11 bg-black/20 border border-white/10 rounded-lg px-4 text-white text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 outline-none"
                    >
                      <option value="">Selecciona el riesgo</option>
                      <option value="A+">A+ (Muy Bajo Riesgo)</option>
                      <option value="A">A (Bajo Riesgo)</option>
                      <option value="B">B (Riesgo Moderado)</option>
                      <option value="C">C (Riesgo Alto)</option>
                      <option value="D">D (Muy Alto Riesgo)</option>
                    </select>
                    {errors.riskScore && <span className="text-xs text-red-400">{errors.riskScore.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Viabilidad Financiera (1 al 10)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10"
                      {...register('financialViabilityScore', { required: 'Obligatorio', min: 1, max: 10 })}
                      className="w-full h-11 bg-black/20 border border-white/10 rounded-lg px-4 text-white text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 outline-none"
                    />
                    {errors.financialViabilityScore && <span className="text-xs text-red-400">{errors.financialViabilityScore.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Observaciones</label>
                    <textarea 
                      {...register('observaciones')}
                      rows={4}
                      placeholder="Detalles de la auditoría (confidencial)"
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-4 text-white text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Dictamen Final</label>
                    <select 
                      {...register('dictamen', { required: 'Obligatorio' })}
                      className="w-full h-11 bg-black/20 border border-white/10 rounded-lg px-4 text-white text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 outline-none"
                    >
                      <option value="">Selecciona una decisión</option>
                      <option value="APPROVED">APROBADO (Pasa a fase de Inversión)</option>
                      <option value="REJECTED">RECHAZADO (Se cancela permanentemente)</option>
                    </select>
                    {errors.dictamen && <span className="text-xs text-red-400">{errors.dictamen.message}</span>}
                  </div>
                </div>

              </form>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-slate-900/90 backdrop-blur">
              <button
                type="button"
                onClick={() => { setSelectedProject(null); reset(); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                disabled={submitAudit.isPending}
              >
                Cancelar
              </button>
              <button
                form="audit-form"
                type="submit"
                disabled={submitAudit.isPending}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {submitAudit.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Auditoría
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
