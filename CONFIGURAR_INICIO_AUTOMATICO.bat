@echo off
title AQUASHIELD - Inicio Automatico con Windows
color 0A
cd /d "%~dp0"

echo ===============================================================================
echo   AQUASHIELD ? CONFIGURAR INICIO AUTOMATICO CON WINDOWS
echo ===============================================================================
echo.
echo [*] Configurando para que la Mesa de Ayuda inicie sola en segundo plano al
echo     encender el computador...
echo.

cscript.exe //nologo CONFIGURAR_INICIO_AUTOMATICO.vbs

if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AquaShield_Mesa_Ayuda.lnk" (
    echo [OK] Configuracion exitosa.
    echo A partir de ahora, la Mesa de Ayuda se iniciara en silencio cada vez que
    echo inicies sesion en Windows.
    echo.
    echo Para quitarlo en el futuro ejecuta: QUITAR_INICIO_AUTOMATICO.bat
) else (
    echo [ERROR] No se pudo crear el acceso directo de inicio automatico.
)

echo.
echo ===============================================================================
pause
