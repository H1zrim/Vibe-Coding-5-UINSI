<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/app/config/config.php';
require_once __DIR__ . '/app/core/JsonDatabase.php';
require_once __DIR__ . '/app/models/User.php';
require_once __DIR__ . '/app/models/Book.php';
require_once __DIR__ . '/app/models/Borrowing.php';
require_once __DIR__ . '/app/controllers/AuthController.php';
require_once __DIR__ . '/app/controllers/LibraryController.php';

$db = new JsonDatabase(STORAGE_FILE);
$users = new User($db); $books = new Book($db); $borrowings = new Borrowing($db);
$auth = new AuthController($users); $library = new LibraryController($books, $borrowings);
$page = $_GET['page'] ?? 'dashboard'; $action = $_POST['action'] ?? null;

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        verifyCsrf();
        match ($action) {
            'login' => $auth->login(), 'register' => $auth->register(), 'logout' => $auth->logout(),
            'save_book' => $library->saveBook(), 'delete_book' => $library->deleteBook(),
            'borrow' => $library->borrow(), 'return_book' => $library->returnBook(),
            default => redirect()
        };
    }
    if ($page === 'logout') { $auth->logout(); }
    if ($page === 'login' || $page === 'register') {
        if (isset($_SESSION['user'])) redirect();
        require __DIR__ . '/app/views/auth/' . $page . '.php'; exit;
    }
    if (!isset($_SESSION['user'])) redirect('index.php?page=login');
    $viewData = $library->dashboard();
    require __DIR__ . '/app/views/library/dashboard.php';
} catch (Throwable $error) {
    http_response_code(500); echo '<h1>Terjadi kesalahan</h1><p>' . e($error->getMessage()) . '</p>';
}
