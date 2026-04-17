import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';

import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Administracion from './pages/Administracion';
import Roles from './pages/Roles';

const decodificarToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem('tokenIDEAFY') || null);
  const [userId, setUserId] = useState(sessionStorage.getItem('userIdIDEAFY') || null);

  // Verificamos si es ADMIN
  let esAdmin = false;
  if (token) {
    const payload = decodificarToken(token);
    if (payload && payload.roles) esAdmin = payload.roles.includes('ADMIN') || payload.roles.includes('ROLE_ADMIN');
    else if (payload && payload.role) esAdmin = payload.role === 'ADMIN' || payload.role === 'ROLE_ADMIN';
    else if (payload && payload.authorities) esAdmin = payload.authorities.includes('ADMIN') || payload.authorities.includes('ROLE_ADMIN');
  }

  const manejarInicioSesion = (nuevoToken, id) => {
    sessionStorage.setItem('tokenIDEAFY', nuevoToken);
    sessionStorage.setItem('userIdIDEAFY', id); 
    setToken(nuevoToken);
    setUserId(id); 
  };

  const manejarCierreSesion = () => {
    sessionStorage.removeItem('tokenIDEAFY');
    sessionStorage.removeItem('userIdIDEAFY');
    setToken(null);
    setUserId(null); 
  };

  // Si no hay token, mostramos solo la pantalla de Login (y le pasamos la función para loguearse)
  if (!token) {
    return <Login alIniciarSesion={manejarInicioSesion} />;
  }

  // Si hay token, cargamos el Router y la barra de navegación
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        
        {/* BARRA DE NAVEGACIÓN SUPERIOR */}
        <nav className="bg-[#0b1121] px-10 py-6 flex items-center justify-between border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linear-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xs">ID</span>
            </div>
            <span className="text-white font-bold text-xl tracking-widest">IDEAFY</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Usamos el componente <Link> de React Router en lugar de botones normales */}
            <Link to="/perfil" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Mi Perfil
            </Link>
            
            {/* El link de Admin solo se dibuja si esAdmin es verdadero */}
            {esAdmin && (
              <>
                <Link to="/admin" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                  Usuarios
                </Link>
                <Link to="/roles" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                  Roles
                </Link>
              </>
            )}
            
            <button onClick={manejarCierreSesion} className="text-sm font-semibold text-white flex items-center gap-2 hover:text-red-400 transition-colors ml-4 border-l border-slate-700 pl-4">
              Cerrar sesión <span className="text-lg">&rarr;</span>
            </button>
          </div>
        </nav>

        {/* CONTENEDOR PRINCIPAL Y RUTAS */}
        <main className="max-w-6xl mx-auto p-8">
          <Routes>
            {/* Si entra a localhost:3000/ lo redirigimos al perfil */}
            <Route path="/" element={<Navigate to="/perfil" />} />
            
            {/* Ruta del perfil */}
            <Route path="/perfil" element={<Perfil token={token} idUsuario={userId} />} />
            
            {/* RUTA PROTEGIDA: Si intenta entrar a /admin pero no esAdmin, lo mandamos al perfil de nuevo */}
            <Route 
              path="/admin" 
              element={esAdmin ? <Administracion token={token} idUsuarioActual={userId} /> : <Navigate to="/perfil" />} 
            />
            <Route 
              path="/roles" 
              element={esAdmin ? <Roles token={token} /> : <Navigate to="/perfil" />} 
            />
          </Routes>
        </main>

      </div>
    </Router>
  );
}