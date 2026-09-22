<?php
declare(strict_types=1);

final class Borrowing
{
    public function __construct(private JsonDatabase $db) {}

    public function all(?string $userId = null): array
    {
        $data = $this->db->read(); $users = array_column($data['users'], null, 'id'); $books = array_column($data['books'], null, 'id');
        $items = array_filter($data['borrowings'], fn(array $item): bool => !$userId || $item['userId'] === $userId);
        return array_map(function (array $item) use ($users, $books): array { $item['bookTitle'] = $books[$item['bookId']]['title'] ?? 'Buku tidak ditemukan'; $item['userName'] = $users[$item['userId']]['name'] ?? 'Pengguna tidak ditemukan'; $item['userNim'] = $users[$item['userId']]['nim'] ?? '-'; return $item; }, array_values($items));
    }

    public function borrow(string $userId, string $bookId): array
    {
        return $this->db->transaction(function (array &$data) use ($userId, $bookId): array {
            $user = null; $bookIndex = null;
            foreach ($data['users'] as $item) if ($item['id'] === $userId) $user = $item;
            foreach ($data['books'] as $index => $item) if ($item['id'] === $bookId) $bookIndex = $index;
            if (!$user || $user['role'] !== 'mahasiswa') throw new DomainException('Hanya mahasiswa yang dapat meminjam buku.');
            $active = count(array_filter($data['borrowings'], fn(array $item): bool => $item['userId'] === $userId && $item['status'] === 'Dipinjam'));
            if ($active >= MAX_ACTIVE_BORROW) throw new DomainException('Peminjaman ditolak. Batas maksimal 3 buku aktif.');
            if ($bookIndex === null) throw new DomainException('Buku tidak ditemukan.');
            if ($data['books'][$bookIndex]['status'] !== 'Tersedia') throw new DomainException('Buku sedang dipinjam.');
            $today = new DateTimeImmutable(); $trx = ['id' => 'TRX-' . $today->format('Y') . '-' . substr((string) time(), -5), 'bookId' => $bookId, 'userId' => $userId, 'borrowDate' => $today->format('Y-m-d'), 'dueDate' => $today->modify('+' . BORROW_DAYS . ' days')->format('Y-m-d'), 'returnDate' => null, 'status' => 'Dipinjam'];
            $data['books'][$bookIndex]['status'] = 'Dipinjam'; $data['borrowings'][] = $trx; return $trx;
        });
    }

    public function returnBook(string $id): void
    {
        $this->db->transaction(function (array &$data) use ($id): void {
            foreach ($data['borrowings'] as &$trx) if ($trx['id'] === $id) { if ($trx['status'] !== 'Dipinjam') throw new DomainException('Transaksi sudah dikembalikan.'); foreach ($data['books'] as &$book) if ($book['id'] === $trx['bookId']) $book['status'] = 'Tersedia'; $trx['status'] = 'Dikembalikan'; $trx['returnDate'] = date('Y-m-d'); return; }
            throw new DomainException('Transaksi tidak ditemukan.');
        });
    }
}
