import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

const CONFIG = {
  role: {
    nameLabel: 'Nombre del rol',
    namePlaceholder: 'Ej: MODERATOR',
    nameClass: '',
    descriptionPlaceholder: 'Describe el propósito del rol',
    createLabel: 'Crear rol',
    editLabel: 'Guardar cambios',
  },
  permission: {
    nameLabel: 'Nombre del permiso',
    namePlaceholder: 'Ej: project:delete',
    nameClass: 'font-mono text-sm',
    descriptionPlaceholder: 'Describe qué acción autoriza este permiso',
    createLabel: 'Crear permiso',
    editLabel: 'Guardar cambios',
  },
}

export function EntityFormDialog({ type, mode, initialData, onClose, onSubmit, loading }) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const isEdit = mode === 'edit'
  const cfg = CONFIG[type]

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{cfg.nameLabel}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={cfg.namePlaceholder}
          className={`mt-1.5 h-10 ${cfg.nameClass}`}
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={cfg.descriptionPlaceholder}
          className="mt-1.5 h-10"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1 h-10" disabled={loading}>Cancelar</Button>
        <Button onClick={() => onSubmit({ name, description })} className="flex-1 h-10 bg-violet-600 hover:bg-violet-500 text-white" disabled={!name || loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? cfg.editLabel : cfg.createLabel}
        </Button>
      </div>
    </div>
  )
}
