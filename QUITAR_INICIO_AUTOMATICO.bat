@echo off
title AQUASHIELD - Quitar Inicio Automatico
color 0E
cd /d "%~dp0"

echo ===============================================================================
echo   AQUASHIELD - QUITAR INICIO AUTOMATICO CON WINDOWS
echo ===============================================================================
echo.

powershell -NoProfile -Command "$startup = [Environment]::GetFolderPath('Startup'); $target = Join-Path $startup 'AquaShield_Mesa_Ayuda.lnk'; if (Test-Path $target) { Remove-Item $target -Force; Write-Host '[OK] Se ha quitado el inicio automatico exitosamente.' -ForegroundColor Green } else { Write-Host '[INFO] El inicio automatico no estaba configurado.' -ForegroundColor Yellow }"

echo.
echo ===============================================================================
pause
