@echo off
title Tech Stores — launcher shortcuts
cd /d "%~dp0.."
set "ROOT=%CD%"

echo.
echo Building icons and updating Tech Stores launcher shortcuts...
echo   START-SYSTEM  — database icon (techstores.db)
echo   START-OFFLINE — Tech Stores app icon (browser storage)
echo.

call "%ROOT%\scripts\resolve-python.cmd" "%ROOT%\scripts\build-database-icon.py"
if errorlevel 1 (
  echo Failed to build database.ico
  pause
  exit /b 1
)

if not exist "%ROOT%\assets\database.ico" (
  echo Missing %ROOT%\assets\database.ico
  pause
  exit /b 1
)

if not exist "%ROOT%\assets\techstores.ico" (
  echo Missing %ROOT%\assets\techstores.ico
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\create-launcher-shortcuts.ps1"

echo.
echo Done.
echo   %ROOT%\START-SYSTEM.lnk
echo   %ROOT%\START-OFFLINE.lnk
echo   Desktop copies created / updated (including old .bat shortcuts).
echo.
pause
