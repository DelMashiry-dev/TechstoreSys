@echo off
title Open IT-DIR Tech Stores
cd /d "%~dp0"
call scripts\autostart-techstores.cmd
echo.
echo Browser opened. Keep the "Tech Stores ONLINE" console window open.
exit /b 0
