# Mejoras de Seguridad Implementadas

## Fecha: 2025-01-XX

Este documento describe todas las mejoras de seguridad implementadas en la aplicación PlayerLink para fortalecer la postura de seguridad y proteger contra vulnerabilidades comunes.

---

## Resumen Ejecutivo

Se han implementado mejoras de seguridad críticas y de alta prioridad para proteger la aplicación contra vulnerabilidades comunes como:
- Almacenamiento inseguro de contraseñas
- Exposición de información sensible
- Ataques de fuerza bruta
- Vulnerabilidades de autorización (IDOR)
- Configuraciones inseguras

---

## Cambios Implementados

### 1. Almacenamiento Seguro de Contraseñas

**Problema**: Las contraseñas se almacenaban en texto plano en algunos endpoints.

**Solución**: 
- Se aplica `generate_password_hash()` en todos los endpoints que manejan contraseñas
- Endpoints corregidos:
  - `POST /api/users` - Registro de usuarios
  - `PUT /api/users/<user_id>` - Actualización de usuario
  - `PUT /api/password_update` - Reset de contraseña
  - `PUT /api/users_password/<user_id>` - Cambio de contraseña

**Archivos modificados**:
- `src/api/routes.py`

**Código de ejemplo**:
```python
# Antes (INSEGURO)
user.password = data['password']

# Después (SEGURO)
user.password = generate_password_hash(data['password'])
```

---

### 2. Configuración de CORS Restringida

**Problema**: CORS permitía peticiones desde cualquier origen, exponiendo la API a ataques CSRF.

**Solución**: 
- CORS configurado con orígenes específicos
- Orígenes permitidos se configuran mediante variable de entorno `CORS_ORIGINS`
- Por defecto: `http://localhost:5173,http://localhost:3000` (desarrollo)

**Archivos modificados**:
- `src/api/routes.py`

**Configuración**:
```python
allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
CORS(api, resources={r"/api/*": {"origins": allowed_origins, "supports_credentials": True}})
```

**Para producción**: Configurar `CORS_ORIGINS` en el archivo `.env` con los dominios permitidos.

---

### 3. Autenticación en Endpoints Sensibles

**Problema**: Endpoints públicos permitían crear, modificar o eliminar datos sin autenticación.

**Solución**: 
- Se agregó `@jwt_required()` a todos los endpoints que modifican datos
- Endpoints protegidos:
  - `POST /api/users` - Crear usuario
  - `PUT /api/users/<user_id>` - Modificar usuario
  - `DELETE /api/users/<user_id>` - Eliminar usuario
  - `POST /api/profiles/<user_id>` - Crear perfil
  - `PUT /api/profiles/<user_id>` - Modificar perfil
  - `DELETE /api/profiles/<user_id>` - Eliminar perfil
  - `POST /api/reviews` - Crear reseña
  - `PUT /api/reviews/<review_id>` - Modificar reseña
  - `DELETE /api/reviews/<review_id>` - Eliminar reseña
  - `POST /api/matches` - Crear match
  - `DELETE /api/matches/<match_id>` - Eliminar match
  - `POST /api/games/<profile_id>` - Agregar juego
  - `DELETE /api/games/<game_id>` - Eliminar juego
  - `POST /api/chat` - Endpoint de chat con OpenAI

**Archivos modificados**:
- `src/api/routes.py`

---

### 4. Prevención de IDOR (Insecure Direct Object Reference)

**Problema**: Usuarios autenticados podían modificar datos de otros usuarios.

**Solución**: 
- Implementada función `verify_ownership()` para verificar que el usuario solo modifique sus propios datos
- Decorador `require_ownership()` para aplicar la verificación automáticamente
- Verificación aplicada en todos los endpoints que modifican recursos de usuario

**Archivos modificados**:
- `src/api/routes.py`

**Código implementado**:
```python
def verify_ownership(user_id_from_token, resource_user_id):
    """Verify that the authenticated user owns the resource"""
    return str(user_id_from_token) == str(resource_user_id)

# Uso en endpoints:
current_user_id = get_jwt_identity()
if not verify_ownership(current_user_id, user_id):
    return jsonify({'error': 'Unauthorized: You can only modify your own data'}), 403
```

---

### 5. Validación de JWT_SECRET_KEY

**Problema**: Si `JWT_SECRET_KEY` no estaba configurado, JWT podía usar valores por defecto inseguros.

**Solución**: 
- Validación que lanza error si `JWT_SECRET_KEY` no está configurado
- Previene falsificación de tokens JWT

**Archivos modificados**:
- `src/app.py`

**Código implementado**:
```python
jwt_secret_key = os.getenv('JWT_SECRET_KEY')
if not jwt_secret_key:
    raise RuntimeError("JWT_SECRET_KEY environment variable is required and must be set. Please configure it in your .env file.")
app.config['JWT_SECRET_KEY'] = jwt_secret_key
```

---

### 6. Debug Mode Desactivado en Producción

**Problema**: Debug mode siempre activado, exponiendo información sensible en producción.

**Solución**: 
- Debug mode solo se activa si `FLASK_DEBUG=1` está en variables de entorno
- Por defecto está desactivado

**Archivos modificados**:
- `src/app.py`

**Código implementado**:
```python
# Antes (INSEGURO)
app.run(host='0.0.0.0', port=PORT, debug=True)

# Después (SEGURO)
debug_mode = os.getenv('FLASK_DEBUG') == '1'
app.run(host='0.0.0.0', port=PORT, debug=debug_mode)
```

---

### 7. Prevención de Email Enumeration

**Problema**: Mensajes de error específicos permitían enumerar emails válidos en el sistema.

**Solución**: 
- Mensajes genéricos en login y reset de contraseña
- Mismo tiempo de respuesta independientemente de si el email existe

**Archivos modificados**:
- `src/api/routes.py`

**Código implementado**:
```python
# Antes (INSEGURO)
if not user:
    return jsonify({'error': 'el email no esta registrado, registrate'}), 418

# Después (SEGURO)
if not user or not check_password_hash(user.password, data['password']):
    return jsonify({'error': 'Email o contraseña incorrectos'}), 401
```

---

### 8. Rate Limiting Implementado

**Problema**: Sin rate limiting, la API era vulnerable a ataques de fuerza bruta y abuso.

**Solución**: 
- Implementado `flask-limiter` con límites globales y específicos
- Límites globales: 200 requests por día, 50 por hora
- Límites específicos:
  - Login: 5 intentos por minuto
  - Registro: 5 intentos por minuto
  - Reset de contraseña: 3 intentos por hora
  - Chat: 30 requests por minuto

**Archivos modificados**:
- `src/app.py`
- `requirements.txt`

**Dependencia agregada**:
```
flask-limiter==3.5.0
```

**Configuración**:
```python
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)
```

---

### 9. Validación de Entrada Robusta

**Problema**: Falta de validación permitía datos maliciosos o inválidos.

**Solución**: 
- Funciones de validación implementadas:
  - `validate_email()`: Valida formato de email con regex
  - `validate_password_strength()`: Valida fortaleza de contraseña
- Validación aplicada en:
  - Registro de usuarios
  - Cambio de contraseña
  - Reset de contraseña
  - Actualización de email

**Archivos modificados**:
- `src/api/routes.py`

**Requisitos de contraseña**:
- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos un número
- Al menos un carácter especial (@$!%*?&.)

**Código de ejemplo**:
```python
def validate_email(email):
    """Validate email format"""
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_password_strength(password):
    """Validate password strength"""
    # Validaciones implementadas...
```

---

### 10. Expiración de Tokens JWT

**Problema**: Tokens JWT sin expiración permanecían válidos indefinidamente si eran comprometidos.

**Solución**: 
- Tokens de acceso: Expiran en 24 horas
- Tokens de reset de contraseña: Expiran en 1 hora

**Archivos modificados**:
- `src/api/routes.py`

**Código implementado**:
```python
# Token de acceso normal
token = create_access_token(
    identity=str(user.id),
    expires_delta=timedelta(hours=24)
)

# Token de reset de contraseña
token = create_access_token(
    identity=str(user.id),
    expires_delta=timedelta(hours=1)
)
```

---

### 11. Manejo Seguro de Errores

**Problema**: Errores exponían información sensible (stack traces, rutas de archivos, etc.).

**Solución**: 
- Mensajes de error genéricos para el cliente
- Detalles de error solo en logs del servidor
- Eliminación de prints que exponen datos sensibles

**Archivos modificados**:
- `src/api/routes.py`

**Código implementado**:
```python
# Antes (INSEGURO)
except Exception as e:
    return jsonify({"error": str(e)}), 500
    print("Registration error:", e)

# Después (SEGURO)
except Exception as e:
    print(f"Registration error: {type(e).__name__}")  # Solo tipo, no detalles
    return jsonify({'error': 'Internal error during registration'}), 500
```

---

## Configuración Requerida

### Variables de Entorno

Asegúrate de configurar las siguientes variables en tu archivo `.env`:

```env
# Requerido - Clave secreta para JWT (debe ser una cadena larga y aleatoria)
JWT_SECRET_KEY=tu_clave_secreta_muy_larga_y_aleatoria_aqui

# Requerido - URL de conexión a la base de datos
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# Opcional - Orígenes permitidos para CORS (separados por comas)
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com

# Opcional - Activar debug mode (solo en desarrollo)
FLASK_DEBUG=1

# Requerido - Clave de OpenAI para el chat
OPENAI_API_KEY=tu_clave_de_openai
```

### Instalación de Dependencias

Se agregó una nueva dependencia de seguridad:

```bash
pip install flask-limiter==3.5.0
```

O si usas `requirements.txt`:
```bash
pip install -r requirements.txt
```

---

## Pruebas de Seguridad Recomendadas

Después de implementar estos cambios, se recomienda realizar las siguientes pruebas:

1. **Prueba de Rate Limiting**:
   - Intentar más de 5 logins por minuto desde la misma IP
   - Verificar que se bloquea después del límite

2. **Prueba de Autorización**:
   - Intentar modificar datos de otro usuario con un token válido
   - Verificar que se rechaza con error 403

3. **Prueba de Validación**:
   - Intentar registrar usuario con email inválido
   - Intentar registrar usuario con contraseña débil
   - Verificar que se rechazan con mensajes apropiados

4. **Prueba de Email Enumeration**:
   - Intentar login con email que no existe
   - Intentar login con email que existe pero contraseña incorrecta
   - Verificar que ambos devuelven el mismo mensaje genérico

---

## Mejoras Futuras Recomendadas

Aunque se han implementado las mejoras críticas, se recomienda considerar las siguientes mejoras adicionales:

1. **Refresh Tokens**: Implementar sistema de refresh tokens para mejor experiencia de usuario
2. **Logging de Seguridad**: Implementar logging de eventos de seguridad (intentos de login fallidos, cambios de contraseña, etc.)
3. **Headers de Seguridad**: Agregar headers de seguridad (HSTS, CSP, X-Frame-Options, etc.)
4. **Sanitización de HTML**: Sanitizar inputs de texto que puedan contener HTML (comentarios, reviews)
5. **Validación de Archivos**: Si se implementa upload de archivos, validar tipo MIME y escanear con antivirus
6. **Monitoreo**: Implementar alertas para actividades sospechosas
7. **Tests de Seguridad**: Implementar tests automatizados para vulnerabilidades comunes

---

## Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Flask Security Best Practices](https://flask.palletsprojects.com/en/2.3.x/security/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## Contacto

Para preguntas sobre estas mejoras de seguridad, contactar al equipo de desarrollo.

