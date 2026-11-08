<?php

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
http_response_code(405);
echo json_encode([
"error" => "POSTで送信してください。"
], JSON_UNESCAPED_UNICODE);
exit;
}

function failResponse($message, $status = 400) {
http_response_code($status);
echo json_encode([
"error" => $message
], JSON_UNESCAPED_UNICODE);
exit;
}

$input = json_decode(
file_get_contents("php://input"),
true
);

if (!is_array($input)) {
failResponse("送信内容を確認できませんでした。");
}

$worldId = trim(
(string)($input["worldId"] ?? "")
);

if (
$worldId === "" ||
!preg_match('/^[a-f0-9]{16}$/', $worldId)
) {
failResponse("作品IDが正しくありません。");
}

require_once __DIR__ . "/worlds-storage.php";

$dataDirectory = dirname(__DIR__) . "/data";
$dataFile = $dataDirectory . "/worlds.json";
$lockFile = $dataDirectory . "/worlds-update.lock";

if (!is_file($dataFile)) {
failResponse("投稿データがありません。", 404);
}

$fileHandle = fopen($lockFile, "c");

if ($fileHandle === false) {
failResponse("投稿データのロックを開けませんでした。", 500);
}

if (!flock($fileHandle, LOCK_EX)) {
fclose($fileHandle);
failResponse("投稿データをロックできませんでした。", 500);
}

try {
$worlds = readWorldsSafely($dataFile);
} catch (Throwable $error) {
flock($fileHandle, LOCK_UN);
fclose($fileHandle);
failResponse($error->getMessage(), 500);
}

$found = false;

foreach (
$worlds as &$world
) {

if (
($world["id"] ?? "") !== $worldId
) {
continue;
}

$found = true;

if (
($world["status"] ?? "") !== "published"
) {
break;
}

$world["reportCount"] =
(int)($world["reportCount"] ?? 0) + 1;

$protectedWorldIds = [
"f4505070ceafd766",
"81d7b6e6c55af4a7",
"362e592326817cff"
];

if (
!in_array(
$worldId,
$protectedWorldIds,
true
)
) {

$world["status"] =
"hidden";

}

$world["reportedAt"] =
gmdate("c");

break;
}

unset($world);

if (!$found) {
flock($fileHandle, LOCK_UN);
fclose($fileHandle);
failResponse("作品が見つかりませんでした。", 404);
}

try {
writeWorldsSafely($dataFile, $worlds);
} catch (Throwable $error) {
flock($fileHandle, LOCK_UN);
fclose($fileHandle);
failResponse($error->getMessage(), 500);
}

flock($fileHandle, LOCK_UN);
fclose($fileHandle);

echo json_encode([
"success" => true
], JSON_UNESCAPED_UNICODE);