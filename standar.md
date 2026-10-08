# 📘 STANDAR OPERASIONAL & PANDUAN PENGEMBANGAN (STANDAR.MD)
## Proyek: SIPERPU (Sistem Informasi Peminjaman Buku Perpustakaan)
**Arsitektur:** `Frontend :5173 → Backend :8000 via REST + Sanctum`  
**Prinsip Dokumen:** *Single Source of Truth (SSOT), Append-Only, Token-Efficient.*

---

## 1. Prompt Personalisasi AI Siap-Salin (Junior Coder)

*Salin blok teks di bawah ini sebagai pesan pertama di setiap sesi pengerjaan AI:*

```markdown
Kamu berperan sebagai "Junior Full-Stack Engineer" di bawah arahan Lead Architect.
Konteks: Proyek SIPERPU (Backend: Laravel 12 + Pest di /backend | Frontend: React 18/19 .jsx + Tailwind v3 di /frontend).

Aturan Wajib:
1. PATUHI STANDAR: Baca dan patuhi seluruh aturan di standar.md (terutama RULE-01 sampai RULE-05 dan Tabel Endpoint).
2. TULIS ASUMSI DI AWAL: Jika ada instruksi yang ambigu atau detail teknis yang belum ditentukan, tuliskan asumsimu dalam 1-3 butir di baris paling atas jawaban SEBELUM menulis kode, agar Lead Architect bisa langsung mengoreksi.
3. BATASAN TEKNOLOGI KETAT:
   - Frontend: JavaScript (.jsx), Tailwind v3, Axios. Hanya gunakan 5 dependency resmi. DILARANG menambah library/package baru tanpa izin Lead.
   - Backend: Laravel 12.x, Eloquent, Pest. DILARANG mencampur sintaks PHPUnit. DILARANG query wipe-and-reinsert table.
4. LARANGAN FITUR DI LUAR SCOPE: Kerjakan HANYA fitur yang tertera di Bagian 4 & 5. Fitur baru hanya boleh masuk jika sudah tercantum di Bagian 7 (Roadmap).
5. KODE LENGKAP: Tuliskan kode utuh pada file yang ditugaskan, bukan potongan komentar "// lanjutkan di sini".
6. PROTOKOL BUG & DEBUG: Jika menemukan kendala atau melakukan proses debugging, wajib jelaskan akar masalah (root cause), solusi penanganan, serta catat pembaruannya secara sistematis ke dalam dokumen riwayat/dokumentasi.

Konfirmasi pemahamanmu secara singkat, lalu sebutkan kamu siap menerima tugas pertama.
```

---

## 2. Stack Teknologi & Batasan Dependensi

### A. Frontend Client (`/frontend`)
* **Bahasa:** JavaScript murni (`.jsx`), **bukan TypeScript** (menghindari boilerplate berlebih pada v1).
* **Build Tool & Styling:** Vite + **Tailwind CSS v3** (wajib v3 menggunakan `tailwind.config.js`, dilarang v4).
* **Data Fetching:** Axios + Custom Hooks (TanStack Query / SWR ditiadakan pada v1).
* **Toast Notification:** `react-hot-toast`.
* **Icons:** `lucide-react`.
* **Routing:** `react-router-dom`.
* **Whitelist Dependency Resmi (Maksimal 5 Paket):**
  1. `react-router-dom`
  2. `axios`
  3. `tailwindcss` (v3.x)
  4. `lucide-react`
  5. `react-hot-toast`  
  *(Instalasi paket di luar daftar ini wajib meminta izin tertulis dari Lead).*

### B. Backend Core API (`/backend`)
* **Framework:** **Laravel 12.x** (PHP 8.2+). Terkunci pada versi mayor ini hingga proyek selesai.
* **Autentikasi:** Laravel Sanctum (Token-based authentication / Bearer Token).
* **Database:** MySQL / MariaDB (Driver PDO MySQL).
* **Testing Engine:** **Pest murni**. Dilarang mencampur sintaks PHPUnit (`$this->assert...`).

### C. Kebijakan Database Migration
* Perintah `php artisan migrate:fresh --seed` **HANYA DIIZINKAN di lingkungan lokal**. Dilarang keras dijalankan di staging dan produksi.
* File migration yang sudah di-merge ke branch `dev` / `main` **tidak boleh diedit kembali**.
* Setiap perubahan skema database wajib dilakukan melalui file migration baru.

---

## 3. Struktur Direktori Proyek

```text
perpustakaan/
│
├── README.md                      # Dokumentasi umum & cara menjalankan aplikasi
├── standar.md                     # Berkas acuan standar ini (SSOT)
│
├── backend/                       # Layanan API (Laravel 12)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # AuthController, BookController, BorrowingController
│   │   │   ├── Requests/          # Validasi FormRequest (StoreBookRequest, BorrowRequest)
│   │   │   └── Resources/         # JsonResource (BookResource, BorrowingResource)
│   │   ├── Models/                # User.php, Book.php, Borrowing.php
│   │   └── Services/              # BorrowingService.php (Transaksi pinjam & kembali)
│   ├── database/
│   │   ├── migrations/            # Skema tabel relasional
│   │   └── seeders/               # DatabaseSeeder (Akun Pengurus & Buku Awal)
│   ├── routes/
│   │   └── api.php                # Rute REST API
│   └── tests/                     # Pest Test Cases
│
└── frontend/                      # Layanan Client SPA (React + Vite)
    ├── public/                    # Aset statis
    ├── src/
    │   ├── api/                   # axiosClient.js (Konfigurasi Axios interceptor)
    │   ├── components/            # Komponen modular (Navbar, Modal, BookCard, QuotaMeter)
    │   ├── contexts/              # AuthContext.jsx
    │   ├── hooks/                 # Custom hooks (useBooks.jsx, useBorrowings.jsx)
    │   ├── pages/                 # LoginPage, CatalogPage, AdminDashboard, StudentHistory
    │   ├── routes/                # ProtectedRoute.jsx, AppRoutes.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── tailwind.config.js         # Konfigurasi Tailwind CSS v3
    └── package.json
```

---

## 4. Scope Fitur & Aturan Bisnis Wajib (Business Rules)

### A. Hak Akses & Peran (Role Rules)
* **Pengurus (Admin):** Akun dibuat **hanya melalui seeder database**.
* **Mahasiswa:** Mendaftar mandiri via `POST /api/auth/register`.
* **ROLE-GUARD:** Field `role` **dilarang dibaca dari request body** pada proses registrasi maupun update profil untuk mencegah celah *mass assignment*. Register selalu mengunci role ke `mahasiswa`.

### B. Aturan Bisnis Inti
* **RULE-01 (Batas Kuota Pinjam):** Mahasiswa maksimal memiliki **3 buku aktif** berstatus `Dipinjam`. Upaya meminjam buku ke-4 wajib ditolak dengan HTTP `422 Unprocessable Content`.
* **RULE-02 (Single-Copy & Status Biner):** 1 baris record buku mewakili 1 buku fisik. Status buku biner: `Tersedia` atau `Dipinjam` (default: `Tersedia`). Field `stock` ditiadakan. Buku berstatus `Dipinjam` tidak dapat dipinjam pengguna lain (HTTP `422`).
* **RULE-03 (Jatuh Tempo Otomatis 7 Hari):** `borrow_date` otomatis hari ini (`YYYY-MM-DD`). `due_date` otomatis dihitung tepat `borrow_date + 7 hari kalender`.
* **RULE-04 (Sinkronisasi Pengembalian):** Pengurus menandai transaksi menjadi `Dikembalikan` dengan mencatat `return_date = today()`. Status buku terkait **otomatis kembali menjadi `Tersedia`**.
* **RULE-05 (Proteksi Hapus):** Buku yang sedang berstatus `Dipinjam` **dilarang dihapus** (HTTP `422`).
* **RULE-06 (Status Keterlambatan / Overdue):** Tidak ada kolom status baru atau tabel denda. Keterlambatan dihitung dinamis melalui model accessor `is_overdue`: bernilai `true` jika `return_date === null` dan `due_date < date('Y-m-d')`.

---

## 5. Spesifikasi Kontrak REST API & Kode HTTP

### A. Standar Kode HTTP
* `200 OK` / `201 Created`: Permintaan berhasil diproses.
* `401 Unauthorized`: Belum login atau token tidak valid.
* `403 Forbidden`: Login berhasil tetapi tidak memiliki hak akses role tersebut.
* `404 Not Found`: Data ID buku / transaksi tidak ditemukan.
* `422 Unprocessable Content`: **Seluruh pelanggaran aturan bisnis** (kuota penuh, buku sedang dipinjam, buku dipinjam tidak boleh dihapus, validasi form gagal).

### B. Format Envelope JSON
```json
{
  "success": true,
  "message": "Pesan deskriptif keberhasilan atau kegagalan",
  "data": {},
  "errors": null
}
```

### C. Tabel Endpoint Resmi

| Method | Endpoint | Hak Akses | Payload Request | Response Data Utama |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Publik | `{ "username", "password" }` | `{ "token", "user": { "id", "name", "role", "nim" } }` |
| `POST` | `/api/auth/register` | Publik | `{ "name", "username", "nim", "password", "password_confirmation" }` | `{ "token", "user": { ... } }` |
| `POST` | `/api/auth/logout` | Auth | - | `message: "Berhasil keluar"` |
| `GET` | `/api/auth/me` | Auth | - | `{ "user": { ... } }` |
| `GET` | `/api/books` | Auth | Query: `?search=&category=` | `[ { "id", "title", "author", "category", "year", "status" }, ... ]` |
| `GET` | `/api/books/{id}` | Auth | - | `{ "id", "title", "author", "category", "year", "status" }` |
| `POST` | `/api/books` | Admin | `{ "title", "author", "category", "year" }` | `{ "book": { ... } }` |
| `PUT` | `/api/books/{id}` | Admin | `{ "title", "author", "category", "year" }` | `{ "book": { ... } }` |
| `DELETE`| `/api/books/{id}` | Admin | - | `message: "Buku berhasil dihapus"` |
| `POST` | `/api/borrowings/borrow` | Mahasiswa | `{ "book_id" }` | `{ "borrowing": { "id", "book_id", "borrow_date", "due_date", "status" } }` |
| `PUT` | `/api/borrowings/{id}/return` | Admin | - | `{ "borrowing": { ..., "status": "Dikembalikan", "return_date" } }` |
| `GET` | `/api/borrowings/my` | Mahasiswa | - | `[ { ..., "is_overdue": bool, "book": { ... } }, ... ]` |
| `GET` | `/api/borrowings/all` | Admin | Query: `?status=&overdue=` | `[ { ..., "is_overdue": bool, "user": { ... }, "book": { ... } }, ... ]` |
| `GET` | `/api/dashboard/stats` | Admin | - | `{ "total_books", "available_books", "borrowed_books", "overdue_count" }` |

---

## 6. Standar Koding & Pengujian

### A. Backend (Laravel)
* Gunakan `DB::transaction()` dengan `lockForUpdate()` saat peminjaman dan pengembalian untuk mencegah *race condition*.
* Gunakan FormRequest terpisah untuk validasi request payload.
* **Testing:** Seluruh pengujian wajib ditulis dengan **Pest**:
  ```php
  it('menolak peminjaman jika mahasiswa sudah meminjam 3 buku aktif', function () {
      // test logic
  });
  ```

### B. Frontend (React)
* Gunakan Custom Hook per domain: `useBooks()` untuk katalog, `useBorrowings()` untuk sirkulasi.
* Simpan token Sanctum di `localStorage` / `sessionStorage` dan pasang di header Axios Interceptor:
  ```javascript
  config.headers.Authorization = `Bearer ${token}`;
  ```
* Tampilkan umpan balik visual untuk seluruh respons API menggunakan `react-hot-toast`:
  - Sukses: `toast.success(res.data.message)`
  - Gagal (HTTP 422/401/403/404): `toast.error(err.response?.data?.message || 'Terjadi kesalahan')`

---

## 7. Roadmap (Fitur Mendatang)

*Bagian ini adalah daftar tunggu fitur di luar v1. AI dilarang mengimplementasikan fitur di bawah ini kecuali jika Lead Architect telah memindahkannya ke Bagian 4 & 5 dengan penomoran resmi.*

* [ ] **ROADMAP-01 (Multi-Copy / Tabel `book_copies`):** Mendukung banyak eksemplar per judul buku menggunakan kode barcode fisik unik (`barcode_id`).
* [ ] **ROADMAP-02 (Sistem Denda & Tarif):** Perhitungan nominal denda harian otomatis untuk transaksi `is_overdue === true`.
* [ ] **ROADMAP-03 (Ekspor Laporan PDF/Excel):** Rekap sirkulasi bulanan untuk kepala perpustakaan menggunakan `dompdf`.
* [ ] **ROADMAP-04 (Notifikasi WhatsApp / Email):** Pengingat otomatis H-1 sebelum tanggal jatuh tempo (`due_date`).

---

## 8. Template Brief Tugas per Sesi (Task Template)

*Gunakan template ini saat memberikan tugas baru ke developer atau AI:*

```markdown
### Brief Tugas: [Nama Tugas]
- **Target File:** [Sebutkan path file spesifik]
- **Peran/Layanan:** [Backend Laravel / Frontend React]
- **Aturan Terkait:** [Rujuk nomor aturan, contoh: RULE-01, RULE-03]
- **Endpoint Terkait:** [Contoh: POST /api/borrowings/borrow]
- **Ekspektasi Output:** [Penjelasan hasil yang diinginkan]
```

---

## 9. Changelog Dokumen (Append-Only)

| Versi | Tanggal | Penulis | Ringkasan Perubahan |
|---|---|---|---|
| `v1.0` | 2026-09-24 | Lead Architect | Inisialisasi awal standar monorepo Laravel 11 + React SPA. |
| `v1.1` | 2026-09-24 | Lead Architect | Restrukturisasi SSOT: Kunci Laravel 12 + Pest, batas 5 library React (Axios, Tailwind v3, react-hot-toast), status biner per buku (hapus stock), accessor `is_overdue`, HTTP 422 seragam, role guard mass assignment, template tugas, dan roadmap terpisah. |
| `v1.2` | 2026-10-07 | Full-Stack Engineer | Pembaruan koleksi Postman dinamis (`borrowing_id` auto-capture), rute web portal non-intrusif pada root port 8000, skrip peluncur 1-langkah (`dev.bat`/`run-dev.ps1`), serta standarisasi panduan pengujian acceptance criteria. |
| `v1.3` | 2026-10-08 | Lead Architect / Dev | Personalisasi protokol pengembang: Penegakan aturan pelaporan transparan dan dokumentasi wajib untuk setiap bug dan aktivitas debugging. |
