@echo off
setlocal EnableExtensions
title Build TECHSTORES Release — v1.0.0.0
cd /d "%~dp0.."

set "APP_VERSION=1.0.0.0"
set "OUT_PORTABLE=dist\TECHSTORES-Portable"
set "SETUP_EXE=dist\TECHSTORES-Setup-%APP_VERSION%.exe"
set "ZIP_OUT=dist\TECHSTORES-Portable-%APP_VERSION%.zip"

echo.
echo ============================================
echo  IT-DIR Tech Stores — Release build
echo  Version: %APP_VERSION%
echo ============================================
echo.

REM --- Step 1: portable EXE package ---
call "%~dp0build-portable.bat" /nopause
if errorlevel 1 (
  echo ERROR: Portable build failed.
  pause
  exit /b 1
)

REM --- Step 2: zip portable package ---
echo.
echo [Release] Creating portable ZIP...
if exist "%ZIP_OUT%" del /f /q "%ZIP_OUT%"
powershell -NoProfile -Command ^
  "Compress-Archive -Path '%OUT_PORTABLE%\*' -DestinationPath '%ZIP_OUT%' -Force"
if errorlevel 1 (
  echo WARNING: Could not create ZIP. Continuing...
) else (
  echo   Created: %CD%\%ZIP_OUT%
)

REM --- Step 3: Windows Setup installer (Inno Setup) ---
echo.
echo [Release] Looking for Inno Setup compiler (ISCC)...

set "ISCC="
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if exist "%LocalAppData%\Programs\Inno Setup 6\ISCC.exe" set "ISCC=%LocalAppData%\Programs\Inno Setup 6\ISCC.exe"

if not defined ISCC (
  where iscc >nul 2>&1
  if not errorlevel 1 for /f "delims=" %%I in ('where iscc') do set "ISCC=%%I"
)

if not defined ISCC (
  echo Inno Setup not found. Attempting install via winget...
  winget install --id JRSoftware.InnoSetup -e --accept-package-agreements --accept-source-agreements
  if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
  if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
  if exist "%LocalAppData%\Programs\Inno Setup 6\ISCC.exe" set "ISCC=%LocalAppData%\Programs\Inno Setup 6\ISCC.exe"
)

if not defined ISCC (
  echo.
  echo WARNING: Inno Setup compiler not available.
  echo Portable package and ZIP were still built successfully.
  echo To build the Setup.exe later:
  echo   1. Install Inno Setup 6 from https://jrsoftware.org/isinfo.php
  echo   2. Run:  "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" scripts\techstores-setup.iss
  echo.
  goto :summary
)

echo Compiling installer with:
echo   %ISCC%
"%ISCC%" "%~dp0techstores-setup.iss"
if errorlevel 1 (
  echo ERROR: Inno Setup compile failed.
  pause
  exit /b 1
)

:summary
echo.
echo ============================================
echo  Release v%APP_VERSION% ready
echo ============================================
echo.
if exist "%OUT_PORTABLE%\TECHSTORES.exe" echo   Portable folder:  %CD%\%OUT_PORTABLE%\
if exist "%ZIP_OUT%" echo   Portable ZIP:     %CD%\%ZIP_OUT%
if exist "%SETUP_EXE%" echo   Setup installer:  %CD%\%SETUP_EXE%
echo.
echo Install on a PC: run TECHSTORES-Setup-%APP_VERSION%.exe
echo Or copy the portable folder / ZIP — no install required.
echo.
pause
endlocal
exit /b 0
