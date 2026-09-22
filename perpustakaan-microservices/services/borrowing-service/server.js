/**
 * BORROWING SERVICE
 * Tanggung jawab: mengelola transaksi peminjaman & pengembalian buku, termasuk
 * aturan bisnis (maks 3 buku aktif per mahasiswa, jatuh tempo 7 hari).
 *
 * Ini adalah service "orchestrator" pada alur utama aplikasi: untuk membuat satu
 * transaksi peminjaman, service ini HARUS berkomunikasi via HTTP dengan:
 *   - user-service  -> memastikan peminjam valid & berperan "mahasiswa"
 *   - book-service  -> memastikan buku ada, berstatus "Tersedia", lalu mengubah
 *                      statusnya menjadi "Dipinjam" (dan sebaliknya saat dikembalikan)
 *
 * Ini adalah contoh nyata "alur fitur yang melibatkan lebih dari satu service"
 * yang disyaratkan pada tugas.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4003;
const DATA_FILE = path.join(__dirname, 'data', 'borrowings.json');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4001';
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:4002';

const MAX_ACTIVE_BORROW = 3;
const DUE_DAYS = 7;

// Data awal, dipakai oleh endpoint /api/reset (fitur "Reset Data Demo" di frontend)
const SEED_BORROWINGS = [
  { id: 'TRX-2026-001', bookId: 'BK-003', userId: 'u-mhs1', borrowDate: '2026-09-01', dueDate: '2026-09-08', returnDate: null, status: 'Dipinjam' }
];

function readBorrowings() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeBorrowings(borrowings) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(borrowings, null, 2));
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

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

// ---------- Panggilan HTTP ke service lain (pakai fetch bawaan Node 18+) ----------
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

function getUser(userId) {
  return fetchJson(`${USER_SERVICE_URL}/api/users/${encodeURIComponent(userId)}`);
}

function listUsers() {
  return fetchJson(`${USER_SERVICE_URL}/api/users`);
}

function getBook(bookId) {
  return fetchJson(`${BOOK_SERVICE_URL}/api/books/${encodeURIComponent(bookId)}`);
}

function listBooks() {
  return fetchJson(`${BOOK_SERVICE_URL}/api/books`);
}

function setBookStatus(bookId, status) {
  return fetchJson(`${BOOK_SERVICE_URL}/api/books/${encodeURIComponent(bookId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

function getActiveBorrowCount(borrowings, userId) {
  return borrowings.filter(b => b.userId === userId && b.status === 'Dipinjam').length;
}

// Gabungkan data transaksi (milik service ini) dengan judul buku & nama mahasiswa
// (milik service lain) supaya frontend tidak perlu memanggil 3 service sekaligus.
async function enrichBorrowings(borrowings) {
  const [booksRes, usersRes] = await Promise.all([listBooks(), listUsers()]);
  const books = booksRes.ok ? booksRes.data : [];
  const users = usersRes.ok ? usersRes.data : [];
  const bookMap = new Map(books.map(b => [b.id, b]));
  const userMap = new Map(users.map(u => [u.id, u]));

  return borrowings.map(trx => {
    const book = bookMap.get(trx.bookId);
    const user = userMap.get(trx.userId);
    return {
      ...trx,
      bookTitle: book ? book.title : '(buku tidak ditemukan)',
      userName: user ? user.name : '(pengguna tidak ditemukan)',
      userNim: user ? user.nim || '-' : '-'
    };
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { service: 'borrowing-service', status: 'ok' });
    }

    // GET /api/borrowings?userId=xxx -> daftar transaksi (semua, atau milik 1 user)
    if (pathname === '/api/borrowings' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      let borrowings = readBorrowings();
      if (userId) borrowings = borrowings.filter(b => b.userId === userId);
      // urutkan terbaru dulu
      borrowings = [...borrowings].sort((a, b) => (a.id < b.id ? 1 : -1));
      const enriched = await enrichBorrowings(borrowings);
      return sendJson(res, 200, enriched);
    }

    // POST /api/borrowings -> proses PINJAM buku (alur utama lintas-service)
    if (pathname === '/api/borrowings' && req.method === 'POST') {
      const body = await readBody(req);
      const { userId, bookId } = body;
      if (!userId || !bookId) {
        return sendJson(res, 400, { message: 'userId dan bookId wajib diisi.' });
      }

      // 1) Validasi peminjam ke user-service
      const userResp = await getUser(userId);
      if (!userResp.ok) {
        return sendJson(res, 404, { message: 'Pengguna tidak ditemukan di user-service.' });
      }
      const user = userResp.data;
      if (user.role !== 'mahasiswa') {
        return sendJson(res, 403, { message: 'Hanya pengguna berstatus Mahasiswa yang dapat meminjam buku.' });
      }

      // 2) Validasi kuota (maks 3 buku aktif) - data milik service ini sendiri
      const borrowings = readBorrowings();
      const activeCount = getActiveBorrowCount(borrowings, userId);
      if (activeCount >= MAX_ACTIVE_BORROW) {
        return sendJson(res, 409, {
          message: `Peminjaman ditolak! Anda sudah memiliki ${activeCount} buku aktif (maksimal ${MAX_ACTIVE_BORROW}). Kembalikan buku terlebih dahulu.`
        });
      }

      // 3) Validasi ketersediaan buku ke book-service
      const bookResp = await getBook(bookId);
      if (!bookResp.ok) {
        return sendJson(res, 404, { message: 'Buku tidak ditemukan di book-service.' });
      }
      const book = bookResp.data;
      if (book.status !== 'Tersedia') {
        return sendJson(res, 409, {
          message: `Peminjaman ditolak! Buku "${book.title}" sedang berstatus "${book.status}".`
        });
      }

      // 4) Set status buku menjadi "Dipinjam" via book-service
      const statusResp = await setBookStatus(bookId, 'Dipinjam');
      if (!statusResp.ok) {
        return sendJson(res, 502, { message: 'Gagal memperbarui status buku pada book-service.' });
      }

      // 5) Simpan transaksi baru di database milik borrowing-service sendiri
      const today = new Date();
      const dueDate = addDays(today, DUE_DAYS);
      const newTrx = {
        id: `TRX-${today.getFullYear()}-${String(Date.now()).slice(-4)}`,
        bookId: book.id,
        userId: user.id,
        borrowDate: formatDate(today),
        dueDate: formatDate(dueDate),
        returnDate: null,
        status: 'Dipinjam'
      };
      borrowings.unshift(newTrx);
      writeBorrowings(borrowings);

      return sendJson(res, 201, {
        ...newTrx,
        bookTitle: book.title,
        userName: user.name,
        userNim: user.nim || '-'
      });
    }

    // PATCH /api/borrowings/:id/return -> proses KEMBALI buku (alur lintas-service)
    const returnMatch = pathname.match(/^\/api\/borrowings\/([^/]+)\/return$/);
    if (returnMatch && req.method === 'PATCH') {
      const trxId = returnMatch[1];
      const borrowings = readBorrowings();
      const trx = borrowings.find(b => b.id === trxId);
      if (!trx) return sendJson(res, 404, { message: 'Transaksi tidak ditemukan.' });
      if (trx.status === 'Dikembalikan') {
        return sendJson(res, 409, { message: 'Buku untuk transaksi ini sudah dikembalikan sebelumnya.' });
      }

      // Set status buku kembali "Tersedia" via book-service
      const statusResp = await setBookStatus(trx.bookId, 'Tersedia');
      if (!statusResp.ok) {
        return sendJson(res, 502, { message: 'Gagal memperbarui status buku pada book-service.' });
      }

      trx.status = 'Dikembalikan';
      trx.returnDate = formatDate(new Date());
      writeBorrowings(borrowings);

      return sendJson(res, 200, trx);
    }

    // POST /api/reset -> kembalikan transaksi ke data demo awal (tidak menyentuh service lain)
    if (pathname === '/api/reset' && req.method === 'POST') {
      writeBorrowings(JSON.parse(JSON.stringify(SEED_BORROWINGS)));
      return sendJson(res, 200, { message: 'Data peminjaman berhasil direset.' });
    }

    return sendJson(res, 404, { message: 'Endpoint tidak ditemukan di borrowing-service.' });
  } catch (err) {
    console.error('[borrowing-service] error:', err);
    return sendJson(res, 500, { message: 'Terjadi kesalahan pada borrowing-service.', detail: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`[borrowing-service] berjalan di http://localhost:${PORT}`);
  console.log(`  -> user-service: ${USER_SERVICE_URL}`);
  console.log(`  -> book-service: ${BOOK_SERVICE_URL}`);
});
