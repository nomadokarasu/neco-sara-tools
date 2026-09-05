<?php

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");

$dataFile = dirname(__DIR__) . "/data/worlds.json";

if (!file_exists($dataFile)) {
echo json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit;
}

$json = file_get_contents($dataFile);

if ($json === false) {
http_response_code(500);
echo json_encode([
"error" => "データを読み込めませんでした。"
], JSON_UNESCAPED_UNICODE);
exit;
}

$worlds = json_decode($json, true);

if (!is_array($worlds)) {
$worlds = [];
}

$publishedWorlds = array_values(array_filter(
$worlds,
function ($world) {
return isset($world["status"]) && $world["status"] === "published";
}
));

usort(
$publishedWorlds,
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
"xUrl" => $world["xUrl"] ?? "",
"externalUrl" => $world["externalUrl"] ?? "",
"thumbnail" => $world["thumbnail"] ?? "",
"panorama" => $world["panorama"] ?? "",
"createdAt" => $world["createdAt"] ?? ""
];
},
$publishedWorlds
);

echo json_encode(
$result,
JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);