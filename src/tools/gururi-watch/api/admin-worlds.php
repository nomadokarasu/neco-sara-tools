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

$dataFile = dirname(__DIR__) . "/data/worlds.json";

if (!file_exists($dataFile)) {
echo json_encode([], JSON_UNESCAPED_UNICODE);
exit;
}

$json = file_get_contents(
$dataFile
);

$worlds = json_decode(
$json ?: "[]",
true
);

if (!is_array($worlds)) {
$worlds = [];
}

usort(
$worlds,
function ($a, $b) {
return strcmp(
$b["createdAt"] ?? "",
$a["createdAt"] ?? ""
);
}
);

$result = array_map(
function ($world) {

return [
"id" => $world["id"] ?? "",
"title" => $world["title"] ?? "",
"author" => $world["author"] ?? "",
"description" => $world["description"] ?? "",
"thumbnail" => $world["thumbnail"] ?? "",
"status" => $world["status"] ?? "",
"reportCount" => (int)($world["reportCount"] ?? 0),
"createdAt" => $world["createdAt"] ?? "",
"reportedAt" => $world["reportedAt"] ?? ""
];

},
$worlds
);

echo json_encode(
$result,
JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);