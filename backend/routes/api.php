<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\BorrowingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - SIPERPU Library System
| Single Gateway Authentication with Strict Role Authority
| Roles: 'pengurus' (Admin) & 'mahasiswa' (Student)
|--------------------------------------------------------------------------
*/

// 1. PUBLIC ROUTES (No Token Needed)
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'SIPERPU Backend API Service is healthy',
        'data' => [
            'service' => 'Laravel 12 API',
            'database' => config('database.default') . ' (siperpu_db)',
            'auth_gateway' => 'Single Pipeline (Laravel Sanctum Bearer Token)',
            'server_time' => now()->toIso8601String(),
        ],
        'errors' => null,
    ]);
});

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// 2. AUTHENTICATED ROUTES (Valid Bearer Token Required)
Route::middleware('auth:sanctum')->group(function () {

    // Common Auth Session
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Books Catalog (Accessible by both Pengurus and Mahasiswa)
    Route::get('/books', [BookController::class, 'index']);
    Route::get('/books/{id}', [BookController::class, 'show']);

    // ─────────────────────────────────────────────────────────────
    // 3. MAHASISWA (STUDENT) ONLY ROUTES
    // ─────────────────────────────────────────────────────────────
    Route::middleware('role:mahasiswa')->group(function () {
        Route::post('/borrowings/borrow', [BorrowingController::class, 'borrow']);
        Route::get('/borrowings/my', [BorrowingController::class, 'my']);
    });

    // ─────────────────────────────────────────────────────────────
    // 4. PENGURUS (ADMIN) ONLY ROUTES
    // ─────────────────────────────────────────────────────────────
    Route::middleware('role:pengurus')->group(function () {
        // Book Management (CRUD)
        Route::post('/books', [BookController::class, 'store']);
        Route::put('/books/{id}', [BookController::class, 'update']);
        Route::delete('/books/{id}', [BookController::class, 'destroy']);

        // Circulation Management
        Route::put('/borrowings/{id}/return', [BorrowingController::class, 'returnBook']);
        Route::get('/borrowings/all', [BorrowingController::class, 'all']);

        // Dashboard Statistics
        Route::get('/dashboard/stats', [BorrowingController::class, 'stats']);
    });
});
