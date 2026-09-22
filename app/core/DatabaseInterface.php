<?php
declare(strict_types=1);

interface DatabaseInterface
{
    public function read(): array;

    public function transaction(callable $callback): mixed;
}