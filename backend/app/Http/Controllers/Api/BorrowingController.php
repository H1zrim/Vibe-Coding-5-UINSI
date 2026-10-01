<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BorrowRequest;
use App\Http\Requests\FilterBorrowingsRequest;
use App\Http\Resources\BorrowingResource;
use App\Models\Book;
use App\Models\Borrowing;
use App\Services\BorrowingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BorrowingController extends Controller
{
    /**
     * Borrow a book (Mahasiswa only):
     * Implements RULE-01, RULE-02, RULE-03 inside an atomic DB transaction.
     */
    public function borrow(BorrowRequest $request, BorrowingService $service): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'mahasiswa') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengguna berstatus Mahasiswa yang dapat meminjam buku.',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        $borrowing = $service->borrow($user, $request->validated('book_id'));

        return response()->json([
            'success' => true,
            'message' => 'Peminjaman buku berhasil.',
            'data' => ['borrowing' => (new BorrowingResource($borrowing))->resolve()],
            'errors' => null,
        ], 201);
    }

    /**
     * Return a book (Admin only):
     * Implements RULE-04 (Auto sync book status back to Tersedia).
     */
    public function returnBook(Request $request, string $id, BorrowingService $service): JsonResponse
    {
        if ($request->user()->role !== 'pengurus') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Fitur ini hanya untuk Pengurus Perpustakaan.',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        $borrowing = $service->returnBook($id);

        return response()->json([
            'success' => true,
            'message' => 'Buku berhasil dikembalikan.',
            'data' => ['borrowing' => (new BorrowingResource($borrowing))->resolve()],
            'errors' => null,
        ]);
    }

    /**
     * Get student's personal loan history (Mahasiswa)
     */
    public function my(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'mahasiswa') {
            return response()->json([
                'success' => false,
                'message' => 'Riwayat ini hanya tersedia untuk Mahasiswa.',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        $borrowings = Borrowing::with('book')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat peminjaman pribadi.',
            'data' => BorrowingResource::collection($borrowings)->resolve(),
            'errors' => null,
        ]);
    }

    /**
     * Get all loan history (Admin only)
     */
    public function all(FilterBorrowingsRequest $request): JsonResponse
    {
        $query = Borrowing::with(['book', 'user'])->orderBy('created_at', 'desc');

        if ($request->filled('status') && $request->validated('status') !== 'ALL') {
            $query->where('status', $request->validated('status'));
        }

        if ($request->has('overdue') && $request->filled('overdue')) {
            if ($request->boolean('overdue')) {
                $query->whereNull('return_date')->whereDate('due_date', '<', today());
            } else {
                $query->where(function ($borrowings) {
                    $borrowings->whereNotNull('return_date')->orWhereDate('due_date', '>=', today());
                });
            }
        }

        $borrowings = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Seluruh catatan sirkulasi peminjaman.',
            'data' => BorrowingResource::collection($borrowings)->resolve(),
            'errors' => null,
        ]);
    }

    /**
     * Dashboard statistics summary (Admin)
     */
    public function stats(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'pengurus') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        $totalBooks = Book::count();
        $availableBooks = Book::where('status', 'Tersedia')->count();
        $borrowedBooks = Book::where('status', 'Dipinjam')->count();
        // Calculate overdue count (RULE-06)
        $overdueCount = Borrowing::whereNull('return_date')
            ->whereDate('due_date', '<', today())
            ->count();

        return response()->json([
            'success' => true,
            'message' => 'Statistik perpustakaan.',
            'data' => [
                'total_books' => $totalBooks,
                'available_books' => $availableBooks,
                'borrowed_books' => $borrowedBooks,
                'overdue_count' => $overdueCount,
            ],
            'errors' => null,
        ]);
    }
}
