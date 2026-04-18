import { useState, useEffect } from 'react';
import {AdminTable} from "@/components/admin-table.jsx"
import { API_ENDPOINTS } from "@/config/api.js";

export default function Administracion({ token, idUsuarioActual }) {
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaRoles, setListaRoles] = useState([]); // Guardamos los roles que existen en el sistema

  const [modalRolesAbierto, setModalRolesAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const obtenerUsuarios = async () => {
    try {
      const respuesta = await fetch(API_ENDPOINTS.USERS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setListaUsuarios(datos.content || datos || []); 
      }

      // Pedimos la lista de roles (para mostrarlos en el menú desplegable del Modal)
      const resRoles = await fetch(API_ENDPOINTS.ROLES, {
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
      const respuesta = await fetch(API_ENDPOINTS.USER_BY_ID(idUsuario), {
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
            
            await fetch(API_ENDPOINTS.USER_ROLE(usuarioSeleccionado.id, idRolAntiguo), {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
        } 

      const respuesta = await fetch(API_ENDPOINTS.USER_ROLE(usuarioSeleccionado.id, idRol), {
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
    if (typeof rol === 'string') return rol; 
    return rol.name || rol.authority || `Rol ID: ${rol.id}`; 
  };

  const obtenerIdRolParaQuitar = (rolTexto) => {
    // Si es un string (ej: "ADMIN")
    if (typeof rolTexto === 'string') {
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
    <div className="max-w-6xl mx-auto py-8 px-4 w-full">
      <AdminTable 
        listaUsuarios={listaUsuarios}
        listaRoles={listaRoles}
        idUsuarioActual={idUsuarioActual}
        manejarDeshabilitacion={manejarDeshabilitacion}
        abrirModalRoles={abrirModalRoles}
        modalRolesAbierto={modalRolesAbierto}
        setModalRolesAbierto={setModalRolesAbierto}
        usuarioSeleccionado={usuarioSeleccionado}
        asignarRol={asignarRol}
        quitarRol={quitarRol}
        obtenerNombreRol={obtenerNombreRol}
        obtenerIdRolParaQuitar={obtenerIdRolParaQuitar}
      />
    </div>
  );
}