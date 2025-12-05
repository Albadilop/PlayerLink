# Changelog - Mejoras de Seguridad

## [2025-01-XX] - Mejoras de Seguridad Críticas

### 🔒 Seguridad

#### Crítico
- **FIXED**: Contraseñas ahora se almacenan con hash en todos los endpoints
  - `POST /api/users` - Hash aplicado al crear usuario
  - `PUT /api/users/<user_id>` - Hash aplicado al actualizar contraseña
  - `PUT /api/password_update` - Hash aplicado en reset de contraseña
  - `PUT /api/users_password/<user_id>` - Hash aplicado en cambio de contraseña

- **FIXED**: CORS configurado con orígenes específicos
  - Variable de entorno `CORS_ORIGINS` para configurar dominios permitidos
  - Por defecto: `http://localhost:5173,http://localhost:3000` (desarrollo)

- **FIXED**: Autenticación requerida en endpoints sensibles
  - Todos los endpoints que modifican datos ahora requieren `@jwt_required()`
  - Endpoints de chat, creación/modificación/eliminación protegidos

- **FIXED**: Prevención de IDOR (Insecure Direct Object Reference)
  - Función `verify_ownership()` implementada
  - Usuarios solo pueden modificar sus propios datos

- **FIXED**: Validación de JWT_SECRET_KEY
  - Error si no está configurado
  - Previene falsificación de tokens

- **FIXED**: Debug mode desactivado en producción
  - Solo se activa si `FLASK_DEBUG=1` está configurado

#### Alto
- **FIXED**: Prevención de email enumeration
  - Mensajes genéricos en login y reset de contraseña
  - Mismo tiempo de respuesta para prevenir timing attacks

- **ADDED**: Rate limiting implementado
  - Límites globales: 200/día, 50/hora
  - Límites específicos:
    - Login: 5/minuto
    - Registro: 5/minuto
    - Reset contraseña: 3/hora
    - Chat: 30/minuto

- **ADDED**: Validación de entrada robusta
  - Validación de formato de email (regex)
  - Validación de fortaleza de contraseña:
    - Mínimo 8 caracteres
    - Al menos una mayúscula
    - Al menos un número
    - Al menos un carácter especial

- **FIXED**: Expiración de tokens JWT
  - Tokens de acceso: 24 horas
  - Tokens de reset: 1 hora

- **FIXED**: Manejo seguro de errores
  - Mensajes genéricos para clientes
  - Detalles solo en logs del servidor
  - Eliminación de prints que exponen datos sensibles

### 📦 Dependencias

- **ADDED**: `flask-limiter==3.5.0` - Para rate limiting

### 📝 Archivos Modificados

- `src/app.py` - Configuración de seguridad (JWT, rate limiting, debug mode)
- `src/api/routes.py` - Implementación de todas las mejoras de seguridad
- `requirements.txt` - Agregada dependencia flask-limiter

### ⚠️ Breaking Changes

- **CORS**: Ahora requiere configuración de `CORS_ORIGINS` en producción
- **JWT_SECRET_KEY**: Ahora es obligatorio (error si no está configurado)
- **Autenticación**: Endpoints que antes eran públicos ahora requieren autenticación
- **Validación**: Contraseñas deben cumplir requisitos de fortaleza
- **Tokens**: Tokens JWT ahora expiran (24h acceso, 1h reset)

### 🔄 Migración

1. Actualizar archivo `.env` con:
   ```env
   JWT_SECRET_KEY=tu_clave_secreta_muy_larga_y_aleatoria
   CORS_ORIGINS=https://tudominio.com
   ```

2. Instalar nueva dependencia:
   ```bash
   pip install flask-limiter==3.5.0
   ```

3. Reiniciar la aplicación

### 📚 Documentación

- Ver `docs/SECURITY_IMPROVEMENTS.md` para detalles completos

