import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  esLogin, 
  setEsLogin, 
  manejarEnvio, 
  manejarCambio,
  cardClassName,
  labelClassName,
  inputClassName,
  submitBtnClassName,
  ...props
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Recibe diseño para la tarjeta */}
      <Card className={cn("", cardClassName)}>
        <CardHeader>
          <CardTitle>Inicia sesión</CardTitle>
          <CardDescription>
            Ingresa tu email abajo para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarEnvio}>
            <FieldGroup>
              
              {!esLogin && (
                <Field>
                  <FieldLabel htmlFor="name" className={cn("", labelClassName)}>Nombre Completo</FieldLabel>
                  <Input id="name" name="name" type="text" onChange={manejarCambio} required className={cn("", inputClassName)} />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="email" className={cn("", labelClassName)}>Email</FieldLabel>
                <Input id="email" name="email" type="email" onChange={manejarCambio} required className={cn("", inputClassName)} />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className={cn("", labelClassName)}>Contraseña</FieldLabel>
                  {esLogin}
                </div>
                <Input id="password" name="password" type="password" onChange={manejarCambio} required className={cn("", inputClassName)} />
              </Field>

              <Field>
                <Button type="submit" className={cn("", submitBtnClassName)}>
                  {esLogin ? 'Iniciar sesión' : 'Registrarme'}
                </Button>
                <FieldDescription className="text-center mt-2">
                  {esLogin ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
                  <button type="button" onClick={() => setEsLogin(!esLogin)} className="underline underline-offset-4 font-bold">
                    {esLogin ? 'Regístrate' : 'Inicia sesión'}
                  </button>
                </FieldDescription>
              </Field>
              
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}