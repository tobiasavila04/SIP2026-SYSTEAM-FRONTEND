import { useState, useEffect } from 'react';
import {ProfileForm} from "@/components/profile-form.jsx"
import { API_ENDPOINTS } from "@/config/api.js";

export default function Perfil({ token, idUsuario }) {
  const [datosPerfil, setDatosPerfil] = useState({ name: '', email: '' });
  const [datosPassword, setDatosPassword] = useState({ currentPassword: '', newPassword: '' });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatosUsuario = async () => {
      try {
        const respuesta = await fetch(API_ENDPOINTS.USER_ME, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (respuesta.ok) {
          const datos = await respuesta.json();
          setDatosPerfil({ name: datos.name, email: datos.email });
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatosUsuario();
  }, [token]);

  const manejarCambioPerfil = (e) => setDatosPerfil({ ...datosPerfil, [e.target.name]: e.target.value });
  const manejarCambioPassword = (e) => setDatosPassword({ ...datosPassword, [e.target.name]: e.target.value });
  
  const manejarActualizacionPerfil = async (e) => {
    e.preventDefault();
    try {
      const respuesta = await fetch(API_ENDPOINTS.USER_BY_ID(idUsuario), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datosPerfil)
      });
      if (respuesta.ok) alert('¡Datos actualizados con éxito!');
      else alert('Error al actualizar datos');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const manejarActualizacionPassword = async (e) => {
    e.preventDefault();
    try {
      const respuesta = await fetch(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(datosPassword) 
      });
      if (respuesta.ok) {
        alert('¡Contraseña actualizada con éxito!');
        setDatosPassword({ currentPassword: '', newPassword: '' }); 
      } else {
        alert('Error: La contraseña actual no coincide o es muy corta');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (cargando) return <div className="text-center py-8">Cargando datos...</div>;

  return (
    <div className="max-w-xl mx-auto py-8">
      <ProfileForm 
        cargando={cargando}
        datosPerfil={datosPerfil}
        datosPassword={datosPassword}
        manejarCambioPerfil={manejarCambioPerfil}
        manejarCambioPassword={manejarCambioPassword}
        manejarActualizacionPerfil={manejarActualizacionPerfil}
        manejarActualizacionPassword={manejarActualizacionPassword}
      />
    </div>
  );
}