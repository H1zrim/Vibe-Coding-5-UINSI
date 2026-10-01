import React from 'react';
import { AlertTriangle, BookOpen, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useBorrowings } from '../hooks/useBorrowings';

export const StudentHistoryPage = () => {
  const { borrowings, activeCount, loading } = useBorrowings('student');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase text-blue-700">Akun mahasiswa</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Riwayat peminjaman</h1>
        </div>
        <p className="text-sm text-slate-500">{activeCount} buku masih dipinjam</p>
      </div>

      {loading ? (
        <p className="border-y border-slate-200 py-10 text-center text-sm text-slate-500">Memuat riwayat...</p>
      ) : borrowings.length === 0 ? (
        <div className="border-y border-slate-200 py-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-800">Belum ada transaksi peminjaman.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
          {borrowings.map((borrowing) => (
            <li key={borrowing.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{borrowing.book?.title || 'Buku tidak tersedia'}</p>
                <p className="mt-1 text-xs text-slate-500">{borrowing.book?.author || borrowing.book_id} · Transaksi {borrowing.id}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Pinjam {borrowing.borrow_date}</span>
                <span className={`inline-flex items-center gap-1.5 ${borrowing.is_overdue ? 'font-semibold text-red-700' : ''}`}>
                  {borrowing.is_overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
                  Jatuh tempo {borrowing.due_date}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  {borrowing.status === 'Dikembalikan' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <BookOpen className="h-3.5 w-3.5 text-blue-700" />}
                  {borrowing.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};