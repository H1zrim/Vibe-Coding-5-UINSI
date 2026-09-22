<?php
declare(strict_types=1);

final class SqliteDatabase implements DatabaseInterface
{
    public function __construct(private PDO $pdo)
    {
        $this->pdo->exec('PRAGMA foreign_keys = ON');
        $this->migrate();
        $this->seedIfEmpty();
    }

    public function read(): array
    {
        return [
            'users' => $this->pdo->query('SELECT id, username, password, name, role, nim FROM users ORDER BY id')->fetchAll(),
            'books' => $this->pdo->query('SELECT id, title, author, category, year, status FROM books ORDER BY id')->fetchAll(),
            'borrowings' => $this->pdo->query('SELECT id, bookId, userId, borrowDate, dueDate, returnDate, status FROM borrowings ORDER BY id')->fetchAll(),
        ];
    }

    public function transaction(callable $callback): mixed
    {
        $this->pdo->beginTransaction();

        try {
            $data = $this->read();
            $result = $callback($data);
            $this->replaceData($data);
            $this->pdo->commit();
            return $result;
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $error;
        }
    }

    private function migrate(): void
    {
        $this->pdo->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'mahasiswa' CHECK (role IN ('pengurus', 'mahasiswa')),
                nim TEXT NULL
            )
        SQL);
        $this->pdo->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS books (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                category TEXT NOT NULL,
                year INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'Tersedia' CHECK (status IN ('Tersedia', 'Dipinjam'))
            )
        SQL);
        $this->pdo->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS borrowings (
                id TEXT PRIMARY KEY,
                bookId TEXT NOT NULL,
                userId TEXT NOT NULL,
                borrowDate TEXT NOT NULL,
                dueDate TEXT NOT NULL,
                returnDate TEXT NULL,
                status TEXT NOT NULL DEFAULT 'Dipinjam' CHECK (status IN ('Dipinjam', 'Dikembalikan')),
                FOREIGN KEY (bookId) REFERENCES books (id),
                FOREIGN KEY (userId) REFERENCES users (id)
            )
        SQL);
        $this->pdo->exec('CREATE INDEX IF NOT EXISTS idx_borrowings_user ON borrowings (userId)');
        $this->pdo->exec('CREATE INDEX IF NOT EXISTS idx_borrowings_book ON borrowings (bookId)');
    }

    private function seedIfEmpty(): void
    {
        if ((int) $this->pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() > 0) {
            return;
        }

        $this->transaction(function (array &$data): void {
            $data = [
                'users' => [
                    ['id' => 'u-pengurus', 'username' => 'pengurus', 'password' => password_hash('12345', PASSWORD_DEFAULT), 'name' => 'Pengurus Default', 'role' => 'pengurus', 'nim' => null],
                    ['id' => 'u-mhs1', 'username' => 'mhs1', 'password' => password_hash('12345', PASSWORD_DEFAULT), 'name' => 'Mahasiswa Demo', 'role' => 'mahasiswa', 'nim' => '2026001'],
                ],
                'books' => [
                    ['id' => 'BK-001', 'title' => 'Algoritma & Struktur Data Lanjut', 'author' => 'Rinaldi Munir', 'category' => 'Ilmu Komputer', 'year' => 2022, 'status' => 'Tersedia'],
                    ['id' => 'BK-002', 'title' => 'Pemrograman Web Modern Berbasis Komponen', 'author' => 'Budi Raharjo', 'category' => 'Teknologi', 'year' => 2023, 'status' => 'Tersedia'],
                    ['id' => 'BK-003', 'title' => 'Basis Data & Perancangan Sistem Relasional', 'author' => 'Fathansyah', 'category' => 'Basis Data', 'year' => 2021, 'status' => 'Dipinjam'],
                    ['id' => 'BK-004', 'title' => 'Rekayasa Perangkat Lunak: Pendekatan Praktisi', 'author' => 'Roger S. Pressman', 'category' => 'Rekayasa', 'year' => 2020, 'status' => 'Tersedia'],
                    ['id' => 'BK-005', 'title' => 'Pengantar Kecerdasan Buatan dan Robotika', 'author' => 'Suyanto', 'category' => 'Kecerdasan Buatan', 'year' => 2024, 'status' => 'Tersedia'],
                ],
                'borrowings' => [
                    ['id' => 'TRX-2026-001', 'bookId' => 'BK-003', 'userId' => 'u-mhs1', 'borrowDate' => '2026-09-01', 'dueDate' => '2026-09-08', 'returnDate' => null, 'status' => 'Dipinjam'],
                ],
            ];
        });
    }

    private function replaceData(array $data): void
    {
        $this->pdo->exec('DELETE FROM borrowings');
        $this->pdo->exec('DELETE FROM books');
        $this->pdo->exec('DELETE FROM users');

        $user = $this->pdo->prepare('INSERT INTO users (id, username, password, name, role, nim) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($data['users'] as $item) {
            $user->execute([$item['id'], $item['username'], $item['password'], $item['name'], $item['role'], $item['nim'] ?? null]);
        }

        $book = $this->pdo->prepare('INSERT INTO books (id, title, author, category, year, status) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($data['books'] as $item) {
            $book->execute([$item['id'], $item['title'], $item['author'], $item['category'], $item['year'], $item['status']]);
        }

        $borrowing = $this->pdo->prepare('INSERT INTO borrowings (id, bookId, userId, borrowDate, dueDate, returnDate, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
        foreach ($data['borrowings'] as $item) {
            $borrowing->execute([$item['id'], $item['bookId'], $item['userId'], $item['borrowDate'], $item['dueDate'], $item['returnDate'] ?? null, $item['status']]);
        }
    }
}