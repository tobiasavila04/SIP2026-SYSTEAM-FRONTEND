import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "./project-status-badge";
import { Link } from "react-router-dom";

export function ProjectCard({ proyecto, esCreador }) {
  const formatoMoneda = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="tarjeta flex flex-col h-full group hover:border-blue-500/30 transition-colors">
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {proyecto.title}
          </h3>
          <ProjectStatusBadge status={proyecto.status} />
        </div>
        
        <p className="text-sm text-slate-400 line-clamp-2">{proyecto.description}</p>
        
        <div className="pt-2 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Objetivo</span>
            <span className="text-sm font-semibold text-blue-300">
              {formatoMoneda.format(proyecto.requiredAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
        <Link to={`/proyectos/${proyecto.id}`} className="flex-1">
          <Button variant="outline" className="boton-secundario w-full">Ver detalle</Button>
        </Link>
        {esCreador && proyecto.status === "PREPARACION" && (
          <Link to={`/proyectos/${proyecto.id}/editar`} className="flex-1">
            <Button variant="ghost" className="w-full text-slate-300 hover:text-white hover:bg-white/5">Editar</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
