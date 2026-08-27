@echo off
REM Called by custom URL protocol or manually — starts launcher + app server.
setlocal EnableExtensions
cd /d "%~dp0.."
set "MODE=online"
echo %~1 | findstr /i offline >nul && set "MODE=offline"
call "%~dp0start-launcher.cmd"
timeout /t 2 /nobreak >nul 2>nul
call "%~dp0resolve-python.cmd" -c "from mode_switch import perform_switch; perform_switch('%MODE%', delay=0.2)"
exit /b 0
