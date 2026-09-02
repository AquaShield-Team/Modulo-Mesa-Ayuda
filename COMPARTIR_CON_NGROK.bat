@echo off
chcp 65001 >nul
title AQUASHIELD - Compartir con Ngrok
color 0D
cd /d "%~dp0"

python tunnel_ngrok.py
