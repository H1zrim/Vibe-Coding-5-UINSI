import React from 'react';
import { Book, CheckCircle, Clock } from 'lucide-react';

export const BookCard = ({ book, onBorrow, isQuotaFull = false, isStudent = true }) => {
  const isAvailable = book.status === 'Tersedia';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
            {book.category}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isAvailable ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {book.status}
          </span>
        </div>

        {/* Title & Author */}
        <h3 className="text-base font-bold text-slate-900 leading-snug mb-1 group-hover:text-blue-600 transition">
          {book.title}
        </h3>
        <p className="text-xs text-slate-500 mb-4">Penulis: {book.author}</p>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-3 border-t border-dashed border-slate-200">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
          <span>Tahun: {book.year}</span>
          <span className="font-mono">ID: {book.id}</span>
        </div>

        {isStudent && (
          <div>
            {isAvailable ? (
              <button
                onClick={() => onBorrow(book)}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition shadow-sm ${
                  isQuotaFull
                    ? 'bg-blue-600/70 text-white cursor-pointer hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isQuotaFull ? 'Pinjam Buku (Kuota Penuh)' : 'Pinjam Buku Ini'}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              >
                Sedang Dipinjam
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
