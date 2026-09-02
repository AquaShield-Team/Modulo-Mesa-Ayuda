@echo off
title AQUASHIELD - Estado de la Mesa de Ayuda
color 0B
cd /d "%~dp0"

echo ===============================================================================
echo       AQUASHIELD - ESTADO DEL SERVIDOR MESA DE AYUDA
echo ===============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = (Get-NetTCPConnection -LocalPort 5050 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); $hostName = $env:COMPUTERNAME; $fqdn = [System.Net.Dns]::GetHostEntry('').HostName; $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress; if ($p) { Write-Host '[ESTADO] ACTIVO (En ejecucion en segundo plano)' -ForegroundColor Green; Write-Host ('[PID]    ' + ($p -join ', ')); Write-Host '[PUERTO] 5050'; Write-Host ''; Write-Host '[*] Direcciones de acceso para compartir con tus colegas:' -ForegroundColor Cyan; Write-Host ('    1. Nombre Corporativo (RECOMENDADO): http://' + $fqdn + ':5050') -ForegroundColor Green; Write-Host ('    2. Por IP Directa (SI FALLA EL DNS): http://' + $ip + ':5050') -ForegroundColor Yellow; Write-Host ('    3. Nombre Corto de PC:               http://' + $hostName + ':5050') -ForegroundColor Cyan; Write-Host ''; Write-Host '[*] En tu propio equipo (Admin):' -ForegroundColor Cyan; Write-Host '    - http://localhost:5050'; Write-Host '    - http://localhost:5050/admin'; } else { Write-Host '[ESTADO] INACTIVO (El servidor esta detenido)' -ForegroundColor Red; Write-Host ''; Write-Host 'Para iniciarlo:'; Write-Host ' - En segundo plano: Haz doble clic en INICIAR_SILENCIOSO.bat'; Write-Host ' - Con consola:     Haz doble clic en INICIAR_MESA_AYUDA.bat'; }"

echo.
echo ===============================================================================
pause
