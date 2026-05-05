export function ProjectStatusBadge({ status }) {
  const estilos = {
    PREPARACION: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    FINANCIAMIENTO: "bg-green-500/20 text-green-300 border-green-500/30",
    EJECUCION: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    FINALIZADO: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  const etiquetas = {
    PREPARACION: "En Preparación",
    FINANCIAMIENTO: "En Financiamiento",
    EJECUCION: "En Ejecución",
    FINALIZADO: "Finalizado",
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${estilos[status] || estilos.PREPARACION}`}>
      {etiquetas[status] || status}
    </span>
  );
}
