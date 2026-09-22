<?php
declare(strict_types=1);

final class Book
{
    public function __construct(private DatabaseInterface $db) {}

    public function all(string $query = '', string $category = 'ALL'): array
    {
        $books = $this->db->read()['books'];
        return array_values(array_filter($books, function (array $book) use ($query, $category): bool {
            $haystack = strtolower($book['id'] . ' ' . $book['title'] . ' ' . $book['author']);
            return ($query === '' || str_contains($haystack, strtolower($query))) && ($category === 'ALL' || $book['category'] === $category);
        }));
    }

    public function categories(): array
    {
        $categories = array_column($this->db->read()['books'], 'category');
        $categories = array_values(array_unique($categories)); sort($categories); return $categories;
    }

    public function save(array $input, ?string $id = null): void
    {
        $title = trim($input['title'] ?? ''); $author = trim($input['author'] ?? ''); $category = trim($input['category'] ?? ''); $year = (int) ($input['year'] ?? 0);
        if ($title === '' || $author === '' || $category === '' || $year < 1900 || $year > 2099) throw new DomainException('Lengkapi data buku dengan benar.');
        $this->db->transaction(function (array &$data) use ($title, $author, $category, $year, $id): void {
            if ($id) {
                foreach ($data['books'] as &$book) if ($book['id'] === $id) { $book = array_merge($book, compact('title', 'author', 'category', 'year')); return; }
                throw new DomainException('Buku tidak ditemukan.');
            }
            $numbers = array_map(fn(array $book): int => (int) str_replace('BK-', '', $book['id']), $data['books']);
            $data['books'][] = ['id' => 'BK-' . str_pad((string) (max($numbers ?: [0]) + 1), 3, '0', STR_PAD_LEFT), 'title' => $title, 'author' => $author, 'category' => $category, 'year' => $year, 'status' => 'Tersedia'];
        });
    }

    public function delete(string $id): void
    {
        $this->db->transaction(function (array &$data) use ($id): void {
            foreach ($data['books'] as $book) if ($book['id'] === $id && $book['status'] === 'Dipinjam') throw new DomainException('Buku yang sedang dipinjam tidak dapat dihapus.');
            $data['books'] = array_values(array_filter($data['books'], fn(array $book): bool => $book['id'] !== $id));
        });
    }
}
