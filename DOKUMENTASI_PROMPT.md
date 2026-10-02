# 📝 DOKUMENTASI PROMPT AI & CATATAN PERUBAHAN SISTEM
## Proyek: SIPERPU (Sistem Informasi Peminjaman Buku Perpustakaan)
**Repositori:** `https://github.com/H1zrim/Vibe-Coding-5-UINSI.git`  
**Dokumen:** Kronologi Prompt AI, Keputusan Arsitektur, dan Rekap Perubahan Menyeluruh

---

## DAFTAR ISI
1. [Latar Belakang & Tujuan Dokumentasi](#1-latar-belakang--tujuan-dokumentasi)
2. [Kronologi Prompt AI yang Digunakan](#2-kronologi-prompt-ai-yang-digunakan)
   - [Fase 1: Prototipe Monolitik Client-Side](#fase-1-prototipe-monolitik-client-side)
   - [Fase 2: Eksperimen Microservices & PHP Native (Transisi)](#fase-2-eksperimen-microservices--php-native-transisi)
   - [Fase 3: Audit Kritis & Perancangan Arsitektur Standar](#fase-3-audit-kritis--perancangan-arsitektur-standar)
   - [Fase 4: Restrukturisasi, Pembersihan Non-Framework & Eksekusi Final](#fase-4-restrukturisasi-pembersihan-non-framework--eksekusi-final)
3. [Rekap Menyeluruh Perubahan Sistem (Changelog)](#3-rekap-menyeluruh-perubahan-sistem-changelog)
   - [A. Eliminasi File & Direktori Non-Framework](#a-eliminasi-file--direktori-non-framework)
   - [B. Migrasi Mesin Basis Data (SQLite/JSON ke MySQL)](#b-migrasi-mesin-basis-data-sqlitejson-ke-mysql)
   - [C. Gerbang Autentikasi Tunggal & Otoritas Peran](#c-gerbang-autentikasi-tunggal--otoritas-peran)
   - [D. Penegakan 6 Aturan Bisnis Inti](#d-penegakan-6-aturan-bisnis-inti)
   - [E. Desain Ulang Frontend Client (React + Vite)](#e-desain-ulang-frontend-client-react--vite)
   - [F. Pengujian Otomatis & Alat Bantu Postman](#f-pengujian-otomatis--alat-bantu-postman)
4. [Kesimpulan Evaluasi & Kesiapan Sistem](#4-kesimpulan-evaluasi--kesiapan-sistem)

---

## 1. Latar Belakang & Tujuan Dokumentasi

Dokumen ini disusun sebagai catatan pertanggungjawaban teknis (*technical audit trail*) atas seluruh interaksi rekayasa prompt (*prompt engineering*) dan evolusi kode sumber pada proyek SIPERPU. 

Dokumentasi ini mencatat:
1. **Instruksi Asli Pengguna (Prompt Human-to-AI):** Bagaimana arahan diberikan di setiap fase pengembangan.
2. **Keputusan Arsitektur yang Diambil:** Alasan teknis di balik setiap perubahan besar.
3. **Rekapitulasi Apa yang Dirubah:** Perbandingan komparatif sebelum dan sesudah restrukturisasi.

---

## 2. Kronologi Prompt AI yang Digunakan

### Fase 1: Prototipe Monolitik Client-Side
Pada tahap awal, sistem dibangun sebagai prototipe cepat berbasis peramban (*client-side only*) tanpa backend:

> **Prompt 1 (Inisialisasi Prototipe):**  
> *"Implementasikan prototipe 'Sistem Peminjaman Buku Perpustakaan' menggunakan HTML5, CSS3, Vanilla JavaScript, dan browser localStorage. Sediakan role Pengurus (Admin) dan Mahasiswa. Terapkan aturan batas pinjam maksimal 3 buku aktif, durasi pinjam otomatis 7 hari, dan validasi ketersediaan buku."*

---

### Fase 2: Eksperimen Microservices & PHP Native (Transisi)
Pada tahap ini, dilakukan percobaan memecah aplikasi menjadi microservice dan beralih ke PHP Native MVC:

> **Prompt 2 (Eksperimen Microservices Node.js):**  
> *"Bantu saya merestrukturisasi proyek monolitik HTML/CSS/JS menjadi arsitektur berorientasi layanan (Microservices) minimal 2-3 service berbasis Node.js/Express dan komunikasi REST API JSON."*

> **Prompt 3 (Refactor ke PHP Native MVC):**  
> *"Rapikan arsitektur SIPERPU agar tidak ada redundansi, gunakan PHP Native pada seluruh lini termasuk frontend, dan sediakan tempat serta template agar microservice baru mudah dikembangkan dan di-merge."*

> **Prompt 4 (Database Portable & SQLite):**  
> *"Gunakan database portable yang mudah dijalankan setelah project dibuka dari GitHub. Pertahankan model dan aturan bisnis yang ada, tambahkan migrasi tabel serta seed data otomatis."*

> **Prompt 5 (Eksperimen Google Login):**  
> *"Tambahkan login melalui akun Google pada tampilan login utama. Gunakan Google Identity Services, validasi credential di backend, buat akun mahasiswa berdasarkan email Google yang terverifikasi, dan sediakan fallback jika Client ID belum dikonfigurasi."*

---

### Fase 3: Audit Kritis & Perancangan Arsitektur Standar
Pada fase ini, dilakukan evaluasi mendalam terhadap tumpang tindih kode yang dihasilkan dari fase-fase sebelumnya, serta penentuan arah arsitektur final:

> **Prompt 6 (Audit Kondisi Kode):**  
> *"analisis seberapa berantakan struktur web kita lalu seberapa tidak efektif teknologi yang digunakan"*
> 
> *Temuan Kritis AI:* Terjadi "krisis identitas arsitektur" di mana sisa Node.js microservices bercampur dengan PHP Native dan SQLite. Yang paling fatal, SQLite diperlakukan seperti file JSON dengan anti-pattern `replaceData()` (seluruh tabel di-`DELETE` lalu di-`INSERT` ulang setiap kali ada 1 transaksi).

> **Prompt 7 (Keputusan Stack: React + Laravel):**  
> *"oke kita persiapkan sebuah scope aku akan membagi jadi dua frontend dan backend untuk 2 tim saya, frontend saya kasih framework react.js dan backend laravel. lalu teknologi apa yang cocok jika untuk web perpustakaan"*

> **Prompt 8 (Penyusunan Berkas Standar & Persona AI):**  
> *"kita bikin standar.md untuk mulai dari struktur, prompt awal untuk personalisasi ai sebagai junior code, lalu scope yang dipakai berdasarkan laporan"*

> **Prompt 9 (10 Keputusan Arsitektur Strategis Lead Architect):**  
> *"1. Stack frontend pakai JavaScript (.jsx), bukan TypeScript. Axios saja dan buang TanStack Query dari v1. Pakai Tailwind v3. Daftar dependency cukup lima: react-router-dom, axios, tailwindcss v3, lucide-react, dan react-hot-toast.*  
> *2. Backend kunci satu versi mayor: Laravel 12.x dengan PHP 8.2+. Testing wajib Pest murni.*  
> *3. Kebijakan migration: migrate:fresh --seed hanya di lokal, dilarang di staging/produksi.*  
> *4. Status per buku biner (Tersedia/Dipinjam) dan hapus field stock.*  
> *5. Role: Admin hanya lewat seeder, /register selalu Mahasiswa, cegah mass assignment role.*  
> *6. Keterlambatan: status turunan via model accessor is_overdue, tanpa tabel denda/cron.*  
> *7. Kode HTTP: 422 untuk semua pelanggaran aturan bisnis.*  
> *8. Aturan ambigu: tulis asumsi di awal jawaban sebelum menulis kode.*  
> *9. Larangan fitur: buat bagian Roadmap terpisah.*  
> *10. Satu file standar.md append-only dengan 3 lapisan: prompt ringkas, SSOT aturan, dan template tugas."*

---

### Fase 4: Restrukturisasi, Pembersihan Non-Framework & Eksekusi Final
Fase penerapan fisik standar ke dalam kode nyata, pengujian, dan penataan Git:

> **Prompt 10 (Pemeriksaan Kesiapan Database & Auth):**  
> *"apakah database sudah mysql, dan apakah gerbang auth sudah 1 jalur saja agar dapat menjalankan semua fungsi >"*

> **Prompt 11 (Perintah Eksekusi Penuh):**  
> *"eksekusi seluruhnya"*

> **Prompt 12 (Penguatan Otoritas Role & Panduan Postman):**  
> *"eksekusi ulang seluruhnya dimulai analisis folder hingga penerapan prompt terbaru, tak lupa api yang punya otoritas setiap auth apakah itu mahasiswa atau pengurus lalu intruksi api agar memudahkan dalam pemahaman penggunaan postman"*

> **Prompt 13 (Pembersihan File Non-Framework & Git Push):**  
> *"lakukan pembersihan terhadap file yang tidak digunakan dan diluar framework, setelah itu lakukan push ke https://github.com/H1zrim/Vibe-Coding-5-UINSI.git pada branch main dan siperpu-v0.4, dan digithub juga tidak ada file yang diluar framework"*

> **Prompt 14 (Dokumentasi Prompt & Changelog):**  
> *"ada yang lupa mengenai dokumentasi prompt kita dan apa yang dirubah, lalu push satu file dokumentasi itu saja"*

---

## 3. Rekap Menyeluruh Perubahan Sistem (Changelog)

### A. Eliminasi File & Direktori Non-Framework
Untuk memastikan repositori bersih dan hanya menyisakan kode resmi framework, 8 direktori dan file legacy telah dihapus permanen:

| Path yang Dihapus | Alasan Penghapusan |
|---|---|
| `app/` | Monolith PHP Native lama yang tidak lagi dipakai. |
| `assets/` | File CSS dan JS statis lama milik antarmuka PHP Native. |
| `database/schema.sql` | Skema SQLite manual yang digantikan migration Laravel. |
| `docs/` | Dokumentasi parsial lama yang digabungkan ke root documentation. |
| `index.php` | Front controller lama di root web server Apache. |
| `perpustakaan-microservices/` | Bangkai eksperimen 3 service Node.js Express. |
| `services/` | Template dummy microservice PHP yang tidak terintegrasi. |
| `storage/siperpu.sqlite` & `data.json` | File database lama yang berisiko terekspos di root. |

**Struktur yang tersisa saat ini:** Murni hanya direktori `/backend` (Laravel 12), `/frontend` (React + Vite), serta file dokumentasi root (`.gitignore`, `README.md`, `standar.md`, `siperpu_postman_collection.json`, `DOKUMENTASI_PROMPT.md`).

---

### B. Migrasi Mesin Basis Data (SQLite/JSON ke MySQL)
* **Sebelumnya:** Menggunakan file SQLite lokal dengan anti-pattern penghapusan total tabel (`DELETE FROM borrowings`, `DELETE FROM books`, `DELETE FROM users`) lalu melakukan insert ulang pada setiap kali transaksi dijalankan.
* **Sesudahnya:** Migrasi penuh ke **MySQL RDBMS (`siperpu_db`)** via port 3306 (XAMPP).
  * Kueri menggunakan **Eloquent ORM** standar.
  * Transaksi peminjaman dan pengembalian dibungkus dalam `DB::transaction()` atomik dengan mekanisme `lockForUpdate()` untuk mencegah *race condition* (peminjaman ganda pada detik yang sama).

---

### C. Gerbang Autentikasi Tunggal & Otoritas Peran
* **Sebelumnya:** Login terpecah menjadi session PHP biasa, Google Identity Services callback, dan token JWT terpisah di folder microservices.
* **Sesudahnya:** **Single Auth Gateway via Laravel Sanctum**:
  1. Satu pintu masuk: `POST /api/auth/login` (Admin & Mahasiswa).
  2. Menerbitkan **Sanctum Personal Access Token (Bearer Token)**.
  3. Pendaftaran mahasiswa via `POST /api/auth/register` dilengkapi **ROLE-GUARD** (role dikunci mutlak ke `mahasiswa`, input role dari body request diabaikan untuk mencegah *privilege escalation*).
  4. Middleware Otoritas Peran (`EnsureRole`):
     * Endpoint Pengurus diproteksi `role:pengurus` $\rightarrow$ Mahasiswa ditolak dengan **HTTP 403 Forbidden**.
     * Endpoint Mahasiswa diproteksi `role:mahasiswa` $\rightarrow$ Admin ditolak dengan **HTTP 403 Forbidden**.

---

### D. Penegakan 6 Aturan Bisnis Inti
Seluruh aturan bisnis telah diotomatisasi di level backend:

1. **RULE-01 (Batas Kuota 3 Buku):** Mahasiswa maksimal memiliki 3 buku aktif berstatus `Dipinjam`. Upaya meminjam buku ke-4 ditolak dengan HTTP `422 Unprocessable Content`.
2. **RULE-02 (Single-Copy Guard):** 1 baris buku = 1 buku fisik. Status biner `Tersedia` atau `Dipinjam`. Buku yang sedang dipinjam terkunci otomatis dan tidak bisa dipinjam orang lain (HTTP `422`). Field `stock` dihapus.
3. **RULE-03 (Jatuh Tempo Otomatis 7 Hari):** Tanggal pinjam otomatis hari ini (`YYYY-MM-DD`) dan tanggal jatuh tempo dihitung tepat `borrow_date + 7 hari kalender`.
4. **RULE-04 (Sinkronisasi Pengembalian Otomatis):** Pengurus memproses pengembalian $\rightarrow$ status transaksi menjadi `Dikembalikan`, `return_date` tercatat hari ini, dan status buku terkait otomatis kembali menjadi `Tersedia`.
5. **RULE-05 (Proteksi Hapus Buku):** Buku yang berstatus `Dipinjam` dilarang dihapus dari katalog (HTTP `422`).
6. **RULE-06 (Status Keterlambatan / Overdue):** Dihitung dinamis menggunakan Model Accessor `is_overdue` (`true` jika belum dikembalikan dan melewati due date) tanpa biaya tabel denda atau cron job di v1.

---

### E. Desain Ulang Frontend Client (React + Vite)
* **Framework:** React 18/19 SPA dibundel dengan Vite 6 (JavaScript `.jsx`).
* **Styling:** Tailwind CSS v3 (menggunakan `tailwind.config.js`).
* **5 Dependensi Resmi:**
  1. `react-router-dom`: Navigasi dan rute terproteksi (`ProtectedRoute`).
  2. `axios`: Client terpusat di `axiosClient.js` dengan request interceptor otomatis `Authorization: Bearer <token>`.
  3. `tailwindcss` (v3): Styling modern.
  4. `lucide-react`: Ikonografi antarmuka.
  5. `react-hot-toast`: Notifikasi umpan balik sukses/gagal.
* **Fitur UI:**
  * Tombol 1-klik simulasi akun demo di halaman login (`admin`, `mhs1`, `mhs2`).
  * Meteran kuota dinamis (`QuotaMeter`) dengan indikator warna (hijau $\rightarrow$ kuning $\rightarrow$ merah).
  * Modal konfirmasi pinjam dengan rincian jadwal otomatis (+7 hari).
  * Panel Pengurus dengan ringkasan statistik koleksi, ketersediaan, dan keterlambatan.

---

### F. Pengujian Otomatis & Alat Bantu Postman
1. **Pengujian Otomatis (Pest):** 12 unit & feature test cases telah dibuat di `backend/tests/` dan **100% Lulus (41 assertions)** mencakup seluruh aturan bisnis, validasi envelope, dan otorisasi role.
2. **Postman Collection (`siperpu_postman_collection.json`):** Berkas koleksi JSON siap impor yang dilengkapi skrip otomatis penyimpanan token ke variabel `{{admin_token}}` dan `{{student_token}}`, sehingga pengujian manual dapat dilakukan tanpa menyalin token berulang kali.

---

## 4. Kesimpulan Evaluasi & Kesiapan Sistem

Dengan diselesaikannya seluruh rangkaian prompt di atas:
* **Integritas Arsitektur:** Telah memenuhi kaidah *Clean Architecture* dan *Separation of Concerns*.
* **Kolaborasi Tim:** Tim Frontend (`/frontend`) dan Tim Backend (`/backend`) dapat bekerja secara paralel dan mandiri.
* **Kebersihan Kode:** Repositori GitHub terbebas dari file sampah, file kredensial `.env`, serta file artefak non-framework.
