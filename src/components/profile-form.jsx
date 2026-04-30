import { motion } from "framer-motion"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const containerAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export function ProfileForm({
  datosPerfil,
  datosPassword,
  manejarCambioPerfil,
  manejarCambioPassword,
  manejarActualizacionPerfil,
  manejarActualizacionPassword
}) {
  return (
    <motion.div 
      variants={containerAnim} 
      initial="hidden" 
      animate="show" 
      className="space-y-8 w-full text-slate-50"
    >
      
      {/* Encabezado del Perfil */}
      <motion.div variants={itemAnim} className="space-y-2 mb-8">
        <div className="etiqueta-seccion">
          <span className="etiqueta-seccion-texto">Área Personal</span>
        </div>
        <h2 className="titulo">Mi Perfil</h2>
        <p className="text-slate-400 text-lg">
          Gestioná tu información personal y la seguridad de tu cuenta.
        </p>
      </motion.div>

      {/* Información Personal */}
      <motion.div variants={itemAnim}>
        <div className="tarjeta">
          
          <div className="linea-brillante"></div>
          
          <div className="mb-6">
            <h3 className="titulo-tarjeta">Información Personal</h3>
            <p className="desc-tarjeta">Actualizá tu nombre público y correo de contacto.</p>
          </div>

          <form onSubmit={manejarActualizacionPerfil} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-2">
                <Label htmlFor="name" className="etiqueta">Nombre Completo</Label>
                <Input 
                  id="name" name="name" type="text" 
                  value={datosPerfil.name} onChange={manejarCambioPerfil} required 
                  className="campo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="etiqueta">Correo Electrónico</Label>
                <Input 
                  id="email" name="email" type="email" 
                  value={datosPerfil.email} onChange={manejarCambioPerfil} required 
                  className="campo"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="boton-primario">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Contraseña */}
      <motion.div variants={itemAnim}>
        <div className="tarjeta">
          
          <div className="linea-brillante"></div>
          
          <div className="mb-6">
            <h3 className="titulo-tarjeta">Seguridad</h3>
            <p className="desc-tarjeta">Protegé tu cuenta actualizando tu contraseña regularmente.</p>
          </div>

          <form onSubmit={manejarActualizacionPassword} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="etiqueta">Contraseña Actual</Label>
                <Input 
                  id="currentPassword" name="currentPassword" type="password" placeholder="••••••••"
                  value={datosPassword.currentPassword} onChange={manejarCambioPassword} required 
                  className="campo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="etiqueta">Nueva Contraseña</Label>
                <Input 
                  id="newPassword" name="newPassword" type="password" placeholder="••••••••"
                  value={datosPassword.newPassword} onChange={manejarCambioPassword} required 
                  className="campo"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" variant="outline" className="boton-secundario">
                Actualizar Contraseña
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

    </motion.div>
  );
}
