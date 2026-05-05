import { useNavigate, useParams } from "react-router-dom";
import { ProjectForm } from "@/components/project-form";
import { apiRequest, API_ENDPOINTS } from "@/config/api.js";
import { useEffect, useState } from "react";

export default function EditProject({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiRequest(API_ENDPOINTS.PROJECT_BY_ID(id), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(data => {
        if (data.status !== "PREPARACION") {
          setError("Solo se pueden editar proyectos en estado de preparación.");
        } else {
          setProyecto(data);
        }
      })
      .catch(() => setError("No se pudo cargar el proyecto."))
      .finally(() => setCargando(false));
  }, [id, token]);

  const manejarExito = () => {
    navigate(`/proyectos/${id}`);
  };

  if (cargando) return <div className="text-center text-slate-400 mt-20">Cargando...</div>;
  if (error) return <div className="tarjeta max-w-2xl mx-auto text-center text-red-400">{error}</div>;
  if (!proyecto) return <div className="tarjeta max-w-2xl mx-auto text-center text-red-400">Proyecto no encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ProjectForm 
        proyectoInicial={proyecto} 
        token={token} 
        onSuccess={manejarExito} 
        onCancel={() => navigate(`/proyectos/${id}`)} 
      />
    </div>
  );
}
