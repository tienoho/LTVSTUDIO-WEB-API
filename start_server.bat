@echo off
title LTVStudio - Web API & License Server
color 0A

echo ======================================================================
echo           LTVSTUDIO WEB API & LICENSE MANAGEMENT SERVER
echo ======================================================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [LOI] Khong tim thay Node.js tren may tinh!
    echo Vui long cai dat Node.js tu: https://nodejs.org
    pause
    exit /b 1
)

echo [*] Dang khoi dong Web API & Admin Dashboard tren cong 8080...
start "" http://localhost:8080/
node server.js
pause
