import { Button } from "@/components/ui/button";

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showPages = 5;
  let start = Math.max(1, page - Math.floor(showPages / 2));
  let end = Math.min(totalPages, start + showPages - 1);
  
  if (end - start < showPages - 1) {
    start = Math.max(1, end - showPages + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="border-white/10 hover:bg-white/10 hover:text-white"
        style={{ color: "#94a3b8" }}
      >
        Anterior
      </Button>
      
      {start > 1 && (
        <>
          <Button variant="outline" size="sm" onClick={() => onPageChange(1)} className="border-white/10 hover:bg-white/10 hover:text-white" style={{ color: "#94a3b8" }}>1</Button>
          {start > 2 && <span className="px-2 text-slate-500">...</span>}
        </>
      )}

      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(p)}
          className={p === page 
            ? "bg-blue-600 text-white hover:bg-blue-500 border-blue-600"
            : "border-white/10 hover:bg-white/10 hover:text-white"}
          style={p === page ? {} : { color: "#94a3b8" }}
        >
          {p}
        </Button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-slate-500">...</span>}
          <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)} className="border-white/10 hover:bg-white/10 hover:text-white" style={{ color: "#94a3b8" }}>{totalPages}</Button>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="border-white/10 hover:bg-white/10 hover:text-white"
        style={{ color: "#94a3b8" }}
      >
        Siguiente
      </Button>
    </div>
  );
}
