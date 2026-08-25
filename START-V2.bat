@echo off
setlocal
cd /d "%~dp0"

echo TechStoreSys V2.0.0.0 — React dev server
echo.
echo Ensure START-SYSTEM.bat is running (port 8080) for database API.
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js / npm not found. Install from https://nodejs.org
  pause
  exit /b 1
)

cd v2
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo Starting Vite at http://127.0.0.1:5173/v2/
call npm run dev
