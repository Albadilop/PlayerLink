# Plan por fases: acercar PlayerLink a “todo Supabase”

Este documento es la hoja de ruta para ejecutar **paso a paso** más adelante. El estado actual: **Postgres puede estar en Supabase** (`DATABASE_URL`); **autenticación y sesiones** siguen en **Flask + JWT + tabla `User`**. Ya existen cimientos en código:

- Front: `src/front/lib/supabaseClient.ts` (`getSupabaseBrowserClient`, `isSupabaseConfigured`).
- Back: `src/api/supabase_admin.py` (`get_supabase_admin`, solo `SUPABASE_SERVICE_ROLE_KEY` en servidor).

Variables de referencia: `.env.example` (sección Supabase).

---

## Principios

1. **Una fase, un merge**: cada fase debe dejar la app **usable** (desplegable / desarrollo OK).
2. **Feature flags o rutas duplicadas** mientras convivan Flask Auth y Supabase Auth (ej. `/login` legacy vs nuevo).
3. **Nunca** subir `SUPABASE_SERVICE_ROLE_KEY` al front ni al repositorio.
4. Tras cada fase: pruebas manuales mínimas (login, settings, una ruta API protegida).

---

## Fase 0 — Inventario (1 sesión)

**Objetivo:** Saber qué tocar antes de codificar.

| Tarea                                                                              | Notas                      |
| ---------------------------------------------------------------------------------- | -------------------------- |
| Listar todos los endpoints con `@jwt_required` o equivalente                       | `grep` en `src/api`        |
| Listar usos de `localStorage token` / `apiClient` con auth                         | `src/front`                |
| Confirmar origen de `User` / `Profile` y FKs                                       | `models.py`, migraciones   |
| Decidir si `auth.users.id` será el mismo `user.id` que hoy o mapeo tabla `user_id` | Impacta migración de datos |

**Salida:** checklist en issues o comentarios en este doc (IDs de usuario, estrategia de IDs).

### Fase 0 — Resultados del inventario _(ejecutada: 2026-04-12)_

#### Identidad JWT hoy

- `create_access_token(identity=str(user.id))` → **`sub` es string del entero** `users.id` (no UUID).
- `require_ownership` compara `get_jwt_identity()` con `user_id` de ruta (**mismo esquema**).

#### Decisión recomendada: `auth.users` (UUID) ↔ `users.id` (int)

| Opción                                                                         | Pros / contras                                                                                                                                                                           |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sustituir `users.id` por UUID de Supabase                                      | Rompe todas las FKs y migraciones existentes (**no recomendado**).                                                                                                                       |
| **Columna `users.auth_id` (UUID, unique, nullable)** + email alineado con Auth | Mantiene `users.id` como PK para `Profile`, matches, settings, bloqueos, etc. El JWT de Supabase se resuelve por `auth_id` o por **email único**. **Recomendado para fases siguientes.** |

#### Modelo `User` / `Profile` y FKs a `users.id`

- `User.id`: `int`, PK.
- `Profile.user_id` → `users.id` (1:1).
- `Review.user_id`, `Review.author_id` → `users.id`.
- `Like.liker_id`, `Like.liked_id` → `users.id`.
- `Match.user1_id`, `Match.user2_id` → `users.id`.
- `Reject.rejector_id`, `Reject.rejected_id` → `users.id`.
- `UserSettings.user_id` → `users.id`.
- `BlockedUser.blocker_id`, `BlockedUser.blocked_id` → `users.id`.

Todas las rutas y el front asumen **IDs enteros** de usuario en URLs y estado.

#### API: rutas protegidas con Flask-JWT (`@jwt_required` o equivalente)

| Blueprint    | Método y ruta                                                                         | Notas                                            |
| ------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------- |
| **auth**     | `GET /api/token`                                                                      | Sesión actual.                                   |
|              | `POST /api/password_change_request`                                                   | Sesión + contraseña actual.                      |
|              | `PUT /api/password_update`                                                            | Token de recuperación / cambio (email).          |
| **users**    | `GET /api/private`                                                                    | Usa `verify_jwt_in_request()` (no el decorador). |
|              | `DELETE /api/users/<id>`                                                              | + `@require_ownership`.                          |
|              | `POST /api/users`                                                                     | Crear usuario (admin / flujo interno).           |
|              | `PUT /api/users/<id>`                                                                 | + ownership.                                     |
|              | `PUT /api/users_email/<id>`                                                           | + ownership.                                     |
|              | `PUT /api/users_password/<id>`                                                        | Legacy; + ownership.                             |
| **profiles** | `DELETE …/profiles/user/<id>`, `DELETE …/profiles/<profile_id>`, `POST                | PUT …/profiles/<id>`, `PUT                       | POST …/profiles/photo…`, `GET …/check-completion/<id>` | Varias con `@require_user_exists` / `@require_profile_exists`. |
| **settings** | `GET                                                                                  | PUT /api/settings/user/<id>`, `GET               | POST                                                   | DELETE …/blocked`, `GET …/export`                              | Todas con `@require_user_exists`. |
| **reviews**  | `DELETE /api/reviews/<id>`, `POST …/<author>/<receiver>`, `PUT /api/reviews/<id>`     |                                                  |
| **matches**  | `POST /api/matches/...`, `DELETE …`, `POST                                            | DELETE likes`, `POST                             | DELETE rejects`                                        | Varias con `require_user_exists` sobre ids de ruta.            |
| **games**    | `PUT /api/games/hours/<id>`, `POST /api/games/<profile_id>`, `DELETE /api/games/<id>` |                                                  |
| **chat**     | `POST /api/chat`                                                                      | Cuerpo con `userInfo`; JWT obligatorio.          |

**Públicas (sin JWT) relevantes:** `POST /api/register`, `POST /api/login`, `POST /api/check_mail`, listados GET de perfiles/reseñas según código actual; **`GET /api/users/<id>`** no usa `@jwt_required` (solo `@require_user_exists`).

#### Front: `localStorage` clave `token`

| Archivo                                                                  | Uso                                          |
| ------------------------------------------------------------------------ | -------------------------------------------- |
| `services/apiClient.ts`                                                  | Lee el token para `Authorization: Bearer`.   |
| `hooks/useAuth.ts`                                                       | get / set / remove `token`.                  |
| `store.ts`                                                               | Logout → `removeItem('token')`.              |
| `components/SignIn/SignIn.tsx`, `Register/Register.tsx`                  | Guardan token tras login/registro.           |
| `services/userServices.ts`                                               | `getUserInfo`, uploads; limpia token en 401. |
| `services/emailServices.ts`                                              | Sustituye token temporalmente para reset.    |
| `pages/Privateviews/Profile.tsx`, `components/Onboarding/Onboarding.tsx` | Lectura puntual.                             |
| `components/Private/Private-sidebar.tsx`, `Private-navbar.tsx`           | Logout.                                      |

#### Front: llamadas con autenticación (`apiClient` tercer arg `true` o `requiresAuth`)

Incluye (lista principal): `userServices` (`/api/private`, fotos, email, delete user, `password_change_request`), `settingsServices` (CRUD settings, bloqueos, export), `searchMatchServices` (`/api/private`, matches, likes, rejects recibidos), `gameServices` (POST/PUT/DELETE juegos), `reviewServices.postNewReview`, `emailServices` (`password_update`, `/api/token`), `Profile.tsx` / `Onboarding.tsx` (PUT perfil + refresco `getUserInfo`).

#### Próximo paso operativo

**Fases 0–3 cerradas en código** (ver secciones _Resultados_). Siguiente trabajo planificado: **Fase 4** en rama/issue dedicado.

---

## Fase 1 — Configuración y comprobación (sin cambiar login)

**Objetivo:** Supabase “enchufado” y verificable.

| Tarea                                                                                                                    | Criterio de hecho                                        |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Rellenar `.env` / producción: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Dashboard → Settings → API                               |
| Endpoint de salud opcional `GET /api/supabase_status`                                                                    | JSON `{ "admin_configured": bool }` sin filtrar secretos |
| Probar `get_supabase_admin()` desde shell Flask o test                                                                   | Cliente no `None` si env OK                              |

**Salida:** entorno documentado para el equipo.

### Fase 1 — Resultados _(ejecutada: 2026-04-12)_

| Entregable                 | Estado                                                                                                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Variables documentadas     | `.env.example` ya incluye `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y comentario del endpoint de comprobación.                                          |
| `GET /api/supabase_status` | **Implementado** (público, rate limit 60/min). Respuesta JSON: `supabase_url_configured`, `service_role_configured`, `python_supabase_sdk_installed`, `admin_client_ready`, `note` (sin URLs ni claves). |
| Test automático            | `tests/backend/test_auth.py` → `TestSupabaseStatus::test_supabase_status_public_ok`.                                                                                                                     |
| Comprobar cliente admin    | Tras definir env, en shell: `from api.supabase_admin import get_supabase_admin; print(get_supabase_admin() is not None)`.                                                                                |

**Ejemplo de respuesta** (`curl` / navegador):

```json
{
  "supabase_url_configured": false,
  "service_role_configured": false,
  "python_supabase_sdk_installed": true,
  "admin_client_ready": false,
  "note": "Las variables VITE_SUPABASE_* solo las comprueba el build del front; no están disponibles en este endpoint."
}
```

Con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` definidos y el paquete `supabase` instalado, `admin_client_ready` será `true`.

---

## Fase 2 — Auth Supabase en paralelo (solo lectura / prueba)

**Objetivo:** El front puede **obtener sesión Supabase** sin sustituir aún Flask.

| Tarea                                                                                                                                    | Criterio de hecho                    |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Pantalla o ruta dev-only (`/dev/supabase`) que llame `getSupabaseBrowserClient()` y muestre `isSupabaseConfigured` + `auth.getSession()` | Solo si `import.meta.env.DEV` o flag |
| Confirmar CORS / Site URL en Supabase para tu `FRONTEND_URL`                                                                             | Auth → URL configuration             |

**Salida:** verificación visual de que anon key y URL funcionan.

### Fase 2 — Resultados _(ejecutada: 2026-04-12)_

| Entregable                      | Estado                                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ruta dev                        | **`/dev/supabase`** → `src/front/pages/DevSupabase.tsx` (registrada en `routes.tsx`). Si no es `import.meta.env.DEV`, muestra aviso.                              |
| Sesión anon                     | Muestra `isSupabaseConfigured`, texto de `auth.getSession()` y JSON de **`GET /api/supabase_status`** (`fetch` a `/api/...` con proxy Vite o `VITE_BACKEND_URL`). |
| Site URL / redirect en Supabase | **Manual** en Dashboard → Authentication → URL Configuration (no versionable aquí).                                                                               |

---

## Fase 3 — Registro / login duales (convivencia)

**Objetivo:** Nuevos usuarios (o entorno staging) pueden registrarse **solo con Supabase**, sin romper usuarios legacy Flask.

| Tarea                                                                               | Criterio de hecho                                                                           |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| UI alternativa o flag “Registrar con Supabase”                                      | `signUp` + confirmación email si la activas en dashboard                                    |
| Tras `signUp`, crear fila `Profile` / vínculo en tu BD                              | Webhook, Edge Function, o `POST` Flask con **service role** validando el JWT recién emitido |
| Login: si sesión Supabase existe, opcionalmente llamar Flask para “hidratar” perfil | O solo Supabase hasta Fase 4                                                                |

**Salida:** al menos un flujo completo registro → sesión Supabase en staging.

### Fase 3 — Resultados _(ejecutada: 2026-04-12)_

| Entregable                                                       | Estado                                                                                                                                                                                                    |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Columna `users.supabase_auth_id` (UUID string, unique, nullable) | Migración `f3_supabase_auth_id` + modelo en `models.py`.                                                                                                                                                  |
| `POST /api/supabase_bootstrap`                                   | Valida `Authorization: Bearer <access_token>` con `fetch_supabase_user_from_jwt` (cliente admin); crea `User`+`Profile` o devuelve JWT Flask existente; 409 si el email ya existe solo con cuenta legacy. |
| UI “Registrar / Iniciar con Supabase”                            | `AuthForm` + `Register.tsx` / `SignIn.tsx` cuando `isSupabaseConfigured()`; `signUp` / `signInWithPassword` + bootstrap + mismo flujo `token` + `getUserInfo`.                                            |
| Servicio front                                                   | `userServices.bootstrapFromSupabaseAccessToken` vía `apiClient.request`.                                                                                                                                  |

**Próximo paso operativo**

**Fases 0–3 cerradas en código.** Siguiente: **Fase 4** (JWKS / aceptar JWT Supabase en rutas protegidas sin sustituir aún el bootstrap).

---

## Fase 4 — API Flask: confiar en JWT de Supabase

**Objetivo:** Rutas protegidas aceptan **Authorization: Bearer &lt;jwt_supabase&gt;** además del JWT actual (o sustituyen).

| Tarea                                                                                           | Criterio de hecho                         |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Validar firma con JWKS del proyecto (`https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`) | Librería JWT o `PyJWT` + `jwks`           |
| Extraer `sub` (UUID de `auth.users`) y resolver `User` interno                                  | Tabla `auth_user_id` o email único        |
| Middleware o decorador `@supabase_jwt_required` paralelo a `@jwt_required`                      | Migración incremental endpoint a endpoint |

**Salida:** un endpoint real (ej. `GET /api/private`) acepta ambos tokens en staging.

---

## Fase 5 — Migración de usuarios existentes

**Objetivo:** Usuarios Flask con contraseña hash migran a `auth.users` sin obligar reset masivo (o con reset controlado).

| Tarea                                                                              | Criterio de hecho                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Script one-off: leer `User`, crear usuario en Auth (Admin API) o invitar por email | `supabase.auth.admin.create_user` con `email_confirm: true` si aplica política |
| Guardar mapeo `user.id` ↔ `auth.users.id`                                          | Columna nueva o tabla `user_auth_map`                                          |
| Política para usuarios no migrados: siguen login Flask hasta fecha X               | Comunicación / banner en app                                                   |

**Salida:** N % de usuarios con ambos métodos o solo Supabase según decisión.

---

## Fase 6 — Sustituir flujos de contraseña / email

**Objetivo:** Dejar de depender de Flask-Mail para recuperación / cambio cuando el usuario ya esté en Auth.

| Tarea                                                                                            | Criterio de hecho                                            |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| “Olvidé contraseña” vía `resetPasswordForEmail` (Supabase)                                       | Front llama SDK; redirect URL en dashboard                   |
| Cambio desde Settings: o bien mismo flujo Supabase, o mantener email actual hasta 100 % migrados | Retirar `password_change_request` Flask cuando no haga falta |
| Ajustar plantillas en Supabase Auth                                                              | Idioma, marca PlayerLink                                     |

**Salida:** cero dependencia de SMTP para usuarios 100 % Supabase Auth.

---

## Fase 7 — RLS y endurecimiento

**Objetivo:** Datos sensibles solo con políticas; anon key segura en el cliente.

| Tarea                                                                                | Criterio de hecho                     |
| ------------------------------------------------------------------------------------ | ------------------------------------- |
| Políticas RLS en tablas expuestas al cliente (si el front lee Postgres vía Supabase) | Tests de política                     |
| Flask usa `service_role` solo en procesos server-side; front nunca                   | Auditoría de env                      |
| Retirar JWT Flask y código muerto                                                    | Deprecación documentada en CHANGE_LOG |

**Salida:** modelo de amenazas alineado con Supabase.

---

## Fase 8 — Opcional (Storage, Realtime, Edge)

**Objetivo:** Producto, no solo auth.

- Fotos de perfil en **Storage** (reemplazar o complementar Cloudinary si aplica).
- **Realtime** para chat/notificaciones si encaja arquitectura.
- **Edge Functions** para webhooks o lógica cerca de la BD.

---

## Orden recomendado (resumen)

0 → Inventario  
1 → Config + status  
2 → Prueba sesión en front  
3 → Registro/login dual + vínculo a `User`/`Profile`  
4 → Flask valida JWT Supabase  
5 → Migración de usuarios  
6 → Emails / contraseña vía Supabase  
7 → RLS + retirada Flask JWT  
8 → Storage / Realtime / Edge según prioridad

---

## Riesgos y mitigación

| Riesgo                                            | Mitigación                                                                              |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Doble fuente de verdad (Flask User vs auth.users) | Mapeo explícito y una sola “fuente” de email por usuario                                |
| Sesiones rotas al cambiar de issuer JWT           | Ventana de doble aceptación (Fase 4)                                                    |
| Pérdida de contraseñas al migrar                  | Invitación + reset controlado; no “importar” hashes Werkzeug a Supabase (no compatible) |

---

## Siguiente acción cuando quieras ejecutar

**Fases 0–3:** hechas en código (revisa URLs en el dashboard de Supabase a mano).

**Fases 4–8:** **no** deben aplicarse en un único commit: cambian el modelo de login, datos y seguridad. Abre **una rama o issue por fase** (siguiente: **Fase 4** en staging).

---

### Fases 3 a 8 — Por qué no van “todas ya” en el repo

| Fase  | Motivo de trabajo aparte                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------- |
| **3** | Nuevo flujo `signUp` / sesión Supabase + crear `User`/`Profile` en Flask (webhook o endpoint firmado).   |
| **4** | Validar JWT de Supabase (JWKS), mapear UUID ↔ `users.id`, tocar **todas** las rutas con `@jwt_required`. |
| **5** | Script de migración de usuarios + columna `auth_id` (ver Fase 0).                                        |
| **6** | Sustituir Flask-Mail / `password_change_request` para usuarios ya en Auth.                               |
| **7** | RLS en tablas y retirada del JWT Flask.                                                                  |
| **8** | Producto (Storage, Realtime, Edge); independiente de auth.                                               |
