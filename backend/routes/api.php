<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\BorrowingController;
use Illuminate\Support\Facades\Route;

// Health Check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'SIPERPU Backend API Service is healthy',
        'data' => [
            'database' => config('database.default'),
            'auth_gateway' => 'Laravel Sanctum Bearer Token',
            'timestamp' => now()->toIso8601String(),
        ],
        'errors' => null,
    ]);
});

// Single Gateway Auth Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// Protected Application Routes (Protected via Single Sanctum Token)
Route::middleware('auth:sanctum')->group(function () {
    // Books Catalog & CRUD
    Route::get('/books', [BookController::class, 'index']);
    Route::get('/books/{id}', [BookController::class, 'show']);
    Route::post('/books', [BookController::class, 'store']);
    Route::put('/books/{id}', [BookController::class, 'update']);
    Route::delete('/books/{id}', [BookController::class, 'destroy']);

    // Borrowings & Circulation
    Route::post('/borrowings/borrow', [BorrowingController::class, 'borrow']);
    Route::put('/borrowings/{id}/return', [BorrowingController::class, 'returnBook']);
    Route::get('/borrowings/my', [BorrowingController::class, 'my']);
    Route::get('/borrowings/all', [BorrowingController::class, 'all']);

    // Dashboard Statistics
    Route::get('/dashboard/stats', [BorrowingController::class, 'stats']);
});
