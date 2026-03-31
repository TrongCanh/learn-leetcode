@echo off
title NeetCode Dashboard
color 0A

echo.
echo ========================================
echo   NeetCode 75 Dashboard
echo ========================================
echo.

cd /d "%~dp0"
cd ..

echo [1] Starting local server on port 8080...
echo.
powershell -Command "Start-Process -FilePath 'python' -ArgumentList '-m', 'http.server', '8080' -WindowStyle Hidden"

timeout /t 2 /nobreak >nul

echo [2] Opening browser...
start http://localhost:8080/dashboard/index.html

echo.
echo ========================================
echo   Local: http://localhost:8080/dashboard/
echo.
echo   Press any key to open ngrok...
echo   (ngrok must be installed)
echo ========================================
echo.

pause >nul

echo [3] Starting ngrok...
ngrok http 8080

pause