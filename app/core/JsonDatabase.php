<?php
declare(strict_types=1);

final class JsonDatabase
{
    public function __construct(private string $file)
    {
        if (!is_dir(dirname($file))) {
            mkdir(dirname($file), 0775, true);
        }
        if (!file_exists($file)) {
            $this->write($this->seed());
        }
    }

    public function read(): array
    {
        $data = json_decode((string) file_get_contents($this->file), true);
        return is_array($data) ? $data : $this->seed();
    }

    public function transaction(callable $callback): mixed
    {
        $handle = fopen($this->file, 'c+');
        if (!$handle || !flock($handle, LOCK_EX)) {
            throw new RuntimeException('Database tidak dapat dikunci.');
        }
        try {
            rewind($handle);
            $data = json_decode(stream_get_contents($handle) ?: '', true);
            $data = is_array($data) ? $data : $this->seed();
            $result = $callback($data);
            rewind($handle);
            ftruncate($handle, 0);
            fwrite($handle, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            fflush($handle);
            return $result;
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    private function write(array $data): void
    {
        file_put_contents($this->file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    private function seed(): array
    {
        return [
            'users' => [[
                'id' => 'u-pengurus', 'username' => 'pengurus', 'password' => password_hash('12345', PASSWORD_DEFAULT),
                'name' => 'Pengurus Default', 'role' => 'pengurus', 'nim' => null
            ]],
            'books' => [
                ['id' => 'BK-001', 'title' => 'Algoritma & Struktur Data Lanjut', 'author' => 'Rinaldi Munir', 'category' => 'Ilmu Komputer', 'year' => 2022, 'status' => 'Tersedia'],
                ['id' => 'BK-002', 'title' => 'Pemrograman Web Modern Berbasis Komponen', 'author' => 'Budi Raharjo', 'category' => 'Teknologi', 'year' => 2023, 'status' => 'Tersedia'],
                ['id' => 'BK-003', 'title' => 'Basis Data & Perancangan Sistem Relasional', 'author' => 'Fathansyah', 'category' => 'Basis Data', 'year' => 2021, 'status' => 'Dipinjam'],
                ['id' => 'BK-004', 'title' => 'Rekayasa Perangkat Lunak: Pendekatan Praktisi', 'author' => 'Roger S. Pressman', 'category' => 'Rekayasa', 'year' => 2020, 'status' => 'Tersedia'],
                ['id' => 'BK-005', 'title' => 'Pengantar Kecerdasan Buatan dan Robotika', 'author' => 'Suyanto', 'category' => 'Kecerdasan Buatan', 'year' => 2024, 'status' => 'Tersedia']
            ],
            'borrowings' => [[
                'id' => 'TRX-2026-001', 'bookId' => 'BK-003', 'userId' => 'u-mhs1', 'borrowDate' => '2026-09-01',
                'dueDate' => '2026-09-08', 'returnDate' => null, 'status' => 'Dipinjam'
            ]]
        ];
    }
}
