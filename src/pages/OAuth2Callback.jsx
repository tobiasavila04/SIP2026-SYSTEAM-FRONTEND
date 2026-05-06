import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveTokens } from "@/config/api.js";

export default function OAuth2Callback({ alIniciarSesion }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error) {
      navigate("/?error=" + error);
      return;
    }

    if (!accessToken || !refreshToken) {
      navigate("/?error=no_tokens");
      return;
    }

    let userId;
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      userId = payload.userId || payload.sub;
    } catch {
      console.warn("No se pudo decodificar el token");
    }

    if (alIniciarSesion) {
      alIniciarSesion(accessToken, refreshToken, userId);
    } else {
      saveTokens(accessToken, refreshToken);
      if (userId) localStorage.setItem("userIdIDEAFY", userId);
      window.location.href = "/perfil";
    }
  }, [navigate, searchParams, alIniciarSesion]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Procesando autenticación...</p>
      </div>
    </div>
  );
}
