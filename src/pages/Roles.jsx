import { useState, useEffect } from 'react';
import { RolesTable } from "@/components/roles-table.jsx"; 

export default function Roles({ token }) {
  const [listaRoles, setListaRoles] = useState([]);
  const [listaPermisosDisponibles, setListaPermisosDisponibles] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rolEditando, setRolEditando] = useState(null); // Empezamos en null

  const cargarDatos = async () => {
    try {
      const resRoles = await fetch('/api/roles', { headers: { 'Authorization': `Bearer ${token}` } });
      const datosRoles = await resRoles.json();
      setListaRoles(datosRoles.content || datosRoles || []);

      const resPermisos = await fetch('/api/permissions', { headers: { 'Authorization': `Bearer ${token}` } });
      const datosPermisos = await resPermisos.json();
      setListaPermisosDisponibles(datosPermisos.content || datosPermisos || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => { cargarDatos(); }, [token]);

  const manejarAperturaCrear = () => {
    setRolEditando({ name: '', description: '', permissions: [] });
    setModalAbierto(true);
  };

  const manejarAperturaEditar = (rol) => {
    const permisosIds = (rol.permissions || []).map(p => Number(typeof p === 'object' ? p.id : p));
    setRolEditando({ ...rol, permissions: permisosIds });
    setModalAbierto(true);
  };

  const manejarTogglePermiso = (idPermiso, tildado) => {
    setRolEditando(prev => {
      const actuales = new Set(prev.permissions);
      if (tildado) actuales.add(Number(idPermiso));
      else actuales.delete(Number(idPermiso));
      return { ...prev, permissions: Array.from(actuales) };
    });
  };

  const manejarGuardar = async () => {
    if (!rolEditando.name.trim()) return alert("Nombre obligatorio");
    const esEdicion = !!rolEditando.id;
    try {
      const res = await fetch(esEdicion ? `/api/roles/${rolEditando.id}` : '/api/roles', {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(rolEditando)
      });
      if (res.ok) {
        setModalAbierto(false);
        cargarDatos();
        alert("¡Éxito!");
      }
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 w-full">
      <RolesTable 
        key={rolEditando?.id || 'nuevo'} 
        listaRoles={listaRoles}
        listaPermisosDisponibles={listaPermisosDisponibles}
        modalAbierto={modalAbierto}
        setModalAbierto={setModalAbierto}
        rolEditando={rolEditando}
        manejarAperturaCrear={manejarAperturaCrear}
        manejarAperturaEditar={manejarAperturaEditar}
        manejarEliminar={(id) => {/* tu funcion eliminar */}}
        manejarGuardar={manejarGuardar}
        manejarCambioNombre={(n) => setRolEditando({...rolEditando, name: n})}
        manejarTogglePermiso={manejarTogglePermiso}
      />
    </div>
  );
}