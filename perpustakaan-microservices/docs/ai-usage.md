# Dokumentasi Penggunaan AI Coding Tool

## AI Coding Tool yang digunakan
**Claude (Anthropic)** — digunakan langsung melalui antarmuka chat Claude yang memiliki
akses ke lingkungan sandbox (bisa membuat, mengedit, dan menjalankan file/kode secara nyata).

## Bagaimana AI membantu proses pengembangan
1. **Menganalisis proyek lama** — AI membaca isi `index.html`, `style.css`, dan `script.js`
   dari proyek sebelumnya (aplikasi client-side dengan `localStorage`) untuk memahami
   User Story, Acceptance Criteria, entitas data (User, Book, Borrowing), dan seluruh
   aturan bisnis yang sudah ada (kuota 3 buku, jatuh tempo 7 hari, validasi status buku, dll).
2. **Merancang pemecahan menjadi microservice** — AI mengusulkan pembagian menjadi
   3 service (User Service, Book Service, Borrowing Service) berdasarkan batas domain data,
   bukan sekadar membagi kode secara acak.
3. **Menulis kode backend dari nol** — AI menulis 3 server Node.js (tanpa framework
   eksternal karena lingkungan pengembangan tidak memiliki akses internet untuk
   `npm install`), lengkap dengan validasi, CORS, dan endpoint REST API.
4. **Menulis ulang frontend** — AI mengubah `script.js` dari yang awalnya membaca/menulis
   `localStorage` secara langsung, menjadi memanggil REST API ketiga service lewat `fetch`.
5. **Menguji sendiri hasil kodenya** — AI menjalankan ketiga service secara nyata di
   sandbox, lalu menembak endpoint dengan `curl` untuk memverifikasi alur pinjam buku,
   validasi kuota, validasi role, hapus buku yang sedang dipinjam, dan reset data —
   sebelum kode diserahkan ke pengguna.

## Contoh Prompt yang digunakan
Berikut prompt asli yang diberikan ke AI untuk memulai pengerjaan tugas ini:

> "Mengembangkan proyek kelompok sebelumnya menjadi aplikasi berbasis microservice
> dengan memanfaatkan AI Coding Tool. Gunakan proyek yang telah dikerjakan pada
> pertemuan sebelumnya, gunakan kembali User Story dan Acceptance Criteria yang telah
> dibuat, kembangkan arsitektur proyek menjadi minimal 2 service/microservice,
> technology boleh diubah sesuai kebutuhan, minimal terdapat 1 alur fitur yang berjalan
> dengan melibatkan service yang dibuat, setiap service harus memiliki fungsi yang jelas,
> antarservice harus dapat berkomunikasi menggunakan API..." (beserta lampiran file
> proyek lama `perpustakaan.zip`)

Prompt susulan yang relevan untuk verifikasi (diberikan sendiri oleh AI sebagai bagian
dari proses kerja, bukan oleh manusia, karena AI menguji hasilnya sendiri):

- "Jalankan ketiga service dan pastikan hidup (health check)."
- "Uji alur pinjam buku end-to-end: login → lihat katalog → pinjam → cek status
  buku berubah → lihat riwayat transaksi."
- "Uji kasus gagal: pinjam buku yang sudah dipinjam, pinjam sebagai admin (bukan
  mahasiswa), pinjam melebihi kuota 3 buku, hapus buku yang sedang dipinjam."
- "Cek sintaks semua file JavaScript sebelum diserahkan."

> **Catatan:** Kelompok wajib mengganti/menambahkan riwayat prompt di atas dengan
> prompt asli yang dipakai masing-masing anggota saat mengerjakan bagiannya
> (mis. saat menambah fitur atau memperbaiki bug), sesuai proses kerja kelompok
> yang sebenarnya.

## Masalah / kesalahan yang ditemukan dari hasil AI dan cara memperbaikinya

| # | Temuan | Perbaikan |
|---|---|---|
| 1 | Rancangan awal berisiko **menduplikasi data** `bookTitle`, `userName`, `userNim` ke dalam record transaksi di Borrowing Service (menyalin gaya proyek lama). Ini berbahaya di arsitektur microservice: jika judul buku diubah oleh Pengurus lewat Book Service, catatan transaksi lama di Borrowing Service akan menampilkan judul yang sudah usang (data tidak konsisten antar-service). | Diubah menjadi pola **join saat pembacaan (join-at-read)**: Borrowing Service hanya menyimpan `bookId` dan `userId`, lalu saat `GET /api/borrowings` dipanggil, Borrowing Service mengambil data terbaru dari Book Service dan User Service dan menggabungkannya sebelum dikirim ke frontend. Sudah diuji: setelah judul buku diedit, riwayat transaksi otomatis menampilkan judul terbaru tanpa perlu sinkronisasi manual. |
| 2 | Saat mencoba menjalankan proyek, service awalnya memakai Express.js (mengikuti kebiasaan umum), tapi environment pengembangan **tidak memiliki akses internet** sehingga `npm install express` gagal (`403 Forbidden` dari registry). | Kode backend ditulis ulang memakai modul bawaan Node.js (`http`, `fs`, `path`) saja, tanpa dependency eksternal, sehingga bisa langsung dijalankan dengan `node server.js` di komputer mana pun tanpa `npm install`. |
| 3 | Endpoint `PATCH /api/books/:id/status` awalnya tidak memvalidasi apakah buku **sudah** berstatus `Dipinjam` sebelum diminta pindah ke `Dipinjam` lagi — berpotensi terjadi race condition ganda-pinjam kalau dua permintaan datang hampir bersamaan. | Ditambahkan pengecekan: jika status baru yang diminta sama dengan status buku saat ini pada kasus `Dipinjam`, endpoint menolak dengan HTTP 409 (`Conflict`), sehingga Borrowing Service akan menerima error dan tidak melanjutkan proses peminjaman. |
| 4 | Tombol "Reset Data Demo" di frontend awalnya tidak berfungsi setelah migrasi ke microservice, karena logika reset lama hanya menghapus `localStorage` (yang sekarang tidak lagi jadi sumber data). | Ditambahkan endpoint `POST /api/reset` pada Book Service dan Borrowing Service yang mengembalikan data ke kondisi *seed* awal; tombol di frontend diubah untuk memanggil kedua endpoint tersebut lalu memuat ulang data. |
| 5 | Saat pengujian awal di sandbox, proses `node` yang dijalankan di background (`&`) **mati begitu perintah shell sebelumnya selesai**, sehingga pengujian `curl` gagal terhubung (connection refused). | Servis dijalankan dengan `setsid nohup ... &` agar tetap berjalan independen dari sesi shell yang memulainya — ini murni isu lingkungan pengujian, bukan bug pada kode aplikasi, tapi dicatat di sini sebagai bagian dari proses verifikasi. |
| 6 | Validasi input pada `POST /api/books` dan `PUT /api/books/:id` awalnya tidak memeriksa rentang tahun terbit, sehingga nilai seperti `0` atau `9999` bisa lolos tersimpan. | Ditambahkan validasi `year` harus berupa angka antara 1900–2099, konsisten dengan batas `min`/`max` yang sudah ada di form HTML. |

## Technology yang digunakan
Lihat `README.md` bagian **Teknologi**.
