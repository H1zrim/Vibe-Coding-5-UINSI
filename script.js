/**
 * SIPERPU - Sistem Peminjaman Buku Perpustakaan
 * Vanilla JavaScript implementation adhering to strict requirements:
 * - HTML5, CSS3, Vanilla JS, Browser localStorage
 * - Dual User Roles (Pengurus & Mahasiswa)
 * - CRUD Books & Return Management for Pengurus
 * - Real-time Availability, 3-Book Limit, and 7-day Due Date for Mahasiswa
 */

// ==========================================
// 1. STORAGE CONSTANTS & SEED DATA
// ==========================================
const STORAGE_KEYS = {
  USERS: 'siperpu_users',
  BOOKS: 'siperpu_books',
  BORROWINGS: 'siperpu_borrowings',
  CURRENT_USER: 'siperpu_current_user'
};

const INITIAL_USERS = [
  {
    id: 'u-admin',
    username: 'admin',
    password: '123',
    name: 'Bambang Sudarsono, S.Kom.',
    role: 'pengurus'
  },
  {
    id: 'u-mhs1',
    username: 'mhs1',
    password: '123',
    name: 'Budi Santoso',
    nim: '210001001',
    role: 'mahasiswa'
  },
  {
    id: 'u-mhs2',
    username: 'mhs2',
    password: '123',
    name: 'Siti Rahma',
    nim: '210001002',
    role: 'mahasiswa'
  }
];

const INITIAL_BOOKS = [
  {
    id: 'BK-001',
    title: 'Algoritma & Struktur Data Lanjut',
    author: 'Rinaldi Munir',
    category: 'Ilmu Komputer',
    year: 2022,
    status: 'Tersedia'
  },
  {
    id: 'BK-002',
    title: 'Pemrograman Web Modern Berbasis Komponen',
    author: 'Budi Raharjo',
    category: 'Teknologi',
    year: 2023,
    status: 'Tersedia'
  },
  {
    id: 'BK-003',
    title: 'Basis Data & Perancangan Sistem Relasional',
    author: 'Fathansyah',
    category: 'Basis Data',
    year: 2021,
    status: 'Dipinjam'
  },
  {
    id: 'BK-004',
    title: 'Rekayasa Perangkat Lunak: Pendekatan Praktisi',
    author: 'Roger S. Pressman',
    category: 'Rekayasa',
    year: 2020,
    status: 'Tersedia'
  },
  {
    id: 'BK-005',
    title: 'Pengantar Kecerdasan Buatan dan Robotika',
    author: 'Suyanto',
    category: 'Kecerdasan Buatan',
    year: 2024,
    status: 'Tersedia'
  }
];

const INITIAL_BORROWINGS = [
  {
    id: 'TRX-2026-001',
    bookId: 'BK-003',
    bookTitle: 'Basis Data & Perancangan Sistem Relasional',
    userId: 'u-mhs1',
    userName: 'Budi Santoso',
    userNim: '210001001',
    borrowDate: '2026-09-01',
    dueDate: '2026-09-08',
    returnDate: null,
    status: 'Dipinjam'
  }
];

// ==========================================
// 2. APPLICATION STATE
// ==========================================
const AppState = {
  users: [],
  books: [],
  borrowings: [],
  currentUser: null,
  pendingBorrowBook: null
};

// ==========================================
// 3. DATE UTILITIES (AUTOMATIC 7-DAY DUE DATE)
// ==========================================
/**
 * Format a Date object as YYYY-MM-DD string
 * @param {Date} date 
 * @returns {string} YYYY-MM-DD
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a Date object
 * @param {Date} date 
 * @param {number} days 
 * @returns {Date}
 */
function addDays(date, days) {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

// ==========================================
// 4. STORAGE SERVICE
// ==========================================
const StorageService = {
  init() {
    // Check if localStorage already has data; if not, seed default mock data
    if (!localStorage.getItem(STORAGE_KEYS.BOOKS)) {
      this.seedDefaultData();
    } else {
      this.loadAllData();
    }
  },

  seedDefaultData() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    localStorage.setItem(STORAGE_KEYS.BORROWINGS, JSON.stringify(INITIAL_BORROWINGS));
    this.loadAllData();
  },

  loadAllData() {
    try {
      AppState.users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || INITIAL_USERS;
      AppState.books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS)) || INITIAL_BOOKS;
      AppState.borrowings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BORROWINGS)) || INITIAL_BORROWINGS;
      AppState.currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
    } catch (e) {
      console.error('Failed to parse localStorage data:', e);
      this.seedDefaultData();
    }
  },

  saveBooks() {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(AppState.books));
  },

  saveBorrowings() {
    localStorage.setItem(STORAGE_KEYS.BORROWINGS, JSON.stringify(AppState.borrowings));
  },

  saveCurrentUser(user) {
    AppState.currentUser = user;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  resetAll() {
    localStorage.clear();
    this.seedDefaultData();
    AppState.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
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
// 6. BUSINESS LOGIC & BORROW VALIDATIONS
// ==========================================
const BorrowService = {
  /**
   * Count the number of active ("Dipinjam") books for a specific student
   * @param {string} userId 
   * @returns {number}
   */
  getActiveBorrowCount(userId) {
    return AppState.borrowings.filter(
      b => b.userId === userId && b.status === 'Dipinjam'
    ).length;
  },

  /**
   * Validate if a student is allowed to borrow a book
   * STRICT VALIDATION 1: Maximum 3 active borrowed books
   * STRICT VALIDATION 2: Book must currently be 'Tersedia'
   * @param {string} userId 
   * @param {string} bookId 
   * @returns {{ valid: boolean, message?: string }}
   */
  validateBorrowAttempt(userId, bookId) {
    const student = AppState.users.find(u => u.id === userId);
    if (!student || student.role !== 'mahasiswa') {
      return { valid: false, message: 'Hanya pengguna berstatus Mahasiswa yang dapat meminjam buku.' };
    }

    // STRICT VALIDATION 1: Check active borrow limit (Max 3)
    const activeCount = this.getActiveBorrowCount(userId);
    if (activeCount >= 3) {
      return {
        valid: false,
        message: `Peminjaman Ditolak! Anda sudah memiliki ${activeCount} buku aktif yang sedang dipinjam (Batas maksimal adalah 3 buku). Silakan kembalikan buku yang dipinjam terlebih dahulu.`
      };
    }

    // STRICT VALIDATION 2: Check book availability status
    const book = AppState.books.find(b => b.id === bookId);
    if (!book) {
      return { valid: false, message: 'Buku tidak ditemukan dalam katalog.' };
    }

    if (book.status !== 'Tersedia') {
      return {
        valid: false,
        message: `Peminjaman Ditolak! Buku "${book.title}" sedang berstatus "${book.status}" dan tidak dapat dipinjam oleh mahasiswa lain.`
      };
    }

    return { valid: true };
  },

  /**
   * Execute book borrowing transaction
   * - Automatically calculates borrow date (Today)
   * - Automatically calculates due date (Today + 7 days)
   * - Sets book status to "Dipinjam"
   * @param {string} userId 
   * @param {string} bookId 
   * @returns {boolean}
   */
  borrowBook(userId, bookId) {
    const validation = this.validateBorrowAttempt(userId, bookId);
    if (!validation.valid) {
      showToast(validation.message, 'danger', 5000);
      return false;
    }

    const student = AppState.users.find(u => u.id === userId);
    const book = AppState.books.find(b => b.id === bookId);

    const today = new Date();
    const dueDate = addDays(today, 7);

    const transactionId = `TRX-${today.getFullYear()}-${String(Date.now()).slice(-4)}`;

    const newBorrowing = {
      id: transactionId,
      bookId: book.id,
      bookTitle: book.title,
      userId: student.id,
      userName: student.name,
      userNim: student.nim || '-',
      borrowDate: formatDate(today),
      dueDate: formatDate(dueDate),
      returnDate: null,
      status: 'Dipinjam'
    };

    // Update book status
    book.status = 'Dipinjam';

    // Store records
    AppState.borrowings.unshift(newBorrowing);
    StorageService.saveBooks();
    StorageService.saveBorrowings();

    showToast(`Berhasil meminjam "${book.title}"! Batas waktu pengembalian adalah 7 hari (${newBorrowing.dueDate}).`, 'success', 4500);
    return true;
  },

  /**
   * Admin Return Book Transaction
   * Automatically sets book status back to "Tersedia"
   * @param {string} transactionId 
   * @returns {boolean}
   */
  returnBook(transactionId) {
    const trx = AppState.borrowings.find(b => b.id === transactionId);
    if (!trx) {
      showToast('Data transaksi peminjaman tidak ditemukan.', 'danger');
      return false;
    }

    if (trx.status === 'Dikembalikan') {
      showToast('Buku untuk transaksi ini sudah dikembalikan sebelumnya.', 'warning');
      return false;
    }

    // Set transaction status and return date
    trx.status = 'Dikembalikan';
    trx.returnDate = formatDate(new Date());

    // Automatically set the corresponding book status back to "Tersedia"
    const book = AppState.books.find(b => b.id === trx.bookId);
    if (book) {
      book.status = 'Tersedia';
    }

    StorageService.saveBooks();
    StorageService.saveBorrowings();

    showToast(`Buku "${trx.bookTitle}" berhasil dikembalikan! Status buku kini kembali "Tersedia".`, 'success', 4000);
    return true;
  }
};

// ==========================================
// 7. BOOK CRUD SERVICE (FOR PENGURUS)
// ==========================================
const BookService = {
  addBook(data) {
    const newId = `BK-${String(AppState.books.length + 1).padStart(3, '0')}`;
    const newBook = {
      id: newId,
      title: data.title.trim(),
      author: data.author.trim(),
      category: data.category.trim(),
      year: parseInt(data.year, 10),
      status: 'Tersedia'
    };

    AppState.books.push(newBook);
    StorageService.saveBooks();
    showToast(`Buku baru "${newBook.title}" berhasil ditambahkan ke katalog.`, 'success');
    return newBook;
  },

  updateBook(id, data) {
    const book = AppState.books.find(b => b.id === id);
    if (!book) {
      showToast('Buku tidak ditemukan.', 'danger');
      return false;
    }

    book.title = data.title.trim();
    book.author = data.author.trim();
    book.category = data.category.trim();
    book.year = parseInt(data.year, 10);

    // Also update any active borrowing record's bookTitle for consistency
    AppState.borrowings.forEach(b => {
      if (b.bookId === id) {
        b.bookTitle = book.title;
      }
    });

    StorageService.saveBooks();
    StorageService.saveBorrowings();
    showToast(`Perubahan buku "${book.title}" berhasil disimpan.`, 'success');
    return true;
  },

  deleteBook(id) {
    const book = AppState.books.find(b => b.id === id);
    if (!book) {
      showToast('Buku tidak ditemukan.', 'danger');
      return false;
    }

    // Validation: Cannot delete if book is currently borrowed
    if (book.status === 'Dipinjam') {
      showToast(`Gagal menghapus: Buku "${book.title}" tidak dapat dihapus karena saat ini sedang Dipinjam oleh mahasiswa!`, 'danger', 4500);
      return false;
    }

    const confirmed = confirm(`Apakah Anda yakin ingin menghapus buku "${book.title}" dari katalog perpustakaan?`);
    if (!confirmed) return false;

    AppState.books = AppState.books.filter(b => b.id !== id);
    StorageService.saveBooks();
    showToast(`Buku "${book.title}" berhasil dihapus dari sistem.`, 'success');
    return true;
  }
};

// ==========================================
// 8. UI CONTROLLER & RENDERING
// ==========================================
const UI = {
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Demo User Quick Click Login Buttons
    document.querySelectorAll('.btn-demo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = btn.dataset.user;
        const user = AppState.users.find(u => u.username === username);
        if (user) {
          StorageService.saveCurrentUser(user);
          showToast(`Selamat datang, ${user.name}! (${user.role.toUpperCase()})`, 'success');
          this.render();
        }
      });
    });

    // Manual Login Form Submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('login-username').value.trim();
        const passwordInput = document.getElementById('login-password').value.trim();

        const user = AppState.users.find(
          u => u.username.toLowerCase() === usernameInput.toLowerCase() && u.password === passwordInput
        );

        if (user) {
          StorageService.saveCurrentUser(user);
          loginForm.reset();
          showToast(`Login berhasil! Selamat datang, ${user.name}.`, 'success');
          this.render();
        } else {
          showToast('Username atau password salah. Coba: admin / 123 atau mhs1 / 123', 'danger');
        }
      });
    }

    // Logout / Role Switcher Button
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        StorageService.saveCurrentUser(null);
        showToast('Anda telah keluar dari sistem.', 'info');
        this.render();
      });
    }

    // Reset Demo Data Button
    const btnReset = document.getElementById('btn-reset-demo');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin mereset seluruh data kembali ke kondisi awal (default)?')) {
          StorageService.resetAll();
          showToast('Seluruh data berhasil di-reset ke data bawaan demo.', 'success');
          this.render();
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

    // Book Form Submit (Add or Edit)
    const formBook = document.getElementById('form-book');
    if (formBook) {
      formBook.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('book-edit-id').value;
        const bookData = {
          title: document.getElementById('book-title').value,
          author: document.getElementById('book-author').value,
          category: document.getElementById('book-category').value,
          year: document.getElementById('book-year').value
        };

        if (editId) {
          BookService.updateBook(editId, bookData);
        } else {
          BookService.addBook(bookData);
        }

        this.closeBookModal();
        this.render();
      });
    }

    // Student Borrow Modal Events
    document.getElementById('btn-close-borrow-modal')?.addEventListener('click', () => this.closeBorrowModal());
    document.getElementById('btn-cancel-borrow')?.addEventListener('click', () => this.closeBorrowModal());

    const btnExecuteBorrow = document.getElementById('btn-execute-borrow');
    if (btnExecuteBorrow) {
      btnExecuteBorrow.addEventListener('click', () => {
        if (!AppState.pendingBorrowBook || !AppState.currentUser) return;
        const success = BorrowService.borrowBook(AppState.currentUser.id, AppState.pendingBorrowBook.id);
        this.closeBorrowModal();
        if (success) {
          this.render();
        }
      });
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
    // Check validation first before opening confirmation modal
    if (!AppState.currentUser) return;
    const validation = BorrowService.validateBorrowAttempt(AppState.currentUser.id, book.id);
    if (!validation.valid) {
      showToast(validation.message, 'danger', 5000);
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
      // User is not logged in: show login screen only
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

  handleDeleteBook(bookId) {
    const deleted = BookService.deleteBook(bookId);
    if (deleted) {
      this.render();
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

  handleReturnBook(trxId) {
    if (confirm('Konfirmasi pengembalian buku? Status buku akan otomatis kembali menjadi "Tersedia".')) {
      const success = BorrowService.returnBook(trxId);
      if (success) {
        this.render();
      }
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

    // Strict 3-Book Limit Quota Meter
    const activeBorrows = BorrowService.getActiveBorrowCount(user.id);
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

    // Render Student Tab 1: Book Catalog Grid
    this.renderStudentBooksGrid();

    // Render Student Tab 2: Personal Borrow History
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

    const activeCount = BorrowService.getActiveBorrowCount(AppState.currentUser.id);
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
// 9. BOOTSTRAP APPLICATION ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  StorageService.init();
  UI.init();
});
