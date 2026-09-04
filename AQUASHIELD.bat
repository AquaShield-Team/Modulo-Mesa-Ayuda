@echo off
title AQUASHIELD - Centro de Control y Monitor en Vivo
color 0B
mode con: cols=85 lines=32
cd /d "%~dp0"
python dashboard.py
