import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, ArrowUpRight, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'

export function EscrowPanel({ project, isCreator, isAuditor, refetch }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  // Asumimos que el Escrow Address viene en el tokenInfo o guardado temporalmente.
  // Para MVP, el auditor pedirá el contrato al hacer la liberación manual.
  const [escrowAddress, setEscrowAddress] = useState('')

  if (project.estado !== 'EJECUCION' && project.estado !== 'FINALIZADO') {
    return null
  }

  const handleRelease = async () => {
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }
    if (!escrowAddress.startsWith('0x')) {
      toast.error('Ingrese la dirección del contrato Escrow')
      return
    }

    setLoading(true)
    try {
      await apiRequest(`/api/projects/${project.id}/release-escrow`, {
        method: 'POST',
        body: JSON.stringify({
          amountToRelease: amount,
          escrowAddress: escrowAddress
        })
      })
      toast.success('Fondos liberados exitosamente del Escrow')
      setAmount('')
      if (refetch) refetch()
    } catch (error) {
      toast.error(error?.message || 'Error al liberar fondos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-indigo-500/20 bg-indigo-500/5 shadow-lg shadow-indigo-500/10 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-400">
          <ShieldCheck className="w-5 h-5" />
          Fideicomiso Inteligente (Escrow)
        </CardTitle>
        <CardDescription className="text-slate-300">
          {isCreator 
            ? "Tus fondos están protegidos en el Fideicomiso Inteligente (Escrow). Para usarlos, podés solicitar una liberación detallando para qué los vas a usar. Una vez que nuestro equipo audite tu avance, la plata se enviará a tu billetera."
            : "Tu inversión está segura. Los fondos no se entregan de golpe al creador, sino que Systeam los va liberando a medida que el proyecto demuestra avances reales."}
        </CardDescription>
      </CardHeader>
      
      {isAuditor && (
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Panel de Auditor: Liberación de Fondos</h4>
            <p className="text-xs text-slate-400">Ingrese la dirección del contrato Escrow desplegado y el monto a liberar (en IDEA) hacia el creador.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="0x... (Escrow Address)"
                value={escrowAddress}
                onChange={(e) => setEscrowAddress(e.target.value)}
                className="bg-slate-950 border-slate-700 font-mono text-sm"
              />
              <Input
                type="number"
                placeholder="Monto IDEA"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-950 border-slate-700 w-full sm:w-32"
              />
              <Button onClick={handleRelease} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white whitespace-nowrap">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
                Liberar a Creador
              </Button>
            </div>
          </div>
        </CardContent>
      )}

      {isCreator && (
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-sm text-indigo-200">
            <Info className="w-4 h-4 shrink-0" />
            <p>Para solicitar una liberación, enviá un reporte de avance a <strong>auditoria@systeam.com</strong>. Nuestro equipo lo evaluará y liberará los fondos correspondientes.</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
