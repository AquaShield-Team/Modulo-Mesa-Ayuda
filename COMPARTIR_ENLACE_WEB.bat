@echo off
chcp 65001 >nul
title AQUASHIELD - Generar Enlace Web Seguro (HTTPS)
color 0B
cd /d "%~dp0"

python tunnel_manager.py
