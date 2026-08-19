@echo off
title IT-DIR Tech Stores v1.0.0.0
cd /d "%~dp0"
echo.
echo Starting IT-DIR Tech Stores v1.0.0.0 ...
echo Keep this window open while using the system.
echo The browser will open automatically to:
echo   http://127.0.0.1:8080/app/
echo.
echo Press Ctrl+C in this window to stop the server.
echo.
TECHSTORES.exe
if errorlevel 1 (
  echo.
  echo The system failed to start. Make sure you copied the FULL folder
  echo (TECHSTORES.exe plus the app\ folder must stay together).
  pause
)
