# Bagian A: Template PRD

## 1. Informasi Proyek

| Item | Isi |
| :--- | :--- |
| **Nama proyek** | **SIPERPU** (Sistem Informasi Peminjaman Buku Perpustakaan Terintegrasi) |
| **Anggota (nama dan NIM)** | 1. Hizbullah (NIM: [Isi NIM Anda])<br>2. Muhammad Rizqi Zain (2441919004)<br>3. Annisa Hasanah (2441919025)<br>4. Ananda Fitria (2441919030)<br>5. Hafizh Ashshahabah Nashiir (2441919052) |
| **Versi dan tanggal** | v0.5 (22 Oktober 2026) |
| **Link repository** | `https://github.com/H1zrim/Vibe-Coding-5-UINSI.git` |

---

## 2. Ringkasan
Backend REST API perpustakaan kampus terintegrasi yang memungkinkan mahasiswa mencari katalog buku, meminjam buku secara mandiri, dan melihat riwayat peminjaman, serta memfasilitasi pengurus perpustakaan dalam mengelola master buku, memantau statistik, dan memproses pengembalian buku fisik. Seluruh data transaksi tersimpan persisten secara relasional di basis data MySQL (`siperpu_db`) dengan autentikasi berbasis Bearer Token (Laravel Sanctum). Semua endpoint terverifikasi dan lulus 100% pengujian fungsional dan aturan bisnis menggunakan automated test Pest dan Postman Collection dinamis.

---

## 3. Tujuan
* Berevolusi dari arsitektur prototype/microservices terpisah menjadi satu **Backend REST API terpadu (Laravel 12.x)** yang terhubung langsung ke database relasional **MySQL (`siperpu_db`)**.
* Mengotomatiskan dan menegakkan aturan bisnis sirkulasi: pembatasan kuota maksimal 3 buku aktif, pencegahan peminjaman ganda (*race condition guard* via `lockForUpdate`), dan kalkulasi otomatis jatuh tempo 7 hari kalender.
* Menerapkan sistem autentikasi gerbang tunggal (*Single Auth Gateway*) dengan pemisahan hak akses ketat (*Role-Based Access Control*) antara **Mahasiswa** dan **Pengurus (Admin)**.
* Menyediakan dokumentasi kontrak API formal di `docs/API-CONTRACT.md` serta bukti pengujian menyeluruh di `api-test/collection.json`.
* Menyediakan peluncur fullstack praktis (`dev.bat` dan `run-dev.ps1`) serta portal gateway pengembang non-intrusif pada root port 8000.

---

## 4. Pengguna dan Peran

| Peran | Apa yang bisa dilakukan |
| :--- | :--- |
| **Mahasiswa** | Registrasi akun mandiri, login ke sistem, mencari dan melihat detail buku yang tersedia, meminjam buku (maksimal 3 buku aktif), serta memantau riwayat peminjaman dan status keterlambatan (*overdue*). |
| **Pengurus (Admin)** | Login menggunakan kredensial terproteksi, mengelola master katalog buku (tambah, edit, hapus buku yang tidak sedang dipinjam), memproses pengembalian buku fisik (otomatis mengembalikan status buku menjadi *Tersedia*), melihat log seluruh transaksi sirkulasi, dan memantau statistik dashboard perpustakaan. |

---

## 5. Ruang Lingkup

### Dikerjakan (*In-Scope*):
* **Autentikasi & Otorisasi:** Registrasi mahasiswa, login terpadu via Laravel Sanctum (Bearer Token), proteksi role middleware (`role:pengurus` vs `role:mahasiswa`), dan pencegahan *mass-assignment* hak akses (*Role-Guard*).
* **Katalog Buku:** Pencarian judul/penulis, filter kategori, detail informasi buku, dan status ketersediaan biner (*Tersedia* / *Dipinjam*).
* **Transaksi Sirkulasi:** Peminjaman buku dengan *atomic database locking*, kalkulasi otomatis batas kembali 7 hari, pengembalian buku dengan sinkronisasi status otomatis, dan kalkulasi dinamis keterlambatan (*is_overdue*).
* **Database & Pengujian:** Skema migrasi MySQL, seeder akun bawaan & data buku, API Contract terstruktur, pengujian otomatis via Pest (12 test passed), dan Postman Collection dinamis dengan auto-capture `borrowing_id`.
* **Developer Experience:** Script peluncur fullstack 1-klik (`dev.bat`/`run-dev.ps1`) dan portal developer visual pada `http://127.0.0.1:8000/`.

### Tidak dikerjakan (*Out-of-Scope*):
* Membuat banyak server port/microservices terpisah (disatukan menjadi 1 backend API monolitik modular).
* Fitur denda finansial otomatis, payment gateway, dan notifikasi SMS/WhatsApp gateway (dialihkan ke Roadmap v2).
* Pelacakan multi-eksemplar barcode fisik per judul buku (di v1 diasumsikan 1 record = 1 buku fisik).

---

## 6. Technology Stack

| Komponen | Pilihan Kelompok | Alasan Singkat |
| :--- | :--- | :--- |
| **Backend / Framework** | **Laravel 12.x (PHP 8.2+)** | Framework MVC/API modern yang stabil, memiliki ORM Eloquent yang kuat, ekosistem Sanctum untuk token API, serta fitur Database Transaction bawaan yang aman. |
| **Database (Wajib Relasional)** | **MySQL / MariaDB (`siperpu_db`)** | Database RDBMS standar industri yang mendukung integritas referensial (Foreign Key), indeks performa, dan penguncian baris data (`lockForUpdate`). |
| **Format API** | **HTTP / JSON** | Sesuai ketentuan tugas; format envelope terstandarisasi (`success`, `message`, `data`, `errors`). |
| **Alat Uji API** | **Postman & Pest PHP** | Postman untuk pengujian manual via file JSON collection dinamis; Pest untuk pengujian otomatis (*automated testing unit & feature*). |
| **AI Assistant yang Dipakai** | **Claude & Gemini (via Antigravity / Cursor)** | Membantu analisis struktur folder, refactor arsitektur, generate boilerplate migration/controller, dan penulisan test suite otomatis. |

---

## 7. Kebutuhan Fungsional

* **FR-01: Login Pengguna**
  * Pengguna (Pengurus maupun Mahasiswa) login menggunakan username dan password yang tersimpan di MySQL.
  * *Kriteria Penerimaan:* Kredensial valid menghasilkan HTTP 200 dan Bearer Token Sanctum; kredensial salah mengembalikan HTTP 401 Unauthorized.
* **FR-02: Registrasi Mahasiswa (Role-Guard)**
  * Mahasiswa dapat mendaftarkan akun baru secara mandiri.
  * *Kriteria Penerimaan:* Input valid menghasilkan HTTP 201 dan otomatis menerbitkan token; field `role` dari body diabaikan dan dikunci mutlak ke `mahasiswa` (anti-*privilege escalation*).
* **FR-03: Melihat Daftar dan Detail Buku**
  * Pengguna dapat melihat daftar buku, memfilter berdasarkan kategori, dan mencari berdasarkan judul/penulis/ID.
  * *Kriteria Penerimaan:* Mengembalikan array buku beserta status ketersediaannya (HTTP 200); ID yang tidak ditemukan mengembalikan HTTP 404 Not Found.
* **FR-04: Meminjam Buku (Khusus Mahasiswa)**
  * Mahasiswa dapat meminjam buku yang berstatus "Tersedia".
  * *Kriteria Penerimaan:* Peminjaman sukses mengembalikan HTTP 201, mengubah status buku menjadi "Dipinjam", dan menetapkan jatuh tempo 7 hari ke depan. Ditolak jika kuota penuh atau buku sedang dipinjam (HTTP 422). Admin yang mencoba meminjam ditolak (HTTP 403).
* **FR-05: Mengembalikan Buku (Khusus Pengurus)**
  * Pengurus memproses pengembalian buku berdasarkan ID transaksi.
  * *Kriteria Penerimaan:* Mengembalikan HTTP 200, mencatat tanggal kembali hari ini, dan secara otomatis mengembalikan status buku menjadi "Tersedia". Mahasiswa yang mencoba mengembalikan ditolak (HTTP 403).
* **FR-06: Manajemen Katalog Buku (Khusus Pengurus)**
  * Pengurus dapat menambah, mengubah, dan menghapus buku.
  * *Kriteria Penerimaan:* Buku yang sedang berstatus "Dipinjam" dilarang dihapus (mengembalikan HTTP 422). Mahasiswa dilarang mengelola buku (HTTP 403).

---

## 8. Business Rule

| ID | Aturan |
| :--- | :--- |
| **BR-01** | **Batas Maksimal Kuota:** Satu mahasiswa maksimal memiliki **3 buku aktif** yang sedang dipinjam dan belum dikembalikan. Peminjaman ke-4 wajib ditolak dengan HTTP 422. |
| **BR-02** | **Kunci Ketersediaan (*Single-Copy Guard*):** Buku yang berstatus `Dipinjam` tidak dapat dipinjam oleh mahasiswa lain (HTTP 422). Transaksi menggunakan `lockForUpdate()` untuk mencegah *race condition*. |
| **BR-03** | **Durasi Jatuh Tempo:** Tanggal jatuh tempo ditetapkan secara otomatis tepat **7 hari kalender** sejak tanggal peminjaman dibuat (`borrow_date + 7 hari`). |
| **BR-04** | **Sinkronisasi Pengembalian:** Ketika transaksi ditandai `Dikembalikan`, status buku terkait wajib secara atomik berubah kembali menjadi `Tersedia`. |
| **BR-05** | **Proteksi Hapus:** Buku yang sedang berada dalam masa peminjaman aktif dilarang dihapus dari basis data (HTTP 422). |
| **BR-06** | **Status Keterlambatan (*Overdue*):** Dihitung secara dinamis melalui model accessor: bernilai `true` jika transaksi berstatus `Dipinjam`, `return_date` bernilai null, dan tanggal hari ini melewati `due_date`. |

---

## 9. Model Data

```text
┌──────────────────┐          ┌────────────────────────┐          ┌──────────────────┐
│      users       │          │       borrowings       │          │      books       │
├──────────────────┤          ├────────────────────────┤          ├──────────────────┤
│ id (PK, BigInt)  │1        *│ id (PK, UUID String)   │*        1│ id (PK, BK-001)  │
│ username (UQ)    ├──────────┤ user_id (FK, BigInt)   ├──────────┤ title (String)   │
│ password (Hash)  │          │ book_id (FK, String)   │          │ author (String)  │
│ name (String)    │          │ borrow_date (Date)     │          │ category (String)│
│ role (enum)      │          │ due_date (Date)        │          │ year (Int)       │
│ nim (Nullable)   │          │ return_date (Nullable) │          │ status (enum)    │
└──────────────────┘          │ status (enum)          │          └──────────────────┘
                              └────────────────────────┘
```

| Tabel | Kolom Utama | Tipe Data & Keterangan | Relasi |
| :--- | :--- | :--- | :--- |
| **`users`** | `id`, `name`, `username`, `email`, `nim`, `password`, `role` | `id` (BigInt PK), `role` (`pengurus`, `mahasiswa`) | `hasMany(Borrowing)` |
| **`books`** | `id`, `title`, `author`, `category`, `year`, `status` | `id` (String PK, misal `BK-001`), `status` (`Tersedia`, `Dipinjam`) | `hasMany(Borrowing)` |
| **`borrowings`** | `id`, `book_id`, `user_id`, `borrow_date`, `due_date`, `return_date`, `status` | `id` (UUID PK String), `status` (`Dipinjam`, `Dikembalikan`) | `belongsTo(User)`, `belongsTo(Book)` |

---

## 10. Rancangan API Endpoint

*Base URL:* `http://localhost:8000/api`

| Layanan | Method | Endpoint | Fungsi | Perlu Login? | Otoritas Role |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **System** | `GET` | `/api/health` | Pemeriksaan kesehatan layanan & koneksi DB | Tidak | Publik |
| **Auth** | `POST` | `/api/auth/login` | Login pengguna (Admin & Mahasiswa) | Tidak | Publik |
| **Auth** | `POST` | `/api/auth/register`| Registrasi akun mahasiswa baru | Tidak | Publik (Auto Mahasiswa) |
| **Auth** | `GET` | `/api/auth/me` | Memeriksa sesi dan data akun aktif | **Ya** | Semua Role |
| **Auth** | `POST` | `/api/auth/logout` | Revoke token dan keluar dari sistem | **Ya** | Semua Role |
| **Books** | `GET` | `/api/books` | Mengambil katalog (filter & cari) | **Ya** | Semua Role |
| **Books** | `GET` | `/api/books/{id}` | Mengambil informasi detail satu buku | **Ya** | Semua Role |
| **Books** | `POST` | `/api/books` | Menambah data buku baru ke katalog | **Ya** | **Pengurus Only** |
| **Books** | `PUT` | `/api/books/{id}` | Memperbarui informasi buku | **Ya** | **Pengurus Only** |
| **Books** | `DELETE`| `/api/books/{id}` | Menghapus buku dari sistem | **Ya** | **Pengurus Only** |
| **Borrowings**| `POST` | `/api/borrowings/borrow` | Melakukan peminjaman buku | **Ya** | **Mahasiswa Only** |
| **Borrowings**| `GET` | `/api/borrowings/my` | Melihat riwayat peminjaman pribadi | **Ya** | **Mahasiswa Only** |
| **Borrowings**| `PUT` | `/api/borrowings/{id}/return` | Memproses pengembalian buku | **Ya** | **Pengurus Only** |
| **Borrowings**| `GET` | `/api/borrowings/all` | Log sirkulasi semua transaksi | **Ya** | **Pengurus Only** |
| **Stats** | `GET` | `/api/dashboard/stats` | Ringkasan statistik & keterlambatan | **Ya** | **Pengurus Only** |

---

## 11. Rencana Pengujian API

| ID | Skenario | Hasil yang Diharapkan | Status |
| :---: | :--- | :--- | :---: |
| **T-01** | Login dengan akun valid (`admin` / `123`) | Mengembalikan status 200, user data, dan Sanctum token Bearer. | **LULUS** |
| **T-02** | Login dengan password salah | Mengembalikan status 401 Unauthorized dengan pesan kesalahan envelope. | **LULUS** |
| **T-03** | Lihat daftar dan detail buku | Mengembalikan status 200 dan data array buku; ID fiktif mengembalikan 404. | **LULUS** |
| **T-04** | Pinjam buku yang berstatus "Tersedia" | Mengembalikan status 201 Created; status buku berubah menjadi "Dipinjam"; due date terhitung +7 hari; ID transaksi otomatis tersimpan ke `{{borrowing_id}}`. | **LULUS** |
| **T-05** | Pinjam buku yang statusnya "Dipinjam" | Ditolak dengan status 422 Unprocessable Content (*"Buku sedang dipinjam..."*). | **LULUS** |
| **T-06** | Pinjam buku ke-4 (melebihi batas 3) | Ditolak dengan status 422 Unprocessable Content (*"Batas maksimal 3 buku tercapai..."*). | **LULUS** |
| **T-07** | Kembalikan buku (oleh Pengurus via `{{borrowing_id}}`) | Mengembalikan status 200; `return_date` tercatat hari ini; status buku kembali "Tersedia" (tanpa 404). | **LULUS** |
| **T-08** | Cek siklus status ketersediaan | Terverifikasi: Buku `Tersedia` $\rightarrow$ dipinjam $\rightarrow$ `Dipinjam` $\rightarrow$ dikembalikan $\rightarrow$ kembali `Tersedia`. | **LULUS** |
| **T-09** | Mahasiswa mencoba menambah/hapus buku | Ditolak dengan status 403 Forbidden (*"Otoritas khusus Pengurus"*). | **LULUS** |
| **T-10** | Pengurus mencoba menghapus buku yang dipinjam | Ditolak dengan status 422 Unprocessable Content (Proteksi BR-05). | **LULUS** |
| **T-11** | Pengurus mencoba meminjam buku | Ditolak dengan status 403 Forbidden (*"Otoritas khusus Mahasiswa"*). | **LULUS** |
| **T-12** | Request tanpa token pada endpoint privat | Ditolak dengan status 401 Unauthorized (*"Autentikasi diperlukan"*). | **LULUS** |

---

## 12. Rencana Penggunaan AI

*Pola kerja:* **Requirement/Context $\rightarrow$ Prompt $\rightarrow$ Output AI $\rightarrow$ Review manusia $\rightarrow$ Testing $\rightarrow$ Iterasi.**

| No | Pekerjaan | Context yang Diberikan ke AI | Prompt Disimpan di | Hasil Review |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Audit Kode & Deteksi Anti-Pattern** | Struktur repositori lama (`perpustakaan-microservices`, SQLite, PHP Native). | `DOKUMENTASI_PROMPT.md` (Prompt 6) | Ditemukan anti-pattern fatal pada method `replaceData()` di SQLite yang menghapus seluruh isi tabel pada setiap peminjaman. Diputuskan refactor total ke Laravel + MySQL. |
| 2 | **Penyusunan Kontrak Standar & Aturan Bisnis** | Keputusan pemilihan stack Laravel 12 + React JSX dan batasan 5 library. | `standar.md` & `DOKUMENTASI_PROMPT.md` (Prompt 7-9) | Dihasilkan dokumen `standar.md` yang memuat prompt personalisasi peran Junior Coder, aturan BR-01 s/d BR-06, dan format envelope API seragam. |
| 3 | **Implementasi Backend & Single Auth Gateway** | Spesifikasi kontrak endpoint, migration schema MySQL, dan Laravel Sanctum. | `DOKUMENTASI_PROMPT.md` (Prompt 10-12) | AI membangun Controller, Model, Seeder, dan Middleware `EnsureRole`. Divalidasi oleh manusia dengan menambahkan database locking `lockForUpdate()` agar tidak terjadi *double booking*. |
| 4 | **Pembersihan Repositori & Pembuatan Alat Uji** | Perintah eliminasi file di luar framework dan instruksi Postman. | `DOKUMENTASI_PROMPT.md` (Prompt 13-14) | AI menghapus 8 folder/file legacy non-framework dan menyusun `siperpu_postman_collection.json` dengan skrip otomatis penyimpanan token. |
| 5 | **Streamline Fullstack & Dynamic Postman Collection** | Kendala 404 pada root port 8000, penonaktifan auto-redirect, dan error 404 pada return borrowing. | `DOKUMENTASI_PROMPT.md` (Prompt 15-19) | AI menambahkan portal developer web non-intrusif pada `/`, menyusun script peluncur `dev.bat`/`run-dev.ps1`, mengotomatisasi penangkapan `borrowing_id` pada Postman, serta menyinkronkan branch `siperpu-v0.5` dan `main`. |

---

## 13. Rencana Implementasi

| No | Tugas | Penanggung Jawab | Target Hari ke- | Selesai? |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Analisis arsitektur, pembersihan file legacy, dan inisialisasi monorepo Laravel 12 & MySQL | Dev Backend / Lead | Hari 1–2 | **Selesai** |
| 2 | Pembuatan skema database migration (`users`, `books`, `borrowings`) dan database seeder | Dev Backend | Hari 2–3 | **Selesai** |
| 3 | Implementasi Single Gateway Auth (Sanctum) dan Middleware Otoritas Peran (`EnsureRole`) | Dev Backend | Hari 3–4 | **Selesai** |
| 4 | Implementasi controller sirkulasi dan penegakan Business Rule (BR-01 s/d BR-06) | Dev Backend | Hari 4–5 | **Selesai** |
| 5 | Pembuatan suite automated test (Pest: 12 test passed) dan verifikasi seluruh kriteria penerimaan | QA / Tester | Hari 5–6 | **Selesai** |
| 6 | Pembuatan Postman Collection dinamis (`collection.json`), penyusunan API Contract, dan dokumentasi PRD | Seluruh Tim | Hari 6–7 | **Selesai** |
| 7 | Penerapan peluncur fullstack 1-klik (`dev.bat`) dan sinkronisasi branch `siperpu-v0.5` | Seluruh Tim | Hari 7 | **Selesai** |

---

## 14. Definition of Done

Sebuah tugas/fitur dianggap selesai (*Done*) jika:
* Semua kriteria penerimaan (FR-01 sampai FR-06) terpenuhi tanpa pengecualian.
* Telah diuji secara tuntas di Postman dan Pest PHP, mencakup uji skenario sukses (*positive case*) dan skenario penolakan/gagal (*negative case*).
* Seluruh kode hasil bantuan AI telah direview oleh anggota tim untuk memastikan tidak ada *anti-pattern* dan mematuhi standar PSR-12.
* Dokumentasi resmi (`docs/API-CONTRACT.md`, `README.md`, `DOKUMENTASI_PROMPT.md`, `standar.md`, dan `docs/PRD.md`) telah diperbarui dan disinkronkan ke repositori GitHub.

---

## 15. Risiko dan Pertanyaan Terbuka

| Risiko / Pertanyaan | Rencana Penanganan |
| :--- | :--- |
| **Risiko *Race Condition* pada buku populer:** Dua mahasiswa meminjam 1 eksemplar buku yang sama secara bersamaan. | **Penanganan:** Menggunakan `DB::transaction()` yang dipadukan dengan klausul kueri `lockForUpdate()` pada model Book di Laravel sehingga transaksi kedua otomatis menunggu atau ditolak jika status sudah berubah. |
| **Risiko pembengkakan ketergantungan paket (*dependency bloat*):** AI menambahkan library pihak ketiga yang tidak perlu. | **Penanganan:** Menerapkan daftar whitelist ketat di `standar.md` (hanya 5 library resmi frontend) dan melarang penambahan package baru tanpa persetujuan tim. |
| **Pertanyaan seputar penanganan denda keterlambatan di v1:** Apakah perlu membuat tabel denda dan cron job harian? | **Penanganan:** Sesuai kesepakatan scope UTS, denda dinonaktifkan di v1. Keterlambatan cukup ditandai melalui accessor dinamis `is_overdue` untuk menghemat kompleksitas server. |
| **Risiko ketidaksesuaian ID pada pengujian Postman:** ID transaksi bersifat dinamis (UUID) sehingga pengujian pengembalian rentan error 404. | **Penanganan:** Menanamkan test script di Postman pada request peminjaman untuk otomatis mengekstrak UUID dan menyimpannya ke variabel `{{borrowing_id}}`. |
