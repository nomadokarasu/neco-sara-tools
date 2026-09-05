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

const MAX_FILE_SIZE = 10485760;

function failResponse($message, $status = 400) {
http_response_code($status);
echo json_encode([
"error" => $message
], JSON_UNESCAPED_UNICODE);
exit;
}

function cleanText($value, $maxLength) {
$value = trim((string)$value);

if (mb_strlen($value) > $maxLength) {
$value = mb_substr($value, 0, $maxLength);
}

return $value;
}

function validateUrl($value) {
$value = trim((string)$value);

if ($value === "") {
return "";
}

if (!filter_var($value, FILTER_VALIDATE_URL)) {
failResponse("URLの形式が正しくありません。");
}

$scheme = strtolower((string)parse_url($value, PHP_URL_SCHEME));

if ($scheme !== "http" && $scheme !== "https") {
failResponse("URLはhttpまたはhttpsを使用してください。");
}

return $value;
}

function getImageExtension($file, $imageType = "") {

if (!isset($file["error"]) || $file["error"] !== UPLOAD_ERR_OK) {
failResponse("画像をアップロードできませんでした。");
}

if (!isset($file["size"]) || $file["size"] <= 0) {
failResponse("画像ファイルが空です。");
}

if ($file["size"] > MAX_FILE_SIZE) {
failResponse("画像は1枚10MB以下にしてください。");
}

$imageInfo = @getimagesize($file["tmp_name"]);

if ($imageInfo === false) {
failResponse("画像ファイルを確認できませんでした。");
}

$mime = $imageInfo["mime"] ?? "";

$allowedTypes = [
"image/jpeg" => "jpg",
"image/png" => "png",
"image/webp" => "webp"
];

if (!isset($allowedTypes[$mime])) {
failResponse("JPG、PNG、WebPのみ投稿できます。");
}

$width = (int)($imageInfo[0] ?? 0);
$height = (int)($imageInfo[1] ?? 0);

if ($width <= 0 || $height <= 0) {
failResponse("画像サイズを確認できませんでした。");
}

if ($imageType === "thumbnail") {

$ratio = $width / $height;

if ($ratio < 0.98 || $ratio > 1.02) {
failResponse("サムネイル画像は正方形の画像を使用してください。");
}

}

if ($imageType === "panorama") {

$ratio = $width / $height;

if ($ratio < 1.9 || $ratio > 2.1) {
failResponse("ぐるり画像は横2：縦1の画像を使用してください。");
}

}

return $allowedTypes[$mime];
}

$title = cleanText($_POST["title"] ?? "", 80);
$author = cleanText($_POST["author"] ?? "", 80);
$description = cleanText($_POST["description"] ?? "", 1500);

$xUrl = validateUrl($_POST["xUrl"] ?? "");
$externalUrl = validateUrl($_POST["externalUrl"] ?? "");

$termsAccepted = isset($_POST["termsAccepted"]) && $_POST["termsAccepted"] === "1";

if ($title === "") {
failResponse("作品名を入力してください。");
}

if ($author === "") {
failResponse("作者名を入力してください。");
}

if (!$termsAccepted) {
failResponse("投稿条件への同意が必要です。");
}

if (!isset($_FILES["thumbnail"])) {
failResponse("サムネイル画像を選択してください。");
}

if (!isset($_FILES["panorama"])) {
failResponse("ぐるり画像を選択してください。");
}

$thumbnailExtension = getImageExtension(
$_FILES["thumbnail"],
"thumbnail"
);

$panoramaExtension = getImageExtension(
$_FILES["panorama"],
"panorama"
);

try {
$worldId = bin2hex(random_bytes(8));
$deleteKey = bin2hex(random_bytes(24));
} catch (Throwable $error) {
failResponse("投稿IDを作成できませんでした。", 500);
}

$rootDirectory = dirname(__DIR__);
$uploadDirectory = $rootDirectory . "/uploads/" . $worldId;

if (!is_dir($uploadDirectory)) {

if (!mkdir($uploadDirectory, 0755, true)) {
failResponse("画像保存フォルダを作成できませんでした。", 500);
}

}

$thumbnailFilename = "thumbnail." . $thumbnailExtension;
$panoramaFilename = "panorama." . $panoramaExtension;

$thumbnailDestination = $uploadDirectory . "/" . $thumbnailFilename;
$panoramaDestination = $uploadDirectory . "/" . $panoramaFilename;

if (!move_uploaded_file(
$_FILES["thumbnail"]["tmp_name"],
$thumbnailDestination
)) {
failResponse("サムネイル画像を保存できませんでした。", 500);
}

if (!move_uploaded_file(
$_FILES["panorama"]["tmp_name"],
$panoramaDestination
)) {

@unlink($thumbnailDestination);

failResponse("ぐるり画像を保存できませんでした。", 500);
}

$world = [
"id" => $worldId,
"title" => $title,
"author" => $author,
"description" => $description,
"xUrl" => $xUrl,
"externalUrl" => $externalUrl,
"thumbnail" => "./uploads/" . $worldId . "/" . $thumbnailFilename,
"panorama" => "./uploads/" . $worldId . "/" . $panoramaFilename,
"status" => "published",
"reportCount" => 0,
"deleteKey" => $deleteKey,
"createdAt" => gmdate("c")
];

$dataFile = $rootDirectory . "/data/worlds.json";

$fileHandle = fopen($dataFile, "c+");

if ($fileHandle === false) {
failResponse("投稿データを保存できませんでした。", 500);
}

if (!flock($fileHandle, LOCK_EX)) {
fclose($fileHandle);
failResponse("投稿データを保存できませんでした。", 500);
}

rewind($fileHandle);

$currentJson = stream_get_contents($fileHandle);

$currentWorlds = json_decode(
$currentJson ?: "[]",
true
);

if (!is_array($currentWorlds)) {
$currentWorlds = [];
}

$currentWorlds[] = $world;

$newJson = json_encode(
$currentWorlds,
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
failResponse("投稿データを保存できませんでした。", 500);
}

if (fwrite($fileHandle, $newJson) === false) {
flock($fileHandle, LOCK_UN);
fclose($fileHandle);
failResponse("投稿データを保存できませんでした。", 500);
}

fflush($fileHandle);
flock($fileHandle, LOCK_UN);
fclose($fileHandle);

echo json_encode([
"success" => true,
"world" => [
"id" => $world["id"],
"title" => $world["title"],
"author" => $world["author"],
"description" => $world["description"],
"xUrl" => $world["xUrl"],
"externalUrl" => $world["externalUrl"],
"thumbnail" => $world["thumbnail"],
"panorama" => $world["panorama"]
],
"deleteKey" => $deleteKey
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);