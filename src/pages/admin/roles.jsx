import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, useAssignPermission, useRevokePermission } from '@/hooks/use-roles'
import { usePermissions, useCreatePermission } from '@/hooks/use-permission-crud'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { SearchInput } from '@/components/shared/search-input'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EntityFormDialog } from '@/components/admin/entity-form-dialog'
import { Plus, Shield, KeyRound, Pencil, Trash2, Check, ChevronDown } from 'lucide-react'

const ROLE_COLORS = {
  ADMIN: { badge: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-500' },
  CREATOR: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  INVESTOR: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
}

function roleStyle(name) {
  return ROLE_COLORS[name] || { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500' }
}

function RoleCard({ role, permissions, expanded, onToggle, onEdit, onDelete, onTogglePermission, isPending }) {
  const style = roleStyle(role.name)
  const rolePerms = role.permissions || []
  const permCount = rolePerms.length

  return (
    <div className="rounded-xl border border-white/[0.06] bg-card overflow-hidden transition-all duration-200">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className={`w-2 h-2 rounded-full ${style.dot} flex-shrink-0`} />
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className={`text-sm font-semibold ${style.badge} px-2 py-0.5 rounded-md border flex-shrink-0`}>
            {role.name}
          </span>
          {role.description && (
            <span className="text-xs text-slate-500 truncate">{role.description}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(role)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(role.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onToggle(role.id)} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${expanded ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="permissions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-t border-white/[0.06] overflow-hidden"
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Permisos ({permCount})</span>
              </div>
              {(!permissions || permissions.length === 0) ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Shield className="w-6 h-6 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500">No hay permisos disponibles</p>
                  <p className="text-[10px] text-slate-600 mt-1">Creá permisos nuevos desde el botón superior</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5">
                  {permissions.map((perm) => {
                    const has = rolePerms.includes(perm.name)
                    return (
                      <button
                        key={perm.id}
                        onClick={() => onTogglePermission(role.id, perm.id, has)}
                        disabled={isPending}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-150 ${has ? 'bg-emerald-500 border-emerald-500' : 'border-white/10'}`}>
                          {has && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <span className="text-sm font-mono text-slate-300">{perm.name}</span>
                          {perm.description && (
                            <p className="text-[11px] text-slate-500 truncate">{perm.description}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AdminRolesPage() {
  const { data: roles, isLoading, isError, refetch } = useRoles()
  const { data: allPermissions } = usePermissions()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()
  const assignPermission = useAssignPermission()
  const revokePermission = useRevokePermission()
  const createPermission = useCreatePermission()

  const [search, setSearch] = useState('')
  const [editingRole, setEditingRole] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showCreatePermission, setShowCreatePermission] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const filteredRoles = useMemo(() => {
    if (!search || !roles) return roles || []
    const q = search.toLowerCase()
    return roles.filter((r) => r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
  }, [roles, search])

  const handleCreate = async (data) => {
    await createRole.mutateAsync(data)
    setShowCreate(false)
  }

  const handleUpdate = async (data) => {
    if (!editingRole) return
    await updateRole.mutateAsync({ id: editingRole.id, data })
    setEditingRole(null)
  }

  const handleDelete = async () => {
    if (deleteId !== null) {
      await deleteRole.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const toggleExpand = (roleId) => {
    setExpandedId(expandedId === roleId ? null : roleId)
  }

  const togglePermission = (roleId, permissionId, has) => {
    if (has) revokePermission.mutate({ roleId, permissionId })
    else assignPermission.mutate({ roleId, permissionId })
  }

  const handleCreatePermission = async (data) => {
    await createPermission.mutateAsync(data)
    setShowCreatePermission(false)
  }

  const isPending = assignPermission.isPending || revokePermission.isPending

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" description="Gestioná los roles y sus permisos">
        <SearchInput placeholder="Buscar roles..." value={search} onChange={(e) => setSearch(e.target.value)} containerClassName="w-full sm:w-56" />
        <div className="flex items-center gap-2">
          <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 flex-shrink-0 h-9 px-5 text-sm rounded-lg" onClick={() => setShowCreatePermission(true)}>
            <KeyRound className="w-3.5 h-3.5" /> Nuevo permiso
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 flex-shrink-0 h-9 px-5 text-sm rounded-lg" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Nuevo rol
          </Button>
        </div>
      </PageHeader>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white/5" />
                <div className="h-5 w-24 bg-white/5 rounded" />
                <div className="h-4 flex-1 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">
            {search ? 'Sin resultados' : 'No hay roles creados'}
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            {search ? `No se encontraron roles que coincidan con "${search}"` : 'Los roles definen los permisos de los usuarios en el sistema.'}
          </p>
          {!search && (
            <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 h-9 px-5 rounded-lg" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Crear primer rol
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              permissions={allPermissions}
              expanded={expandedId === role.id}
              onToggle={toggleExpand}
              onEdit={setEditingRole}
              onDelete={setDeleteId}
              onTogglePermission={togglePermission}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear rol</DialogTitle></DialogHeader>
          <EntityFormDialog type="role" mode="create" onClose={() => setShowCreate(false)} onSubmit={handleCreate} loading={createRole.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar rol</DialogTitle></DialogHeader>
          <EntityFormDialog type="role" mode="edit" initialData={editingRole} onClose={() => setEditingRole(null)} onSubmit={handleUpdate} loading={updateRole.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreatePermission} onOpenChange={setShowCreatePermission}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear permiso</DialogTitle></DialogHeader>
          <EntityFormDialog type="permission" mode="create" onClose={() => setShowCreatePermission(false)} onSubmit={handleCreatePermission} loading={createPermission.isPending} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar rol"
        description="¿Estás seguro? No se puede eliminar si hay usuarios asignados."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteRole.isPending}
      />
    </div>
  )
}
