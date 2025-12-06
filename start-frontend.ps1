# Script para iniciar el frontend
Write-Host "Iniciando frontend..." -ForegroundColor Green
Write-Host "Verificando dependencias..." -ForegroundColor Yellow

# Verificar si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Verificar variables de entorno
if (-not (Test-Path ".env")) {
    Write-Host "ADVERTENCIA: Archivo .env no encontrado" -ForegroundColor Red
    Write-Host "Creando .env con valores por defecto..." -ForegroundColor Yellow
    @"
# Front-End Variables
VITE_BACKEND_URL=http://localhost:3001
VITE_BASENAME=/
# RAWG API Key - Obtén tu key gratuita en https://rawg.io/apidocs
VITE_RAWG_KEY=
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "IMPORTANTE: Debes agregar tu VITE_RAWG_KEY en el archivo .env" -ForegroundColor Yellow
    Write-Host "Obtén tu API key gratuita en: https://rawg.io/apidocs" -ForegroundColor Cyan
}

Write-Host "`nIniciando Vite en puerto 5173..." -ForegroundColor Green
Write-Host "URL: http://localhost:5173`n" -ForegroundColor Cyan

# Iniciar Vite
npm run dev


