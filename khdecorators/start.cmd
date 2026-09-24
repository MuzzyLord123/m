@echo off
REM ===================================================================
REM  KH Painting and Decorating — start the site on this PC
REM
REM  Double-click this file. See RUN-ON-YOUR-PC.md if anything goes wrong.
REM ===================================================================

cd /d "%~dp0"

echo.
echo  KH Painting and Decorating
echo  ==========================
echo.

REM --- Is Node installed? -------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js is not installed.
  echo.
  echo  Go to https://nodejs.org and install the version marked LTS,
  echo  then double-click this file again.
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODEVER=%%v
echo  Node %NODEVER%

REM --- First run? Install what it needs. -----------------------------
if not exist "node_modules\" (
  echo.
  echo  First run — downloading what the site needs.
  echo  This takes a minute or two. It only happens once.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo  That did not work. Check you are connected to the internet
    echo  and try again.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo  Starting. When you see "Local: http://localhost:3000",
echo  open that address in your browser.
echo.
echo  To stop the site, close this window.
echo.

call npm run dev
pause
