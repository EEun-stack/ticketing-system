[CmdletBinding()]
param(
  [string]$NginxHome = "C:\Users\Msi\Desktop\nginx-1.31.5\nginx-1.31.5"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $PSScriptRoot "backend.pid"
$NginxExecutable = Join-Path $NginxHome "nginx.exe"

if (Test-Path $NginxExecutable) {
  Push-Location $NginxHome
  try {
    & $NginxExecutable -s stop 2>$null
  } finally {
    Pop-Location
  }
}

if (Test-Path $PidFile) {
  $launcherPid = [int](Get-Content $PidFile)
  $launcherProcess = Get-Process -Id $launcherPid -ErrorAction SilentlyContinue
  if ($launcherProcess) {
    Stop-Process -Id $launcherPid -Force -ErrorAction SilentlyContinue
  }
  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

$backendProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -like "*ticketing system*backend*" }
foreach ($process in $backendProcesses) {
  Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

Write-Host "Nginx and the ticketing-system backend have been stopped." -ForegroundColor Green
