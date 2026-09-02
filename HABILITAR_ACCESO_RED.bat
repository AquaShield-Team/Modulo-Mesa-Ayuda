@echo off
title AQUASHIELD - Habilitar Acceso de Red y VPN
color 0A
cd /d "%~dp0"

:: Auto-elevacion con ventana UAC de Administrador si no tiene permisos
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Solicitando permisos de Administrador de Windows...
    powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c ""%~f0""' -Verb RunAs"
    exit /b
)

echo ===============================================================================
echo       AQUASHIELD - HABILITAR ACCESO DE RED Y VPN (PUERTO 5050)
echo ===============================================================================
echo.
echo [*] Configurando regla en Windows Firewall para permitir que colegas
echo     conectados por Red Local o VPN FortiClient puedan acceder a la plataforma...
echo.

netsh advfirewall firewall delete rule name="AquaShield Mesa de Ayuda (Puerto 5050)" >nul 2>&1
netsh advfirewall firewall add rule name="AquaShield Mesa de Ayuda (Puerto 5050)" dir=in action=allow protocol=TCP localport=5050 profile=any

echo.
echo ===============================================================================
echo [OK] Puerto 5050 habilitado correctamente en Windows Firewall.
echo Tus colegas en la oficina o en VPN FortiClient ya podran conectarse sin bloqueos.
echo ===============================================================================
echo.
pause
