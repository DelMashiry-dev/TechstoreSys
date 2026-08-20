@echo off
title IT-DIR Tech Stores - Offline Shell
cd /d "%~dp0"
echo.
echo Tech Stores OFFLINE mode
echo   - Serves the app at http://127.0.0.1:8080/app/
echo   - Data is saved in your browser (IndexedDB)
echo   - Run START-SYSTEM.bat later to sync to techstores.db
echo.
echo Use this when the main server is stopped or you have no network.
echo Open the app online at least once first so modules are cached.
echo.
call "%~dp0scripts\start-launcher.cmd"
call "%~dp0scripts\resolve-python.cmd" -u offline_static_server.py
if errorlevel 1 (
  echo.
  echo Python failed to start. Install Python 3 or use START-SYSTEM.bat instead.
  pause
)
