import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  manejarTogglePermiso, 
}) {
  return (
    <>
      <Card className="w-full shadow-lg border-slate-200">
        {/* CABECERA CON TÍTULO Y BOTÓN DE CREAR */}
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <CardTitle className="text-2xl text-slate-800">Gestión de Roles y Permisos</CardTitle>
          <Button 
            onClick={manejarAperturaCrear}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            + Crear Nuevo Rol
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 w-[100px] py-4">ID</TableHead>
                  <TableHead className="font-bold text-slate-700 py-4">Nombre del Rol</TableHead>
                  <TableHead className="font-bold text-slate-700 py-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-slate-500">
                      No hay roles configurados.
                    </TableCell>
                  </TableRow>
                ) : (
                  listaRoles.map((rol) => (
                    <TableRow key={rol.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium py-4 text-slate-600">{rol.id}</TableCell>
                      <TableCell className="font-bold text-slate-900 py-4">{rol.name}</TableCell>
                      
                      {/* ACCIONES (Editar y Eliminar) */}
                      <TableCell className="py-4">
                        <div className="flex justify-start gap-4 items-center">
                          <button 
                            onClick={() => manejarAperturaEditar(rol)} 
                            className="text-indigo-600 hover:text-indigo-800 font-bold bg-transparent border-0 outline-none shadow-none cursor-pointer p-0 m-0 text-sm transition-colors"
                          >
                            Editar
                          </button>
                          
                          {/* Evitamos que borren el rol ADMIN principal si querés */}
                          {rol.name !== 'ADMIN' && (
                            <button 
                              onClick={() => manejarEliminar(rol.id)} 
                              className="text-red-500 hover:text-red-700 font-bold bg-transparent border-0 outline-none shadow-none cursor-pointer p-0 m-0 text-sm transition-colors"
                            >
                              Eliminar
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

      {/* MODAL PARA CREAR / EDITAR ROL */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{rolEditando?.id ? 'Editar Rol' : 'Crear Rol'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Label>Nombre del Rol</Label>
            <Input value={rolEditando?.name || ''} onChange={(e) => manejarCambioNombre(e.target.value)} />

            <Label>Permisos</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-slate-50">
              <div className="grid grid-cols-2 gap-4">
                {listaPermisosDisponibles.map((permiso) => (
                  <div key={permiso.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`p-${permiso.id}`}
                      // COMPARACIÓN SIMPLE: ¿El ID del permiso está en mi array de números?
                      checked={rolEditando?.permissions?.includes(Number(permiso.id))}
                      onCheckedChange={(tildado) => manejarTogglePermiso(permiso.id, tildado)}
                    />
                    <Label htmlFor={`p-${permiso.id}`} className="text-sm cursor-pointer">
                      {permiso.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={manejarGuardar}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}