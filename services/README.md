# PHP Services

Folder ini adalah tempat resmi untuk service baru SIPERPU. Runtime service menggunakan PHP
Native dan kontrak HTTP JSON yang sama dengan aplikasi utama.

## Membuat service baru

1. Salin `services/_template` menjadi `services/<nama-service>`.
2. Ubah `SERVICE_NAME` di `config/config.php`.
3. Tambahkan route di `public/index.php`.
4. Simpan data service hanya di `storage/` miliknya sendiri.
5. Tambahkan pengujian di `tests/` dan dokumentasi endpoint di README service tersebut.

Jalankan service dengan PHP built-in server dari folder service:

```bash
php -S localhost:4100 -t public
```

## Batas tanggung jawab

- Setiap service memiliki domain dan storage sendiri.
- Service tidak membaca file storage service lain secara langsung.
- Komunikasi antar-service hanya melalui HTTP JSON.
- Validasi request dan format error harus konsisten dengan template.
- Perubahan service dibuat dalam foldernya sendiri agar mudah ditinjau dan di-merge.

## Struktur standar

```text
services/<nama-service>/
├── config/config.php
├── public/index.php
├── src/Service.php
├── storage/.gitkeep
├── tests/.gitkeep
└── README.md
```

`_template` tidak dijalankan langsung. Folder tersebut adalah titik awal untuk service baru.
Implementasi Node.js di `perpustakaan-microservices/` dipertahankan sebagai arsip referensi,
bukan runtime aplikasi utama.