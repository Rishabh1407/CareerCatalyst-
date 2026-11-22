@echo off
setlocal enabledelayedexpansion
title CareerCatalyst Shutdown

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
cd /d "%ROOT%"

echo ======================================================================
echo           CareerCatalyst - AI Personalized Interview Platform
echo                     One-Click Application Shutdown
echo ======================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$killedCount = 0; " ^
  "$trackedPids = @(); " ^
  "if (Test-Path '%ROOT%\careercatalyst.pids') { " ^
  "  $lines = Get-Content '%ROOT%\careercatalyst.pids' | Where-Object { $_ -match '^\d+$' }; " ^
  "  foreach ($line in $lines) { $trackedPids += [int]$line } " ^
  "} " ^
  "$ports = @(8000, 5173); " ^
  "foreach ($p in $ports) { " ^
  "  $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; " ^
  "  if ($conns) { " ^
  "    foreach ($c in $conns) { " ^
  "      if ($c.OwningProcess -gt 0 -and $trackedPids -notcontains $c.OwningProcess) { " ^
  "        $trackedPids += $c.OwningProcess " ^
  "      } " ^
  "    } " ^
  "  } " ^
  "} " ^
  "if ($trackedPids.Count -eq 0) { " ^
  "  Write-Host '[INFO] No running CareerCatalyst server processes were detected on ports 8000 or 5173.'; " ^
  "} else { " ^
  "  foreach ($pidToKill in ($trackedPids | Select-Object -Unique)) { " ^
  "    try { " ^
  "      $proc = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue; " ^
  "      if ($proc) { " ^
  "        Write-Host ('[STOPPING] Terminating process ID ' + $pidToKill + ' (' + $proc.ProcessName + ')...'); " ^
  "        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue; " ^
  "        $killedCount++; " ^
  "      } " ^
  "    } catch {} " ^
  "  } " ^
  "} " ^
  "if (Test-Path '%ROOT%\careercatalyst.pids') { " ^
  "  Remove-Item -Path '%ROOT%\careercatalyst.pids' -Force -ErrorAction SilentlyContinue; " ^
  "} " ^
  "Write-Host ''; " ^
  "Write-Host ('[SUCCESS] CareerCatalyst shutdown completed cleanly (' + $killedCount + ' processes stopped).'); "

echo.
echo ======================================================================
echo  All CareerCatalyst servers have been stopped.
echo  Database records and user data remain completely preserved.
echo ======================================================================
echo.
pause
