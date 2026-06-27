import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Coins, Calculator, Sparkles, ListTodo, Plus, Trash2 } from 'lucide-react'
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
  hitos: z.array(z.object({
    titulo: z.string().min(1, 'El título es obligatorio'),
    porcentaje: z.coerce.number().min(0.01, 'Mínimo 0.01%').max(60, 'Ningún hito puede superar el 60%'),
    plazo: z.string().min(1, 'La fecha estimada es obligatoria').refine((val) => new Date(val) > new Date(), {
      message: 'Debe ser en el futuro'
    })
  })).min(2, 'Debe haber al menos 2 hitos')
}).refine((data) => {
  const maxRecaudacion = (data.cupoMaximoTokens || 0) * (data.valorNominalToken || 0);
  return maxRecaudacion >= data.montoRequerido;
}, {
  message: 'El valor total de los tokens no alcanza la meta de financiamiento',
  path: ['cupoMaximoTokens'],
}).refine((data) => {
  const sum = data.hitos.reduce((acc, hito) => acc + (hito.porcentaje || 0), 0)
  return Math.abs(sum - 100) < 0.01
}, {
  message: 'La suma de los porcentajes de los hitos debe ser exactamente 100%',
  path: ['hitos'],
}).refine((data) => {
  if (!data.plazo) return true;
  const plazoDateStr = data.plazo.substring(0, 10);
  let previousDate = new Date(plazoDateStr + 'T00:00:00');
  // Remove time portion for fair date comparison
  previousDate.setHours(0, 0, 0, 0);
  
  for (const hito of data.hitos) {
    if (!hito.plazo) continue;
    const hitoDateStr = hito.plazo.substring(0, 10);
    const hitoDate = new Date(hitoDateStr + 'T00:00:00');
    hitoDate.setHours(0, 0, 0, 0);
    
    const minRequiredDate = new Date(previousDate);
    minRequiredDate.setDate(minRequiredDate.getDate() + 7);
    
    if (hitoDate < minRequiredDate) {
      return false;
    }
    previousDate = hitoDate;
  }
  return true;
}, {
  message: 'Cada hito debe tener un plazo de al menos 7 días respecto al cierre de campaña o al hito anterior, y deben estar en orden cronológico',
  path: ['hitos'],
}).refine((data) => {
  if (!data.plazo) return true;
  const plazoDateStr = data.plazo.substring(0, 10);
  const projectPlazoDate = new Date(plazoDateStr + 'T00:00:00');
  projectPlazoDate.setHours(0, 0, 0, 0);
  const absoluteMaxDate = new Date(projectPlazoDate);
  absoluteMaxDate.setMonth(absoluteMaxDate.getMonth() + 24);
  
  for (const hito of data.hitos) {
    if (!hito.plazo) continue;
    const hitoDateStr = hito.plazo.substring(0, 10);
    const hitoDate = new Date(hitoDateStr + 'T00:00:00');
    hitoDate.setHours(0, 0, 0, 0);
    if (hitoDate > absoluteMaxDate) {
      return false;
    }
  }
  return true;
}, {
  message: 'Ningún hito puede extenderse más allá de 24 meses (2 años) desde el cierre de la campaña',
  path: ['hitos'],
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
      hitos: defaultValues?.hitos?.length > 0 ? defaultValues.hitos : [
        { titulo: '', porcentaje: 50, plazo: '' }, 
        { titulo: '', porcentaje: 50, plazo: '' }
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "hitos"
  })

  const handleSubmit = (values) => {
    const formattedValues = {
      ...values,
      plazo: values.plazo && values.plazo.length <= 10 ? `${values.plazo}T23:59:59` : values.plazo,
      hitos: values.hitos?.map(h => ({
        ...h,
        plazo: h.plazo && h.plazo.length <= 10 ? `${h.plazo}T23:59:59` : h.plazo
      }))
    }
    setPendingValues(formattedValues)
    setShowDisclaimer(true)
  }

  const goal = Number(form.watch('montoRequerido')) || 0;
  const isInvalidTotal = total !== goal && goal > 0;
  
  const watchedHitos = form.watch('hitos') || []
  const totalPercentage = watchedHitos.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0)
  const isInvalidPercentage = Math.abs(totalPercentage - 100) > 0.01

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

          {/* Card 4: Hitos del Proyecto */}
          <Card icon={ListTodo} title="Hitos del Proyecto" description="Dividí la recaudación en etapas (milestones) para mayor transparencia">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start bg-white/5 p-4 rounded-lg border border-white/10 relative">
                  <div className="flex-1 space-y-4">
                    <FormField
                      control={form.control}
                      name={`hitos.${index}.titulo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título del hito</FormLabel>
                          <FormControl>
                            <Input disabled={isDescriptionOnly} placeholder="ej: Compra de maquinaria" required {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-32 space-y-4">
                    <FormField
                      control={form.control}
                      name={`hitos.${index}.porcentaje`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porcentaje (%)</FormLabel>
                          <FormControl>
                            <Input disabled={isDescriptionOnly} type="number" step="0.01" min="0.01" max="100" required {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-48 space-y-4">
                    <FormField
                      control={form.control}
                      name={`hitos.${index}.plazo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha estimada</FormLabel>
                          <FormControl>
                            <Input disabled={isDescriptionOnly} type="date" required {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {!isDescriptionOnly && fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              {!isDescriptionOnly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ titulo: '', porcentaje: '' })}
                  className="w-full border-dashed border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Hito
                </Button>
              )}

              {form.formState.errors.hitos?.root?.message && (
                <p className="text-sm font-medium text-red-500 mt-2">
                  {form.formState.errors.hitos.root.message}
                </p>
              )}
              {form.formState.errors.hitos?.message && typeof form.formState.errors.hitos.message === 'string' && (
                <p className="text-sm font-medium text-red-500 mt-2">
                  {form.formState.errors.hitos.message}
                </p>
              )}

              <div className={`p-4 rounded-lg flex justify-between items-center ${isInvalidPercentage ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <span className="text-sm font-medium">Suma total de porcentajes:</span>
                <span className="text-lg font-bold">{totalPercentage.toFixed(2)}%</span>
              </div>
            </div>
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
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6" disabled={submitting || isInvalidTotal || isInvalidPercentage}>
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
