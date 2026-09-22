# Login dengan Google (GIS)

Integrasi ini memakai Google Identity Services (GIS) secara client-side pada
`frontend/login.html`. Karena belum ada backend khusus untuk OAuth, browser hanya
menyimpan profil hasil decode credential ke `sessionStorage`. Credential JWT tidak
disimpan.

## 1. Membuat Client ID

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat atau pilih project.
3. Buka **APIs & Services > OAuth consent screen**, lalu konfigurasi aplikasi.
   Untuk pengujian, tipe **External** dapat dipakai dan akun penguji harus ditambahkan.
4. Buka **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
5. Pilih **Web application**.
6. Pada **Authorized JavaScript origins**, tambahkan origin tempat frontend dilayani:
   - `http://localhost:8080` jika memakai `python -m http.server 8080`.
   - `http://127.0.0.1:8080` jika alamat itu yang dibuka di browser.
   - Tambahkan origin port lain yang benar-benar dipakai, misalnya `http://localhost:5500`.
7. Salin Client ID ke `frontend/config.js` pada `GOOGLE_CLIENT_ID`.

Origin hanya berisi skema, host, dan port. Jangan menambahkan path seperti
`/login.html`, dan jangan memasukkan Client Secret ke frontend.

## 2. Menjalankan frontend

Dari folder `perpustakaan-microservices/frontend`, jalankan server statis:

```bash
python -m http.server 8080
```

Buka `http://localhost:8080/login.html`. Membuka file HTML langsung dengan
`file://` tidak cocok untuk konfigurasi origin GIS.

## 3. Alur halaman

- `login.html` memuat SDK GIS dan merender tombol resmi Google.
- `google-auth.js` menerima `response.credential`, decode payload JWT untuk kebutuhan
  tampilan, lalu menyimpan profil ke `sessionStorage`.
- `dashboard.html` memeriksa session dan mengarahkan user yang belum login kembali ke
  `login.html`.
- Logout memanggil `google.accounts.id.disableAutoSelect()` dan menghapus session.

Decode JWT di browser bukan verifikasi keamanan. Sebelum aplikasi dipakai sungguhan,
backend Node.js/PHP harus memverifikasi token Google (issuer, audience, expiry, dan
signature), lalu membuat session/token aplikasi sendiri. Backend juga diperlukan untuk
menghubungkan akun Google ke user-service dan role mahasiswa/pengurus.