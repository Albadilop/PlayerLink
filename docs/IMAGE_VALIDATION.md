# Validación de Imágenes - Prevención de Contenido Inapropiado

Este documento describe las validaciones implementadas para prevenir la subida de contenido inapropiado en las fotos de perfil.

## Validaciones Implementadas

### 1. Validación de Magic Bytes (Firma del Archivo)

- **¿Qué es?**: Los magic bytes son los primeros bytes de un archivo que identifican su tipo real.
- **¿Por qué es importante?**: Previene que usuarios maliciosos cambien la extensión de un archivo para hacerlo pasar por una imagen.
- **Formatos soportados**:
  - PNG: `89 50 4E 47 0D 0A 1A 0A`
  - JPEG: `FF D8 FF`
  - GIF: `47 49 46 38` (GIF87a o GIF89a)
  - WEBP: `RIFF ... WEBP`

### 2. Validación de Tipo MIME Real

- Verifica que el tipo MIME del archivo coincida con su extensión.
- Previene archivos disfrazados como imágenes.

### 3. Validación con PIL (Pillow)

- Verifica que el archivo sea realmente una imagen válida y no esté corrupta.
- Valida el formato de la imagen.
- Detecta imágenes malformadas o con datos corruptos.

### 4. Validación de Dimensiones

- **Límites actuales**:
  - Ancho máximo: 2000 píxeles
  - Alto máximo: 2000 píxeles
- Previene imágenes extremadamente grandes que podrían causar problemas de rendimiento.

### 5. Validación de Tamaño de Archivo

- **Límite actual**: 5MB
- Previene archivos demasiado grandes que podrían causar problemas de almacenamiento y rendimiento.

### 6. Validación de Extensión

- Solo permite extensiones: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
- Verifica que la extensión coincida con los magic bytes del archivo.

## Validaciones en el Frontend

El frontend también realiza validaciones básicas antes de enviar el archivo:

- Tipo MIME del archivo
- Tamaño del archivo
- Dimensiones de la imagen (usando el objeto Image de JavaScript)

**Nota**: Las validaciones del frontend son solo para mejorar la experiencia del usuario. Las validaciones del backend son las que realmente importan para la seguridad.

## Mejoras Futuras Recomendadas

### 1. Moderación de Contenido con APIs

Para detectar contenido inapropiado (nudidad, violencia, etc.), se pueden integrar servicios como:

- **AWS Rekognition**: Detección de contenido explícito
- **Google Cloud Vision API**: SafeSearch detection
- **Microsoft Azure Content Moderator**: Moderación de imágenes
- **Sightengine**: API de moderación de contenido

Ejemplo de integración con AWS Rekognition:

```python
import boto3

def moderate_image(image_path: str) -> Tuple[bool, Optional[str]]:
    """Modera una imagen usando AWS Rekognition"""
    rekognition = boto3.client('rekognition')

    with open(image_path, 'rb') as image_file:
        response = rekognition.detect_moderation_labels(
            Image={'Bytes': image_file.read()}
        )

    # Verificar si hay contenido inapropiado
    for label in response.get('ModerationLabels', []):
        if label['Confidence'] > 80:  # Umbral de confianza
            return False, f"Contenido inapropiado detectado: {label['Name']}"

    return True, None
```

### 2. Hash de Imágenes para Detección de Duplicados

- Generar hash de imágenes para detectar contenido duplicado.
- Mantener una lista negra de hashes de imágenes inapropiadas.

### 3. Revisión Manual

- Implementar un sistema de cola para revisar imágenes antes de publicarlas.
- Marcar imágenes como "pendientes de revisión" hasta que sean aprobadas.

### 4. Límites de Rate Limiting

- Limitar el número de subidas por usuario por día.
- Prevenir abuso del sistema.

### 5. Escaneo de Virus/Malware

- Integrar servicios de escaneo de malware para detectar archivos maliciosos.

## Instalación de Dependencias

Para que las validaciones funcionen correctamente, asegúrate de tener Pillow instalado:

```bash
pip install Pillow
```

O usando pipenv:

```bash
pipenv install Pillow
```

## Archivos Modificados

- `src/api/validators.py`: Función `validate_image_file()` con todas las validaciones
- `src/api/profiles.py`: Endpoint de subida actualizado para usar las validaciones
- `src/front/components/Profile/PhotoSelector.tsx`: Validaciones mejoradas en el frontend
- `requirements.txt`: Agregado Pillow como dependencia

## Notas de Seguridad

1. **Nunca confíes solo en las validaciones del frontend**: Siempre valida en el backend.
2. **Los magic bytes son importantes**: No confíes solo en la extensión del archivo.
3. **PIL es esencial**: Valida que el archivo sea realmente una imagen válida.
4. **Considera moderación de contenido**: Para producción, considera integrar APIs de moderación.
5. **Monitorea las subidas**: Registra intentos de subida de archivos inválidos para detectar patrones de abuso.

## Testing

Para probar las validaciones, intenta subir:

- Un archivo .txt renombrado como .jpg (debe fallar por magic bytes)
- Una imagen corrupta (debe fallar por PIL)
- Una imagen demasiado grande (debe fallar por dimensiones)
- Un archivo demasiado pesado (debe fallar por tamaño)
