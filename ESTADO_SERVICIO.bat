@echo off
title AQUASHIELD - Estado Integral de la Mesa de Ayuda
color 0B
cd /d "%~dp0"

python check_status.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se pudo ejecutar el chequeo con Python. Ejecutando comprobacion basica...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = (Get-NetTCPConnection -LocalPort 5050 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); if ($p) { Write-Host '[ESTADO] ACTIVO (PID: ' $p ')' -ForegroundColor Green } else { Write-Host '[ESTADO] INACTIVO' -ForegroundColor Red }"
)

pause
