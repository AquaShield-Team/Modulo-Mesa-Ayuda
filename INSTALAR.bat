@echo off
chcp 65001 >nul
title AQUASHIELD - Instalador Mesa de Ayuda
color 0A
cd /d "%~dp0"

echo ===============================================================================
echo       AQUASHIELD · INSTALADOR DE DEPENDENCIAS - MESA DE AYUDA
echo ===============================================================================
echo.

pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo ===============================================================================
    echo [ERROR] No se pudieron instalar las dependencias. Revisa tu conexión a internet.
    echo ===============================================================================
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo [OK] Instalación completada con éxito.
echo Ejecuta INICIAR_MESA_AYUDA.bat para iniciar el módulo.
echo ===============================================================================
pause
