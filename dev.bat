@echo off
title SIPERPU Fullstack Launcher
echo ======================================================================
echo   SIPERPU - SISTEM INFORMASI PERPUSTAKAAN FULLSTACK LAUNCHER
echo ======================================================================
echo.

set ROOT=%~dp0

:: Cek backend .env
if not exist "%ROOT%backend\.env" (
    echo [INFO] Menyalin backend\.env dari backend\.env.example...
    copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul
    cd /d "%ROOT%backend"
    php artisan key:generate
)

:: Cek frontend .env
if not exist "%ROOT%frontend\.env" (
    echo [INFO] Menyalin frontend\.env dari frontend\.env.example...
    copy "%ROOT%frontend\.env.example" "%ROOT%frontend\.env" >nul
)

echo [1/2] Menyalakan Backend Laravel 12 API (Port 8000)...
start "SIPERPU Backend API (:8000)" cmd /k "cd /d %ROOT%backend && php artisan serve --host=127.0.0.1 --port=8000"

echo [2/2] Menyalakan Frontend React + Vite SPA (Port 5173)...
start "SIPERPU Frontend SPA (:5173)" cmd /k "cd /d %ROOT%frontend && npm.cmd run dev"

echo.
echo ======================================================================
echo   SIPERPU Siap Digunakan!
echo   * Tampilan Web : http://localhost:5173
echo   * Gateway/API  : http://127.0.0.1:8000/
echo   * Akun Admin   : admin / 123
echo   * Akun Siswa   : mhs1 / 123
echo ======================================================================
