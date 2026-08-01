# GroomAI Local Dev Launcher
# ─────────────────────────────────────────────────────────────────────────────
# Usage: Run from PowerShell in the GroomAI root folder:
#   powershell -ExecutionPolicy Bypass -File dev.ps1
#
# Or right-click this file -> "Run with PowerShell"
#
# What it does:
#   1. Starts the FastAPI backend  on http://localhost:8000
#   2. Starts the Next.js frontend on http://localhost:3000
#   3. Opens http://localhost:3000 in your default browser
#   4. Ctrl+C in this window stops BOTH servers cleanly
#
# DEPLOYMENT SAFE: This file does NOT touch railway.toml, render.yaml,
# .env.production, or any deployment config. Safe to commit to git.
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$rootDir      = $PSScriptRoot
$backendDir   = Join-Path $rootDir "backend"
$frontendDir  = Join-Path $rootDir "frontend"
$venvUvicorn  = Join-Path $backendDir ".venv\Scripts\uvicorn.exe"
$venvPython   = Join-Path $backendDir ".venv\Scripts\python.exe"

function Print-Info  { param($msg) Write-Host "  [INFO]  $msg" -ForegroundColor Cyan }
function Print-Ok    { param($msg) Write-Host "  [ OK ]  $msg" -ForegroundColor Green }
function Print-Warn  { param($msg) Write-Host "  [WARN]  $msg" -ForegroundColor Yellow }
function Print-Fail  { param($msg) Write-Host "  [FAIL]  $msg" -ForegroundColor Red }

Clear-Host
Write-Host ""
Write-Host "  +======================================+" -ForegroundColor Magenta
Write-Host "  |       GroomAI  --  Local Dev         |" -ForegroundColor Magenta
Write-Host "  +======================================+" -ForegroundColor Magenta
Write-Host ""

# ── Pre-flight checks ──────────────────────────────────────────────────────────
Print-Info "Checking backend virtual environment..."
if (-not (Test-Path $venvPython)) {
    Print-Fail "Python venv not found at: $venvPython"
    Print-Warn "Run this first to set it up:"
    Write-Host "  cd backend"
    Write-Host "  python -m venv .venv"
    Write-Host "  .venv\Scripts\pip install -r requirements.txt"
    exit 1
}
Print-Ok "Backend venv found."

Print-Info "Checking Node.js / npm..."
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Print-Fail "npm not found. Install Node.js from https://nodejs.org"
    exit 1
}
Print-Ok "npm found."

Print-Info "Checking frontend node_modules..."
$nodeModulesPath = Join-Path $frontendDir "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Print-Warn "node_modules missing -- running npm install in frontend..."
    Push-Location $frontendDir
    npm install --silent
    Pop-Location
    Print-Ok "npm install complete."
} else {
    Print-Ok "node_modules present."
}

# ── Launch Backend ─────────────────────────────────────────────────────────────
Write-Host ""
Print-Info "Starting FastAPI backend on http://localhost:8000 ..."
$backendJob = Start-Job -Name "GroomAI-Backend" -ScriptBlock {
    param($dir, $uvi)
    Set-Location $dir
    & $uvi app.main:app --host 127.0.0.1 --port 8000 --reload 2>&1
} -ArgumentList $backendDir, $venvUvicorn

# ── Launch Frontend ────────────────────────────────────────────────────────────
Print-Info "Starting Next.js frontend on http://localhost:3000 ..."
$frontendJob = Start-Job -Name "GroomAI-Frontend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev 2>&1
} -ArgumentList $frontendDir

# ── Give servers a moment to boot ─────────────────────────────────────────────
Write-Host ""
Print-Info "Waiting for servers to start (5 seconds)..."
Start-Sleep -Seconds 5

# ── Open browser ──────────────────────────────────────────────────────────────
Print-Ok "Opening http://localhost:3000 in your browser..."
Start-Process "http://localhost:3000"

# ── Stream logs to console ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "  -----------------------------------------" -ForegroundColor DarkGray
Write-Host "   Both servers are running." -ForegroundColor White
Write-Host "   Backend  -> http://localhost:8000" -ForegroundColor White
Write-Host "   Frontend -> http://localhost:3000" -ForegroundColor White
Write-Host "   Press Ctrl+C to stop everything." -ForegroundColor White
Write-Host "  -----------------------------------------" -ForegroundColor DarkGray
Write-Host ""

try {
    while ($true) {
        $backendOutput  = Receive-Job $backendJob  -ErrorAction SilentlyContinue
        $frontendOutput = Receive-Job $frontendJob -ErrorAction SilentlyContinue

        if ($backendOutput) {
            $backendOutput | ForEach-Object {
                Write-Host "  [BACKEND]  $_" -ForegroundColor DarkCyan
            }
        }
        if ($frontendOutput) {
            $frontendOutput | ForEach-Object {
                Write-Host "  [FRONTEND] $_" -ForegroundColor DarkYellow
            }
        }

        if ($backendJob.State -eq "Failed") {
            Print-Fail "Backend crashed! See logs above."
            break
        }
        if ($frontendJob.State -eq "Failed") {
            Print-Fail "Frontend crashed! See logs above."
            break
        }

        Start-Sleep -Milliseconds 400
    }
}
finally {
    Write-Host ""
    Print-Info "Shutting down servers..."
    Stop-Job   $backendJob   -ErrorAction SilentlyContinue
    Remove-Job $backendJob   -ErrorAction SilentlyContinue -Force
    Stop-Job   $frontendJob  -ErrorAction SilentlyContinue
    Remove-Job $frontendJob  -ErrorAction SilentlyContinue -Force
    Print-Ok "All servers stopped. Goodbye!"
    Write-Host ""
}
