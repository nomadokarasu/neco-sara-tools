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

$dataFile = dirname(__DIR__) . "/data/worlds.json";

if (!file_exists($dataFile)) {
failResponse("投稿データがありません。", 404);
}

$fileHandle = fopen(
$dataFile,
"c+"
);

if ($fileHandle === false) {
failResponse("投稿データを開けませんでした。", 500);
}

if (!flock($fileHandle, LOCK_EX)) {
fclose($fileHandle);
failResponse("投稿データを更新できませんでした。", 500);
}

rewind($fileHandle);

$currentJson =
stream_get_contents(
$fileHandle
);

$worlds = json_decode(
$currentJson ?: "[]",
true
);

if (!is_array($worlds)) {
flock($fileHandle, LOCK_UN);
fclose($fileHandle);
failResponse("投稿データが壊れています。", 500);
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

$newJson = json_encode(
$worlds,
JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);

if ($newJson === false) {
flock($fileHandle, LOCK_UN);
fclose($fileHandle);
failResponse("投稿データを変換できませんでした。", 500);
}

rewind($fileHandle);

if (!ftruncate($fileHandle, 0)) {
flock($fileHandle, LOCK_UN);
fclose($fileHandle);
failResponse("投稿データを更新できませんでした。", 500);
}

if (
fwrite(
$fileHandle,
$newJson
) === false
) {
flock($fileHandle, LOCK_UN);
fclose($fileHandle);
failResponse("投稿データを更新できませんでした。", 500);
}

fflush($fileHandle);
flock($fileHandle, LOCK_UN);
fclose($fileHandle);

echo json_encode([
"success" => true
], JSON_UNESCAPED_UNICODE);