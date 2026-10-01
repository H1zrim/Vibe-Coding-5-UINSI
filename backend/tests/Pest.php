<?php

use App\Models\Book;
use App\Models\Borrowing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class)->in('Feature');

function createApiUser(string $role = 'mahasiswa'): User
{
    static $sequence = 0;
    $sequence++;

    return User::create([
        'name' => "Pengguna {$sequence}",
        'username' => "pengguna{$sequence}",
        'email' => "pengguna{$sequence}@example.test",
        'nim' => $role === 'mahasiswa' ? "NIM{$sequence}" : null,
        'password' => 'password',
        'role' => $role,
    ]);
}

function createApiBook(string $id, string $status = 'Tersedia'): Book
{
    return Book::create([
        'id' => $id,
        'title' => "Buku {$id}",
        'author' => 'Penulis Tes',
        'category' => 'Teknologi',
        'year' => 2024,
        'status' => $status,
    ]);
}

function createApiBorrowing(User $user, Book $book, string $id, string $dueDate = '2026-10-08'): Borrowing
{
    return Borrowing::create([
        'id' => $id,
        'book_id' => $book->id,
        'user_id' => $user->id,
        'borrow_date' => '2026-10-01',
        'due_date' => $dueDate,
        'return_date' => null,
        'status' => 'Dipinjam',
    ]);
}

afterEach(function () {
    Carbon::setTestNow();
});
