import { useState, useEffect } from 'react';

export default function Roles({ token }) {
  const [listaRoles, setListaRoles] = useState([]);
  const [listaPermisos, setListaPermisos] = useState([]);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  
  const [rolActual, setRolActual] = useState({ id: null, name: '', permissions: [] });
  // Guardamos cómo estaban los permisos antes de editar para saber cuáles agregar o sacar
  const [permisosOriginales, setPermisosOriginales] = useState([]);

  const cargarDatos = async () => {
    try {
      const resRoles = await fetch('/api/roles', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resRoles.ok) {
        const datos = await resRoles.json();
        setListaRoles(datos.content || datos || []);
      }

      const resPermisos = await fetch('/api/permissions', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resPermisos.ok) {
        const datosPermisos = await resPermisos.json();
        setListaPermisos(datosPermisos.content || datosPermisos || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  useEffect(() => { cargarDatos(); }, [token]);

  const abrirModalCrear = () => {
    setRolActual({ id: null, name: '', permissions: [] });
    setPermisosOriginales([]);
    setModoEdicion(false);
    setModalAbierto(true);
  };

  const abrirModalEditar = (rol) => {
    const idsPermisos = rol.permissions ? rol.permissions.map(p => p.id) : [];
    setRolActual({ id: rol.id, name: rol.name, permissions: idsPermisos });
    setPermisosOriginales(idsPermisos); 
    setModoEdicion(true);
    setModalAbierto(true);
  };

  const manejarCheckPermiso = (idPermiso) => {
    if (rolActual.permissions.includes(idPermiso)) {
      setRolActual({ ...rolActual, permissions: rolActual.permissions.filter(p => p !== idPermiso) });
    } else {
      setRolActual({ ...rolActual, permissions: [...rolActual.permissions, idPermiso] });
    }
  };

  const guardarRol = async (e) => {
    e.preventDefault();
    try {
      let roleId = rolActual.id;

      // Crear o Actualizar el Nombre del Rol
      if (!modoEdicion) {
        const resCrear = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: rolActual.name })
        });
        if (!resCrear.ok) throw new Error('Error al crear el rol base');
        const rolNuevo = await resCrear.json();
        roleId = rolNuevo.id;
      } else {
        const resEditar = await fetch(`/api/roles/${roleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: rolActual.name })
        });
        if (!resEditar.ok) throw new Error('Error al actualizar el nombre del rol');
      }

      // Gestionar los Permisos uno por uno
      const permisosParaAgregar = rolActual.permissions.filter(p => !permisosOriginales.includes(p));
      const permisosParaQuitar = permisosOriginales.filter(p => !rolActual.permissions.includes(p));

      // Peticiones para agregar (POST)
      for (const pId of permisosParaAgregar) {
        await fetch(`/api/roles/${roleId}/permissions/${pId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      // Peticiones para quitar (DELETE)
      for (const pId of permisosParaQuitar) {
        await fetch(`/api/roles/${roleId}/permissions/${pId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      alert(`¡Rol ${modoEdicion ? 'actualizado' : 'creado'} con éxito!`);
      setModalAbierto(false);
      cargarDatos(); 
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const eliminarRol = async (idRol) => {
    if (!confirm('¿Seguro que querés eliminar este rol?')) return;
    try {
      const respuesta = await fetch(`/api/roles/${idRol}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (respuesta.ok) {
        alert('Rol eliminado');
        cargarDatos();
      } else {
        alert('Error al eliminar. Capaz hay usuarios que todavía tienen este rol asignado.');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Gestión de Roles y Permisos</h3>
        <button onClick={abrirModalCrear} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow">
          + Crear Nuevo Rol
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-sm">
              <th className="p-3 border-b w-16">ID</th>
              <th className="p-3 border-b">Nombre del Rol</th>
              <th className="p-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaRoles.map(rol => (
              <tr key={rol.id} className="hover:bg-slate-50 border-b text-sm">
                <td className="p-3 text-slate-500">{rol.id}</td>
                <td className="p-3 font-bold text-slate-800">{rol.name}</td>
                <td className="p-3 flex gap-3">
                  <button onClick={() => abrirModalEditar(rol)} className="text-indigo-600 hover:text-indigo-800 font-semibold">Editar</button>
                  <button onClick={() => eliminarRol(rol.id)} className="text-red-500 hover:text-red-700 font-semibold">Eliminar</button>
                </td>
              </tr>
            ))}
            {listaRoles.length === 0 && (
              <tr><td colSpan="3" className="p-4 text-center text-slate-500">Cargando roles...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{modoEdicion ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
            
            <form onSubmit={guardarRol} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol (Ej: ROLE_AUDITOR)</label>
                <input type="text" required value={rolActual.name} onChange={(e) => setRolActual({...rolActual, name: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asignar Permisos</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-slate-300 rounded-lg p-3 bg-slate-50 shadow-inner">
                  {listaPermisos.length > 0 ? listaPermisos.map(permiso => (
                    <div 
                      key={permiso.id} 
                      className="relative flex items-start p-2 rounded-md hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="flex h-5 items-center">
                        <input 
                          id={`permiso-${permiso.id}`}
                          type="checkbox" 
                          checked={rolActual.permissions.includes(permiso.id)}
                          onChange={() => manejarCheckPermiso(permiso.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer shrink-0 m-0"
                        />
                      </div>
                      
                      <div className="ml-2 text-sm leading-5 flex-1">
                        <label 
                          htmlFor={`permiso-${permiso.id}`} 
                          className="font-medium text-slate-700 cursor-pointer select-none block w-full"
                        >
                          {permiso.name || permiso.description}
                        </label>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 italic col-span-full text-center py-4">No hay permisos cargados.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}