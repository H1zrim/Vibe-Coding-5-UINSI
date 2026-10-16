# 📋 CODE REVIEW LOG
## Proyek: SIPERPU (Sistem Informasi Peminjaman Buku Perpustakaan)
**Standar Evaluasi:** Correctness, Readability, Maintainability, Coding Standard (PSR-12)

Dokumen ini mencatat temuan review kritis serta perbaikan kode yang dilakukan selama proses pengembangan dengan asistensi AI.

---

| No. | Bagian / File yang Direview | Aspek | Temuan Masalah | Perbaikan / Keputusan yang Diambil |
|:---:|---|:---:|---|---|
| **1** | `BorrowingService.php` & Legacy SQLite Driver | **Correctness** | Pada implementasi prototype lama, peminjaman menggunakan metode `replaceData()` yang menghapus seluruh isi tabel lalu memasukkan ulang (*table wipe & reinsert*). Selain itu, tidak ada *locking* jika dua mahasiswa meminjam buku fisik yang sama secara bersamaan (*race condition*). | Mengeliminasi sistem lama dan mengimplementasikan `DB::transaction()` yang dipadukan dengan `lockForUpdate()` pada model `Book` dan `User`. Buku dikunci selama transaksi sehingga percobaan peminjaman kedua otomatis ditolak dengan HTTP 422. |
| **2** | `siperpu_postman_collection.json` (Endpoint Return) | **Correctness & Testing** | Endpoint pengembalian buku menggunakan ID statis `TRX-2026-00001`, padahal backend Laravel menerbitkan ID transaksi dinamis berbasis UUID (`Str::uuid()`). Hal ini menyebabkan pengujian pengembalian buku selalu menghasilkan HTTP 404 Not Found. | Menanamkan test script di Postman pada request `Pinjam Buku` untuk otomatis mengekstrak UUID transaksi dari respons JSON dan menyimpannya ke variabel koleksi `{{borrowing_id}}`. URL pengembalian diubah menjadi dinamis: `{{base_url}}/borrowings/{{borrowing_id}}/return`. |
| **3** | `AuthController.php` (`register` method) | **Coding Standard & Security** | Potensi celah keamanan *Mass-Assignment Privilege Escalation*, di mana pengguna jahat dapat menyisipkan `{"role": "pengurus"}` dalam payload JSON registrasi publik untuk memperoleh hak akses admin. | Menerapkan aturan **ROLE-GUARD**: field `role` dibuang dari data yang dapat diisi melalui request body registrasi, dan dikunci secara mutlak bernilai `'mahasiswa'`. Akun pengurus hanya boleh dibuat melalui database seeder. |
| **4** | `backend/routes/web.php` & Root Path Port 8000 | **Maintainability & UX** | Membuka `http://127.0.0.1:8000/` langsung di browser memunculkan error HTTP 404 Not Found karena Laravel hanya mendaftarkan rute dengan prefix `/api/`. Percobaan awal menggunakan *auto-redirect* JavaScript ke port 5173 sempat mengejutkan pengguna. | Dibuatkan rute web resmi di `backend/routes/web.php` yang menyajikan portal pengembang statis interaktif dengan status server dan tombol navigasi manual, serta menghapus seluruh skrip auto-redirect agar pengguna memiliki kontrol penuh. |
| **5** | `Borrowing.php` (Model Accessor Overdue) | **Readability & Maintainability** | Sistem membutuhkan status keterlambatan (*overdue*), namun penambahan kolom boolean statis di database akan memerlukan cron job scheduler harian yang rumit untuk memperbarui statusnya. | Dibuatkan Eloquent Accessor dinamis `is_overdue` (RULE-06) yang langsung membandingkan `due_date` dengan `today()` secara *real-time* saat data diserialisasi ke JSON tanpa membutuhkan cron job latar belakang. |

---

### Kesimpulan Review
Seluruh temuan di atas telah diverifikasi dengan:
1. **Automated Test Suite (Pest):** 12 feature & unit test lulus 100% (41 assertions).
2. **End-to-End Postman Collection:** Semua 15 endpoint berhasil diuji baik untuk skenario positif maupun negatif.
3. **Standarisasi PSR-12:** Sintaks kode backend bersih dan mematuhi konvensi Laravel 12 modern.
