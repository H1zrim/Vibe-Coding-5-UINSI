/**
 * BOOK SERVICE
 * Tanggung jawab: mengelola katalog buku (CRUD) dan status ketersediaan buku
 * ("Tersedia" / "Dipinjam"). Service ini adalah pemilik satu-satunya data buku
 * (database-per-service) - service lain tidak boleh menulis file ini langsung,
 * hanya melalui API di bawah.
 *
 * Endpoint PATCH /:id/status sengaja dipisah dari PUT /:id karena yang mengubah
 * status buku bukan pengurus lewat form edit, melainkan borrowing-service secara
 * otomatis saat ada transaksi pinjam/kembali. ini contoh komunikasi antar-service.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4002;
const DATA_FILE = path.join(__dirname, 'data', 'books.json');

// Data awal, dipakai oleh endpoint /api/reset (fitur "Reset Data Demo" di frontend)
const SEED_BOOKS = [
  { id: 'BK-001', title: 'Algoritma & Struktur Data Lanjut', author: 'Rinaldi Munir', category: 'Ilmu Komputer', year: 2022, status: 'Tersedia' },
  { id: 'BK-002', title: 'Pemrograman Web Modern Berbasis Komponen', author: 'Budi Raharjo', category: 'Teknologi', year: 2023, status: 'Tersedia' },
  { id: 'BK-003', title: 'Basis Data & Perancangan Sistem Relasional', author: 'Fathansyah', category: 'Basis Data', year: 2021, status: 'Dipinjam' },
  { id: 'BK-004', title: 'Rekayasa Perangkat Lunak: Pendekatan Praktisi', author: 'Roger S. Pressman', category: 'Rekayasa', year: 2020, status: 'Tersedia' },
  { id: 'BK-005', title: 'Pengantar Kecerdasan Buatan dan Robotika', author: 'Suyanto', category: 'Kecerdasan Buatan', year: 2024, status: 'Tersedia' }
];

function readBooks() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeBooks(books) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(books, null, 2));
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function validateBookPayload(body) {
  const errors = [];
  if (!body.title || !String(body.title).trim()) errors.push('Judul buku wajib diisi.');
  if (!body.author || !String(body.author).trim()) errors.push('Pengarang wajib diisi.');
  if (!body.category || !String(body.category).trim()) errors.push('Kategori wajib diisi.');
  const year = parseInt(body.year, 10);
  if (!year || year < 1900 || year > 2099) errors.push('Tahun terbit tidak valid.');
  return errors;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { service: 'book-service', status: 'ok' });
    }

    // GET /api/books -> daftar seluruh buku (dipakai frontend & borrowing-service)
    if (pathname === '/api/books' && req.method === 'GET') {
      return sendJson(res, 200, readBooks());
    }

    // POST /api/books -> tambah buku baru (Pengurus)
    if (pathname === '/api/books' && req.method === 'POST') {
      const body = await readBody(req);
      const errors = validateBookPayload(body);
      if (errors.length) return sendJson(res, 400, { message: errors.join(' ') });

      const books = readBooks();
      const nextNumber = books.length
        ? Math.max(...books.map(b => parseInt(b.id.replace('BK-', ''), 10) || 0)) + 1
        : 1;
      const newBook = {
        id: `BK-${String(nextNumber).padStart(3, '0')}`,
        title: String(body.title).trim(),
        author: String(body.author).trim(),
        category: String(body.category).trim(),
        year: parseInt(body.year, 10),
        status: 'Tersedia'
      };
      books.push(newBook);
      writeBooks(books);
      return sendJson(res, 201, newBook);
    }

    const bookIdMatch = pathname.match(/^\/api\/books\/([^/]+)$/);
    const bookStatusMatch = pathname.match(/^\/api\/books\/([^/]+)\/status$/);

    // GET /api/books/:id -> detail 1 buku
    if (bookIdMatch && req.method === 'GET') {
      const books = readBooks();
      const book = books.find(b => b.id === bookIdMatch[1]);
      if (!book) return sendJson(res, 404, { message: 'Buku tidak ditemukan.' });
      return sendJson(res, 200, book);
    }

    // PUT /api/books/:id -> update data buku (Pengurus)
    if (bookIdMatch && req.method === 'PUT') {
      const body = await readBody(req);
      const errors = validateBookPayload(body);
      if (errors.length) return sendJson(res, 400, { message: errors.join(' ') });

      const books = readBooks();
      const book = books.find(b => b.id === bookIdMatch[1]);
      if (!book) return sendJson(res, 404, { message: 'Buku tidak ditemukan.' });

      book.title = String(body.title).trim();
      book.author = String(body.author).trim();
      book.category = String(body.category).trim();
      book.year = parseInt(body.year, 10);

      writeBooks(books);
      return sendJson(res, 200, book);
    }

    // DELETE /api/books/:id -> hapus buku (tidak boleh jika sedang dipinjam)
    if (bookIdMatch && req.method === 'DELETE') {
      const books = readBooks();
      const book = books.find(b => b.id === bookIdMatch[1]);
      if (!book) return sendJson(res, 404, { message: 'Buku tidak ditemukan.' });
      if (book.status === 'Dipinjam') {
        return sendJson(res, 409, {
          message: `Gagal menghapus: buku "${book.title}" sedang dipinjam.`
        });
      }
      const filtered = books.filter(b => b.id !== bookIdMatch[1]);
      writeBooks(filtered);
      return sendJson(res, 200, { message: 'Buku berhasil dihapus.' });
    }

    // PATCH /api/books/:id/status -> dipanggil OLEH borrowing-service saat pinjam/kembali
    if (bookStatusMatch && req.method === 'PATCH') {
      const body = await readBody(req);
      const allowedStatus = ['Tersedia', 'Dipinjam'];
      if (!allowedStatus.includes(body.status)) {
        return sendJson(res, 400, { message: 'Status tidak valid. Gunakan "Tersedia" atau "Dipinjam".' });
      }
      const books = readBooks();
      const book = books.find(b => b.id === bookStatusMatch[1]);
      if (!book) return sendJson(res, 404, { message: 'Buku tidak ditemukan.' });

      // Jaga konsistensi: tidak boleh meminjamkan buku yang sudah dipinjam
      if (body.status === 'Dipinjam' && book.status === 'Dipinjam') {
        return sendJson(res, 409, { message: 'Buku sudah berstatus Dipinjam.' });
      }

      book.status = body.status;
      writeBooks(books);
      return sendJson(res, 200, book);
    }

    // POST /api/reset -> kembalikan katalog ke data demo awal
    if (pathname === '/api/reset' && req.method === 'POST') {
      writeBooks(JSON.parse(JSON.stringify(SEED_BOOKS)));
      return sendJson(res, 200, { message: 'Data buku berhasil direset.' });
    }

    return sendJson(res, 404, { message: 'Endpoint tidak ditemukan di book-service.' });
  } catch (err) {
    console.error('[book-service] error:', err);
    return sendJson(res, 500, { message: 'Terjadi kesalahan pada book-service.', detail: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`[book-service] berjalan di http://localhost:${PORT}`);
});
