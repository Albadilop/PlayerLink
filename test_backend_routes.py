#!/usr/bin/env python3
"""Script para verificar que el backend está corriendo y las rutas están disponibles"""
import sys
import os

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    from app import app
    
    print("✓ Backend importado correctamente")
    print("\nRutas disponibles:")
    print("-" * 50)
    
    # Listar todas las rutas
    with app.app_context():
        for rule in app.url_map.iter_rules():
            if '/api' in rule.rule:
                methods = ','.join(sorted(rule.methods - {'OPTIONS', 'HEAD'}))
                print(f"{rule.rule:40} [{methods}]")
    
    print("\n✓ Verificando endpoint /api/login...")
    with app.test_client() as client:
        # Probar OPTIONS (preflight)
        response = client.options('/api/login')
        print(f"  OPTIONS /api/login: {response.status_code}")
        
        # Probar POST sin datos (debería dar error pero no 404)
        response = client.post('/api/login', json={})
        print(f"  POST /api/login (sin datos): {response.status_code}")
        
        if response.status_code == 404:
            print("\n✗ ERROR: El endpoint /api/login no está disponible (404)")
            print("  Posibles causas:")
            print("  - El blueprint auth_bp no está registrado correctamente")
            print("  - Hay un error al importar los módulos")
            sys.exit(1)
        else:
            print(f"  ✓ El endpoint existe (código: {response.status_code})")
    
    print("\n✓ Todas las verificaciones pasaron correctamente")
    
except Exception as e:
    print(f"\n✗ ERROR al verificar el backend:")
    print(f"  {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)


