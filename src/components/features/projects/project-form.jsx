import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { formatCurrency } from '@/lib/utils'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Coins, Calculator, Sparkles } from 'lucide-react'
import { ProjectDisclaimerModal } from './project-disclaimer-modal'

const projectSchema = z.object({
  titulo: z.string().min(1, 'El nombre del proyecto es obligatorio'),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  rubro: z.coerce.number().min(1, 'Debe seleccionar un rubro'),
  montoRequerido: z.coerce.number().min(0.01, 'La meta debe ser mayor a 0'),
  plazo: z.string().min(1, 'La fecha límite es obligatoria').refine((val) => new Date(val) > new Date(), {
    message: 'La fecha límite debe estar en el futuro',
  }),
  gobernanzaComunidad: z.boolean().optional(),
  cupoMaximoTokens: z.coerce.number().int().min(2, 'Debe emitirse al menos 2 tokens'),
  valorNominalToken: z.coerce.number().min(0.01, 'El valor nominal debe ser mayor a 0'),
  simbolo: z.string().min(2, 'Mínimo 2 caracteres').max(5, 'Máximo 5 caracteres').toUpperCase(),
}).refine((data) => {
  const maxRecaudacion = (data.cupoMaximoTokens || 0) * (data.valorNominalToken || 0);
  return maxRecaudacion >= data.montoRequerido;
}, {
  message: 'El valor total de los tokens no alcanza la meta de financiamiento',
  path: ['cupoMaximoTokens'],
})

function Card({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#0D111D] p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-800/60">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function FieldGroup({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

export function ProjectForm({ defaultValues, onSubmit, isEdit, projectState }) {
  const isDescriptionOnly = ['EN_AUDITORIA', 'FINANCIAMIENTO'].includes(projectState)
  const [submitting, setSubmitting] = useState(false)
  const [supply, setSupply] = useState(defaultValues?.cupoMaximoTokens ?? '')
  const [price, setPrice] = useState(defaultValues?.valorNominalToken ?? '')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [pendingValues, setPendingValues] = useState(null)
  const total = (Number(supply) || 0) * (Number(price) || 0)

  const form = useForm({
    resolver: zodResolver(projectSchema),
    mode: 'onChange',
    defaultValues: {
      titulo: defaultValues?.titulo || '',
      descripcion: defaultValues?.descripcion || '',
      rubro: defaultValues?.rubro || undefined,
      montoRequerido: defaultValues?.montoRequerido || undefined,
      plazo: defaultValues?.plazo || '',
      gobernanzaComunidad: defaultValues?.gobernanzaComunidad || false,
      cupoMaximoTokens: defaultValues?.cupoMaximoTokens || undefined,
      valorNominalToken: defaultValues?.valorNominalToken || undefined,
      simbolo: defaultValues?.simbolo || '',
    },
  })

  const handleSubmit = (values) => {
    setPendingValues(values)
    setShowDisclaimer(true)
  }

  const goal = Number(form.watch('montoRequerido')) || 0;
  const isInvalidTotal = total !== goal && goal > 0;

  const handleConfirmSubmit = async () => {
    setShowDisclaimer(false)
    setSubmitting(true)
    try {
      await onSubmit(pendingValues)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isEdit ? 'Actualizá los detalles de tu proyecto' : 'Completá los detalles para crear tu proyecto'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Card 1: Información General */}
          <Card icon={Sparkles} title="Información General" description="Datos básicos del proyecto">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del proyecto</FormLabel>
                  <FormControl>
                    <Input disabled={isDescriptionOnly} placeholder="ej: Sistema de Riego Inteligente" maxLength={200} required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rubro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rubro</FormLabel>
                  <Select disabled={isDescriptionOnly} onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="bg-[#151b2b] border-gray-800">
                        <SelectValue placeholder="Seleccioná un rubro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#151b2b] border-gray-800 text-white">
                      <SelectItem value="4">Agro</SelectItem>
                      <SelectItem value="1">Tech</SelectItem>
                      <SelectItem value="3">Inmobiliario</SelectItem>
                      <SelectItem value="2">Gastro</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea
                      placeholder="Contanos de qué trata tu proyecto, el problema que resuelve y por qué deberían invertir..."
                      className="min-h-[120px]"
                      maxLength={8000}
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          {/* Card 2: Configuración Financiera */}
          <Card icon={Calculator} title="Configuración Financiera" description="Meta de financiamiento y plazo">
            <FieldGroup>
              <FormField
                control={form.control}
                name="montoRequerido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta de financiamiento (USD)</FormLabel>
                    <FormControl>
                      <Input disabled={isDescriptionOnly} type="number" step="0.01" min="0.01" placeholder="ej: 50000" required {...field} />
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
                    <FormLabel>Fecha límite</FormLabel>
                      <FormControl>
                        <Input 
                          disabled={isDescriptionOnly} 
                          type="datetime-local" 
                          min={new Date().toISOString().slice(0, 16)} 
                          required 
                          {...field} 
                        />
                      </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FieldGroup>
          </Card>

          {/* Card 3: Tokenomics */}
          <Card icon={Coins} title="Token del Proyecto" description="Configuración del token que recibirán los inversores">
            <FieldGroup>
              <FormField
                control={form.control}
                name="cupoMaximoTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad de tokens</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isDescriptionOnly}
                        type="number"
                        min="2"
                        step="1"
                        placeholder="ej: 10000"
                        required
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
                    <FormLabel>Precio por token (USD)</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isDescriptionOnly}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="ej: 10.00"
                        required
                        {...field}
                        onChange={(e) => { field.onChange(e); setPrice(e.target.value) }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FieldGroup>

            <div className="mt-4">
              <FormField
                control={form.control}
                name="simbolo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Símbolo del token</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isDescriptionOnly}
                        placeholder="ej: CERV"
                        maxLength={5}
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        onBlur={field.onBlur}
                        value={field.value}
                        ref={field.ref}
                        name={field.name}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      Identificador único del token en la blockchain (ej: CERV, IDEA-RIEGO)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {supply && price && (() => {
                return (
                  <div className={`rounded-lg border p-4 flex flex-col gap-2 ${isInvalidTotal ? 'bg-red-500/5 border-red-500/20' : 'bg-indigo-500/5 border-indigo-500/10'}`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 text-sm ${isInvalidTotal ? 'text-red-400' : 'text-gray-400'}`}>
                        <Calculator className={`w-4 h-4 ${isInvalidTotal ? 'text-red-400' : 'text-indigo-400'}`} />
                        <span>Capital total si se venden todos los tokens</span>
                      </div>
                      <span className={`text-lg font-bold ${isInvalidTotal ? 'text-red-400' : 'text-indigo-300'}`}>
                        {formatCurrency(total)}
                      </span>
                    </div>
                    {isInvalidTotal && (
                      <p className="text-xs text-red-400 mt-1">
                        El capital total emitido debe ser exactamente igual a la meta de financiamiento ({formatCurrency(goal)}). Ajustá la cantidad o el precio de los tokens.
                      </p>
                    )}
                  </div>
                );
              })()}
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <FormField
                control={form.control}
                name="gobernanzaComunidad"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch disabled={isDescriptionOnly} checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <span className="text-sm text-gray-300 font-medium">Gobernanza de comunidad</span>
                      <p className="text-xs text-gray-500">Los inversores podrán votar propuestas</p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={() => window.history.back()} className="text-gray-400 hover:text-white">
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6" disabled={submitting || isInvalidTotal}>
                {submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Proyecto'}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <ProjectDisclaimerModal 
        open={showDisclaimer} 
        onOpenChange={setShowDisclaimer} 
        onConfirm={handleConfirmSubmit} 
      />
    </div>
  )
}
