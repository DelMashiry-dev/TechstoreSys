@echo off
REM Portable: launcher + online server + browser.
setlocal EnableExtensions
cd /d "%~dp0.."

call "%~dp0start-launcher.cmd"

if exist "TECHSTORES-MODE.exe" (
  TECHSTORES-MODE.exe --port-check >nul 2>&1
  if not errorlevel 1 goto :open
  TECHSTORES-MODE.exe --perform online
  TECHSTORES-MODE.exe --wait online --timeout 35 >nul 2>&1
) else (
  netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>&1
  if not errorlevel 1 goto :open
  if exist "TECHSTORES.exe" (
    start "Tech Stores ONLINE" "TECHSTORES.exe"
  ) else (
    call "%~dp0..\resolve-python.cmd" -c "from mode_switch import perform_switch; perform_switch('online', delay=0.2)"
  )
  timeout /t 4 /nobreak >nul
)

:open
start "" "http://127.0.0.1:8080/app/"
exit /b 0
