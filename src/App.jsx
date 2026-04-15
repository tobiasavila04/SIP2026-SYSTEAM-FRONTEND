import { useState, useEffect } from 'react';

// Función helper para verificar disponibilidad del servidor
const verificarServidorDisponible = async () => {
  try {
    const respuesta = await fetch('/api/users', { method: 'HEAD' });
    return respuesta.ok || respuesta.status === 401; // 401 significa que el servidor existe pero necesita auth
  } catch {
    return false;
  }
};

// COMPONENTE 1: PANTALLA DE LOGIN Y REGISTRO (001.001 y 001.002)
function PantallaAutenticacion({ alIniciarSesion }) {
  const [esLogin, setEsLogin] = useState(true);
  const [DatosFormulario, setDatosFormulario] = useState({ name: '', email: '', password: '' });

  //Actualiza el estado letra por letra mientras el usuario escribe.
  const manejarCambio = (e) => {
    setDatosFormulario({ ...DatosFormulario, [e.target.name]: e.target.value });
  };

  // Se ejecuta al hacer clic en "Entrar" o "Registrarme".
  const manejarEnvio = async (e) => {
    e.preventDefault();

    const urlPeticion = esLogin ? '/auth/login' : '/auth/register';
    const payload = esLogin ? { email: DatosFormulario.email, password: DatosFormulario.password } : DatosFormulario;
    
    try {
      console.log('Enviando petición a:', urlPeticion);
      console.log('Payload:', JSON.stringify(payload));
      
      // Verificar que el servidor está disponible
      const servidorDisponible = await verificarServidorDisponible();
      if (!servidorDisponible) {
        alert(`❌ Servidor no disponible en http://localhost:8080\n\n¿El servidor Java está corriendo?\n\nEjecuta en otra terminal:\njava -jar tu-app.jar`);
        return;
      }
      
      const respuesta = await fetch(urlPeticion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Respuesta status:', respuesta.status);
      console.log('Respuesta ok:', respuesta.ok);

      if (respuesta.ok) {
        if (esLogin) {
          const datos = await respuesta.json();
          console.log('Datos recibidos:', datos);
          alIniciarSesion(datos.accessToken, datos.userId);
          alert('¡Sesión iniciada correctamente!');
        } else {
          alert('¡Usuario registrado con éxito! Ahora iniciá sesión.');
          setEsLogin(true);
          setDatosFormulario({ name: '', email: '', password: '' });
        }
      } else {
        const respuestaTexto = await respuesta.text();
        console.error('Respuesta de error:', respuestaTexto);
        
        let mensajeError = 'Error desconocido';
        try {
          const errorData = JSON.parse(respuestaTexto);
          mensajeError = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch {
          mensajeError = respuestaTexto || `Error ${respuesta.status}`;
        }
        
        alert(`Error ${respuesta.status}: ${mensajeError}\n\nAbre DevTools (F12) → Console para más detalles`);
      }
    } catch (error) {
      console.error('Error completo:', error);
      alert(`❌ Error de conexión: ${error.message}\n\nVerifica que el servidor Java está corriendo en http://localhost:8080`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1121] flex flex-col font-sans">
      
      <div className="grow flex items-center justify-center p-6 md:p-12">
        
        <div className="max-w-lg w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-12 transition-all">
          
          <h2 className="text-3xl font-extrabold text-white text-center mb-10 tracking-tight">
            {esLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          
          <form onSubmit={manejarEnvio} className="space-y-6">
            
            {!esLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre Completo</label>
                <input type="text" name="name" onChange={manejarCambio} required placeholder="Ej: Juan Perez"
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Correo Electrónico</label>
              <input type="email" name="email" onChange={manejarCambio} required placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400" />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
              <input type="password" name="password" onChange={manejarCambio} required placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400" />
            </div>

            <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800">
              {esLogin ? 'Entrar a IDEAFY' : 'Registrarme'}
            </button>
          
          </form>

          <div className="mt-10 text-center">
            <button onClick={() => setEsLogin(!esLogin)} className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
              {esLogin ? '¿No tenés cuenta? Registrate acá' : '¿Ya tenés cuenta? Iniciá sesión'}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

// COMPONENTE 3: PERFIL DE USUARIO (001.003)
// Recibe el token y el idUsuario desde el componente App principal
function VistaPerfilUsuario({ token, idUsuario }) {
  const [datosPerfil, setDatosPerfil] = useState({ name: '', email: '' });
  const [datosPassword, setDatosPassword] = useState({ currentPassword: '', newPassword: '' });
  const [cargando, setCargando] = useState(true);

  // Cargar datos del usuario autenticado al montar el componente
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
        console.error('Error cargando datos del usuario:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatosUsuario();
  }, [token]);

  // MANEJADORES DE CAMBIOS (Inputs) 
  const manejarCambioPerfil = (evento) => setDatosPerfil({ ...datosPerfil, [evento.target.name]: evento.target.value });
  const manejarCambioPassword = (evento) => setDatosPassword({ ...datosPassword, [evento.target.name]: evento.target.value });
  
  // Enviar actualización de Nombre/Email (PUT)
  const manejarActualizacionPerfil = async (evento) => {
    evento.preventDefault();
    try {
      const respuesta = await fetch(`/api/users/me`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(datosPerfil)
      });

      if (respuesta.ok) {
        alert('¡Datos actualizados con éxito!');
      } else {
        const errorData = await respuesta.json().catch(() => ({}));
        alert(`Error: ${errorData.message || 'No se pudieron actualizar los datos'}`);
      }
    } catch (error) {
      alert(`Error de conexión: ${error.message}`);
    }
  };

  // Enviar cambio de contraseña (POST)
  const manejarActualizacionPassword = async (evento) => {
    evento.preventDefault();
    try {
      const respuesta = await fetch('/auth/change-password', {
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
        const errorData = await respuesta.json().catch(() => ({}));
        alert(`Error: ${errorData.message || 'La contraseña actual no coincide o es muy corta (mín. 8 caracteres)'}`);
      }
    } catch (error) {
      alert(`Error de conexión: ${error.message}`);
    }
  };

  if (cargando) {
    return <div className="text-center py-8">Cargando datos del perfil...</div>;
  }

  // --- RENDERIZADO VISUAL ---
  return (
    <div className="max-w-md space-y-6">
      
      {/* DATOS BÁSICOS */}
      <div className="bg-white rounded-xl shadow p-8">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Actualizar Mis Datos</h3>
        <form onSubmit={manejarActualizacionPerfil} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" name="name" value={datosPerfil.name} onChange={manejarCambioPerfil} required placeholder="Nuevo nombre"
              className="w-full px-4 py-2 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={datosPerfil.email} onChange={manejarCambioPerfil} required placeholder="nuevo@email.com"
              className="w-full px-4 py-2 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-lg transition-colors">
            Guardar Datos Básicos
          </button>
        </form>
      </div>

      {/*CAMBIAR CONTRASEÑA */}
      <div className="bg-white rounded-xl shadow p-8">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Cambiar Contraseña</h3>
        <form onSubmit={manejarActualizacionPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
            <input type="password" name="currentPassword" value={datosPassword.currentPassword} onChange={manejarCambioPassword} required placeholder="••••••••"
              className="w-full px-4 py-2 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (mín. 8 caracteres)</label>
            <input type="password" name="newPassword" value={datosPassword.newPassword} onChange={manejarCambioPassword} required placeholder="••••••••"
              className="w-full px-4 py-2 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors">
            Actualizar Contraseña
          </button>
        </form>
      </div>

    </div>
  );
}

// COMPONENTE 2: ADMINISTRACIÓN DE USUARIOS (001.004)
function VistaAdministradorUsuario({ token, idUsuarioActual }) {
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [tienePermiso, setTienePermiso] = useState(true);

  // Traer usuarios usando el endpoint GET /api/users
  const obtenerUsuarios = async () => {
    try {
      const respuesta = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setListaUsuarios(datos.content || []); 
        setTienePermiso(true);
      } else if (respuesta.status === 403) {
        setTienePermiso(false);
        console.warn('No tienes permisos para ver usuarios');
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  // Se ejecuta automáticamente al entrar a la pestaña de Administrador
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
      
      console.log('Status:', respuesta.status);
      const respuestaTexto = await respuesta.text();
      console.log('Respuesta:', respuestaTexto);
      
      if (respuesta.ok) {
        alert('Usuario deshabilitado correctamente');
        obtenerUsuarios(); // Recargamos la tabla
      } else if (respuesta.status === 403) {
        alert('❌ Acceso denegado: No tienes permisos para deshabilitar usuarios.\n\nDebes ser administrador.');
        setTienePermiso(false);
      } else {
        let mensajeError = 'Intenta nuevamente';
        try {
          const errorData = JSON.parse(respuestaTexto);
          mensajeError = errorData.message || JSON.stringify(errorData);
        } catch {
          mensajeError = respuestaTexto || `Error ${respuesta.status}`;
        }
        alert(`Error ${respuesta.status}: ${mensajeError}\n\nAbre DevTools (F12) → Console para más detalles`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error de conexión: ${error.message}`);
    }
  };

  if (!tienePermiso) {
    return (
      <div className="bg-red-50 rounded-xl shadow p-6 border border-red-200">
        <h3 className="text-xl font-bold text-red-700 mb-2">Acceso Denegado</h3>
        <p className="text-red-600">No tienes permisos para acceder al panel de administración. Debes ser administrador para gestionar usuarios.</p>
      </div>
    );
  }

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
    </div>
  );
}

// COMPONENTE PRINCIPAL: APP (Controla todo)
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('tokenIDEAFY') || null);
  const [userId, setUserId] = useState(localStorage.getItem('userIdIDEAFY') || null);
  const [vistaActual, setVistaActual] = useState('admin');

  const manejarInicioSesion = (nuevoToken, id) => {
    localStorage.setItem('tokenIDEAFY', nuevoToken);
    localStorage.setItem('userIdIDEAFY', id); 
    setToken(nuevoToken);
    setUserId(id); 
  };

  const manejarCierreSesion = () => {
    localStorage.removeItem('tokenIDEAFY');
    localStorage.removeItem('userIdIDEAFY');
    setToken(null);
    setUserId(null); 
  };

  // Si no hay token, mostramos la pantalla de Login/Registro
  if (!token) {
    return <PantallaAutenticacion alIniciarSesion={manejarInicioSesion} />;
  }

  // Si hay token, mostramos Barra superior + Contenido
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      <nav className="bg-[#0b1121] px-10 py-6 flex items-center justify-between border-b border-slate-800 shadow-md">
        
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 bg-linear-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xs">ID</span>
          </div>
          <span className="text-white font-bold text-xl tracking-widest">IDEAFY</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <a href="#" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Producto</a>
          <a href="#" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Características</a>
          <a href="#" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Mercado</a>
          <a href="#" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Compañía</a>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setVistaActual('perfil')} className={`text-sm font-semibold transition-colors ${vistaActual === 'perfil' ? 'text-indigo-400' : 'text-slate-300 hover:text-white'}`}>
            Mi Perfil
          </button>
          
          <button onClick={() => setVistaActual('admin')} className={`text-sm font-semibold transition-colors ${vistaActual === 'admin' ? 'text-indigo-400' : 'text-slate-300 hover:text-white'}`}>
            Administración
          </button>
          
          <button onClick={manejarCierreSesion} className="text-sm font-semibold text-white flex items-center gap-2 hover:text-red-400 transition-colors ml-4">
            Cerrar sesión <span className="text-lg">&rarr;</span>
          </button>
        </div>
        
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-extrabold mb-6">
          {vistaActual === 'admin' ? 'Gestión de Usuarios' : 'Mi Perfil'}
        </h1>
        
        {vistaActual === 'admin' && <VistaAdministradorUsuario token={token} idUsuarioActual={userId} />}
        {vistaActual === 'perfil' && <VistaPerfilUsuario token={token} idUsuario={userId} />}
        
      </main>
    </div>
  );
}