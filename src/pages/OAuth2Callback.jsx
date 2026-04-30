import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuth2Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      console.error("Error en OAuth2:", error);
      navigate("/?error=" + error);
      return;
    }

    if (!token) {
      console.error("No se recibió el token");
      navigate("/?error=no_token");
      return;
    }

    sessionStorage.setItem("tokenIDEAFY", token);

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      sessionStorage.setItem("userIdIDEAFY", payload.userId || payload.sub);
    } catch (e) {
      console.warn("No se pudo decodificar el token");
    }

    navigate("/perfil");
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Procesando autenticación...</p>
      </div>
    </div>
  );
}