# Catatan Perubahan SIPERPU

## Perbaikan Bug dan Penyempurnaan Fitur

Dokumen ini mencatat perubahan arsitektur dan fitur yang dikerjakan sebelum rilis
`siperpu-v0.3`.

## Prompt AI yang Digunakan

Prompt berikut digunakan sebagai instruksi kerja selama pengembangan dan dapat dipakai
sebagai konteks saat melanjutkan proyek:

### Refactor arsitektur

> Rapikan arsitektur SIPERPU agar tidak ada redundansi, gunakan PHP Native pada seluruh lini
> termasuk frontend, dan sediakan tempat serta template agar microservice baru mudah
> dikembangkan dan di-merge.

### Migrasi database dan perbaikan dashboard

> Perbaiki error undefined variable pada dashboard, lalu gunakan database portable yang mudah
> dijalankan setelah project dibuka dari GitHub. Pertahankan model dan aturan bisnis yang ada,
> tambahkan migrasi tabel serta seed data otomatis.

### Login Google

> Tambahkan login melalui akun Google pada tampilan login utama. Gunakan Google Identity
> Services, validasi credential di backend, buat akun mahasiswa berdasarkan email Google yang
> terverifikasi, dan sediakan fallback jika Client ID belum dikonfigurasi.

### Penyempurnaan tampilan

> Pelajari token warna CSS berikut dan terapkan primary blue yang lebih terang pada tampilan
> SIPERPU. Pertahankan layout, responsive behavior, dan keterbacaan komponen yang sudah ada.

### Dokumentasi dan rilis

> Dokumentasikan seluruh perbaikan bug dan penyempurnaan fitur, lakukan validasi PHP serta
> smoke test halaman login, kemudian commit perubahan dengan pesan yang jelas dan push ke
> branch utama serta branch versi rilis.

### Arsitektur dan database

- Menyatukan bootstrap aplikasi PHP melalui `app/bootstrap.php` dan autoload class.
- Mengganti penyimpanan JSON/MySQL menjadi SQLite portable di `storage/siperpu.sqlite`.
- Menambahkan `DatabaseInterface` agar model tidak bergantung langsung pada engine database.
- Menambahkan migrasi tabel SQLite untuk users, books, dan borrowings.
- Menambahkan seed data awal saat database pertama kali dibuat.
- Mengabaikan file database lokal melalui `storage/.gitignore` agar data pribadi tidak ikut
  masuk repository.
- Menambahkan struktur `services/_template` sebagai dasar pengembangan microservice PHP baru.
- Menandai implementasi Node.js di `perpustakaan-microservices` sebagai arsip, bukan runtime
  utama aplikasi.

### Perbaikan bug

- Memperbaiki dashboard yang menerima `$viewData` tetapi view mengharapkan `$user`,
  `$books`, `$transactions`, dan `$stats` sebagai variabel langsung.
- Memperbaiki path partial flash pada layout yang sebelumnya menunjuk ke folder yang salah.
- Memastikan transaksi database menggunakan rollback saat terjadi exception.
- Menghapus daftar dependency manual dari front controller.
- Mengaktifkan extension `pdo_sqlite` dan `sqlite3` pada konfigurasi PHP lokal XAMPP.

### Login dan autentikasi

- Menambahkan login melalui Google Identity Services pada halaman login PHP utama.
- Menambahkan validasi credential Google di backend melalui endpoint `tokeninfo` Google.
- Membuat akun mahasiswa otomatis berdasarkan email Google yang terverifikasi.
- Menambahkan fallback tombol Google ketika Client ID belum dikonfigurasi.
- Menghapus placeholder username dan password dari halaman login.
- Menghapus tampilan kredensial akun demo dari halaman login.
- Menghapus Client Secret OAuth dari source code karena tidak diperlukan untuk alur GIS ini.

### Tampilan

- Mengubah warna utama aplikasi dari hijau menjadi palet biru SIPERPU.
- Menggunakan biru tua untuk navigasi dan latar autentikasi, biru layanan untuk aksi utama,
  serta cyan lembut sebagai aksen.
- Mempertahankan layout MVC, responsive behavior, dan komponen login Google yang sudah ada.

### Menjalankan aplikasi

```bash
php -S localhost:8000
```

Buka `http://localhost:8000`. Pastikan `pdo_sqlite` aktif. Untuk Google Login, isi
`GOOGLE_CLIENT_ID` pada `app/config/config.php` dan daftarkan origin aplikasi di Google Cloud
Console, misalnya `http://localhost:8000`.

### Validasi

- Seluruh file PHP melewati `php -l` tanpa error sintaks.
- Dashboard berhasil dirender dari data SQLite.
- Halaman login berhasil HTTP 200.
- Tombol Google dan callback `google_login` tersedia pada output halaman login.
- `git diff --check` tidak menemukan whitespace error.