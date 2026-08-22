@echo off
title IT-DIR Tech Stores - Offline Shell
cd /d "%~dp0"
echo.
echo Tech Stores OFFLINE mode
echo   http://127.0.0.1:8080/app/
echo   Data saves in browser storage until you switch back online.
echo.
call scripts\start-launcher.cmd
if exist "TECHSTORES-OFFLINE.exe" (
  TECHSTORES-OFFLINE.exe
) else (
  call scripts\resolve-python.cmd -u offline_static_server.py
)
if errorlevel 1 pause
