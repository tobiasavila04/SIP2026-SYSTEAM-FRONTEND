import { useEffect, useState } from "react";
import { apiRequest, API_ENDPOINTS } from "@/config/api.js";
import { ProjectCard } from "@/components/project-card";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ProjectCatalog({ token }) {
  const [proyectos, setProyectos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [usuarioId, setUsuarioId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);

  const puedeCrearProyectos = roles.includes('CREATOR') || roles.includes('ADMIN');

  const cargarProyectos = async (page = 1) => {
    setCargando(true);
    try {
      const data = await apiRequest(API_ENDPOINTS.PROJECTS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProyectos(data.content || data || []);
      setTotalPaginas(data.totalPages || 1);
      setPagina(data.number ? data.number + 1 : 1);
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuario = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.USERS + "/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarioId(data?.id);
      setRoles(data?.roles || []);
    } catch (error) {
      console.error("Error cargando usuario:", error);
    }
  };

  useEffect(() => {
    cargarProyectos(pagina);
  }, [pagina, token]);

  useEffect(() => {
    cargarUsuario();
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Catálogo de Proyectos</h1>
        {puedeCrearProyectos && (
          <Link to="/proyectos/crear">
            <Button className="boton-primario">+ Nuevo Proyecto</Button>
          </Link>
        )}
      </div>

      {cargando ? (
        <div className="text-center text-slate-400 mt-20">Cargando proyectos...</div>
      ) : proyectos.length === 0 ? (
        <div className="tarjeta text-center text-slate-400 py-10">
          No hay proyectos disponibles todavía.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map(p => (
              <ProjectCard key={p.id} proyecto={p} esCreador={p.creatorId === usuarioId} />
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <Pagination page={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
          </div>
        </>
      )}
    </div>
  );
}
