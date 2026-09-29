@echo off
set "PROJECT_ROOT=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -NoExit -File "%PROJECT_ROOT%scripts\start-all.ps1"