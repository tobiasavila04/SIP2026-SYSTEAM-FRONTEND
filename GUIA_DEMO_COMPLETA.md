# IDEAFY — Guía Completa para Demo en Vivo
> Versión: Demo académica SIP 2026 | Red: Base Sepolia (testnet)

---

## ÍNDICE

1. [¿Qué es IDEAFY?](#1-qué-es-ideafy)
2. [Arquitectura por capas](#2-arquitectura-por-capas)
3. [¿Qué vive en la blockchain y por qué?](#3-qué-vive-en-la-blockchain-y-por-qué)
4. [Smart Contracts en detalle](#4-smart-contracts-en-detalle)
5. [Usuarios y roles](#5-usuarios-y-roles)
6. [Flujos principales con stack completo](#6-flujos-principales-con-stack-completo)
7. [Economía de la plataforma — ¿Cómo ganamos plata?](#7-economía-de-la-plataforma--cómo-ganamos-plata)
8. [El token $IDEA — ¿qué es y para qué sirve?](#8-el-token-idea--qué-es-y-para-qué-sirve)
9. [Los Subtokens (ProjectTokens)](#9-los-subtokens-projecttokens)
10. [Pricing dinámico — ¿de dónde salen los porcentajes?](#10-pricing-dinámico--de-dónde-salen-los-porcentajes)
11. [El Tesoro (Treasury)](#11-el-tesoro-treasury)
12. [Cada vista y cada botón explicado](#12-cada-vista-y-cada-botón-explicado)
13. [Escenarios edge — "¿Qué pasa si...?"](#13-escenarios-edge--qué-pasa-si)
14. [El Marketplace](#14-el-marketplace)
15. [Preguntas trampa del profe y sus respuestas](#15-preguntas-trampa-del-profe-y-sus-respuestas)
16. [Datos de prueba — los montos "cargados"](#16-datos-de-prueba--los-montos-cargados)

---

## 1. ¿Qué es IDEAFY?

IDEAFY es una **plataforma de financiamiento colectivo (crowdfunding) tokenizado** construida sobre blockchain.

### El problema que resuelve

En el crowdfunding tradicional (Kickstarter, Indiegogo):
- Quien invierte no recibe nada a cambio salvo el producto o una recompensa simbólica.
- No hay transparencia real sobre los fondos.
- Si el proyecto fracasa, el reembolso depende de la buena voluntad del creador.
- No existe mercado secundario: invertiste y no podés salir.

### Lo que hace IDEAFY diferente

- Los inversores reciben **subtokens (tokens ERC-20 de cada proyecto)** que representan su participación.
- Las reglas están en **contratos inteligentes en la blockchain**, no en la palabra de nadie.
- Los reembolsos son automáticos y están garantizados on-chain si no se llega a la meta.
- Los subtokens se pueden (en el futuro) negociar en el Marketplace secundario.
- Los dividendos se distribuyen a quienes tengan subtokens.

### Tecnologías usadas

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite, wagmi v2, RainbowKit v2 |
| Backend (usuarios/auth) | Java Spring Boot en puerto 8080 |
| Backend (proyectos/inversiones) | Java Spring Boot en puerto 8081 |
| Blockchain | Base Sepolia (testnet de Ethereum Layer 2) |
| Base de datos | PostgreSQL (migraciones con Flyway) |
| Web3 provider | Infura / Alchemy (RPC a Sepolia) |

---

## 2. Arquitectura por capas

```
┌─────────────────────────────────────────────────┐
│                   USUARIO                        │
│        (browser, MetaMask/wallet)                │
└───────────────┬─────────────────────────────────┘
                │ HTTPS
                ▼
┌─────────────────────────────────────────────────┐
│              FRONTEND (React/Vite)               │
│         Vercel — sip-2026-systeam-frontend       │
│                                                  │
│  wagmi/viem ──────────────────► Base Sepolia     │
│  (lectura de contratos, firma de txs)            │
└───────┬──────────────────────────────────────────┘
        │ REST (JWT Bearer)
        ├────────────────────────────────────────►  Auth Service   (8080)
        │                                           - Login/Register
        │                                           - JWT issue/validate
        │                                           - Usuarios, Roles, Permisos
        │
        └────────────────────────────────────────►  Projects Service (8081)
                                                    - Proyectos, inversiones
                                                    - Subtokens, wallet
                                                    - Dashboard stats
                                                    - Dividendos
                                                    │
                                                    │ Web3j (HTTPS RPC)
                                                    ▼
                                            ┌──────────────────┐
                                            │   BASE SEPOLIA   │
                                            │  (blockchain)    │
                                            │                  │
                                            │ $IDEA Token      │
                                            │ InvestmentSwap   │
                                            │ ProjectToken(s)  │
                                            │ PaymentGateway   │
                                            └──────────────────┘
                                                    │
                                                    ▼
                                            ┌──────────────────┐
                                            │   PostgreSQL     │
                                            │                  │
                                            │ projects         │
                                            │ investments      │
                                            │ subtokens        │
                                            │ portfolio_activos│
                                            │ dividendos       │
                                            │ blockchain_eventos│
                                            └──────────────────┘
```

### ¿Por qué dos backends?

La arquitectura está **separada por dominios** (microservicios):
- El servicio de **auth** (8080) maneja identidad: quién sos, qué roles tenés, JWT.
- El servicio de **proyectos** (8081) maneja el negocio: proyectos, inversiones, tokens.
- El servicio de proyectos **nunca genera JWTs**; delega la validación al servicio de auth llamando internamente a `GET /auth/validate`. Esto significa que si el auth service cae, nadie puede autenticarse en ningún lado.

---

## 3. ¿Qué vive en la blockchain y por qué?

Esta es la pregunta más importante. No todo va a la blockchain — gas cuesta dinero y las transacciones son lentas.

### Regla de oro

> **Va a la blockchain lo que necesita ser inmutable, transparente y verificable sin confiar en nadie.**

### Lo que SÍ vive on-chain

| Qué | Por qué en blockchain |
|-----|----------------------|
| **$IDEA token** (ERC-20) | Es el medio de intercambio de la plataforma. Su supply, transferencias y balances deben ser públicos e inmutables. |
| **ProjectTokens** (uno por proyecto) | Representan participación. El inversor debe poder probar on-chain que tiene X tokens del proyecto Y, sin depender de ninguna base de datos. |
| **InvestmentSwap** | La lógica de inversión y reembolso. Si nosotros desaparecemos como empresa, un inversor puede igual llamar al contrato directamente para recuperar su dinero. |
| **PaymentGateway** | Registro inmutable de pagos en USDC. Cada pago emite un evento `Paid` que queda en el bloque para siempre. |
| **Eventos blockchain** (`Invested`, `Refunded`, `TokensQuemados`) | Auditoría pública. Cualquiera puede ver el historial completo. |

### Lo que NO vive on-chain y por qué

| Qué | Por qué off-chain |
|-----|------------------|
| Título y descripción del proyecto | No vale el gas de guardar texto largo. No necesita ser inmutable. |
| Usuarios y contraseñas | Datos personales sensibles, no pertenecen a blockchain. |
| Roles y permisos | Administración interna, cambios frecuentes. |
| Historial de inversiones (DB) | Espejo de la blockchain para queries rápidas. La verdad está on-chain; la DB es para conveniencia. |
| Porcentajes de avance | Calculados en tiempo real desde la DB. |
| Estadísticas del dashboard | Agregaciones complejas, eficiente en SQL. |

### La separación peras/manzanas en una oración

> **La blockchain garantiza la propiedad y las reglas. La base de datos hace eficiente la consulta y la UX.**

---

## 4. Smart Contracts en detalle

### 4.1 `$IDEA Token` (ERC-20 estándar)

**¿Qué es?** El token de la plataforma. Es como "el dólar de IDEAFY". Necesitás $IDEA para invertir en proyectos.

**¿Quién lo tiene?** Los usuarios. Cuando alguien invierte, sus $IDEA se transfieren al Tesoro.

**Funciones relevantes:**
- `balanceOf(address)` → cuántos $IDEA tiene una dirección
- `approve(spender, amount)` → el usuario autoriza al contrato InvestmentSwap a gastar sus $IDEA
- `transferFrom(from, to, amount)` → el InvestmentSwap mueve los $IDEA del inversor al Tesoro

**En el código frontend:**
```
src/lib/abis.ts → ERC20_ABI
src/components/features/investment/investment-modal.jsx
  → useReadContract(balanceOf) // para mostrar saldo
  → useWriteContract(approve)  // paso 1 de inversión
```

---

### 4.2 `InvestmentSwap.sol`

**¿Qué es?** El contrato central. Orquesta las inversiones y reembolsos.

**Variables de estado:**
```solidity
mapping(uint256 => address) tokenDeProyecto;   // proyectoId → dirección del ProjectToken
mapping(address => uint256) proyectoDeToken;   // inverso del mapping anterior
address[] tokensCreados;                        // lista de todos los tokens creados
IERC20 immutable idea;                         // referencia al $IDEA token
address immutable treasury;                    // la billetera del tesoro
```

**Función `invest(proyectoId, ideaAmount, subTokenAmount, investor)`:**
```
1. Llama a idea.transferFrom(msg.sender, treasury, ideaAmount)
   → Los $IDEA del inversor van AL TESORO (plataforma)
2. Llama a ProjectToken.mint(investor, subTokenAmount)
   → El inversor recibe subtokens del proyecto
```

**Función `refund(proyectoId, subTokenAmount, holder, investor)`:**
```
1. Llama a ProjectToken.burnFrom(holder, subTokenAmount)
   → Se destruyen los subtokens del inversor
   (el reembolso en $IDEA lo hace el backend, no el contrato)
```

**Función `crearTokenProyecto(proyectoId, nombre, simbolo, supplyInicial)`:**
```
1. Despliega un nuevo contrato ProjectToken
2. Mintea el supply inicial al treasury
3. Guarda la dirección en el mapping tokenDeProyecto[proyectoId]
```

**Solo OWNER puede llamar:** `crearTokenProyecto` y `refund`. El owner es la wallet del backend.

**¿Por qué está en blockchain?** Porque las reglas de quién recibe qué y en qué momento deben ser verificables e inmutables. Si el backend falla, el contrato sigue ahí.

---

### 4.3 `ProjectToken.sol` (uno por proyecto)

**¿Qué es?** Un ERC-20 estándar con una característica especial: **quema el 0.1% en cada transferencia**.

**La constante más importante:**
```solidity
uint256 public constant TASA_QUEMA = 10; // 10 / 10000 = 0.1%
```

**Mecánica de quema en `_transfer`:**
```solidity
cantidadAQuemar = (valor * 10) / 10000;  // 0.1%
// Si la cantidad a quemar es > 0:
_burn(from, cantidadAQuemar);
// La transferencia real es:
_transfer(from, to, valor - cantidadAQuemar);
```

**¿Por qué existe la quema?**
- Crea deflación: a medida que los tokens se transfieren, el supply total baja.
- Aumenta el valor unitario de los tokens restantes.
- Desincentiva la especulación de muy corto plazo.

**¿Dónde está definido?** `blockchain/contracts/ProjectToken.sol`, línea 9.

**Mint/Burn NO queman** (se saltan el hook de `_transfer`).

---

### 4.4 `PaymentGateway.sol`

**¿Qué es?** Un contrato para pagos en USDC. Acepta pagos y emite eventos que el backend escucha.

**Función `pay(amount, actionId)`:**
```
1. Llama a usdc.transferFrom(msg.sender, treasury, amount)
2. Emite evento Paid(amount, actionId, payer)
```

**¿Quién escucha los eventos?**
El backend tiene un **scheduler** (`PaymentEventService.java`) que:
- Corre cada **30 segundos**
- Consulta la blockchain desde el último bloque procesado
- Busca eventos `Paid` del PaymentGateway
- Los guarda en la tabla `blockchain_eventos`
- Los reconcilia con las inversiones por `tx_hash`

**¿Por qué escuchar eventos y no solo fijarse en la base de datos?**
Porque alguien podría interactuar directamente con el contrato desde su wallet, sin pasar por nuestra UI. El sistema debe detectar esas transacciones igual.

---

## 5. Usuarios y roles

### Los roles del sistema

| Rol | ¿Quién es? | ¿Qué puede hacer? |
|-----|-----------|-------------------|
| **INVESTOR** | Cualquier persona que quiere financiar proyectos | Ver proyectos, invertir, pedir reembolso, ver su billetera y portfolio |
| **CREATOR** | Emprendedor con una idea | Crear proyectos, editarlos, publicarlos, cerrarlos, destacarlos |
| **ADMIN** | Nosotros (la plataforma) | Todo lo anterior + gestión de usuarios/roles/permisos, evaluar vencimientos, crear dividendos |

### ¿Cómo se asigna el rol?

**Flujo para usuario nuevo con email/password:**
1. Se registra en `/registro` → cuenta creada sin rol
2. La app detecta que no tiene ningún rol (`needsProfile = true`)
3. Lo redirige a `/completar-perfil`
4. Elige "Quiero Invertir" o "Quiero Publicar"
5. El frontend hace `POST /api/users/{userId}/roles/3` (INVESTOR=ID 3) o `/roles/2` (CREATOR=ID 2)

**Flujo con Google OAuth:**
1. Se loguea con Google
2. Misma detección → mismo `/completar-perfil`

**Nota crítica:** Los IDs de rol 2 y 3 están hardcodeados en el frontend (`src/pages/auth/complete-profile.jsx`, línea 16). Si la base de datos tiene esos roles con IDs diferentes, el flujo falla.

### ¿Cómo se validan los permisos en el backend?

```
Request llega al Projects Service (8081)
    │
    ▼
TokenValidationFilter
    │
    ├─► GET /auth/validate al Auth Service (8080)
    │        │
    │        └─► Responde: { userId, email, roles: ["CREATOR"], permissions: ["project:read","project:update"] }
    │
    └─► SecurityContextHolder.setAuthentication(...)
            │
            ▼
    @PreAuthorize("hasAuthority('project:create')") en el controller
    → Si lo tiene → 200 OK
    → Si no → 403 Forbidden
```

**ADMIN bypasea todo:** En el frontend, `can(permission)` siempre devuelve `true` si el rol es ADMIN.

---

## 6. Flujos principales con stack completo

### 6.1 Login

```
[Usuario ingresa email + password]
        │
        ▼
Frontend: POST /auth/login (Auth Service 8080)
        │
        ▼
Auth Service: valida credenciales → genera JWT
        │
        ▼
Respuesta: { accessToken, refreshToken, userId, email, roles, permissions }
        │
        ▼
Frontend: guarda tokens en sessionStorage
  keys: tokenIDEAFY, refreshTokenIDEAFY, userIdIDEAFY
        │
        ▼
Frontend: GET /api/users/me
        │
        ▼
Zustand store: guarda usuario completo
        │
        ▼
Navegación a /dashboard
```

**¿Por qué sessionStorage y no localStorage?**
El token se borra al cerrar la pestaña. Es más seguro: si alguien deja la sesión abierta y cierra el browser, no quedan tokens persistidos.

---

### 6.2 Crear un proyecto

```
[CREATOR llena el formulario en /proyectos/crear]
  campos: titulo, descripcion, montoRequerido, plazo,
          gobernanzaComunidad, cupoMaximoTokens, valorNominalToken, simbolo
        │
        ▼
Frontend: POST /api/projects (Projects Service 8081)
  Header: Authorization: Bearer <JWT>
        │
        ▼
TokenValidationFilter → valida JWT con Auth Service
        │
        ▼
@PreAuthorize("hasAuthority('project:create')")
        │
        ▼
ProjectService.createProject():
  - estado = "PREPARACION"
  - es_destacado = false
  - INSERT INTO projects
        │
        ▼
Respuesta: proyecto creado con id
        │
        ▼
Frontend: navega a /proyectos/{id}
```

**¿Por qué estado inicial PREPARACION?**
El proyecto no está listo para recibir inversiones. El creador debe tener tiempo para editarlo, revisarlo y recién publicarlo cuando esté completo. Es como un borrador.

**¿Qué puede editarse?** Solo mientras está en PREPARACION. Una vez publicado (FINANCIAMIENTO), ya no se puede editar — los inversores tomaron decisiones basadas en esa información.

---

### 6.3 Publicar un proyecto (PREPARACION → FINANCIAMIENTO)

```
[CREATOR hace click en "Publicar"]
        │
        ▼
Frontend: PATCH /api/projects/{id}/status?status=FINANCIAMIENTO
        │
        ▼
ProjectService.transitionStatus():
  isValidTransition("PREPARACION", "FINANCIAMIENTO") ✓
        │
        ├─► Si plazo es null: plazo = NOW() + 30 días
        │
        └─► TokenizationService.crearTokenParaProyecto(project):
                │
                ▼
            InvestmentSwapService.crearTokenProyecto(
              proyectoId, nombre, simbolo, supplyInicial
            )
                │
                ▼  Web3j → RPC → Base Sepolia
            InvestmentSwap.crearTokenProyecto()
              - Despliega nuevo contrato ProjectToken en blockchain
              - Mintea supply inicial al treasury
              - Guarda tokenDeProyecto[proyectoId] = nuevaDireccion
                │
                ▼
            INSERT INTO subtokens (
              nombre, suministro_total, cupo_restante,
              precio_actual = valorNominalToken,
              precio_base = valorNominalToken,
              factor_volatilidad = 0.50,
              proyecto_id, contract_address
            )
        │
        ▼
UPDATE projects SET estado = 'FINANCIAMIENTO'
```

**¿Por qué se despliega el token AQUÍ y no al crear el proyecto?**
Porque desplegar un contrato en blockchain cuesta gas (ETH). No tiene sentido gastarlo en un proyecto que todavía puede cancelarse en PREPARACION. Solo se gasta cuando el creador confirma que quiere salir a buscar financiamiento.

**¿Dónde queda el contrato del token?** En la tabla `subtokens.contract_address`. Es una dirección Ethereum (ej: `0xABC...`). Desde ese momento, ese token existe en la blockchain para siempre.

---

### 6.4 Invertir en un proyecto

Este es el flujo más complejo porque involucra FRONTEND → BLOCKCHAIN → BACKEND.

```
[INVESTOR hace click en "Invertir"]
        │
        ▼
Frontend: abre InvestmentModal
  - Lee balanceOf($IDEA) del usuario → contrato $IDEA en Base Sepolia
  - Lee allowance($IDEA, usuario, InvestmentSwap) → ¿ya aprobó antes?
        │
        ▼
INVESTOR ingresa cantidad de subtokens (ej: 5)
        │
        ▼
Frontend: POST /api/investments/validate
  body: { proyectoId, montoIdea }
        │
        ▼
InvestmentService.validateInvestment():
  - Proyecto en FINANCIAMIENTO? ✓
  - Calcula precioSubtoken dinámico
  - subTokensARecibir = floor(montoIdea / precioSubtoken)
  - cupoDisponible = subtoken.cupoRestante
  Respuesta: { valido, precioSubtoken, subTokensARecebir, cupoDisponible }
        │
        ▼
Frontend: muestra preview: "Vas a recibir X subtokens por Y $IDEA"
        │
        ▼
[INVESTOR confirma → click "Invertir X $IDEA"]
        │
        ├─► PASO 1: ¿Necesita approval?
        │   Si allowance < montoIdea:
        │   useWriteContract(approve, [InvestmentSwap_address, montoIdea])
        │   → Wallet del usuario pide firma
        │   → TX on-chain: el usuario autoriza al InvestmentSwap
        │     a gastar sus $IDEA
        │   → waitForTransactionReceipt (espera confirmación)
        │
        ├─► PASO 2: Inversión on-chain
        │   useWriteContract(invest, [proyectoId, montoIdea])
        │   → Wallet del usuario pide firma
        │   → TX on-chain: InvestmentSwap ejecuta:
        │       idea.transferFrom(usuario, treasury, montoIdea)
        │       ProjectToken.mint(usuario, subTokenAmount)
        │   → waitForTransactionReceipt (espera confirmación)
        │   → Guarda txHash
        │
        └─► PASO 3: Registro en backend
            POST /api/investments
            body: { proyectoId, montoIdea, txHash }
                    │
                    ▼
            InvestmentService.createInvestment():
              - Verifica txHash único (no doble registro)
              - UPDATE users SET saldo_idea = saldo_idea - montoIdea
              - UPDATE projects SET monto_recaudado = monto_recaudado + montoIdea
              - UPDATE subtokens SET cupo_restante -= subTokens,
                                     precio_actual = nuevo precio dinámico
              - INSERT/UPDATE portfolio_activos (cantidad del inversor)
              - INSERT investments (estado = "CONFIRMADA")
```

**¿Por qué la blockchain va ANTES que el backend?**
La fuente de verdad es la blockchain. Si primero actualizamos la DB y después falla la TX on-chain, el backend dice que invirtió pero la blockchain no. Al hacer la TX primero y luego registrar el `txHash`, el backend puede verificar que la transacción realmente ocurrió.

**¿Por qué dos pasos on-chain (approve + invest)?**
Por el estándar ERC-20. Un contrato no puede mover tus tokens sin que vos primero lo autorices. El `approve` es esa autorización. Si ya aprobaste en una inversión anterior, la app lo detecta (leyendo `allowance`) y saltea el paso 1.

---

### 6.5 Evaluación automática de vencimientos

```
Todos los días a las 6:00 AM
        │
        ▼
InvestmentScheduler.evaluateExpiredProjects() [Spring @Scheduled]
        │
        ▼
SELECT * FROM projects
WHERE estado = 'FINANCIAMIENTO'
AND plazo < NOW()
        │
        ▼
Para cada proyecto vencido:
  ├─► SI monto_recaudado >= monto_requerido:
  │   → NO hace nada automáticamente (el admin decide si pasarlo a EJECUCION)
  │
  └─► SI monto_recaudado < monto_requerido:
      → RECHAZADO: trigger reembolso masivo
              │
              ▼
      Para cada investment en estado PENDIENTE o CONFIRMADA:
        1. InvestmentSwapService.refund()
           → ProjectToken.burnFrom(inversor, subtokens) [on-chain]
        2. UPDATE users SET saldo_idea = saldo_idea + montoIdea [DB]
        3. subtokenService.removePortfolioEntry() [DB]
        4. UPDATE investments SET estado = 'REEMBOLSADA' [DB]
              │
              ▼
      UPDATE projects SET estado = 'RECHAZADO'
```

**¿Por qué el reembolso quema los subtokens?**
Porque si el proyecto no existe más, los subtokens tampoco deben existir. Burnear evita que alguien intente venderlos en el mercado secundario cuando el proyecto ya fracasó.

**¿Qué pasa con el $IDEA de los inversores?**
El saldo se restaura en la base de datos. Los $IDEA on-chain los tiene el treasury; en este flujo solo se actualiza el saldo off-chain (`saldo_idea` en la tabla users). El treasury tiene los tokens, pero la plataforma le debe ese saldo al inversor.

---

### 6.6 Refresh de Token JWT

```
Frontend hace cualquier request
        │
        ▼
El servidor responde 401 (token expirado)
        │
        ▼
api-client.js detecta el 401
        │
        ▼
POST /auth/refresh { refreshToken }
  (solo 1 request aunque haya muchas en paralelo — flag isRefreshing)
        │
        ├─► Éxito: nuevo accessToken → guarda en sessionStorage
        │          reintenta el request original automáticamente
        │
        └─► Fallo: limpia todo sessionStorage → redirige a login
```

---

## 7. Economía de la plataforma — ¿Cómo ganamos plata?

### Fuente 1: El Tesoro recibe todos los $IDEA de inversiones

Cuando alguien invierte, el flujo on-chain es:
```
idea.transferFrom(inversor, treasury, montoIdea)
```

El `treasury` es **nuestra wallet**. Todos los $IDEA que invierten los usuarios van ahí.

**¿Pero no son del inversor?**
El inversor recibe ProjectTokens a cambio. Los $IDEA financian el proyecto. Cuando el proyecto termina (FINALIZADO), el admin puede distribuir dividendos: parte de los fondos vuelve a los inversores proporcionalmente a sus subtokens.

**La plataforma puede retener una parte** antes de distribuir los dividendos — esto es el margen de la plataforma.

### Fuente 2: Boost de proyectos (100 $IDEA)

Si un CREATOR quiere que su proyecto aparezca primero en el catálogo, paga 100 $IDEA.

**¿Dónde está definido el costo?**
```java
// src/main/java/.../project/service/BoostService.java, línea 19
private static final BigDecimal COSTO_BOOST = new BigDecimal("100.00");
```

Ese costo se descuenta del `saldo_idea` del creador y se acumula en `projects.monto_boost`. Es ingreso directo de la plataforma.

### Fuente 3: Quema de tokens (0.1% en transfers)

Cada vez que un ProjectToken se transfiere (ej: en el marketplace secundario), se quema el 0.1%.

**¿Dónde está definido?**
```solidity
// blockchain/contracts/ProjectToken.sol, línea 9
uint256 public constant TASA_QUEMA = 10; // → 10/10000 = 0.1%
```

La quema no es ingreso directo de la plataforma, pero reduce el supply → cada token vale más → los que tienen subtokens están mejor → más inversores quieren entrar → más comisiones de boost y más actividad.

### Fuente 4 (futuro): Comisión del Marketplace

Cuando el marketplace secundario esté activo, la plataforma puede cobrar comisión por cada compraventa de subtokens.

### ¿Cómo veo cuánto gané como plataforma?

Actualmente no hay una vista de "earnings" en el frontend. El seguimiento es:
- Revisar `projects.monto_boost` en la DB para ver lo recaudado por boosts.
- El treasury wallet en blockchain tiene todos los $IDEA acumulados de inversiones.
- Un ADMIN podría consultar `SELECT SUM(monto_boost) FROM projects` para ver el total de boosts.

---

## 8. El token $IDEA — ¿qué es y para qué sirve?

$IDEA es el **token de utilidad** de la plataforma (utility token).

### ¿Para qué se usa?

| Uso | Descripción |
|-----|-------------|
| Invertir en proyectos | La única forma de invertir es con $IDEA, no con ETH ni USDC directamente |
| Boost de proyectos | 100 $IDEA para destacar un proyecto |
| Recibir dividendos | Los dividendos se pagan en $IDEA |
| (Futuro) Comprar subtokens en marketplace | Compras con $IDEA |

### ¿De dónde saca $IDEA un usuario?

En la demo, los saldos están cargados directamente en la base de datos (`users.saldo_idea`). En producción, el flujo sería:
1. Usuario compra $IDEA (por ejemplo con USDC via PaymentGateway)
2. La plataforma mintea $IDEA al usuario

### ¿$IDEA es on-chain o off-chain?

**Ambos.** El contrato ERC-20 de $IDEA vive on-chain (Base Sepolia). Los balances se muestran directamente desde la blockchain (el frontend llama a `balanceOf`). Pero los `saldo_idea` en la tabla `users` son un **espejo off-chain** que el backend usa para operaciones rápidas sin pagar gas.

---

## 9. Los Subtokens (ProjectTokens)

### ¿Qué son?

Cada proyecto tiene su propio token ERC-20 (el `ProjectToken`). Son los subtokens.

- Representan **participación** en ese proyecto.
- Quien los tiene, recibe dividendos proporcionalmente.
- Pueden transferirse (con el 0.1% de burn).
- Si el proyecto falla → se queman (burn) y el inversor recupera sus $IDEA.

### ¿Cuántos hay?

Definido por `cupoMaximoTokens` al crear el proyecto. Default: 100,000 si no se especifica.

### ¿Dónde se guardan?

**On-chain:** En el contrato `ProjectToken` (balances ERC-20 estándar).
**Off-chain (DB):** En la tabla `portfolio_activos` (userId, subtokenId, cantidad).

La DB es para mostrar rápido el portfolio del usuario sin queries blockchain costosas.

### ¿Cómo se crea el contrato del ProjectToken?

Al hacer la transición `PREPARACION → FINANCIAMIENTO`, el backend llama:
```java
InvestmentSwap.crearTokenProyecto(proyectoId, nombre, simbolo, supplyInicial)
```
Esto despliega un nuevo contrato Solidity en la blockchain. Su dirección queda guardada en `subtokens.contract_address`.

---

## 10. Pricing dinámico — ¿de dónde salen los porcentajes?

### La fórmula

```
demandaRelativa = (suministroTotal - cupoRestante) / suministroTotal

precioActual = precioBase × (1 + demandaRelativa × factorVolatilidad)
```

### ¿Dónde están definidos los valores?

| Valor | Dónde | Valor por defecto |
|-------|-------|-------------------|
| `precioBase` | `subtokens.precio_base` en DB | = `valorNominalToken` del proyecto |
| `factorVolatilidad` | `subtokens.factor_volatilidad` en DB | `0.50` (hardcoded en `TokenizationService.java:62`) |
| `suministroTotal` | `subtokens.suministro_total` en DB | = `cupoMaximoTokens` del proyecto |
| `cupoRestante` | `subtokens.cupo_restante` en DB | se decrementa con cada inversión |

### Ejemplo concreto

Proyecto con 100 tokens a $1 base, volatilidad 0.50:

| Tokens vendidos | Demanda relativa | Precio |
|-----------------|-----------------|--------|
| 0 de 100 | 0% | $1.00 |
| 25 de 100 | 25% | $1.125 |
| 50 de 100 | 50% | $1.25 |
| 100 de 100 | 100% | $1.50 |

**¿Por qué pricing dinámico?**
Incentiva invertir temprano (precio más bajo). Los primeros inversores asumen más riesgo y son recompensados con un precio menor. A medida que hay más demanda, el precio sube — es básica economía de oferta/demanda.

**¿Los porcentajes se ven en el frontend?**
En la vista de proyecto se muestra el precio actual del subtoken (fetched de `/api/tokens/{id}/precio`). No se muestra la fórmula explícitamente, pero el precio que ve el inversor ya es el dinámico.

---

## 11. El Tesoro (Treasury)

### ¿Qué es?

Una dirección de wallet Ethereum controlada por la plataforma. Recibe todos los $IDEA de las inversiones.

### ¿Dónde está configurado?

En la variable de entorno `BLOCKCHAIN_TREASURY` del backend. No está hardcodeado en el código Java (solo en el contrato `InvestmentSwap` que lo recibe como parámetro constructor immutable).

### ¿Por qué el supply inicial del ProjectToken se mintea al treasury?

```solidity
// InvestmentSwap.crearTokenProyecto()
ProjectToken.mint(treasury, supplyInicial);
```

El treasury empieza con todos los subtokens. A medida que alguien invierte:
```solidity
ProjectToken.mint(investor, subTokenAmount);
```
Se mintean nuevos tokens al inversor (NO se transfieren desde el treasury). El treasury solo es el destinatario inicial; los tokens de los inversores son mint freshcos.

### ¿Los montos "cargados" para prueba son la cuenta del tesoro?

No. Los `saldo_idea` en la tabla `users` son balances off-chain para pruebas. La cuenta del tesoro es una wallet blockchain separada con dirección propia (`BLOCKCHAIN_TREASURY`). Para la demo, los usuarios de prueba tienen saldos altos en la DB porque se insertaron manualmente para poder hacer demos sin tener que comprar $IDEA reales.

---

## 12. Cada vista y cada botón explicado

### `/` — Login

| Elemento | Qué hace | Flujo |
|----------|---------|-------|
| Form email + password | Login con credenciales | POST `/auth/login` → guarda JWT → `/dashboard` |
| Botón Google | OAuth2 login | Redirige a `backend/oauth2/authorization/google` → Google hace el flujo → callback en `/oauth2/callback` |
| Link "Explorar sin cuenta" | Ver proyectos públicos | Navega a `/explorar` |

---

### `/registro` — Registro

| Elemento | Qué hace |
|----------|---------|
| Form nombre, email, contraseña | Crea cuenta sin rol. POST `/auth/register` |

**Después del registro:** el usuario no tiene rol → es redirigido a `/completar-perfil`.

---

### `/completar-perfil` — Elegir rol

| Elemento | Qué hace |
|----------|---------|
| "Quiero Invertir" | POST `/api/users/{id}/roles/3` → rol INVESTOR |
| "Quiero Publicar" | POST `/api/users/{id}/roles/2` → rol CREATOR |

---

### `/explorar` — Catálogo público

Sin autenticación. Muestra proyectos en `PREPARACION`, `FINANCIAMIENTO`, `EJECUCION`.

| Elemento | Qué hace |
|----------|---------|
| Cards de proyectos | Navegan a `/proyectos/{id}` (no autenticado puede ver detalle) |
| Filtro por estado | Filtra client-side sobre los datos ya cargados |
| Barra de búsqueda | Filtra por título client-side |

**¿Por qué es pública?** Para que proyectos puedan ser compartidos sin login, como landing de marketing.

---

### `/dashboard` — Panel de control

**Datos de dónde vienen:**

| Card/Gráfico | Endpoint | Descripción |
|-------------|----------|-------------|
| Total Proyectos | `/api/dashboard/stats` | COUNT(*) en tabla projects |
| Proyectos Activos | `/api/dashboard/stats` | COUNT WHERE estado IN ('FINANCIAMIENTO','EJECUCION') |
| Monto Total Requerido | `/api/dashboard/stats` | SUM(monto_requerido) |
| Total Inversores | `/api/dashboard/stats` | COUNT usuarios con rol INVESTOR |
| Pie chart (estados) | `/api/dashboard/stats` → `projectsByStatus` | Distribución por estado |
| Bar chart (top 5) | `/api/dashboard/stats` → `topProyectosRecaudacion` | Proyectos con más dinero recaudado |
| Actividad reciente | `/api/projects/catalog?page=0&size=100` | Sintetizado client-side de los últimos 5 proyectos |

| Botón | Quién lo ve | Qué hace |
|-------|------------|---------|
| "+ Nuevo proyecto" | CREATOR | Navega a `/proyectos/crear` |
| "Evaluar vencimientos" | ADMIN | POST `/api/projects/evaluate-states` → corre la evaluación manual |

---

### `/proyectos` — Catálogo autenticado

| Elemento | Qué hace |
|----------|---------|
| Filtros (estado, monto, gobernanza) | Client-side sobre 500 proyectos pre-cargados |
| "Mis proyectos" tab | Solo CREATOR/ADMIN: GET `/api/projects/my-projects` |
| "Nuevo proyecto" | Solo CREATOR/ADMIN: navega a `/proyectos/crear` |
| Cards con badge "Destacado" | Proyectos con `es_destacado = true` aparecen primero |

---

### `/proyectos/crear` y `/proyectos/:id/editar` — Editor de proyecto

Solo CREATOR/ADMIN. Solo editable si estado = PREPARACION.

| Campo | Descripción |
|-------|-------------|
| Título | Nombre del proyecto |
| Descripción | Detalle completo |
| Monto requerido | Cuánto necesita recaudar |
| Plazo | Fecha límite para recaudar. Si no se pone, default = 30 días al publicar |
| Gobernanza comunitaria | Si los inversores pueden votar decisiones del proyecto |
| Cupo máximo de tokens | Supply total de subtokens |
| Valor nominal del token | Precio base del subtoken |
| Símbolo | 2-5 caracteres. Será el ticker del ERC-20 on-chain |

---

### `/proyectos/:id` — Detalle del proyecto

#### Botones por rol y estado

| Botón | Quién | Estado necesario | Qué hace |
|-------|-------|-----------------|---------|
| **Invertir** | INVESTOR | FINANCIAMIENTO | Abre InvestmentModal |
| **Solicitar Reembolso** | INVESTOR (que invirtió) | RECHAZADO | Llama a `InvestmentSwap.refund()` on-chain |
| **Destacar (100 $IDEA)** | CREATOR (dueño) | Cualquiera, no destacado | POST `/api/projects/{id}/boost` → descuenta 100 $IDEA al creador, pone `es_destacado = true` |
| **Quitar destacado** | CREATOR (dueño) | Destacado | POST `/api/projects/{id}/desboost` → `es_destacado = false` |
| **Publicar** | CREATOR (dueño) | PREPARACION | PATCH status → FINANCIAMIENTO (+ despliega token) |
| **Cerrar proyecto** | CREATOR (dueño) | EJECUCION | POST `/api/projects/{id}/close` |
| **Cancelar** | CREATOR (dueño) | No CANCELADO/FINALIZADO | PATCH status → CANCELADO |
| **Editar** | CREATOR (dueño) | PREPARACION | Navega a `/proyectos/{id}/editar` |
| **Evaluar vencimientos** | ADMIN | Cualquiera | POST `/api/projects/evaluate-states` |
| **Actualizar** (subtoken) | Cualquiera | Tiene subtoken | GET `/api/tokens/{id}` |

#### El InvestmentModal en detalle

```
1. Muestra saldo $IDEA del usuario (leído on-chain, no de la DB)
2. Botones rápidos: [1] [5] [10] [50] subtokens
3. Input manual de cantidad
4. Preview: "Vas a recibir X subtokens por Y $IDEA"
   → Y = X × precio_actual (del endpoint validate)
5. Si wallet no conectada: muestra <ConnectButton> de RainbowKit
6. Si wallet conectada:
   - "Invertir X $IDEA" → ejecuta approve (si hace falta) + invest
```

---

### `/inversiones` — Historial de inversiones

| Elemento | Descripción |
|----------|-------------|
| Resumen wallet (arriba) | saldo $IDEA, USDT, portfolio subtokens |
| Tabla | Proyecto, monto, subtokens recibidos, fecha, txHash (link a BaseScan), estado |
| Botón "Reembolso" | Solo si `estado === CONFIRMADA` Y `proyectoEstado === RECHAZADO` |

**¿De dónde viene el txHash?** Del campo `investments.tx_hash` en la DB, que se guarda cuando el inversor hizo la TX on-chain.

---

### `/billetera` — Wallet

| Elemento | Endpoint | Descripción |
|----------|----------|-------------|
| Saldo $IDEA | `GET /api/wallet/summary` | `users.saldo_idea` |
| Saldo USDT | `GET /api/wallet/summary` | `users.saldo_usdt` |
| Portfolio | `GET /api/wallet/summary` | join de `portfolio_activos` + `subtokens` |
| Precio actual de subtokens | Calculado dinámicamente | precio actual × cantidad |

Se refresca cada 30 segundos automáticamente.

---

### `/admin/usuarios` — Gestión de usuarios

Solo ADMIN.

| Botón | Qué hace |
|-------|---------|
| Toggle activar/desactivar | PUT `/api/users/{id}` con `enabled: true/false` |
| Lápiz (editar) | Abre dialog → PUT `/api/users/{id}` con nombre/email |
| Dropdown de rol | Assign: POST `.../roles/{roleId}` / Revoke: DELETE `.../roles/{roleId}` |
| "Nuevo usuario" | POST `/api/users` |

---

### `/admin/roles` — Gestión de roles y permisos

Solo ADMIN. Permite crear la granularidad de qué puede hacer cada tipo de usuario.

| Elemento | Qué hace |
|----------|---------|
| Checkbox de permiso en un rol | POST/DELETE `/api/roles/{roleId}/permissions/{permId}` |
| "Nuevo permiso" | POST `/api/permissions` |
| "Nuevo rol" | POST `/api/roles` |

---

### `/admin/modulos` — Estado de desarrollo

Muestra el avance de módulos del sistema. Cargado desde `GET /api/modules/status` que lee `modulos-estado.json`. Permite al equipo tener visibilidad del progreso.

---

## 13. Escenarios edge — "¿Qué pasa si...?"

### ¿Qué pasa si un proyecto llega al plazo sin alcanzar la meta?

1. El scheduler de las 6AM detecta el proyecto vencido (`estado = FINANCIAMIENTO AND plazo < NOW()`).
2. Como `monto_recaudado < monto_requerido` → estado pasa a `RECHAZADO`.
3. Para cada inversor: sus $IDEA se restauran en `saldo_idea` y sus subtokens se queman on-chain.
4. El inversor ve en `/inversiones` que su inversión pasó a estado `REEMBOLSADA`.
5. Puede hacer click en "Reembolso" para disparar el reembolso on-chain formalmente.

### ¿Qué pasa si el blockchain falla al momento de invertir?

```java
// InvestmentService - hay fallback:
try {
    txHash = investmentSwapService.invest(...)
} catch (Exception e) {
    txHash = smartContractService.recordInvestment(proyectoId, monto, txHashDelFrontend)
}
```

Si `InvestmentSwapAddress` no está configurado o falla:
- Se genera un txHash simulado (`0xswap-offline-<timestamp>`)
- La inversión se registra igualmente en la DB
- El saldo se actualiza

**Esto es "offline mode"** — para desarrollo/demo sin tener el contrato desplegado.

### ¿Qué pasa si el mismo txHash se intenta registrar dos veces?

Hay un constraint único en la DB: `investments_tx_hash_unique`. El segundo intento da `409 Conflict`. Protege contra doble registro por fallos de red o clics repetidos.

### ¿Qué pasa si el CREATOR hace click en "Publicar" y el deployment del contrato falla?

El `try-catch` en `TokenizationService` tiene fallback: usa la dirección global del ProjectToken (`BLOCKCHAIN_PROJECT_TOKEN`) en lugar de desplegar uno nuevo. El proyecto igual pasa a FINANCIAMIENTO pero todos los proyectos compartirían el mismo contrato base (menos ideal, pero funciona para demos).

### ¿Qué pasa si un inversor intenta invertir después del plazo?

El backend valida que `proyecto.estado === 'FINANCIAMIENTO'`. Cuando vence, el scheduler lo pone en `RECHAZADO`. Si el scheduler no corrió aún, el proyecto todavía aparece en FINANCIAMIENTO técnicamente, pero el admin puede hacer click en "Evaluar vencimientos" para forzar la evaluación.

### ¿Qué pasa si un usuario no conecta su wallet pero intenta invertir?

El InvestmentModal detecta `!isConnected` y muestra el `<ConnectButton>` de RainbowKit en lugar del botón "Invertir". No puede continuar sin wallet.

### ¿Qué pasa si el proyecto supera la meta antes del plazo?

El sistema **no transiciona automáticamente** a EJECUCION. El admin debe hacer la transición manualmente: `PATCH /api/projects/{id}/status?status=EJECUCION`. Esto es intencional — el admin debe verificar que el proyecto está listo antes de declararlo en ejecución.

### ¿Qué pasa con los subtokens si el CREATOR cancela un proyecto?

El sistema registra `estado = CANCELADO`. Sin embargo, en la implementación actual, no hay un flujo automático de reembolso para cancelaciones manuales (solo para vencimientos). Es un gap a mencionar o manejar con flujo manual de admin.

### ¿Qué pasa si el token JWT expira en medio de una operación?

El `api-client.js` intercepta el 401, hace refresh automáticamente y reintenta la request original. El usuario no nota nada (a menos que el refresh también falle, en cuyo caso se lo redirige al login).

---

## 14. El Marketplace

### Estado actual: **definido pero deshabilitado**

El marketplace es el mercado secundario donde los inversores pueden vender sus subtokens a otros usuarios.

### ¿Por qué está deshabilitado?

La ruta está comentada en el router:
```jsx
// src/router/index.jsx, línea 22
{/* const MarketplacePage = lazy(() => import('@/pages/marketplace/index')) */}
// línea 77
{/* <Route path="/marketplace" element={...} /> */}
```

No existe el archivo de página `src/pages/marketplace/index.jsx`.

### ¿Qué hay definido?

Los endpoints están declarados en `src/config/api.js`:
- `GET /api/marketplace/listings` — ver ofertas de venta
- `GET /api/marketplace/listings/{id}` — una oferta específica
- `GET /api/marketplace/listings/by-subtoken/{id}` — ofertas de un token específico
- `POST /api/marketplace/quote` — obtener cotización antes de comprar

### ¿Cómo funcionaría el Marketplace?

```
1. Un INVESTOR tiene subtokens del Proyecto X
2. Publica una oferta de venta: "Vendo 10 tokens del Proyecto X a $2 c/u"
   → POST /api/marketplace/listings
3. Otro usuario ve la oferta y hace click en "Comprar"
   → POST /api/marketplace/quote (previo para ver precio final con burn incluido)
   → La transacción involucra:
     a. Comprador paga en $IDEA al vendedor
     b. Vendedor transfiere sus ProjectTokens al comprador
     c. En la transferencia on-chain se quema el 0.1% (TASA_QUEMA)
     d. Backend actualiza portfolio_activos de ambos
```

### ¿Por qué el 0.1% de burn es relevante en el Marketplace?

Cada transacción secundaria destruye tokens. Esto:
1. Reduce el supply total → precio sube para los holders existentes
2. Genera desincentivo a especulación de muy corto plazo
3. Premia a holders de largo plazo

---

## 15. Preguntas trampa del profe y sus respuestas

### "¿Por qué este usuario específico puede hacer X?"

**Respuesta:** Los permisos no están hardcodeados en el código, sino gestionados dinámicamente. El `@PreAuthorize('hasAuthority("project:create")')` verifica que el JWT del usuario tenga ese permission string. Los permissions se asignan a roles en `/admin/roles`, y los roles a usuarios en `/admin/usuarios`. Esto nos da control granular: podemos crear un rol "MODERADOR" que solo pueda ver proyectos pero no invertir, sin cambiar una línea de código.

### "¿Dónde está el código del porcentaje de comisión?"

**Respuesta:** Hay tres lugares según el tipo:
1. **Burn rate (0.1%):** `blockchain/contracts/ProjectToken.sol`, línea 9, constante `TASA_QUEMA = 10`
2. **Factor de volatilidad de pricing (50%):** Se setea en `TokenizationService.java:62` al crear el subtoken, y vive en la columna `subtokens.factor_volatilidad` de la DB
3. **Costo de boost (100 $IDEA):** `BoostService.java`, línea 19, constante `COSTO_BOOST`

### "¿Qué controles tienen sobre lo que pasa en la blockchain?"

El owner del contrato `InvestmentSwap` es la wallet del backend (definida por `BLOCKCHAIN_PRIVATE_KEY`). Solo el owner puede:
- Crear tokens para nuevos proyectos
- Ejecutar reembolsos
Esto nos da control sobre las operaciones críticas.

### "¿Cómo saben que una transacción on-chain es válida?"

Cuando el frontend manda el `txHash` al backend, el backend llama a:
```java
BlockchainService.verifyTransaction(txHash)
// → eth_getTransactionReceipt → status == "0x1" (success)
```
Si el receipt no existe o el status es `0x0` (failed), la inversión se rechaza.

### "¿La DB y la blockchain pueden desincronizarse?"

Sí, es un riesgo conocido. La mitigación:
1. La transacción blockchain siempre va PRIMERO (antes de actualizar la DB)
2. El txHash es único en la DB — no hay doble registro
3. El `PaymentEventService` escanea la blockchain cada 30s y reconcilia eventos no procesados
4. Si hay desincronización, el admin puede rerreir el proceso de reconciliación

### "¿Qué pasa si el servidor cae en medio de una inversión?"

Si cae después de la TX on-chain pero antes del `POST /api/investments`:
- El usuario tiene sus subtokens on-chain y sus $IDEA fueron al treasury
- La DB no refleja esto
- El scheduler de reconciliación lo detectaría vía el evento `InvestmentMade` del contrato
- O el usuario puede retransmitir el mismo txHash (el backend lo aceptaría si aún no está registrado)

### "¿Por qué Base Sepolia y no Ethereum mainnet?"

Sepolia es un testnet. Las transacciones son gratuitas/baratas y podemos hacer pruebas sin arriesgar dinero real. En producción usaríamos Base mainnet o Ethereum mainnet.

### "¿Los subtokens tienen valor real?"

En la demo, no. Son tokens en una testnet (sin valor económico real). En un sistema de producción, el valor vendría de:
- Los dividendos que distribuye el proyecto
- El precio de mercado en el marketplace secundario
- La utilidad que le da el proyecto a sus holders (gobernanza, acceso, beneficios)

### "¿Cómo ven los admins dónde están ganando plata?"

Actualmente no hay una vista específica de "revenue". Para la demo:
- `SELECT SUM(monto_boost) FROM projects` → total recaudado por boosts
- La wallet del treasury en BaseScan muestra todos los $IDEA recibidos de inversiones
- Una futura vista de analytics del admin mostraría esto consolidado

### "¿Qué pasa con la gobernanza comunitaria?"

El campo `gobernanza_comunidad` existe en el proyecto y en la DB. Los endpoints de gobernanza (`GET /api/governance/proposals`, `POST /api/governance/vote`) están definidos en el frontend. Pero el módulo de gobernanza no está implementado en el backend todavía. Es funcionalidad futura.

### "¿Por qué el botón de Marketplace aparece en el sidebar si no funciona?"

Es una decisión de UX: mostrar el roadmap del producto. El sidebar tiene el link, pero la ruta está comentada en el router → da 404 o redirige al dashboard. En la demo se menciona como "próximamente".

---

## 16. Datos de prueba — los montos "cargados"

### ¿Por qué los usuarios de prueba tienen $IDEA en la billetera?

Los saldos de `saldo_idea` en la tabla `users` fueron insertados directamente en la DB para la demo. En producción, los usuarios comprarían $IDEA a través de la plataforma (via PaymentGateway con USDC, por ejemplo).

### ¿Quién tiene plata cargada?

Son cuentas de prueba con saldos asignados manualmente. No son la "cuenta del tesoro". El tesoro es una wallet blockchain separada (`BLOCKCHAIN_TREASURY`), no una cuenta de usuario en el sistema.

### ¿Eso es trampa?

No, es necesario para una demo. En una aplicación real de producción:
1. El usuario compraría $IDEA (con fiat o cripto)
2. La plataforma mintearía los $IDEA correspondientes a su wallet
3. El balance se reflejaría tanto on-chain como en `saldo_idea`

Para la demo se saltea ese paso y se da saldo directamente.

### ¿Por qué hay dos storages de auth en el frontend?

Hay `api-client.js` (sessionStorage, keys `tokenIDEAFY`) y `api.js` (localStorage, keys `systeam_access_token`). El primero es el actual; el segundo es legacy. Ambos existen por compatibilidad con código viejo. El sistema activo usa sessionStorage.

---

## Flujo end-to-end para la demo (guión sugerido de 30 minutos)

```
1. (2 min) Mostrar /explorar sin login
   → "Esta es la vista pública. Cualquiera puede ver proyectos sin registrarse."
   → Mencionar que el catálogo viene de GET /api/projects/catalog (sin auth)

2. (3 min) Registrar/loguear como INVESTOR
   → Explicar flujo de JWT, sessionStorage, /completar-perfil

3. (5 min) Navegar a un proyecto en FINANCIAMIENTO
   → Mostrar pricing dinámico (el precio actual vs precio base)
   → Mostrar la barra de progreso de financiamiento
   → "Este dato viene de monto_recaudado / monto_requerido en la DB"

4. (8 min) Hacer una inversión
   → Conectar wallet (MetaMask) con RainbowKit
   → Mostrar que el saldo $IDEA viene de la blockchain (balanceOf)
   → Ejecutar approve + invest (firmar en MetaMask)
   → Mostrar txHash en BaseScan
   → "El backend registra la inversión después de confirmar on-chain"
   → Mostrar portfolio actualizado en /billetera

5. (5 min) Cambiar a usuario CREATOR
   → Mostrar el proyecto en PREPARACION
   → Publicar (mostrar el deployment del token on-chain)
   → Mostrar el subtoken recién creado en la sección de detalle

6. (4 min) Panel de ADMIN
   → Mostrar /admin/usuarios y gestión de roles
   → Mostrar botón "Evaluar vencimientos" y explicar el scheduler
   → Mostrar /dashboard con stats

7. (3 min) Preguntas y arquitectura
   → Tener el diagrama de arquitectura listo
   → Mencionar lo que está próximamente: Marketplace, Gobernanza, Dividendos UI
```

---

*Esta guía fue generada con todo el conocimiento del código fuente del frontend (`SIP2026-SYSTEAM-FRONTEND`) y del backend (`Gestion_de_proyectos-Systeam`).*
