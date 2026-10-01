# SIPERPU Backend

REST API SIPERPU menggunakan Laravel 12, PHP 8.2+, Sanctum Bearer Token, dan MySQL/MariaDB. Kontrak endpoint dan aturan bisnis tersedia di [../standar.md](../standar.md).

## Setup Lokal

Jika `.env` belum ada, salin `.env.example` menjadi `.env`; isi koneksi MySQL, lalu jalankan:

```powershell
composer install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

`frontend/` adalah SPA terpisah dan berjalan pada port `5173`; backend menerima request dari origin Vite lokal melalui CORS.

## Pengujian

```powershell
php artisan test
```

Suite menggunakan Pest. SQLite in-memory hanya dipakai oleh test; konfigurasi runtime default menggunakan MySQL.

## Database

Jalankan migration baru untuk perubahan skema. Jangan mengedit migration yang sudah di-merge. `migrate:fresh --seed` hanya boleh digunakan pada database lokal dan tidak boleh dijalankan di staging atau produksi.