import { useState, useEffect } from 'react';

export default function Administracion({ token, idUsuarioActual }) {
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaRoles, setListaRoles] = useState([]); // Guardamos los roles que existen en el sistema

  const [modalRolesAbierto, setModalRolesAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const obtenerUsuarios = async () => {
    try {
      const respuesta = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setListaUsuarios(datos.content || datos || []); 
      }

      // Pedimos la lista de roles (para mostrarlos en el menú desplegable del Modal)
      const resRoles = await fetch('/api/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resRoles.ok) {
        const datosR = await resRoles.json();
        setListaRoles(datosR.content || datosR || []);
      } 
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  useEffect(() => { obtenerUsuarios(); }, [token]);

  const manejarDeshabilitacion = async (idUsuario) => {
    if (idUsuario === parseInt(idUsuarioActual)) {
      alert('No puedes deshabilitar tu propia cuenta');
      return;
    }
    
    if(!confirm('¿Seguro que querés deshabilitar este usuario?')) return;
    
    try {
      const respuesta = await fetch(`/api/users/${idUsuario}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (respuesta.ok) {
        alert('Usuario deshabilitado correctamente');
        obtenerUsuarios(); // Refresca la tabla
      } else {
        alert('Hubo un error al intentar deshabilitar el usuario. Verifica la consola.');
      }
    } catch (error) {
      alert(`Error de conexión: ${error.message}`);
    }
  };

  // Abrimoa ventana para el usuario específico
  const abrirModalRoles = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalRolesAbierto(true);
  };

  // se asigna un rol al usuario 
  const asignarRol = async (idRol) => {
    if (!idRol) return; // Si no seleccionó nada en el menú desplegable, no hacemos nada
    
    try {
      if (usuarioSeleccionado.roles && usuarioSeleccionado.roles.length > 0) {
          for (const rolAntiguo of usuarioSeleccionado.roles) {
            const idRolAntiguo = obtenerIdRolParaQuitar(rolAntiguo);
            
            await fetch(`/api/users/${usuarioSeleccionado.id}/roles/${idRolAntiguo}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
        } 

      const respuesta = await fetch(`/api/users/${usuarioSeleccionado.id}/roles/${idRol}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (respuesta.ok) {
        alert('¡Rol asignado correctamente!');
        setModalRolesAbierto(false); 
      } else {
        alert('Error al asignar el rol. ¿Quizás ya lo tiene?');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // se quita un rol al usuario
  const quitarRol = async (idRol) => {
    if(!confirm('¿Seguro que querés quitarle este rol al usuario?')) return;

    try {
      const respuesta = await fetch(`/api/users/${usuarioSeleccionado.id}/roles/${idRol}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (respuesta.ok) {
        alert('¡Rol eliminado del usuario!');
        setModalRolesAbierto(false); 
      } else {
        alert('Error al quitar el rol.');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const obtenerNombreRol = (rol) => {
    if (typeof rol === 'string') return rol; // Si Ulises manda un texto ["ADMIN"]
    return rol.name || rol.authority || `Rol ID: ${rol.id}`; // Si manda un objeto
  };

  const obtenerIdRolParaQuitar = (rolTexto) => {
    // Si es un string (ej: "ADMIN")
    if (typeof rolTexto === 'string') {
      // Buscamos en la lista general de roles cuál es el que tiene este mismo nombre.
      // Le agregamos la validación "ROLE_" por si Spring Boot le pone ese prefijo oculto.
      const rolEncontrado = listaRoles.find(r => 
        r.name === rolTexto || 
        r.name === `ROLE_${rolTexto}` || 
        r.authority === rolTexto
      );
      
      // Si lo encuentra, devuelve su ID numérico (ej: 1). Si no, manda el texto para que el backend nos diga el error.
      return rolEncontrado ? rolEncontrado.id : rolTexto;
    }
    // Por si en el futuro Ulises cambia el backend y manda objetos
    return rolTexto.id;
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Panel de Administración</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-sm">
              <th className="p-3 border-b">ID</th>
              <th className="p-3 border-b">Nombre</th>
              <th className="p-3 border-b">Email</th>
              <th className="p-3 border-b">Estado</th>
              <th className="p-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaUsuarios.map(usuario => (
              <tr key={usuario.id} className="hover:bg-slate-50 border-b text-sm">
                <td className="p-3">{usuario.id}</td>
                <td className="p-3 font-medium text-slate-900">{usuario.name}</td>
                <td className="p-3 text-slate-500">{usuario.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${usuario.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {usuario.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {usuario.roles && usuario.roles.length > 0 ? (
                      usuario.roles.map((rol, index) => (
                        <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                          {obtenerNombreRol(rol)}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Sin rol</span>
                    )}
                  </div>
                </td>
                
                <td className="p-3 flex gap-3 items-center">
                  {/* Botón para gestionar los roles */}
                  <button onClick={() => abrirModalRoles(usuario)} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                    Gestionar Roles
                  </button>

                  {/*  botón de deshabilitar */}
                  {usuario.enabled && parseInt(idUsuarioActual) !== usuario.id && (
                    <button onClick={() => manejarDeshabilitacion(usuario.id)} className="text-red-500 hover:text-red-700 font-semibold">
                      Deshabilitar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    {/* MODAL PARA GESTIONAR ROLES  */}
      {modalRolesAbierto && usuarioSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-800">
              Roles de {usuarioSeleccionado.name}
            </h2>

            {/* roles que el usuario YA TIENE */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Roles Actuales (Clic para quitar):</label>
              <div className="flex flex-wrap gap-2">
                {usuarioSeleccionado.roles && usuarioSeleccionado.roles.length > 0 ? (
                  usuarioSeleccionado.roles.map((rol, index) => (
                    <button 
                      key={index} 
                      onClick={() => quitarRol(obtenerIdRolParaQuitar(rol))}
                      title="Clic para quitar rol"
                      className="px-3 py-1 bg-indigo-100 hover:bg-red-100 text-indigo-800 hover:text-red-700 text-sm font-bold rounded border border-indigo-200 hover:border-red-300 transition-colors"
                    >
                      {obtenerNombreRol(rol)} ✕
                    </button>
                  
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">Este usuario no tiene roles asignados.</p>
                )}
              </div>
            </div>

            {/* Agregar un rol NUEVO */}
            <div className="mb-6 border-t pt-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Asignar Nuevo Rol:</label>
              <div className="flex gap-2">
                {/* Usamos el ID  para saber qué rol eligió al hacer clic en Asignar */}
                <select id="selector-roles" className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none">
                  <option value="">Seleccione un rol...</option>
                  {listaRoles.map(rol => (
                    <option key={rol.id} value={rol.id}>{rol.name}</option>
                  ))}
                </select>
                <button 
                  onClick={() => asignarRol(document.getElementById('selector-roles').value)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Asignar
                </button>
              </div>
            </div>

            {/* Botón de cerrar */}
            <div className="flex justify-end mt-4">
              <button onClick={() => setModalRolesAbierto(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-colors">
                Cerrar Ventana
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}