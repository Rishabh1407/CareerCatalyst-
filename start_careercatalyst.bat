@echo off
setlocal enabledelayedexpansion
title CareerCatalyst Launcher

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
cd /d "%ROOT%"

echo ======================================================================
echo           CareerCatalyst - AI Personalized Interview Platform
echo                     One-Click Application Startup
echo ======================================================================
echo.

:: 1. Check Backend Virtual Environment
if not exist "%ROOT%\backend\venv\Scripts\python.exe" (
    echo [ERROR] Backend virtual environment not found at:
    echo         "%ROOT%\backend\venv"
    echo.
    echo Please set up the backend environment first:
    echo   cd /d "%ROOT%\backend"
    echo   python -m venv venv
    echo   venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

:: 2. Check Frontend Dependencies
if not exist "%ROOT%\frontend\node_modules" (
    echo [ERROR] Frontend node_modules not found at:
    echo         "%ROOT%\frontend\node_modules"
    echo.
    echo Please install frontend dependencies:
    echo   cd /d "%ROOT%\frontend"
    echo   npm install
    echo.
    pause
    exit /b 1
)

:: 3. Check for Existing PID file
if exist "%ROOT%\careercatalyst.pids" (
    echo [NOTICE] Existing session tracking file detected.
    echo Checking if previous servers are still active...
)

:: 4. Check Port Availability (8000 for FastAPI, 5173 for Vite)
netstat -ano | findstr /R /C:":8000 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 8000 is currently occupied.
    echo A backend server may already be running.
    echo Run stop_careercatalyst.bat if you wish to reset it.
    echo.
)

netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 5173 is currently occupied.
    echo A frontend server may already be running.
    echo Run stop_careercatalyst.bat if you wish to reset it.
    echo.
)

echo [1/3] Starting FastAPI Backend on http://localhost:8000...
start "CareerCatalyst Backend" cmd /k "title CareerCatalyst Backend && cd /d "%ROOT%" && backend\venv\Scripts\uvicorn.exe backend.app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/3] Starting React / Vite Frontend on http://localhost:5173...
start "CareerCatalyst Frontend" cmd /k "title CareerCatalyst Frontend && cd /d "%ROOT%\frontend" && npm.cmd run dev -- --host 127.0.0.1"

:: Record running process IDs for safe tracked shutdown
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Sleep -Seconds 2; " ^
  "$ports = @(8000, 5173); " ^
  "$pids = @(); " ^
  "foreach ($p in $ports) { " ^
  "  $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; " ^
  "  if ($conns) { $pids += $conns.OwningProcess } " ^
  "} " ^
  "$uniquePids = $pids | Where-Object { $_ -gt 0 } | Select-Object -Unique; " ^
  "if ($uniquePids) { $uniquePids | Out-File -FilePath '%ROOT%\careercatalyst.pids' -Encoding ascii }"

echo [3/3] Probing frontend readiness and launching browser...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ready = $false; " ^
  "for ($i=0; $i -lt 30; $i++) { " ^
  "  try { " ^
  "    $res = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 1; " ^
  "    if ($res.StatusCode -eq 200) { $ready = $true; break; } " ^
  "  } catch {} " ^
  "  Start-Sleep -Seconds 1 " ^
  "} " ^
  "if ($ready) { " ^
  "  Write-Host '[SUCCESS] Application ready! Opening default browser...'; " ^
  "  Start-Process 'http://localhost:5173'; " ^
  "} else { " ^
  "  Write-Host '[INFO] Server started. Please open http://localhost:5173 in your browser.'; " ^
  "}"

echo.
echo ======================================================================
echo  CareerCatalyst is running!
echo  - Frontend App:   http://localhost:5173
echo  - Backend API:    http://localhost:8000
echo  - API Swagger:    http://localhost:8000/docs
echo.
echo  Keep the backend and frontend terminal windows open.
echo  To stop CareerCatalyst safely, run: stop_careercatalyst.bat
echo ======================================================================
echo.
pause
