<?php
declare(strict_types=1);

const APP_NAME = 'SIPERPU';
const BASE_PATH = __DIR__ . '/../../';
const STORAGE_FILE = BASE_PATH . 'storage/data.json';
const MAX_ACTIVE_BORROW = 3;
const BORROW_DAYS = 7;

function redirect(string $url = 'index.php?page=dashboard'): never
{
    header('Location: ' . $url);
    exit;
}

function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function flash(string $message, string $type = 'info'): void
{
    $_SESSION['flash'] = ['message' => $message, 'type' => $type];
}

function consumeFlash(): ?array
{
    $message = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $message;
}

function csrfToken(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function verifyCsrf(): void
{
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['_csrf'] ?? '')) {
        http_response_code(419);
        exit('Token keamanan tidak valid. Silakan muat ulang halaman.');
    }
}
