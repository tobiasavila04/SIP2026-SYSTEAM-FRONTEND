# Integración Web3 — IDEAFY Frontend

## Documentación completa para desarrolladores

---

### 📖 Tabla de contenidos

1. [¿Qué es Web3 y por qué lo necesitamos?](#1-que-es-web3-y-por-que-lo-necesitamos)
2. [Conceptos básicos (para entender el código)](#2-conceptos-basicos)
3. [Stack tecnológico usado](#3-stack-tecnologico)
4. [Arquitectura general](#4-arquitectura-general)
5. [ETAPA 1: Setup de infraestructura Web3](#5-etapa-1-setup-de-infraestructura-web3)
6. [ETAPA 2: Conexión de wallet + mostrar saldo $IDEA](#6-etapa-2-conexion-de-wallet--mostrar-saldo-idea)
7. [ETAPA 3: Upgrade del diálogo de inversión con Web3](#7-etapa-3-upgrade-del-dialogo-de-inversion-con-web3)
8. [ETAPA 4: Mostrar hash de transacción](#8-etapa-4-mostrar-hash-de-transaccion)
9. [ETAPA 5: Página de historial de inversiones](#9-etapa-5-pagina-de-historial-de-inversiones)
10. [ETAPA 6: Indicadores de proyecto fallido y reembolso](#10-etapa-6-indicadores-de-proyecto-fallido-y-reembolso)
11. [Adaptación a cambios del backend](#11-adaptacion-a-cambios-del-backend)
12. [Resumen de archivos creados y modificados](#12-resumen-de-archivos)
13. [Diagrama de flujo completo](#13-diagrama-de-flujo-completo)

---

## 1. ¿Qué es Web3 y por qué lo necesitamos?

### 🤔 El problema

Imaginá que tenés una plataforma de financiamiento de proyectos (como IDEAFY). Cuando alguien quiere invertir, podría hacerlo de forma **tradicional (Web2)**:

```
Usuario → Frontend React → Backend Java (API) → Base de datos
```

Pero esto tiene un problema: **el dinero no está realmente en manos del usuario**. Todo pasa por el servidor de IDEAFY.

### 💡 La solución Web3 (lo que implementamos)

Usar **blockchain** para que:

1. El usuario tenga **control real de su dinero** en su wallet (MetaMask)
2. Las transacciones sean **públicas y verificables** en la blockchain (Sepolia testnet)
3. Los **smart contracts** (programas que corren en la blockchain) ejecuten la lógica de inversión sin que IDEAFY pueda manipularla

El flujo es:

```
Usuario → MetaMask → Smart Contract (InvestmentSwap) → Blockchain Sepolia
                                          ↓
                              Backend IDEAFY (para persistencia en BD)
```

### 🎯 ¿Qué cambió exactamente?

| Aspecto | Antes (Web2) | Ahora (Web3) |
|---------|-------------|--------------|
| Cómo invierte | POST a backend | Firma en MetaMask |
| Quién controla los tokens | El backend | La wallet del usuario |
| Dónde se ve la inversión | Solo en la app | En Etherscan (público) |
| Stack usado | fetch + API | wagmi + viem + RainbowKit |

**¿Por qué estos cambios?** No es porque "Web3 es mejor" en abstracto. Es porque el negocio de IDEAFY lo exige: los inversores ponen dinero real (o tokens con valor) y necesitan poder verificar que su inversión se registró sin depender de que el servidor de IDEAFY sea honesto. La blockchain garantiza que una vez que firmaste la transacción, nadie —ni IDEAFY— puede borrarla o modificarla. Eso es confianza sin intermediarios.

**¿Por qué Sepolia y no Ethereum mainnet?** Porque estamos en desarrollo. En mainnet cada transacción cuesta plata real (gas fee en ETH). En Sepolia es gratis (usamos ETH de faucet). Cuando la app esté lista para producción, se cambia la chain en `web3.ts` de `sepolia` a `mainnet` y listo.

**¿Por qué este stack en particular?** Porque es lo que usó el profesor en la Clase 3 (React + Ethereum) y es el estándar de la industria. No reinventamos la rueda: wagmi es usado por Uniswap, RainbowKit por decenas de dApps populares.

---

## 2. Conceptos básicos

> Si ya sabés qué es blockchain, wallet, smart contract, ABI, RPC — **saltá directo a la Etapa 1**.
> Si no, leé esta sección porque TODO el código de abajo asume que entendés estos conceptos.

### Blockchain

Es un **libro de cuentas público** compartido entre miles de computadoras en todo el mundo. Nadie es dueño de la blockchain. Cualquier persona puede:
- Leer los datos (transacciones, saldos)
- Escribir datos nuevos (enviar plata, ejecutar contratos)
- Verificar que los datos sean correctos

En nuestro caso usamos **Sepolia**, que es una blockchain de **prueba** (testnet). Es como un "simulacro" de Ethereum real. Usamos testnet porque:
- No cuesta plata real (las transacciones se pagan con ETH falso que se obtiene de un faucet)
- Podemos probar sin riesgo

### Smart Contract

Es un **programa** que vive en la blockchain. No lo ejecuta un servidor, lo ejecutan todos los nodos de la red simultáneamente. Una vez desplegado, no se puede modificar.

Nuestros contratos:
- **ProjectToken** (`0x9f2c766d...`): El token $IDEA. Funciona como una criptomoneda dentro de la plataforma.
- **InvestmentSwap** (`0x4c53728b...`): El contrato que maneja las inversiones. Tiene funciones como `invest` y `refund`.
- **USDC Mock** (`0x1c7D4B...`): Una versión de prueba de la stablecoin USDC.

### Wallet

Una wallet (billetera) es un programa que guarda **claves privadas** (como una contraseña súper segura) y permite firmar transacciones.

Nosotros usamos **MetaMask** como wallet. MetaMask:
- Se instala como extensión del navegador
- Crea una dirección de blockchain (ej: `0xabc123...def456`)
- Permite firmar transacciones (el usuario hace clic en "Confirmar" en MetaMask)
- Permite cambiar de red (mainnet, Sepolia, etc.)

### RPC (Remote Procedure Call)

Es el "teléfono" para hablar con la blockchain. Cuando nuestro frontend quiere saber el saldo de una wallet o ejecutar una función, llama a un nodo RPC. **Infura** y **Alchemy** son proveedores de nodos RPC.

**RainbowKit + wagmi** manejan todo esto automáticamente: configuran el proveedor RPC, manejan la conexión con MetaMask, firman transacciones, etc.

### ABI (Application Binary Interface)

Es el "manual de instrucciones" de un smart contract. Le dice a la app:
- Qué funciones tiene el contrato (`invest`, `refund`, `balanceOf`, etc.)
- Qué parámetros recibe cada función (números, direcciones, texto)
- Qué eventos emite (`Invested`, `Refunded`)

Sin el ABI, wagmi no sabe cómo llamar a las funciones del contrato. Por eso creamos `src/lib/abis.ts`.

### Allowance (Permiso)

En Ethereum, si el Contrato A quiere gastar tokens del Usuario B, el Usuario B primero debe **aprobar** (approve) al Contrato A. Esto se llama "allowance".

**Ejemplo concreto:**
1. Vos tenés 1000 $IDEA en tu wallet
2. Querés invertir 100 $IDEA en un proyecto
3. El smart contract InvestmentSwap necesita tomar 100 $IDEA de tu wallet
4. Primero: vos firmás un `approve(InvestmentSwap, 100)` (decís "che, está bien que este contrato saque 100 de mi cuenta")
5. Después: llamás a `invest(proyectoId, 100)` (el contrato saca los 100 y los registra)

El paso 4 solo se hace **una vez por monto**. Si ya aprobaste 100 y querés invertir 50 de nuevo, no necesás aprobar otra vez (porque 50 < 100).

### Wei vs Ether

En Ethereum, los montos se manejan en **wei** (la unidad más chiquita):
- 1 ether = 10^18 wei = 1,000,000,000,000,000,000 wei

Lo mismo pasa con $IDEA. Los smart contracts trabajan con **wei** (números enormes sin decimales). El frontend convierte:
- **Input**: el usuario escribe `100.50` (formato humano, con decimales)
- **Output**: `parseUnits("100.50", 18)` → `100500000000000000000n` (formato blockchain, BigInt)

La función `parseUnits` de viem hace esta conversión automáticamente.

---

## 3. Stack tecnológico

| Tecnología | Versión | ¿Qué hace? |
|-----------|---------|------------|
| **React** | 19 | Framework de UI |
| **Vite** | 8 | Build tool (compila el código) |
| **wagmi** | 2.19.5 | Hooks de React para blockchain (`useAccount`, `useReadContract`, `useWriteContract`) |
| **viem** | 2.50.4 | Cliente para Ethereum (maneja BigInt, formatea unidades, firma transacciones) |
| **RainbowKit** | 2.2.11 | UI de wallet (botón "Connect Wallet", selector de wallets, cambio de red) |
| **@wagmi/core** | (peer dep) | Funciones core de wagmi (`waitForTransactionReceipt`) |
| **@tanstack/react-query** | (ya instalado) | Cache y fetching de datos |

### 📦 Instalación

```bash
npm install wagmi@^2.19.5 viem@^2.50.4 @rainbow-me/rainbowkit@^2.2.11
```

Esto instala:
- `wagmi` → hooks de React para interactuar con la blockchain
- `viem` → utilidades para formatear montos, parsear ABIs, manejar BigInt
- `@rainbow-me/rainbowkit` → componentes UI listos para usar (ConnectButton, RainbowKitProvider)
- `@wagmi/core` → se instala automáticamente como dependencia de wagmi

### 📁 Variables de entorno

Agregamos estas variables a `.env` y `.env.example`:

```env
# La API del backend de proyectos (Gestion_de_proyectos-Systeam)
VITE_API_URL=http://localhost:8080

# WalletConnect Project ID (obligatorio para RainbowKit)
# Se obtiene de https://cloud.reown.com — crear proyecto → copiar ID
VITE_WC_PROJECT_ID=your_walletconnect_project_id

# Dirección del contrato ProjectToken ($IDEA) en Sepolia
VITE_IDEA_TOKEN_ADDRESS=0x9f2c766d0bd9bbb640422decdf0125be02c7d144

# Dirección del contrato InvestmentSwap en Sepolia
VITE_INVESTMENT_SWAP_ADDRESS=0x4c53728b0a625dE5C80bF0807265cA2b91F769fa

# Dirección del contrato USDC Mock en Sepolia (no usado actualmente)
VITE_USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

> **Importante**: `VITE_WC_PROJECT_ID` es obligatorio. Sin esto, RainbowKit no se conecta. Ir a https://cloud.reown.com, crear proyecto, copiar el Project ID.

---

## 4. Arquitectura general

### 📊 Diagrama de componentes

```
┌─────────────────────────────────────────────────────┐
│  AppProviders (src/providers/index.jsx)              │
│  ┌───────────────────────────────────────────────┐  │
│  │  WagmiProvider (config desde web3.ts)          │  │
│  │  ┌─────────────────────────────────────────┐   │  │
│  │  │  QueryClientProvider (react-query)       │   │  │
│  │  │  ┌───────────────────────────────────┐   │   │  │
│  │  │  │  RainbowKitProvider                │   │   │  │
│  │  │  │  ┌─────────────────────────────┐   │   │   │  │
│  │  │  │  │  AuthProvider               │   │   │   │  │
│  │  │  │  │  ┌───────────────────────┐  │   │   │   │  │
│  │  │  │  │  │  <App />              │  │   │   │   │  │
│  │  │  │  │  │  - Header (ConnectBtn)│  │   │   │   │  │
│  │  │  │  │  │  - Sidebar (WalletInfo)│  │   │   │   │  │
│  │  │  │  │  │  - Proyectos/[id].jsx  │  │   │   │   │  │
│  │  │  │  │  │    → InvestDialog      │  │   │   │   │  │
│  │  │  │  │  │    → RefundDialog      │  │   │   │   │  │
│  │  │  │  │  │  - Inversiones/        │  │   │   │   │  │
│  │  │  │  │  │    → History page      │  │   │   │   │  │
│  │  │  │  │  └───────────────────────┘  │   │   │   │  │
│  │  │  │  └─────────────────────────────┘   │   │   │  │
│  │  │  └───────────────────────────────────┘   │   │  │
│  │  └─────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 📡 ¿Cómo se comunican los componentes?

```
              ┌──────────┐
              │ MetaMask │ (wallet del usuario)
              └────┬─────┘
                   │ RPC (Infura/Alchemy)
                   ▼
     ┌─────────────────────────┐
     │  Blockchain Sepolia     │
     │  - ProjectToken ($IDEA) │
     │  - InvestmentSwap       │
     └────────┬────────────────┘
              │
    ┌─────────┴──────────┐
    ▼                    ▼
┌──────────┐      ┌──────────┐
│ wagmi    │      │ Backend  │
│ hooks    │      │ Java API │
│ (lectura │      │ (REST)   │
│ y firma) │      │          │
└──────────┘      └──────────┘
```

El frontend se comunica con **dos sistemas**:
1. **Blockchain** (vía wagmi + RPC): para leer balances, allowances, y firmar transacciones
2. **Backend Java** (vía fetch + API REST): para leer/escribir datos de la BD (proyectos, historial)

---

## 5. ETAPA 1: Setup de infraestructura Web3

### 📋 Historias de usuario

Esta etapa **no tiene** una HU específica. Es el prerrequisito técnico para todo lo demás.

### 🎯 ¿Qué hicimos?

1. Instalamos las dependencias (`wagmi`, `viem`, `@rainbow-me/rainbowkit`)
2. Creamos `src/lib/web3.ts` — configuración de wagmi + RainbowKit
3. Creamos `src/lib/abis.ts` — ABIs de los contratos
4. Modificamos `src/providers/index.jsx` — envolvemos la app con los providers de Web3
5. Actualizamos `.env` y `.env.example` — variables de entorno Web3

### 🤔 ¿POR QUÉ cada cosa? (Explicación detallada)

**1. ¿Por qué instalamos estas 3 dependencias y no otras?**

| Dependencia | ¿Para qué sirve? | ¿Por qué la necesitamos? | ¿Qué pasa si no la instalamos? |
|-------------|------------------|--------------------------|-------------------------------|
| **wagmi** | Hooks de React para interactuar con Ethereum (`useAccount`, `useReadContract`, `useWriteContract`) | Necesitamos conectar React con la blockchain. Sin wagmi, tendríamos que usar `ethers.js` directamente y manejar estados manualmente (conectando/desconectado, loading/error, etc.) | No podríamos leer balances ni firmar transacciones desde React |
| **viem** | Cliente Ethereum ligero (maneja BigInt, parsea ABIs, formatea unidades como `parseUnits`/`formatUnits`) | wagmi usa viem internamente. Además necesitamos funciones como `formatUnits` para mostrar balances en formato humano | Las funciones de wagmi no funcionarían (es peer dependency). No podríamos convertir wei a ether |
| **@rainbow-me/rainbowkit** | Componentes UI listos para conectar wallet (ConnectButton, RainbowKitProvider) | No queremos diseñar un modal de "Connect Wallet" desde cero. RainbowKit ya tiene MetaMask, WalletConnect, Coinbase, etc. con una UI profesional | Tendríamos que implementar nosotros el botón de conexión, el selector de wallets, el manejo de errores de red, etc. — semanas de trabajo |
| **@tanstack/react-query** | (Ya estaba instalada) Cache y fetching de datos | wagmi la necesita internamente. Es la misma librería que ya usa la app, así que compartimos la misma instancia | Ya estaba instalada. Lo importante es que COMPARTIMOS la misma instancia en lugar de crear una separada |

**¿Cómo sabemos que `npm install` es el primer paso?** Porque no podemos importar nada que no esté en `package.json`. El proyecto ya existía con sus dependencias. Antes de escribir UNA sola línea de código Web3, necesitamos que el gestor de paquetes descargue wagmi, viem y RainbowKit. Es como querer construir una casa: primero comprás los ladrillos (npm install), después dibujás los planos (web3.ts, abis.ts), después construís (modificar providers, componentes).

**2. ¿Por qué crear `web3.ts` primero?** Porque es la base de TODO lo demás. Sin la configuración de wagmi, ningún otro componente Web3 funciona. Es como el cimiento de una casa: primero ponemos la config, después construimos arriba. La config define qué blockchain usar (Sepolia), qué Project ID de WalletConnect usar, qué conectores de wallet están disponibles.

**3. ¿Por qué crear `abis.ts`?** Sin ABIs, wagmi no sabe cómo llamar a las funciones de los contratos. Es como tener el número de teléfono de alguien pero no saber qué idioma habla. Las ABIs son el "diccionario" que le dice a wagmi: "la función `invest` recibe dos parámetros (uint256, uint256) y no devuelve nada". Los ABIs los define el equipo de backend que desplegó los contratos en Sepolia. Nosotros solo copiamos las funciones que necesita el frontend.

**4. ¿Por qué modificar `index.jsx` (providers)?** En React, si un componente necesita usar hooks como `useAccount`, debe estar DENTRO de `<WagmiProvider>`. Es como una antena de WiFi: si tu componente está fuera del rango de la antena, no recibe señal. Por eso envolvemos toda la app con WagmiProvider → RainbowKitProvider. El orden importa: WagmiProvider debe ser el más externo porque RainbowKitProvider necesita que wagmi ya esté configurado.

**5. ¿Por qué actualizar `.env`?** Porque:
- `VITE_WC_PROJECT_ID` es un secreto que no debe ir en el código (cada desarrollador tiene el suyo)
- Las direcciones de contratos (`VITE_IDEA_TOKEN_ADDRESS`, etc.) pueden cambiar si se redeployan los contratos
- Si hardcodeamos estos valores en el código, sería un dolor de cabeza cambiarlos después
- El prefijo `VITE_` es obligatorio: Vite solo expone las variables que empiezan con VITE_ al frontend

### 📄 Paso 1: Crear `src/lib/web3.ts`

Este archivo configura wagmi. Piensen en wagmi como un "puente" entre React y la blockchain.

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'

// getDefaultConfig() es una función de RainbowKit que crea la configuración
// completa de wagmi automáticamente: conectores de wallets, proveedores RPC, etc.
export const wagmiConfig = getDefaultConfig({
  appName: 'IDEAFY',                                 // Nombre de la app (se muestra en MetaMask)
  projectId: import.meta.env.VITE_WC_PROJECT_ID!,    // Project ID de WalletConnect (obligatorio)
  chains: [sepolia],                                  // Solo usamos Sepolia (testnet)
  ssr: false,                                         // Vite es Client-Side Rendering, no SSR
})
```

**Explicación línea por línea:**

| Código | ¿Qué hace? |
|--------|-----------|
| `getDefaultConfig({...})` | Crea la config completa: conectores, RPCs, cadenas |
| `appName: 'IDEAFY'` | Se muestra en MetaMask cuando la app pide conectar |
| `projectId: import.meta.env.VITE_WC_PROJECT_ID!` | ID de WalletConnect. El `!` le dice a TS "confiá, no es undefined" |
| `chains: [sepolia]` | Solo permitimos Sepolia. Si el usuario cambia a otra red, RainbowKit avisa |
| `ssr: false` | No usamos Server-Side Rendering (Vite es solo cliente) |

### 📄 Paso 2: Crear `src/lib/abis.ts`

Este archivo define las "instrucciones" de los smart contracts.

```typescript
// ERC20_ABI: Sirve para interactuar con cualquier token estándar ERC-20
// $IDEA es un ERC-20, por eso usamos este ABI para leer balances y allowances
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',     // 'view' = solo lectura (no gasta gas)
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable', // 'nonpayable' = modifica el estado (gasta gas)
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const

// INVESTMENT_SWAP_ABI: El contrato principal de inversiones
// Solo incluimos las funciones que el frontend necesita (invest, refund, etc.)
export const INVESTMENT_SWAP_ABI = [
  {
    type: 'function',
    name: 'invest',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proyectoId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'refund',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proyectoId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'crearTokenProyecto',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proyectoId', type: 'uint256' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'supplyInicial', type: 'uint256' },
    ],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'obtenerTokenDeProyecto',
    stateMutability: 'view',
    inputs: [{ name: 'proyectoId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'event',
    name: 'Invested',           // Evento que se emite cuando alguien invierte
    inputs: [
      { name: 'inversor', type: 'address', indexed: true },
      { name: 'proyectoId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Refunded',           // Evento que se emite cuando devuelven plata
    inputs: [
      { name: 'inversor', type: 'address', indexed: true },
      { name: 'proyectoId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const
```

**¿Por qué `as const`?** Esto le dice a TypeScript "esto es exactamente este objeto, no lo generalices". Sin `as const`, TypeScript inferiría los tipos como `string[]`. Con `as const`, sabe que `name` es literalmente `'balanceOf'`, que los inputs son exactamente esas tuplas, etc. Esto permite que wagmi haga **type-safety**: te va a marcar error si pasás mal los argumentos.

💡 **¿Cómo supe que esto funciona?** Porque lo vimos en la Clase 3 del profesor y en la documentación de wagmi. El patrón `as const` en ABIs es estándar en el ecosistema wagmi/viem. Si no lo ponés, TypeScript infiere tipos genéricos y perdés la ayuda del IDE (no te va a marcar si ponés mal un argumento).

**¿Por qué solo incluimos las funciones que usa el frontend?** Porque el ABI completo del InvestmentSwap podría tener 20+ funciones. Incluir todo es innecesario y hace el archivo más grande. Solo necesitamos: `invest` (para invertir), `refund` (para reembolsar), `crearTokenProyecto` y `obtenerTokenDeProyecto` (para el flujo de creación de proyectos). Las funciones que el frontend no llama no están en el ABI. Esto es normal: cada cliente incluye solo lo que necesita.

**¿Por qué incluimos eventos (`Invested`, `Refunded`) si el frontend no los escucha?** Porque es buena práctica tenerlos documentados. Si en el futuro queremos escuchar eventos en tiempo real (ej: "cuando alguien invierta, mostrar toast"), ya tenemos los ABIs listos.

### 📄 Paso 3: Modificar `src/providers/index.jsx`

Este es el cambio más importante. Los providers de React envuelven toda la app. Cada componente hijo puede usar los hooks de wagmi.

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'    // ← Importante: los estilos de RainbowKit
import { wagmiConfig } from '@/lib/web3'
import { AuthProvider } from './auth-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30 segundos antes de refetch
      retry: 1,                 // Reintentar 1 vez si falla
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        const message = error?.message || 'Error inesperado'
        toast.error(message)
      },
    },
  },
})

export function AppProviders({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>          {/* 1. Provee config wagmi */}
      <QueryClientProvider client={queryClient}>   {/* 2. React Query (lo usaba la app) */}
        <RainbowKitProvider>                       {/* 3. UI de RainbowKit */}
          <AuthProvider>                            {/* 4. Auth existente */}
            {children}
            <Toaster ... />
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

**ORDEN IMPORTANTE de los providers:**
1. `WagmiProvider` debe ser el más externo (necesita estar antes que RainbowKit)
2. `QueryClientProvider` va adentro (wagmi usa react-query internamente)
3. `RainbowKitProvider` va adentro de QueryClientProvider
4. `AuthProvider` (el nuestro) es el más interno

Antes los providers eran:
```
QueryClientProvider → AuthProvider
```

Ahora son:
```
WagmiProvider → QueryClientProvider → RainbowKitProvider → AuthProvider
```

**¿Por qué un solo QueryClient?** Porque wagmi necesita react-query para su caché interna. En lugar de tener dos QueryClients separados (uno para la app, otro para wagmi), usamos el mismo. La configuración de `staleTime: 30s` y `retry: 1` aplica tanto a las queries de la app como a las queries internas de wagmi.

**¿Cómo supe este orden?** Porque la documentación de RainbowKit lo especifica: "Wrap your app with WagmiProvider → QueryClientProvider → RainbowKitProvider". Si el orden es incorrecto, React lanza errores como "useContext() must be inside a WagmiProvider". Es un error común que se ve fácilmente en la consola del navegador.

**¿Por qué no crear un archivo separado `web3-provider.jsx`?** El plan original lo sugería, pero decidimos integrarlo directamente en `index.jsx` porque:
- Es menos archivos que mantener
- La lógica es simple: solo es agregar 2 providers (WagmiProvider, RainbowKitProvider)
- No hay lógica condicional ni configuración extra que justifique un archivo separado
- En el desarrollo ágil, a veces simplificamos la estructura cuando un componente es trivial

**¿Qué pasa con el `@rainbow-me/rainbowkit/styles.css` que se ve en el código?**
Inicialmente lo importamos, pero después lo sacamos. Razón: cuando se importan los estilos de RainbowKit, sobreescriben estilos globales de la app (colores, fuentes, spacing). Como la app ya tiene su propio diseño con Tailwind, los estilos de RainbowKit rompían el layout. La solución: importar solo los providers sin los estilos globales. RainbowKit igual funciona, solo que los componentes se renderizan con estilos mínimos que combinan mejor con el tema de la app.

### Archivos modificados en esta etapa

| Archivo | Tipo de cambio | ¿Qué cambió? |
|---------|---------------|--------------|
| `src/lib/web3.ts` | CREADO | Configuración de wagmi + RainbowKit con Sepolia |
| `src/lib/abis.ts` | CREADO | ABIs de los contratos (ERC20, InvestmentSwap) |
| `src/providers/index.jsx` | MODIFICADO | Se agregó WagmiProvider + RainbowKitProvider envolviendo la app |
| `.env` | MODIFICADO | Se agregaron vars VITE_WC_PROJECT_ID, VITE_IDEA_TOKEN_ADDRESS, etc. |
| `.env.example` | MODIFICADO | Lo mismo que `.env` para que otros desarrolladores sepan qué necesitan |
| `package.json` | MODIFICADO | Se agregaron las dependencias (npm install) |

### 🧪 Cómo verificar que funciona

```bash
npm run dev
```

Si no hay errores de compilación, la infraestructura Web3 está lista. Podés abrir la app y ver que no rompe nada.

---

## 6. ETAPA 2: Conexión de wallet + mostrar saldo $IDEA

### 📋 Historias de usuario

No tiene una HU específica, pero es el paso previo para HU-11 (inversión Web3).

### 🎯 ¿Qué hicimos?

1. Agregamos el botón `ConnectButton` de RainbowKit en el Header
2. Agregamos info de wallet + saldo $IDEA en el Sidebar

### 🤔 ¿POR QUÉ cada cosa?

**1. ¿Por qué el ConnectButton en el Header y no en el Sidebar?** Porque el Header es visible en TODAS las páginas sin importar el scroll. El usuario siempre ve el botón "Connect Wallet" arriba a la derecha, como en cualquier dApp profesional (Uniswap, Opensea, etc.). El Sidebar queda más abajo y puede estar colapsado. Es una convención de UX Web3.

**2. ¿Por qué `showBalance={false}` en el ConnectButton?** Porque el Header ya tiene varios elementos (notificaciones, logout). Mostrar el balance de ETH ahí lo saturaría visualmente. El balance lo mostramos en el Sidebar con más espacio y contexto.

**3. ¿Por qué leer el balance de $IDEA desde la blockchain (`useReadContract`) en lugar de desde el backend?** Porque:
   - El backend podría estar caído o desactualizado
   - La blockchain es la fuente de verdad del balance
   - `useReadContract` es solo lectura (no gasta gas, es instantáneo)
   - No necesitamos autenticación para leer balances on-chain
   - Si el usuario recibe $IDEA de otro lado (ej: otro proyecto que le devolvió plata), el balance se actualiza automáticamente sin depender del backend

**4. ¿Por qué también mostramos el balance de ETH?** Porque el usuario necesita ETH para pagar el gas de las transacciones (approve, invest, refund). Si no tiene ETH, no puede operar. Mostrarlo es una ayuda para que el usuario sepa si necesita fondos de un faucet.

**5. ¿Por qué `address.slice(0, 6)...{address.slice(-4)}`?** Mostrar la dirección completa (42 caracteres) ocupa demasiado espacio y no es legible. Truncarla a `0xabc1...ef56` es el estándar en todas las dApps. Los primeros 6 y últimos 4 caracteres son suficientes para identificar la wallet sin confusiones.

### 🔧 Header: `src/components/layout/header.jsx`

**Lo que cambió:** Se agregó el `ConnectButton` de RainbowKit en la barra superior, al lado del botón de notificaciones.

```jsx
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header({ onLogout }) {
  // ...código existente...

  return (
    <header ...>
      {/* ...lado izquierdo con botón toggle y nombre... */}
      
      <div className="flex items-center gap-2">
        {/* ✨ NUEVO: Botón de conexión de wallet */}
        <ConnectButton
          accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
          chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }}
          showBalance={false}
        />
        
        {/* Botón de notificaciones (existente) */}
        <Button ...>
          <Bell ... />
        </Button>
        
        {/* Botón de logout (existente) */}
        <Button ...>
          <LogOut ... />
        </Button>
      </div>
    </header>
  )
}
```

**Explicación de las props de `ConnectButton`:**

| Prop | Valor | ¿Qué hace? |
|------|-------|-----------|
| `accountStatus` | `{ smallScreen: 'avatar', largeScreen: 'full' }` | En pantallas chicas solo muestra el avatar, en grandes muestra address + avatar |
| `chainStatus` | `{ smallScreen: 'icon', largeScreen: 'full' }` | En chicas solo el ícono de la red, en grandes el nombre también |
| `showBalance` | `false` | No mostrar el balance de ETH nativo (para no saturar el Header) |

**¿Qué hace RainbowKit automáticamente por nosotros?**
- Cuando no hay wallet conectada: muestra botón "Connect Wallet" → al hacer clic abre modal con MetaMask, WalletConnect, etc.
- Cuando hay wallet conectada: muestra address truncada (`0xabc1...ef56`)
- Si la red no es Sepolia: muestra "Wrong network" con botón para cambiar
- Maneja los estados de conexión (conectando, conectado, desconectado, error)

### 🔧 Sidebar: `src/components/layout/sidebar.jsx`

**Lo que cambió:**
1. Se agregó el ítem "Inversiones" en la navegación principal
2. Se agregó un componente `WalletInfo` en la parte inferior del sidebar que muestra:
   - Dirección de la wallet conectada (truncada)
   - Balance de $IDEA (leído del contrato on-chain)
   - Balance de ETH (para pagar gas de transacciones)

```jsx
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { ERC20_ABI } from '@/lib/abis'

const IDEA_TOKEN_ADDRESS = import.meta.env.VITE_IDEA_TOKEN_ADDRESS

function WalletInfo({ collapsed }) {
  // useAccount() te dice qué wallet está conectada
  const { address, isConnected, chain } = useAccount()
  
  // useReadContract() lee datos del contrato SIN gastar gas (es 'view')
  // Lee el balance de $IDEA de la wallet conectada
  const { data: ideaBalance } = useReadContract({
    address: IDEA_TOKEN_ADDRESS,          // Dirección del contrato ProjectToken
    abi: ERC20_ABI,                       // ABI que define balanceOf
    functionName: 'balanceOf',            // Función a llamar
    args: address ? [address] : undefined, // Parámetro: la wallet del usuario
    query: { enabled: isConnected && !!address }, // Solo si hay wallet conectada
  })
  
  // También lee los decimals del token (para formatear el balance)
  const { data: decimals } = useReadContract({
    address: IDEA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: isConnected },
  })
  
  // useBalance() de wagmi lee el balance de ETH directamente
  const { data: ethBalance } = useBalance({ address })

  if (!isConnected || !address) return null  // No mostrar nada si no hay wallet

  // formatUnits convierte de wei a ether (o de la unidad más chica a la más grande)
  // Si decimals = 18, formatUnits(1000000000000000000n, 18) = "1.0"
  const formattedIdea = ideaBalance && decimals
    ? Number(formatUnits(ideaBalance, decimals)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '—'
  const formattedEth = ethBalance
    ? Number(formatUnits(ethBalance.value, ethBalance.decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })
    : '—'

  if (collapsed) return null  // Sidebar colapsado: no mostrar

  return (
    <div className="...">
      {/* Muestra la address truncada: 0xabc1...ef56 */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        <span className="text-xs text-slate-400 font-mono truncate">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
      
      {/* Balance de $IDEA */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider">$IDEA</span>
        <span className="text-sm font-semibold text-white">{formattedIdea}</span>
      </div>
      
      {/* Balance de ETH (para gas) */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider">
          {chain?.nativeCurrency?.symbol || 'ETH'}
        </span>
        <span className="text-sm font-semibold text-white">{formattedEth}</span>
      </div>
    </div>
  )
}
```

**¿Qué es `useReadContract`?**
Es un hook de wagmi que:
1. Toma una configuración: address del contrato, ABI, nombre de función, argumentos
2. Hace una llamada RPC de solo lectura (no gasta gas)
3. Devuelve `{ data, isLoading, isError, refetch }` igual que cualquier hook de react-query

**¿Qué es `useBalance`?**
Es un hook específico de wagmi para leer balances de ETH nativo (no tokens ERC-20). Es más simple que `useReadContract` porque no necesita ABI.

**¿Qué es `formatUnits`?**
Función de viem que convierte de la unidad más chica (wei) a la más grande (ether). Los contratos trabajan con wei internamente, los humanos con ether. `formatUnits("1000000000000000000", 18)` = `"1.0"`.

### 🧪 Cómo verificar

1. Abrir la app en el navegador
2. Ver el botón "Connect Wallet" en el Header
3. Hacer clic → se abre modal de RainbowKit
4. Conectar MetaMask (con Sepolia seleccionada)
5. Ver en el sidebar: dirección truncada + balance $IDEA + balance ETH

---

## 7. ETAPA 3: Upgrade del diálogo de inversión con Web3

### 📋 Historias de usuario

**HU-11**: "Como inversor, quiero invertir en un proyecto usando mi wallet y que los sub-tokens se asignen automáticamente."

### 🎯 ¿Qué hicimos?

Reemplazamos el `InvestDialog` anterior (que solo llamaba al backend) por uno que:
1. Lee el balance de $IDEA del usuario en la blockchain
2. Lee el allowance (permiso) que el usuario le dio al InvestmentSwap
3. Si no hay allowance suficiente → muestra paso "Approve" (firma en MetaMask)
4. Ejecuta la inversión en el smart contract (firma en MetaMask)
5. Espera la confirmación de la transacción en la blockchain
6. Avisa al backend para que guarde en BD
7. Muestra el hash de la transacción

### 🤔 ¿POR QUÉ este flujo?

**¿Por qué necesitamos approve antes de invest?** No es un capricho, es una regla de seguridad del estándar ERC-20. Imaginate: si cualquier contrato pudiera tomar tokens de tu wallet sin permiso, sería un desastre. Por eso el estándar ERC-20 exige que vos primero autorices al contrato (approve) y después el contrato pueda gastar (invest). Es como darle una tarjeta de crédito a alguien: primero la activás (approve), después puede comprar (invest).

**¿Por qué un modal con pasos (step) en lugar de un solo botón?** Porque el proceso tiene múltiples etapas que el usuario debe entender:
  - **idle**: el usuario ingresa el monto
  - **approving** (opcional): si necesita approve, se abre MetaMask
  - **investing**: se firma la inversión en MetaMask
  - **backend**: se guarda en el servidor
  - **done**: transacción completada
  Cada paso tiene su propia UI y feedback visual. Si fuera un solo botón, el usuario no sabría en qué etapa está ni si tuvo que approve o no.

**¿Por qué `waitForTransactionReceipt` después de firmar?** Porque cuando firmás en MetaMask, la transacción no está confirmada inmediatamente. MetaMask te devuelve el hash de la transacción apenas se envía a la red, pero la transacción puede tardar 12-30 segundos en incluirse en un bloque. Si no esperamos la confirmación y pasamos al siguiente paso, podríamos intentar `invest()` antes de que `approve()` se haya confirmado, y la transacción fallaría.

**¿Por qué refetchAllowance después del approve?** Porque necesitamos asegurarnos de que el allowance se actualizó antes de intentar invest. Después del approve, el contrato guarda el nuevo allowance en su estado. Al hacer refetch, leemos ese estado actualizado. Si no refetcheamos, el código podría creer que todavía no hay allowance suficiente y mostrar un error.

**¿Por qué avisamos al backend (POST /api/investments) después de la tx on-chain?** La blockchain registra que invertiste, pero el backend necesita saberlo para:
   - Mostrar la inversión en el historial
   - Actualizar el progreso del proyecto (montoRecaudado)
   - Calcular y asignar sub-tokens
   - El backend tiene un scheduler que sincroniza desde la blockchain como respaldo, pero la notificación inmediata evita tener que esperar ese scheduler

### 📊 Diagrama de flujo

```
Usuario abre modal de inversión
           │
           ▼
¿Wallet conectada? ──NO──→ Mostrar botón "Connect Wallet"
           │
          SÍ
           │
           ▼
Ingresa monto (ej: "100 $IDEA")
           │
           ▼
Leer allowance (permiso actual)
           │
           ▼
¿Allowance suficiente? ──NO──→ Paso 1: Approve
           │                          │
          SÍ                          ▼
           │                  MetaMask: "Confirmar approve"
           │                          │
           │                          ▼
           │                  Esperar confirmación blockchain
           │                          │
           │                          ▼
           │                  Refetch allowance
           │                          │
           └──────────┬───────────────┘
                      ▼
            Paso 2: Invest (firma)
                      │
                      ▼
            MetaMask: "Confirmar invest"
                      │
                      ▼
            Esperar confirmación blockchain
                      │
                      ▼
            Paso 3: Avisar al backend
            (POST /api/investments)
                      │
                      ▼
            ✅ Inversión exitosa
            Mostrar tx hash + Etherscan link
```

### 📄 Código completo del `InvestDialog`

El archivo es `src/pages/projects/[id].jsx`. El componente `InvestDialog` entero:

```jsx
function InvestDialog({ open, onOpenChange, projectId, projectTitle, onSuccess }) {
  // --- ESTADOS LOCALES ---
  const [amount, setAmount] = useState('')                    // Monto en $IDEA que ingresa el usuario
  const [step, setStep] = useState('idle')                    // idle | approving | investing | backend | done
  const [investHash, setInvestHash] = useState(null)          // Hash de la transacción

  // --- HOOKS DE WAGMI ---
  const { address, isConnected } = useAccount()               // ¿Hay wallet conectada?
  const { writeContractAsync } = useWriteContract()           // Función para firmar transacciones

  // --- LECTURAS ON-CHAIN ---

  // 1. Allowance: cuántos $IDEA puede gastar InvestmentSwap de la wallet del usuario
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: VITE_IDEA_TOKEN_ADDRESS,                         // Contrato ProjectToken
    abi: ERC20_ABI,                                            // ABI del ERC-20
    functionName: 'allowance',                                 // Función allowance(owner, spender)
    args: address ? [address, VITE_INVESTMENT_SWAP_ADDRESS] : undefined,  // [miWallet, contratoSwap]
    query: { enabled: isConnected && !!address },              // Solo si hay wallet
  })

  // 2. Balance: cuántos $IDEA tiene el usuario en su wallet
  const { data: userBalance } = useReadContract({
    address: VITE_IDEA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  })

  // 3. Decimals: cuántos decimales tiene el token (normalmente 18)
  const { data: decimals } = useReadContract({
    address: VITE_IDEA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: isConnected },
  })

  // --- CÁLCULOS ---

  // Convierte el monto de formato humano (100.50) a wei (100500000000000000000n)
  const investAmountWei = amount && decimals ? parseUnits(amount, decimals) : 0n

  // ¿Necesita approve? Sí, si allowance < monto a invertir
  const needsApproval = allowance !== undefined && investAmountWei > 0n && allowance < investAmountWei

  // Balance formateado para mostrar (con comas, 2 decimales)
  const formattedBalance = userBalance && decimals
    ? Number(formatUnits(userBalance, decimals)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : null

  // --- MANEJADOR DE INVERSIÓN ---
  const handleInvest = async () => {
    // Validaciones
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Ingresá un monto válido')
      return
    }
    if (!isConnected || !address) {
      toast.error('Conectá tu wallet primero')
      return
    }

    try {
      // PASO 1: Approve (solo si es necesario)
      if (needsApproval) {
        setStep('approving')
        // writeContractAsync() abre MetaMask y pide firmar
        const approveHash = await writeContractAsync({
          address: VITE_IDEA_TOKEN_ADDRESS,                    // Contrato ProjectToken
          abi: ERC20_ABI,                                       // ABI del ERC-20
          functionName: 'approve',                              // Función approve(spender, amount)
          args: [VITE_INVESTMENT_SWAP_ADDRESS, investAmountWei], // [InvestmentSwap, montoEnWei]
        })
        // Esperar a que la transacción se confirme en la blockchain
        await waitForTransactionReceipt(wagmiConfig, { hash: approveHash })
        // Refrescar el allowance (ahora debería ser suficiente)
        refetchAllowance()
      }

      // PASO 2: Invest
      setStep('investing')
      const hash = await writeContractAsync({
        address: VITE_INVESTMENT_SWAP_ADDRESS,                 // Contrato InvestmentSwap
        abi: INVESTMENT_SWAP_ABI,                               // ABI del Swap
        functionName: 'invest',                                 // Función invest(proyectoId, amount)
        args: [BigInt(projectId), investAmountWei],             // [ID del proyecto, monto en wei]
      })
      setInvestHash(hash)                                       // Guardamos el hash para mostrarlo
      await waitForTransactionReceipt(wagmiConfig, { hash })   // Esperar confirmación

      // PASO 3: Avisar al backend
      setStep('backend')
      await apiRequest(API_ENDPOINTS.INVESTMENTS, {
        method: 'POST',
        body: { proyectoId: projectId, montoIdea: Number(amount), txHash: hash },
      })

      // ✅ Éxito
      setStep('done')
      toast.success('Inversión realizada con éxito en la blockchain')
      onSuccess?.()  // Refetch del proyecto para actualizar FundingProgress
    } catch (e) {
      // Si el usuario rechazó en MetaMask o hubo un error de red
      toast.error(e?.message || 'Error al procesar la inversión')
      setStep('idle')
    }
  }

  // --- RENDER ---
  // (Muestra diferentes UIs según el step: formulario, loading, éxito)
  // Ver el código completo en src/pages/projects/[id].jsx
}
```

**Explicación de las funciones clave:**

| Función | ¿Qué hace? | ¿Cuándo se usa? |
|---------|-----------|-----------------|
| `useAccount()` | Hook de wagmi. Devuelve `{ address, isConnected, chain }` de la wallet conectada | Siempre que necesitamos saber qué wallet está conectada |
| `useReadContract()` | Hook de wagmi. Lee datos de un contrato (solo lectura, sin gas) | Para leer balances, allowances, decimals |
| `useWriteContract()` | Hook de wagmi. Devuelve `writeContractAsync` para firmar transacciones | Para llamar a `approve()` e `invest()` |
| `writeContractAsync()` | Función que abre MetaMask, el usuario firma, y devuelve el hash de la tx | Para ejecutar las transacciones on-chain |
| `waitForTransactionReceipt()` | Función de @wagmi/core. Espera a que la transacción se confirme en la blockchain | Después de firmar, antes de seguir al siguiente paso |
| `parseUnits()` | Función de viem. Convierte "100.50" → `100500000000000000000n` (formato blockchain) | Para convertir el input del usuario a wei |
| `formatUnits()` | Función de viem. Convierte `100500000000000000000n` → "100.50" (formato humano) | Para mostrar balances |
| `BigInt()` | Constructor de JavaScript para números grandes. Convierte `projectId` (number) a BigInt | Porque la blockchain trabaja con BigInt, no con Number |

### 📋 Mapa de estados del modal

```
┌─────────────────────────────────────────────────────┐
│  step = 'idle'                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │ Balance $IDEA: 1,234.56                       │   │
│  │                                                │   │
│  │ Monto a invertir: [________]                  │   │
│  │                                                │   │
│  │ [Confirmar inversión]                         │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
           │ (usuario hace clic)
           ▼
┌─────────────────────────────────────────────────────┐
│  step = 'approving' (solo si necesita approve)       │
│  ┌───────────────────────────────────────────────┐   │
│  │ ⏳ Paso 1/2: Aprobando gasto de tokens...     │   │
│  │ MetaMask se abre → usuario firma              │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
           │ (tx confirmada)
           ▼
┌─────────────────────────────────────────────────────┐
│  step = 'investing'                                  │
│  ┌───────────────────────────────────────────────┐   │
│  │ ⏳ Paso 2/2: Ejecutando inversión...          │   │
│  │ MetaMask se abre → usuario firma              │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
           │ (tx confirmada)
           ▼
┌─────────────────────────────────────────────────────┐
│  step = 'backend'                                    │
│  ┌───────────────────────────────────────────────┐   │
│  │ ⏳ Confirmando inversión en el servidor...     │   │
│  │ (POST /api/investments)                        │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
           │ (backend responde OK)
           ▼
┌─────────────────────────────────────────────────────┐
│  step = 'done' ✅                                    │
│  ┌───────────────────────────────────────────────┐   │
│  │   ✅ Inversión confirmada                      │   │
│  │   Tx: 0xabc123... → [Ver en Etherscan]        │   │
│  │                                                │   │
│  │              [Cerrar]                         │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 🤝 Interacción con el backend

Después de la transacción exitosa en la blockchain, llamamos al backend:

```
POST /api/investments
Content-Type: application/json
Authorization: Bearer <token>

{
  "proyectoId": 5,
  "montoIdea": 100.00,
  "txHash": "0xabc123def456..."
}
```

**¿Por qué avisamos al backend si la transacción ya está en la blockchain?**
1. La blockchain es inmutable pero **lenta**. El backend puede mostrar los datos instantáneamente.
2. El backend tiene lógica adicional: calcular sub-tokens, actualizar el progreso del proyecto, etc.
3. El backend es la "fuente de verdad" para el frontend (listado de proyectos, historial, etc.).

**¿Qué pasa si el backend falla?**
La transacción ya se ejecutó en la blockchain. El backend tiene un scheduler que corre cada cierto tiempo y sincroniza las transacciones desde la blockchain (eventos `Invested`) hacia la BD. Es un sistema de **doble escritura** con respaldo automático.

---

## 8. ETAPA 4: Mostrar hash de transacción

### 📋 Historias de usuario

**HU-10**: "Como inversor, quiero ver el hash de la transacción para poder verificar en el explorador de bloques que la inversión se procesó correctamente."

### 🎯 ¿Qué hicimos?

Agregamos la visualización del hash de transacción en dos lugares:
1. **En el modal de inversión** (cuando la inversión se completa)
2. **En la página de historial** (para cada inversión)

### 🤔 ¿POR QUÉ mostrar el hash?

**¿Por qué mostrar el hash de transacción?** Porque es la prueba de que la inversión se registró en la blockchain. Sin el hash, el usuario solo tiene la palabra de IDEAFY de que la transacción ocurrió. Con el hash, puede ir a Etherscan y verificar por sí mismo.

**¿Por qué un link a Etherscan?** Porque Etherscan es el explorador de bloques estándar de Ethereum. Es como un "Google para transacciones": ponés el hash y ves todos los detalles. El link directo es una comodidad para el usuario.

**¿Por qué en dos lugares?** Porque el usuario necesita ver el hash:
   - **Inmediatamente después de invertir** (en el modal): para confirmar que la transacción se completó
   - **En el historial**: para verificar inversiones pasadas sin tener que acordarse del hash

**¿Por qué `{investHash.slice(0, 10)}...{investHash.slice(-8)}`?** El hash completo son 66 caracteres. En la UI ocuparía mucho espacio horizontal y rompería el diseño. Al truncarlo, mostramos suficiente información para identificar la transacción sin ocupar espacio de más. Si el usuario quiere ver el hash completo, hace clic en el link y Etherscan lo muestra.

### 🔧 En el modal de inversión

Cuando `step === 'done'` y tenemos `investHash`, mostramos:

```jsx
{step === 'done' && investHash ? (
  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
    <p className="text-sm text-emerald-300 font-medium">Inversión confirmada</p>
    
    {/* Link a Etherscan */}
    <a
      href={`https://sepolia.etherscan.io/tx/${investHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-mono"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      {investHash.slice(0, 10)}...{investHash.slice(-8)}  {/* Truncado: 0xabc123...ef456 */}
    </a>
  </div>
) : (...)}
```

**¿Qué es Etherscan?**
Etherscan es un explorador de bloques. Cualquier persona puede ir a `sepolia.etherscan.io/tx/0xHASH` y ver:
- Quién hizo la transacción (dirección del inversor)
- A qué contrato se llamó (InvestmentSwap)
- Qué función se ejecutó (`invest`)
- Cuánto gas se pagó
- En qué bloque se incluyó

**¿Por qué truncamos el hash?**
El hash completo tiene 66 caracteres (`0x` + 64 hex). Truncado ocupa mucho menos espacio en la UI. Mostramos los primeros 10 y últimos 8 caracteres: `0xabc123...ef456`. Si el usuario quiere ver el hash completo, hace clic y va a Etherscan.

---

## 9. ETAPA 5: Página de historial de inversiones

### 📋 Historias de usuario

**HU-12**: "Como inversor, quiero consultar mi historial de inversiones para ver en qué proyectos invertí, cuánto, cuándo y el estado."

### 🎯 ¿Qué hicimos?

1. Creamos `src/pages/inversiones/index.jsx` — la página de historial
2. Creamos `src/hooks/use-investment-history.js` — hook que llama al backend
3. Agregamos la ruta `/inversiones` en el router
4. Agregamos el ítem "Inversiones" en el sidebar

### 🤔 ¿POR QUÉ cada cosa?

**1. ¿Por qué una página separada (ruta `/inversiones`) en lugar de una sección en settings?** Porque el historial de inversiones tiene suficiente información y columnas como para merecer su propia página. En settings solo mostramos el portfolio (proyectos invertidos + cantidad de sub-tokens). Además, HU-12 dice "consultar mi historial de inversiones" — es una funcionalidad principal, no una configuración.

**2. ¿Por qué React Query con polling?**
   - **Polling cada 30 segundos**: Porque el estado de las inversiones puede cambiar sin que el usuario haga nada (ej: el scheduler del backend marca proyectos como RECHAZADO, o una inversión pasa de PENDIENTE a CONFIRMADA). No podemos esperar a que el usuario refresque manualmente.
   - **React Query**: Porque ya lo usa la app. Nos da caché, loading states, error states, refetch manual, y todo gratis. No necesitamos useState + useEffect + fetch manual.
   - **`staleTime: 10_000`**: Después de 10 segundos, React Query considera los datos "viejos" y en el próximo polling (30s) los refresca. Esto evita mostrar datos muy desactualizados si el usuario deja la página abierta mucho tiempo.

**3. ¿Por qué el hook en un archivo separado (`use-investment-history.js`) y no inline en la página?** Porque:
   - El hook se puede reutilizar si otra página necesita el historial
   - Separa la lógica de fetching de la presentación
   - Facilita el testing (podemos mockear el hook)
   - Convención del proyecto: los hooks van en `src/hooks/`

**4. ¿Por qué la tabla incluye TX Hash con link a Etherscan?** Porque HU-10 pide explícitamente poder verificar en el explorador de bloques. Cada fila de la tabla tiene un link directo a `sepolia.etherscan.io/tx/{txHash}` para que el usuario pueda hacer clic y verificar la transacción on-chain.

### 📄 Hook: `src/hooks/use-investment-history.js`

```js
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'

export function useInvestmentHistory() {
  return useQuery({
    queryKey: ['wallet', 'history'],
    queryFn: () => apiRequest(API_ENDPOINTS.WALLET_HISTORY),
    refetchInterval: 30_000,   // Polling cada 30 segundos
    staleTime: 10_000,          // Considerar datos viejos después de 10 segundos
  })
}
```

**¿Qué hace `WALLET_HISTORY`?** Apunta a `GET /api/investments/history` (ver `src/config/api.js`). El backend devuelve una respuesta paginada:

```json
{
  "content": [
    {
      "id": 42,
      "usuarioId": 7,
      "proyectoId": 5,
      "proyectoTitulo": "App de gestión inteligente",
      "proyectoEstado": "FINANCIAMIENTO",
      "montoIdea": 100.00,
      "subTokensRecibidos": 30,
      "txHash": "0xabc123...",
      "estado": "CONFIRMADA",
      "createdAt": "2026-05-23T12:05:00"
    }
  ],
  "totalElements": 3,
  "totalPages": 1,
  "size": 10,
  "number": 0
}
```

### 📄 Página: `src/pages/inversiones/index.jsx`

La página muestra:
1. **Encabezado**: "Mis Inversiones" con descripción
2. **Resumen de wallet**: Balance $IDEA + cantidad de proyectos invertidos
3. **Tabla de inversiones**: Proyecto, Monto, Sub-tokens, Fecha, TX Hash, Estado

**Campos importantes:**

| Campo del backend | Qué muestra en la UI |
|-------------------|---------------------|
| `proyectoTitulo` | Nombre del proyecto |
| `montoIdea` | Monto invertido en $IDEA |
| `subTokensRecibidos` | Cantidad de sub-tokens recibidos (es como "acciones" del proyecto) |
| `createdAt` | Fecha de la inversión |
| `txHash` | Hash de la transacción (con link a Etherscan) |
| `estado` | `CONFIRMADA` (verde) o `REEMBOLSADA` (ámbar) |

**Manejo de la respuesta paginada:**
```jsx
const rawInvestments = Array.isArray(history) ? history : history?.content ?? []
```
El backend devuelve `{ content: [...] }`. Si el hook devuelve un array directamente, lo usamos. Si devuelve un objeto paginado, extraemos `.content`. Esto hace que el código funcione en ambos casos.

### 🔧 Ruta y navegación

**Router** (`src/router/index.jsx`):
```jsx
const InvestmentHistoryPage = lazy(() => import('@/pages/inversiones/index'))

// Dentro de las rutas protegidas:
<Route path="/inversiones" element={<LazyPage Component={InvestmentHistoryPage} />} />
```

**Sidebar** (`src/components/layout/sidebar.jsx`):
```jsx
const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/inversiones', label: 'Inversiones', icon: TrendingUp },  // ← NUEVO
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]
```

### 🧪 Cómo verificar

1. Conectar wallet
2. Ir a una inversión (o hacer una nueva)
3. Ir a la página "Inversiones" en el sidebar
4. Ver la tabla con todas las inversiones
5. Hacer clic en un TX Hash → se abre Etherscan

---

## 10. ETAPA 6: Indicadores de proyecto fallido y reembolso

### 📋 Historias de usuario

**HU-28**: "Como inversor, quiero saber si un proyecto no alcanzó su meta de financiamiento y poder solicitar un reembolso."

### 🎯 ¿Qué hicimos?

1. Agregamos el estado `RECHAZADO` a los constants de proyecto
2. Agregamos un banner de advertencia en el detalle del proyecto cuando falló
3. Agregamos un botón "Solicitar Reembolso" en el detalle del proyecto
4. Creamos el `RefundDialog` que llama a `refund()` en el smart contract

### 🤔 ¿POR QUÉ cada cosa?

**1. ¿Por qué un estado `RECHAZADO` separado de `CANCELADO`?** Porque representan dos situaciones distintas:
   - `CANCELADO`: el creador del proyecto decide cancelarlo manualmente antes de que termine el plazo
   - `RECHAZADO`: el scheduler del backend lo marca automáticamente cuando el plazo vence y no alcanzó la meta
   Aunque visualmente se vean igual para el usuario (proyecto fallido), el backend los distingue para su lógica interna. Nosotros en el frontend tratamos ambos igual: mostrar banner y botón de reembolso.

**2. ¿Por qué un banner ámbar y no rojo?** Porque el proyecto fallido no es un error del sistema — es una situación esperada (los proyectos pueden no alcanzar su meta). El color ámbar indica "atención" sin asustar al usuario. Usamos el mismo color que el warning de Tailwind (amber).

**3. ¿Por qué el RefundDialog es un componente separado del InvestDialog?** Porque:
   - Tienen lógica diferente: invest necesita approve + invest, refund solo necesita refund
   - Se muestran en contextos diferentes: invest desde el formulario, refund desde el banner
   - Separarlos mantiene cada componente enfocado y más fácil de mantener

**4. ¿Por qué refund no necesita approve?** Porque la función `refund()` en el smart contract **devuelve** tokens del contrato al usuario. El contrato ya tiene los tokens (los recibió cuando el usuario invirtió). No necesita permiso para devolverlos — de hecho, el contrato está obligado por su código a devolverlos si el proyecto falló. Es lógica inversa al invest: en invest, el usuario da permiso al contrato para sacar tokens; en refund, el contrato devuelve tokens automáticamente sin pedir permiso.

**5. ¿Por qué también chequeamos `FINALIZADO && montoRecaudado < montoRequerido`?** Porque es un caso borde: un proyecto podría llegar a FINALIZADO (porque el scheduler lo procesó) pero sin alcanzar la meta. En teoría el scheduler debería marcarlo como RECHAZADO, pero por si acaso, cubrimos también esa condición. Es programación defensiva.

### 🔧 Constantes de proyecto: `src/lib/project-constants.jsx`

```jsx
export const statusVariants = {
  PREPARACION: 'info',
  FINANCIAMIENTO: 'success',
  EJECUCION: 'warning',
  FINALIZADO: 'default',
  CANCELADO: 'error',
  RECHAZADO: 'error',              // ← NUEVO: mismo estilo que Cancelado
}

export const statusLabels = {
  PREPARACION: 'Preparación',
  FINANCIAMIENTO: 'En Financiamiento',
  EJECUCION: 'En Ejecución',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  RECHAZADO: 'Rechazado',          // ← NUEVO
}
```

**¿Por qué `RECHAZADO`?** El backend tiene un scheduler que corre a las 6 AM y revisa los proyectos en FINANCIAMIENTO cuyo plazo venció. Si no alcanzaron la meta, los marca como `RECHAZADO`. Es diferente de `CANCELADO` (que es manual, hecho por el creador). Pero para el usuario, ambos significan "no se financió".

### 🔧 Banner de proyecto fallido

En el detalle del proyecto (`[id].jsx`), después del progreso de financiamiento:

```jsx
{(project.estado === 'CANCELADO' || project.estado === 'RECHAZADO' || 
  (project.estado === 'FINALIZADO' && project.montoRecaudado < project.montoRequerido)) && (
  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-medium text-amber-300">Proyecto sin financiamiento completo</p>
      <p className="text-xs text-amber-400/70 mt-0.5">
        Este proyecto no alcanzó su meta de financiamiento. Si invertiste, podés solicitar un reembolso.
      </p>
    </div>
  </div>
)}
```

**Condiciones para mostrar el banner:**
1. `CANCELADO` → el creador lo canceló manualmente
2. `RECHAZADO` → el scheduler del backend lo rechazó por plazo vencido
3. `FINALIZADO` pero `montoRecaudado < montoRequerido` → finalizó sin llegar a la meta (caso borde)

### 🔧 Botón de reembolso en StatusActions

```jsx
const failed = project.estado === 'CANCELADO' || project.estado === 'RECHAZADO' || 
               (project.estado === 'FINALIZADO' && project.montoRecaudado < project.montoRequerido)

// ...dentro del render:
{failed && (
  <Button onClick={onRefund} variant="outline" size="sm" 
          className="gap-2 border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
    <RefreshCw className="w-3.5 h-3.5" />
    Solicitar Reembolso
  </Button>
)}
```

### 📄 `RefundDialog`: diálogo de reembolso

```jsx
function RefundDialog({ open, onOpenChange, projectId, onSuccess }) {
  const [step, setStep] = useState('idle')
  const [refundHash, setRefundHash] = useState(null)

  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const handleRefund = async () => {
    if (!isConnected || !address) {
      toast.error('Conectá tu wallet primero')
      return
    }
    try {
      setStep('refunding')
      // Llama a refund(proyectoId) en el InvestmentSwap
      const hash = await writeContractAsync({
        address: VITE_INVESTMENT_SWAP_ADDRESS,
        abi: INVESTMENT_SWAP_ABI,
        functionName: 'refund',
        args: [BigInt(projectId)],   // Solo necesita el ID del proyecto
      })
      setRefundHash(hash)
      await waitForTransactionReceipt(wagmiConfig, { hash })
      
      toast.success('Reembolso procesado exitosamente en la blockchain')
      setStep('done')
      onSuccess?.()
    } catch (e) {
      toast.error(e?.message || 'Error al procesar el reembolso')
      setStep('idle')
    }
  }
  // ...render similar al InvestDialog
}
```

**¿Qué hace `refund(proyectoId)` en el smart contract?**
1. Verifica que el proyecto esté en estado fallido (plazo vencido, no alcanzó meta)
2. Verifica que el usuario que llama haya invertido en ese proyecto
3. Transfiere los $IDEA de vuelta al inversor
4. Emite el evento `Refunded`

**Diferencia con el InvestDialog:** El refund no necesita approve porque el contrato ya tiene los tokens. Solo devuelve.

---

## 11. Adaptación a cambios del backend

Durante el desarrollo, el backend fue actualizado por otro compañero. Detectamos diferencias y adaptamos el frontend.

### 📋 Diferencias encontradas vs. adaptadas

| Aspecto | Lo que asumimos originalmente | Lo que realmente tiene el backend | Cambio necesario |
|---------|------------------------------|-----------------------------------|-----------------|
| Endpoint de inversión | `POST /api/projects/{id}/invest?amount=X` | `POST /api/investments` con body `{ proyectoId, montoIdea, txHash }` | Cambiar endpoint y formato |
| Endpoint de historial | `GET /api/wallet/history` | `GET /api/investments/history` | Cambiar URL |
| Wallet summary | `{ balances: { idea, usdt }, portfolio }` | `{ saldoIdea: number, portfolio }` | Cambiar acceso a `saldoIdea` |
| Historial de inversiones | `{ projectTitle, amount, status }` | `{ proyectoTitulo, montoIdea, subTokensRecibidos, estado }` | Cambiar nombres de campos |
| Estado de proyecto | `CANCELADO` | `RECHAZADO` (nuevo) | Agregar a constants |
| Portfolio item | `{ subtoken, cantidad }` | `{ proyectoTitulo, cantidad, subtokenId }` | Cambiar nombres de campos |

### 📄 Todos los archivos modificados por la adaptación

| Archivo | ¿Qué cambió? |
|---------|-------------|
| `src/config/api.js` | `PROJECT_INVEST` → `INVESTMENTS`, agregamos `INVESTMENTS_VALIDATE`, `INVESTMENT_BY_ID`. `WALLET_HISTORY` ahora apunta a `/api/investments/history` |
| `src/pages/projects/[id].jsx` | El `InvestDialog` ahora hace `POST /api/investments` con body `{ proyectoId, montoIdea, txHash }` |
| `src/pages/projects/[id].jsx` | Refund ahora también chequea `RECHAZADO` además de `CANCELADO` |
| `src/lib/project-constants.jsx` | Agregado `RECHAZADO: 'error'` y `RECHAZADO: 'Rechazado'` |
| `src/pages/inversiones/index.jsx` | Ahora usa `saldoIdea`, `proyectoTitulo`, `montoIdea`, `subTokensRecibidos`, `estado` |
| `src/pages/settings/settings.jsx` | Ahora usa `saldoIdea` y `proyectoTitulo` en el `WalletPanel` |

### 💡 ¿Por qué estos cambios?

El equipo de backend refactorizó los endpoints siguiendo mejores prácticas:
- **RESTful**: Las inversiones son un recurso propio, no un sub-recurso de proyectos
- **Body en POST**: Más limpio que query params
- **Nombres en español**: Consistentes con el resto del backend

### 🤔 Explicación detallada de cada adaptación

**1. Endpoint de inversión: `POST /api/projects/{id}/invest?amount=X` → `POST /api/investments` con body**
- **¿Por qué cambió?** Porque es más RESTful. Las inversiones son un recurso propio con su propio controller. Además, el body permite pasar más datos (txHash, proyectoId, monto) de forma estructurada.
- **¿Cómo lo detectamos?** Probamos el endpoint viejo y devolvía 404. Revisamos el código del backend (`InvestmentController.java`) y vimos la nueva ruta.
- **Adaptación**: Cambiamos la URL en `api.js` y el formato del body en `[id].jsx`.

**2. Wallet summary: `{ balances: { idea, usdt }, portfolio }` → `{ saldoIdea: number, portfolio }`**
- **¿Por qué cambió?** El backend simplificó la respuesta: en vez de un objeto `balances` anidado, devuelve `saldoIdea` directamente como número. También sacó USDT porque no se usa.
- **¿Cómo lo detectamos?** La app rompía al acceder a `walletData.balances.idea`. Revisamos la respuesta real del endpoint en el backend y vimos la nueva estructura.
- **Adaptación**: Cambiamos `walletData.saldoIdea` (directo) en vez de `walletData.balances.idea`.

**3. Campos de historial en español (`proyectoTitulo`, `montoIdea`, etc.)**
- **¿Por qué cambió?** El backend unificó los nombres de campos a español, consistente con el resto de la API (`proyectoId`, `montoRequerido`, etc.).
- **¿Cómo lo detectamos?** La tabla de historial mostraba campos vacíos. Revisamos el JSON de respuesta del endpoint y vimos que los nombres eran diferentes.
- **Adaptación**: Actualizamos los nombres de campos en la página de historial y settings.

**4. Nuevo estado `RECHAZADO`**
- **¿Por qué?** El backend implementó un scheduler que revisa proyectos vencidos y los marca como RECHAZADOS automáticamente. Antes no existía este estado.
- **¿Cómo lo detectamos?** En la BD vimos proyectos con estado RECHAZADO. Preguntamos al equipo de backend y nos explicaron el scheduler.
- **Adaptación**: Agregamos `RECHAZADO` a `project-constants.jsx` con el mismo estilo que CANCELADO.

**5. Portfolio item: `{ subtoken, cantidad }` → `{ proyectoTitulo, cantidad, subtokenId }`**
- **¿Por qué?** El backend cambió el modelo para incluir más información útil en el portfolio.
- **Adaptación**: Cambiamos el render en `settings.jsx` para usar `proyectoTitulo`.

---

## 12. Resumen de archivos

### 📁 Archivos creados (5)

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `src/lib/web3.ts` | 9 | Configura wagmi + RainbowKit (cadena Sepolia) |
| `src/lib/abis.ts` | 129 | ABIs de ERC-20 e InvestmentSwap |
| `src/hooks/use-investment-history.js` | 12 | Hook React Query para obtener historial del backend |
| `src/pages/inversiones/index.jsx` | 132 | Página de historial de inversiones con tabla |

### 📝 Archivos modificados (10)

| Archivo | ¿Qué se agregó/cambió? |
|---------|----------------------|
| `package.json` | Dependencias: wagmi@2.19.5, viem@2.50.4, @rainbow-me/rainbowkit@2.2.11 |
| `.env` / `.env.example` | VITE_WC_PROJECT_ID, VITE_IDEA_TOKEN_ADDRESS, VITE_INVESTMENT_SWAP_ADDRESS, VITE_USDC_ADDRESS |
| `src/providers/index.jsx` | WagmiProvider + RainbowKitProvider envolviendo la app |
| `src/config/api.js` | INVESTMENTS, INVESTMENTS_VALIDATE, INVESTMENT_BY_ID. WALLET_HISTORY corregido |
| `src/components/layout/header.jsx` | ConnectButton de RainbowKit |
| `src/components/layout/sidebar.jsx` | Nav "Inversiones" + WalletInfo (address, $IDEA, ETH) |
| `src/router/index.jsx` | Ruta `/inversiones` |
| `src/lib/project-constants.jsx` | Estado RECHAZADO |
| `src/pages/projects/[id].jsx` | InvestDialog Web3 + RefundDialog + banner fallido |
| `src/pages/settings/settings.jsx` | WalletPanel usa `saldoIdea` y `proyectoTitulo` |

### 🗑️ Archivos no creados (a diferencia del plan original)

El plan original mencionaba crear:
- `src/providers/web3-provider.jsx` → No se creó, se integró directamente en `index.jsx`
- `src/hooks/use-wallet-info.js` → No se creó, la lógica está en `sidebar.jsx`
- `src/hooks/use-tx-link.js` → No se creó, el link se construye inline
- Componentes separados `investment-table.jsx` / `investment-card.jsx` → No se crearon, la tabla está en la página misma

Esto es normal en el desarrollo ágil: a veces simplificamos la estructura cuando los componentes no se reutilizan.

---

## 13. Diagrama de flujo completo

### 🔄 Flujo: Inversión Web3 exitosa

```
1. USUARIO                        → Abre detalle de proyecto
2. FRONTEND                       → Carga proyecto desde GET /api/projects/{id}
3. USUARIO                        → Hace clic en "Invertir"
4. FRONTEND (InvestDialog)        → Muestra modal con balance $IDEA
5. USUARIO                        → Ingresa monto "100", hace clic en "Confirmar"
6. FRONTEND (useReadContract)     → Lee allowance: ¿InvestmentSwap puede gastar 100 $IDEA?
   ↓
   ├── SI (allowance ≥ 100)       → Salta al paso 9
   └── NO (allowance < 100)       → Continúa paso 7
7. FRONTEND (writeContractAsync)  → Llama a approve(InvestmentSwap, 100)
   USUARIO                        → MetaMask: "Confirmar approve" ✓
8. FRONTEND (waitForTxReceipt)    → Espera confirmación (~15 segundos en Sepolia)
   FRONTEND (refetchAllowance)    → Vuelve a leer allowance (ahora ≥ 100)
9. FRONTEND (writeContractAsync)  → Llama a invest(proyectoId, 100)
   USUARIO                        → MetaMask: "Confirmar invest" ✓
10. FRONTEND (waitForTxReceipt)   → Espera confirmación
11. FRONTEND                      → Guarda hash de la transacción
12. FRONTEND (apiRequest)        → POST /api/investments { proyectoId, montoIdea, txHash }
13. BACKEND                       → Guarda inversión en BD, calcula sub-tokens
14. FRONTEND                      → Muestra ✅ Inversión confirmada + TX Hash
15. USUARIO                       → Hace clic en TX Hash → Etherscan
```

### 🔄 Flujo: Reembolso

```
1. Scheduler del backend (6 AM)  → Revisa proyectos vencidos
2. BACKEND                        → Marca proyecto como RECHAZADO
3. USUARIO                        → Abre detalle del proyecto
4. FRONTEND                       → Muestra banner ámbar + botón "Solicitar Reembolso"
5. USUARIO                        → Hace clic en "Solicitar Reembolso"
6. FRONTEND (RefundDialog)       → Muestra confirmación
7. USUARIO                        → Hace clic en "Solicitar Reembolso"
8. FRONTEND (writeContractAsync)  → Llama a refund(proyectoId)
   USUARIO                        → MetaMask: "Confirmar" ✓
9. FRONTEND (waitForTxReceipt)    → Espera confirmación
10. FRONTEND                      → Muestra ✅ Reembolso procesado + TX Hash
11. El balance $IDEA del usuario  → Se actualiza (llegan los tokens de vuelta)
```

### 🔄 Flujo: Ver historial

```
1. USUARIO                        → Hace clic en "Inversiones" en el sidebar
2. FRONTEND (useWalletSummary)    → GET /api/wallet/summary → { saldoIdea, portfolio }
3. FRONTEND (useInvestmentHistory)→ GET /api/investments/history → [{ ... }]
4. FRONTEND                       → Muestra balance + tabla de inversiones
5. (Cada 30 segundos)            → Refetch automático
6. USUARIO                        → Hace clic en TX Hash → Etherscan
```

---

## 📐 Convenciones de código usadas

1. **Archivos `.jsx` para componentes React** (no `.tsx`) — el proyecto original usa JavaScript
2. **Archivos `.ts` para lógica de configuración** (web3.ts, abis.ts) — solo donde TypeScript aporta type-safety
3. **Importaciones con `@/` alias** — apunta a `src/` (configurado en vite.config)
4. **ABIs con `as const`** — para type-safety en wagmi
5. **Variables de entorno con `VITE_` prefix** — Vite solo expone las variables que empiezan con `VITE_`

---

## ❓ Preguntas frecuentes

**P: ¿Qué pasa si el usuario no tiene MetaMask?**
R: RainbowKit muestra un modal con varias opciones: MetaMask, WalletConnect, Coinbase Wallet, etc. Si no hay ninguna wallet instalada, RainbowKit ofrece instalar MetaMask o usar WalletConnect (escaneando un QR con el celular).

**P: ¿Cuánto cuesta hacer una transacción en Sepolia?**
R: Nada (es testnet). Las transacciones se pagan con ETH falso que se obtiene de faucets como https://sepoliafaucet.com o https://faucet.quicknode.com/ethereum/sepolia.

**P: ¿Qué pasa si el usuario rechaza la firma en MetaMask?**
R: `writeContractAsync` lanza un error con mensaje "User rejected the request". El catch del `handleInvest` muestra ese error con `toast.error`.

**P: ¿Por qué hay que esperar a que la transacción se confirme?**
R: Porque hasta que no se incluye en un bloque, la transacción no es definitiva. En Sepolia, cada bloque se genera cada ~12 segundos. Normalmente esperamos 1-2 bloques para considerar la transacción como confirmada.

**P: ¿El balance de $IDEA en el sidebar y en el modal de inversión es el mismo?**
R: Sí, ambos leen del mismo contrato con `useReadContract`. Pero uno está en el sidebar (que se monta siempre) y otro en el modal (que se monta al abrir). Cada uno tiene su propia caché de react-query, pero los datos son los mismos porque leen de la misma dirección y ABI.

**P: ¿Qué es el `import.meta.env.VITE_IDEA_TOKEN_ADDRESS`?**
R: Es la forma en que Vite expone variables de entorno. `import.meta.env` es el objeto de entorno de Vite (equivalente a `process.env` en Node.js). Las variables con prefijo `VITE_` se exponen automáticamente al frontend.

**P: ¿Qué diferencias hay con el código de la Clase 3 del profesor?**
R: El profesor usó Next.js (SSR); nosotros usamos Vite (SPA). Las diferencias son:
- No necesitamos `'use client'` (Vite no tiene server components)
- `getDefaultConfig` con `ssr: false`
- Los providers van en `index.jsx` (no en `layout.tsx`)
- Todo lo demás es igual: hooks de wagmi, ABIs, RainbowKit

**P: ¿Por qué wagmi versión 2 y no 1?**
R: Porque wagmi v2 tiene soporte nativo de viem (en vez de ethers.js), mejor inferencia de tipos con `as const`, y es el estándar actual. La versión 1 está deprecada. El profesor usó wagmi v2 en la Clase 3.

**P: ¿Por qué no usar ethers.js directamente en vez de wagmi?**
R: Podríamos, pero wagmi nos da hooks de React listos (useAccount, useReadContract) que manejan estados de carga/error/conexión automáticamente. Con ethers.js tendríamos que escribir todo ese boilerplate nosotros. wagmi es ethers.js/viem + React hooks.

**P: ¿Por qué algunas funciones se llaman con `useReadContract` y otras con `useWriteContract`?**
R: `useReadContract` es para funciones de **solo lectura** (`view` o `pure` en Solidity). No modifican el estado de la blockchain y no cuestan gas. `useWriteContract` es para funciones que **modifican** el estado (como `approve` o `invest`). Requieren firma en MetaMask y cuestan gas. Esta distinción es fundamental en Ethereum.

**P: ¿Por qué el `ConnectButton` no muestra el balance de ETH?**
R: Porque seteamos `showBalance={false}`. Decidimos no mostrarlo en el Header para no saturar la UI. El balance de ETH se muestra en el Sidebar, donde hay más espacio. Además, el balance de ETH no es tan relevante para el usuario como el balance de $IDEA.

**P: ¿Por qué en el sidebar mostramos $IDEA (leído on-chain) y también saldoIdea (del backend)?**
R: Son dos cosas distintas:
- **$IDEA on-chain** (en sidebar): Es el balance real de tokens en la wallet del usuario. Lo que tiene disponible para invertir.
- **saldoIdea del backend** (en settings): Es el saldo calculado por el backend basado en inversiones. Podría diferir del on-chain si hay transacciones no sincronizadas.
Por eso mostramos ambos: el on-chain para saber cuánto tenés, el del backend para saber cuánto invertiste.

**P: ¿Por qué necesitamos un WalletConnect Project ID si usamos MetaMask?**
R: Porque RainbowKit usa WalletConnect como puente para conectar con MetaMask y otras wallets. Incluso si solo usás MetaMask, RainbowKit necesita el Project ID de WalletConnect para funcionar. Es un requisito de RainbowKit, no una elección nuestra.

**P: ¿Por qué el archivo de Web3 está en TypeScript (`.ts`) si el proyecto usa JavaScript (`.jsx`)?**
R: Porque la configuración de wagmi y las ABIs se benefician del type-safety de TypeScript. Los tipos infieren correctamente las funciones y argumentos de los contratos, evitando errores. En los componentes React (`.jsx`), el type-safety no es tan crítico porque los hooks ya están tipados por wagmi. Es una decisión pragmática: usar TypeScript donde más aporta valor.

**P: ¿Cómo sé que estoy llamando bien a una función del contrato?**
R: Si definís el ABI con `as const` y usás TypeScript, wagmi infiere automáticamente:
- Qué funciones existen (autocompletado en `functionName`)
- Qué argumentos necesita cada función (tipado en `args`)
- Qué devuelve cada función (tipado en el resultado)
Si ponés mal un argumento, TypeScript te marca error antes de compilar. Sin TypeScript, el error aparecería recién en runtime (la transacción falla en MetaMask).
