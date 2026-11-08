<?php

session_name("gururi_watch_admin");
session_set_cookie_params([
"path" => "/tools/gururi-watch/",
"secure" => true,
"httponly" => true,
"samesite" => "Strict"
]);
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");

if (
empty($_SESSION["gururi_admin_logged_in"])
) {
http_response_code(401);
echo json_encode([
"error" => "ログインが必要です。"
], JSON_UNESCAPED_UNICODE);
exit;
}

if (
$_SERVER["REQUEST_METHOD"] !== "POST"
) {
http_response_code(405);
echo json_encode([
"error" => "POSTで送信してください。"
], JSON_UNESCAPED_UNICODE);
exit;
}

function failResponse(
$message,
$status = 400
) {

http_response_code(
$status
);

echo json_encode([
"error" => $message
], JSON_UNESCAPED_UNICODE);

exit;

}

$input = json_decode(
file_get_contents(
"php://input"
),
true
);

if (!is_array($input)) {
failResponse(
"送信内容を確認できませんでした。"
);
}

$worldId = trim(
(string)($input["worldId"] ?? "")
);

$action = trim(
(string)($input["action"] ?? "")
);

if (
!preg_match(
'/^[a-f0-9]{16}$/',
$worldId
)
) {
failResponse(
"作品IDが正しくありません。"
);
}

$allowedActions = [
"publish",
"hide",
"delete"
];

if (
!in_array(
$action,
$allowedActions,
true
)
) {
failResponse(
"操作内容が正しくありません。"
);
}

$rootDirectory =
dirname(__DIR__);
require_once __DIR__ . "/worlds-storage.php";

$dataFile = $rootDirectory . "/data/worlds.json";
$lockFile = $rootDirectory . "/data/worlds-update.lock";

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

$foundIndex =
null;

foreach (
$worlds as $index => $world
) {

if (
($world["id"] ?? "") ===
$worldId
) {

$foundIndex =
$index;

break;

}

}

if ($foundIndex === null) {

flock(
$fileHandle,
LOCK_UN
);

fclose(
$fileHandle
);

failResponse(
"作品が見つかりませんでした。",
404
);

}

if (
$action === "publish"
) {

$worlds[$foundIndex]["status"] =
"published";

}

if (
$action === "hide"
) {

$worlds[$foundIndex]["status"] =
"hidden";

}
$deletedWorld = null;

if ($action === "delete") {
$deletedWorld = $worlds[$foundIndex];
array_splice($worlds, $foundIndex, 1);
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

$cleanupFailed = false;

if ($deletedWorld !== null) {
if (($deletedWorld["type"] ?? "") === "game") {
$gameFile = $rootDirectory . "/data/published-games/" . $worldId . ".txt";

if (is_file($gameFile) && !@unlink($gameFile)) {
$cleanupFailed = true;
}
}

$uploadDirectory = $rootDirectory . "/uploads/" . $worldId;

if (is_dir($uploadDirectory)) {
$files = glob($uploadDirectory . "/*");

if ($files === false) {
$cleanupFailed = true;
} else {
foreach ($files as $file) {
if (is_file($file) && !@unlink($file)) {
$cleanupFailed = true;
}
}
}

if (!@rmdir($uploadDirectory) && is_dir($uploadDirectory)) {
$cleanupFailed = true;
}
}
}

if ($cleanupFailed) {
error_log("Gururium: Failed to remove some files for world " . $worldId);
}

echo json_encode([
"success" => true,
"cleanupWarning" => $cleanupFailed
], JSON_UNESCAPED_UNICODE);