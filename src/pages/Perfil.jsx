import { useState, useEffect } from 'react';

export default function Perfil({ token, idUsuario }) {
  const [datosPerfil, setDatosPerfil] = useState({ name: '', email: '' });
  const [datosPassword, setDatosPassword] = useState({ currentPassword: '', newPassword: '' });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatosUsuario = async () => {
      try {
        const respuesta = await fetch('/api/users/me', {
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
      const respuesta = await fetch(`/api/users/me`, {
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
      const respuesta = await fetch('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
    <div className="max-w-md space-y-6">
      <div className="bg-white rounded-xl shadow p-8">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Actualizar Mis Datos</h3>
        <form onSubmit={manejarActualizacionPerfil} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" name="name" value={datosPerfil.name} onChange={manejarCambioPerfil} required className="w-full px-4 py-2 bg-slate-50 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={datosPerfil.email} onChange={manejarCambioPerfil} required className="w-full px-4 py-2 bg-slate-50 border rounded-lg" />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-lg">Guardar Datos Básicos</button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-8">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Cambiar Contraseña</h3>
        <form onSubmit={manejarActualizacionPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
            <input type="password" name="currentPassword" value={datosPassword.currentPassword} onChange={manejarCambioPassword} required className="w-full px-4 py-2 bg-slate-50 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input type="password" name="newPassword" value={datosPassword.newPassword} onChange={manejarCambioPassword} required className="w-full px-4 py-2 bg-slate-50 border rounded-lg" />
          </div>
          <button type="submit" className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg">Actualizar Contraseña</button>
        </form>
      </div>
    </div>
  );
}