import { useState, useEffect } from 'react';
import { RolesTable } from "@/components/roles-table.jsx";
import { API_ENDPOINTS } from "@/config/api.js";

export default function Roles({ token }) {
  const [listaRoles, setListaRoles] = useState([]);
  const [listaPermisosDisponibles, setListaPermisosDisponibles] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rolEditando, setRolEditando] = useState(null); // Empezamos en null

  const cargarDatos = async () => {
    try {
      const resRoles = await fetch(API_ENDPOINTS.ROLES, { headers: { 'Authorization': `Bearer ${token}` } });
      const datosRoles = await resRoles.json();
      setListaRoles(datosRoles.content || datosRoles || []);

      const resPermisos = await fetch(API_ENDPOINTS.PERMISSIONS, { headers: { 'Authorization': `Bearer ${token}` } });
      const datosPermisos = await resPermisos.json();
      setListaPermisosDisponibles(datosPermisos.content || datosPermisos || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => { cargarDatos(); }, [token]);

  const manejarAperturaCrear = () => {
    setRolEditando({ name: '', description: '', permissions: [], permisosOriginales: [] });
    setModalAbierto(true);
  };

  const manejarAperturaEditar = (rol) => {
    const permisosIds = (rol.permissions || []).map(p => Number(typeof p === 'object' ? p.id : p));
    setRolEditando({ ...rol, permissions: permisosIds, permisosOriginales: permisosIds });
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
    
    // Payload sin permissions (se gestionan por separado)
    const payloadRol = { name: rolEditando.name, description: rolEditando.description };
    
    let rolId;
    
    try {
      // 1. Crear o actualizar el rol (sin permisos en el body)
      const urlRol = esEdicion ? API_ENDPOINTS.ROLE_BY_ID(rolEditando.id) : API_ENDPOINTS.ROLES;
      const res = await fetch(urlRol, {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payloadRol)
      });
      
      if (!res.ok) {
        alert("Error al guardar el rol");
        return;
      }
      
      const datosRol = await res.json();
      rolId = datosRol.id;
      
      // 2. Si es edición, sincronizar permisos (desasignar los que ya no están, asignar los nuevos)
      if (esEdicion && rolEditando.permisosOriginales) {
        const permisosActuales = new Set(rolEditando.permissions || []);
        const permisosOriginales = new Set(rolEditando.permisosOriginales);
        
        // Desasignar los permisos que se quitaron
        for (const idPermiso of permisosOriginales) {
          if (!permisosActuales.has(idPermiso)) {
            await fetch(API_ENDPOINTS.ROLE_PERMISSION(rolId, idPermiso), {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
        }
        
        // Asignar los permisos nuevos
        for (const idPermiso of permisosActuales) {
          if (!permisosOriginales.has(idPermiso)) {
            await fetch(API_ENDPOINTS.ROLE_PERMISSION(rolId, idPermiso), {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
        }
      }
      
      setModalAbierto(false);
      cargarDatos();
      alert("¡Éxito!");
    } catch (e) { 
      alert(e.message); 
    }
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