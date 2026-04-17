import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function AdminTable({
  listaUsuarios,
  listaRoles,
  idUsuarioActual,
  manejarDeshabilitacion,
  abrirModalRoles,
  modalRolesAbierto,
  setModalRolesAbierto,
  usuarioSeleccionado,
  asignarRol,
  quitarRol,
  obtenerNombreRol,
  obtenerIdRolParaQuitar,
}) {
  
  const [rolSeleccionado, setRolSeleccionado] = useState("");

  return (
    <>
      <Card className="w-full shadow-lg border-slate-200">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl text-slate-800">Panel de Administración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 w-[80px] py-4">ID</TableHead>
                  <TableHead className="font-bold text-slate-700 py-4">Nombre</TableHead>
                  <TableHead className="font-bold text-slate-700 py-4">Email</TableHead>
                  <TableHead className="font-bold text-slate-700 py-4">Estado</TableHead>
                  <TableHead className="font-bold text-slate-700 py-4">Roles</TableHead>
                  <TableHead className="font-bold text-slate-700 py-4 pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                      No hay usuarios para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  listaUsuarios.map((usuario) => (
                    <TableRow key={usuario.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Le agregamos "py-4" a cada celda para que la tabla respire y sea más alta */}
                      <TableCell className="font-medium py-4 text-slate-600">{usuario.id}</TableCell>
                      <TableCell className="font-medium text-slate-900 py-4">{usuario.name}</TableCell>
                      <TableCell className="text-slate-500 py-4">{usuario.email}</TableCell>
                      
                      {/* ESTADO */}
                      <TableCell className="py-4">
                        <Badge variant="outline" className={usuario.enabled ? "bg-green-50 text-green-700 border-green-200 px-3 py-1 shadow-sm" : "bg-red-50 text-red-700 border-red-200 px-3 py-1 shadow-sm"}>
                          {usuario.enabled ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>

                      {/* ROLES */}
                      <TableCell className="py-4">
                        <div className="flex flex-wrap gap-2">
                          {usuario.roles && usuario.roles.length > 0 ? (
                            usuario.roles.map((rol, index) => (
                              <Badge key={index} className="bg-indigo-100/80 text-indigo-800 hover:bg-indigo-200 border-0 text-xs shadow-none">
                                {obtenerNombreRol(rol)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin rol</span>
                          )}
                        </div>
                      </TableCell>

                     <TableCell className="py-4">
                        <div className="flex justify-start gap-4 items-center">
                          <button 
                            onClick={() => abrirModalRoles(usuario)} 
                            className="text-indigo-600 hover:text-indigo-800 font-bold bg-transparent border-0 outline-none shadow-none cursor-pointer p-0 m-0 text-sm transition-colors"
                          >
                            Gestionar Roles
                          </button>
                          
                          {usuario.enabled && parseInt(idUsuarioActual) !== usuario.id && (
                            <button 
                              onClick={() => manejarDeshabilitacion(usuario.id)} 
                              className="text-red-500 hover:text-red-700 font-bold bg-transparent border-0 outline-none shadow-none cursor-pointer p-0 m-0 text-sm transition-colors"
                            >
                              Deshabilitar
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE ROLES (Se mantiene igual, solo limpié botones) */}
      <Dialog open={modalRolesAbierto} onOpenChange={setModalRolesAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Roles de {usuarioSeleccionado?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">Roles Actuales (Clic para quitar):</h4>
              <div className="flex flex-wrap gap-2">
                {usuarioSeleccionado?.roles && usuarioSeleccionado.roles.length > 0 ? (
                  usuarioSeleccionado.roles.map((rol, index) => (
                    <Badge 
                      key={index} 
                      variant="outline"
                      className="cursor-pointer bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors py-1.5 px-3"
                      onClick={() => quitarRol(obtenerIdRolParaQuitar(rol))}
                    >
                      {obtenerNombreRol(rol)} <span className="ml-2 font-bold text-red-500/70">✕</span>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">Este usuario no tiene roles asignados.</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-bold text-slate-700 mb-3">Asignar Nuevo Rol:</h4>
              <div className="flex gap-2">
                <Select value={rolSeleccionado} onValueChange={setRolSeleccionado}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccione un rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {listaRoles.map(rol => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>{rol.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button 
                  onClick={() => {
                    asignarRol(rolSeleccionado);
                    setRolSeleccionado(""); 
                  }} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-md border-0 outline-none transition-colors"
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}