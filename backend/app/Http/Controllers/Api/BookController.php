<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookRequest;
use App\Http\Resources\BookResource;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Book::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->category !== 'ALL') {
            $query->where('category', $request->category);
        }

        $books = $query->orderBy('id', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar buku berhasil dimuat.',
            'data' => BookResource::collection($books)->resolve(),
            'errors' => null,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $book = Book::find($id);

        if (! $book) {
            return response()->json([
                'success' => false,
                'message' => 'Buku tidak ditemukan.',
                'data' => null,
                'errors' => null,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail buku.',
            'data' => (new BookResource($book))->resolve(),
            'errors' => null,
        ]);
    }

    public function store(StoreBookRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Auto-generate Book ID (BK-00X)
        $count = Book::count();
        $nextNum = $count + 1;
        $id = 'BK-'.str_pad((string) $nextNum, 3, '0', STR_PAD_LEFT);
        while (Book::where('id', $id)->exists()) {
            $nextNum++;
            $id = 'BK-'.str_pad((string) $nextNum, 3, '0', STR_PAD_LEFT);
        }

        $book = Book::create([
            'id' => $id,
            'title' => $data['title'],
            'author' => $data['author'],
            'category' => $data['category'],
            'year' => (int) $data['year'],
            'status' => 'Tersedia', // RULE-02: Binary status per single physical copy
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Buku baru berhasil ditambahkan ke katalog.',
            'data' => ['book' => (new BookResource($book))->resolve()],
            'errors' => null,
        ], 201);
    }

    public function update(StoreBookRequest $request, string $id): JsonResponse
    {
        $book = Book::find($id);
        if (! $book) {
            return response()->json([
                'success' => false,
                'message' => 'Buku tidak ditemukan.',
                'data' => null,
                'errors' => null,
            ], 404);
        }

        $data = $request->validated();

        $book->update([
            'title' => $data['title'],
            'author' => $data['author'],
            'category' => $data['category'],
            'year' => (int) $data['year'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data buku berhasil diperbarui.',
            'data' => ['book' => (new BookResource($book))->resolve()],
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($request->user()->role !== 'pengurus') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Fitur ini hanya untuk Pengurus Perpustakaan.',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        return DB::transaction(function () use ($id): JsonResponse {
            $book = Book::query()->whereKey($id)->lockForUpdate()->first();

            if (! $book) {
                return response()->json([
                    'success' => false,
                    'message' => 'Buku tidak ditemukan.',
                    'data' => null,
                    'errors' => null,
                ], 404);
            }

            $hasActiveBorrowing = $book->borrowings()->where('status', 'Dipinjam')->exists();
            if ($book->isBorrowed() || $hasActiveBorrowing) {
                return response()->json([
                    'success' => false,
                    'message' => "Buku '{$book->title}' tidak dapat dihapus karena sedang dipinjam.",
                    'data' => null,
                    'errors' => null,
                ], 422);
            }

            $book->delete();

            return response()->json([
                'success' => true,
                'message' => 'Buku berhasil dihapus',
                'data' => null,
                'errors' => null,
            ]);
        });
    }
}
