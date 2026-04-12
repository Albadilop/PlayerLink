"""
Validation and authorization helper functions
"""
import re
import io
from typing import Optional, Tuple, Callable, Any
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import OperationalError
from api.models import db, User, Profile

# Intentar importar Pillow para validación de imágenes
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def validate_email(email: str) -> bool:
    """Validate email format"""
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """Validate password strength"""
    if not password or not isinstance(password, str):
        return False, "Password is required"
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    if not re.search(r'[@$!%*?&.]', password):
        return False, "Password must contain at least one special character (@$!%*?&.)"
    return True, None


def verify_ownership(user_id_from_token: str, resource_user_id: str) -> bool:
    """Verify that the authenticated user owns the resource"""
    return str(user_id_from_token) == str(resource_user_id)


def require_ownership(f):
    """Decorator to verify user owns the resource they're trying to modify"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        # Extract user_id from kwargs or args
        user_id = kwargs.get('user_id') or (args[0] if args else None)
        if user_id and not verify_ownership(current_user_id, user_id):
            return jsonify({'error': 'Unauthorized: You can only modify your own data'}), 403
        return f(*args, **kwargs)
    return decorated_function


def require_user_exists(param_name: str = 'user_id'):
    """Decorator to verify that a user exists before executing the endpoint"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = kwargs.get(param_name) or (args[0] if args else None)
            if not user_id:
                return jsonify({'error': f'{param_name} is required'}), 400
            
            user = db.session.get(User, user_id)
            if not user:
                return jsonify({'error': f'User with id {user_id} not found'}), 404
            
            # Inject user into kwargs for use in the endpoint
            kwargs['_user'] = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_profile_exists(param_name: str = 'user_id'):
    """Decorator to verify that a profile exists before executing the endpoint"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = kwargs.get(param_name) or (args[0] if args else None)
            if not user_id:
                return jsonify({'error': f'{param_name} is required'}), 400
            
            user = db.session.get(User, user_id)
            if not user:
                return jsonify({'error': f'User with id {user_id} not found'}), 404
            
            if not user.profile:
                return jsonify({'error': f'Profile for user {user_id} does not exist'}), 404
            
            # Inject user and profile into kwargs
            kwargs['_user'] = user
            kwargs['_profile'] = user.profile
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def validate_json(required_fields: Optional[list[str]] = None):
    """Decorator to validate that request has valid JSON and required fields"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Missing or invalid JSON data'}), 400
            
            if required_fields:
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        'error': f'Missing required fields: {", ".join(missing_fields)}'
                    }), 400
            
            # Inject data into kwargs
            kwargs['_data'] = data
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def handle_errors(f: Callable) -> Callable:
    """Decorator to handle errors consistently across endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except KeyError as e:
            return jsonify({'error': f'Missing required field: {str(e)}'}), 400
        except OperationalError as e:
            import logging

            logging.error(f'Database error in {f.__name__}: {str(e)}', exc_info=True)
            msg = str(e).lower()
            err_text = (
                'No se pudo conectar con la base de datos. '
                'Comprueba DATABASE_URL y que el proyecto Supabase siga activo.'
            )
            if any(
                x in msg
                for x in (
                    'timeout',
                    'timed out',
                    'could not translate host name',
                    'connection refused',
                    'network is unreachable',
                    'no route to host',
                )
            ):
                err_text += (
                    ' Si usas Supabase desde Windows o una red sin IPv6 fiable, no uses la URI '
                    '«Direct connection» a db.*.supabase.co: sustituye DATABASE_URL por la cadena '
                    '«Session pooler» del panel (arriba: Connect → pestaña Session / ORM).'
                )
            if 'password authentication failed' in msg or 'sasl authentication' in msg:
                err_text += ' Revisa usuario y contraseña de la base en el panel (Database).'
            return jsonify({'error': err_text}), 503
        except Exception as e:
            # Log the error in production
            import logging
            logging.error(f'Error in {f.__name__}: {str(e)}', exc_info=True)
            return jsonify({'error': 'An internal server error occurred'}), 500
    return decorated_function


def validate_image_file(file, max_size_mb: int = 5, max_width: int = 2000, max_height: int = 2000) -> Tuple[bool, Optional[str]]:
    """
    Valida un archivo de imagen de forma robusta para prevenir contenido inapropiado.
    
    Validaciones realizadas:
    1. Verificación de magic bytes (firma del archivo) - no se puede falsificar fácilmente
    2. Verificación del tipo MIME real
    3. Validación con PIL para asegurar que es una imagen válida
    4. Verificación de dimensiones máximas
    5. Verificación de tamaño del archivo
    
    Args:
        file: Archivo de Flask (request.files['photo'])
        max_size_mb: Tamaño máximo en MB (default: 5MB)
        max_width: Ancho máximo en píxeles (default: 2000px)
        max_height: Alto máximo en píxeles (default: 2000px)
    
    Returns:
        Tuple[bool, Optional[str]]: (es_válido, mensaje_de_error)
    """
    # Verificar que el archivo existe
    if not file or not file.filename:
        return False, "No se proporcionó ningún archivo"
    
    # Leer los primeros bytes para verificar magic bytes
    file.seek(0)
    header = file.read(12)
    file.seek(0)  # Resetear posición
    
    # Magic bytes para diferentes formatos de imagen
    # PNG: 89 50 4E 47 0D 0A 1A 0A
    # JPEG: FF D8 FF
    # GIF: 47 49 46 38 (GIF8)
    # WEBP: RIFF ... WEBP
    
    is_png = header.startswith(b'\x89PNG\r\n\x1a\n')
    is_jpeg = header.startswith(b'\xff\xd8\xff')
    is_gif = header.startswith(b'GIF87a') or header.startswith(b'GIF89a')
    is_webp = header.startswith(b'RIFF') and b'WEBP' in header[:12]
    
    if not (is_png or is_jpeg or is_gif or is_webp):
        return False, "Tipo de archivo no válido. Solo se permiten imágenes PNG, JPEG, GIF o WEBP válidas"
    
    # Verificar extensión del archivo
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    filename = file.filename.lower()
    file_ext = filename.rsplit('.', 1)[1] if '.' in filename else ''
    
    if file_ext not in allowed_extensions:
        return False, "Extensión de archivo no permitida. Solo se permiten: png, jpg, jpeg, gif, webp"
    
    # Verificar que la extensión coincida con los magic bytes
    if is_png and file_ext not in {'png'}:
        return False, "La extensión del archivo no coincide con el tipo de imagen real"
    if is_jpeg and file_ext not in {'jpg', 'jpeg'}:
        return False, "La extensión del archivo no coincide con el tipo de imagen real"
    if is_gif and file_ext not in {'gif'}:
        return False, "La extensión del archivo no coincide con el tipo de imagen real"
    if is_webp and file_ext not in {'webp'}:
        return False, "La extensión del archivo no coincide con el tipo de imagen real"
    
    # Verificar tamaño del archivo
    file.seek(0, 2)  # Ir al final del archivo
    file_size = file.tell()
    file.seek(0)  # Resetear posición
    
    max_size_bytes = max_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        return False, f"El archivo es demasiado grande. Tamaño máximo: {max_size_mb}MB"
    
    if file_size == 0:
        return False, "El archivo está vacío"
    
    # Validación con PIL si está disponible
    if PIL_AVAILABLE:
        try:
            # Leer el archivo completo en memoria para validación
            file.seek(0)
            image_data = file.read()
            file.seek(0)  # Resetear para uso posterior
            
            # Abrir imagen con PIL para validar
            image = Image.open(io.BytesIO(image_data))
            
            # Verificar que realmente es una imagen válida
            image.verify()
            
            # Reabrir la imagen (verify() cierra el archivo)
            image = Image.open(io.BytesIO(image_data))
            
            # Verificar dimensiones
            width, height = image.size
            if width > max_width or height > max_height:
                return False, f"Las dimensiones de la imagen son demasiado grandes. Máximo: {max_width}x{max_height} píxeles"
            
            # Verificar que no es una imagen corrupta o malformada
            # Intentar cargar la imagen completamente
            image.load()
            
            # Verificar formato permitido
            if image.format not in {'PNG', 'JPEG', 'GIF', 'WEBP'}:
                return False, f"Formato de imagen no permitido: {image.format}"
            
        except Exception as e:
            return False, f"La imagen no es válida o está corrupta: {str(e)}"
    else:
        # Si PIL no está disponible, solo confiamos en magic bytes
        # Esto es menos seguro pero mejor que nada
        pass
    
    return True, None


