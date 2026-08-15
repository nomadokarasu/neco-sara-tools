<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header(
    'Content-Type: application/json; charset=utf-8'
);

header(
    'Cache-Control: no-store, no-cache, must-revalidate'
);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    $requestBody =
        file_get_contents('php://input');

    if ($requestBody === false || $requestBody === '') {
        throw new InvalidArgumentException(
            '送信内容が空です。'
        );
    }

    $requestData =
        json_decode(
            $requestBody,
            true,
            512,
            JSON_THROW_ON_ERROR
        );

    $receivedPassword =
        isset($requestData['password'])
            ? (string) $requestData['password']
            : '';

    if (
        ADMIN_PASSWORD === '' ||
        !hash_equals(
            ADMIN_PASSWORD,
            $receivedPassword
        )
    ) {
        http_response_code(401);

        echo json_encode(
            [
                'error' =>
                    '管理用パスワードが正しくありません。'
            ],
            JSON_UNESCAPED_UNICODE
        );

        exit;
    }

    $workLogData =
        $requestData['data'] ?? null;

    if (!is_array($workLogData)) {
        http_response_code(400);

        echo json_encode(
            [
                'error' =>
                    '保存する作業記録がありません。'
            ],
            JSON_UNESCAPED_UNICODE
        );

        exit;
    }

    $requiredKeys = [
        'settings',
        'categories',
        'sessions',
        'activeSession'
    ];

    foreach ($requiredKeys as $requiredKey) {
        if (
            !array_key_exists(
                $requiredKey,
                $workLogData
            )
        ) {
            http_response_code(400);

            echo json_encode(
                [
                    'error' =>
                        '作業記録の形式が正しくありません。'
                ],
                JSON_UNESCAPED_UNICODE
            );

            exit;
        }
    }

    $dataJson =
        json_encode(
            $workLogData,
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES |
            JSON_THROW_ON_ERROR
        );

    if (strlen($dataJson) > 5 * 1024 * 1024) {
        http_response_code(413);

        echo json_encode(
            [
                'error' =>
                    '作業記録のデータ量が大きすぎます。'
            ],
            JSON_UNESCAPED_UNICODE
        );

        exit;
    }

    $pdo =
        getDatabaseConnection();

    $statement =
        $pdo->prepare(
            '
                INSERT INTO work_log_data (
                    id,
                    data_json
                )
                VALUES (
                    :id,
                    :data_json
                )
                ON DUPLICATE KEY UPDATE
                    data_json = :update_data_json
            '
        );

    $statement->execute(
        [
            'id' => 1,
            'data_json' => $dataJson,
            'update_data_json' => $dataJson
        ]
    );

    echo json_encode(
        [
            'success' => true,
            'message' =>
                '作業記録を保存しました。'
        ],
        JSON_UNESCAPED_UNICODE
    );
} catch (JsonException $error) {
    http_response_code(400);

    echo json_encode(
        [
            'error' =>
                '送信されたデータを読み取れませんでした。'
        ],
        JSON_UNESCAPED_UNICODE
    );
} catch (Throwable $error) {
    error_log(
        'work-log save error: ' .
        $error->getMessage()
    );

    http_response_code(500);

    echo json_encode(
        [
            'error' =>
                '作業記録の保存に失敗しました。'
        ],
        JSON_UNESCAPED_UNICODE
    );
}