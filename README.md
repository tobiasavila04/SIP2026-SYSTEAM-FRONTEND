# IDEAFY Frontend

Frontend del proyecto IDEAFY con React, Vite y Tailwind CSS. Aplicación web para gestión de usuarios con autenticación JWT y autorización basada en permisos (RBAC).

## 🚀 Requisitos

- **Node.js** 16+ (recomendado 18+)
- **npm** 8+
- Backend Java (Spring Boot) corriendo en `http://localhost:8080`
- Variables de entorno configuradas (ver sección Setup)

## 📦 Instalación

### 1. Clonar el repositorio y entrar en la carpeta

```bash
cd SIP2026-SYSTEAM-FRONTEND
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Editar `.env` y configurar la URL del servidor backend:

```env
# URL del servidor backend Java
VITE_API_URL=http://localhost:8080
```

Si el backend está en otra máquina, cambiar `localhost` por la IP/dominio:

```env
VITE_API_URL=http://192.168.x.x:8080
# O en producción
VITE_API_URL=https://api.tu-dominio.com
```

## ▶️ Cómo Correr el Proyecto

### Modo Desarrollo (con Hot Reload)

```bash
npm run dev
```

Abre el navegador en: `http://localhost:5173`

Cualquier cambio en los archivos se reflejará automáticamente en el navegador.

### Build para Producción

```bash
npm run build
```

Genera la carpeta `dist/` lista para desplegar.

### Preview de la Build

```bash
npm run preview
```

Previsualiza localmente la build de producción.

### Linting

```bash
npm run lint
```

Verifica el código con ESLint.

## 📁 Estructura del Proyecto

```
src/
├── App.jsx              # Componente principal
├── App.css              # Estilos de la app
├── main.jsx             # Punto de entrada
├── index.css            # Estilos globales
└── assets/              # Imágenes y recursos

public/                 # Archivos estáticos
vite.config.js          # Configuración de Vite
package.json            # Dependencias y scripts
.env                    # Variables de entorno (local)
.env.example            # Ejemplo de variables
```

## 🔐 Credenciales de Prueba

**Admin por defecto:**

| Campo | Valor |
|-------|-------|
| Email | `admin@ideafy.local` |
| Password | `password` |
| Rol | ADMIN |

## 🌐 Componentes y Funcionalidades

### 1. **PantallaAutenticacion** (Login/Registro)

- Login con email y contraseña
- Registro de nuevos usuarios
- Validación de credenciales
- Almacenamiento de JWT en localStorage

### 2. **VistaPerfilUsuario** (Mi Perfil)

- Ver y editar perfil personal (nombre, email)
- Cambiar contraseña
- Cargar datos del usuario con `/api/users/me`
- Actualizar perfil con `/api/users/me`

### 3. **VistaAdministradorUsuario** (Admin)

- Listar todos los usuarios (solo admin)
- Ver estado de usuarios (activo/inactivo)
- Deshabilitar usuarios
- Recarga automática después de cambios

## 🔌 Endpoints Disponibles

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Login con email/password |
| POST | `/auth/register` | Registrar nuevo usuario |
| POST | `/auth/change-password` | Cambiar password (autenticado) |

### Usuarios

| Método | Endpoint | Descripción | Requisito |
|--------|----------|-------------|-----------|
| GET | `/api/users/me` | Perfil del usuario actual | Token |
| PUT | `/api/users/me` | Actualizar perfil propio | Token |
| GET | `/api/users` | Listar usuarios | Admin |
| DELETE | `/api/users/{id}` | Deshabilitar usuario | Admin |

## 🔒 Autenticación y Autorización

### Flujo de Autenticación

1. Usuario hace login en `/auth/login`
2. Backend devuelve `accessToken` (JWT) y `userId`
3. Token se guarda en `localStorage` como `tokenIDEAFY`
4. Todas las peticiones incluyen: `Authorization: Bearer <token>`

### Permisos (RBAC)

- **ADMIN**: Acceso a panel de administración, gestión de usuarios
- **USER**: Solo acceso a su perfil personal

## 🛠️ Troubleshooting

### Error: "Servidor no disponible"

**Causa:** El backend Java no está corriendo.

**Solución:** Inicia el backend en otra terminal:

```bash
# En la carpeta del backend
./mvnw spring-boot:run
```

### Error: "Failed to fetch" o CORS

**Causa:** El proxy de Vite no está funcionando correctamente.

**Solución:**

1. Verifica que el backend esté en `http://localhost:8080`
2. Abre DevTools (F12) → Network y revisa las peticiones
3. Verifica `.env` tenga la URL correcta

### Error: "Error 400" en Login/Registro

**Causa:** Credenciales inválidas o formato incorrecto.

**Solución:**

1. Abre DevTools (F12) → Console
2. Busca el mensaje exacto del error
3. Verifica email y password sean correctos

### Error: "403 Access Denied" en Admin

**Causa:** No eres administrador.

**Solución:** Loguéate con la cuenta admin:
- Email: `admin@ideafy.local`
- Password: `password`

## 🚨 Variables de Entorno Importantes

```env
# Obligatorio
VITE_API_URL=http://localhost:8080

# Opcional (por defecto localhost:5173)
# VITE_HMR_PORT=5173
```

## 📚 Tecnologías

- **React 19** - UI Framework
- **Vite 8** - Build tool con HMR
- **Tailwind CSS 4** - Estilos
- **React Hooks** - State management
- **Fetch API** - HTTP client

## 🔄 Proxy de Vite

El `vite.config.js` configura un proxy que redirige:

- `/auth/*` → `http://localhost:8080/auth/*`
- `/api/*` → `http://localhost:8080/api/*`

Esto evita problemas de CORS durante desarrollo.

## 📝 Notas Importantes

- El token JWT se almacena en `localStorage` → **No es seguro para datos sensibles en producción**
- Usar `secure cookies` o `httpOnly cookies` en producción
- El backend debe tener CORS habilitado para la URL del frontend
- En producción, cambiar `VITE_API_URL` a la URL real del backend

## 📞 Contacto y Soporte

Para reportar bugs o sugerencias, contacta al equipo de desarrollo.

