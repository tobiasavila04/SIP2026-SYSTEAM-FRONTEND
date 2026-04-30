import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalRecuperar } from "./modal-recuperar"; 
import { API_BASE } from "@/config/api.js"; 

const animCampos = {
  hidden: { opacity: 0, y: -10, height: 0 },
  show: { opacity: 1, y: 0, height: "auto", transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { opacity: 0, y: -10, height: 0, transition: { duration: 0.2 } }
};

export function LoginForm({ esLogin, setEsLogin, manejarEnvio, manejarCambio, manejarRecuperarPassword }) {
  const [cargando, setCargando] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [emailRec, setEmailRec] = useState("");
  const [cargandoRec, setCargandoRec] = useState(false);

  const manejarSubmit = async (e) => {
    setCargando(true);
    await manejarEnvio(e);
    setCargando(false);
  };

  const manejarRecuperar = async () => {
    if (!emailRec) return alert("Ingresá un correo electrónico.");
    setCargandoRec(true);
    const ok = await manejarRecuperarPassword(emailRec);
    setCargandoRec(false);
    if (ok) {
      setModalAbierto(false);
      setEmailRec("");
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
        <div className="tarjeta">
          <div className="linea-brillante" />

          <div className="text-center mb-8">
            <h2 className="titulo-sm">
              {esLogin ? "Bienvenido de vuelta" : "Creá tu cuenta"}
            </h2>
            <p className="subtitulo">
              {esLogin ? "Ingresá tus credenciales para continuar" : "Unite a la revolución de la tokenización"}
            </p>
          </div>

          <form onSubmit={manejarSubmit} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {!esLogin && (
                <motion.div key="name" variants={animCampos} initial="hidden" animate="show" exit="exit" layout className="space-y-2">
                  <Label className="etiqueta">Nombre completo</Label>
                  <Input name="name" onChange={manejarCambio} required className="campo" placeholder="Ej: Juan Pérez" />
                </motion.div>
              )}
              
              <motion.div key="email" layout className="space-y-2">
                <Label className="etiqueta">Correo electrónico</Label>
                <Input name="email" type="email" onChange={manejarCambio} required className="campo" placeholder="correo@ejemplo.com" />
              </motion.div>

              <motion.div key="password" layout className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="etiqueta">Contraseña</Label>
                  {esLogin && (
                    <button type="button" onClick={() => setModalAbierto(true)} className="text-xs text-blue-400 hover:text-blue-300">
                      ¿Olvidaste tu clave?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input type={mostrarPass ? "text" : "password"} name="password" onChange={manejarCambio} required className="campo pr-16" placeholder="••••••••" />
                  <button type="button" onClick={() => setMostrarPass(!mostrarPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white">
                    {mostrarPass ? "OCULTAR" : "VER"}
                  </button>
                </div>
              </motion.div>

              <motion.div key="submit" layout className="pt-2">
                <Button disabled={cargando} className="boton-primario w-full">
                  {cargando ? "Procesando..." : (esLogin ? "Iniciar sesión" : "Crear cuenta")}
                </Button>
              </motion.div>
            </AnimatePresence>
          </form>

          <motion.div layout className="mt-6">
            <div className="separador">
              <div className="flex-grow border-t border-white/10" />
              <span className="separador-texto">O continuá con</span>
              <div className="flex-grow border-t border-white/10" />
            </div>
            <Button type="button" variant="outline" className="boton-secundario w-full" onClick={() => window.location.href = `${API_BASE}/oauth2/authorization/google`}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-3" alt="Google" />
              Google
            </Button>
          </motion.div>

          <motion.div layout className="text-center mt-8 text-sm text-slate-400">
            {esLogin ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
            <button type="button" onClick={() => setEsLogin(!esLogin)} className="text-blue-400 font-bold hover:underline">
              {esLogin ? "Registrate gratis" : "Iniciá sesión"}
            </button>
          </motion.div>
        </div>
      </motion.div>

      <ModalRecuperar 
        abierto={modalAbierto} 
        setAbierto={setModalAbierto} 
        email={emailRec} 
        setEmail={setEmailRec} 
        enviarRecuperacion={manejarRecuperar} 
        loading={cargandoRec} 
      />
    </>
  );
}
