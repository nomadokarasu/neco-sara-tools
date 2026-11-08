
<?php
function readWorldsSafely($dataFile) {
if (!is_file($dataFile) || !is_readable($dataFile)) {
throw new RuntimeException("作品データが見つかりません。");
}

$json = file_get_contents($dataFile);

if ($json === false) {
throw new RuntimeException("作品データを読み込めませんでした。");
}

try {
$worlds = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $error) {
throw new RuntimeException("作品データの形式が不正です。");
}

if (!is_array($worlds) || !array_is_list($worlds)) {
throw new RuntimeException("作品データが配列ではありません。");
}

return $worlds;
}

function writeWorldsSafely($dataFile, $worlds) {
if (!is_array($worlds) || !array_is_list($worlds)) {
throw new RuntimeException("保存する作品データが不正です。");
}

try {
$json = json_encode(
$worlds,
JSON_PRETTY_PRINT |
JSON_UNESCAPED_UNICODE |
JSON_UNESCAPED_SLASHES |
JSON_THROW_ON_ERROR
);
} catch (JsonException $error) {
throw new RuntimeException("作品データを変換できませんでした。");
}

$directory = dirname($dataFile);
$tempFile = tempnam($directory, ".worlds-");

if ($tempFile === false) {
throw new RuntimeException("一時ファイルを作成できませんでした。");
}

try {
@chmod($tempFile, 0600);

$written = file_put_contents($tempFile, $json, LOCK_EX);

if ($written !== strlen($json)) {
throw new RuntimeException("作品データの書き込みに失敗しました。");
}

if (!rename($tempFile, $dataFile)) {
throw new RuntimeException("作品データを置き換えられませんでした。");
}
} finally {
if (is_file($tempFile)) {
@unlink($tempFile);
}
}
}