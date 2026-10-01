import React from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useBorrowings } from '../hooks/useBorrowings';

export const AdminLoansPage = () => {
  const {
    borrowings,
    loading,
    filterStatus,
    setFilterStatus,
    filterOverdue,
    setFilterOverdue,
    returnBook,
  } = useBorrowings('admin');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase text-blue-700">Sirkulasi</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Peminjaman dan pengembalian</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="loan-status">Filter status</label>
          <select id="loan-status" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="ALL">Semua status</option>
            <option value="Dipinjam">Dipinjam</option>
            <option value="Dikembalikan">Dikembalikan</option>
          </select>
          <label className="sr-only" htmlFor="loan-overdue">Filter keterlambatan</label>
          <select id="loan-overdue" value={filterOverdue} onChange={(event) => setFilterOverdue(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="ALL">Semua jatuh tempo</option>
            <option value="true">Terlambat</option>
            <option value="false">Tidak terlambat</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Memuat sirkulasi...</p>
      ) : borrowings.length === 0 ? (
        <p className="border-y border-slate-200 py-10 text-center text-sm text-slate-500">Tidak ada transaksi untuk filter ini.</p>
      ) : (
        <div className="overflow-x-auto border-y border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Mahasiswa</th>
                <th className="px-4 py-3 font-semibold">Buku</th>
                <th className="px-4 py-3 font-semibold">Tanggal pinjam</th>
                <th className="px-4 py-3 font-semibold">Jatuh tempo</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {borrowings.map((borrowing) => (
                <tr key={borrowing.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{borrowing.user?.name || 'Pengguna tidak tersedia'}</p>
                    <p className="text-xs text-slate-500">{borrowing.user?.nim || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{borrowing.book?.title || 'Buku tidak tersedia'}</p>
                    <p className="text-xs text-slate-500">{borrowing.book_id}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{borrowing.borrow_date}</td>
                  <td className={`px-4 py-3 ${borrowing.is_overdue ? 'font-semibold text-red-700' : 'text-slate-600'}`}>
                    {borrowing.due_date}
                    {borrowing.is_overdue && <span className="ml-1">· terlambat</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      {borrowing.is_overdue ? <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                      {borrowing.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {borrowing.status === 'Dipinjam' && (
                      <button type="button" onClick={() => returnBook(borrowing.id)} title="Tandai sudah dikembalikan" aria-label={`Kembalikan ${borrowing.book?.title || borrowing.book_id}`} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Kembalikan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};