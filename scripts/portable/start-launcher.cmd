@echo off
REM Portable: start background mode launcher (port 8765) if not already running.
setlocal EnableExtensions
cd /d "%~dp0.."

netstat -ano | findstr ":8765" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 exit /b 0

if exist "TECHSTORES-LAUNCHER.exe" (
  start "" /MIN "TECHSTORES-LAUNCHER.exe"
) else (
  start "" /MIN cmd /c "cd /d \"%~dp0..\" && call \"%~dp0..\resolve-python.cmd\" -u launcher_service.py"
)
exit /b 0
