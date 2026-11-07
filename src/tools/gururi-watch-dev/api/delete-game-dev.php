
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");
header("X-Content-Type-Options: nosniff");

function failDelete($message, $status = 400) {
http_response_code($status);
echo json_encode([
"success" => false,
"error" => $message
], JSON_UNESCAPED_UNICODE);
exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
failDelete("POSTで送信してください。", 405);
}

if (($_SERVER["HTTP_ORIGIN"] ?? "") !== "https://tools.neco-sara.com") {
failDelete("送信元を確認できません。", 403);
}

$id = (string)($_POST["id"] ?? "");
$token = (string)($_POST["token"] ?? "");

if (!preg_match('/^[a-f0-9]{32}$/', $id) || !preg_match('/^[a-f0-9]{64}$/', $token)) {
failDelete("削除情報が正しくありません。");
}

$dataDirectory = dirname(__DIR__) . "/data";
$directory = $dataDirectory . "/game-tests";

$lock = fopen($dataDirectory . "/game-tests.lock", "c");

if ($lock === false) {
failDelete("削除処理を開始できませんでした。", 500);
}

if (!flock($lock, LOCK_EX)) {
fclose($lock);
failDelete("削除処理を開始できませんでした。", 500);
}

$metadataFile = $directory . "/" . $id . ".json";
$gameFile = $directory . "/" . $id . ".txt";

$metadata = is_file($metadataFile)
? json_decode((string)file_get_contents($metadataFile), true)
: null;

$expectedHash = is_array($metadata)
? (string)($metadata["tokenHash"] ?? "")
: "";

if (
strlen($expectedHash) !== 64 ||
!hash_equals($expectedHash, hash("sha256", $token))
) {
flock($lock, LOCK_UN);
fclose($lock);
failDelete("削除権限を確認できません。", 403);
}

$gameDeleted = !is_file($gameFile) || @unlink($gameFile);
$metadataDeleted = $gameDeleted && (!is_file($metadataFile) || @unlink($metadataFile));

flock($lock, LOCK_UN);
fclose($lock);

if (!$gameDeleted || !$metadataDeleted) {
failDelete("一時ファイルを削除できませんでした。", 500);
}

echo json_encode([
"success" => true
], JSON_UNESCAPED_UNICODE);