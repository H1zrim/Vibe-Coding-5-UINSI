# SIPERPU - MVC PHP Native

Aplikasi perpustakaan dengan pola MVC menggunakan PHP Native dan penyimpanan data JSON.

## Menjalankan

Pastikan PHP 8 atau lebih baru tersedia, lalu jalankan dari root proyek:

```bash
php -S localhost:8000
```

Buka `http://localhost:8000` di browser.

## Struktur MVC

- `index.php` - front controller dan routing aplikasi
- `app/config` - konfigurasi dan helper aplikasi
- `app/controllers` - alur request dan hak akses
- `app/models` - autentikasi, buku, dan peminjaman
- `app/views` - tampilan PHP
- `assets` - stylesheet
- `storage/data.json` - penyimpanan data JSON

## Akun Demo

- Pengurus: `pengurus` / `12345`
- Mahasiswa: daftar melalui halaman register

Folder `perpustakaan-microservices` dipertahankan sebagai arsip implementasi sebelumnya.
