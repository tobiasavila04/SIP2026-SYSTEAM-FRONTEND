import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Coins, Calculator } from 'lucide-react'

const projectSchema = z.object({
  cupoMaximoTokens: z.coerce.number().int().min(1, 'Debe emitirse al menos 1 token').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  valorNominalToken: z.coerce.number().min(0.01, 'El valor nominal debe ser mayor a 0').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
})

export function ProjectForm({ defaultValues, onSubmit, isEdit }) {
  const [submitting, setSubmitting] = useState(false)
  const [supply, setSupply] = useState(defaultValues?.cupoMaximoTokens ?? '')
  const [price, setPrice] = useState(defaultValues?.valorNominalToken ?? '')

  const total = (Number(supply) || 0) * (Number(price) || 0)

  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      titulo: defaultValues?.titulo || '',
      descripcion: defaultValues?.descripcion || '',
      montoRequerido: defaultValues?.montoRequerido || undefined,
      plazo: defaultValues?.plazo || '',
      gobernanzaComunidad: defaultValues?.gobernanzaComunidad || false,
      cupoMaximoTokens: defaultValues?.cupoMaximoTokens || undefined,
      valorNominalToken: defaultValues?.valorNominalToken || undefined,
    },
  })

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del proyecto" maxLength={200} required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe tu proyecto..." className="min-h-[120px]" maxLength={8000} required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="montoRequerido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto requerido (USD)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0.01" placeholder="10000" required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plazo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plazo</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-xl border border-violet-500/10 bg-violet-500/[0.02] p-5 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-violet-500/10">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Configuración financiera</h3>
              <p className="text-[11px] text-slate-500">Definí el suministro de tokens y el valor nominal</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cupoMaximoTokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Suministro de tokens</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Ej: 10000"
                      {...field}
                      onChange={(e) => { field.onChange(e); setSupply(e.target.value) }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valorNominalToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Valor nominal por token (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Ej: 10.00"
                      {...field}
                      onChange={(e) => { field.onChange(e); setPrice(e.target.value) }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {supply && price && (
            <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calculator className="w-3.5 h-3.5" />
                <span>Estimación de capital a levantar</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-violet-200">
                  {formatCurrency(total)}
                </span>
                <span className="text-xs text-slate-500">
                  = {Number(supply).toLocaleString()} tokens × {formatCurrency(Number(price) || 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="gobernanzaComunidad"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <Label className="text-sm text-slate-300">Gobernanza de comunidad</Label>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white" disabled={submitting}>
            {submitting ? 'Guardando...' : isEdit ? 'Actualizar proyecto' : 'Crear proyecto'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
