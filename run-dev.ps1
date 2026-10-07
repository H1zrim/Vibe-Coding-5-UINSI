# SIPERPU Fullstack PowerShell Launcher
$root = $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  SIPERPU - SISTEM INFORMASI PERPUSTAKAAN FULLSTACK LAUNCHER" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Validasi file environment
if (-not (Test-Path "$root\backend\.env")) {
    Write-Host "[INFO] Menyalin backend\.env..." -ForegroundColor Yellow
    Copy-Item "$root\backend\.env.example" "$root\backend\.env"
    Push-Location "$root\backend"
    php artisan key:generate
    Pop-Location
}

if (-not (Test-Path "$root\frontend\.env")) {
    Write-Host "[INFO] Menyalin frontend\.env..." -ForegroundColor Yellow
    Copy-Item "$root\frontend\.env.example" "$root\frontend\.env"
}

# 2. Jalankan Backend
Write-Host "[1/2] Menyalakan Backend Laravel 12 API (Port 8000)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend`" && php artisan serve --host=127.0.0.1 --port=8000"

# 3. Jalankan Frontend
Write-Host "[2/2] Menyalakan Frontend React + Vite SPA (Port 5173)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\frontend`" && npm.cmd run dev"



Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "  SIPERPU Berhasil Dinyalakan!" -ForegroundColor Green
Write-Host "  - Frontend Web UI : http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend API     : http://127.0.0.1:8000/api" -ForegroundColor White
Write-Host "  - Gateway Portal  : http://127.0.0.1:8000/" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
