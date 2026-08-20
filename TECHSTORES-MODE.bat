@echo off
title Tech Stores - Online / Offline mode
cd /d "%~dp0"

:menu
cls
echo ============================================================
echo   IT-DIR Tech Stores - switch storage mode
echo ============================================================
echo.
echo   Same browser URL for both modes:
echo     http://127.0.0.1:8080/app/
echo.
echo   [1] ONLINE  - START-SYSTEM.bat  (techstores.db / SQLite)
echo   [2] OFFLINE - START-OFFLINE.bat (browser IndexedDB)
echo   [3] STOP    - stop whatever is on port 8080
echo   [4] Exit
echo.
set /p choice="Choose 1-4: "

if "%choice%"=="1" goto online
if "%choice%"=="2" goto offline
if "%choice%"=="3" goto stop
if "%choice%"=="4" exit /b 0
goto menu

:stop
echo.
echo Stopping servers on port 8080...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
timeout /t 2 /nobreak >nul
echo Done.
pause
goto menu

:online
call :kill8080
echo.
echo Starting ONLINE database server...
start "Tech Stores ONLINE" cmd /k "cd /d \"%~dp0\" && call \"%~dp0scripts\start-launcher.cmd\" && call \"%~dp0scripts\resolve-python.cmd\" -u server.py"
echo.
echo Open http://127.0.0.1:8080/app/
echo In the app, click the storage badge and press "Reconnect to database" if needed.
pause
goto menu

:offline
call :kill8080
echo.
echo Starting OFFLINE shell...
start "Tech Stores OFFLINE" cmd /k "cd /d \"%~dp0\" && call \"%~dp0scripts\start-launcher.cmd\" && call \"%~dp0scripts\resolve-python.cmd\" -u offline_static_server.py"
echo.
echo Open http://127.0.0.1:8080/app/
echo Data saves in the browser until you switch back to Online mode.
pause
goto menu

:kill8080
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
timeout /t 1 /nobreak >nul
exit /b 0
