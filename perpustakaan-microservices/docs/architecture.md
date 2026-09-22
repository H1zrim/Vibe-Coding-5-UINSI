# Diagram Arsitektur

## Sebelum (Monolith - Client Side Only)

Proyek sebelumnya adalah aplikasi **client-side murni**: satu file HTML, satu file CSS,
dan satu file JavaScript. Semua "database" disimpan di `localStorage` browser, dan seluruh
logika bisnis (validasi kuota 3 buku, jatuh tempo 7 hari, CRUD buku, dsb.) dijalankan di
dalam `script.js` yang sama, tidak ada backend maupun API sama sekali.

```mermaid
flowchart TB
    subgraph Browser["Browser Pengguna"]
        UI["index.html + style.css<br/>(Tampilan)"]
        JS["script.js<br/>(Semua logika: Auth, CRUD Buku,<br/>Peminjaman, Validasi)"]
        LS[("localStorage<br/>(users, books, borrowings)")]
        UI --> JS
        JS <--> LS
    end
```

**Masalah pendekatan lama:**
- Data hanya tersimpan di satu browser satu perangkat (tidak bisa dipakai bersama banyak pengguna/perangkat sungguhan).
- Tidak ada pemisahan tanggung jawab: satu file JS menangani autentikasi, katalog buku, dan transaksi sekaligus.
- Tidak ada API yang bisa dipakai ulang oleh aplikasi lain (mis. aplikasi mobile).

## Sesudah (Microservice)

Aplikasi dipecah menjadi **3 microservice independen**, masing-masing dengan database
(file JSON) miliknya sendiri, berkomunikasi lewat REST API (JSON over HTTP). Frontend
menjadi *thin client* yang murni memanggil API dan menampilkan hasilnya.

```mermaid
flowchart TB
    subgraph Client["Browser Pengguna"]
        FE["Frontend (index.html, style.css, script.js)<br/>Thin client - tanpa logika bisnis"]
    end

    subgraph Services["Backend Microservices"]
        US["User Service (:4001)<br/>- Login / autentikasi<br/>- Data akun (admin & mahasiswa)"]
        BS["Book Service (:4002)<br/>- CRUD katalog buku<br/>- Status Tersedia/Dipinjam"]
        BRS["Borrowing Service (:4003)<br/>- Transaksi pinjam & kembali<br/>- Aturan bisnis: kuota 3 buku,<br/>  jatuh tempo 7 hari"]
    end

    UDB[("users.json")]
    BDB[("books.json")]
    BRDB[("borrowings.json")]

    FE -- "REST API (login, list user)" --> US
    FE -- "REST API (list/CRUD buku)" --> BS
    FE -- "REST API (list/buat/kembalikan transaksi)" --> BRS

    BRS -- "GET /api/users/:id<br/>(validasi peminjam)" --> US
    BRS -- "GET /api/books/:id<br/>PATCH /api/books/:id/status<br/>(cek & ubah status buku)" --> BS

    US --- UDB
    BS --- BDB
    BRS --- BRDB
```

**Alur fitur utama yang melibatkan lebih dari satu service (contoh: Mahasiswa meminjam buku):**

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BRS as Borrowing Service
    participant US as User Service
    participant BS as Book Service

    FE->>BRS: POST /api/borrowings {userId, bookId}
    BRS->>US: GET /api/users/:userId
    US-->>BRS: data user (role: mahasiswa)
    BRS->>BRS: cek kuota aktif user (maks 3) dari data lokal
    BRS->>BS: GET /api/books/:bookId
    BS-->>BRS: data buku (status: Tersedia)
    BRS->>BS: PATCH /api/books/:bookId/status {status: "Dipinjam"}
    BS-->>BRS: buku ter-update
    BRS->>BRS: simpan transaksi baru (borrowDate, dueDate +7 hari)
    BRS-->>FE: transaksi berhasil dibuat
```

Alur pengembalian buku (`PATCH /api/borrowings/:id/return`) mengikuti pola yang sama:
Borrowing Service memvalidasi transaksi, lalu memanggil Book Service untuk mengembalikan
status buku menjadi `Tersedia`.

### Mengapa dipisah seperti ini?

| Service | Alasan dipisah |
|---|---|
| **User Service** | Domain akun/identitas berbeda dari domain buku maupun transaksi; ke depannya bisa dikembangkan jadi service autentikasi terpusat (SSO) tanpa mengubah service lain. |
| **Book Service** | Katalog buku adalah *master data* yang dipakai baik oleh Pengurus (CRUD) maupun Mahasiswa (baca), dan menjadi satu-satunya pemilik status ketersediaan buku. |
| **Borrowing Service** | Berisi aturan bisnis paling kompleks (kuota, jatuh tempo) dan paling sering berubah seiring aturan perpustakaan berubah, sehingga baik dipisah agar perubahan di sini tidak berisiko merusak data katalog atau akun. |
