@echo off
chcp 65001 >nul
title AQUASHIELD - Mesa de Ayuda
color 0B
cd /d "%~dp0"

echo ===============================================================================
echo       AQUASHIELD · MESA DE AYUDA Y GESTIÓN DE SOLICITUDES
echo                         AquaChile S.A.
echo ===============================================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado o no se encuentra en el PATH.
    echo Por favor instala Python 3.10 o superior desde https://www.python.org/
    pause
    exit /b 1
)

echo [*] Verificando dependencias basicas...
pip show flask >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] Instalando dependencias de requirements.txt...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] No se pudieron instalar las librerias.
        pause
        exit /b 1
    )
)

echo.
echo [*] Iniciando servidor Mesa de Ayuda...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$h = $env:COMPUTERNAME; $fqdn = [System.Net.Dns]::GetHostEntry('').HostName; $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress; Write-Host '[*] Direcciones de acceso:' -ForegroundColor Cyan; Write-Host '    - En este equipo:                 http://localhost:5050'; Write-Host ('    - Corporativo FQDN (RECOMENDADO): http://' + $fqdn + ':5050') -ForegroundColor Green; Write-Host ('    - Por IP Directa (SI FALLA DNS):  http://' + $ip + ':5050') -ForegroundColor Yellow; Write-Host ('    - Por Nombre Corto:               http://' + $h + ':5050') -ForegroundColor Cyan;"
start "" http://localhost:5050

echo.
echo ===============================================================================
echo [INFO] El servidor esta activo. Presiona Ctrl+C para detenerlo.
echo ===============================================================================
echo.
python app.py
pause
