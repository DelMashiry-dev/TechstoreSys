@echo off
setlocal EnableExtensions
title Build TECHSTORES Portable — v1.0.0.0
cd /d "%~dp0.."

set "OUT=dist\TECHSTORES-Portable"
set "SPEC_WORK=build\portable"
set "APP_VERSION=1.0.0.0"

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

echo [1/4] Installing / updating PyInstaller...
python -m pip install --upgrade pyinstaller
if errorlevel 1 (
  echo ERROR: Could not install PyInstaller.
  pause
  exit /b 1
)

echo [2/4] Building TECHSTORES.exe v%APP_VERSION% ...
if exist "%SPEC_WORK%" rmdir /s /q "%SPEC_WORK%"
if exist "dist\TECHSTORES" rmdir /s /q "dist\TECHSTORES"

if not exist "assets\techstores.ico" (
  echo Building icon from source badge...
  python scripts\build-icon.py
)

for %%I in ("assets\techstores.ico") do set "ICON=%%~fI"
for %%I in ("scripts\version-info.txt") do set "VERFILE=%%~fI"

python -m PyInstaller ^
  --noconfirm ^
  --clean ^
  --name TECHSTORES ^
  --onedir ^
  --console ^
  --icon "%ICON%" ^
  --version-file "%VERFILE%" ^
  --distpath dist ^
  --workpath "%SPEC_WORK%" ^
  --specpath "%SPEC_WORK%" ^
  --hidden-import product_specs_lookup ^
  --hidden-import version ^
  server.py

if errorlevel 1 (
  echo ERROR: PyInstaller failed.
  pause
  exit /b 1
)

echo [3/4] Assembling portable folder...
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%"

xcopy /E /I /Y "dist\TECHSTORES\*" "%OUT%\" >nul
xcopy /E /I /Y "app" "%OUT%\app\" >nul
if exist "assets" xcopy /E /I /Y "assets" "%OUT%\assets\" >nul
if exist "index.html" copy /Y "index.html" "%OUT%\index.html" >nul
if exist "zna-logo.png" copy /Y "zna-logo.png" "%OUT%\zna-logo.png" >nul
if exist "version.py" copy /Y "version.py" "%OUT%\version.py" >nul
REM Fresh installs create their own DB; optional seed only for portable demo copy
if exist "techstores.db" copy /Y "techstores.db" "%OUT%\techstores.db" >nul
copy /Y "docs\PORTABLE-DEMO-README.txt" "%OUT%\README.txt" >nul
copy /Y "scripts\portable-START-DEMO.bat" "%OUT%\START-DEMO.bat" >nul
copy /Y "scripts\portable-START-DEMO.bat" "%OUT%\START-SYSTEM.bat" >nul

echo %APP_VERSION%> "%OUT%\VERSION.txt"

echo [4/4] Done.
echo.
echo Portable package ready:
echo   %CD%\%OUT%\
echo.
echo Copy that entire folder to USB / the Director PC,
echo then double-click START-SYSTEM.bat  (or START-DEMO.bat)
echo Executable: TECHSTORES.exe  (v%APP_VERSION%)
echo.
if /I not "%~1"=="/nopause" pause
endlocal
exit /b 0
