import { useState, useEffect } from 'react';
import { RolesTable } from "@/components/roles-table.jsx";
import { API_ENDPOINTS } from "@/config/api.js";

export default function Roles({ token }) {
  const [listaRoles, setListaRoles] = useState([]);
  const [listaPermisosDisponibles, setListaPermisosDisponibles] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rolEditando, setRolEditando] = useState(null);

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
    const permisosNombres = (rol.permissions || []).filter(p => typeof p === 'string');
    
    const permisosIds = permisosNombres.map(nombrePermiso => {
      const permisoEncontrado = listaPermisosDisponibles.find(p => p.name === nombrePermiso);
      return permisoEncontrado ? permisoEncontrado.id : null;
    }).filter(id => id !== null);
    
    setRolEditando({ ...rol, permissions: permisosIds, permisosOriginales: permisosIds });
    setModalAbierto(true);
  };

  const manejarCambioPermiso = (idPermiso, tildado) => {
    setRolEditando(prev => {
      const actuales = new Set(prev.permissions);
      if (tildado) actuales.add(Number(idPermiso));
      else actuales.delete(Number(idPermiso));
      return { ...prev, permissions: Array.from(actuales) };
    });
  };

  const manejarEliminar = async (idRol) => {
    if (!confirm('¿Seguro que querés eliminar este rol?')) return;
    
    try {
      const respuesta = await fetch(API_ENDPOINTS.ROLE_BY_ID(idRol), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (respuesta.ok) {
        alert('Rol eliminado correctamente');
        cargarDatos();
      } else {
        alert('Hubo un error al intentar eliminar el rol.');
      }
    } catch (error) {
      alert(`Error de conexión: ${error.message}`);
    }
  };

  const manejarGuardar = async () => {
    if (!rolEditando.name.trim()) return alert("Nombre obligatorio");
    const esEdicion = !!rolEditando.id;
    
    const payloadRol = { name: rolEditando.name, description: rolEditando.description };
    
    try {
      const urlRol = esEdicion ? API_ENDPOINTS.ROLE_BY_ID(rolEditando.id) : API_ENDPOINTS.ROLES;
      const res = await fetch(urlRol, {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payloadRol)
      });
      
      if (!res.ok) throw new Error("Error al guardar los datos básicos del rol.");
      
      const datosRol = await res.json();
      const rolId = datosRol.id;
      
      const permisosActuales = new Set(rolEditando.permissions || []);
      const permisosOriginales = new Set(rolEditando.permisosOriginales || []);
      
      for (const idPermiso of permisosOriginales) {
        if (!permisosActuales.has(idPermiso)) {
          const resDel = await fetch(API_ENDPOINTS.ROLE_PERMISSION(rolId, idPermiso), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!resDel.ok) console.error(`Error al quitar el permiso ${idPermiso}`);
        }
      }
      
      for (const idPermiso of permisosActuales) {
        if (!permisosOriginales.has(idPermiso)) {
          const resAdd = await fetch(API_ENDPOINTS.ROLE_PERMISSION(rolId, idPermiso), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!resAdd.ok) {
             throw new Error("El rol se guardó, pero falló la asignación de permisos. ¿Existe la ruta en el backend?");
          }
        }
      }
      
      setModalAbierto(false);
      cargarDatos();
      alert("¡Rol y permisos guardados con éxito!");
    } catch (e) { 
      alert(e.message); 
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 w-full text-slate-50">
      <RolesTable 
        key={rolEditando?.id || 'nuevo'} 
        listaRoles={listaRoles}
        listaPermisosDisponibles={listaPermisosDisponibles}
        modalAbierto={modalAbierto}
        setModalAbierto={setModalAbierto}
        rolEditando={rolEditando}
        manejarAperturaCrear={manejarAperturaCrear}
        manejarAperturaEditar={manejarAperturaEditar}
        manejarEliminar={manejarEliminar}
        manejarGuardar={manejarGuardar}
        manejarCambioNombre={(n) => setRolEditando({...rolEditando, name: n})}
        manejarCambioPermiso={manejarCambioPermiso}
      />
    </div>
  );
}