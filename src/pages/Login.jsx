import { useState } from 'react';

// Función helper para verificar disponibilidad del servidor
const verificarServidorDisponible = async () => {
  try {
    const respuesta = await fetch('/api/users', { method: 'HEAD' });
    return respuesta.ok || respuesta.status === 401;
  } catch {
    return false;
  }
};

export default function Login({ alIniciarSesion }) {
  const [esLogin, setEsLogin] = useState(true);
  const [DatosFormulario, setDatosFormulario] = useState({ name: '', email: '', password: '' });

  const manejarCambio = (e) => {
    setDatosFormulario({ ...DatosFormulario, [e.target.name]: e.target.value });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    const urlPeticion = esLogin ? '/auth/login' : '/auth/register';
    const payload = esLogin ? { email: DatosFormulario.email, password: DatosFormulario.password } : DatosFormulario;
    
    try {
      const servidorDisponible = await verificarServidorDisponible();
      if (!servidorDisponible) {
        alert(`❌ Servidor no disponible.\nVerifica que el backend de Ulises esté corriendo en http://localhost:8080`);
        return;
      }
      
      const respuesta = await fetch(urlPeticion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (respuesta.ok) {
        if (esLogin) {
          const datos = await respuesta.json();
          alIniciarSesion(datos.accessToken, datos.userId);
        } else {
          alert('¡Usuario registrado con éxito! Ahora iniciá sesión.');
          setEsLogin(true);
          setDatosFormulario({ name: '', email: '', password: '' });
        }
      } else {
        const errorData = await respuesta.json().catch(() => ({}));
        alert(`Error: ${errorData.message || 'Credenciales incorrectas'}`);
      }
    } catch (error) {
      alert(`❌ Error de conexión: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1121] flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="mb-10 md:mb-14 w-full flex justify-center">
        <h1 
          className="font-black tracking-tighter text-center select-none"
          style={{ 
            fontSize: 'clamp(4rem, 15vw, 10rem)', 
            lineHeight: '1',
            letterSpacing: '-0.04em', 
            
            /* --- EL EFECTO DE COLORES (DEGRADADO) --- */
            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 40%, #2dd4bf 100%)', 
            WebkitTextFillColor: 'transparent', 
            backgroundClip: 'text',
            
            /* --- EL RESPLANDOR (GLOW EFFECT) --- */
            filter: 'drop-shadow(0px 0px 15px rgba(99, 102, 241, 0.4))' /* Un resplandor sutil color índigo */
          }} 
        >
          IDEAFY
        </h1>
      </div>

      {/* ========================================== */}
      {/* CAJA DE LOGIN / REGISTRO                     */}
      {/* ========================================== */}
      <div className="max-w-md w-full bg-slate-900/80 rounded-xl shadow-2xl border border-slate-800 p-10 transition-all">
        <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">
          {esLogin ? 'Inicia sesión' : 'Crear Cuenta'}
        </h2>
        
        <form onSubmit={manejarEnvio} className="space-y-5">
          {!esLogin && (
            <div>
              <input 
                type="text" 
                name="name" 
                onChange={manejarCambio} 
                required 
                placeholder="Nombre Completo"
                className="w-full px-4 py-3.5 bg-slate-800 text-white rounded-md border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" 
              />
            </div>
          )}
          
          <div>
            <input 
              type="email" 
              name="email" 
              onChange={manejarCambio} 
              required 
              placeholder="Email o número de teléfono"
              className="w-full px-4 py-3.5 bg-slate-800 text-white rounded-md border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" 
            />
          </div>
          
          <div className="mb-6">
            <input 
              type="password" 
              name="password" 
              onChange={manejarCambio} 
              required 
              placeholder="Contraseña"
              className="w-full px-4 py-3.5 bg-slate-800 text-white rounded-md border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors" 
            />
          </div>
          
          <button type="submit" className="w-full py-3.5 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-all shadow-lg">
            {esLogin ? 'Iniciar sesión' : 'Registrarme'}
          </button>
        </form>
        
        {/* ========================================== */}
        {/* BOTÓN PARA ALTERNAR ENTRE LOGIN Y REGISTRO   */}
        {/* ========================================== */}
        <div className="mt-8 text-slate-400 text-sm">
          {esLogin ? '¿Primera vez en IDEAFY? ' : '¿Ya tenés una cuenta? '}
          <button 
            onClick={() => setEsLogin(!esLogin)} 
            className="text-white hover:underline font-medium transition-colors"
          >
            {esLogin ? 'Suscríbete ahora.' : 'Iniciá sesión.'}
          </button>
        </div>
        
      </div>
    </div>
  );
}