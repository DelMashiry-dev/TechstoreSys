IT-DIR Tech Stores — Version 1.0.0.0
====================================

WHAT THIS IS
  A self-contained Windows package of the IT-DIR Tech Stores system.
  Python is NOT required on the target computer.

HOW TO RUN (portable — no installer)
  1. Copy the entire TECHSTORES-Portable folder (USB / shared drive).
  2. Double-click OPEN-TECHSTORES.bat  (fastest — server + browser)
     or START-SYSTEM.bat  (online database only)
     or START-OFFLINE.bat (browser-only storage, no SQLite)
  3. The browser opens to http://127.0.0.1:8080/app/
  4. Keep the black console window open while using the system.
  5. Close that window (or press Ctrl+C) to stop.

ONLINE / OFFLINE
  - Online mode saves to techstores.db (SQLite) on this PC.
  - Offline mode saves in the browser; switch back online to reconcile.
  - Use the toggle on the login form to switch modes.
  - TECHSTORES-LAUNCHER.exe runs in the background so the toggle works.

HOW TO INSTALL (Setup.exe)
  1. Run TECHSTORES-Setup-1.0.0.0.exe
  2. Follow the wizard (installs under Program Files\TECHSTORES by default)
  3. Start from the Start Menu / Desktop shortcut
  4. Uninstall via Windows Settings → Apps

AUTO-START ON WINDOWS LOGIN
  Run scripts\install-autostart.bat once — same as OPEN-TECHSTORES.bat at login.

DEMO / DEFAULT LOGINS
  admin / admin123     — full administrator
  dir   / dir123       — Director IT Dir
  store / store123     — store officer
  viewer / view123     — read-only viewer

DATA
  All online saves go into techstores.db next to TECHSTORES.exe.
  That file travels with the folder if you copy it again later.
  Upgrades via Setup.exe do not overwrite an existing database.

EXECUTABLES
  TECHSTORES.exe           — online database server (port 8080)
  TECHSTORES-OFFLINE.exe   — offline shell server (port 8080)
  TECHSTORES-LAUNCHER.exe  — mode launcher (port 8765)
  TECHSTORES-MODE.exe      — switches between online/offline servers

NOTES
  - Version: 1.0.0.0
  - TECHSTORES.exe uses the official TechStores circular badge icon.
  - Windows Defender may prompt the first time — choose Run anyway
    (unsigned local build).
  - Port 8080 must be free on the PC.
  - Do not move TECHSTORES.exe out of its folder; it needs app\.

Built for offline / local use on Windows.
