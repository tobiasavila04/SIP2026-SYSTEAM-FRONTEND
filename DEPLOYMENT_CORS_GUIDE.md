# Configuración CORS y Deployment a Vercel

## ✅ Lo que ya hice en el Frontend

1. **Creé la configuración centralizada de endpoints** (`src/config/api.js`)
   - Lee la variable de entorno `VITE_API_URL`
   - En desarrollo: `http://localhost:8080`
   - En producción (Vercel): `https://ulisescasal-sip2026-systeam-backend-production.up.railway.app`

2. **Actualicé todos los fetch calls** para usar los endpoints desde la configuración
   - ✅ Login.jsx
   - ✅ Roles.jsx
   - ✅ Perfil.jsx
   - ✅ Administracion.jsx

3. **Creé dos archivos de variables de entorno**
   - `.env.local` → Desarrollo local
   - `.env.production` → Para Vercel

## 🔧 Qué DEBES hacer en el Backend Java

**Tu backend Java NECESITA esta configuración para que CORS funcione:**

Agrega esto a tu `SecurityConfig.java`:

```java
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // Origen ACTUAL de tu Vercel cuando lo deploys
    // Por ahora puedes usar "*" para probar, pero es más seguro especificar el dominio
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app"  // Tu dominio futuro: https://tu-app.vercel.app
    ));
    
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

## 🚀 Workflow de Deploy

### Fase 1: Testing en local
```bash
# Terminal 1: Backend (Java)
cd tu-repo-backend
# Ejecuta tu Spring Boot (debe estar en http://localhost:8080)

# Terminal 2: Frontend (React)
cd SIP2026-SYSTEAM-FRONTEND
npm install
npm run dev
# Abre http://localhost:5173
```

El **proxy en vite.config.js** hace que `/auth` y `/api` se redirijan automáticamente a `localhost:8080` en desarrollo. **No hay CORS en desarrollo gracias al proxy.**

### Fase 2: Deploy del Backend a Railway
1. Comitea tus cambios en Java (con la configuración de CORS)
2. Pushea a tu rama de Railway
3. Verifica en Railway que el backend esté corriendo correctamente

### Fase 3: Deploy del Frontend a Vercel
```bash
# 1. Comitea los cambios del frontend
git add .
git commit -m "feat: centralized API endpoints for Railway backend"
git push

# 2. En Vercel:
# - Conecta tu repositorio (si no está ya hecho)
# - En Settings → Environment Variables, agrega:
#   VITE_API_URL = https://ulisescasal-sip2026-systeam-backend-production.up.railway.app
# - Vercel auto-deploya al hacer push a main
```

## 🧪 Cómo testear CORS

Desde tu frontend desplegado en Vercel, haz un login:
1. Vercel envía la request a `https://ulisescasal-sip2026-systeam-backend-production.up.railway.app/auth/login`
2. El backend responde con headers CORS:
   ```
   Access-Control-Allow-Origin: https://tu-app.vercel.app
   ```
3. El navegador la permite ✅

Si ves error de CORS en la consola del navegador, revisa:
- ¿El backend tiene configurado `corsConfigurationSource()`?
- ¿La URL de origen en Vercel está en la lista `setAllowedOrigins()`?

## 📝 Variable de Entorno en Vercel

**Nombre:** `VITE_API_URL`
**Valor:** `https://ulisescasal-sip2026-systeam-backend-production.up.railway.app`

Vercel usa esta variable cuando hace el build (en tiempo de build, no en runtime).

---

## Resumen
- ✅ Frontend: Configuración centralizada de endpoints
- ✅ Frontend: Variables de entorno por ambiente
- ⚠️ Backend: AGREGAR bean `CorsConfigurationSource` (CRÍTICO)
- 🚀 Luego: Deploy a Vercel (automático con git push)
