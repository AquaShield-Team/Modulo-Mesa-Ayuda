@echo off
chcp 65001 >nul
title AQUASHIELD - Centro de Control y Estado en Vivo
color 0B
set "ROOT_DIR=c:\dev\Modulo-Mesa-Ayuda"
cd /d "%ROOT_DIR%"

:MENU
cls
python dashboard.py

echo.
echo ===============================================================================
echo                            ACCIONES DISPONIBLES
echo ===============================================================================
echo.
echo   [1] Iniciar Servidor en Modo Silencioso (Segundo Plano)
echo   [2] Iniciar Servidor en Modo Visible (Consola)
echo   [3] Abrir Panel de Gestión (Admin en Navegador)
echo   [4] Abrir Portal Web Oficial de Usuarios (GitHub Pages)
echo   [5] Detener Servidor (Cerrar Procesos)
echo   [6] Activar Inicio Automático con Windows al Encender PC
echo   [7] Desactivar Inicio Automático con Windows
echo   [R] Refrescar Estado en Pantalla
echo.
echo   [0] Salir
echo.
echo ===============================================================================
set /p OPCION="Selecciona una opción [0-7, R]: "

if /i "%OPCION%"=="1" goto INICIAR_SILENCIOSO
if /i "%OPCION%"=="2" goto INICIAR_VISIBLE
if /i "%OPCION%"=="3" goto ABRIR_ADMIN
if /i "%OPCION%"=="4" goto ABRIR_PORTAL
if /i "%OPCION%"=="5" goto DETENER
if /i "%OPCION%"=="6" goto ACTIVAR_AUTOSTART
if /i "%OPCION%"=="7" goto DESACTIVAR_AUTOSTART
if /i "%OPCION%"=="R" goto MENU
if /i "%OPCION%"=="0" exit /b
goto MENU

:INICIAR_SILENCIOSO
cls
echo [*] Iniciando servidor en segundo plano (Modo Silencioso)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process pythonw -ArgumentList 'app.py' -WorkingDirectory '%ROOT_DIR%'"
timeout /t 2 >nul
goto MENU

:INICIAR_VISIBLE
cls
echo [*] Iniciando servidor en consola visible...
start "AQUASHIELD - Servidor Visible (Puerto 5050)" python app.py
timeout /t 2 >nul
goto MENU

:ABRIR_ADMIN
start "" http://localhost:5050/admin
goto MENU

:ABRIR_PORTAL
start "" https://aquashield-team.github.io/Modulo-Mesa-Ayuda/
goto MENU

:DETENER
cls
echo ===============================================================================
echo                       DETENIENDO SERVIDOR LOCAL
echo ===============================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = (Get-NetTCPConnection -LocalPort 5050 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); if ($p) { foreach ($procId in $p) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }; Write-Host ('[OK] Servidor detenido exitosamente (PIDs cerrados: ' + ($p -join ', ') + ').') -ForegroundColor Green } else { Write-Host '[INFO] No habia ningun servidor activo en el puerto 5050.' -ForegroundColor Yellow }"
timeout /t 2 >nul
goto MENU

:ACTIVAR_AUTOSTART
cls
echo ===============================================================================
echo             CONFIGURAR INICIO AUTOMÁTICO CON WINDOWS
echo ===============================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine($env:APPDATA, 'Microsoft\Windows\Start Menu\Programs\Startup\AquaShield_Mesa_Ayuda.lnk')); $s.TargetPath = 'pythonw.exe'; $s.Arguments = 'app.py'; $s.WorkingDirectory = '%ROOT_DIR%'; $s.Save(); Write-Host '[OK] Inicio automatico activado exitosamente.' -ForegroundColor Green; Write-Host 'La Mesa de Ayuda se iniciara en silencio cada vez que enciendas tu PC.' -ForegroundColor Cyan;"
timeout /t 2 >nul
goto MENU

:DESACTIVAR_AUTOSTART
cls
echo ===============================================================================
echo            DESACTIVAR INICIO AUTOMÁTICO CON WINDOWS
echo ===============================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$f = [System.IO.Path]::Combine($env:APPDATA, 'Microsoft\Windows\Start Menu\Programs\Startup\AquaShield_Mesa_Ayuda.lnk'); if (Test-Path $f) { Remove-Item $f -Force; Write-Host '[OK] Inicio automatico desactivado exitosamente.' -ForegroundColor Green } else { Write-Host '[INFO] No estaba configurado el inicio automatico.' -ForegroundColor Yellow }"
timeout /t 2 >nul
goto MENU
