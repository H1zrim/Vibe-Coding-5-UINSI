# SIPERPU — Sistem Peminjaman Buku Perpustakaan (Versi Microservice)

Pengembangan lanjutan dari proyek kelompok sebelumnya (aplikasi client-side dengan
`localStorage`) menjadi aplikasi berbasis **microservice**. User Story dan Acceptance
Criteria dari proyek sebelumnya tetap dipakai:

- **Sebagai Pengurus**, saya ingin mengelola katalog buku (tambah/edit/hapus) dan
  memantau transaksi peminjaman, supaya data koleksi perpustakaan selalu akurat.
- **Sebagai Mahasiswa**, saya ingin melihat katalog buku yang tersedia dan meminjamnya,
  dengan batas maksimal 3 buku aktif dan jatuh tempo otomatis 7 hari, supaya peminjaman
  tercatat rapi dan adil bagi semua mahasiswa.
- **Sebagai Pengurus**, saya ingin menandai buku sebagai "Dikembalikan" agar status
  ketersediaan buku kembali otomatis menjadi "Tersedia".

Dokumen arsitektur lebih lengkap (before/after + diagram alur) ada di
[`docs/architecture.md`](docs/architecture.md). Dokumentasi penggunaan AI Coding Tool
dan prompt yang dipakai ada di [`docs/ai-usage.md`](docs/ai-usage.md).

## Arsitektur Singkat

Aplikasi dipecah menjadi **3 microservice** + 1 frontend, saling berkomunikasi lewat REST API (JSON/HTTP):

| Service | Port | Tanggung jawab |
|---|---|---|
| `user-service` | `4001` | Data akun & autentikasi (login) |
| `book-service` | `4002` | Katalog buku (CRUD) & status ketersediaan buku |
| `borrowing-service` | `4003` | Transaksi pinjam/kembali & aturan bisnis (kuota 3 buku, jatuh tempo 7 hari) — memanggil `user-service` dan `book-service` |
| `frontend` | `8080` (bebas) | Halaman web statis (HTML/CSS/JS) yang memanggil ketiga API di atas |

**Alur fitur utama (melibatkan 3 service sekaligus): Mahasiswa meminjam buku**
1. Frontend mengirim `POST /api/borrowings` ke Borrowing Service.
2. Borrowing Service memvalidasi peminjam dengan memanggil `GET /api/users/:id` ke User Service.
3. Borrowing Service mengecek kuota (maks 3 buku aktif) dari datanya sendiri.
4. Borrowing Service mengecek ketersediaan buku dengan memanggil `GET /api/books/:id` ke Book Service.
5. Borrowing Service mengubah status buku menjadi `"Dipinjam"` lewat `PATCH /api/books/:id/status` ke Book Service.
6. Borrowing Service menyimpan transaksi baru (tanggal pinjam & jatuh tempo otomatis +7 hari).

Detail lengkap + diagram sequence ada di `docs/architecture.md`.

## Teknologi yang digunakan

- **Backend**: Node.js (v18+) — HANYA modul bawaan (`http`, `fs`, `path`), tanpa framework
  eksternal (Express dsb.) supaya bisa langsung dijalankan tanpa `npm install`.
  Komunikasi antar-service memakai `fetch` bawaan Node.js.
- **Penyimpanan data**: file JSON per service (`data/*.json`) — pola *database-per-service*,
  setiap service adalah satu-satunya pemilik datanya sendiri.
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (tanpa framework), memanggil API dengan `fetch`.
- **Komunikasi antar-service**: REST API berbasis JSON di atas HTTP.
- **AI Coding Tool**: Claude (Anthropic) — lihat `docs/ai-usage.md`.

## Cara Menjalankan

### 1. Jalankan ketiga backend service
Opsi A — otomatis (Linux/Mac):
```bash
./start-all.sh
```

Opsi B — manual, satu per satu (3 terminal berbeda):
```bash
cd services/user-service && node server.js
cd services/book-service && node server.js
cd services/borrowing-service && node server.js
```

### 2. Jalankan frontend
Buka `frontend/index.html` langsung di browser, **atau** sajikan lewat server statis
(disarankan, supaya `fetch` bekerja optimal):
```bash
cd frontend
python3 -m http.server 8080
# lalu buka http://localhost:8080
```

Jika salah satu service dijalankan di port/host berbeda, ubah `frontend/config.js`.

### 3. Akun demo untuk login
| Username | Password | Role |
|---|---|---|
| `admin` | `123` | Pengurus |
| `mhs1` | `123` | Mahasiswa (sudah punya 1 riwayat pinjam) |
| `mhs2` | `123` | Mahasiswa (akun baru) |

## Struktur Folder

```
perpustakaan-microservices/
├── frontend/                  # UI (HTML/CSS/JS) - thin client, tanpa logika bisnis
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── config.js              # alamat (base URL) ketiga service
├── services/
│   ├── user-service/
│   │   ├── server.js
│   │   ├── package.json
│   │   └── data/users.json
│   ├── book-service/
│   │   ├── server.js
│   │   ├── package.json
│   │   └── data/books.json
│   └── borrowing-service/
│       ├── server.js
│       ├── package.json
│       └── data/borrowings.json
├── docs/
│   ├── architecture.md        # diagram arsitektur before/after + sequence diagram
│   └── ai-usage.md            # dokumentasi & prompt penggunaan AI coding tool
├── start-all.sh                # menjalankan ketiga service sekaligus
└── README.md
```

## Daftar Endpoint API

### User Service (`:4001`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/health` | Cek service hidup |
| GET | `/api/users` | Daftar semua user (tanpa password) |
| GET | `/api/users/:id` | Detail 1 user |
| POST | `/api/auth/login` | Login (`{username, password}`) |

### Book Service (`:4002`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/health` | Cek service hidup |
| GET | `/api/books` | Daftar semua buku |
| GET | `/api/books/:id` | Detail 1 buku |
| POST | `/api/books` | Tambah buku baru |
| PUT | `/api/books/:id` | Ubah data buku |
| DELETE | `/api/books/:id` | Hapus buku (ditolak jika sedang dipinjam) |
| PATCH | `/api/books/:id/status` | Ubah status buku (dipakai internal oleh Borrowing Service) |
| POST | `/api/reset` | Kembalikan data ke seed awal (demo) |

### Borrowing Service (`:4003`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/health` | Cek service hidup |
| GET | `/api/borrowings?userId=` | Daftar transaksi (semua atau milik 1 user), sudah digabung dengan judul buku & nama peminjam |
| POST | `/api/borrowings` | Buat transaksi pinjam baru (`{userId, bookId}`) |
| PATCH | `/api/borrowings/:id/return` | Tandai transaksi sebagai dikembalikan |
| POST | `/api/reset` | Kembalikan data ke seed awal (demo) |

## Catatan Pengujian
Seluruh endpoint di atas sudah diuji manual dengan `curl` selama proses pengembangan
(login, pinjam buku, tolak pinjam saat kuota penuh, tolak pinjam buku yang sudah
dipinjam, tolak pinjam oleh non-mahasiswa, kembalikan buku, hapus buku yang sedang
dipinjam harus gagal, edit buku, reset data). Lihat tabel temuan & perbaikan di
`docs/ai-usage.md` untuk detail masalah yang ditemukan selama pengujian tersebut.

## Pengembangan Lanjutan (di luar cakupan tugas ini)
- Mengganti penyimpanan file JSON dengan database sungguhan (mis. SQLite/PostgreSQL per service).
- Menambahkan autentikasi berbasis token (JWT) antar frontend-backend maupun antar-service.
- Menambahkan API Gateway agar frontend hanya memanggil satu alamat.
- Containerize tiap service dengan Docker + `docker-compose.yml`.
