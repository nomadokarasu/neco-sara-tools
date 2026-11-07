
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");
header("X-Content-Type-Options: nosniff");

function gameFail($message, $status = 400) {
http_response_code($status);
echo json_encode([
"success" => false,
"error" => $message
], JSON_UNESCAPED_UNICODE);
exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
gameFail("POSTで送信してください。", 405);
}

if (($_SERVER["HTTP_ORIGIN"] ?? "") !== "https://tools.neco-sara.com") {
gameFail("送信元を確認できません。", 403);
}

if (($_POST["termsAccepted"] ?? "") !== "1") {
gameFail("投稿条件への同意が必要です。");
}

if (!isset($_FILES["game"]) || !is_array($_FILES["game"])) {
gameFail("HTMLファイルを選択してください。");
}

$file = $_FILES["game"];

if (($file["error"] ?? null) !== UPLOAD_ERR_OK) {
gameFail("アップロードに失敗しました。PHPの容量制限を確認してください。");
}

if (!is_string($file["name"] ?? null) || !preg_match('/\.html$/i', $file["name"])) {
gameFail("HTMLファイルのみ対応しています。");
}

$size = (int)($file["size"] ?? 0);

if ($size < 1 || $size > 50 * 1024 * 1024) {
gameFail("現在のテストではHTMLは50MB以下にしてください。");
}

$tmp = $file["tmp_name"] ?? "";

if (!is_string($tmp) || !is_uploaded_file($tmp)) {
gameFail("アップロードファイルを確認できません。");
}

$contents = file_get_contents($tmp);

if ($contents === false || strlen($contents) !== $size) {
gameFail("HTMLを読み取れませんでした。");
}

if (
!preg_match('/window\.GURURI_EXPORTED_WORK\s*=\s*\{\s*"format"\s*:\s*"gururi-exported-work"\s*,\s*"version"\s*:\s*2\s*,/s', $contents) ||
!str_contains($contents, 'window.GURURI_EMBEDDED_MEDIA=')
) {
gameFail("ぐるりエディタの書き出し形式を確認できませんでした。");
}

$root = dirname(__DIR__);
$dataDirectory = $root . "/data";

if (
!is_file($dataDirectory . "/.htaccess") ||
!str_contains(
(string)file_get_contents($dataDirectory . "/.htaccess"),
"Require all denied"
)
) {
gameFail("非公開データのアクセス制限を確認できません。", 500);
}

$directory = $dataDirectory . "/game-tests";

if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
gameFail("保存先を作成できませんでした。", 500);
}

$lockPath = $dataDirectory . "/game-tests.lock";
$lock = fopen($lockPath, "c");

if ($lock === false || !flock($lock, LOCK_EX)) {
gameFail("保存処理を開始できませんでした。", 500);
}

$existing = glob($directory . "/*.txt");

if ($existing === false) {
flock($lock, LOCK_UN);
fclose($lock);
gameFail("一時ファイルを確認できませんでした。", 500);
}

$expiryTime = time() - 30 * 60;

foreach ($existing as $existingFile) {
$metadataFile = substr($existingFile, 0, -4) . ".json";
$modifiedTime = filemtime($existingFile);
$metadata = is_file($metadataFile)
? json_decode((string)file_get_contents($metadataFile), true)
: null;

$expired = is_array($metadata) && isset($metadata["expiresAt"])
? time() >= (int)$metadata["expiresAt"]
: ($modifiedTime !== false && $modifiedTime < $expiryTime);

if ($expired) {
@unlink($existingFile);
@unlink($metadataFile);
}
}

foreach (glob($directory . "/*.json") ?: [] as $metadataFile) {
$dataFile = substr($metadataFile, 0, -5) . ".txt";
if (!is_file($dataFile)) {
@unlink($metadataFile);
}
}

$existing = glob($directory . "/*.txt");

if ($existing === false || count($existing) >= 10) {
flock($lock, LOCK_UN);
fclose($lock);
gameFail("保存テストの上限10件に達しました。", 409);
}

try {
$id = bin2hex(random_bytes(16));
$token = bin2hex(random_bytes(32));
} catch (Throwable $error) {
flock($lock, LOCK_UN);
fclose($lock);
gameFail("保存IDを作成できませんでした。", 500);
}

$destination = $directory . "/" . $id . ".txt";
$metadataFile = $directory . "/" . $id . ".json";

$metadata = json_encode([
"tokenHash" => hash("sha256", $token),
"expiresAt" => time() + 30 * 60
], JSON_UNESCAPED_SLASHES);

if ($metadata === false || file_put_contents($metadataFile, $metadata, LOCK_EX) === false) {
@unlink($metadataFile);
flock($lock, LOCK_UN);
fclose($lock);
gameFail("保存情報を作成できませんでした。", 500);
}

@chmod($metadataFile, 0600);

if (!move_uploaded_file($tmp, $destination)) {
@unlink($metadataFile);
flock($lock, LOCK_UN);
fclose($lock);
gameFail("ゲームを保存できませんでした。", 500);
}

@chmod($destination, 0600);

flock($lock, LOCK_UN);
fclose($lock);

echo json_encode([
"success" => true,
"testId" => $id,
"token" => $token,
"bytes" => $size
], JSON_UNESCAPED_UNICODE);