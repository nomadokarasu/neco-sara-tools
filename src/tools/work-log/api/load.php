<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header(
    'Content-Type: application/json; charset=utf-8'
);

header(
    'Cache-Control: no-store, no-cache, must-revalidate'
);

// GET以外のアクセスを拒否
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);

    echo json_encode(
        [
            'error' =>
                'このアクセス方法は使用できません。'
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

try {
    $pdo =
        getDatabaseConnection();

    $statement =
        $pdo->prepare(
            '
                SELECT data_json
                FROM work_log_data
                WHERE id = :id
                LIMIT 1
            '
        );

    $statement->execute(
        [
            'id' => 1
        ]
    );

    $row =
        $statement->fetch();

    if (!$row) {
        http_response_code(404);

        echo json_encode(
            [
                'error' =>
                    '作業記録が見つかりません。'
            ],
            JSON_UNESCAPED_UNICODE
        );

        exit;
    }

    $data =
        json_decode(
            $row['data_json'],
            true,
            512,
            JSON_THROW_ON_ERROR
        );

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );
} catch (Throwable $error) {
    error_log(
        'work-log load error: ' .
        $error->getMessage()
    );

    http_response_code(500);

    echo json_encode(
        [
            'error' =>
                '作業記録の読み込みに失敗しました。'
        ],
        JSON_UNESCAPED_UNICODE
    );
}