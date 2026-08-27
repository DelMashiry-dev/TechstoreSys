@echo off
setlocal EnableExtensions
title Build TECHSTORES Portable — v1.0.0.0
cd /d "%~dp0.."

set "OUT=dist\TECHSTORES-Portable"
set "SPEC_WORK=build\portable"
set "APP_VERSION=1.0.0.0"
set "PYI_HIDDEN=--hidden-import product_specs_lookup --hidden-import version --hidden-import mode_switch --hidden-import python_runtime --hidden-import ai_services"

echo.
echo === IT-DIR Tech Stores — portable build v%APP_VERSION% ===
echo Working folder: %CD%
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo ERROR: Python not found on PATH.
  pause
  exit /b 1
)

echo [1/5] Installing / updating PyInstaller...
python -m pip install --upgrade pyinstaller
if errorlevel 1 (
  echo ERROR: Could not install PyInstaller.
  pause
  exit /b 1
)

if not exist "assets\techstores.ico" (
  echo Building icon from source badge...
  python scripts\build-icon.py
)

for %%I in ("assets\techstores.ico") do set "ICON=%%~fI"
for %%I in ("scripts\version-info.txt") do set "VERFILE=%%~fI"

echo [2/5] Building executables...
if exist "%SPEC_WORK%" rmdir /s /q "%SPEC_WORK%"
if exist "dist\TECHSTORES" rmdir /s /q "dist\TECHSTORES"
if exist "dist\TECHSTORES-OFFLINE" rmdir /s /q "dist\TECHSTORES-OFFLINE"
if exist "dist\TECHSTORES-LAUNCHER" rmdir /s /q "dist\TECHSTORES-LAUNCHER"
if exist "dist\TECHSTORES-MODE" rmdir /s /q "dist\TECHSTORES-MODE"

call "%~dp0build-portable-exe.bat" TECHSTORES server.py "%ICON%" "%VERFILE%" "%SPEC_WORK%" "%PYI_HIDDEN%"
if errorlevel 1 goto :fail
call "%~dp0build-portable-exe.bat" TECHSTORES-OFFLINE offline_static_server.py "%ICON%" "%VERFILE%" "%SPEC_WORK%" "%PYI_HIDDEN%"
if errorlevel 1 goto :fail
call "%~dp0build-portable-exe.bat" TECHSTORES-LAUNCHER launcher_service.py "%ICON%" "%VERFILE%" "%SPEC_WORK%" "%PYI_HIDDEN%"
if errorlevel 1 goto :fail
call "%~dp0build-portable-exe.bat" TECHSTORES-MODE mode_switch.py "%ICON%" "%VERFILE%" "%SPEC_WORK%" "%PYI_HIDDEN%"
if errorlevel 1 goto :fail

echo [3/5] Assembling portable folder...
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%"

xcopy /E /I /Y "dist\TECHSTORES\*" "%OUT%\" >nul
copy /Y "dist\TECHSTORES-OFFLINE\TECHSTORES-OFFLINE.exe" "%OUT%\" >nul
copy /Y "dist\TECHSTORES-LAUNCHER\TECHSTORES-LAUNCHER.exe" "%OUT%\" >nul
copy /Y "dist\TECHSTORES-MODE\TECHSTORES-MODE.exe" "%OUT%\" >nul
xcopy /E /I /Y "app" "%OUT%\app\" >nul
if exist "assets" xcopy /E /I /Y "assets" "%OUT%\assets\" >nul
if exist "index.html" copy /Y "index.html" "%OUT%\index.html" >nul
if exist "zna-logo.png" copy /Y "zna-logo.png" "%OUT%\zna-logo.png" >nul
if exist "version.py" copy /Y "version.py" "%OUT%\version.py" >nul
if exist "techstores.db" copy /Y "techstores.db" "%OUT%\techstores.db" >nul

mkdir "%OUT%\scripts" 2>nul
xcopy /E /I /Y "scripts\portable\*" "%OUT%\scripts\" >nul
copy /Y "scripts\resolve-python.cmd" "%OUT%\scripts\" >nul
copy /Y "scripts\install-autostart.bat" "%OUT%\scripts\" >nul

copy /Y "scripts\portable\START-SYSTEM.bat" "%OUT%\START-SYSTEM.bat" >nul
copy /Y "scripts\portable\START-OFFLINE.bat" "%OUT%\START-OFFLINE.bat" >nul
copy /Y "scripts\portable\OPEN-TECHSTORES.bat" "%OUT%\OPEN-TECHSTORES.bat" >nul
copy /Y "docs\PORTABLE-DEMO-README.txt" "%OUT%\README.txt" >nul

echo %APP_VERSION%> "%OUT%\VERSION.txt"

echo [4/5] Verifying package...
if not exist "%OUT%\TECHSTORES.exe" goto :fail
if not exist "%OUT%\TECHSTORES-OFFLINE.exe" goto :fail
if not exist "%OUT%\TECHSTORES-LAUNCHER.exe" goto :fail
if not exist "%OUT%\TECHSTORES-MODE.exe" goto :fail
if not exist "%OUT%\app\index.html" goto :fail

echo [5/5] Done.
echo.
echo Portable package ready:
echo   %CD%\%OUT%\
echo.
echo   START-SYSTEM.bat     — online database server
echo   START-OFFLINE.bat    — offline browser storage
echo   OPEN-TECHSTORES.bat  — launcher + server + browser
echo   scripts\install-autostart.bat — auto-open on Windows login
echo.
echo To build Setup installer + ZIP: scripts\build-release.bat
echo.
if /I not "%~1"=="/nopause" pause
endlocal
exit /b 0

:fail
echo ERROR: Portable build failed.
pause
exit /b 1
