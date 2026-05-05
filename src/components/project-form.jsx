import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_ENDPOINTS, apiRequest } from "@/config/api.js";

export function ProjectForm({ proyectoInicial, onSuccess, onCancel, token }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    objective: "",
    requiredAmount: "",
  });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);

  const esEdicion = !!proyectoInicial?.id;

  useEffect(() => {
    if (proyectoInicial) {
      setFormData({
        title: proyectoInicial.title || "",
        description: proyectoInicial.description || "",
        objective: proyectoInicial.objective || "",
        requiredAmount: proyectoInicial.requiredAmount || "",
      });
    }
  }, [proyectoInicial]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrores(prev => ({ ...prev, [name]: "" }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!formData.title.trim()) nuevosErrores.title = "El título es obligatorio.";
    if (!formData.description.trim()) nuevosErrores.description = "La descripción es obligatoria.";
    if (!formData.objective.trim()) nuevosErrores.objective = "El objetivo es obligatorio.";
    
    const monto = parseFloat(formData.requiredAmount);
    if (!formData.requiredAmount) {
      nuevosErrores.requiredAmount = "El monto es obligatorio.";
    } else if (isNaN(monto)) {
      nuevosErrores.requiredAmount = "El monto debe ser un número válido.";
    } else if (monto <= 0) {
      nuevosErrores.requiredAmount = "El monto debe ser mayor a cero.";
    }
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setCargando(true);
    try {
      const payload = {
        ...formData,
        requiredAmount: parseFloat(formData.requiredAmount),
      };

      let respuesta;
      if (esEdicion) {
        respuesta = await apiRequest(API_ENDPOINTS.PROJECT_BY_ID(proyectoInicial.id), {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        respuesta = await apiRequest(API_ENDPOINTS.PROJECTS, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (respuesta) {
        onSuccess(respuesta);
      }
    } catch (error) {
      console.error(error);
      setErrores({ general: "Error al guardar el proyecto. Intentá nuevamente." });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="tarjeta max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">
        {esEdicion ? "Editar Proyecto" : "Publicar Nuevo Proyecto"}
      </h2>

      <form onSubmit={manejarSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label className="etiqueta">Título</Label>
          <Input name="title" value={formData.title} onChange={manejarCambio} className="campo" placeholder="Ej: App de gestión inteligente" />
          {errores.title && <p className="text-xs text-red-400">{errores.title}</p>}
        </div>

        <div className="space-y-2">
          <Label className="etiqueta">Descripción corta</Label>
          <Input name="description" value={formData.description} onChange={manejarCambio} className="campo" placeholder="Resumen del proyecto..." />
          {errores.description && <p className="text-xs text-red-400">{errores.description}</p>}
        </div>

        <div className="space-y-2">
          <Label className="etiqueta">Objetivo</Label>
          <Input name="objective" value={formData.objective} onChange={manejarCambio} className="campo" placeholder="¿Qué querés lograr con este proyecto?" />
          {errores.objective && <p className="text-xs text-red-400">{errores.objective}</p>}
        </div>

        <div className="space-y-2">
          <Label className="etiqueta">Monto requerido (USD)</Label>
          <Input name="requiredAmount" type="number" step="0.01" value={formData.requiredAmount} onChange={manejarCambio} className="campo" placeholder="10000" />
          {errores.requiredAmount && <p className="text-xs text-red-400">{errores.requiredAmount}</p>}
        </div>

        {errores.general && <p className="text-sm text-red-400 text-center bg-red-500/10 p-2 rounded">{errores.general}</p>}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={cargando} className="boton-primario flex-1">
            {cargando ? "Guardando..." : (esEdicion ? "Guardar cambios" : "Publicar proyecto")}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="boton-secundario">
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
