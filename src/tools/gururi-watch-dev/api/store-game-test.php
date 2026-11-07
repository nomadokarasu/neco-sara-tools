
<?php
require_once __DIR__ . "/admin-session.php";

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

if (empty($_SESSION["gururi_admin_logged_in"])) {
gameFail("開発版管理画面へのログインが必要です。", 401);
}

if (($_SERVER["HTTP_ORIGIN"] ?? "") !== "https://tools.neco-sara.com") {
gameFail("送信元を確認できません。", 403);
}

if (!isset($_FILES["game"]) || !is_array($_FILES["game"])) {
gameFail("HTMLファイルを選択してください。");
}

$file = $_FILES["game"];

if (($file["error"] ?? null) !== UPLOAD_ERR_OK) {
gameFail("アップロードに失敗しました。PHPの容量制限も確認してください。");
}

if (!is_string($file["name"] ?? null) || !preg_match('/\.html$/i', $file["name"])) {
gameFail("HTMLファイルのみ対応しています。");
}

$size = (int)($file["size"] ?? 0);

if ($size < 1 || $size > 50 * 1024 * 1024) {
gameFail("HTMLは50MB以下にしてください。");
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

if (!is_dir($directory) && !mkdir($directory, 0700, true)) {
gameFail("保存先を作成できませんでした。", 500);
}

$id = bin2hex(random_bytes(16));
$destination = $directory . "/" . $id . ".txt";

if (!move_uploaded_file($tmp, $destination)) {
gameFail("ゲームを保存できませんでした。", 500);
}

chmod($destination, 0600);

echo json_encode([
"success" => true,
"testId" => $id,
"bytes" => $size
], JSON_UNESCAPED_UNICODE);