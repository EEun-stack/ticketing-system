[CmdletBinding()]
param(
  [string]$NginxHome = "C:\Users\ainzp\Desktop\nginx-1.31.5",
  [int]$BackendPort = 5001
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$FrontendPath = Join-Path $ProjectRoot "frontend"
$BackendPath = Join-Path $ProjectRoot "backend"
$NginxExecutable = Join-Path $NginxHome "nginx.exe"
$PidFile = Join-Path $PSScriptRoot "backend.pid"

if (-not (Test-Path $NginxExecutable)) {
  throw "Nginx was not found at $NginxExecutable. Pass -NginxHome with the correct folder."
}

Write-Host "Building frontend..." -ForegroundColor Cyan
Push-Location $FrontendPath
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Frontend build failed." }
} finally {
  Pop-Location
}

$existingBackend = Get-NetTCPConnection -LocalPort $BackendPort -State Listen -ErrorAction SilentlyContinue
if ($existingBackend) {
  Write-Host "Backend is already listening on port $BackendPort." -ForegroundColor Yellow
} else {
  Write-Host "Starting backend on port $BackendPort..." -ForegroundColor Cyan
  $backendProcess = Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location -LiteralPath '$BackendPath'; npm run dev"
  ) -PassThru
  Set-Content -Path $PidFile -Value $backendProcess.Id
}

Write-Host "Starting Nginx..." -ForegroundColor Cyan
Push-Location $NginxHome
try {
  & $NginxExecutable
  if ($LASTEXITCODE -ne 0) { throw "Nginx failed to start." }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Application started." -ForegroundColor Green
Write-Host "Frontend build: $FrontendPath\dist"
Write-Host "Backend: http://localhost:$BackendPort"
Write-Host "Nginx: $NginxHome"
Write-Host "Run .\scripts\stop-all.ps1 to stop the services."
