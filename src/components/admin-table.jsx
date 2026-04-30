import { CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AdminTable({
  listaUsuarios,
  listaRoles,
  pagina = 1,
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
      <div className="space-y-6">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="etiqueta-seccion">
              <span className="etiqueta-seccion-texto">Área Administrativa</span>
            </div>
            <h2 className="titulo">Panel de Usuarios</h2>
            <p className="subtitulo">
              Gestioná los usuarios del sistema, sus estados y jerarquías de roles.
            </p>
          </div>
          <Badge className="text-xs bg-white/5 text-slate-300 border-white/10 px-3 py-1">
            {listaUsuarios.length} usuarios · Página {pagina}
          </Badge>
        </div>

        {/* Tarjeta de la Tabla */}
        <div className="tarjeta p-0">
          
          <div className="linea-brillante"></div>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-transparent">
                  <TableHead className="w-[80px] texto-encabezado">ID</TableHead>
                  <TableHead className="texto-encabezado">Nombre</TableHead>
                  <TableHead className="texto-encabezado">Email</TableHead>
                  <TableHead className="texto-encabezado">Estado</TableHead>
                  <TableHead className="texto-encabezado">Roles</TableHead>
                  <TableHead className="text-right texto-encabezado pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaUsuarios.length === 0 ? (
                  <TableRow className="border-b border-white/5">
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No hay usuarios para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  listaUsuarios.map((usuario) => (
                    <TableRow key={usuario.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <TableCell className="font-medium text-slate-300 py-4">{usuario.id}</TableCell>
                      <TableCell className="font-semibold text-white py-4">{usuario.name}</TableCell>
                      <TableCell className="text-slate-400 py-4">{usuario.email}</TableCell>
                      
                      <TableCell className="py-4">
                        <Badge variant="outline" className={cn(
                          usuario.enabled ? "estado-activo" : "estado-inactivo"
                        )}>
                          {usuario.enabled ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {usuario.roles && usuario.roles.length > 0 ? (
                            usuario.roles.map((rol, index) => (
                              <Badge key={index} variant="outline" className="badge-rol px-2.5 py-0.5">
                                {obtenerNombreRol(rol)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-slate-600 italic">Sin rol</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right py-4 pr-6">
                        <div className="flex justify-end gap-3 opacity-100 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                          
                          {/* Botón Roles*/}
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalRoles(usuario)} 
                            className="boton-accion"
                          >
                            Roles
                          </Button>
                          
                          {/* Botón Desactivar */}
                          {usuario.enabled && parseInt(idUsuarioActual) !== usuario.id ? (
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => manejarDeshabilitacion(usuario.id)} 
                              className="boton-peligro w-[100px]"
                            >
                              Desactivar
                            </Button>
                          ) : (
                            <div className="w-[100px]"></div>
                          )}
                          
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </div>
      </div>

      {/* MODAL DE ROLES */}
      <Dialog open={modalRolesAbierto} onOpenChange={setModalRolesAbierto}>
        <DialogContent className="dialogo">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Gestionar Roles</DialogTitle>
            <p className="text-sm text-slate-400">
              Editando permisos para <span className="text-blue-400 font-semibold">{usuarioSeleccionado?.name}</span>
            </p>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h4 className="etiqueta text-slate-400">Roles Actuales</h4>
              <div className="flex flex-wrap gap-2 bg-black/20 p-4 rounded-xl border border-white/5">
                {usuarioSeleccionado?.roles && usuarioSeleccionado.roles.length > 0 ? (
                  usuarioSeleccionado.roles.map((rol, index) => (
                    <Badge 
                      key={index} 
                      variant="outline"
                      className="badge-rol cursor-pointer hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-colors px-3 py-1"
                      onClick={() => quitarRol(obtenerIdRolParaQuitar(rol))}
                      title="Click para quitar rol"
                    >
                      {obtenerNombreRol(rol)} <span className="ml-2 text-rose-400/50">×</span>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">Este usuario no tiene roles asignados.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="etiqueta text-slate-400">Asignar Nuevo Rol</h4>
              <div className="flex gap-2">
                <Select value={rolSeleccionado} onValueChange={setRolSeleccionado}>
                  <SelectTrigger className="flex-1 bg-black/20 border-white/10 text-white focus:ring-blue-500 h-11">
                    <SelectValue placeholder="Seleccionar rol..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                    {listaRoles.map(rol => (
                      <SelectItem key={rol.id} value={rol.id.toString()} className="hover:bg-blue-600/20 focus:bg-blue-600/20">
                        {rol.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => {
                    asignarRol(rolSeleccionado);
                    setRolSeleccionado(""); 
                  }}
                  disabled={!rolSeleccionado}
                  className="boton-primario"
                >
                  Asignar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
