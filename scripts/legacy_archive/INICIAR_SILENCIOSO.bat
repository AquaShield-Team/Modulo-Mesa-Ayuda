@echo off
title AQUASHIELD - Iniciar Mesa de Ayuda en Segundo Plano
cd /d "%~dp0"

echo [*] Iniciando Mesa de Ayuda en segundo plano (sin ventana CMD)...
wscript.exe INICIAR_SEGUNDO_PLANO.vbs

echo [OK] El servidor esta activo en segundo plano.
echo Tu navegador se abrira automaticamente en breve.
timeout /t 3 >nul
exit
