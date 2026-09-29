@echo off
set "PROJECT_ROOT=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -NoExit -File "%PROJECT_ROOT%scripts\stop-all.ps1"