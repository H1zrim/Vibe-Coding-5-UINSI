# 📚 SIPERPU (Sistem Informasi Perpustakaan)
## Multi-Service Decoupled Architecture: Laravel 12 API + React.js SPA

Sistem Informasi Perpustakaan Kampus modern dengan pemisahan tegas antara **Backend REST API** dan **Frontend Client Single Page Application (SPA)**. Menggunakan gerbang autentikasi tunggal (**Single Auth Gateway via Laravel Sanctum**) dan database relasional **MySQL**.

---

## 🏛️ Arsitektur & Teknologi

```text
┌─────────────────────────────────┐        REST API (JSON)        ┌─────────────────────────────────┐
│        FRONTEND SERVICE         │ ◄───────────────────────────► │         BACKEND SERVICE         │
│  React.js (Vite) + Tailwind CSS │    Auth: Bearer Token (Sanctum)│  Laravel 12.x (PHP 8.2+)        │
│  Port: 5173 (Development)       │    Envelope: success/data     │  Database: MySQL (siperpu_db)   │
│                                 │                               │  Port: 8000 (Development)       │
└─────────────────────────────────┘                               └─────────────────────────────────┘
```

* **Backend Service (`/backend`):** Laravel 12, PHP 8.2+, MySQL (`siperpu_db`), Laravel Sanctum, Pest Testing.
* **Frontend Service (`/frontend`):** React 18/19, Vite, Tailwind CSS v3, Axios, Lucide React, React Hot Toast, React Router.
* **Spesifikasi Aturan & Prompt AI:** Terkunci di [`standar.md`](standar.md) sebagai *Single Source of Truth (SSOT)*.
* **Koleksi Postman Siap Pakai:** [`siperpu_postman_collection.json`](siperpu_postman_collection.json).

---

## 📁 Struktur Direktori Aktif

```text
perpustakaan/
├── backend/                       # Layanan Backend API (Laravel 12 + MySQL)
│   ├── app/
│   │   ├── Http/Controllers/Api/  # AuthController, BookController, BorrowingController
│   │   ├── Http/Middleware/       # EnsureRole.php (Verifikasi otoritas Pengurus vs Mahasiswa)
│   │   └── Models/                # User.php, Book.php, Borrowing.php
│   ├── database/
│   │   ├── migrations/            # Skema tabel users, books, borrowings di MySQL
│   │   └── seeders/               # Akun bawaan admin/mhs dan katalog buku awal
│   ├── routes/api.php             # Seluruh endpoint REST API terproteksi
│   └── tests/                     # 12 Pest Feature & Unit Tests (100% Passed)
│
├── frontend/                      # Layanan Frontend Client (React + Vite)
│   ├── src/
│   │   ├── api/                   # Axios client instance & endpoint modules
│   │   ├── components/            # Navbar, QuotaMeter, BookCard, BookModal, BorrowModal
│   │   ├── contexts/              # AuthContext.jsx (Single token gateway)
│   │   ├── hooks/                 # useBooks.jsx, useBorrowings.jsx
│   │   └── pages/                 # LoginPage, RegisterPage, CatalogPage, AdminDashboard, AdminLoansPage
│   ├── tailwind.config.js         # Konfigurasi Tailwind v3
│   └── package.json               # Tepat 5 dependensi resmi
│
├── standar.md                     # Pedoman aturan bisnis & prompt personalisasi AI
└── siperpu_postman_collection.json# File impor 1-klik untuk pengujian via Postman
```

---

## ⚡ Panduan Menjalankan Aplikasi (Quick Start)

### 1. Prasyarat
* XAMPP (Apache & **MySQL Service aktif** di port 3306).
* PHP 8.2+ dengan ekstensi `pdo_mysql` aktif.
* Node.js v18+ dan Composer.

### 2. Menjalankan Backend (Laravel)
```powershell
# Buka terminal 1, masuk ke folder backend
cd c:\xampp\htdocs\perpustakaan\backend

# Jalankan server API (Port 8000)
php artisan serve
```
Backend akan aktif di: `http://127.0.0.1:8000/api`

### 3. Menjalankan Frontend (React + Vite)
```powershell
# Buka terminal 2, masuk ke folder frontend
cd c:\xampp\htdocs\perpustakaan\frontend

# Jalankan server frontend development (Port 5173)
npm run dev
```
Buka browser di: `http://localhost:5173`

---

## 🔑 Kredensial Akun Bawaan (Seeder)

| Username | Password | Role | Nama Lengkap / NIM | Hak Akses |
|---|---|---|---|---|
| `admin` | `123` | **pengurus** | Bambang Sudarsono, S.Kom. | CRUD Master Buku, Sirkulasi Pengembalian, Log Semua Transaksi, Statistik |
| `mhs1` | `123` | **mahasiswa** | Budi Santoso (NIM: 210001001) | Katalog Buku, Kuota Meter (Ada 1 pinjaman aktif), Pinjam Buku, Riwayat Pribadi |
| `mhs2` | `123` | **mahasiswa** | Siti Rahma (NIM: 210001002) | Akun baru, kuota 0/3 buku |

---

## 🛡️ Aturan Otoritas API (Role Authority)

Setiap request wajib menyertakan header:
`Authorization: Bearer <token>`

| Jalur Otoritas | Endpoint | Method | Keterangan & Proteksi |
|---|---|---|---|
| **Publik** | `/api/health` | GET | Status layanan & koneksi database |
| **Publik** | `/api/auth/login` | POST | Login tunggal Admin & Mahasiswa |
| **Publik** | `/api/auth/register` | POST | Pendaftaran mahasiswa baru (Role terkunci mahasiswa) |
| **Auth (Semua)** | `/api/auth/me` | GET | Profil pengguna aktif |
| **Auth (Semua)** | `/api/auth/logout` | POST | Revoke token saat ini |
| **Auth (Semua)** | `/api/books` | GET | Katalog buku lengkap (bisa filter pencarian & kategori) |
| **Auth (Semua)** | `/api/books/{id}` | GET | Detail 1 buku |
| **Khusus Mahasiswa** | `/api/borrowings/borrow` | POST | Pinjam buku (Cek kuota < 3, durasi otomatis 7 hari). *Admin dilarang (403)* |
| **Khusus Mahasiswa** | `/api/borrowings/my` | GET | Riwayat peminjaman pribadi milik mahasiswa login |
| **Khusus Pengurus** | `/api/books` | POST | Tambah buku baru ke katalog. *Mahasiswa dilarang (403)* |
| **Khusus Pengurus** | `/api/books/{id}` | PUT | Perbarui data buku. *Mahasiswa dilarang (403)* |
| **Khusus Pengurus** | `/api/books/{id}` | DELETE | Hapus buku (Ditolak jika sedang Dipinjam). *Mahasiswa dilarang (403)* |
| **Khusus Pengurus** | `/api/borrowings/{id}/return` | PUT | Tandai pengembalian (Status buku otomatis kembali Tersedia) |
| **Khusus Pengurus** | `/api/borrowings/all` | GET | Log sirkulasi seluruh mahasiswa |
| **Khusus Pengurus** | `/api/dashboard/stats` | GET | Ringkasan statistik buku, ketersediaan, dan keterlambatan |

---

## 📬 Pengujian via Postman (1-Klik Impor & Alur Otomatis)

1. Buka aplikasi **Postman**.
2. Klik tombol **Import** (di kiri atas) lalu pilih berkas:  
   [`siperpu_postman_collection.json`](siperpu_postman_collection.json).
3. **Autentikasi Otomatis:**
   - Jalankan request **"01. Auth > Login sebagai Pengurus (Admin)"** atau **"Login sebagai Mahasiswa (Budi)"**.  
   - *Test script Postman secara otomatis menyimpan token ke variabel `{{admin_token}}` dan `{{student_token}}`!*
4. **Sirkulasi Dinamis (Acceptance Criteria):**
   - Saat mahasiswa menjalankan request **"03. Sirkulasi > Pinjam Buku"**, Postman **otomatis menyimpan ID transaksi peminjaman** ke variabel `{{borrowing_id}}`.
   - Saat admin menjalankan request **"04. Sirkulasi > Kembalikan Buku"**, URL otomatis menggunakan `{{borrowing_id}}` yang valid tanpa memicu 404!
5. Anda dapat menguji seluruh 15 endpoint API secara berurutan tanpa perlu menyalin token atau UUID secara manual.
