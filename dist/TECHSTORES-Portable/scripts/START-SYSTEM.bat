@echo off
title IT-DIR Tech Stores v1.0.0.0
cd /d "%~dp0"
echo.
echo Starting IT-DIR Tech Stores (online mode) ...
echo Keep this window open while using the system.
echo Browser: http://127.0.0.1:8080/app/
echo.
call scripts\start-launcher.cmd
if exist "TECHSTORES.exe" (
  TECHSTORES.exe
) else (
  call scripts\resolve-python.cmd -u server.py
)
if errorlevel 1 (
  echo.
  echo The system failed to start. Keep TECHSTORES.exe and the app\ folder together.
  pause
)
