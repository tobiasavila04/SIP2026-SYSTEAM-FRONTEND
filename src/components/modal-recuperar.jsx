import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ModalRecuperar({ abierto, setAbierto, email, setEmail, enviarRecuperacion, loading }) {
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogContent className="dialogo">
        <div className="space-y-1 mb-2">
          <DialogTitle className="dialogo-titulo">Recuperar Contraseña</DialogTitle>
          <p className="text-sm text-slate-400">
            Ingresá el correo asociado a tu cuenta y te enviaremos un enlace.
          </p>
        </div>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="etiqueta text-slate-400">Correo registrado</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="campo"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-2">
          <Button variant="ghost" onClick={() => setAbierto(false)} className="rounded-full px-5 text-slate-300 hover:text-white hover:bg-white/10">
            Cancelar
          </Button>
          <Button onClick={enviarRecuperacion} disabled={loading} className="boton-primario">
            {loading ? "Enviando..." : "Enviar enlace"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
