@echo off
REM Auto-start Tech Stores on Windows login (launcher + online server + browser).
setlocal EnableExtensions
cd /d "%~dp0.."

call "%~dp0start-launcher.cmd"

REM Skip if online server is already up
call "%~dp0resolve-python.cmd" -c "from mode_switch import port_is_listening; import sys; sys.exit(0 if port_is_listening(8080) else 1)" >nul 2>&1
if not errorlevel 1 goto :open

call "%~dp0resolve-python.cmd" -c "from mode_switch import perform_switch; perform_switch('online', delay=0.2)"
call "%~dp0resolve-python.cmd" -c "from mode_switch import wait_for_mode; import sys; sys.exit(0 if wait_for_mode('online', timeout=35) else 1)" >nul 2>&1

:open
start "" "http://127.0.0.1:8080/app/"
exit /b 0
