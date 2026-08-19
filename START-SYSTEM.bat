@echo off
title IT-DIR Tech Stores - Database Server
cd /d "%~dp0"
echo.
echo Starting Tech Stores with persistent SQLite database...
echo.
echo Database file (kept on disk after shutdown / logout):
echo   %~dp0techstores.db
echo.
echo Open on THIS PC:
echo   http://127.0.0.1:8080/app/
echo.
echo Phone (same Wi-Fi): use the LAN address printed below, then
echo   Chrome/Safari menu - Add to Home screen / Install app
echo.
echo Login examples:
echo   admin / admin123
echo   store / store123
echo   viewer / view123
echo.
echo IMPORTANT: Keep this window open while using the system.
echo Data is saved to techstores.db and remains after you close
echo the browser, log out, or shut down the computer.
echo Press Ctrl+C to stop the server.
echo.
python server.py
if errorlevel 1 (
  echo.
  echo Python failed to start. Make sure Python is installed.
  pause
)
