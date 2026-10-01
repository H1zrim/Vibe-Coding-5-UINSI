import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBooks } from '../hooks/useBooks';
import { useBorrowings } from '../hooks/useBorrowings';
import { QuotaMeter } from '../components/QuotaMeter';
import { BookCard } from '../components/BookCard';
import { BorrowModal } from '../components/BorrowModal';
import { Search, Filter, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export const CatalogPage = () => {
  const { user } = useAuth();
  const { books, categories, loading: booksLoading, params, setParams, refetch: refetchBooks } = useBooks();
  const { activeCount, isQuotaFull, borrowBook, refetch: refetchBorrowings } = useBorrowings('student');

  const [selectedBook, setSelectedBook] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [borrowingAction, setBorrowingAction] = useState(false);

  const handleBorrowClick = (book) => {
    if (isQuotaFull) {
      toast.error(
        `Peminjaman Ditolak! Anda sudah memiliki ${activeCount} buku aktif yang sedang dipinjam (Batas maksimal 3 buku). Silakan kembalikan buku terlebih dahulu.`,
        { duration: 5000 }
      );
      return;
    }
    setSelectedBook(book);
    setModalOpen(true);
  };

  const handleConfirmBorrow = async (bookId) => {
    setBorrowingAction(true);
    const success = await borrowBook(bookId);
    setBorrowingAction(false);
    if (success) {
      setModalOpen(false);
      refetchBooks();
      refetchBorrowings();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Student Hero Banner with Quota Meter */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 mb-8 text-white shadow-xl shadow-blue-500/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white inline-block mb-3">
            Portal Peminjaman Mahasiswa
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {user?.name}!
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            NIM: {user?.nim || '-'} &bull; Temukan dan pinjam koleksi buku literatur akademik untuk perkuliahan Anda.
          </p>
        </div>

        <div className="w-full lg:w-96 shrink-0">
          <QuotaMeter activeCount={activeCount} />
        </div>
      </div>

      {/* Catalog Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Katalog Buku Perpustakaan
          </h2>
          <p className="text-xs text-slate-500">Pilih buku yang berstatus Tersedia untuk dipinjam.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul atau pengarang..."
              value={params.search || ''}
              onChange={(e) => setParams({ ...params, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={params.category || 'ALL'}
              onChange={(e) => setParams({ ...params, category: e.target.value })}
              className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
            >
              {['ALL', ...categories].map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Books Card Grid */}
      {booksLoading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Memuat koleksi buku dari server...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-base font-semibold text-slate-700">Tidak ada buku yang sesuai.</p>
          <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian atau kategori lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onBorrow={handleBorrowClick}
              isQuotaFull={isQuotaFull}
              isStudent={true}
            />
          ))}
        </div>
      )}

      {/* Borrow Confirmation Modal */}
      <BorrowModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        book={selectedBook}
        onConfirm={handleConfirmBorrow}
        loading={borrowingAction}
      />
    </div>
  );
};
