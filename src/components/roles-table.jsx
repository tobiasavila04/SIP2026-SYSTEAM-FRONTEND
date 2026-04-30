import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function RolesTable({
  listaRoles,
  listaPermisosDisponibles, 
  modalAbierto,
  setModalAbierto,
  rolEditando, 
  manejarAperturaCrear,
  manejarAperturaEditar,
  manejarEliminar,
  manejarGuardar,
  manejarCambioNombre,
  manejarCambioPermiso, 
}) {
  const esEdicion = !!rolEditando?.id;

  return (
    <>
      <div className="space-y-6">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="etiqueta-seccion">
              <span className="etiqueta-seccion-texto">Control de Acceso</span>
            </div>
            <h2 className="titulo">Roles y Permisos</h2>
            <p className="subtitulo">
              Administrá los niveles de acceso del sistema y sus permisos asociados.
            </p>
          </div>
          
          <Button 
            onClick={manejarAperturaCrear}
            className="boton-primario"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nuevo Rol
          </Button>
        </div>

        {/* Tarjeta de la Tabla */}
        <div className="tarjeta">
          
          <div className="linea-brillante"></div>

          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="w-[80px] text-slate-400 font-semibold py-5 pl-6">ID</TableHead>
                  <TableHead className="text-slate-400 font-semibold py-5">Nombre del Rol</TableHead>
                  <TableHead className="w-[200px] text-right text-slate-400 font-semibold py-5 pr-8">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaRoles.length === 0 ? (
                  <TableRow className="border-b border-white/5">
                    <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                      No hay roles configurados.
                    </TableCell>
                  </TableRow>
                ) : (
                  listaRoles.map((rol) => (
                    <TableRow key={rol.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                      <TableCell className="font-medium text-slate-300 py-4 pl-6">{rol.id}</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="badge-rol px-3 py-1">
                          {rol.name}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right py-4 pr-8">
                        <div className="flex justify-end gap-3 opacity-100 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                          
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => manejarAperturaEditar(rol)} 
                            className="boton-accion"
                          >
                            Editar
                          </Button>
                          
                          {rol.name !== 'ADMIN' ? (
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => manejarEliminar(rol.id)} 
                              className="boton-peligro w-[90px]"
                            >
                              Eliminar
                            </Button>
                          ) : (
                            <div className="w-[90px]"></div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="dialogo">
          <div className="space-y-1 mb-2">
            <DialogTitle className="dialogo-titulo">
              {esEdicion ? 'Editar Configuración' : 'Crear Nuevo Rol'}
            </DialogTitle>
            <p className="text-sm text-slate-400">
              {esEdicion ? 'Modificá los permisos de este grupo.' : 'Definí un nuevo nivel jerárquico.'}
            </p>
          </div>
          
          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="role-name" className="etiqueta text-slate-400">Nombre del Rol</Label>
              <Input 
                id="role-name"
                value={rolEditando?.name || ''} 
                onChange={(e) => manejarCambioNombre(e.target.value)} 
                placeholder="Ej: MODERATOR"
                className="campo"
              />
            </div>

            <div className="space-y-2">
              <Label className="etiqueta text-slate-400">Permisos Asociados</Label>
              
              <div className="permiso-lista scrollbar-propio">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {listaPermisosDisponibles.map((permiso) => (
                    <div key={permiso.id} className="permiso-item">
                      <Checkbox 
                        id={`p-${permiso.id}`}
                        checked={rolEditando?.permissions?.includes(Number(permiso.id))}
                        onCheckedChange={(tildado) => manejarCambioPermiso(permiso.id, tildado)}
                        className="border-slate-500 h-5 w-5 rounded-[4px] data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <Label htmlFor={`p-${permiso.id}`} className="text-sm cursor-pointer font-medium text-slate-300 select-none">
                        {permiso.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-2">
            <Button 
              variant="ghost" 
              onClick={() => setModalAbierto(false)}
              className="rounded-full px-5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarGuardar}
              className="boton-primario"
            >
              {esEdicion ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
