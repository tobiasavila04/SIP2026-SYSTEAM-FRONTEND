import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, API_ENDPOINTS, clearTokens } from "@/config/api.js";

export default function CompleteProfile({ token, userId }) {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [formData, setFormData] = useState({ razonSocial: "", sitioWeb: "", sector: "" });

  useEffect(() => {
    apiRequest(API_ENDPOINTS.ROLES, { headers: { Authorization: `Bearer ${token}` } })
      .then(data => setRolesDisponibles(data.content || data || []));
  }, [token]);

  const manejarSeleccionRol = async (rolName) => {
    setCargando(true);
    setError(null);
    try {
      const rol = rolesDisponibles.find(r => r.name === rolName);
      if (!rol) throw new Error("Rol no encontrado en el sistema");

      if (rolName === "CREATOR") {
        setPaso(2);
        setCargando(false);
        return;
      }

      await asignarRol(rol.id);
    } catch (err) {
      setError("Error al configurar tu perfil. Intentá de nuevo.");
      setCargando(false);
    }
  };

  const manejarSubmitCreator = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const rol = rolesDisponibles.find(r => r.name === "CREATOR");
      if (!rol) throw new Error("Rol no encontrado");

      const datosExtra = { ...formData };
      if (datosExtra.razonSocial) {
        try {
          await apiRequest(API_ENDPOINTS.USER_BY_ID(userId), {
            method: "PUT",
            body: JSON.stringify({ name: datosExtra.razonSocial }),
          });
        } catch (e) {
          console.warn("No se pudo actualizar el nombre (falta migración en backend)", e);
        }
      }

      await asignarRol(rol.id);
    } catch (err) {
      setError("Error al guardar los datos. Intentá de nuevo.");
      setCargando(false);
    }
  };

  const asignarRol = async (rolId) => {
    const respuesta = await apiRequest(API_ENDPOINTS.USER_ROLE(userId, rolId), {
      method: "POST",
    });

    if (respuesta) {
      clearTokens();
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#030712]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Configurá tu perfil</h1>
          <p className="text-slate-400">Elegí cómo querés usar IDEAFY</p>
        </div>

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        {paso === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSeleccion
              titulo="Quiero Invertir"
              descripcion="Explorá proyectos y apoyá ideas innovadoras."
              icono="💰"
              onClick={() => manejarSeleccionRol("INVESTOR")}
              cargando={cargando}
            />
            <CardSeleccion
              titulo="Quiero Publicar"
              descripcion="Creá tu perfil de emprendedor y lanzá proyectos."
              icono="🚀"
              onClick={() => manejarSeleccionRol("CREATOR")}
              cargando={cargando}
            />
          </div>
        )}

        {paso === 2 && (
          <div className="tarjeta">
            <Button variant="ghost" onClick={() => setPaso(1)} className="mb-4 text-slate-400 hover:text-white">← Volver</Button>
            <h2 className="text-xl font-bold text-white mb-6">Datos de Emprendedor</h2>
            <form onSubmit={manejarSubmitCreator} className="space-y-5">
              <div className="space-y-2">
                <Label className="etiqueta">Nombre de la Empresa / Razón Social</Label>
                <Input value={formData.razonSocial} onChange={e => setFormData({...formData, razonSocial: e.target.value})} required className="campo" placeholder="Ej: Tech Solutions S.A." />
              </div>
              <div className="space-y-2">
                <Label className="etiqueta">Sector / Industria</Label>
                <Input value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} required className="campo" placeholder="Ej: Tecnología, Salud, Educación" />
              </div>
              <div className="space-y-2">
                <Label className="etiqueta">Sitio Web o LinkedIn</Label>
                <Input value={formData.sitioWeb} onChange={e => setFormData({...formData, sitioWeb: e.target.value})} className="campo" placeholder="https://..." />
              </div>
              <Button type="submit" disabled={cargando} className="boton-primario w-full">
                {cargando ? "Guardando..." : "Finalizar registro"}
              </Button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function CardSeleccion({ titulo, descripcion, icono, onClick, cargando }) {
  return (
    <button type="button" onClick={onClick} disabled={cargando} className="tarjeta text-left p-6 hover:border-blue-500/50 transition-colors cursor-pointer disabled:opacity-50">
      <div className="text-4xl mb-4">{icono}</div>
      <h3 className="text-xl font-bold text-white mb-2">{titulo}</h3>
      <p className="text-sm text-slate-400">{descripcion}</p>
    </button>
  );
}
