import React from 'react';
import { X, Calendar, BookOpen, AlertCircle } from 'lucide-react';

export const BorrowModal = ({ isOpen, onClose, book, onConfirm, loading = false }) => {
  if (!isOpen || !book) return null;

  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(today);
  const dueStr = formatDate(dueDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Konfirmasi Peminjaman Buku
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            Anda akan melakukan peminjaman buku berikut:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
            <h4 className="font-bold text-slate-900 text-base mb-1">{book.title}</h4>
            <p className="text-xs text-slate-500 mb-3">
              Penulis: {book.author} ({book.year}) &bull; Kategori: {book.category}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dashed border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Tanggal Pinjam:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {todayStr}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Batas Pengembalian:</span>
                <span className="font-bold text-blue-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-700" />
                  {dueStr} (+7 Hari)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Batas waktu peminjaman adalah tepat <strong>7 hari kalender</strong>. Pastikan mengembalikan buku sebelum jatuh tempo untuk menghindari status keterlambatan.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(book.id)}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Setujui & Pinjam Buku'}
          </button>
        </div>
      </div>
    </div>
  );
};
