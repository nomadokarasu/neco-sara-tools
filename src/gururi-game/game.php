
<?php
header("Content-Type: text/html; charset=UTF-8");
header("Cache-Control: no-store");
header("X-Content-Type-Options: nosniff");
header("X-Robots-Tag: noindex, nofollow");
header("Referrer-Policy: no-referrer");
header("Permissions-Policy: camera=(), microphone=(), geolocation=()");
header("Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline' blob:; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors https://tools.neco-sara.com 'self'; sandbox allow-scripts allow-pointer-lock");


$id = (string)($_GET["id"] ?? "");
$site = (string)($_GET["site"] ?? "dev");

if (!in_array($site, ["dev", "release"], true)) {
http_response_code(400);
exit("サイト指定が正しくありません。");
}

$dataRoot = dirname(__DIR__) . "/tools/tools/"
. ($site === "release" ? "gururi-watch" : "gururi-watch-dev")
. "/data";

if (preg_match('/^[a-f0-9]{32}$/', $id)) {
$directory = realpath($dataRoot . "/game-tests");

if ($directory === false) {
http_response_code(503);
exit("一時保存先が見つかりません。");
}

$file = $directory . "/" . $id . ".txt";
$metadataFile = $directory . "/" . $id . ".json";
$token = (string)($_GET["token"] ?? "");

if (!is_file($file) || !is_readable($file)) {
http_response_code(404);
exit("ゲームが見つかりません。");
}

$metadata = is_file($metadataFile)
? json_decode((string)file_get_contents($metadataFile), true)
: null;

$expectedHash = is_array($metadata)
? (string)($metadata["tokenHash"] ?? "")
: "";

$expiresAt = is_array($metadata)
? (int)($metadata["expiresAt"] ?? 0)
: 0;

if (
!preg_match('/^[a-f0-9]{64}$/', $token) ||
strlen($expectedHash) !== 64 ||
!hash_equals($expectedHash, hash("sha256", $token)) ||
time() >= $expiresAt
) {
http_response_code(403);
exit("プレビューの有効期限が切れているか、アクセス権限がありません。");
}
} elseif (preg_match('/^[a-f0-9]{16}$/', $id)) {
$worldsFile = $dataRoot . "/worlds.json";

if (!is_file($worldsFile) || !is_readable($worldsFile)) {
http_response_code(404);
exit("作品が見つかりません。");
}

$worlds = json_decode((string)file_get_contents($worldsFile), true);

if (!is_array($worlds)) {
http_response_code(500);
exit("作品情報を読み込めません。");
}

$allowed = false;

foreach ($worlds as $world) {
if (
is_array($world) &&
($world["id"] ?? "") === $id &&
($world["type"] ?? "") === "game" &&
($world["status"] ?? "") === "published" &&
($world["gameId"] ?? "") === $id
) {
$allowed = true;
break;
}
}

if (!$allowed) {
http_response_code(404);
exit("公開されているゲームが見つかりません。");
}

$directory = realpath($dataRoot . "/published-games");

if ($directory === false) {
http_response_code(503);
exit("ゲーム保存先が見つかりません。");
}

$file = $directory . "/" . $id . ".txt";
} else {
http_response_code(400);
exit("ゲームIDが正しくありません。");
}

if (!is_file($file) || !is_readable($file)) {
http_response_code(404);
exit("ゲームが見つかりません。");
}

$size = filesize($file);

if ($size === false || $size < 1 || $size > 50 * 1024 * 1024) {
http_response_code(413);
exit("ファイル容量を確認できないか、上限を超えています。");
}

readfile($file);