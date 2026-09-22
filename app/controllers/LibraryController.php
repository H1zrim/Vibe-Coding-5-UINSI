<?php
declare(strict_types=1);

final class LibraryController
{
    public function __construct(private Book $books, private Borrowing $borrowings) {}
    public function dashboard(): array
    {
        $user = $_SESSION['user']; $allBooks = $this->books->all(); $transactions = $this->borrowings->all($user['role'] === 'mahasiswa' ? $user['id'] : null);
        return ['user' => $user, 'books' => $allBooks, 'transactions' => $transactions, 'categories' => $this->books->categories(), 'stats' => ['total' => count($allBooks), 'available' => count(array_filter($allBooks, fn(array $book): bool => $book['status'] === 'Tersedia')), 'borrowed' => count(array_filter($allBooks, fn(array $book): bool => $book['status'] === 'Dipinjam')), 'transactions' => count($this->borrowings->all())]];
    }
    private function adminOnly(): void { if (($_SESSION['user']['role'] ?? '') !== 'pengurus') { http_response_code(403); exit('Akses ditolak.'); } }
    public function saveBook(): void { $this->adminOnly(); try { $this->books->save($_POST, $_POST['id'] ?: null); flash('Data buku berhasil disimpan.', 'success'); } catch (Throwable $error) { flash($error->getMessage(), 'danger'); } redirect(); }
    public function deleteBook(): void { $this->adminOnly(); try { $this->books->delete($_POST['id'] ?? ''); flash('Buku berhasil dihapus.', 'success'); } catch (Throwable $error) { flash($error->getMessage(), 'danger'); } redirect(); }
    public function borrow(): void { try { $trx = $this->borrowings->borrow($_SESSION['user']['id'], $_POST['bookId'] ?? ''); flash('Peminjaman berhasil. Batas pengembalian: ' . $trx['dueDate'], 'success'); } catch (Throwable $error) { flash($error->getMessage(), 'danger'); } redirect(); }
    public function returnBook(): void { $this->adminOnly(); try { $this->borrowings->returnBook($_POST['id'] ?? ''); flash('Buku berhasil dikembalikan.', 'success'); } catch (Throwable $error) { flash($error->getMessage(), 'danger'); } redirect(); }
}
