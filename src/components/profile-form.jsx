import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function ProfileForm({
  cargando,
  datosPerfil,
  datosPassword,
  manejarCambioPerfil,
  manejarCambioPassword,
  manejarActualizacionPerfil,
  manejarActualizacionPassword
}) {
  if (cargando) return <div className="text-center py-8 text-slate-500">Cargando datos...</div>;

  return (
    <div className="space-y-8 w-full">
      <Card className="shadow-lg border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-800">Actualizar Mis Datos</CardTitle>
          <CardDescription>Modificá tu información personal y de contacto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarActualizacionPerfil}>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="name" className="text-slate-700">Nombre</FieldLabel>
                <Input id="name" name="name" type="text" value={datosPerfil.name} onChange={manejarCambioPerfil} required className="h-11 bg-slate-50" />
              </Field>
              <Field>
                <FieldLabel htmlFor="email" className="text-slate-700">Email</FieldLabel>
                <Input id="email" name="email" type="email" value={datosPerfil.email} onChange={manejarCambioPerfil} required className="h-11 bg-slate-50" />
              </Field>
              <Field className="pt-2">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8">Guardar Datos</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-800">Cambiar Contraseña</CardTitle>
          <CardDescription>Asegurate de usar una contraseña segura.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarActualizacionPassword}>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="currentPassword" className="text-slate-700">Contraseña Actual</FieldLabel>
                <Input id="currentPassword" name="currentPassword" type="password" value={datosPassword.currentPassword} onChange={manejarCambioPassword} required className="h-11 bg-slate-50" />
              </Field>
              <Field>
                <FieldLabel htmlFor="newPassword" className="text-slate-700">Nueva Contraseña</FieldLabel>
                <Input id="newPassword" name="newPassword" type="password" value={datosPassword.newPassword} onChange={manejarCambioPassword} required className="h-11 bg-slate-50" />
              </Field>
              <Field className="pt-2">
                <Button type="submit" variant="destructive" className="font-bold h-11 px-8">Actualizar Contraseña</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}