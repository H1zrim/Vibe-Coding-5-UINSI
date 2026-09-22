# SIPERPU - MVC PHP Native

Aplikasi perpustakaan dengan pola MVC menggunakan PHP Native dan database SQLite.

## Menjalankan

Pastikan PHP 8 atau lebih baru dengan extension `pdo_sqlite` aktif, lalu jalankan dari root proyek:

```bash
php -S localhost:8000
```

Buka `http://localhost:8000` di browser.

## Struktur MVC

- `index.php` - front controller dan routing aplikasi
- `app/config` - konfigurasi aplikasi dan koneksi PDO SQLite
- `app/core/SqliteDatabase.php` - migrasi tabel dan adapter database
- `app/controllers` - alur request dan hak akses
- `app/models` - autentikasi, buku, dan peminjaman
- `app/views` - tampilan PHP
- `assets` - stylesheet
- `database/schema.sql` - schema referensi SQLite
- `storage/siperpu.sqlite` - database lokal yang dibuat otomatis (diabaikan Git)

Database SQLite dan tabelnya dibuat otomatis saat aplikasi pertama kali dibuka. Tidak diperlukan
server database atau konfigurasi kredensial, sehingga aplikasi lebih mudah dijalankan setelah
di-clone dari GitHub.

Untuk mengaktifkan login Google, isi `GOOGLE_CLIENT_ID` di `app/config/config.php` dengan OAuth
Client ID bertipe Web dari Google Cloud Console. Tambahkan origin aplikasi pada Authorized
JavaScript origins, misalnya `http://localhost:8000`. Tanpa Client ID, login username/password
tetap tersedia dan tombol Google menampilkan pesan bahwa konfigurasi perlu dilengkapi.

Riwayat perbaikan dan penyempurnaan lengkap tersedia di [docs/CHANGELOG.md](docs/CHANGELOG.md).

## Akun

Mahasiswa dapat membuat akun melalui halaman registrasi. Akun pengurus dikelola melalui seed
database atau proses administrasi aplikasi, bukan ditampilkan pada halaman login.

## Pengembangan service

Runtime utama dan frontend aplikasi menggunakan PHP Native. Service tambahan dikembangkan
di folder `services/` dengan menyalin `services/_template/`; setiap service memiliki storage,
endpoint, dan pengujian sendiri agar perubahan mudah ditinjau serta di-merge.

Folder `perpustakaan-microservices` dipertahankan sebagai arsip implementasi Node.js lama,
bukan bagian dari runtime utama.
