<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Borrowing;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BorrowingService
{
    public function borrow(User $user, string $bookId): Borrowing
    {
        return DB::transaction(function () use ($user, $bookId): Borrowing {
            $lockedUser = User::query()->whereKey($user->id)->lockForUpdate()->first();

            if (! $lockedUser) {
                abort(401, 'Sesi pengguna tidak lagi tersedia.');
            }

            $activeCount = Borrowing::query()
                ->where('user_id', $lockedUser->id)
                ->where('status', 'Dipinjam')
                ->count();

            if ($activeCount >= 3) {
                abort(422, 'Peminjaman ditolak. Batas maksimal 3 buku aktif telah tercapai.');
            }

            $book = Book::query()->whereKey($bookId)->lockForUpdate()->first();

            if (! $book) {
                abort(404, 'Buku tidak ditemukan.');
            }

            if (! $book->isAvailable()) {
                abort(422, 'Buku sedang dipinjam dan belum tersedia.');
            }

            $borrowDate = Carbon::today();
            $book->update(['status' => 'Dipinjam']);

            return Borrowing::create([
                'id' => (string) Str::uuid(),
                'book_id' => $book->id,
                'user_id' => $lockedUser->id,
                'borrow_date' => $borrowDate->toDateString(),
                'due_date' => $borrowDate->copy()->addDays(7)->toDateString(),
                'return_date' => null,
                'status' => 'Dipinjam',
            ])->load(['book', 'user']);
        });
    }

    public function returnBook(string $borrowingId): Borrowing
    {
        return DB::transaction(function () use ($borrowingId): Borrowing {
            $borrowing = Borrowing::query()->whereKey($borrowingId)->lockForUpdate()->first();

            if (! $borrowing) {
                abort(404, 'Catatan transaksi peminjaman tidak ditemukan.');
            }

            if ($borrowing->status === 'Dikembalikan') {
                abort(422, 'Buku untuk transaksi ini sudah dikembalikan.');
            }

            $book = Book::query()->whereKey($borrowing->book_id)->lockForUpdate()->first();

            if (! $book) {
                abort(404, 'Buku pada transaksi ini tidak ditemukan.');
            }

            $borrowing->update([
                'status' => 'Dikembalikan',
                'return_date' => Carbon::today()->toDateString(),
            ]);
            $book->update(['status' => 'Tersedia']);

            return $borrowing->load(['book', 'user']);
        });
    }
}
