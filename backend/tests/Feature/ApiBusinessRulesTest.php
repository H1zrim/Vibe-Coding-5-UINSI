<?php

use App\Models\Book;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;

it('ignores a requested role during student registration', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Mahasiswa Tes',
        'username' => 'mahasiswa-tes',
        'nim' => '123456',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'pengurus',
    ]);

    expect($response->status())->toBe(201)
        ->and($response->json('data.user.role'))->toBe('mahasiswa')
        ->and($response->json('data.user'))->not->toHaveKey('username');
});

it('returns validation errors in the standard envelope', function () {
    $response = $this->postJson('/api/auth/login', []);

    expect($response->status())->toBe(422)
        ->and($response->json('success'))->toBeFalse()
        ->and($response->json('errors'))->toHaveKey('username')
        ->and($response->json('data'))->toBeNull();
});

it('forbids students from creating books', function () {
    Sanctum::actingAs(createApiUser());

    $response = $this->postJson('/api/books', [
        'title' => 'Buku Ditolak',
        'author' => 'Penulis Tes',
        'category' => 'Teknologi',
        'year' => 2024,
    ]);

    expect($response->status())->toBe(403)
        ->and($response->json('success'))->toBeFalse()
        ->and($response->json('errors'))->toBeNull();
});

it('rejects borrowing a fourth active book', function () {
    Carbon::setTestNow('2026-10-01 12:00:00');
    $student = createApiUser();

    foreach (range(1, 3) as $number) {
        $book = createApiBook("ACTIVE-{$number}", 'Dipinjam');
        createApiBorrowing($student, $book, "ACTIVE-TRX-{$number}");
    }

    $availableBook = createApiBook('AVAILABLE-4');
    Sanctum::actingAs($student);

    $response = $this->postJson('/api/borrowings/borrow', ['book_id' => $availableBook->id]);

    expect($response->status())->toBe(422)
        ->and($response->json('success'))->toBeFalse()
        ->and($response->json('errors'))->toBeNull();
});

it('sets the borrowing dates and synchronizes the book status', function () {
    Carbon::setTestNow('2026-10-01 12:00:00');
    $student = createApiUser();
    $book = createApiBook('DATE-TEST');
    Sanctum::actingAs($student);

    $response = $this->postJson('/api/borrowings/borrow', ['book_id' => $book->id]);

    expect($response->status())->toBe(201)
        ->and($response->json('data.borrowing.borrow_date'))->toBe('2026-10-01')
        ->and($response->json('data.borrowing.due_date'))->toBe('2026-10-08')
        ->and(Book::findOrFail($book->id)->status)->toBe('Dipinjam');
});

it('rejects a second student borrowing a borrowed book', function () {
    $firstStudent = createApiUser();
    $secondStudent = createApiUser();
    $book = createApiBook('SINGLE-COPY', 'Dipinjam');
    createApiBorrowing($firstStudent, $book, 'SINGLE-COPY-TRX');
    Sanctum::actingAs($secondStudent);

    $response = $this->postJson('/api/borrowings/borrow', ['book_id' => $book->id]);

    expect($response->status())->toBe(422)
        ->and($response->json('success'))->toBeFalse();
});

it('returns a book atomically and records today as the return date', function () {
    Carbon::setTestNow('2026-10-01 12:00:00');
    $student = createApiUser();
    $admin = createApiUser('pengurus');
    $book = createApiBook('RETURN-TEST', 'Dipinjam');
    $borrowing = createApiBorrowing($student, $book, 'RETURN-TRX');
    Sanctum::actingAs($admin);

    $response = $this->putJson("/api/borrowings/{$borrowing->id}/return");

    expect($response->status())->toBe(200)
        ->and($response->json('data.borrowing.status'))->toBe('Dikembalikan')
        ->and($response->json('data.borrowing.return_date'))->toBe('2026-10-01')
        ->and(Book::findOrFail($book->id)->status)->toBe('Tersedia');
});

it('prevents an admin from deleting a borrowed book', function () {
    $student = createApiUser();
    $admin = createApiUser('pengurus');
    $book = createApiBook('DELETE-TEST', 'Dipinjam');
    createApiBorrowing($student, $book, 'DELETE-TRX');
    Sanctum::actingAs($admin);

    $response = $this->deleteJson("/api/books/{$book->id}");

    expect($response->status())->toBe(422)
        ->and(Book::whereKey($book->id)->exists())->toBeTrue();
});

it('filters overdue borrowings using the dynamic accessor', function () {
    Carbon::setTestNow('2026-10-01 12:00:00');
    $student = createApiUser();
    $admin = createApiUser('pengurus');
    $book = createApiBook('OVERDUE-TEST', 'Dipinjam');
    $borrowing = createApiBorrowing($student, $book, 'OVERDUE-TRX', '2026-09-30');
    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/borrowings/all?overdue=1');

    expect($response->status())->toBe(200)
        ->and($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.id'))->toBe($borrowing->id)
        ->and($response->json('data.0.is_overdue'))->toBeTrue();
});

it('returns API errors in the standard envelope for unauthenticated requests', function () {
    $response = $this->getJson('/api/books');

    expect($response->status())->toBe(401)
        ->and($response->json())->toMatchArray([
            'success' => false,
            'data' => null,
            'errors' => null,
        ]);
});
