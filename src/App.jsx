import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";

import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Administracion from './pages/Administracion';
import Roles from './pages/Roles';
import OAuth2Callback from './pages/OAuth2Callback';
import ProjectCatalog from './pages/ProjectCatalog';
import CreateProject from './pages/CreateProject';
import EditProject from './pages/EditProject';
import CompleteProfile from './pages/CompleteProfile';

function decodificarToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function Sidebar({ esAdmin, alCerrarSesion }) {
  const location = useLocation();
  
  const links = [
    { to: '/perfil', label: 'Mi Perfil' },
    { to: '/proyectos', label: 'Proyectos' },
    ...(esAdmin ? [
      { to: '/admin', label: 'Usuarios' },
      { to: '/roles', label: 'Roles' },
    ] : [])
  ];

  return (
    <aside className="w-60 min-h-screen bg-[#0f172a] border-r border-white/10 flex flex-col">
      <div className="p-5 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">IDEAFY</h1>
      </div>
      
      <nav className="flex-1 p-3 space-y-1">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`block px-3 py-2 rounded text-sm ${
              location.pathname === link.to
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <Button variant="outline" onClick={alCerrarSesion} className="w-full">
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}

function Dashboard({ token, alCerrarSesion }) {
  const payload = decodificarToken(token);
  const roles = payload?.roles || [];
  const esAdmin = roles.includes('ADMIN');
  const tienePerfil = roles.includes('INVESTOR') || roles.includes('CREATOR') || esAdmin;

  return (
    <div className="flex min-h-screen bg-[#030712]">
      {tienePerfil && <Sidebar esAdmin={esAdmin} alCerrarSesion={alCerrarSesion} />}
      
      <div className={`flex-1 flex flex-col ${!tienePerfil ? '' : ''}`}>
        {tienePerfil && (
          <header className="h-14 border-b border-white/10 bg-[#0f172a] flex items-center justify-between px-6">
            <span className="text-sm text-slate-400">Panel de Control</span>
            <Button variant="ghost" onClick={alCerrarSesion} className="text-slate-400 hover:text-white text-sm">
              Cerrar sesión
            </Button>
          </header>
        )}

        <main className={`flex-1 p-6 overflow-auto ${!tienePerfil ? 'p-0 flex items-center justify-center' : ''}`}>
          <Routes>
            {!tienePerfil && <Route path="*" element={<Navigate to="/completar-perfil" />} />}
            <Route path="/" element={<Navigate to={tienePerfil ? "/perfil" : "/completar-perfil"} />} />
            <Route path="/completar-perfil" element={<CompleteProfile token={token} userId={payload?.userId} />} />
            <Route path="/perfil" element={tienePerfil ? <Perfil token={token} idUsuario={payload?.userId} /> : <Navigate to="/completar-perfil" />} />
            <Route path="/proyectos" element={<ProjectCatalog token={token} />} />
            <Route path="/proyectos/crear" element={<CreateProject token={token} />} />
            <Route path="/proyectos/:id/editar" element={<EditProject token={token} />} />
            <Route path="/admin" element={esAdmin ? <Administracion token={token} idUsuarioActual={payload?.userId} /> : <Navigate to="/perfil" />} />
            <Route path="/roles" element={esAdmin ? <Roles token={token} /> : <Navigate to="/perfil" />} />
            <Route path="/oauth2/callback" element={<OAuth2Callback alIniciarSesion={(t, id) => {
              sessionStorage.setItem('tokenIDEAFY', t);
              sessionStorage.setItem('userIdIDEAFY', id);
              window.location.href = '/perfil';
            }} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem('tokenIDEAFY'));

  const alIniciarSesion = (newToken, id) => {
    sessionStorage.setItem('tokenIDEAFY', newToken);
    sessionStorage.setItem('userIdIDEAFY', id);
    setToken(newToken);
  };

  const alCerrarSesion = () => {
    sessionStorage.removeItem('tokenIDEAFY');
    sessionStorage.removeItem('userIdIDEAFY');
    setToken(null);
    window.location.href = '/';
  };

  return (
    <Router>
      {!token ? (
        <Routes>
          <Route path="/" element={<Login alIniciarSesion={alIniciarSesion} />} />
          <Route path="/oauth2/callback" element={<OAuth2Callback alIniciarSesion={(t, id) => {
            sessionStorage.setItem('tokenIDEAFY', t);
            sessionStorage.setItem('userIdIDEAFY', id);
            window.location.href = '/';
          }} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        <Dashboard token={token} alCerrarSesion={alCerrarSesion} />
      )}
    </Router>
  );
}
