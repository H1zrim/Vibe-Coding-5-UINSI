<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
    ]);
}

require_once __DIR__ . '/config/config.php';

spl_autoload_register(static function (string $class): void {
    $directories = [
        __DIR__ . '/core/',
        __DIR__ . '/models/',
        __DIR__ . '/controllers/',
    ];

    foreach ($directories as $directory) {
        $file = $directory . $class . '.php';
        if (is_file($file)) {
            require_once $file;
            return;
        }
    }
});

function app(): array
{
    static $container;

    if ($container === null) {
        $database = new SqliteDatabase(databasePdo());
        $container = [
            'users' => new User($database),
            'books' => new Book($database),
            'borrowings' => new Borrowing($database),
        ];
        $container['auth'] = new AuthController($container['users']);
        $container['library'] = new LibraryController($container['books'], $container['borrowings']);
    }

    return $container;
}