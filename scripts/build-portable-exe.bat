@echo off
setlocal EnableExtensions
set "EXE_NAME=%~1"
set "ENTRY=%~2"
set "ICON=%~3"
set "VERFILE=%~4"
set "SPEC_WORK=%~5"
set "PYI_HIDDEN=%~6"

if "%EXE_NAME%"=="" exit /b 1
if "%ENTRY%"=="" exit /b 1

echo   Building %EXE_NAME%.exe ...
python -m PyInstaller ^
  --noconfirm ^
  --clean ^
  --name %EXE_NAME% ^
  --onedir ^
  --console ^
  --icon "%ICON%" ^
  --version-file "%VERFILE%" ^
  --distpath dist ^
  --workpath "%SPEC_WORK%\%EXE_NAME%" ^
  --specpath "%SPEC_WORK%\%EXE_NAME%" ^
  %PYI_HIDDEN% ^
  %ENTRY%
exit /b %ERRORLEVEL%
