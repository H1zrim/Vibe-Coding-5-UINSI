<?php
declare(strict_types=1);

require_once __DIR__ . '/app/bootstrap.php';

$container = app();
$auth = $container['auth'];
$library = $container['library'];
$page = $_GET['page'] ?? 'dashboard'; $action = $_POST['action'] ?? null;

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        verifyCsrf();
        match ($action) {
            'login' => $auth->login(), 'google_login' => $auth->googleLogin(), 'register' => $auth->register(), 'logout' => $auth->logout(),
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
    extract($viewData, EXTR_SKIP);
    require __DIR__ . '/app/views/library/dashboard.php';
} catch (Throwable $error) {
    http_response_code(500); echo '<h1>Terjadi kesalahan</h1><p>' . e($error->getMessage()) . '</p>';
}
