@echo off
REM Resolve Python 3 for Tech Stores launchers (avoids Store stub + missing PATH).
setlocal EnableExtensions

if defined TECHSTORES_PYEXE goto :run
if defined TECHSTORES_PY_ARGS goto :run

call :resolve
if errorlevel 1 exit /b 1

:run
if /i "%TECHSTORES_PYEXE%"=="py" (
  py -3 %TECHSTORES_PY_ARGS% %*
) else (
  "%TECHSTORES_PYEXE%" %TECHSTORES_PY_ARGS% %*
)
set "ERR=%ERRORLEVEL%"
endlocal & exit /b %ERR%

:resolve
REM Prefer VS Code / caller override
if defined TECHSTORES_PYTHON (
  set "TECHSTORES_PYEXE=%TECHSTORES_PYTHON%"
  set "TECHSTORES_PY_ARGS="
  exit /b 0
)

REM Python launcher (py -3)
where py >nul 2>&1
if not errorlevel 1 (
  set "TECHSTORES_PYEXE=py"
  set "TECHSTORES_PY_ARGS="
  exit /b 0
)

REM Real python.exe on PATH (skip WindowsApps store stub)
for /f "delims=" %%P in ('where python 2^>nul') do (
  echo %%P | findstr /i /c:"WindowsApps" >nul
  if errorlevel 1 (
    set "TECHSTORES_PYEXE=%%P"
    set "TECHSTORES_PY_ARGS="
    exit /b 0
  )
)

REM Common per-user installs
for %%V in (313 312 311 310 39 38) do (
  if exist "%LocalAppData%\Programs\Python\Python%%V\python.exe" (
    set "TECHSTORES_PYEXE=%LocalAppData%\Programs\Python\Python%%V\python.exe"
    set "TECHSTORES_PY_ARGS="
    exit /b 0
  )
)

echo.
echo ERROR: Python 3 was not found.
echo Install from https://www.python.org/downloads/ and enable "Add python.exe to PATH".
echo Or set TECHSTORES_PYTHON to your python.exe path.
echo.
exit /b 9009
