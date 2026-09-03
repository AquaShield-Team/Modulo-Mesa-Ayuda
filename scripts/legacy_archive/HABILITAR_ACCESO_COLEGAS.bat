@echo off
:: Auto-elevación a Administrador de Windows
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Solicitando permisos de Administrador de Windows...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )
    pushd "%CD%"
    CD /D "%~dp0"

color 0A
title AquaShield - Habilitando Acceso en Firewall
echo ======================================================================
echo    AQUASHIELD - HABILITAR ACCESO DE RED LOCAL (PUERTO 5050)
echo ======================================================================
echo.
echo Abriendo puerto 5050 en Windows Defender Firewall...
echo.

netsh advfirewall firewall add rule name="AquaShield Mesa Ayuda 5050" dir=in action=allow protocol=TCP localport=5050 profile=any

echo.
echo ======================================================================
echo Si arriba dice "Aceptar." o "Ok.", el puerto 5050 ya quedo abierto.
echo Tus colegas ya pueden entrar a la Mesa de Ayuda!
echo ======================================================================
echo.
pause
