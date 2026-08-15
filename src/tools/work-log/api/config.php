<?php

declare(strict_types=1);

// ========================================
// データベース接続情報
// ========================================

const DB_HOST = 'mysql402.phy.lolipop.lan';
const DB_NAME = 'LAA0915260-nippou';
const DB_USER = 'LAA0915260';
const DB_PASSWORD = '800tuguharu';

// ========================================
// データベースに接続する関数
// ========================================

function getDatabaseConnection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn =
        'mysql:host=' . DB_HOST .
        ';dbname=' . DB_NAME .
        ';charset=utf8mb4';

    $pdo = new PDO(
        $dsn,
        DB_USER,
        DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE =>
                PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE =>
                PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES =>
                false
        ]
    );

    return $pdo;
}