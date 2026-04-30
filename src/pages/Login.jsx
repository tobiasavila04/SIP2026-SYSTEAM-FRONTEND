import { useState } from "react";
import { LoginForm } from "@/components/login-form.jsx";
import { API_ENDPOINTS } from "@/config/api.js";

const beneficios = [
  { icon: "🚀", titulo: "Escalabilidad Global", desc: "Infraestructura cloud de alto rendimiento preparada para crecer." },
  { icon: "🔐", titulo: "Seguridad Bancaria", desc: "Encriptación avanzada y protección de activos digitales." },
  { icon: "📊", titulo: "Gestión Inteligente", desc: "Panel de control y analíticas de inversión en tiempo real." }
];

export default function Login({ alIniciarSesion }) {
  const [esLogin, setEsLogin] = useState(true);
  const [datos, setDatos] = useState({ name: "", email: "", password: "" });

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    const url = esLogin ? API_ENDPOINTS.AUTH_LOGIN : API_ENDPOINTS.AUTH_REGISTER;
    const payload = esLogin 
      ? { email: datos.email, password: datos.password } 
      : datos;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (esLogin) {
          const data = await res.json();
          alIniciarSesion(data.accessToken, data.userId);
        } else {
          alert("Usuario registrado con éxito");
          setEsLogin(true);
          setDatos({ name: "", email: "", password: "" });
        }
      } else {
        alert("Credenciales incorrectas");
      }
    } catch {
      alert("Error de conexión");
    }
  };

  const manejarRecuperarPassword = async (email) => {
    try {
      const res = await fetch(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        alert("Si el correo está registrado, te enviaremos las instrucciones.");
        return true;
      }
      return false;
    } catch {
      alert("Error de conexión");
      return false;
    }
  };

  return (
    <div className="login-layout">
      
      {/* Logo */}
      <div className="login-logo">
        <div className="login-logo-icono">
          <svg className="login-logo-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="login-logo-texto">IDEAFY</span>
      </div>

      {/* Fondo */}
      <div className="login-fondo">
        <div className="blur-glow-indigo" />
        <div className="blur-glow-blue" />
      </div>

      {/* Beneficios - solo en PC */}
      <div className="login-beneficios">
        <div className="max-w-xl"> 
          <div className="login-badge-top">
            <span className="login-badge-punto" />
            <span>Plataforma de Tokenización</span>
          </div>

          <h1 className="login-titulo">
            <span className="gradient-text">
              Convertí ideas en <br/>inversión real.
            </span>
          </h1>

          <p className="login-descripcion">
            La infraestructura moderna para tokenizar proyectos, gestionar inversores y escalar tu startup con seguridad blockchain.
          </p>

          <div className="grid grid-cols-1 gap-5">
            {beneficios.map((item, i) => (
              <div key={i} className="login-beneficio-item">
                <div className="login-beneficio-icono">{item.icon}</div>
                <div>
                  <h3>{item.titulo}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="login-form-container">
        <div className="w-full max-w-[420px]">
          <LoginForm
            esLogin={esLogin}
            setEsLogin={setEsLogin}
            manejarEnvio={manejarEnvio}
            manejarCambio={manejarCambio}
            manejarRecuperarPassword={manejarRecuperarPassword} 
          />
        </div>
      </div>
    </div>
  );
}
