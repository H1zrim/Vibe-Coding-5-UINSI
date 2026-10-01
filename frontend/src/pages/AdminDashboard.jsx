import React, { useEffect, useState } from 'react';
import { BookPlus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BookModal } from '../components/BookModal';
import { useBooks } from '../hooks/useBooks';
import { borrowingsApi } from '../api/borrowingsApi';

const statItems = [
  { key: 'total_books', label: 'Total buku' },
  { key: 'available_books', label: 'Tersedia' },
  { key: 'borrowed_books', label: 'Sedang dipinjam' },
  { key: 'overdue_count', label: 'Terlambat' },
];

export const AdminDashboard = () => {
  const { books, loading, createBook, updateBook, deleteBook } = useBooks();
  const [stats, setStats] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  useEffect(() => {
    let mounted = true;

    borrowingsApi.getDashboardStats()
      .then((response) => {
        if (mounted && response.success) setStats(response.data);
      })
      .catch((error) => toast.error(error.response?.data?.message || 'Gagal memuat statistik'));

    return () => { mounted = false; };
  }, []);

  const openCreate = () => {
    setEditingBook(null);
    setModalOpen(true);
  };

  const openEdit = (book) => {
    setEditingBook(book);
    setModalOpen(true);
  };

  const saveBook = async (formData) => {
    setSaving(true);
    const saved = editingBook
      ? await updateBook(editingBook.id, formData)
      : await createBook(formData);
    setSaving(false);

    if (saved) {
      setModalOpen(false);
      setEditingBook(null);
    }
  };

  const removeBook = async (book) => {
    if (window.confirm(`Hapus buku "${book.title}" dari katalog?`)) {
      await deleteBook(book.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-7">
        <div>
          <p className="text-xs font-bold uppercase text-blue-700">Pengelolaan koleksi</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Dashboard Pengurus</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <BookPlus className="h-4 w-4" />
          Tambah buku
        </button>
      </div>

      <section aria-label="Statistik perpustakaan" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statItems.map(({ key, label }) => (
          <div key={key} className="border-l-2 border-blue-700 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.[key] ?? '—'}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">Katalog buku</h2>
          <span className="text-xs text-slate-500">{books.length} judul</span>
        </div>
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Memuat katalog...</p>
        ) : books.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Belum ada buku dalam katalog.</p>
        ) : (
          <div className="overflow-x-auto border-y border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Buku</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Tahun</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((book) => (
                  <tr key={book.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{book.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{book.author} · {book.id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{book.category}</td>
                    <td className="px-4 py-3 text-slate-600">{book.year}</td>
                    <td className="px-4 py-3">
                      <span className={book.status === 'Tersedia' ? 'text-emerald-700' : 'text-amber-700'}>
                        {book.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" title="Edit buku" aria-label={`Edit ${book.title}`} onClick={() => openEdit(book)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" title="Hapus buku" aria-label={`Hapus ${book.title}`} onClick={() => removeBook(book)} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <BookModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={saveBook}
        book={editingBook}
        loading={saving}
      />
    </div>
  );
};