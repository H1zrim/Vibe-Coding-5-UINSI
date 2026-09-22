<?php
declare(strict_types=1);

const SERVICE_NAME = 'template-service';
const SERVICE_PORT = 4100;
const SERVICE_ROOT = __DIR__ . '/..';
const SERVICE_STORAGE = SERVICE_ROOT . '/storage';

if (!is_dir(SERVICE_STORAGE)) {
    mkdir(SERVICE_STORAGE, 0775, true);
}