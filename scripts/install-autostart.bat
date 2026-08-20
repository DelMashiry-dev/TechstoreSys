@echo off
title Tech Stores — enable auto-start
cd /d "%~dp0.."
set "ROOT=%CD%"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LINK=%STARTUP%\Tech Stores Auto-Open.lnk"

echo.
echo Installing Tech Stores auto-start...
echo   - When you log in to Windows, this will:
echo       1. Start the background launcher
echo       2. Start the online database server
echo       3. Open http://127.0.0.1:8080/app/ in your browser
echo.
echo   Same as double-clicking OPEN-TECHSTORES.bat — but automatic.
echo.

powershell -NoProfile -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%LINK%');" ^
  "$s.TargetPath='%ROOT%\scripts\autostart-techstores.cmd';" ^
  "$s.WorkingDirectory='%ROOT%';" ^
  "$s.WindowStyle=7;" ^
  "$s.Description='Auto-start Tech Stores (server + browser)';" ^
  "$s.Save()"

REM Remove old launcher-only shortcut if present
if exist "%STARTUP%\TechStores Launcher.lnk" del "%STARTUP%\TechStores Launcher.lnk"

reg add "HKCU\Software\Classes\techstores-wake\shell\open\command" /ve /d "\"%ROOT%\scripts\wake-server.cmd\" online" /f >nul 2>&1
reg add "HKCU\Software\Classes\techstores-wake" /ve /d "Tech Stores server wake" /f >nul 2>&1
reg add "HKCU\Software\Classes\techstores-wake" /v "URL Protocol" /d "" /f >nul 2>&1

call "%ROOT%\scripts\autostart-techstores.cmd"
echo.
echo Done. Auto-start is enabled — Tech Stores will open when you log in to Windows.
echo To disable: delete "%LINK%"
echo.
pause
