# SIPERPU

SIPERPU adalah aplikasi peminjaman buku dengan React SPA dan REST API Laravel. [standar.md](standar.md)
adalah acuan resmi untuk aturan bisnis, endpoint, dependensi, dan struktur aplikasi.

## Arsitektur

- Frontend: React + Vite di `frontend/`, default `http://localhost:5173`.
- Backend: Laravel 12 + Sanctum di `backend/`, default `http://localhost:8000`.
- Database: MySQL atau MariaDB melalui PDO MySQL.
- Pengujian backend: Pest.

## Menjalankan Lokal

Siapkan PHP 8.2+, Composer, Node.js, dan MySQL/MariaDB. Buat database `siperpu_db`, lalu siapkan backend:

```powershell
cd backend
composer install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Jalankan frontend di terminal lain:

```powershell
cd frontend
npm install
npm run dev
```

Frontend menggunakan API `http://localhost:8000/api` secara default. Atur `VITE_API_BASE_URL` bila backend berjalan pada alamat lain.

Seeder lokal membuat satu akun pengurus (`admin` / `123`) dan katalog awal. Ganti kredensial tersebut sebelum digunakan di luar lokal.

Jangan jalankan `php artisan migrate:fresh --seed` di staging atau produksi. Migration yang sudah di-merge tidak diedit; perubahan skema harus memakai migration baru.

## Direktori Legacy

Direktori `app/`, `assets/`, `index.php`, `services/`, dan `perpustakaan-microservices/` adalah implementasi/eksperimen terpisah dan bukan runtime SIPERPU yang ditetapkan oleh standar saat ini. Aplikasi aktif berada di `backend/` dan `frontend/`.
