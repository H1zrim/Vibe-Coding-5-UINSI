import React from 'react';
import { AlertTriangle, CheckCircle2, BookmarkCheck } from 'lucide-react';

export const QuotaMeter = ({ activeCount = 0 }) => {
  const maxLimit = 3;
  const remaining = Math.max(0, maxLimit - activeCount);
  const percentage = Math.min(100, Math.round((activeCount / maxLimit) * 100));
  const isFull = activeCount >= maxLimit;

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-blue-100">
          <BookmarkCheck className="w-4 h-4 text-emerald-300" />
          <span>Status Kuota Peminjaman Aktif</span>
        </div>
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full ${
            isFull
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
          }`}
        >
          {activeCount} / {maxLimit} Buku
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-black/25 h-3 rounded-full overflow-hidden p-0.5 mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFull ? 'bg-rose-400' : activeCount === 2 ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Note / Feedback */}
      <div className="flex items-center gap-2 text-xs">
        {isFull ? (
          <>
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
            <span className="text-rose-200 font-medium">
              Batas kuota maksimal tercapai (3 buku). Anda harus mengembalikan buku sebelum meminjam buku lain.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="text-blue-100">
              Sisa kuota peminjaman Anda: <strong>{remaining} buku lagi</strong>.
            </span>
          </>
        )}
      </div>
    </div>
  );
};
