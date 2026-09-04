@echo off
title AQUASHIELD - Centro de Control y Monitor en Vivo
color 0B
mode con: cols=85 lines=32
set "ROOT_DIR=c:\dev\Modulo-Mesa-Ayuda"
cd /d "%ROOT_DIR%"

:MENU
cls
python "%ROOT_DIR%\dashboard.py"

set /p OPCION=">> Ingresa tu opcion y presiona Enter: "

if /i "%OPCION%"=="1" goto INICIAR_SILENCIOSO
if /i "%OPCION%"=="2" goto DETENER
if /i "%OPCION%"=="3" goto REINICIAR
if /i "%OPCION%"=="4" goto ABRIR_ADMIN
if /i "%OPCION%"=="5" goto ABRIR_PORTAL
if /i "%OPCION%"=="R" goto MENU
if /i "%OPCION%"=="0" exit /b
goto MENU

:INICIAR_SILENCIOSO
cls
echo [*] Iniciando servidor desatendido en segundo plano...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process pythonw -ArgumentList 'app.py' -WorkingDirectory '%ROOT_DIR%'"
timeout /t 2 >nul
goto MENU

:DETENER
cls
echo [*] Deteniendo servidor desatendido en segundo plano...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = (Get-NetTCPConnection -LocalPort 5050 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); if ($p) { foreach ($procId in $p) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }; Write-Host '[OK] Servidor detenido exitosamente.' -ForegroundColor Green } else { Write-Host '[INFO] No habia ningun servidor activo.' -ForegroundColor Yellow }"
timeout /t 2 >nul
goto MENU

:REINICIAR
cls
echo [*] Reiniciando servidor desatendido en segundo plano...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = (Get-NetTCPConnection -LocalPort 5050 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); if ($p) { foreach ($procId in $p) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } }; Start-Sleep -Seconds 1; Start-Process pythonw -ArgumentList 'app.py' -WorkingDirectory '%ROOT_DIR%'; Write-Host '[OK] Servidor reiniciado en segundo plano.' -ForegroundColor Green"
timeout /t 2 >nul
goto MENU

:ABRIR_ADMIN
start chrome "http://localhost:5050/admin" 2>nul || start msedge "http://localhost:5050/admin" 2>nul || start "" "http://localhost:5050/admin"
goto MENU

:ABRIR_PORTAL
start chrome "https://aquashield-team.github.io/Modulo-Mesa-Ayuda/" 2>nul || start msedge "https://aquashield-team.github.io/Modulo-Mesa-Ayuda/" 2>nul || start "" "https://aquashield-team.github.io/Modulo-Mesa-Ayuda/"
goto MENU
