# 📄 KONTRAK API RESMI (API-CONTRACT.MD)
## Proyek: SIPERPU (Sistem Informasi Perpustakaan Terintegrasi)
**Base URL:** `http://localhost:8000/api`  
**Format Pertukaran Data:** `application/json` (HTTP/JSON)  
**Mekanisme Autentikasi:** Single Gateway Bearer Token via Laravel Sanctum  

---

## 1. Standar Format Respons (JSON Envelope)

Semua endpoint merespons dengan envelope standar 4 kunci:

```json
{
  "success": true,
  "message": "Pesan deskriptif status permintaan",
  "data": {},
  "errors": null
}
```

### Standar Status Kode HTTP:
* `200 OK`: Permintaan berhasil diproses.
* `201 Created`: Data sumber daya baru berhasil dibuat.
* `401 Unauthorized`: Token tidak ada, tidak valid, atau kedaluwarsa.
* `403 Forbidden`: Pengguna terautentikasi tetapi tidak memiliki hak akses role tersebut.
* `404 Not Found`: Sumber daya (buku / ID transaksi) tidak ditemukan di database.
* `422 Unprocessable Content`: Pelanggaran aturan bisnis (kuota penuh, buku sedang dipinjam, validasi payload gagal).

---

## 2. Ringkasan Endpoint

| No | Kategori | Method | Endpoint | Hak Akses | Deskripsi |
|:---:|---|:---:|---|:---:|---|
| 1 | System | `GET` | `/health` | Publik | Cek kesehatan layanan dan database |
| 2 | Auth | `POST` | `/auth/login` | Publik | Login Pengurus & Mahasiswa |
| 3 | Auth | `POST` | `/auth/register` | Publik | Registrasi akun Mahasiswa baru |
| 4 | Auth | `GET` | `/auth/me` | Auth (Semua) | Memeriksa data akun dan sesi aktif |
| 5 | Auth | `POST` | `/auth/logout` | Auth (Semua) | Menghapus token sesi aktif |
| 6 | Books | `GET` | `/books` | Auth (Semua) | Mengambil daftar katalog buku |
| 7 | Books | `GET` | `/books/{id}` | Auth (Semua) | Mengambil detail spesifik satu buku |
| 8 | Books | `POST` | `/books` | Pengurus | Menambah buku baru ke katalog |
| 9 | Books | `PUT` | `/books/{id}` | Pengurus | Memperbarui data buku |
| 10 | Books | `DELETE`| `/books/{id}` | Pengurus | Menghapus buku (Ditolak jika dipinjam) |
| 11 | Sirkulasi | `POST` | `/borrowings/borrow` | Mahasiswa | Meminjam buku (Maks kuota 3 buku) |
| 12 | Sirkulasi | `GET` | `/borrowings/my` | Mahasiswa | Riwayat peminjaman pribadi |
| 13 | Sirkulasi | `PUT` | `/borrowings/{id}/return` | Pengurus | Mengembalikan buku fisik |
| 14 | Sirkulasi | `GET` | `/borrowings/all` | Pengurus | Log seluruh sirkulasi perpustakaan |
| 15 | Stats | `GET` | `/dashboard/stats` | Pengurus | Statistik buku, ketersediaan, & overdue |

---

## 3. Rincian Spesifikasi Endpoint

### 3.1. System Health Check
* **Endpoint:** `GET /health`
* **Header:** `Accept: application/json`
* **Respons Berhasil (200 OK):**
```json
{
  "success": true,
  "message": "SIPERPU Backend API Service is healthy",
  "data": {
    "service": "Laravel 12 API",
    "database": "mysql (siperpu_db)",
    "auth_gateway": "Single Pipeline (Laravel Sanctum Bearer Token)",
    "server_time": "2026-10-16T14:00:00+08:00"
  },
  "errors": null
}
```

---

### 3.2. Login Pengguna (Single Gateway)
* **Endpoint:** `POST /auth/login`
* **Header:** `Content-Type: application/json`, `Accept: application/json`
* **Request Body:**
```json
{
  "username": "admin",
  "password": "123"
}
```
* **Respons Berhasil (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "token": "1|sanctum_bearer_token_string...",
    "user": {
      "id": 1,
      "name": "Bambang Sudarsono, S.Kom.",
      "role": "pengurus",
      "nim": null
    }
  },
  "errors": null
}
```
* **Respons Gagal (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Username atau password salah.",
  "data": null,
  "errors": null
}
```

---

### 3.3. Registrasi Mahasiswa (Role-Guard)
* **Endpoint:** `POST /auth/register`
* **Header:** `Content-Type: application/json`, `Accept: application/json`
* **Request Body:**
```json
{
  "name": "Ahmad Fauzi",
  "username": "fauzi",
  "nim": "210001010",
  "password": "password123",
  "password_confirmation": "password123"
}
```
* **Business Rule:** Parameter `role` diabaikan, sistem mengunci role otomatis ke `mahasiswa`.
* **Respons Berhasil (201 Created):**
```json
{
  "success": true,
  "message": "Registrasi mahasiswa berhasil.",
  "data": {
    "token": "2|sanctum_bearer_token_string...",
    "user": {
      "id": 4,
      "name": "Ahmad Fauzi",
      "role": "mahasiswa",
      "nim": "210001010"
    }
  },
  "errors": null
}
```

---

### 3.4. Meminjam Buku (Khusus Mahasiswa)
* **Endpoint:** `POST /borrowings/borrow`
* **Header:** `Authorization: Bearer {{student_token}}`, `Content-Type: application/json`
* **Request Body:**
```json
{
  "book_id": "BK-001"
}
```
* **Aturan Bisnis (BR-01, BR-02, BR-03):**
  - Mahasiswa maksimal memiliki 3 buku aktif berstatus `Dipinjam`.
  - Buku harus berstatus `Tersedia`.
  - Tanggal pinjam otomatis hari ini, `due_date` otomatis `+7 hari`.
* **Respons Berhasil (201 Created):**
```json
{
  "success": true,
  "message": "Peminjaman buku berhasil.",
  "data": {
    "borrowing": {
      "id": "c03df398-75c1-4b2a-8922-385c9a174dfb",
      "book_id": "BK-001",
      "user_id": 2,
      "borrow_date": "2026-10-16",
      "due_date": "2026-10-23",
      "return_date": null,
      "status": "Dipinjam",
      "is_overdue": false,
      "book": {
        "id": "BK-001",
        "title": "Algoritma & Struktur Data Lanjut",
        "author": "Rinaldi Munir",
        "status": "Dipinjam"
      }
    }
  },
  "errors": null
}
```
* **Respons Gagal Kuota Penuh (422 Unprocessable Content):**
```json
{
  "success": false,
  "message": "Peminjaman ditolak. Batas maksimal 3 buku aktif telah tercapai.",
  "data": null,
  "errors": null
}
```
* **Respons Gagal Otoritas Admin (403 Forbidden):**
```json
{
  "success": false,
  "message": "Akses ditolak (403 Forbidden). Fitur ini memiliki otoritas khusus untuk: Mahasiswa.",
  "data": null,
  "errors": null
}
```

---

### 3.5. Mengembalikan Buku (Khusus Pengurus)
* **Endpoint:** `PUT /borrowings/{id}/return`
* **Path Parameter:** `id` (UUID transaksi peminjaman)
* **Header:** `Authorization: Bearer {{admin_token}}`
* **Aturan Bisnis (BR-04):**
  - Mengubah status transaksi menjadi `Dikembalikan` dan mencatat `return_date = today()`.
  - Status buku otomatis sinkron kembali menjadi `Tersedia`.
* **Respons Berhasil (200 OK):**
```json
{
  "success": true,
  "message": "Buku berhasil dikembalikan.",
  "data": {
    "borrowing": {
      "id": "c03df398-75c1-4b2a-8922-385c9a174dfb",
      "book_id": "BK-001",
      "status": "Dikembalikan",
      "return_date": "2026-10-16",
      "is_overdue": false,
      "book": {
        "id": "BK-001",
        "status": "Tersedia"
      }
    }
  },
  "errors": null
}
```

---

### 3.6. Proteksi Hapus Buku (Khusus Pengurus)
* **Endpoint:** `DELETE /books/{id}`
* **Path Parameter:** `id` (contoh: `BK-001`)
* **Header:** `Authorization: Bearer {{admin_token}}`
* **Aturan Bisnis (BR-05):** Buku yang berstatus `Dipinjam` dilarang dihapus.
* **Respons Gagal Proteksi (422 Unprocessable Content):**
```json
{
  "success": false,
  "message": "Buku 'Algoritma & Struktur Data Lanjut' tidak dapat dihapus karena sedang dipinjam.",
  "data": null,
  "errors": null
}
```

---

### 3.7. Statistik Dashboard Perpustakaan
* **Endpoint:** `GET /dashboard/stats`
* **Header:** `Authorization: Bearer {{admin_token}}`
* **Respons Berhasil (200 OK):**
```json
{
  "success": true,
  "message": "Statistik perpustakaan.",
  "data": {
    "total_books": 5,
    "available_books": 4,
    "borrowed_books": 1,
    "overdue_count": 0
  },
  "errors": null
}
```
