import { useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSubmitOracleReport } from '@/hooks/use-oracle'

export function OracleBillingForm({ projectId, open, onOpenChange }) {
  const [monto, setMonto] = useState('')
  const submitMutation = useSubmitOracleReport(projectId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const value = parseFloat(monto)
    if (!value || value <= 0) {
      toast.error('Ingresá un monto válido mayor a 0')
      return
    }
    try {
      await submitMutation.mutateAsync({ montoFacturado: value })
      toast.success('Facturación reportada correctamente')
      setMonto('')
      onOpenChange(false)
    } catch (err) {
      toast.error(err?.message || 'Error al reportar la facturación')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Reportar facturación auditada
          </DialogTitle>
          <DialogDescription>
            El monto ingresado será registrado on-chain vía el oráculo Chainlink y quedará visible para los inversores.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="monto-facturado">Monto facturado (USD)</Label>
            <Input
              id="monto-facturado"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              disabled={submitMutation.isPending}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending || !monto}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
            >
              {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitMutation.isPending ? 'Enviando...' : 'Reportar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
