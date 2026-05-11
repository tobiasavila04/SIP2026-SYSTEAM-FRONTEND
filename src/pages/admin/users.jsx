import { useMemo, useState, useCallback } from 'react'
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  createColumnHelper,
} from '@tanstack/react-table'
import { useUsers, useDeleteUser, useCreateUser, useUpdateUserPartial, useAssignRole, useRevokeRole } from '@/hooks/use-users'
import { useRoles } from '@/hooks/use-roles'
import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { ErrorState } from '@/components/shared/error-state'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Power, Mail, Calendar } from 'lucide-react'

function UserFormDialog({ open, onOpenChange, onSubmit, initialData, loading, mode }) {
  const [name, setName] = useState(initialData?.name || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? 'Editar usuario' : 'Crear usuario'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" type="email" />
          </div>
          <Button onClick={() => onSubmit({ name, email })} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white" disabled={!name || !email || loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MobileUserCard({ user, roles, onToggle, onEdit, assignRole, revokeRole, userRoles }) {
  return (
    <div className="rounded-xl border border-white/5 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-400">{user.email}</span>
          </div>
        </div>
        <StatusBadge variant={user.enabled ? 'success' : 'error'}>
          {user.enabled ? 'Activo' : 'Inactivo'}
        </StatusBadge>
      </div>

      <div className="flex gap-1 flex-wrap">
        {user.roles?.map((role) => (
          <StatusBadge key={role} variant={role === 'ADMIN' ? 'error' : role === 'CREATOR' ? 'warning' : 'info'}>
            {role}
          </StatusBadge>
        ))}
      </div>

      {user.createdAt && (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span className="text-xs text-slate-500">{formatDate(user.createdAt)}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <button
          onClick={() => onToggle()}
          className={`h-7 w-7 rounded flex items-center justify-center border transition-all ${
            user.enabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
              : 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-white"
          onClick={() => onEdit()}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>

        <Select
          value=""
          onValueChange={(roleName) => {
            const role = roles?.find((r) => r.name === roleName)
            if (role) {
              if (userRoles.includes(roleName)) {
                revokeRole.mutate({ userId: user.id, roleId: role.id })
              } else {
                assignRole.mutate({ userId: user.id, roleId: role.id })
              }
            }
          }}
        >
          <SelectTrigger className="h-8 w-28 text-xs border-white/10">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            {roles?.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {userRoles.includes(role.name) ? `Quitar ${role.name}` : `Asignar ${role.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [deleteId, setDeleteId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const { data, isLoading, isError, refetch } = useUsers(page)
  const { data: roles } = useRoles()
  const createUser = useCreateUser()
  const deleteUser = useDeleteUser()
  const updateUser = useUpdateUserPartial()
  const assignRole = useAssignRole()
  const revokeRole = useRevokeRole()

  const users = data?.content || []

  const filteredUsers = useMemo(
    () => users.filter(
      (u) => u.name?.toLowerCase().includes(search.toLowerCase()) ||
             u.email?.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  )

  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Nombre',
        cell: (info) => <span className="text-white font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => <span className="text-slate-400">{info.getValue()}</span>,
      }),
      columnHelper.accessor('roles', {
        header: 'Roles',
        cell: (info) => (
          <div className="flex gap-1 flex-wrap">
            {info.getValue()?.map((role) => (
              <StatusBadge key={role} variant={role === 'ADMIN' ? 'error' : role === 'CREATOR' ? 'warning' : 'info'}>
                {role}
              </StatusBadge>
            ))}
          </div>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Creado',
        cell: (info) => <span className="text-slate-500 text-xs">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.accessor('enabled', {
        header: 'Estado',
        cell: (info) => {
          const enabled = info.getValue()
          return (
            <div className="w-20 text-center">
              <StatusBadge variant={enabled ? 'success' : 'error'}>
                {enabled ? 'Activo' : 'Inactivo'}
              </StatusBadge>
            </div>
          )
        },
      }),
      columnHelper.accessor('id', {
        header: 'Acciones',
        cell: (info) => {
          const userId = info.getValue()
          const user = users.find((u) => u.id === userId)
          const userRoles = user?.roles || []

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateUser.mutate({ id: userId, name: user.name, email: user.email, enabled: !user?.enabled })}
                className={`h-7 w-7 rounded flex items-center justify-center border transition-all ${
                  user?.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-white"
                onClick={() => {
                  setEditingUser(user)
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>

              <Select
                value=""
                onValueChange={(roleName) => {
                  const role = roles?.find((r) => r.name === roleName)
                  if (role) {
                    if (userRoles.includes(roleName)) {
                      revokeRole.mutate({ userId, roleId: role.id })
                    } else {
                      assignRole.mutate({ userId, roleId: role.id })
                    }
                  }
                }}
              >
                <SelectTrigger className="h-8 w-28 text-xs border-white/10">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {userRoles.includes(role.name) ? `Quitar ${role.name}` : `Asignar ${role.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        },
      }),
    ],
    [users, roles, assignRole, revokeRole, updateUser]
  )

  const table = useReactTable({
    data: filteredUsers,
    columns,
    pageCount: data?.totalPages || 1,
    state: { pagination: { pageIndex: page, pageSize: 10 } },
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' ? updater({ pageIndex: page, pageSize: 10 }) : updater
      setPage(newState.pageIndex)
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  })

  const handleDelete = async () => {
    if (deleteId !== null) {
      await deleteUser.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const handleCreate = useCallback(async ({ name, email }) => {
    await createUser.mutateAsync({ name, email })
    setShowCreate(false)
  }, [createUser])

  const handleEdit = useCallback(async ({ name, email }) => {
    if (!editingUser) return
    await updateUser.mutateAsync({ id: editingUser.id, name, email })
    setEditingUser(null)
  }, [editingUser, updateUser])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestioná los usuarios de la plataforma"
      >
        <SearchInput
          placeholder="Buscar usuarios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="w-full sm:w-64"
        />
        <Button className="bg-indigo-500 hover:bg-indigo-400 text-white gap-2 shrink-0" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo usuario</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </PageHeader>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <DataTable table={table} columns={columns.length} />
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-500">No hay datos disponibles</div>
            ) : (
              filteredUsers.map((user) => (
                <MobileUserCard
                  key={user.id}
                  user={user}
                  roles={roles}
                  userRoles={user.roles || []}
                  onToggle={() => updateUser.mutate({ id: user.id, name: user.name, email: user.email, enabled: !user.enabled })}
                  onEdit={() => setEditingUser(user)}
                  assignRole={assignRole}
                  revokeRole={revokeRole}
                />
              ))
            )}
            {data?.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Página {page + 1} de {data.totalPages}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-400" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    Anterior
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-slate-400" disabled={page >= data.totalPages - 1} onClick={() => setPage(page + 1)}>
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <UserFormDialog
        key="create-user-dialog"
        open={showCreate}
        onOpenChange={setShowCreate}
        mode="create"
        onSubmit={handleCreate}
        loading={createUser.isPending}
      />

      {editingUser && (
        <UserFormDialog
          key={`edit-user-${editingUser.id}`}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          mode="edit"
          initialData={editingUser}
          onSubmit={handleEdit}
          loading={updateUser.isPending}
        />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Deshabilitar usuario"
        description="¿Estás seguro de deshabilitar este usuario? Podrá ser habilitado nuevamente."
        confirmLabel="Deshabilitar"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteUser.isPending}
      />
    </div>
  )
}
