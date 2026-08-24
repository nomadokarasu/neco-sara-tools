<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header(
    'Content-Type: application/json; charset=utf-8'
);

header(
    'Cache-Control: no-store, no-cache, must-revalidate'
);

session_set_cookie_params(
    [
        'lifetime' => 0,
        'path' => '/',
        'secure' =>
            !empty($_SERVER['HTTPS']) &&
            $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Strict'
    ]
);

session_start();


// ========================================
// 現在の認証状態
// ========================================

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(
        [
            'authenticated' =>
                !empty(
                    $_SESSION[
                        'work_log_authenticated'
                    ]
                )
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


// POST以外は拒否
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
        file_get_contents(
            'php://input'
        );

    $requestData =
        $requestBody
            ? json_decode(
                $requestBody,
                true,
                512,
                JSON_THROW_ON_ERROR
            )
            : [];

    $action =
        isset($requestData['action'])
            ? (string) $requestData['action']
            : '';


    // ========================================
    // ログアウト
    // ========================================

    if ($action === 'logout') {
        $_SESSION = [];

        if (
            ini_get(
                'session.use_cookies'
            )
        ) {
            $cookieParameters =
                session_get_cookie_params();

            setcookie(
                session_name(),
                '',
                [
                    'expires' =>
                        time() - 42000,
                    'path' =>
                        $cookieParameters['path'],
                    'domain' =>
                        $cookieParameters['domain'],
                    'secure' =>
                        $cookieParameters['secure'],
                    'httponly' =>
                        $cookieParameters['httponly'],
                    'samesite' =>
                        'Strict'
                ]
            );
        }

        session_destroy();

        echo json_encode(
            [
                'success' => true,
                'authenticated' => false
            ],
            JSON_UNESCAPED_UNICODE
        );

        exit;
    }


    // ========================================
    // ログイン
    // ========================================

    if ($action !== 'login') {
        http_response_code(400);

        echo json_encode(
            [
                'error' =>
                    '認証操作が正しくありません。'
            ],
            JSON_UNESCAPED_UNICODE
        );

        exit;
    }


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
        $_SESSION[
            'work_log_authenticated'
        ] = false;

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


    session_regenerate_id(
        true
    );

    $_SESSION[
        'work_log_authenticated'
    ] = true;


    echo json_encode(
        [
            'success' => true,
            'authenticated' => true
        ],
        JSON_UNESCAPED_UNICODE
    );
} catch (JsonException $error) {
    http_response_code(400);

    echo json_encode(
        [
            'error' =>
                '送信された内容を読み取れませんでした。'
        ],
        JSON_UNESCAPED_UNICODE
    );
} catch (Throwable $error) {
    error_log(
        'work-log auth error: ' .
        $error->getMessage()
    );

    http_response_code(500);

    echo json_encode(
        [
            'error' =>
                '認証処理に失敗しました。'
        ],
        JSON_UNESCAPED_UNICODE
    );
}