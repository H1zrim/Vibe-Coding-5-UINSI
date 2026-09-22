# SIPERPU - PHP Native MVC

Versi baru SIPERPU menggunakan pola MVC PHP native dengan penyimpanan server-side
di `storage/data.json`. Aplikasi tidak lagi membutuhkan `localStorage` atau
menjalankan tiga service Node.js untuk alur utama perpustakaan.

## Menjalankan

1. Pastikan PHP 8.1 atau lebih baru tersedia.
2. Dari folder proyek, jalankan `php -S localhost:8088 -t .` atau buka folder ini melalui XAMPP Apache.
3. Buka `http://localhost:8088`.

Akun pengurus demo: `pengurus` / `12345`.

## Struktur MVC

- `app/models`: model user, buku, dan peminjaman.
- `app/controllers`: autentikasi dan alur perpustakaan.
- `app/views`: halaman login, registrasi, layout, dan dashboard.
- `app/core/JsonDatabase.php`: repository JSON dengan file locking.
- `index.php`: front controller dan routing aplikasi.