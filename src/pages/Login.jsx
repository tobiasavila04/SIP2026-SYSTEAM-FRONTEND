import { useState } from 'react';
import {LoginForm} from "@/components/login-form.jsx"

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
        alert(`❌ Servidor no disponible.\nVerifica que el backend esté corriendo en http://localhost:8080`);
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

const ESTILO_LOGO_NEON = {
  fontSize: 'clamp(4rem, 15vw, 10rem)', 
  lineHeight: '1', 
  letterSpacing: '-0.04em', 
  background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 40%, #2dd4bf 100%)', 
  WebkitTextFillColor: 'transparent',  
  backgroundClip: 'text'
};

 return (
    <div className="min-h-screen bg-[#0b1121] flex flex-col items-center justify-center p-6 font-sans">
      <div className="mb-10 md:mb-14 w-full flex justify-center">
        <h1 className="font-black tracking-tighter text-center select-none" style={ESTILO_LOGO_NEON}>
          IDEAFY
        </h1>
      </div>

     <div className="w-full max-w-lg">
          <LoginForm 
            esLogin={esLogin} 
            setEsLogin={setEsLogin} 
            manejarEnvio={manejarEnvio} 
            manejarCambio={manejarCambio} 
            
            className="w-full"
            cardClassName="bg-[#0f172a] border-slate-800 text-white shadow-2xl p-4 sm:p-8"
            
            titleClassName="text-4xl font-bold mb-2 tracking-tight"
            descClassName="text-lg text-slate-400"
            
            labelClassName="text-slate-300 text-lg font-medium"
            inputClassName="h-14 bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-700 text-xl focus-visible:ring-indigo-500"
            
            submitBtnClassName="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold h-14 text-xl border-0 shadow-lg transition-all mt-4"
          />
        </div>
    </div>
  );
}