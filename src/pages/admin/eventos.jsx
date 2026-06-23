import { useState, useMemo } from 'react'
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  createColumnHelper,
} from '@tanstack/react-table'
import { motion } from 'framer-motion'
import {
  useEventos, useCreateEvento, useUpdateEvento, useDeleteEvento,
  useAsistencias, useConfirmAttendance,
} from '@/hooks/use-governance'
import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { ErrorState } from '@/components/shared/error-state'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProjects } from '@/hooks/use-projects'
import { formatDateTime } from '@/lib/utils'
import { Plus, Pencil, Trash2, Users, Loader2, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const columnHelper = createColumnHelper()

function EventoFormDialog({ open, onOpenChange, onSubmit, initialData, loading, mode }) {
  const [titulo, setTitulo] = useState(initialData?.titulo || '')
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || '')
  const [fechaEvento, setFechaEvento] = useState(initialData?.fechaEvento || '')
  const [rewardAmount, setRewardAmount] = useState(initialData?.rewardAmount ?? '')
  const [proyectoId, setProyectoId] = useState(initialData?.proyectoId != null ? String(initialData.proyectoId) : 'none')

  const { data: proyectosData } = useProjects({ page: 0, size: 200 })
  const proyectos = proyectosData?.content ?? []

  const isEdit = mode === 'edit'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!titulo.trim() || !fechaEvento) return

    const body = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      fechaEvento: new Date(fechaEvento).toISOString(),
      rewardAmount: rewardAmount ? Number(rewardAmount) : 0,
      proyectoId: proyectoId && proyectoId !== 'none' ? Number(proyectoId) : null,
    }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-400" />
            {isEdit ? 'Editar evento' : 'Nuevo evento'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Actualizá los datos del evento.' : 'Creá un nuevo evento comunitario.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-slate-300">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Presentación Q3"
              required
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-slate-300">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del evento..."
              rows={3}
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fechaEvento" className="text-slate-300">Fecha del evento *</Label>
            <Input
              id="fechaEvento"
              type="datetime-local"
              value={fechaEvento}
              onChange={(e) => setFechaEvento(e.target.value)}
              required
              className="bg-slate-950 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rewardAmount" className="text-slate-300">Recompensa ($IDEA)</Label>
            <Input
              id="rewardAmount"
              type="number"
              step="0.01"
              min="0"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              placeholder="0 = sin recompensa"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Proyecto asociado</Label>
            <Select value={proyectoId} onValueChange={setProyectoId}>
              <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                <SelectValue placeholder="Ninguno (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="none">Ninguno</SelectItem>
                {proyectos.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !titulo.trim() || !fechaEvento}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Guardar cambios' : 'Crear evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AsistenciasDialog({ open, onOpenChange, eventoId }) {
  const { data: asistencias, isLoading, refetch } = useAsistencias(eventoId)
  const [userId, setUserId] = useState('')
  const confirmAttendance = useConfirmAttendance()

  const handleConfirm = async () => {
    if (!userId) return
    try {
      await confirmAttendance.mutateAsync({ eventoId, userId: Number(userId) })
      setUserId('')
    } catch { /* handled by hook */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Asistencias
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="userId-asistencia" className="text-xs text-slate-400">User ID</Label>
              <Input
                id="userId-asistencia"
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="ID del usuario"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 h-9"
              />
            </div>
            <Button
              onClick={handleConfirm}
              disabled={confirmAttendance.isPending || !userId}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-9"
            >
              {confirmAttendance.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirmar'
              )}
            </Button>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Asistencias confirmadas ({asistencias?.length ?? 0})
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            ) : asistencias?.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {asistencias.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm text-slate-300">
                        Usuario <strong className="text-white">#{a.userId}</strong>
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {a.confirmedAt ? format(new Date(a.confirmedAt), 'dd/MM HH:mm') : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">
                No hay asistencias registradas
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminEventosPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingEvento, setEditingEvento] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [asistenciasTarget, setAsistenciasTarget] = useState(null)

  const { data: eventosData, isLoading, isError, refetch } = useEventos(page, 10)
  const deleteEvento = useDeleteEvento()
  const createEvento = useCreateEvento()
  const updateEvento = useUpdateEvento(editingEvento?.id)

  const eventos = eventosData?.content ?? []
  const totalPages = eventosData?.totalPages ?? 0

  const filteredEventos = useMemo(() => {
    if (!search) return eventos
    const q = search.toLowerCase()
    return eventos.filter((e) =>
      e.titulo?.toLowerCase().includes(q) ||
      e.descripcion?.toLowerCase().includes(q)
    )
  }, [eventos, search])

  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: (info) => <span className="font-mono text-xs text-slate-500">#{info.getValue()}</span>,
    }),
    columnHelper.accessor('titulo', {
      header: 'Título',
      cell: (info) => (
        <span className="text-white font-medium">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('fechaEvento', {
      header: 'Fecha',
      cell: (info) => (
        <span className="text-slate-400 text-xs">
          {formatDateTime(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('rewardAmount', {
      header: 'Recompensa',
      cell: (info) => {
        const amount = Number(info.getValue())
        return amount > 0
          ? <span className="text-emerald-400 font-mono">{amount} $IDEA</span>
          : <span className="text-slate-500">—</span>
      },
    }),
    columnHelper.accessor('createdBy', {
      header: 'Creado por',
      cell: (info) => (
        <span className="text-slate-500 font-mono text-xs">#{info.getValue()}</span>
      ),
    }),
    columnHelper.display({
      id: 'asistencias',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-slate-500 hover:text-violet-400"
          onClick={() => setAsistenciasTarget(row.original)}
          title="Ver asistencias"
        >
          <Users className="w-4 h-4" />
        </Button>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-slate-500 hover:text-amber-400"
            onClick={() => {
              setEditingEvento(row.original)
              setShowFormDialog(true)
            }}
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-slate-500 hover:text-red-400"
            onClick={() => setDeleteTarget(row.original)}
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }),
  ], [])

  const table = useReactTable({
    data: filteredEventos,
    columns,
    pageCount: totalPages,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const handleCreate = async (data) => {
    try {
      await createEvento.mutateAsync(data)
      setShowFormDialog(false)
      setEditingEvento(null)
    } catch { /* handled by hook */ }
  }

  const handleUpdate = async (data) => {
    try {
      await updateEvento.mutateAsync(data)
      setShowFormDialog(false)
      setEditingEvento(null)
    } catch { /* handled by hook */ }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteEvento.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch { /* handled by hook */ }
  }

  if (isError) {
    return <ErrorState message="No se pudieron cargar los eventos." onRetry={refetch} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        icon={Calendar}
        title="Eventos"
        description="Administración de eventos comunitarios y recompensas por asistencia"
      >
        <Button
          onClick={() => {
            setEditingEvento(null)
            setShowFormDialog(true)
          }}
          className="bg-violet-600 hover:bg-violet-500 text-white gap-2 h-9 px-4 text-sm rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Nuevo evento
        </Button>
      </PageHeader>

      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar eventos..."
      />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <DataTable table={table} columns={columns.length} loading={false} />
      )}

      <div className="flex items-center justify-center gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="text-slate-500"
        >
          Anterior
        </Button>
        <span className="text-xs text-slate-500">
          Página {page + 1} de {totalPages || 1}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages - 1}
          className="text-slate-500"
        >
          Siguiente
        </Button>
      </div>

      <EventoFormDialog
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open)
          if (!open) setEditingEvento(null)
        }}
        initialData={editingEvento ? {
          ...editingEvento,
          fechaEvento: editingEvento.fechaEvento?.slice(0, 16),
        } : null}
        onSubmit={editingEvento ? handleUpdate : handleCreate}
        loading={createEvento.isPending || updateEvento.isPending}
        mode={editingEvento ? 'edit' : 'create'}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Eliminar evento"
        description={`¿Estás seguro de eliminar "${deleteTarget?.titulo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteEvento.isPending}
      />

      <AsistenciasDialog
        open={!!asistenciasTarget}
        onOpenChange={(open) => { if (!open) setAsistenciasTarget(null) }}
        eventoId={asistenciasTarget?.id}
      />
    </motion.div>
  )
}
