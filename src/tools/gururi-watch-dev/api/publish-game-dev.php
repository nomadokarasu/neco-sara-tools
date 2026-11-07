
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");
header("X-Content-Type-Options: nosniff");

function failPublish($message, $status = 400) {
http_response_code($status);
echo json_encode(["success" => false, "error" => $message], JSON_UNESCAPED_UNICODE);
exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
failPublish("POSTで送信してください。", 405);
}

if (($_SERVER["HTTP_ORIGIN"] ?? "") !== "https://tools.neco-sara.com") {
failPublish("送信元を確認できません。", 403);
}

$id = (string)($_POST["id"] ?? "");
$token = (string)($_POST["token"] ?? "");

if (!preg_match('/^[a-f0-9]{32}$/', $id) || !preg_match('/^[a-f0-9]{64}$/', $token)) {
failPublish("投稿情報が正しくありません。");
}

$title = trim((string)($_POST["title"] ?? ""));
$author = trim((string)($_POST["author"] ?? ""));
$description = trim((string)($_POST["description"] ?? ""));
$xUrl = trim((string)($_POST["xUrl"] ?? ""));
$externalUrl = trim((string)($_POST["externalUrl"] ?? ""));

if ($title === "" || mb_strlen($title) > 80 || $author === "" || mb_strlen($author) > 80 || mb_strlen($description) > 1500) {
failPublish("作品名・作者名・紹介文を確認してください。");
}

foreach ([$xUrl, $externalUrl] as $url) {
if ($url !== "" && (!filter_var($url, FILTER_VALIDATE_URL) || !in_array(strtolower((string)parse_url($url, PHP_URL_SCHEME)), ["http", "https"], true))) {
failPublish("URLの形式が正しくありません。");
}
}

if (($_POST["termsAccepted"] ?? "") !== "1") {
failPublish("投稿条件への同意が必要です。");
}

if (!isset($_FILES["thumbnail"]) || ($_FILES["thumbnail"]["error"] ?? null) !== UPLOAD_ERR_OK) {
failPublish("サムネイル画像を選択してください。");
}

$thumbnail = $_FILES["thumbnail"];

if (($thumbnail["size"] ?? 0) < 1 || $thumbnail["size"] > 10 * 1024 * 1024) {
failPublish("サムネイルは10MB以下にしてください。");
}

$imageInfo = @getimagesize($thumbnail["tmp_name"]);
$allowedImages = [
"image/jpeg" => "jpg",
"image/png" => "png",
"image/webp" => "webp"
];

$mime = $imageInfo["mime"] ?? "";
$width = (int)($imageInfo[0] ?? 0);
$height = (int)($imageInfo[1] ?? 0);

if (!isset($allowedImages[$mime]) || $height <= 0 || $width / $height < 0.98 || $width / $height > 1.02) {
failPublish("サムネイルには正方形のJPG・PNG・WebPを使用してください。");
}

$root = dirname(__DIR__);
$dataDirectory = $root . "/data";
$temporaryDirectory = $dataDirectory . "/game-tests";
$publishedDirectory = $dataDirectory . "/published-games";

if (!is_file($dataDirectory . "/.htaccess") || !str_contains((string)file_get_contents($dataDirectory . "/.htaccess"), "Require all denied")) {
failPublish("非公開データのアクセス制限を確認できません。", 500);
}

$lock = fopen($dataDirectory . "/game-tests.lock", "c");

if ($lock === false || !flock($lock, LOCK_EX)) {
failPublish("投稿処理を開始できませんでした。", 500);
}

$temporaryFile = $temporaryDirectory . "/" . $id . ".txt";
$metadataFile = $temporaryDirectory . "/" . $id . ".json";

$metadata = is_file($metadataFile)
? json_decode((string)file_get_contents($metadataFile), true)
: null;

$expectedHash = is_array($metadata) ? (string)($metadata["tokenHash"] ?? "") : "";
$expiresAt = is_array($metadata) ? (int)($metadata["expiresAt"] ?? 0) : 0;

if (
!is_file($temporaryFile) ||
strlen($expectedHash) !== 64 ||
!hash_equals($expectedHash, hash("sha256", $token)) ||
time() >= $expiresAt
) {
flock($lock, LOCK_UN);
fclose($lock);
failPublish("プレビューの有効期限が切れているか、投稿権限がありません。", 403);
}

if (!is_dir($publishedDirectory) && !mkdir($publishedDirectory, 0700, true) && !is_dir($publishedDirectory)) {
flock($lock, LOCK_UN);
fclose($lock);
failPublish("ゲーム保存先を作成できませんでした。", 500);
}

try {
$worldId = bin2hex(random_bytes(8));
$deleteKey = bin2hex(random_bytes(24));
} catch (Throwable $error) {
flock($lock, LOCK_UN);
fclose($lock);
failPublish("作品IDを作成できませんでした。", 500);
}

$gameDestination = $publishedDirectory . "/" . $worldId . ".txt";
$uploadDirectory = $root . "/uploads/" . $worldId;
$thumbnailFilename = "thumbnail." . $allowedImages[$mime];
$thumbnailDestination = $uploadDirectory . "/" . $thumbnailFilename;

if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0755, true) && !is_dir($uploadDirectory)) {
flock($lock, LOCK_UN);
fclose($lock);
failPublish("画像保存先を作成できませんでした。", 500);
}

if (!copy($temporaryFile, $gameDestination)) {
flock($lock, LOCK_UN);
fclose($lock);
failPublish("ゲームを正式保存できませんでした。", 500);
}

@chmod($gameDestination, 0600);

if (!move_uploaded_file($thumbnail["tmp_name"], $thumbnailDestination)) {
@unlink($gameDestination);
flock($lock, LOCK_UN);
fclose($lock);
failPublish("サムネイルを保存できませんでした。", 500);
}

$world = [
"id" => $worldId,
"type" => "game",
"title" => $title,
"author" => $author,
"description" => $description,
"xUrl" => $xUrl,
"externalUrl" => $externalUrl,
"thumbnail" => "./uploads/" . $worldId . "/" . $thumbnailFilename,
"gameId" => $worldId,
"status" => "published",
"reportCount" => 0,
"deleteKey" => $deleteKey,
"createdAt" => gmdate("c")
];

$dataFile = $dataDirectory . "/worlds.json";
$handle = fopen($dataFile, "c+");

if ($handle === false || !flock($handle, LOCK_EX)) {
if (is_resource($handle)) {
fclose($handle);
}
@unlink($gameDestination);
@unlink($thumbnailDestination);
flock($lock, LOCK_UN);
fclose($lock);
failPublish("作品データを開けませんでした。", 500);
}

rewind($handle);
$existingJson = stream_get_contents($handle);
$worlds = json_decode($existingJson ?: "[]", true);

if (!is_array($worlds) || !array_is_list($worlds)) {
flock($handle, LOCK_UN);
fclose($handle);
@unlink($gameDestination);
@unlink($thumbnailDestination);
flock($lock, LOCK_UN);
fclose($lock);
failPublish("作品データを確認できませんでした。", 500);
}

$worlds[] = $world;
$newJson = json_encode($worlds, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($newJson === false) {
flock($handle, LOCK_UN);
fclose($handle);
@unlink($gameDestination);
@unlink($thumbnailDestination);
flock($lock, LOCK_UN);
fclose($lock);
failPublish("作品データを変換できませんでした。", 500);
}

rewind($handle);
$written = ftruncate($handle, 0) && fwrite($handle, $newJson) === strlen($newJson);

if ($written) {
fflush($handle);
}

flock($handle, LOCK_UN);
fclose($handle);

if (!$written) {
@unlink($gameDestination);
@unlink($thumbnailDestination);
flock($lock, LOCK_UN);
fclose($lock);
failPublish("作品データを保存できませんでした。", 500);
}

@unlink($temporaryFile);
@unlink($metadataFile);

flock($lock, LOCK_UN);
fclose($lock);

echo json_encode([
"success" => true,
"world" => [
"id" => $worldId,
"title" => $title,
"author" => $author,
"type" => "game"
],
"deleteKey" => $deleteKey
], JSON_UNESCAPED_UNICODE);