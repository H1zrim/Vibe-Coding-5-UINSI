/**
 * SIPERPU - Sistem Peminjaman Buku Perpustakaan (Versi Microservice)
 *
 * Frontend ini TIDAK LAGI menyimpan data buku/peminjaman di localStorage.
 * Semua data & aturan bisnis (kuota 3 buku, jatuh tempo 7 hari, dsb.) sekarang
 * berada di backend (user-service, book-service, borrowing-service).
 * Frontend hanya memanggil REST API ketiga service tersebut lalu menampilkan hasilnya.
 *
 * Sesi login (siapa yang sedang login) tetap disimpan di localStorage karena itu
 * murni state tampilan di browser, bukan data inti aplikasi.
 */

const SESSION_KEY = 'siperpu_current_user';

// ==========================================
// 1. APPLICATION STATE (cache hasil fetch dari API)
// ==========================================
const AppState = {
  users: [],
  books: [],
  borrowings: [],
  currentUser: null,
  pendingBorrowBook: null
};

// ==========================================
// 2. DATE UTILITIES
// ==========================================
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

// ==========================================
// 3. API CLIENT (lapisan komunikasi ke 3 microservice)
// ==========================================
async function apiRequest(baseUrl, path, options = {}) {
  let res;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
  } catch (err) {
    // Biasanya berarti service backend belum dijalankan
    throw new Error(`Tidak bisa menghubungi service di ${baseUrl}. Pastikan backend sudah dijalankan (lihat README).`);
  }

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `Permintaan gagal (status ${res.status}).`);
  }
  return data;
}

const UserApi = {
  login(username, password) {
    return apiRequest(API_CONFIG.USER_SERVICE, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  listUsers() {
    return apiRequest(API_CONFIG.USER_SERVICE, '/api/users');
  }
};

const BookApi = {
  list() {
    return apiRequest(API_CONFIG.BOOK_SERVICE, '/api/books');
  },
  create(data) {
    return apiRequest(API_CONFIG.BOOK_SERVICE, '/api/books', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update(id, data) {
    return apiRequest(API_CONFIG.BOOK_SERVICE, `/api/books/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  remove(id) {
    return apiRequest(API_CONFIG.BOOK_SERVICE, `/api/books/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },
  reset() {
    return apiRequest(API_CONFIG.BOOK_SERVICE, '/api/reset', { method: 'POST' });
  }
};

const BorrowingApi = {
  list() {
    return apiRequest(API_CONFIG.BORROWING_SERVICE, '/api/borrowings');
  },
  borrow(userId, bookId) {
    return apiRequest(API_CONFIG.BORROWING_SERVICE, '/api/borrowings', {
      method: 'POST',
      body: JSON.stringify({ userId, bookId })
    });
  },
  returnBook(transactionId) {
    return apiRequest(API_CONFIG.BORROWING_SERVICE, `/api/borrowings/${encodeURIComponent(transactionId)}/return`, {
      method: 'PATCH'
    });
  },
  reset() {
    return apiRequest(API_CONFIG.BORROWING_SERVICE, '/api/reset', { method: 'POST' });
  }
};

// ==========================================
// 4. SESSION (login yang sedang aktif di browser)
// ==========================================
const SessionService = {
  save(user) {
    AppState.currentUser = user;
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  },
  load() {
    try {
      AppState.currentUser = JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
    } catch (_) {
      AppState.currentUser = null;
    }
  }
};

// ==========================================
// 5. TOAST NOTIFICATION ENGINE
// ==========================================
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'danger') icon = '❌';

  toast.innerHTML = `
    <span style="font-size: 1.15rem;">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// ==========================================
// 6. DATA LOADING (refresh cache dari ketiga service)
// ==========================================
const DataLoader = {
  async loadUsers() {
    AppState.users = await UserApi.listUsers();
  },
  async loadBooks() {
    AppState.books = await BookApi.list();
  },
  async loadBorrowings() {
    AppState.borrowings = await BorrowingApi.list();
  },
  async loadAll() {
    // Dijalankan paralel karena ketiganya independen
    await Promise.all([this.loadUsers(), this.loadBooks(), this.loadBorrowings()]);
  }
};

// Hitung jumlah buku aktif (status "Dipinjam") milik satu user, dari cache lokal.
// Dipakai untuk keputusan UI (mis. menonaktifkan tombol) - validasi FINAL tetap di backend.
function getActiveBorrowCount(userId) {
  return AppState.borrowings.filter(b => b.userId === userId && b.status === 'Dipinjam').length;
}

// ==========================================
// 7. UI CONTROLLER & RENDERING
// ==========================================
const UI = {
  async init() {
    this.bindEvents();
    SessionService.load();
    try {
      await DataLoader.loadAll();
    } catch (err) {
      showToast(err.message, 'danger', 6000);
    }
    this.render();
  },

  bindEvents() {
    // Demo buttons removed — registration form will handle new visitors.

    // Manual Login Form Submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('login-username').value.trim();
        const passwordInput = document.getElementById('login-password').value.trim();
        const success = await this.handleLogin(usernameInput, passwordInput);
        if (success) loginForm.reset();
      });
    }

    // Auth view switches (pengurus vs pengunjung)
    const btnPengurus = document.getElementById('show-pengurus-login');
    const btnPengunjung = document.getElementById('show-pengunjung-login');
    if (btnPengurus) btnPengurus.addEventListener('click', () => {
      document.getElementById('login-username').placeholder = 'pengurus';
      document.getElementById('login-password').placeholder = 'Password pengurus';
      showToast('Mode: Login Pengurus', 'info');
    });
    if (btnPengunjung) btnPengunjung.addEventListener('click', () => {
      document.getElementById('login-username').placeholder = 'email atau username pengunjung';
      document.getElementById('login-password').placeholder = 'Password pengunjung';
      showToast('Mode: Login Pengunjung', 'info');
    });

    // Registration Form Submission (pengunjung)
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const name = document.getElementById('reg-name').value.trim();
        const nim = document.getElementById('reg-nim').value.trim();
        if (!username || !password || !name) {
          showToast('Username, password, dan nama wajib diisi.', 'danger');
          return;
        }
        try {
          const newUser = await apiRequest(API_CONFIG.USER_SERVICE, '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, name, nim })
          });
          // Auto-login after registration
          SessionService.save(newUser);
          showToast('Registrasi berhasil — Anda sekarang masuk.', 'success');
          await DataLoader.loadAll();
          this.render();
        } catch (err) {
          showToast(err.message || 'Gagal registrasi.', 'danger');
        }
      });
    }

    // Logout / Role Switcher Button
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        SessionService.save(null);
        showToast('Anda telah keluar dari sistem.', 'info');
        this.render();
      });
    }

    // Reset Demo Data Button (memanggil book-service & borrowing-service)
    const btnReset = document.getElementById('btn-reset-demo');
    if (btnReset) {
      btnReset.addEventListener('click', async () => {
        if (!confirm('Apakah Anda yakin ingin mereset seluruh data kembali ke kondisi awal (default)?')) return;
        try {
          await Promise.all([BookApi.reset(), BorrowingApi.reset()]);
          await DataLoader.loadAll();
          showToast('Seluruh data berhasil di-reset ke data bawaan demo.', 'success');
          this.render();
        } catch (err) {
          showToast(err.message, 'danger', 5000);
        }
      });
    }

    // Tab Navigation for Admin and Student
    document.querySelectorAll('.tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const parentNav = tabBtn.parentElement;
        parentNav.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');

        const targetPaneId = tabBtn.dataset.tab;
        const targetContainer = parentNav.closest('section');
        targetContainer.querySelectorAll('.tab-pane').forEach(pane => {
          if (pane.id === targetPaneId) {
            pane.classList.remove('hidden');
            pane.classList.add('active');
          } else {
            pane.classList.add('hidden');
            pane.classList.remove('active');
          }
        });
      });
    });

    // Admin Book Search & Category Filter
    const adminSearch = document.getElementById('admin-book-search');
    const adminCategory = document.getElementById('admin-book-category-filter');
    if (adminSearch) adminSearch.addEventListener('input', () => this.renderAdminBooksTable());
    if (adminCategory) adminCategory.addEventListener('change', () => this.renderAdminBooksTable());

    // Admin Borrowings Filter
    const adminBorrowingFilter = document.getElementById('admin-borrowing-status-filter');
    if (adminBorrowingFilter) adminBorrowingFilter.addEventListener('change', () => this.renderAdminBorrowingsTable());

    // Student Book Search & Category Filter
    const studentSearch = document.getElementById('student-book-search');
    const studentCategory = document.getElementById('student-book-category-filter');
    if (studentSearch) studentSearch.addEventListener('input', () => this.renderStudentBooksGrid());
    if (studentCategory) studentCategory.addEventListener('change', () => this.renderStudentBooksGrid());

    // Add Book Modal Open
    const btnOpenAddBook = document.getElementById('btn-open-add-book');
    if (btnOpenAddBook) {
      btnOpenAddBook.addEventListener('click', () => {
        this.openBookModal();
      });
    }

    // Book Modal Close
    document.getElementById('btn-close-book-modal')?.addEventListener('click', () => this.closeBookModal());
    document.getElementById('btn-cancel-book-modal')?.addEventListener('click', () => this.closeBookModal());

    // Book Form Submit (Add or Edit) -> panggil book-service
    const formBook = document.getElementById('form-book');
    if (formBook) {
      formBook.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('book-edit-id').value;
        const bookData = {
          title: document.getElementById('book-title').value,
          author: document.getElementById('book-author').value,
          category: document.getElementById('book-category').value,
          year: document.getElementById('book-year').value
        };

        try {
          if (editId) {
            await BookApi.update(editId, bookData);
            showToast(`Perubahan buku "${bookData.title}" berhasil disimpan.`, 'success');
          } else {
            await BookApi.create(bookData);
            showToast(`Buku baru "${bookData.title}" berhasil ditambahkan ke katalog.`, 'success');
          }
          await DataLoader.loadBooks();
          this.closeBookModal();
          this.render();
        } catch (err) {
          showToast(err.message, 'danger', 5000);
        }
      });
    }

    // Student Borrow Modal Events
    document.getElementById('btn-close-borrow-modal')?.addEventListener('click', () => this.closeBorrowModal());
    document.getElementById('btn-cancel-borrow')?.addEventListener('click', () => this.closeBorrowModal());

    const btnExecuteBorrow = document.getElementById('btn-execute-borrow');
    if (btnExecuteBorrow) {
      btnExecuteBorrow.addEventListener('click', async () => {
        if (!AppState.pendingBorrowBook || !AppState.currentUser) return;
        const book = AppState.pendingBorrowBook;
        try {
          const trx = await BorrowingApi.borrow(AppState.currentUser.id, book.id);
          showToast(`Berhasil meminjam "${book.title}"! Batas waktu pengembalian adalah 7 hari (${trx.dueDate}).`, 'success', 4500);
          this.closeBorrowModal();
          await Promise.all([DataLoader.loadBooks(), DataLoader.loadBorrowings()]);
          this.render();
        } catch (err) {
          this.closeBorrowModal();
          showToast(err.message, 'danger', 5000);
        }
      });
    }
  },

  async handleLogin(username, password) {
    if (!username || !password) {
      showToast('Username dan password wajib diisi.', 'danger');
      return false;
    }
    try {
      const user = await UserApi.login(username, password);
      SessionService.save(user);
      showToast(`Selamat datang, ${user.name}! (${user.role.toUpperCase()})`, 'success');
      await DataLoader.loadAll();
      this.render();
      return true;
    } catch (err) {
      showToast(err.message || 'Username atau password salah.', 'danger');
      return false;
    }
  },

  openBookModal(bookToEdit = null) {
    const modal = document.getElementById('modal-book');
    const titleElem = document.getElementById('modal-book-title');
    const editIdInput = document.getElementById('book-edit-id');
    const form = document.getElementById('form-book');

    form.reset();

    if (bookToEdit) {
      titleElem.textContent = 'Edit Data Buku';
      editIdInput.value = bookToEdit.id;
      document.getElementById('book-title').value = bookToEdit.title;
      document.getElementById('book-author').value = bookToEdit.author;
      document.getElementById('book-category').value = bookToEdit.category;
      document.getElementById('book-year').value = bookToEdit.year;
    } else {
      titleElem.textContent = 'Tambah Buku Baru';
      editIdInput.value = '';
    }

    modal.classList.remove('hidden');
  },

  closeBookModal() {
    document.getElementById('modal-book')?.classList.add('hidden');
  },

  openBorrowModal(book) {
    if (!AppState.currentUser) return;

    // Pre-check ringan di sisi klien untuk UX (pesan cepat tanpa menunggu API).
    // Keputusan yang sesungguhnya tetap divalidasi ulang oleh borrowing-service.
    const activeCount = getActiveBorrowCount(AppState.currentUser.id);
    if (activeCount >= 3) {
      showToast(`Peminjaman Ditolak! Anda sudah memiliki ${activeCount} buku aktif (maksimal 3).`, 'danger', 5000);
      return;
    }
    if (book.status !== 'Tersedia') {
      showToast(`Peminjaman Ditolak! Buku "${book.title}" sedang berstatus "${book.status}".`, 'danger', 5000);
      return;
    }

    AppState.pendingBorrowBook = book;
    const modal = document.getElementById('modal-borrow-confirm');

    const today = new Date();
    const dueDate = addDays(today, 7);

    document.getElementById('confirm-book-title').textContent = book.title;
    document.getElementById('confirm-book-author').textContent = `Pengarang: ${book.author} (${book.year})`;
    document.getElementById('confirm-borrow-date').textContent = formatDate(today);
    document.getElementById('confirm-due-date').textContent = `${formatDate(dueDate)} (7 Hari)`;

    modal.classList.remove('hidden');
  },

  closeBorrowModal() {
    AppState.pendingBorrowBook = null;
    document.getElementById('modal-borrow-confirm')?.classList.add('hidden');
  },

  // Main Render Routine
  render() {
    this.renderSessionNav();
    this.populateCategoryFilters();

    const authSection = document.getElementById('auth-section');
    const adminSection = document.getElementById('admin-section');
    const studentSection = document.getElementById('student-section');

    if (!AppState.currentUser) {
      authSection.classList.remove('hidden');
      adminSection.classList.add('hidden');
      studentSection.classList.add('hidden');
      return;
    }

    authSection.classList.add('hidden');

    if (AppState.currentUser.role === 'pengurus') {
      adminSection.classList.remove('hidden');
      studentSection.classList.add('hidden');
      this.renderAdminDashboard();
    } else if (AppState.currentUser.role === 'mahasiswa') {
      adminSection.classList.add('hidden');
      studentSection.classList.remove('hidden');
      this.renderStudentDashboard();
    }
  },

  renderSessionNav() {
    const navProfile = document.getElementById('user-nav-profile');
    const navName = document.getElementById('nav-user-name');
    const navRole = document.getElementById('nav-user-role');

    if (AppState.currentUser) {
      navProfile.classList.remove('hidden');
      navName.textContent = AppState.currentUser.name;
      navRole.textContent = AppState.currentUser.role === 'pengurus' ? 'Pengurus (Admin)' : `Mahasiswa (${AppState.currentUser.nim || ''})`;
      navRole.className = `user-role-badge ${AppState.currentUser.role === 'pengurus' ? 'role-admin' : 'role-student'}`;
    } else {
      navProfile.classList.add('hidden');
    }
  },

  populateCategoryFilters() {
    const categories = Array.from(new Set(AppState.books.map(b => b.category))).sort();

    const adminSelect = document.getElementById('admin-book-category-filter');
    const studentSelect = document.getElementById('student-book-category-filter');

    [adminSelect, studentSelect].forEach(select => {
      if (!select) return;
      const currentVal = select.value;
      select.innerHTML = '<option value="ALL">Semua Kategori</option>';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
      });
      if (categories.includes(currentVal)) {
        select.value = currentVal;
      }
    });
  },

  // ==========================================
  // PENGURUS / ADMIN RENDERING
  // ==========================================
  renderAdminDashboard() {
    this.renderAdminStats();
    this.renderAdminBooksTable();
    this.renderAdminBorrowingsTable();
  },

  renderAdminStats() {
    const totalBooks = AppState.books.length;
    const availableBooks = AppState.books.filter(b => b.status === 'Tersedia').length;
    const borrowedBooks = AppState.books.filter(b => b.status === 'Dipinjam').length;
    const totalBorrowings = AppState.borrowings.length;

    document.getElementById('stat-total-books').textContent = totalBooks;
    document.getElementById('stat-available-books').textContent = availableBooks;
    document.getElementById('stat-borrowed-books').textContent = borrowedBooks;
    document.getElementById('stat-total-borrowings').textContent = totalBorrowings;
  },

  renderAdminBooksTable() {
    const tbody = document.getElementById('admin-books-tbody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('admin-book-search')?.value || '').toLowerCase();
    const categoryFilter = document.getElementById('admin-book-category-filter')?.value || 'ALL';

    const filtered = AppState.books.filter(book => {
      const matchSearch = book.title.toLowerCase().includes(searchTerm) ||
                          book.author.toLowerCase().includes(searchTerm) ||
                          book.id.toLowerCase().includes(searchTerm);
      const matchCat = categoryFilter === 'ALL' || book.category === categoryFilter;
      return matchSearch && matchCat;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 2rem;">Tidak ada data buku yang sesuai.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(book => {
      const statusClass = book.status === 'Tersedia' ? 'badge-tersedia' : 'badge-dipinjam';
      return `
        <tr>
          <td><strong>${book.id}</strong></td>
          <td><strong>${this.escapeHtml(book.title)}</strong></td>
          <td>${this.escapeHtml(book.author)}</td>
          <td><span class="book-tag">${this.escapeHtml(book.category)}</span></td>
          <td>${book.year}</td>
          <td><span class="badge ${statusClass}">${book.status}</span></td>
          <td class="text-center">
            <div class="action-buttons">
              <button class="btn-edit-sm" onclick="UI.handleEditBook('${book.id}')" title="Edit Buku">
                Edit
              </button>
              <button class="btn-danger-sm" onclick="UI.handleDeleteBook('${book.id}')" title="Hapus Buku" ${book.status === 'Dipinjam' ? 'disabled' : ''}>
                Hapus
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  handleEditBook(bookId) {
    const book = AppState.books.find(b => b.id === bookId);
    if (book) {
      this.openBookModal(book);
    }
  },

  async handleDeleteBook(bookId) {
    const book = AppState.books.find(b => b.id === bookId);
    if (!book) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus buku "${book.title}" dari katalog perpustakaan?`)) return;

    try {
      await BookApi.remove(bookId);
      showToast(`Buku "${book.title}" berhasil dihapus dari sistem.`, 'success');
      await DataLoader.loadBooks();
      this.render();
    } catch (err) {
      showToast(err.message, 'danger', 4500);
    }
  },

  renderAdminBorrowingsTable() {
    const tbody = document.getElementById('admin-borrowings-tbody');
    if (!tbody) return;

    const statusFilter = document.getElementById('admin-borrowing-status-filter')?.value || 'ALL';

    const filtered = AppState.borrowings.filter(b => {
      return statusFilter === 'ALL' || b.status === statusFilter;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 2rem;">Belum ada catatan peminjaman dengan filter ini.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(trx => {
      const statusBadge = trx.status === 'Dipinjam'
        ? '<span class="badge badge-dipinjam">Dipinjam</span>'
        : '<span class="badge badge-dikembalikan">Dikembalikan</span>';

      const actionBtn = trx.status === 'Dipinjam'
        ? `<button class="btn-action-return" onclick="UI.handleReturnBook('${trx.id}')">Tandai Dikembalikan</button>`
        : '<span class="text-muted" style="font-size:0.75rem;">Selesai</span>';

      return `
        <tr>
          <td><strong>${trx.id}</strong></td>
          <td><strong>${this.escapeHtml(trx.bookTitle)}</strong></td>
          <td>
            <div>${this.escapeHtml(trx.userName)}</div>
            <small class="text-muted">NIM: ${trx.userNim}</small>
          </td>
          <td>${trx.borrowDate}</td>
          <td><strong class="text-primary">${trx.dueDate}</strong></td>
          <td>${trx.returnDate || '-'}</td>
          <td>${statusBadge}</td>
          <td class="text-center">${actionBtn}</td>
        </tr>
      `;
    }).join('');
  },

  async handleReturnBook(trxId) {
    if (!confirm('Konfirmasi pengembalian buku? Status buku akan otomatis kembali menjadi "Tersedia".')) return;
    const trx = AppState.borrowings.find(b => b.id === trxId);
    try {
      await BorrowingApi.returnBook(trxId);
      showToast(`Buku "${trx ? trx.bookTitle : ''}" berhasil dikembalikan! Status buku kini kembali "Tersedia".`, 'success', 4000);
      await Promise.all([DataLoader.loadBooks(), DataLoader.loadBorrowings()]);
      this.render();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  },

  // ==========================================
  // MAHASISWA / STUDENT RENDERING
  // ==========================================
  renderStudentDashboard() {
    const user = AppState.currentUser;
    if (!user) return;

    document.getElementById('student-display-name').textContent = user.name;
    document.getElementById('student-display-nim').textContent = user.nim || '-';

    // Kuota 3 Buku (Strict Limit)
    const activeBorrows = getActiveBorrowCount(user.id);
    const maxLimit = 3;
    const remainingQuota = Math.max(0, maxLimit - activeBorrows);

    const quotaBadge = document.getElementById('quota-count-badge');
    const progressBar = document.getElementById('quota-progress-bar');
    const quotaNote = document.getElementById('quota-note');

    quotaBadge.textContent = `${activeBorrows} / ${maxLimit} Buku`;
    const percent = Math.min(100, (activeBorrows / maxLimit) * 100);
    progressBar.style.width = `${percent}%`;

    if (activeBorrows >= maxLimit) {
      quotaBadge.classList.add('full');
      progressBar.classList.add('full');
      quotaNote.textContent = 'Batas kuota maksimal tercapai (3 buku). Anda harus mengembalikan buku sebelum meminjam buku lain.';
      quotaNote.style.color = '#fca5a5';
    } else {
      quotaBadge.classList.remove('full');
      progressBar.classList.remove('full');
      quotaNote.textContent = `Sisa kuota peminjaman Anda: ${remainingQuota} buku lagi.`;
      quotaNote.style.color = '#e0f2fe';
    }

    this.renderStudentBooksGrid();
    this.renderStudentBorrowingsTable();
  },

  renderStudentBooksGrid() {
    const grid = document.getElementById('student-books-grid');
    if (!grid) return;

    const searchTerm = (document.getElementById('student-book-search')?.value || '').toLowerCase();
    const categoryFilter = document.getElementById('student-book-category-filter')?.value || 'ALL';

    const filtered = AppState.books.filter(book => {
      const matchSearch = book.title.toLowerCase().includes(searchTerm) ||
                          book.author.toLowerCase().includes(searchTerm);
      const matchCat = categoryFilter === 'ALL' || book.category === categoryFilter;
      return matchSearch && matchCat;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="text-center text-muted" style="grid-column: 1/-1; padding: 2rem;">Tidak ada buku yang ditemukan.</div>`;
      return;
    }

    const activeCount = getActiveBorrowCount(AppState.currentUser.id);
    const isQuotaFull = activeCount >= 3;

    grid.innerHTML = filtered.map(book => {
      const isAvailable = book.status === 'Tersedia';
      const statusBadge = isAvailable
        ? '<span class="badge badge-tersedia">Tersedia</span>'
        : '<span class="badge badge-dipinjam">Dipinjam</span>';

      let buttonHtml = '';
      if (!isAvailable) {
        buttonHtml = `<button class="btn btn-secondary btn-block" disabled>Sedang Dipinjam</button>`;
      } else if (isQuotaFull) {
        buttonHtml = `<button class="btn btn-primary btn-block" onclick="UI.handleQuotaFullAttempt()" style="opacity:0.75;">Pinjam Buku (Kuota Penuh)</button>`;
      } else {
        buttonHtml = `<button class="btn btn-primary btn-block" onclick="UI.handleBorrowClick('${book.id}')">Pinjam Buku Ini</button>`;
      }

      return `
        <div class="book-card">
          <div>
            <div class="book-card-top">
              <span class="book-tag">${this.escapeHtml(book.category)}</span>
              ${statusBadge}
            </div>
            <h4 class="book-title">${this.escapeHtml(book.title)}</h4>
            <p class="book-author">Penulis: ${this.escapeHtml(book.author)}</p>
          </div>
          <div class="book-card-footer">
            <div class="book-meta">
              <span>Tahun: ${book.year}</span>
              <span>ID: ${book.id}</span>
            </div>
            ${buttonHtml}
          </div>
        </div>
      `;
    }).join('');
  },

  handleQuotaFullAttempt() {
    showToast('Peminjaman Ditolak! Anda telah mencapai batas maksimal 3 buku aktif yang sedang dipinjam. Kembalikan buku terlebih dahulu.', 'danger', 5000);
  },

  handleBorrowClick(bookId) {
    const book = AppState.books.find(b => b.id === bookId);
    if (book) {
      this.openBorrowModal(book);
    }
  },

  renderStudentBorrowingsTable() {
    const tbody = document.getElementById('student-borrowings-tbody');
    const countBadge = document.getElementById('student-my-borrow-count');
    if (!tbody) return;

    const myBorrowings = AppState.borrowings.filter(
      b => b.userId === AppState.currentUser.id
    );

    if (countBadge) {
      countBadge.textContent = myBorrowings.length;
    }

    if (myBorrowings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">Anda belum pernah melakukan peminjaman buku.</td></tr>`;
      return;
    }

    tbody.innerHTML = myBorrowings.map(trx => {
      const statusBadge = trx.status === 'Dipinjam'
        ? '<span class="badge badge-dipinjam">Sedang Dipinjam</span>'
        : '<span class="badge badge-dikembalikan">Sudah Dikembalikan</span>';

      return `
        <tr>
          <td><strong>${trx.id}</strong></td>
          <td><strong>${this.escapeHtml(trx.bookTitle)}</strong></td>
          <td>${trx.borrowDate}</td>
          <td><strong class="text-primary">${trx.dueDate}</strong> <small class="text-muted">(7 hari)</small></td>
          <td>${trx.returnDate || '<span class="text-muted">Belum</span>'}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

// ==========================================
// 8. BOOTSTRAP APPLICATION ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
