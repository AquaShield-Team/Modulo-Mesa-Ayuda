@echo off
title AQUASHIELD - Detener Mesa de Ayuda
color 0C
cd /d "%~dp0"

echo ===============================================================================
echo       AQUASHIELD - DETENER MESA DE AYUDA (SEGUNDO PLANO)
echo ===============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = (Get-NetTCPConnection -LocalPort 5050 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); if ($p) { foreach ($procId in $p) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }; Write-Host ('[OK] Servidor detenido exitosamente (PID ' + ($p -join ', ') + ').') -ForegroundColor Green } else { Write-Host '[INFO] No hay ningun servidor activo en el puerto 5050.' -ForegroundColor Yellow }"

echo.
echo ===============================================================================
pause
