# Documentación del Frontend — Ideafy

## Índice
1. [Arquitectura general](#1-arquitectura-general)
2. [Estructura de carpetas](#2-estructura-de-carpetas)
3. [Flujo de datos](#3-flujo-de-datos)
4. [Árbol de archivos completo](#4-árbol-de-archivos-completo)
5. [Descripción y código de cada archivo](#5-descripción-y-código-de-cada-archivo)
6. [Ruteo y navegación](#6-ruteo-y-navegación)
7. [Autenticación y estados globales](#7-autenticación-y-estados-globales)
8. [Comunicación con backends](#8-comunicación-con-backends)
9. [Relación entre archivos](#9-relación-entre-archivos)
10. [Estilos y tema](#10-estilos-y-tema)

---

## 1. Arquitectura general

El frontend es una **SPA (Single Page Application)** construida con **React 19 + Vite 8**. Sigue una arquitectura por **capas**:

```
Config → Providers → Router → Layout → Pages → Components
                                ↕
                            Stores (Zustand)
                                ↕
                            Hooks (TanStack Query)
                                ↕
                             API Client
                                ↕
                     Backend Auth (:8080) + Projects (:8081)
```

### Tecnologías principales

| Tecnología | Uso |
|------------|-----|
| **React 19** | UI declarativa con componentes funcionales |
| **Vite 8** | Build tool con HMR ultrarrápido |
| **React Router v7** | Ruteo SPA con lazy loading |
| **Zustand** | Estado global (auth, UI) |
| **TanStack Query** | Fetching, caché, refetch automático |
| **Tailwind CSS v4** | Estilos utility-first |
| **Framer Motion** | Animaciones y transiciones |
| **shadcn/ui** | Componentes base (Button, Input, Dialog, etc.) |
| **Lucide React** | Iconos |
| **TanStack Table** | Tablas con ordenamiento y paginación (admin) |
| **react-hook-form + zod** | Manejo de formularios con validación |

### 🤔 ¿POR QUÉ cada tecnología?

**¿Por qué SPA (React + Vite) y no SSR (Next.js)?** Porque el profesor usó Vite en clase y el proyecto no necesita SSR — no hay SEO crítico (es una app cerrada con login), no hay contenido dinámico que indexar. Una SPA es más simple de deployar (solo build estático en Vercel) y el HMR de Vite es instantáneo.

**¿Por qué React 19?** Porque es la versión estable más nueva al momento del desarrollo. React 19 trae mejoras en concurrent rendering, use() hook, y refs como props sin forwardRef. El proyecto se inició con React 19 desde el principio.

**¿Por qué Zustand y no Redux o Context?** 
- **Redux**: Es overkill para un proyecto de este tamaño (mucho boilerplate: actions, reducers, dispatch).
- **Context**: Funciona, pero cada vez que el contexto cambia, TODOS los hijos se re-renderizan. Zustand solo re-renderiza los componentes que usan esa slice específica del store.
- **Zustand**: Simple (no providers, no reducers), performante (suscripciones selectivas), chico (~1KB).

**¿Por qué TanStack Query y no fetch + useState?** Porque maneja automáticamente: caché, refetch, staleTime, loading/error states, paginación, polling, invalidación de queries relacionadas (ej: después de crear un proyecto, invalida la lista). Hacer todo eso con useState + useEffect + fetch manual es ~100 líneas de código por cada hook.

**¿Por qué Tailwind y no CSS modules / styled-components?** Porque Tailwind elimina el cambio de contexto entre HTML y CSS. No necesitás nombrar clases, no hay conflictos de especificidad, el árbol de CSS se purga automáticamente en build. Es el estándar en la industria React actual.

**¿Por qué shadcn/ui y no Material UI / Chakra?** Porque shadcn/ui son componentes headless (sin estilos propietarios) que copiás a tu proyecto y personalizás con Tailwind. No es una dependencia que actualizar. Material UI es pesado y difícil de sobrescribir estilos.

**¿Por qué 2 backends separados y no 1 monolito?** Porque la arquitectura del profesor separa Auth (usuarios, roles, permisos) de Gestión de Proyectos (proyectos, wallet, dashboard). Cada uno puede escalar independientemente. En el frontend se refleja como dos bases de URL distintas (`buildUrl` para auth, `buildProjectUrl` para proyectos).

### Backends (2 microservicios)

| Backend | Puerto | Rutas |
|---------|--------|-------|
| **Auth (Usuarios/Roles/Permisos)** | `:8080` | `/auth/*`, `/api/users/*`, `/api/roles/*`, `/api/permissions/*` |
| **Proyectos (Gestión + Wallet + Dashboard)** | `:8081` | `/api/projects/*`, `/api/wallet/*`, `/api/dashboard/*` |

En desarrollo, Vite redirige las rutas mediante proxy (ver `vite.config.js`). En producción, se usan variables de entorno `VITE_API_URL` y `VITE_PROJECT_API_URL`.

---

## 2. Estructura de carpetas

```
ideafy-frontend/
├── public/                  # Archivos estáticos servidos directamente
│   ├── favicon.svg          # Icono del sitio
│   └── robots.txt           # Instrucciones para crawlers de buscadores
│
├── src/
│   ├── main.jsx             # Entry point de la app
│   ├── index.css            # Estilos globales + directivas Tailwind
│   │
│   ├── lib/                 # Utilidades y lógica compartida
│   │   ├── api-client.js    # Cliente HTTP con JWT + refresh token
│   │   ├── utils.js         # Funciones de formato (fechas, monedas)
│   │   └── project-constants.jsx  # Constantes + componente FundingProgress
│   │
│   ├── config/              # Configuración
│   │   └── api.js           # Endpoints centralizados + helpers de tokens
│   │
│   ├── stores/              # Estado global (Zustand)
│   │   └── auth-store.js    # Auth, sidebar, roles, permisos
│   │
│   ├── providers/           # Providers de React
│   │   ├── index.jsx        # QueryClient + Toaster
│   │   └── auth-provider.jsx # Lógica de login/logout/registro
│   │
│   ├── router/              # Configuración de rutas
│   │   └── index.jsx        # Routes + guards (Protected, Guest, Admin)
│   │
│   ├── hooks/               # Hooks personalizados (TanStack Query)
│   │   ├── use-users.js     # CRUD de usuarios + asignación de roles
│   │   ├── use-roles.js     # CRUD de roles + permisos
│   │   ├── use-projects.js  # CRUD de proyectos + cambio de estado
│   │   ├── use-wallet.js    # Wallet summary polling
│   │   └── use-permission-crud.js  # CRUD de permisos
│   │
│   ├── pages/               # Páginas (una carpeta por ruta)
│   │   ├── auth/            # Páginas sin autenticación
│   │   │   ├── login.jsx
│   │   │   ├── register.jsx
│   │   │   ├── callback.jsx       # OAuth2 callback
│   │   │   └── complete-profile.jsx  # Post-registro
│   │   │
│   │   ├── dashboard/       # Dashboard principal
│   │   │   └── dashboard.jsx
│   │   │
│   │   ├── projects/        # Gestión de proyectos
│   │   │   ├── index.jsx          # Catálogo con filtros
│   │   │   ├── [id].jsx           # Detalle + invertir
│   │   │   └── project-editor.jsx # Crear/editar
│   │   │
│   │   ├── settings/        # Configuración del usuario
│   │   │   └── settings.jsx # Perfil, wallet, seguridad, notificaciones
│   │   │
│   │   └── admin/           # Administración
│   │       ├── users.jsx    # CRUD usuarios + roles
│   │       └── roles.jsx    # CRUD roles + permisos
│   │
│   ├── components/          # Componentes reutilizables
│   │   ├── layout/          # Estructura de la app
│   │   │   ├── dashboard-layout.jsx  # Sidebar + Header + Outlet
│   │   │   ├── header.jsx           # Barra superior
│   │   │   └── sidebar.jsx          # Navegación lateral
│   │   │
│   │   ├── shared/          # Componentes compartidos
│   │   │   ├── page-header.jsx      # Título + descripción + acciones
│   │   │   ├── data-table.jsx       # Tabla responsive con scroll
│   │   │   ├── search-input.jsx     # Input de búsqueda
│   │   │   ├── status-badge.jsx     # Badge de estado
│   │   │   ├── confirm-dialog.jsx   # Diálogo de confirmación
│   │   │   ├── error-state.jsx      # Estado de error con retry
│   │   │   ├── empty-state.jsx      # Estado vacío con acción
│   │   │   └── loading-skeleton.jsx # Skeletons de carga
│   │   │
│   │   ├── ui/              # Componentes base (shadcn/ui)
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   ├── select.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── switch.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── form.jsx
│   │   │   └── password-input.jsx   # Input con toggle de visibilidad
│   │   │
│   │   ├── features/        # Componentes de features específicas
│   │   │   ├── auth/
│   │   │   │   └── auth-layout.jsx   # Layout compartido login/registro
│   │   │   └── projects/
│   │   │       ├── project-card.jsx   # Tarjeta de proyecto
│   │   │       └── project-form.jsx   # Formulario crear/editar
│   │   │
│   │   └── admin/
│   │       └── entity-form-dialog.jsx  # Diálogo crear/editar rol o permiso
│   │
│   └── vite.config.js       # Configuración de Vite + proxy
│
├── index.html               # Shell HTML
├── package.json             # Dependencias y scripts
├── tailwind.config.js       # Config de Tailwind
└── vite.config.js           # Config de Vite (raíz del proyecto)
```

---

## 3. Flujo de datos

### 🤔 ¿POR QUÉ este flujo de datos?

**¿Por qué Pages → Hooks → API Client y no Pages → API Client directamente?** Porque los hooks encapsulan la lógica de TanStack Query (caché, refetch, invalidación). Si cada página llamara a `apiRequest` directamente, perderíamos:
   - Caché automática (dos páginas que muestran la misma lista compartirían caché)
   - Refetch automático (staleTime, refetchOnFocus)
   - Invalidación en mutations (crear proyecto → refetch lista)
   - Estados loading/error/data tipados

**¿Por qué el API Client agrega el JWT automáticamente?** Para que ningún componente tenga que preocuparse por tokens. Cada llamada a `apiRequest` lee el token de `sessionStorage` y lo pone en el header `Authorization`. Si un componente tuviera que hacerlo manualmente, sería fácil olvidarse y recibir 401.

**¿Por qué el refresh token es automático y transparente?** Porque el usuario no debería saber que su token expiró. Si cada 15 minutos el usuario recibe un error 401 y tiene que loguearse de nuevo, la experiencia es mala. El refresh automático renueva el token silenciosamente.

**¿Por qué `clearStoredAuth()` + redirect en lugar de solo mostrar un toast si falla el refresh?** Porque si el refresh falla, el usuario está efectivamente desconectado. Mostrar un toast no es suficiente — el usuario podría seguir interactuando y recibiendo 401 en cada acción. Es más seguro limpiar todo y redirigir al login.

### 3.1 Ciclo de vida de una petición

```
Usuario interactúa (click, submit)
        │
        ▼
Página (page/*.jsx)
        │
        ▼
Hook personalizado (hooks/*.js)
  - useQuery → GET (lectura)
  - useMutation → POST/PUT/DELETE (escritura)
        │
        ▼
apiRequest() (lib/api-client.js)
  - Agrega JWT del sessionStorage
  - Si 401 → refresca token automáticamente
  - Si error → parsea y lanza ApiClientError
        │
        ▼
API_ENDPOINTS (config/api.js)
  - Resuelve la URL (buildUrl o buildProjectUrl)
  - En dev usa proxy de Vite (localhost)
  - En prod usa VITE_API_URL / VITE_PROJECT_API_URL
        │
        ▼
Backend (8080 o 8081)
  - Procesa la request
  - Devuelve JSON
        │
        ▼
TanStack Query
  - Cachea la respuesta
  - Refetch automático según staleTime
  - Invalidación en mutations (onSuccess)
        │
        ▼
React re-renderiza la UI
```

### 3.2 Flujo de autenticación

```
Login (auth-provider.jsx)
  │
  ├─ POST /auth/login → { accessToken, refreshToken, user }
  ├─ setStoredTokens() → sessionStorage
  ├─ authStore.setAuth() → Zustand
  └─ navigate('/dashboard')

Cada request subsecuente:
  apiRequest() → lee token de sessionStorage → header Authorization

Si 401:
  doRefresh() (deduplicado) → POST /auth/refresh
  ├─ Éxito → guarda nuevo token → reintenta request
  └─ Falla → clearStoredAuth() → redirect a login
```

### 3.3 Flujo de inversión (HU-15)

```
Usuario ve FundingProgress en tarjeta o detalle
  └─ montoRecaudado / montoRequerido → barra + %

Usuario click "Invertir"
  └─ InvestDialog → ingresa monto → submit
       └─ POST /api/projects/{id}/invest?amount=X
            └─ onSuccess → refetch proyecto
                 └─ FundingProgress se actualiza con nuevo montoRecaudado
```

---

## 4. Árbol de archivos completo

```
ideafy-frontend/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── index.css
│   ├── lib/
│   │   ├── api-client.js
│   │   ├── utils.js
│   │   └── project-constants.jsx
│   ├── config/
│   │   └── api.js
│   ├── stores/
│   │   └── auth-store.js
│   ├── providers/
│   │   ├── index.jsx
│   │   └── auth-provider.jsx
│   ├── router/
│   │   └── index.jsx
│   ├── hooks/
│   │   ├── use-users.js
│   │   ├── use-roles.js
│   │   ├── use-projects.js
│   │   ├── use-wallet.js
│   │   └── use-permission-crud.js
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.jsx
│   │   │   ├── register.jsx
│   │   │   ├── callback.jsx
│   │   │   └── complete-profile.jsx
│   │   ├── dashboard/
│   │   │   └── dashboard.jsx
│   │   ├── projects/
│   │   │   ├── index.jsx
│   │   │   ├── [id].jsx
│   │   │   └── project-editor.jsx
│   │   ├── settings/
│   │   │   └── settings.jsx
│   │   └── admin/
│   │       ├── users.jsx
│   │       └── roles.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── dashboard-layout.jsx
│   │   │   ├── header.jsx
│   │   │   └── sidebar.jsx
│   │   ├── shared/
│   │   │   ├── page-header.jsx
│   │   │   ├── data-table.jsx
│   │   │   ├── search-input.jsx
│   │   │   ├── status-badge.jsx
│   │   │   ├── confirm-dialog.jsx
│   │   │   ├── error-state.jsx
│   │   │   ├── empty-state.jsx
│   │   │   └── loading-skeleton.jsx
│   │   ├── ui/
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   ├── select.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── switch.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── form.jsx
│   │   │   └── password-input.jsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── auth-layout.jsx
│   │   │   └── projects/
│   │   │       ├── project-card.jsx
│   │   │       └── project-form.jsx
│   │   └── admin/
│   │       └── entity-form-dialog.jsx
│   └── .env.example
```

---

## 5. Descripción y código de cada archivo

### 5.1 Raíz del proyecto

**`index.html`** — Shell HTML. Contiene `<meta>` tags SEO, Open Graph, Twitter Cards, `lang="es"`, `<title>`, favicon, y fuente Geist Variable. El div `#root` es donde React renderiza. El `<script type="module" src="/src/main.jsx">` es el entry point que Vite procesa.

**`package.json`** — Dependencias. Scripts principales: `npm run dev` (Vite HMR en puerto 5173), `npm run build` (build producción), `npm run preview` (servir build local).

**`vite.config.js`** — Configura Vite con:
- Plugins: React, Tailwind CSS v4
- Alias `@/` → `src/`
- Proxy para desarrollo: `/auth/*`, `/api/users/*`, `/api/roles/*`, `/api/permissions/*` → `localhost:8080`; `/api/projects/*`, `/api/wallet/*`, `/api/dashboard/*` → `localhost:8081`
- WebSocket config para HMR
- Soporte para GitHub Codespaces

### 5.2 Entry Point: `src/main.jsx`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AppProviders } from '@/providers'
import { AppRouter } from '@/router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
)
```

**Qué hace:** Monta la app en el DOM. El orden de nesting es importante:
- `StrictMode` → detecta problemas (solo dev)
- `BrowserRouter` → maneja las URLs del navegador sin recargar
- `AppProviders` → QueryClient + AuthProvider + Toaster
- `AppRouter` → todas las rutas

### 5.3 Estilos globales: `src/index.css`

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/geist";

@custom-variant dark (&:is(.dark *));

@keyframes shimmer {
  100% { transform: translateX(100%); }
}

@theme inline {
  --font-sans: 'Geist Variable', sans-serif;
  --color-sidebar-ring: var(--sidebar-ring);
  /* ... todas las variables CSS del tema shadcn/ui ... */
}

.dark {
  /* Variables de color para dark mode */
  --background: oklch(0.145 0 0);
  --card: oklch(0.18 0.005 285);
  --primary: oklch(0.922 0 0);
  /* ... */
}
```

**Qué hace:**
- Importa Tailwind CSS v4 con la sintaxis `@import`
- Define variante `dark` para oscuro
- Declara la animación `shimmer` (para loading skeletons)
- Usa `@theme inline` para definir variables CSS personalizadas (sidebar, chart, border-radius)
- El bloque `.dark` define la paleta oscura completa usando OKLCH
- El `@layer base` aplica estilos globales: `border-border`, `antialiased`

### 5.4 Librerías (`lib/`)

#### `src/lib/api-client.js` — El corazón de la comunicación HTTP

```js
const STORAGE_KEYS = {
  TOKEN: 'tokenIDEAFY',
  REFRESH_TOKEN: 'refreshTokenIDEAFY',
  USER_ID: 'userIdIDEAFY',
}
```

Define las claves de `sessionStorage`. Se usa `sessionStorage` (no `localStorage`) para que los tokens se borren al cerrar la pestaña.

```js
class ApiClientError extends Error {
  constructor(message, status, fieldErrors) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}
```

Error personalizado que propaga `status` HTTP y `fieldErrors` (para errores de validación del backend). Las páginas capturan `err.message` y lo muestran en toasts.

**Refresh token con deduplicación:**

```js
let isRefreshing = false
let refreshPromise = null

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null

  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) { clearStoredAuth(); return null }

  const data = await response.json()
  setStoredTokens(data.accessToken, data.refreshToken)
  return data.accessToken
}
```

El patrón `isRefreshing` / `refreshPromise` asegura que si 5 requests fallan con 401 simultáneamente, solo **una** hace el refresh y las otras 4 esperan esa misma promesa y reusan el token nuevo.

**Manejo de query params:**

```js
const queryParams = options.params
  ? '?' + Object.entries(options.params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
  : ''
```

Los parámetros se serializan manualmente. Filtra valores `undefined` para no enviar parámetros vacíos al backend.

**Error parsing:**

```js
async function parseErrorResponse(response) {
  try {
    const body = await response.json()
    if (typeof body === 'object' && body !== null) {
      const hasFieldErrors = Object.values(body).some(v => typeof v === 'string')
      if (hasFieldErrors && !body.error) {
        return new ApiClientError('Error de validación', response.status, body)
      }
      return new ApiClientError(body.error || 'Error desconocido', response.status)
    }
  } catch {}
  return new ApiClientError(`Error ${response.status}`, response.status)
}
```

Si el backend devuelve un objeto como `{ email: "Email inválido" }`, lo interpreta como error de validación (fieldErrors). Si devuelve `{ error: "mensaje" }`, usa el mensaje. Esto permite mostrar errores específicos por campo.

### 🤔 ¿POR QUÉ estas decisiones en api-client?

**¿Por qué `sessionStorage` y no `localStorage`?** Por seguridad. `sessionStorage` se borra automáticamente al cerrar la pestaña. Si un atacante obtiene acceso al navegador (ej: XSS), los tokens no persisten después de que el usuario cierra la pestaña. `localStorage` deja los tokens ahí hasta que el usuario cierra sesión explícitamente.

**¿Por qué `isRefreshing` / `refreshPromise` (deduplicación)?** Porque si el frontend hace 5 requests simultáneas y el token expira, recibirías 5 errores 401 al mismo tiempo. Sin deduplicación, harías 5 llamadas a `/auth/refresh`. Con la deduplicación, solo la primera request inicia el refresh, y las otras 4 esperan la misma promesa. Esto evita race conditions y llamadas innecesarias al backend.

**¿Por qué una clase `ApiClientError` personalizada en lugar de lanzar el error de fetch directamente?** Porque necesitamos propagar más información que solo el mensaje: el `status` HTTP (para saber si fue 401, 403, 422) y `fieldErrors` (para mostrar errores específicos por campo en formularios). Si lanzáramos el error de fetch crudo, cada página tendría que parsear el error por separado.

**¿Por qué filtramos `undefined` en los query params?** Para no enviar parámetros vacíos al backend. Si un filtro no está seteado (`undefined`), no queremos que el backend reciba `?estado=undefined` o `?page=undefined`. El backend podría romperse o ignorarlo, pero es más limpio no enviarlo.

#### `src/lib/utils.js` — Utilidades

```js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

`cn()` es el utility más usado en todo el proyecto. Combina clases condicionales y resuelve conflictos de Tailwind (ej: `bg-red-500` + `bg-blue-500` → gana la última). Se usa en casi todos los componentes para `className`.

```js
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
```

Usa `Intl.NumberFormat` con locale argentino y USD. No usa librerías externas.

```js
export function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}
```

Decodifica el payload de un JWT sin verificar firma (solo lectura). Se usa en `callback.jsx` y `complete-profile.jsx` para leer `userId` y `roles` del token.

#### `src/lib/project-constants.jsx` — Constantes y componente de dominio

```jsx
export const statusVariants = {
  PREPARACION: 'info',
  FINANCIAMIENTO: 'success',
  EJECUCION: 'warning',
  FINALIZADO: 'default',
  CANCELADO: 'error',
}
```

Mapea cada estado de proyecto a una variante visual de `StatusBadge`. Se usa en `project-card.jsx` y `[id].jsx`.

```jsx
export function FundingProgress({ raised, required, compact }) {
  if (!required) return null
  const percent = raised ? Math.min(Math.round((raised / required) * 100), 100) : 0
  return (
    <div className="space-y-1">
      {/* Versión compacta (tarjeta) vs normal (detalle) */}
      <div className={`h-1.5 bg-white/5 rounded-full overflow-hidden`}>
        <div className="bg-gradient-to-r from-violet-500 to-emerald-500 ..."
             style={{ width: `${percent}%` }} />
      </div>
      <div>
        <span>{raised ? formatCurrency(raised) : '$ 0'}</span>
        <span>{formatCurrency(required)}</span>
      </div>
    </div>
  )
}
```

**Qué hace:** Renderiza una barra de progreso con gradiente violeta→esmeralda. Tiene dos modos:
- `compact`: para `project-card.jsx` (más pequeña, sin label)
- Normal: para `[id].jsx` (con label "Progreso de financiamiento")

Usa `style={{ width: '...%' }}` para animar con CSS transition (`duration-700 ease-out`).

### 5.5 Configuración: `src/config/api.js`

```js
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8080');
const PROJECT_API_BASE = isDev ? '' : (import.meta.env.VITE_PROJECT_API_URL || 'http://localhost:8081');

const buildUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
const buildProjectUrl = (endpoint) => `${PROJECT_API_BASE}${endpoint}`;
```

En desarrollo (`import.meta.env.DEV` es true), las URLs base son vacías → el proxy de Vite maneja el ruteo. En producción, usa las variables de entorno de Vercel.

```js
export const API_ENDPOINTS = {
  AUTH_LOGIN: buildUrl('/auth/login'),
  AUTH_REGISTER: buildUrl('/auth/register'),
  USERS: buildUrl('/api/users'),
  USER_BY_ID: (id) => buildUrl(`/api/users/${id}`),
  USER_ROLE: (userId, roleId) => buildUrl(`/api/users/${userId}/roles/${roleId}`),
  PROJECTS_CATALOG: buildProjectUrl('/api/projects/catalog'),
  PROJECT_BY_ID: (id) => buildProjectUrl(`/api/projects/${id}`),
  PROJECT_INVEST: (id) => buildProjectUrl(`/api/projects/${id}/invest`),
  WALLET_SUMMARY: buildProjectUrl('/api/wallet/summary'),
  DASHBOARD_STATS: buildProjectUrl('/api/dashboard/stats'),
  // ... más endpoints
}
```

**Patrón clave:** Todos los endpoints están centralizados como constantes/funciones. Esto asegura consistencia y facilita cambios. Un endpoint con parámetro como `PROJECT_BY_ID(id)` se usa así en hooks: `apiRequest(API_ENDPOINTS.PROJECT_BY_ID(id))`.

### 🤔 ¿POR QUÉ estas decisiones en la config?

**¿Por qué centralizar todos los endpoints en un solo archivo?** Porque:
   - **Un solo lugar para cambiar**: si el backend cambia una ruta, solo tocas `api.js`
   - **Consistencia**: no hay URLs hardcodeadas en páginas/hooks
   - **Descubrimiento**: cualquier desarrollador puede ver todos los endpoints disponibles en un archivo
   - **Type-safety mental**: las funciones con parámetros (ej: `PROJECT_BY_ID(id)`) te obligan a pasar el ID correcto

**¿Por qué dos funciones (`buildUrl` y `buildProjectUrl`) en lugar de una sola?** Porque hay dos backends independientes en puertos distintos. En desarrollo, Vite redirige con proxy según el path. En producción, cada backend tiene su propia URL (`VITE_API_URL` para auth, `VITE_PROJECT_API_URL` para proyectos). Tener dos funciones deja claro a qué backend apunta cada endpoint.

**¿Por qué en desarrollo las URLs base son vacías (`''`)?** Porque Vite maneja el ruteo mediante proxy configurado en `vite.config.js`. El navegador nunca ve `localhost:8080` o `localhost:8081` — ve solo `localhost:5173` (Vite). Vite redirige `/auth/*` al 8080 y `/api/projects/*` al 8081. Esto evita CORS en desarrollo.

### 5.6 Estado Global: `src/stores/auth-store.js`

```js
import { create } from 'zustand'
import { STORAGE_KEYS } from '@/lib/api-client'

export const useAuthStore = create((set) => ({
  token: sessionStorage.getItem(TOKEN),
  refreshToken: sessionStorage.getItem(REFRESH_TOKEN),
  user: null,
  isAuthenticated: !!sessionStorage.getItem(TOKEN),
  roles: [],
  permissions: [],
  sidebarOpen: true,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setAuth: (token, refreshToken, user, roles, permissions) => {
    sessionStorage.setItem(TOKEN, token)
    sessionStorage.setItem(REFRESH_TOKEN, refreshToken)
    sessionStorage.setItem(USER_ID, String(user.id))
    set({ token, refreshToken, user, isAuthenticated: true, roles, permissions })
  },

  logout: () => {
    sessionStorage.removeItem(TOKEN)
    sessionStorage.removeItem(REFRESH_TOKEN)
    sessionStorage.removeItem(USER_ID)
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false, roles: [], permissions: [] })
  },
}))
```

**Qué hace:** Store global de Zustand con dos slices:
- **Auth slice**: `token`, `user`, `roles`, `permissions`, `isAuthenticated`. Las acciones `setAuth`, `logout`, `setUser` sincronizan automáticamente con `sessionStorage`.
- **UI slice**: `sidebarOpen`, `toggleSidebar`, `setSidebarOpen` — estado del menú lateral.

El hook `usePermissions()` deriva permisos:

```js
export function usePermissions() {
  const roles = useAuthStore((s) => s.roles)
  const isAdmin = roles.includes('ADMIN')
  const isCreator = roles.includes('CREATOR')
  const isInvestor = roles.includes('INVESTOR')
  const can = (permission) => isAdmin || permissions.includes(permission)
  return { isAdmin, isCreator, isInvestor, can, roles, permissions }
}
```

**Patrón:** `can()` da acceso total a ADMIN aunque no tenga el permiso específico.

### 🤔 ¿POR QUÉ estas decisiones en el store?

**¿Por qué Zustand en vez de React Context para el estado de auth?** Porque:
- **Rendimiento**: Context re-renderiza TODOS los hijos cuando cambia cualquier valor. Zustand solo re-renderiza los componentes que se suscriben a la slice que cambió.
- **Simplicidad**: No necesitas un Provider para Zustand (el store es un hook directo). Con Context tendrías que crear `AuthContext.Provider` en `auth-provider.jsx` y consumirlo con `useContext`.
- **Sin boilerplate**: No hay actions, reducers, dispatchers. Solo `set()`.

**¿Por qué sincronizar con `sessionStorage` en `setAuth()` y `logout()`?** Para que el estado sobreviva a recargas de página. Si el usuario recarga la página, React se monta de nuevo y Zustand pierde el estado. Pero `sessionStorage` conserva el token. El `useEffect` en `auth-provider.jsx` lee el token al montar la app y lo restaura.

**¿Por qué `permissions` como array de strings y no como objeto?** Porque es más simple de checkear: `permissions.includes('investment:read')` en vez de `permissions.investment?.read === true`. Además el backend los devuelve como array.

**¿Por qué `can()` da acceso total a ADMIN?** Porque los administradores tienen acceso a TODO, incluso a funcionalidades que no tienen un permiso específico. Es más simple que asignarle cada permiso nuevo al rol ADMIN manualmente.

### 5.7 Providers (`providers/`)

#### `src/providers/index.jsx`

```jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,    // 30s antes de refetch
      retry: 1,              // 1 reintento automático
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        const message = error?.message || 'Error inesperado'
        toast.error(message)  // toast global para errores de mutations
      },
    },
  },
})
```

**Qué hace:** Configura TanStack Query globalmente. `staleTime: 30_000` significa que los datos se consideran frescos por 30 segundos. `onError` en mutations muestra un toast automático para errores no capturados.

```jsx
<Toaster
  position="bottom-right"
  richColors
  closeButton
  theme="dark"
  toastOptions={{
    style: {
      background: '#0a0f1a',
      border: '1px solid rgba(255,255,255,0.05)',
      color: '#e2e8f0',
    },
  }}
/>
```

Configura el sistema de notificaciones `sonner` con tema oscuro y estilos consistentes.

### 🤔 ¿POR QUÉ estas decisiones en providers?

**¿Por qué `staleTime: 30_000` (30 segundos)?** Porque los datos del backend (proyectos, usuarios) no cambian tan seguido. 30 segundos es un balance entre frescura de datos y evitar llamadas innecesarias a la API. Si un usuario navega de proyectos a dashboard y vuelve a proyectos en menos de 30s, usa la caché.

**¿Por qué `retry: 1` en queries?** Porque los errores de red suelen ser temporales (ej: el backend está reiniciándose). Un reintento automático resuelve la mayoría de los casos. Pero no más de 1 reintento porque si el backend está realmente caído, no queremos saturarlo.

**¿Por qué `onError` global en mutations?** Para no tener que escribir `try/catch` en cada mutation. Si cualquier mutation falla, muestra un toast automático. Las páginas pueden sobrescribir esto si necesitan manejo especial, pero en la mayoría de los casos el toast es suficiente.

**¿Por qué sonner en vez de react-hot-toast / react-toastify?** Porque sonner es más chico, más moderno, tiene animaciones nativas con CSS (no JS), y soporta richColors (para errores rojos, éxito verde) sin config extra. Lo usa shadcn/ui por defecto.

#### `src/providers/auth-provider.jsx`

```jsx
const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

Expone el hook `useAuth()` que provee `login`, `register`, `logout`, `isLoading`, `needsProfile`.

```jsx
const needsProfile = isAuthenticated && !roles.some(r => ['INVESTOR', 'CREATOR', 'ADMIN'].includes(r))
```

Deriva si el usuario necesita completar perfil (recién registrado por OAuth2, sin roles asignados).

```jsx
const login = async (data) => {
  const res = await apiRequest(API_ENDPOINTS.AUTH_LOGIN, {
    method: 'POST',
    body: data,
  })
  setStoredTokens(res.accessToken, res.refreshToken)
  setStoredUserId(res.userId)
  useAuthStore.setState({
    token: res.accessToken,
    refreshToken: res.refreshToken,
    isAuthenticated: true,
    roles: res.roles,
    permissions: res.permissions,
  })
  await fetchUser()
}
```

**Flujo de login:**
1. POST a `/auth/login` con `{ email, password }`
2. Guarda tokens en sessionStorage
3. Actualiza store de Zustand (dispara re-renders)
4. Fetch del perfil completo del usuario

El `useEffect` en mount verifica si hay token en sessionStorage y si es así, carga el usuario automáticamente (recarga de página).

### 🤔 ¿POR QUÉ este diseño de auth?

**¿Por qué `fetchUser()` separado del login?** Porque el login devuelve `{ accessToken, refreshToken, userId, roles, permissions }` pero NO el perfil completo del usuario (name, email, enabled, createdAt). Necesitamos un segundo llamado a `GET /api/users/{userId}` para obtener esos datos. Es una decisión del backend.

**¿Por qué `needsProfile` deriva de roles vacíos?** Porque un usuario registrado con OAuth2 (Google) no tiene roles asignados todavía. Debe elegir entre "Inversor" o "Creador" en la página `/completar-perfil` antes de acceder al dashboard. Si no deriváramos `needsProfile`, el usuario entraría al dashboard sin roles y no podría hacer nada (ni ver proyectos, ni invertir).

**¿Por qué el `useEffect` en mount restaura la sesión?** Porque al recargar la página, React se monta de nuevo y Zustand pierde el estado en memoria. Pero `sessionStorage` conserva el token. El efecto lee el token, lo pone en el store, y fetchea el usuario. Sin esto, el usuario tendría que loguearse cada vez que recarga la página.

### 5.8 Router: `src/router/index.jsx`

**Lazy loading de páginas:**

```jsx
const LoginPage = lazy(() => import('@/pages/auth/login'))
const ProjectCatalogPage = lazy(() => import('@/pages/projects/index'))
// ...
```

Cada página se carga solo cuando se navega a ella. Mientras carga, se muestra `<PageSkeleton />`.

**Guards de navegación:**

```jsx
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated)
    return <Navigate to="/" state={{ from: location }} replace />
  return <>{children}</>
}

function GuestRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const roles = useAuthStore((s) => s.roles)
  if (isAuthenticated && roles.some(r => ['INVESTOR', 'CREATOR', 'ADMIN'].includes(r)))
    return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AdminRoute({ children }) {
  const roles = useAuthStore((s) => s.roles)
  if (!roles.includes('ADMIN'))
    return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
```

- `ProtectedRoute`: Si no hay sesión → redirige a `/` guardando la ubicación actual en `state.from`
- `GuestRoute`: Si ya hay sesión con roles válidos → redirige a `/dashboard`
- `AdminRoute`: Si no es ADMIN → redirige a `/dashboard`

**Estructura de rutas:**

```jsx
<Routes>
  {/* Rutas públicas (GuestRoute) */}
  <Route path="/" element={<GuestRoute><LoginPage /></GuestRoute>} />
  <Route path="/registro" element={<GuestRoute><RegisterPage /></GuestRoute>} />
  <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
  <Route path="/completar-perfil" element={<ProtectedRoute><CompleteProfilePage /></ProtectedRoute>} />

  {/* Rutas protegidas con DashboardLayout */}
  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<LazyPage Component={DashboardPage} />} />
    <Route path="/proyectos" element={<LazyPage Component={ProjectCatalogPage} />} />
    <Route path="/proyectos/crear" element={<LazyPage Component={ProjectEditorPage} />} />
    <Route path="/proyectos/:id/editar" element={<LazyPage Component={ProjectEditorPage} />} />
    <Route path="/proyectos/:id" element={<LazyPage Component={ProjectDetailPage} />} />
    <Route path="/perfil" element={<Navigate to="/configuracion" replace />} />
    <Route path="/configuracion" element={<LazyPage Component={SettingsPage} />} />
    {/* Admin */}
    <Route path="/admin/usuarios" element={<AdminRoute><LazyPage Component={AdminUsersPage} /></AdminRoute>} />
    <Route path="/admin/roles" element={<AdminRoute><LazyPage Component={AdminRolesPage} /></AdminRoute>} />
  </Route>

  {/* Catch-all */}
  <Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
```

Las rutas anidadas bajo `DashboardLayout` usan `<Outlet />` para renderizar la página activa dentro del layout. Las transiciones entre páginas usan `AnimatePresence` + `motion.div` en `dashboard-layout.jsx`.

### 5.9 Hooks (`hooks/`)

Cada hook encapsula la lógica de TanStack Query para una entidad. Siguen un patrón consistente.

### 🤔 ¿POR QUÉ este patrón de hooks?

**¿Por qué queryKeys con estructura jerárquica (`userKeys.all`, `userKeys.lists()`, `userKeys.detail(id)`)?** Para poder invalidar queries con precisión quirúrgica:
   - `invalidateQueries({ queryKey: userKeys.lists() })` → invalida SOLO las listas, no los detalles
   - `invalidateQueries({ queryKey: userKeys.all })` → invalida TODO (listas + detalles)
   Sin esta jerarquía, tendrías que saber las keys exactas o usar `invalidateQueries({ queryKey: ['users'] })` que invalida todo.

**¿Por qué `onSuccess: invalidateQueries` en mutations?** Porque después de crear/editar/eliminar un recurso, los datos en caché están desactualizados. Invalida las queries relacionadas para que TanStack Query las refetchee automáticamente. Si no invalidáramos, la UI mostraría datos viejos hasta el próximo refetch (30 segundos después).

**¿Por qué `useWalletSummary` usa polling (`refetchInterval: 30_000`)?** Porque el wallet puede cambiar sin que el usuario haga nada (el scheduler del backend actualiza estados de proyectos, llegada de sub-tokens, etc.). El polling asegura que la UI esté actualizada sin requerir que el usuario refresque manualmente.

**¿Por qué `staleTime: 10_000` en el wallet es menor que el global (30_000)?** Porque queremos que el wallet se considere "viejo" más rápido (10s) y el polling (30s) lo refresque. Si staleTime fuera 30s como el global, el polling de 30s no tendría efecto porque los datos nunca se considerarían viejos.

#### `src/hooks/use-users.js`

```js
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (page) => [...userKeys.lists(), page],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
  me: () => [...userKeys.all, 'me'],
}
```

**Patrón queryKeys:** Estructura jerárquica que permite invalidar grupos específicos. `userKeys.lists()` invalida todas las listas, `userKeys.detail(id)` invalida un detalle específico.

```js
export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.USERS, { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  })
}
```

**Patrón mutation:** Después de crear un usuario, invalida las queries de listas para que se recarguen.

#### `src/hooks/use-roles.js`

```js
export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) =>
      apiRequest(API_ENDPOINTS.ROLES, { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
      toast.success('Rol creado exitosamente')
    },
  })
}
```

Similar a users, pero además muestra toast de éxito.

#### `src/hooks/use-projects.js`

```js
function mapProjectFormToApi(formData) {
  const apiData = {
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    montoRequerido: formData.montoRequerido,
  }
  if (formData.plazo != null) apiData.plazo = formData.plazo
  if (formData.gobernanzaComunidad != null) apiData.gobernanzaComunidad = formData.gobernanzaComunidad
  if (formData.cupoMaximoTokens != null) apiData.cupoMaximoTokens = formData.cupoMaximoTokens
  if (formData.valorNominalToken != null) apiData.valorNominalToken = formData.valorNominalToken
  return apiData
}
```

**Mapper:** Transforma datos del formulario al formato que espera la API. Solo incluye campos opcionales si tienen valor, evitando enviar `null` o `undefined`.

```js
export function useProjects(filters = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: async () => {
      const params = { page: filters.page ?? 0, size: filters.size ?? 10 }
      if (filters.estado) params.estado = filters.estado
      if (filters.search) params.search = filters.search
      return await apiRequest(API_ENDPOINTS.PROJECTS_CATALOG, { params })
    },
  })
}
```

**Filtros como queryKey:** Los filtros forman parte de la key de caché. Si el usuario cambia el filtro de estado, TanStack Query crea una nueva entrada de caché automáticamente.

```js
export function useWalletSummary() {
  return useQuery({
    queryKey: ['wallet', 'summary'],
    queryFn: () => apiRequest(API_ENDPOINTS.WALLET_SUMMARY),
    refetchInterval: 30_000,  // polling cada 30s
    staleTime: 10_000,        // 10s hasta considerar stale
  })
}
```

**Polling:** El wallet se actualiza automáticamente cada 30 segundos mediante `refetchInterval`.

### 5.10 Páginas — Auth

#### `src/pages/auth/login.jsx`

```jsx
const onSubmit = async (e) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)
  setLoading(true)
  setError('')
  try {
    await login({ email: formData.get('email'), password: formData.get('password') })
    navigate('/dashboard')
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
  } finally {
    setLoading(false)
  }
}
```

Usa `FormData` del DOM nativo (no librería de formularios). El error se captura y muestra en el layout via `AuthLayout`.

```jsx
const handleGoogleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/oauth2/authorization/google`
}
```

OAuth2 con Google: redirección directa al backend de auth, que luego redirige al frontend en `/oauth2/callback?token=...`.

#### `src/pages/auth/register.jsx`

Similar a login pero:
- Campo adicional `name`
- Muestra pantalla de éxito animada (`motion.div`) después del registro
- No loguea automáticamente (el usuario debe ir a login)

#### `src/pages/auth/callback.jsx`

```jsx
useEffect(() => {
  const token = searchParams.get('token')
  const errorParam = searchParams.get('error')

  if (errorParam) { setError('Error al autenticar con Google'); return }
  if (!token) { setError('Parámetros de autenticación inválidos'); return }

  const payload = JSON.parse(atob(token.split('.')[1]))
  setStoredTokens(token, '')
  if (payload.userId) setStoredUserId(payload.userId)

  useAuthStore.setState({
    token, isAuthenticated: true, user: null,
    roles: payload.roles || [],
    permissions: payload.permissions || [],
  })
  navigate('/dashboard', { replace: true })
}, [searchParams, navigate])
```

**Qué hace:** Lee el token JWT de la URL (enviado por el backend OAuth2), lo decodifica con `atob()`, extrae `userId`, `roles` y `permissions`, guarda todo y redirige al dashboard. Si el usuario no tiene roles asignados, es redirigido a `/completar-perfil` por el AuthProvider (`needsProfile`).

#### `src/pages/auth/complete-profile.jsx`

```jsx
const handleSelectRole = async (role) => {
  const payload = JSON.parse(atob(token.split('.')[1]))
  const userId = payload.userId
  const roleId = role === 'INVESTOR' ? 3 : 2

  await apiRequest(API_ENDPOINTS.USER_ROLE(userId, roleId), { method: 'POST' })
  clearStoredAuth()
  window.location.href = '/'
}
```

**Qué hace:** Ofrece dos tarjetas para elegir rol (Inversor → roleId=3, Creador → roleId=2). Asigna el rol vía `POST /api/users/{id}/roles/{roleId}`, limpia la auth y redirige al login para que el usuario inicie sesión de nuevo con el rol asignado.

### 5.11 Páginas — Dashboard

#### `src/pages/dashboard/dashboard.jsx`

```jsx
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isCreator } = usePermissions()

  const { data: projectsData } = useProjects({ page: 0, size: 100 })
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiRequest(API_ENDPOINTS.DASHBOARD_STATS),
    staleTime: 30_000, retry: 1,
  })
```

Usa `useQuery` directamente (sin hook personalizado) para `DASHBOARD_STATS`. La query key `['dashboard', 'stats']` es simple porque solo hay un dashboard.

**StatCard con animación:**

```jsx
function StatCard({ title, value, change, icon: Icon, trend, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="rounded-xl border border-white/5 bg-card p-5"
    >
      ...
    </motion.div>
  )
}
```

Cada card aparece con un pequeño delay escalonado (`index * 0.05`) para un efecto de cascada.

**Actividad reciente:**

```jsx
const recentActivity = useMemo(() => {
  const projects = Array.isArray(projectsData?.content) ? projectsData.content : []
  if (!projects.length) return []
  return projects.slice(0, 5).map((p, i) => ({
    id: p.id || i,
    type: i === 0 ? 'project_created' : i === 1 ? 'investment' : 'status_change',
    title: p.titulo,
    description: p.estado === 'FINANCIAMIENTO'
      ? `Buscando inversión - ${formatCurrency(p.montoRequerido)}`
      : p.estado === 'EJECUCION' ? 'Proyecto en ejecución'
      : `Estado: ${p.estado}`,
    timestamp: p.createdAt || p.updatedAt || new Date().toISOString(),
  }))
}, [projectsData])
```

Deriva actividad reciente de los proyectos (no hay endpoint específico de actividad). Mapea los 5 proyectos más recientes a un formato de timeline.

### 5.12 Páginas — Projects

#### `src/pages/projects/index.jsx` — Catálogo

```jsx
const STATUS_OPTIONS = [
  { value: 'PREPARACION', label: 'Preparación' },
  { value: 'FINANCIAMIENTO', label: 'Financiamiento' },
  // ...
]

const SORT_OPTIONS = [
  { value: 'reciente', label: 'Más reciente' },
  { value: 'monto-mayor', label: 'Mayor monto' },
  // ...
]
```

Define opciones de filtros como arrays de constantes al nivel del módulo.

**Filtrado client-side vs servidor:**

```jsx
const { data, isLoading, isError, refetch } = useProjects({
  search, estado: statusFilter || undefined, page: 0, size: 500,
})
const proyectos = data?.content || []

const proyectosFiltrados = useMemo(() => {
  let result = proyectos
  if (vista === 'mis-proyectos' && usuarioId)
    result = result.filter((p) => p.creadorId === usuarioId)
  if (montoRange) {
    const [min, max] = montoRange.split('-')
    if (min) result = result.filter((p) => (p.montoRequerido ?? 0) >= Number(min))
    if (max) result = result.filter((p) => (p.montoRequerido ?? 0) <= Number(max))
  }
  if (gobernanzaOnly)
    result = result.filter((p) => p.gobernanzaComunidad === true)
  result = [...result].sort((a, b) => {
    // ordenamiento según sortBy
  })
  return result
}, [proyectos, vista, usuarioId, montoRange, gobernanzaOnly, sortBy])
```

**Patrón híbrido:** Search y estado se envían al backend (servicio de catálogo). Vista, rango de monto, gobernanza y ordenamiento se filtran/ordenan en cliente sobre los resultados (porque el backend no soporta esos filtros).

### 🤔 ¿POR QUÉ filtrado híbrido (servidor + cliente)?

**¿Por qué no enviar todos los filtros al backend?** Porque el backend de catálogo (`GET /api/projects/catalog`) solo soporta filtros por `estado`, `search`, `page` y `size`. Los filtros adicionales (vista "mis proyectos", rango de monto, gobernanza, ordenamiento) no están implementados del lado del servidor. En lugar de esperar a que el backend los agregue, filtramos en cliente. Es una solución pragmática.

**¿Por qué no filtrar todo en cliente?** Porque la búsqueda por texto (`search`) y el filtro por estado son más eficientes en el backend (SQL `WHERE` con índices). Si trajéramos todos los proyectos y filtráramos en cliente, la página sería lenta con cientos de proyectos.

**¿Por qué el mismo componente para crear y editar un proyecto?** Porque el formulario es casi idéntico. La diferencia es:
   - Crear: `POST /api/projects` con datos vacíos
   - Editar: `PUT /api/projects/{id}` con datos precargados
   React Router maneja ambas rutas con el mismo componente. `useParams().id` detecta si estamos en modo edición y carga los datos iniciales.

**Estados de UI:**

```jsx
{isError ? (
  <ErrorState onRetry={() => refetch()} />
) : isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
  </div>
) : proyectosFiltrados.length === 0 ? (
  <EmptyState
    title="No hay proyectos"
    description="Ningún proyecto coincide con los filtros..."
    action={puedeCrear ? { label: 'Crear proyecto', to: '/proyectos/crear' } : undefined}
  />
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {proyectosFiltrados.map((p) => <ProjectCard key={p.id} project={p} isCreator={p.creadorId === usuarioId} />)}
  </div>
)}
```

Cuatro estados cubiertos: error → `ErrorState`, loading → `CardSkeleton`, vacío → `EmptyState`, datos → grid de `ProjectCard`.

#### `src/pages/projects/[id].jsx` — Detalle

```jsx
function InvestDialog({ open, onOpenChange, projectId, projectTitle, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInvest = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Ingresá un monto válido')
      return
    }
    setLoading(true)
    try {
      await apiRequest(API_ENDPOINTS.PROJECT_INVEST(projectId), {
        method: 'POST', params: { amount: Number(amount) },
      })
      toast.success('Inversión realizada con éxito')
      setAmount('')
      onOpenChange(false)
      onSuccess?.()  // Refetch de proyecto
    } catch (e) {
      toast.error(e?.message || 'Error al procesar la inversión')
    } finally {
      setLoading(false)
    }
  }
```

**Diálogo de inversión:** Componente local (no reutilizable). POST con `params` (query params, no body). Tras éxito, llama a `onSuccess` que es `refetch` del proyecto para actualizar `FundingProgress`.

**StatusActions — Transición de estados:**

```jsx
{isCreator && project.estado === 'PREPARACION' && (
  <Button onClick={() => onTransition('FINANCIAMIENTO')}>
    Publicar — Inicia financiamiento
  </Button>
)}
{isCreator && project.estado === 'FINANCIAMIENTO' && (
  <Button onClick={() => onTransition('EJECUCION')}>
    Iniciar ejecución
  </Button>
)}
{isCreator && project.estado === 'EJECUCION' && (
  <Button onClick={() => onTransition('FINALIZADO')}>
    Finalizar
  </Button>
)}
{project.estado !== 'CANCELADO' && project.estado !== 'FINALIZADO' && (
  <Button onClick={() => onTransition('CANCELADO')} variant="outline">
    Cancelar
  </Button>
)}
```

Cada estado muestra los botones de transición válidos. La función `transitionTo` usa `useUpdateProjectStatus()` (mutation) y luego refetch.

#### `src/pages/projects/project-editor.jsx`

```jsx
export default function ProjectEditorPage() {
  const { id } = useParams()
  const projectId = id ? Number(id) : null
  const isEdit = !!projectId

  const { data: project, isLoading } = useProject(projectId)
  const createProject = useCreateProject()
  const updateProject = useUpdateProject(projectId)

  const handleSubmit = async (data) => {
    if (isEdit) {
      const p = await updateProject.mutateAsync(data)
      navigate(`/proyectos/${projectId}`)
    } else {
      const p = await createProject.mutateAsync(data)
      navigate(`/proyectos/${p.id}`)
    }
  }
```

La misma ruta (`/proyectos/crear` y `/proyectos/:id/editar`) usa el mismo componente. Detecta si está en modo edición por la presencia de `:id`. En modo edición carga el proyecto existente y pasa `defaultValues` a `ProjectForm`.

### 5.13 Páginas — Settings

#### `src/pages/settings/settings.jsx`

```jsx
const SECTIONS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'security', label: 'Seguridad', icon: Shield },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'api', label: 'API Keys', icon: Key },
]
```

Navegación por secciones con sidebar en desktop (`hidden md:flex`) y tabs horizontales en mobile (`flex md:hidden`).

**WalletPanel:**

```jsx
function WalletPanel() {
  const { data, isLoading, isError, dataUpdatedAt } = useWalletSummary()
  const balances = data?.balances ?? {}
  const portfolio = data?.portfolio ?? []
  // ...
}
```

Muestra saldos IDEA/USDT + portfolio de subtokens. Usa `dataUpdatedAt` de TanStack Query para mostrar "Actualizado HH:MM". `refetchInterval: 30_000` en el hook mantiene los datos frescos.

### 🤔 ¿POR QUÉ `dataUpdatedAt`?

**¿Por qué mostrar "Actualizado 14:32" en lugar de solo los datos?** Porque el wallet tiene polling cada 30 segundos. El usuario necesita saber si los datos son de hace 2 segundos o de hace 5 minutos (si la pestaña estuvo en segundo plano). `dataUpdatedAt` es un timestamp que TanStack Query provee gratis indicando cuándo se actualizaron los datos por última vez.

**Cambio de contraseña:**

```jsx
const handlePasswordSubmit = async (e) => {
  e.preventDefault()
  await apiRequest(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
    method: 'POST',
    body: { currentPassword, newPassword },
  })
}
```

Usa `apiRequest` directo (no mutation) porque es una acción puntual sin caché.

### 5.14 Páginas — Admin

#### `src/pages/admin/users.jsx`

```jsx
import {
  getCoreRowModel, getPaginationRowModel, useReactTable, createColumnHelper,
} from '@tanstack/react-table'
```

Usa `@tanstack/react-table` para la tabla de usuarios. Define columnas con `createColumnHelper`:

```jsx
const columns = useMemo(() => [
  columnHelper.accessor('name', {
    header: 'Nombre',
    cell: (info) => <span className="text-white font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: (info) => <span className="text-slate-400">{info.getValue()}</span>,
  }),
  columnHelper.accessor('roles', {
    header: 'Roles',
    cell: (info) => (
      <div className="flex gap-1 flex-wrap">
        {info.getValue()?.map((role) => (
          <StatusBadge key={role} variant={...}>{role}</StatusBadge>
        ))}
      </div>
    ),
  }),
  // ...
], [users, roles, assignRole, revokeRole, updateUser])
```

**Responsive:** Desktop usa `DataTable` (oculto en `< md`), mobile usa `MobileUserCard` (visible solo en `< md`). Cada card tiene toggle de habilitado, editar, y selector de roles.

**Asignación de roles en línea:**

```jsx
<Select onValueChange={(roleName) => {
  const role = roles?.find((r) => r.name === roleName)
  if (role) {
    if (userRoles.includes(roleName))
      revokeRole.mutate({ userId: user.id, roleId: role.id })
    else
      assignRole.mutate({ userId: user.id, roleId: role.id })
  }
}}>
```

Toggle de roles: si el usuario ya tiene el rol, lo revoca; si no, lo asigna. Todo inline sin recargar la página.

#### `src/pages/admin/roles.jsx`

```jsx
const ROLE_COLORS = {
  ADMIN: { badge: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-500' },
  CREATOR: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  INVESTOR: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
}
```

Cada rol tiene colores consistentes en toda la UI.

**RoleCard expandible:**

```jsx
function RoleCard({ role, permissions, expanded, onToggle, onEdit, onDelete, onTogglePermission }) {
  return (
    <div className="rounded-xl border ...">
      {/* Header: nombre, descripción, acciones */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {/* Lista de permisos con checkboxes */}
            {permissions.map((perm) => {
              const has = rolePerms.includes(perm.name)
              return (
                <button onClick={() => onTogglePermission(role.id, perm.id, has)}>
                  <div className={`w-4 h-4 rounded border ${has ? 'bg-emerald-500 border-emerald-500' : 'border-white/10'}`}>
                    {has && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span>{perm.name}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

Usa `AnimatePresence` + `motion.div` para animar la expansión/contracción de permisos. La altura se anima con `height: 0` → `height: 'auto'`.

**Toggle de permisos:**

```jsx
const togglePermission = (roleId, permissionId, has) => {
  if (has) revokePermission.mutate({ roleId, permissionId })
  else assignPermission.mutate({ roleId, permissionId })
}
```

Inline: click en un permiso lo asigna o revoca inmediatamente. El `isPending` deshabilita todos los toggles mientras se procesa.

### 5.15 Componentes — Layout

#### `components/layout/dashboard-layout.jsx`

```jsx
export function DashboardLayout() {
  const location = useLocation()
  const sidebarOpen = useAuthStore((s) => s.sidebarOpen)
  const toggleSidebar = useAuthStore((s) => s.toggleSidebar)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar collapsed={!sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onLogout={handleLogout} />
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
```

**Estructura:** Flexbox horizontal con sidebar (izquierda) y contenido (derecha). `h-screen` ocupa toda la altura. `overflow-hidden` en el contenedor y `overflow-auto` en `<main>` permite scroll solo del contenido.

**Transición de páginas:** `AnimatePresence mode="wait"` espera a que la animación de salida termine antes de animar la entrada. `key={location.pathname}` cambia por cada ruta.

### 🤔 ¿POR QUÉ estas decisiones en el layout?

**¿Por qué `AnimatePresence mode="wait"` con fade + slide?** Para que la navegación entre páginas se sienta fluida en vez de un "corte" abrupto. `mode="wait"` evita que dos páginas estén montadas al mismo tiempo (la que sale y la que entra), lo que podría causar problemas de focus o scroll. El fade + slide (opacity + y) es sutil pero notorio.

**¿Por qué `key={location.pathname}` en lugar de un `key` estático?** Para que React detecte que cambió la ruta y remonte la página. Sin el `key`, React no desmontaría la página anterior y la animación de entrada/salida no funcionaría porque `AnimatePresence` detecta cambios de hijos por su `key`.

**¿Por qué sidebar responsive con overlay en mobile y collapsible en desktop?** Porque en pantallas chicas no hay espacio para un sidebar fijo. Un overlay drawer (que se superpone al contenido) es el patrón estándar en mobile. En desktop, el sidebar siempre visible con opción de colapsar a iconos da más espacio al contenido sin perder navegación.

**¿Por qué `window.innerWidth < 768` para cerrar el sidebar en mobile?** Porque al hacer clic en un link del sidebar en mobile, debería cerrarse automáticamente. No podemos usar un media query de CSS porque necesitamos la lógica en JS. 768px es el breakpoint `md` de Tailwind.

**¿Por qué `overflow-hidden` en el contenedor y `overflow-auto` en `<main>`?** Para que el sidebar (que también tiene `h-screen`) no scrollee independientemente del contenido. El scroll solo ocurre en el área de contenido, no en el sidebar ni en el header.

#### `components/layout/sidebar.jsx`

```jsx
const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

const adminNav = [
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/roles', label: 'Roles', icon: KeyRound },
]
```

Define la navegación como datos, no como JSX repetido.

**Responsive:**

```jsx
<aside className={cn(
  'h-screen bg-sidebar border-r ...',
  'fixed inset-y-0 left-0 md:relative',
  collapsed ? '-translate-x-full' : 'translate-x-0',
  'md:translate-x-0',  // siempre visible en desktop
  collapsed ? 'w-16' : 'w-60',
)}>
```

- **Mobile (`< md`)**: Overlay drawer que se desliza desde la izquierda. El backdrop (`bg-black/60`) cierra al clickear.
- **Desktop (`≥ md`)**: Siempre visible. Ancho colapsado (60px) o expandido (240px).

**NavItem con cierre automático en mobile:**

```jsx
const handleClick = () => {
  if (window.innerWidth < 768) setSidebarOpen(false)
}
```

Cierra el menú al navegar en mobile.

### 5.16 Componentes — Shared

#### `components/shared/data-table.jsx`

```jsx
export function DataTable({ table, columns, loading }) {
  return (
    <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          {/* Header: flexRender de columnas */}
          {/* Body: rows con flexRender de celdas */}
        </table>
      </div>
      {/* Scroll hint gradient en mobile */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent md:hidden" />
      {/* Paginación */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span>Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => table.setPageIndex(0)}><ChevronsLeft /></Button>
            <Button onClick={() => table.previousPage()}><ChevronLeft /></Button>
            <Button onClick={() => table.nextPage()}><ChevronRight /></Button>
            <Button onClick={() => table.setPageIndex(table.getPageCount() - 1)}><ChevronsRight /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

Componente genérico de tabla que recibe la instancia de `useReactTable`. Maneja:
- **Loading**: 5 filas de esqueleto con anchos aleatorios
- **Vacío**: mensaje "No hay datos disponibles"
- **Responsive**: scroll horizontal con hint gradient en mobile
- **Paginación**: botones primero/anterior/siguiente/último

### 🤔 ¿POR QUÉ estas decisiones en componentes compartidos?

**¿Por qué `DataTable` recibe la instancia de `useReactTable` en lugar de los datos crudos?** Porque separa la lógica de tabla (ordenamiento, paginación, selección de filas) de la presentación. `@tanstack/react-table` es headless — solo maneja el estado y la lógica. `DataTable` se encarga de renderizar el HTML, los skeletons, y la paginación. Si mañana cambiamos de librería de tablas, solo toca el componente que crea la instancia, no `DataTable`.

**¿Por qué `MobileUserCard` como fallback en mobile en vez de hacer la tabla responsive con CSS?** Porque las tablas con muchas columnas (nombre, email, roles, acciones) no se adaptan bien a pantallas chicas. Mostrar filas como cards apiladas es más legible en mobile que una tabla con scroll horizontal.

**¿Por qué toggle de roles inline (click → asigna/revoca) y no un diálogo separado?** Porque hace el flujo más rápido para el administrador. Un selector de roles inline permite ver qué roles tiene el usuario y cambiarlos sin abrir un modal, buscar el usuario de nuevo, etc. Es una optimización de UX para tareas repetitivas.

**¿Por qué los permisos se expanden/contraen con animación en lugar de mostrar todo siempre?** Porque algunos roles pueden tener 20+ permisos. Mostrarlos todos expandidos saturaría la UI. La animación de altura (`height: 0` → `height: 'auto'`) con `AnimatePresence` hace que la expansión sea fluida.

**¿Por qué `ROLE_COLORS` como objeto de constantes?** Para mantener consistencia visual. ADMIN siempre en rojo, CREATOR siempre en ámbar, INVESTOR siempre en esmeralda. Si estuviera hardcodeado en cada lugar que se renderiza un rol, sería fácil que un desarrollador nuevo use otro color.

#### Componentes Shared pequeños

**`search-input.jsx`** — Input de búsqueda con icono de lupa. Props: `value`, `onChange`, `placeholder`, `containerClassName`.

**`status-badge.jsx`** — Badge con variantes: `success` (emerald), `error` (red), `warning` (amber), `info` (blue), `default` (slate).

**`confirm-dialog.jsx`** — Diálogo de confirmación genérico. Props: `title`, `description`, `confirmLabel`, `variant` ('destructive' | 'default'), `onConfirm`, `loading`, `open`.

**`error-state.jsx`** — Mensaje de error con botón "Reintentar". Props: `onRetry`, `message`.

**`empty-state.jsx`** — Estado vacío con título, descripción y acción opcional (link). Props: `title`, `description`, `action` (opcional: `{ label, to }`).

**`loading-skeleton.jsx`** — Skeletons para estados de carga. Exporta: `Skeleton`, `CardSkeleton`, `TableSkeleton`, `StatSkeleton`, `PageSkeleton`. Usan la animación `shimmer` de `index.css`.

### 5.17 Componentes — Features

#### `features/auth/auth-layout.jsx`

```jsx
export function AuthLayout({ error, children }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dots decorativos con CSS radial-gradient */}
      <div className="fixed inset-0 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)',
                    backgroundSize: '24px 24px' }} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-6xl font-bold">IDEAFY</h1>
        <p className="text-sm text-slate-500">Tokenización de activos digitales</p>

        <div className="rounded-xl border border-white/5 bg-card p-6 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2.5"
            >
              {error}
            </motion.div>
          )}
          {children}
        </div>
      </motion.div>
    </main>
  )
}
```

**Qué hace:** Layout compartido para login y register. Fondo con puntos decorativos (dos capas de radial-gradient con diferentes tamaños). Card contenedor semi-transparente con `bg-card`. El error aparece con animación de altura.

#### `features/projects/project-card.jsx`

```jsx
export function ProjectCard({ project, isCreator }) {
  return (
    <Link to={`/proyectos/${project.id}`} className="group relative rounded-xl border border-white/5 bg-card hover:border-violet-500/20 transition-all duration-300">
      {/* Glow effect en hover */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100" />

      <div className="flex-1 p-5 flex flex-col gap-3">
        <StatusBadge>{statusLabels[project.estado]}</StatusBadge>
        <h3 className="text-base font-semibold text-white group-hover:text-violet-300">{project.titulo}</h3>
        <p className="text-sm text-slate-400 line-clamp-2">{project.descripcion}</p>

        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-slate-500">Monto</p>
            <p className="text-sm font-semibold text-emerald-300">{formatCurrency(project.montoRequerido)}</p>
          </div>
          {hasTokens && (
            <div>
              <p className="text-[10px] text-slate-500">Token</p>
              <p className="text-sm font-medium text-slate-200">{formatCurrency(project.valorNominalToken)}</p>
            </div>
          )}
          {project.plazo && (
            <div className="ml-auto">
              <p className="text-[10px] text-slate-500">Plazo</p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" /> {formatDate(project.plazo)}
              </div>
            </div>
          )}
        </div>

        {hasProgress && <FundingProgress raised={project.montoRecaudado} required={project.montoRequerido} compact />}
      </div>

      <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2">
        <span className="text-xs text-slate-500">Ver detalle</span>
        {isCreator && (
          <Link to={`/proyectos/${project.id}/editar`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon"><SquarePen /></Button>
          </Link>
        )}
      </div>
    </Link>
  )
}
```

**Qué hace:** Tarjeta clickeable (todo el Link). Muestra estado, título, descripción (truncada 2 líneas), métricas, progreso de funding. El glow superior solo aparece en hover. El botón de editar solo para el creador, con `stopPropagation` para evitar navegar al detalle.

#### `features/projects/project-form.jsx`

```jsx
const projectSchema = z.object({
  cupoMaximoTokens: z.coerce.number().int().min(1, 'Debe emitirse al menos 1 token').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  valorNominalToken: z.coerce.number().min(0.01, 'El valor nominal debe ser mayor a 0').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
})
```

Usa **Zod** solo para validar los campos de token (son opcionales y requieren transformación). El resto del formulario usa validación HTML5 nativa (`required`, `type`, `min`, `maxLength`).

```jsx
const form = useForm({
  resolver: zodResolver(projectSchema),
  defaultValues: { titulo: '', descripcion: '', montoRequerido: undefined, ... },
})
```

Usa `react-hook-form` con el resolver de Zod. Los campos se renderizan con los componentes `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` del sistema de shadcn/ui.

**Cálculo en vivo:**

```jsx
const [supply, setSupply] = useState(defaultValues?.cupoMaximoTokens ?? '')
const [price, setPrice] = useState(defaultValues?.valorNominalToken ?? '')
const total = (Number(supply) || 0) * (Number(price) || 0)

// En el JSX:
{supply && price && (
  <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-4">
    <span className="text-lg font-bold text-violet-200">{formatCurrency(total)}</span>
    <span className="text-xs text-slate-500">= {supply} tokens × {formatCurrency(price)}</span>
  </div>
)}
```

Mientras el usuario escribe cupo y valor nominal, muestra el cálculo en vivo de capital total.

#### `features/projects/entity-form-dialog.jsx`

```jsx
const CONFIG = {
  role: {
    nameLabel: 'Nombre del rol',
    namePlaceholder: 'Ej: MODERATOR',
    nameClass: '',
    descriptionPlaceholder: 'Describe el propósito del rol',
  },
  permission: {
    nameLabel: 'Nombre del permiso',
    namePlaceholder: 'Ej: project:delete',
    nameClass: 'font-mono text-sm',  // Los permisos se muestran en monoespaciada
    descriptionPlaceholder: 'Describe qué acción autoriza este permiso',
  },
}
```

**Config-driven:** El mismo componente sirve para crear/editar roles y permisos. La configuración define labels, placeholders y estilos específicos para cada tipo.

---

## 6. Ruteo y navegación

### 🤔 ¿POR QUÉ estas decisiones en el router?

**¿Por qué lazy loading con `React.lazy()`?** Para que el bundle inicial sea chico. Si importáramos todas las páginas al inicio, el usuario descargaría código de páginas que quizás nunca visita (admin, settings, etc.). Con lazy loading, cada página se descarga solo cuando se navega a ella. Vite además separa cada `import()` en un chunk individual.

**¿Por qué guards (ProtectedRoute, GuestRoute, AdminRoute) y no lógica inline en cada página?** Porque la responsabilidad de "quién puede acceder a esta ruta" es del router, no de la página. Si cada página verificara su propia autenticación,:
   - Habría código repetido en cada página
   - La página se cargaría (y quizás haría fetch de datos) antes de redirigir
   - Sería fácil olvidarse de la verificación en una página nueva
Los guards envuelven las rutas en el router y redirigen antes de que la página se monte.

**¿Por qué `state.from` en ProtectedRoute?** Para redirigir al usuario a la página que intentaba acceder después de que inicie sesión. Si el usuario intentó ir a `/proyectos/5` sin estar logueado, después del login va directo a `/proyectos/5` en vez de al dashboard.

**¿Por qué LazyPage wrapper en lugar de usar `<Suspense>` directamente?** Para centralizar el fallback de loading. Si usáramos `<Suspense>` en cada ruta, habría que repetir el `<PageSkeleton />` en cada una. `LazyPage` lo maneja en un solo lugar.

**¿Por qué el catch-all redirige a `/dashboard` y no muestra 404?** Porque en una SPA, el 404 no tiene sentido — es más amigable redirigir al dashboard. Además, como todas las rutas están protegidas, un catch-all que muestre 404 estaría fuera del DashboardLayout y se vería sin sidebar/header.

### 6.1 Mapa de navegación

```
/ (Login)
├── /registro (Register)
├── /oauth2/callback (OAuth2 Callback)
├── /completar-perfil (Complete Profile)
│
└── [DashboardLayout] (requiere auth)
    ├── /dashboard
    ├── /proyectos
    │   ├── /proyectos/crear
    │   ├── /proyectos/:id
    │   └── /proyectos/:id/editar
    ├── /configuracion
    │   └── (antes /perfil redirige aquí)
    └── [AdminRoute] (requiere ADMIN)
        ├── /admin/usuarios
        └── /admin/roles
```

### 6.2 Guards

- **GuestRoute**: Si el usuario ya está autenticado con roles válidos, redirige a `/dashboard`
- **ProtectedRoute**: Si no hay sesión, redirige a `/` guardando `state.from`
- **AdminRoute**: Verifica rol ADMIN; si no, redirige a `/dashboard`

---

## 7. Autenticación y estados globales

### 7.1 Almacenamiento de tokens

| Storage | Clave | Uso |
|---------|-------|-----|
| `sessionStorage` | `tokenIDEAFY` | JWT de acceso |
| `sessionStorage` | `refreshTokenIDEAFY` | Token de refresco |
| `sessionStorage` | `userIdIDEAFY` | ID del usuario |

Se usa `sessionStorage` (no `localStorage`) por seguridad — los tokens no persisten al cerrar el navegador.

### 7.2 Proceso de refresh

1. Request falla con 401
2. `apiRequest()` detecta el 401
3. Si `!isRefreshing` → inicia refresh; si ya hay uno → espera la promesa existente
4. Si refresh exitoso → guarda nuevo token → reintenta request original
5. Si falla → `clearStoredAuth()` → `window.location.href = '/'`

### 7.3 Zustand store

```js
{
  user: { id, name, email, enabled, createdAt } | null,
  token: string | null,
  refreshToken: string | null,
  roles: string[],
  permissions: string[],
  isAuthenticated: boolean,
  sidebarOpen: boolean,
}
```

El hook `usePermissions()` expone: `{ isAdmin, isCreator, isInvestor, can, roles, permissions }`.

---

## 8. Comunicación con backends

### 8.1 Configuración de endpoints

Todos los endpoints están centralizados en `config/api.js` dentro del objeto `API_ENDPOINTS`. Cada endpoint es una función flecha o constante de tipo:

```js
AUTH_LOGIN: buildUrl('/auth/login'),                       // → '' + '/auth/login'
PROJECT_BY_ID: (id) => buildProjectUrl(`/api/projects/${id}`),  // → '/api/projects/5'
```

### 8.2 Proxy de desarrollo

En `vite.config.js`:

| Ruta del frontend | Backend destino |
|------------------|----------------|
| `/auth/*` | `localhost:8080` |
| `/api/users/*` | `localhost:8080` |
| `/api/roles/*` | `localhost:8080` |
| `/api/permissions/*` | `localhost:8080` |
| `/api/projects/*` | `localhost:8081` |
| `/api/wallet/*` | `localhost:8081` |
| `/api/dashboard/*` | `localhost:8081` |

### 8.3 Producción

```js
const API_BASE_URL = isDev ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8080');
const PROJECT_API_BASE = isDev ? '' : (import.meta.env.VITE_PROJECT_API_URL || 'http://localhost:8081');
```

En producción, VITE_API_URL y VITE_PROJECT_API_URL se configuran como variables de entorno en Vercel.

---

## 9. Relación entre archivos

### 9.1 Dependencias por capa

```
pages/ ← uses → hooks/           ← uses → lib/api-client.js
                    ↕                     ↕
pages/ ← uses → config/api.js     lib/utils.js
                    ↕
pages/ ← uses → components/
                    ↕
pages/ ← uses → stores/auth-store.js
                    ↕
pages/ ← uses → lib/project-constants.jsx

router/ ← uses → pages/ (lazy)
router/ ← uses → stores/auth-store.js (guards)
router/ ← uses → components/layout/

main.jsx → providers/ → providers/auth-provider.jsx → stores/auth-store.js
main.jsx → router/
```

### 9.2 Ejemplo: flujo de "Ver catálogo de proyectos"

```
1. Usuario navega a /proyectos
2. Router (router/index.jsx) detecta ruta → renderiza ProjectCatalogPage (lazy)
   → Suspense muestra <PageSkeleton /> mientras carga
3. ProjectCatalogPage llama a useProjects({ estado, search, page: 0, size: 500 })
4. useProjects usa apiRequest(API_ENDPOINTS.PROJECTS_CATALOG, { params })
   → API_ENDPOINTS.PROJECTS_CATALOG = buildProjectUrl('/api/projects/catalog')
   → buildProjectUrl() devuelve '/api/projects/catalog' (en dev, por proxy)
5. apiRequest construye headers con JWT de sessionStorage → fetch
6. Vite proxy redirige a localhost:8081/api/projects/catalog
7. Backend responde con JSON → TanStack Query cachea con key ['projects','list',{filters}]
8. ProjectCatalogPage procesa data?.content con useMemo (filtros client-side)
9. Renderiza: stats (3 cards) + filtros (barra de búsqueda, selects) + grid de ProjectCard
10. Cada ProjectCard muestra FundingProgress si project.montoRecaudado != null
```

---

## 10. Estilos y tema

### 🤔 ¿POR QUÉ estas decisiones de estilo?

**¿Por qué solo dark mode y no light/dark toggle?** Porque el diseño está pensado para dark desde el principio. Un toggle implicaría mantener dos paletas de colores completas (~60 variables CSS cada una). Para una app de gestión interna, dark mode es más que suficiente y es el estándar en herramientas para desarrolladores.

**¿Por qué OKLCH y no HEX/RGB/HSL?** Porque OKLCH es un espacio de color perceptualmente uniforme. Cambiar `luminosidad` en OKLCH produce un cambio visual consistente, a diferencia de HSL donde el mismo cambio se ve diferente según el color. Es el estándar moderno (shadcn/ui lo usa). Además permite crear paletas análogas cambiando solo el hue (`h`).

**¿Por qué Geist Variable como tipografía?** Porque es la fuente de Vercel (donde deployamos), es moderna, tiene buen soporte de caracteres latinos, y la versión variable permite pesos infinitos sin descargar múltiples archivos. Es chica (~200KB variable vs ~1MB para todas las variantes fijas).

**¿Por qué valores de border-radius escalonados (0.375rem → 1.125rem)?** Para tener una progresión visual consistente. Los componentes pequeños (badges, inputs) usan `sm`, los medianos (cards, diálogos) usan `lg`, los grandes (modales) usan `xl`. Es el sistema de shadcn/ui.

### Esquema de colores

- **Modo**: solo dark mode (clase `dark` en `<html>`)
- **Fondo**: `bg-background` → `oklch(0.145 0 0)` (slate 950)
- **Cards**: `bg-card` → `oklch(0.18 0.005 285)` (slate 900/70) con bordes `border-white/5`
- **Texto primario**: `text-white`
- **Texto secundario**: `text-slate-400`
- **Acento**: `violet-600` para acciones principales, `indigo-500` para alternativas
- **Sidebar**: `bg-sidebar` → `oklch(0.15 0.005 270)`
- **Estados**: emerald (success), amber (warning), red (error), blue (info)

### Espaciado y tipografía

- **Fuente**: Geist Variable (`@fontsource-variable/geist`), sans-serif
- **Border radius**: sistema escalado desde `0.625rem`:
  - `sm`: 0.375rem, `md`: 0.5rem, `lg`: 0.625rem, `xl`: 0.875rem, `2xl`: 1.125rem
- **Animación shimmer**: 2s infinite, usada en skeletons

### Responsive design

- **Mobile first**: todos los diseños parten de mobile
- **Sidebar**: overlay drawer en mobile (`< md:`), inline collapsible en desktop
- **Tablas**: `DataTable` con scroll horizontal + gradient hint en mobile; `MobileUserCard` reemplaza en `< md`
- **Grids**: `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-3/4`
- **Settings**: sidebar vertical en desktop, tabs horizontales en mobile

### Accesibilidad SEO

- `lang="es"` en `<html>`
- Meta tags Open Graph (og:title, og:description, og:image, og:url, og:type) y Twitter Cards
- Secciones semánticas: `<section aria-label>`, `<article>`, `<aside>`, `<nav>`, `<main role="banner">`
- ARIA labels en botones de icono, sidebar, navegación
- `robots.txt` con Allow + referencia a sitemap.xml
- Jerarquía de headings (h1 → h2 → h3)
- `line-clamp-2` para descripciones truncadas
