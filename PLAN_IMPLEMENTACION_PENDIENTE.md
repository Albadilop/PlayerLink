# Plan de Implementación - Pasos Pendientes

## 📊 Estado Actual vs Plan Inicial

### ✅ COMPLETADO

#### 1. Frontend: Migrar a TypeScript

- **Estado**: ~60% completado
- **Completado**:
  - ✅ Configuración TypeScript (100%)
  - ✅ Todos los servicios migrados (6 servicios)
  - ✅ Utilidades y hooks migrados
  - ✅ 12 componentes críticos migrados
- **Pendiente**: ~15 archivos `.jsx` restantes

#### 2. Backend: Mejorar Type Hints

- **Estado**: ~30% completado
- **Completado**:
  - ✅ Funciones de utilidad tipadas
  - ✅ Funciones de validación tipadas
  - ✅ Endpoints principales tipados (register, login, chat, check_mail)
- **Pendiente**: Resto de endpoints y funciones auxiliares

#### 3. Testing

- **Estado Backend**: 50% completado (41 tests, 54% coverage)
- **Estado Frontend**: 15% completado (8 tests básicos)
- **Completado**:
  - ✅ Estructura completa de tests backend
  - ✅ Tests de endpoints principales (auth, profiles, games, matches, reviews)
  - ✅ Configuración Jest para frontend
  - ✅ Tests básicos de utilidades y componentes
- **Pendiente**:
  - Tests de servicios frontend (requiere config `import.meta.env`)
  - Tests de componentes complejos
  - Tests de integración
  - Más coverage backend (>60%)

#### 4. Estructura de Carpetas

- **Completado**:
  - ✅ `src/front/types/` creado
- **Pendiente**:
  - ❌ Refactorizar `src/api/routes.py` en módulos por dominio
  - ❌ Crear `src/front/constants/`
  - ❌ Crear `src/front/api/` para clientes API tipados

#### 5. Gestión de Estado

- **Estado**: No implementado
- **Actual**: Context API + useReducer
- **Pendiente**: Evaluar y posiblemente migrar a Zustand o Redux Toolkit

#### 6. Formateo de Código

- **Estado**: No implementado
- **Pendiente**:
  - ❌ Prettier
  - ❌ Husky para pre-commit hooks

#### 7. Separación de Repositorios

- **Estado**: No implementado (opcional)
- **Pendiente**: Evaluar necesidad según crecimiento del equipo

---

## 🎯 PLAN DE IMPLEMENTACIÓN DETALLADO

### FASE 1: Completar Migración TypeScript (Alta Prioridad)

#### 1.1 Componentes Restantes a Migrar

**Archivos identificados (15 archivos):**

**Páginas:**

- `src/front/pages/Privateviews/Profile.jsx` ⚠️ **CRÍTICO**
- `src/front/pages/Privateviews/Search-mate.jsx` ⚠️ **CRÍTICO**
- `src/front/pages/Privateviews/Your-matches.jsx`
- `src/front/pages/Privateviews/Settings.jsx`
- `src/front/pages/Privateviews/Find-games.jsx`

**Componentes:**

- `src/front/components/Private/Private-layout.jsx` ⚠️ **CRÍTICO**
- `src/front/components/Private/Private-navbar.jsx`
- `src/front/components/Private/Private-sidebar.jsx`
- `src/front/components/SearchMatchCard/SearchMatchCard.jsx`
- `src/front/components/matchUserDetails.jsx`
- `src/front/components/matchMiniCard.jsx`
- `src/front/components/ItsMatch/ItsMatch.jsx`
- `src/front/components/ProfileModals/LanguageModal.jsx`
- `src/front/components/ProfileModals/GamingPreferencesModal.jsx`
- `src/front/components/ProfileConditions/ProfileConditions.jsx`

**Orden de Prioridad:**

1. Componentes críticos de navegación (Private-layout, Private-navbar, Private-sidebar)
2. Páginas principales (Profile, Search-mate)
3. Componentes de funcionalidad (SearchMatchCard, matchUserDetails, ItsMatch)
4. Modales y componentes auxiliares

**Estimación**: 2-3 días de trabajo

---

### FASE 2: Completar Type Hints Backend (Alta Prioridad)

#### 2.1 Endpoints Pendientes de Tipar

**Análisis de `routes.py`** (estimado ~50 endpoints):

**Ya tipados:**

- ✅ `register()`, `login()`, `chat()`, `check_mail()`

**Pendientes de tipar:**

- `get_user_info()` - GET /api/private
- `get_profiles()` - GET /api/profiles
- `get_single_profile()` - GET /api/profiles/<id>
- `update_profile()` - PUT /api/profiles/<id>
- `post_game()` - POST /api/games/<profile_id>
- `get_games()` - GET /api/games
- `put_game_hours()` - PUT /api/games/hours/<id>
- `delete_game()` - DELETE /api/games/<id>
- `post_review()` - POST /api/reviews/<author_id>/<receiver_id>
- `get_reviews()` - GET /api/reviews
- `put_review()` - PUT /api/reviews/<id>
- `delete_review()` - DELETE /api/reviews/<id>
- `post_match()` - POST /api/matches/<user1_id>/<user2_id>
- `get_matches()` - GET /api/matches
- `post_like()` - POST /api/likes/<liker_id>/<liked_id>
- `post_reject()` - POST /api/rejects/<rejecter_id>/<rejected_id>
- `password_update()` - PUT /api/password_update
- Y otros endpoints...

**Plan de Implementación:**

1. Agregar type hints a todos los endpoints de perfiles
2. Agregar type hints a todos los endpoints de juegos
3. Agregar type hints a todos los endpoints de reviews
4. Agregar type hints a todos los endpoints de matches/likes/rejects
5. Agregar type hints a funciones auxiliares en `utils.py` y `commands.py`

**Estimación**: 1-2 días de trabajo

---

### FASE 3: Expandir Tests (Alta Prioridad)

#### 3.1 Tests Backend Pendientes

**Objetivo**: Llegar a >60% coverage (actualmente 54%)

**Tests a agregar:**

1. **Tests de Rate Limiting** (`test_rate_limiting.py`)
   - Verificar límites en register, login, check_mail, chat
   - Verificar bloqueo después de exceder límites

2. **Tests de Seguridad** (`test_security.py`)
   - Verificar protección CSRF
   - Verificar validación de JWT tokens
   - Verificar protección de endpoints privados
   - Verificar sanitización de inputs

3. **Tests de Endpoints Adicionales**
   - Tests de likes/rejects
   - Tests de endpoints de usuarios
   - Tests de endpoints de búsqueda

4. **Tests de Edge Cases**
   - Datos inválidos
   - Recursos no encontrados
   - Conflictos (duplicados, etc.)

**Estimación**: 2-3 días de trabajo

#### 3.2 Tests Frontend Pendientes

**Objetivo**: Llegar a >40% coverage

**Tests a agregar:**

1. **Configurar Jest para `import.meta.env`**
   - Resolver problema con servicios
   - Habilitar tests de servicios existentes

2. **Tests de Componentes**
   - `SignIn.test.tsx` - Formulario de login
   - `Register.test.tsx` - Formulario de registro
   - `Profile.test.tsx` - Componente de perfil (complejo)
   - `SearchMatchCard.test.tsx` - Tarjeta de match

3. **Tests de Hooks**
   - `useGlobalReducer.test.tsx` - Estado global

4. **Tests de Integración**
   - Flujo completo de registro
   - Flujo completo de login
   - Flujo de búsqueda de matches

**Estimación**: 3-4 días de trabajo

---

### FASE 4: Refactorizar Estructura Backend (Media Prioridad)

#### 4.1 Separar `routes.py` en Módulos

**Estructura propuesta:**

```
src/api/
├── routes/
│   ├── __init__.py          # Registrar todos los blueprints
│   ├── auth.py              # register, login, check_mail, password_update
│   ├── profiles.py          # CRUD de perfiles
│   ├── games.py             # CRUD de juegos
│   ├── reviews.py           # CRUD de reviews
│   ├── matches.py           # matches, likes, rejects
│   └── users.py             # endpoints de usuarios
├── routes.py                # DEPRECATED (mantener temporalmente)
└── ...
```

**Plan de Implementación:**

1. Crear estructura de carpetas `src/api/routes/`
2. Mover endpoints de autenticación a `auth.py`
3. Mover endpoints de perfiles a `profiles.py`
4. Mover endpoints de juegos a `games.py`
5. Mover endpoints de reviews a `reviews.py`
6. Mover endpoints de matches a `matches.py`
7. Actualizar `__init__.py` para registrar todos los blueprints
8. Actualizar `app.py` para importar desde nueva estructura
9. Verificar que todos los tests sigan funcionando
10. Eliminar `routes.py` antiguo

**Estimación**: 2-3 días de trabajo

---

### FASE 5: Mejorar Estructura Frontend (Media Prioridad)

#### 5.1 Crear `src/front/constants/`

**Archivos a crear:**

- `constants/api.ts` - URLs y endpoints de API
- `constants/validation.ts` - Reglas de validación
- `constants/ui.ts` - Constantes de UI (colores, tamaños, etc.)

#### 5.2 Crear `src/front/api/` (Opcional)

**Alternativa**: Los servicios ya están bien organizados en `services/`
**Si se implementa:**

- Crear clientes API tipados con mejor estructura
- Separar lógica de negocio de llamadas HTTP

**Estimación**: 1 día de trabajo

---

### FASE 6: Formateo de Código (Media Prioridad)

#### 6.1 Instalar y Configurar Prettier

**Pasos:**

1. Instalar Prettier: `npm install --save-dev prettier`
2. Crear `.prettierrc` con configuración
3. Crear `.prettierignore`
4. Agregar script `format` a `package.json`
5. Formatear todo el código existente

#### 6.2 Configurar Husky

**Pasos:**

1. Instalar Husky: `npm install --save-dev husky`
2. Inicializar Husky: `npx husky install`
3. Crear pre-commit hook para:
   - Ejecutar Prettier
   - Ejecutar ESLint
   - Ejecutar tests (opcional, puede ser lento)

**Estimación**: 1 día de trabajo

---

### FASE 7: Evaluar Gestión de Estado (Baja Prioridad)

#### 7.1 Análisis Actual

- **Estado**: Context API + useReducer funciona bien
- **Problemas potenciales**:
  - Re-renders innecesarios
  - Complejidad al crecer

#### 7.2 Evaluación de Alternativas

**Opciones:**

1. **Zustand** - Más simple, menos boilerplate
2. **Redux Toolkit** - Más robusto, más estructura

**Recomendación**: Mantener Context API por ahora, evaluar si surgen problemas de rendimiento

**Estimación**: 1-2 días (solo si se decide migrar)

---

## 📅 CRONOGRAMA SUGERIDO

### Semana 1: Completar TypeScript y Type Hints

- **Día 1-2**: Migrar componentes críticos restantes (Private-layout, Profile, Search-mate)
- **Día 3-4**: Completar type hints en endpoints backend
- **Día 5**: Revisión y ajustes

### Semana 2: Expandir Tests

- **Día 1-2**: Tests backend adicionales (rate limiting, seguridad)
- **Día 3-4**: Configurar Jest para servicios frontend y agregar tests
- **Día 5**: Tests de componentes frontend

### Semana 3: Refactorización y Mejoras

- **Día 1-2**: Refactorizar `routes.py` en módulos
- **Día 3**: Mejorar estructura frontend (constants)
- **Día 4**: Configurar Prettier y Husky
- **Día 5**: Formatear código y documentar

---

## 🎯 PRIORIZACIÓN FINAL

### 🔴 ALTA PRIORIDAD (Hacer primero)

1. ✅ Completar migración TypeScript de componentes críticos
2. ✅ Completar type hints en endpoints backend principales
3. ✅ Expandir tests backend para llegar a >60% coverage
4. ✅ Configurar Jest para tests de servicios frontend

### 🟡 MEDIA PRIORIDAD (Hacer después)

1. Refactorizar `routes.py` en módulos por dominio
2. Agregar Prettier y Husky
3. Crear `src/front/constants/`
4. Migrar componentes restantes de TypeScript

### 🟢 BAJA PRIORIDAD (Opcional/Futuro)

1. Evaluar migración a Zustand/Redux Toolkit
2. Crear `src/front/api/` para clientes API
3. Separar repositorios (solo si el equipo crece significativamente)

---

## 📊 MÉTRICAS DE ÉXITO

### Objetivos a Alcanzar

- ✅ **TypeScript**: 100% de archivos críticos migrados
- ✅ **Type Hints Backend**: 80% de funciones y endpoints tipados
- ✅ **Tests Backend**: >60% coverage (actualmente 54%)
- ✅ **Tests Frontend**: >40% coverage (actualmente ~5%)
- ✅ **Código formateado**: 100% con Prettier
- ✅ **Estructura**: `routes.py` refactorizado en módulos

---

## 🚀 COMANDOS ÚTILES

### Verificar progreso TypeScript

```bash
# Contar archivos .jsx restantes
find src/front -name "*.jsx" | wc -l

# Verificar tipos
npm run type-check
```

### Ejecutar tests

```bash
# Backend
python -m pytest tests/backend/ -v --cov=src --cov-report=term-missing

# Frontend
npm test
npm run test:coverage
```

### Formatear código (cuando Prettier esté configurado)

```bash
npm run format
```

---

**Última actualización**: Basado en estado actual del proyecto
**Próxima revisión**: Después de completar Fase 1
