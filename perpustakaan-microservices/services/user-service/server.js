/**
 * USER SERVICE
 * Tanggung jawab: menyimpan data akun (pengurus & mahasiswa) dan menangani autentikasi.
 * Tidak punya dependensi ke service lain (service ini "dipanggil", bukan "memanggil").
 *
 * Dibuat tanpa framework eksternal (hanya modul bawaan Node.js) supaya bisa langsung
 * dijalankan tanpa `npm install`.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4001;
const DATA_FILE = path.join(__dirname, 'data', 'users.json');

// ---------- Helper: baca / tulis file JSON sebagai "database" sederhana ----------
function readUsers() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// ---------- Helper: kirim response JSON + header CORS ----------
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

// ---------- Helper: baca body request (untuk POST/PUT/PATCH) ----------
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

// Menghilangkan field password sebelum dikirim ke luar
function toPublicUser(user) {
  const { password, ...publicUser } = user;
  return publicUser;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  try {
    // Health check - dipakai untuk memastikan service hidup
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { service: 'user-service', status: 'ok' });
    }

    // GET /api/users -> daftar semua user (tanpa password), dipakai frontend untuk tombol demo login
    if (pathname === '/api/users' && req.method === 'GET') {
      const users = readUsers();
      return sendJson(res, 200, users.map(toPublicUser));
    }

    // GET /api/users/:id -> detail 1 user, dipakai service lain (borrowing-service) untuk validasi
    const userDetailMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (userDetailMatch && req.method === 'GET') {
      const users = readUsers();
      const user = users.find(u => u.id === userDetailMatch[1]);
      if (!user) return sendJson(res, 404, { message: 'User tidak ditemukan.' });
      return sendJson(res, 200, toPublicUser(user));
    }

    // POST /api/auth/login -> memvalidasi username & password
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readBody(req);
      const { username, password } = body;
      if (!username || !password) {
        return sendJson(res, 400, { message: 'Username dan password wajib diisi.' });
      }
      const users = readUsers();
      const user = users.find(
        u => u.username.toLowerCase() === String(username).toLowerCase() && u.password === password
      );
      if (!user) {
        return sendJson(res, 401, { message: 'Username atau password salah.' });
      }
      return sendJson(res, 200, toPublicUser(user));
    }

    return sendJson(res, 404, { message: 'Endpoint tidak ditemukan di user-service.' });
  } catch (err) {
    console.error('[user-service] error:', err);
    return sendJson(res, 500, { message: 'Terjadi kesalahan pada user-service.', detail: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`[user-service] berjalan di http://localhost:${PORT}`);
});
