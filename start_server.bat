@echo off
title LTVStudio - Web API & License Server (TypeScript)
color 0A

echo ======================================================================
echo       LTVSTUDIO WEB API & LICENSE MANAGEMENT SERVER (TYPESCRIPT)
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

echo [*] Dang khoi dong Web API & Admin Dashboard (TypeScript) tren cong 8080...
start "" http://localhost:8080/

if exist "node_modules\tsx\dist\cli.mjs" (
    node node_modules\tsx\dist\cli.mjs server.ts
) else (
    npx tsx server.ts
)
pause
