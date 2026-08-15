<?php

header(
    'Content-Type: application/json; charset=utf-8'
);

echo json_encode(
    [
        'test' => true,
        'message' => 'save.phpは動作しています。'
    ],
    JSON_UNESCAPED_UNICODE
);