<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - SIPERPU Fullstack Development Gateway
|--------------------------------------------------------------------------
*/

Route::get('/', function (Request $request) {
    if ($request->expectsJson() || $request->is('api/*')) {
        return response()->json([
            'success' => true,
            'message' => 'SIPERPU Backend API Service is active',
            'data' => [
                'frontend_app' => 'http://localhost:5173',
                'api_health' => url('/api/health'),
                'api_catalog' => url('/api/books'),
            ],
            'errors' => null,
        ]);
    }

    $frontendUrl = 'http://localhost:5173';
    $healthUrl = url('/api/health');

    return response(<<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIPERPU - Fullstack Gateway</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f8fafc;
            padding: 24px;
        }
        .card {
            background: rgba(30, 41, 59, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            max-width: 540px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
            margin-bottom: 20px;
        }
        .dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.85); }
        }
        h1 { font-size: 26px; font-weight: 700; margin-bottom: 10px; }
        p.subtitle { color: #94a3b8; font-size: 14.5px; line-height: 1.6; margin-bottom: 28px; }
        .grid {
            display: grid;
            gap: 12px;
            margin-bottom: 28px;
            text-align: left;
        }
        .item {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 14px 18px;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
        }
        .item-label { color: #94a3b8; }
        .item-val { font-weight: 600; color: #e2e8f0; }
        .btn-group { display: flex; flex-direction: column; gap: 10px; }
        .btn {
            display: block;
            width: 100%;
            padding: 13px 20px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        .btn-primary {
            background: #2563eb;
            color: white;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }
        .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.06);
            color: #cbd5e1;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); color: white; }
        .redirect-notice {
            margin-top: 20px;
            font-size: 12px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">
            <span class="dot"></span>
            Backend API Online & Sehat
        </div>
        <h1>📚 SIPERPU Fullstack</h1>
        <p class="subtitle">
            Layanan Backend Laravel 12 API berjalan di <b>Port 8000</b>.<br>
            Tampilan web Single Page Application (SPA) berada di <b>Port 5173</b>.
        </p>

        <div class="grid">
            <div class="item">
                <span class="item-label">Frontend Web UI</span>
                <span class="item-val">http://localhost:5173</span>
            </div>
            <div class="item">
                <span class="item-label">Backend REST API</span>
                <span class="item-val">http://localhost:8000/api</span>
            </div>
            <div class="item">
                <span class="item-label">Autentikasi Gateway</span>
                <span class="item-val">Laravel Sanctum</span>
            </div>
        </div>

        <div class="btn-group">
            <a href="{$frontendUrl}" class="btn btn-primary" id="btn-fe">
                🚀 Buka Tampilan Aplikasi (Port 5173)
            </a>
            <a href="{$healthUrl}" class="btn btn-secondary">
                📡 Cek API Health Check (/api/health)
            </a>
        </div>

        <div class="redirect-notice">
            Pilih tautan di atas untuk menuju layanan yang diinginkan secara manual.
        </div>
    </div>
</body>
</html>
HTML);
});
