import { useState, useEffect } from 'react';
import { AdminTable } from "@/components/admin-table.jsx"
import { Pagination } from "@/components/ui/pagination";
import { API_ENDPOINTS } from "@/config/api.js";

export default function Administracion({ token, idUsuarioActual }) {
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaRoles, setListaRoles] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modalRolesAbierto, setModalRolesAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  // Cargar usuarios (se ejecuta al cambiar página o token)
  const cargarUsuarios = async (page = 1) => {
    try {
      const respuesta = await fetch(`${API_ENDPOINTS.USERS}?page=${page - 1}&size=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setListaUsuarios(datos.content || datos || []);
        setTotalPaginas(datos.totalPages || 1);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  // Cargar roles (solo una vez al montar)
  useEffect(() => {
    const cargarRoles = async () => {
      try {
        const resRoles = await fetch(API_ENDPOINTS.ROLES, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resRoles.ok) {
          const datosR = await resRoles.json();
          setListaRoles(datosR.content || datosR || []);
        }
      } catch (error) {
        console.error('Error cargando roles:', error);
      }
    };
    cargarRoles();
  }, [token]);

  useEffect(() => { cargarUsuarios(pagina); }, [token, pagina]);

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
        cargarUsuarios(pagina);
      } else {
        alert('Hubo un error al intentar deshabilitar el usuario.');
      }
    } catch (error) {
      alert(`Error de conexión: ${error.message}`);
    }
  };

  const abrirModalRoles = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalRolesAbierto(true);
  };

  const asignarRol = async (idRol) => {
    if (!idRol) return;
    
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
        alert('Error al asignar el rol.');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const quitarRol = async (idRol) => {
    if(!confirm('¿Seguro que querés quitarle este rol al usuario?')) return;

    try {
      const respuesta = await fetch(API_ENDPOINTS.USER_ROLE(usuarioSeleccionado.id, idRol), {
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
    if (typeof rolTexto === 'string') {
      const rolEncontrado = listaRoles.find(r => 
        r.name === rolTexto || 
        r.name === `ROLE_${rolTexto}` || 
        r.authority === rolTexto
      );
      return rolEncontrado ? rolEncontrado.id : rolTexto;
    }
    return rolTexto.id;
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 w-full text-slate-50">
      <AdminTable 
        listaUsuarios={listaUsuarios}
        listaRoles={listaRoles}
        pagina={pagina}
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
      
      {/* Paginación */}
      <div className="mt-6 flex justify-center">
        <Pagination page={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
      </div>
    </div>
  );
}