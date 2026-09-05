<?php

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

$dataFile =
$rootDirectory . "/data/worlds.json";

$fileHandle = fopen(
$dataFile,
"c+"
);

if ($fileHandle === false) {
failResponse(
"投稿データを開けませんでした。",
500
);
}

if (
!flock(
$fileHandle,
LOCK_EX
)
) {

fclose(
$fileHandle
);

failResponse(
"投稿データを更新できませんでした。",
500
);

}

rewind(
$fileHandle
);

$currentJson =
stream_get_contents(
$fileHandle
);

$worlds = json_decode(
$currentJson ?: "[]",
true
);

if (!is_array($worlds)) {

flock(
$fileHandle,
LOCK_UN
);

fclose(
$fileHandle
);

failResponse(
"投稿データが壊れています。",
500
);

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

if (
$action === "delete"
) {

$uploadDirectory =
$rootDirectory .
"/uploads/" .
$worldId;

if (
is_dir(
$uploadDirectory
)
) {

$files =
glob(
$uploadDirectory . "/*"
);

if (
is_array(
$files
)
) {

foreach (
$files as $file
) {

if (
is_file(
$file
)
) {

@unlink(
$file
);

}

}

}

@rmdir(
$uploadDirectory
);

}

array_splice(
$worlds,
$foundIndex,
1
);

}

$newJson = json_encode(
$worlds,
JSON_PRETTY_PRINT |
JSON_UNESCAPED_UNICODE |
JSON_UNESCAPED_SLASHES
);

if ($newJson === false) {

flock(
$fileHandle,
LOCK_UN
);

fclose(
$fileHandle
);

failResponse(
"投稿データを変換できませんでした。",
500
);

}

rewind(
$fileHandle
);

ftruncate(
$fileHandle,
0
);

if (
fwrite(
$fileHandle,
$newJson
) === false
) {

flock(
$fileHandle,
LOCK_UN
);

fclose(
$fileHandle
);

failResponse(
"投稿データを保存できませんでした。",
500
);

}

fflush(
$fileHandle
);

flock(
$fileHandle,
LOCK_UN
);

fclose(
$fileHandle
);

echo json_encode([
"success" => true
], JSON_UNESCAPED_UNICODE);