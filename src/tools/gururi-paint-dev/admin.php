<?php

declare(strict_types=1);

$isHttps =
isset($_SERVER['HTTPS']) &&
$_SERVER['HTTPS'] !== '' &&
$_SERVER['HTTPS'] !== 'off';

session_set_cookie_params([
'lifetime' => 0,
'path' => '/',
'secure' => $isHttps,
'httponly' => true,
'samesite' => 'Strict'
]);

session_start();

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store, no-cache, must-revalidate');

$credentialsPath =
__DIR__ . '/.admin-credentials.php';

$contentPath =
__DIR__ . '/home-content.json';

$defaultContent = [
'languages' => [
'ja' => [
'title' => 'ぐるりペイント',
'description' => 'カメラをぐるぐる回しながらお絵描きできます。',
'startButton' => 'はじめる',
'noticeHeading' => 'お知らせ',
'linksHeading' => '関連ページ',
'footer' => '© JUNOTA'
],
'en' => [
'title' => 'Gururi Paint',
'description' => 'A painting tool that lets you draw while rotating the camera around you.',
'startButton' => 'START',
'noticeHeading' => 'News',
'linksHeading' => 'Links',
'footer' => '© JUNOTA'
]
],
'notices' => [
[
'ja' => [
'text' => 'ぐるりペイント Web版V2を開発しています。',
'url' => ''
],
'en' => [
'text' => 'Gururi Paint Web Version 2 is currently in development.',
'url' => ''
],
'visible' => true,
'newTab' => false
]
],
'relatedPages' => [
[
'ja' => [
'title' => 'ぐるりうむ',
'description' => 'ぐるり作品を見る',
'url' => ''
],
'en' => [
'title' => 'Gururium',
'description' => 'View Gururi artworks',
'url' => ''
],
'thumbnail' => '',
'visible' => true,
'newTab' => false
],
[
'ja' => [
'title' => '開発ブログ',
'description' => '開発の記録を読む',
'url' => ''
],
'en' => [
'title' => 'Development Blog',
'description' => 'Read the development log',
'url' => ''
],
'thumbnail' => '',
'visible' => true,
'newTab' => false
],
[
'ja' => [
'title' => '製品版発売通知',
'description' => '製品版の情報を受け取る',
'url' => ''
],
'en' => [
'title' => 'Product Release Updates',
'description' => 'Receive product release information',
'url' => ''
],
'thumbnail' => '',
'visible' => true,
'newTab' => false
],
[
'ja' => [
'title' => 'JUNOTAを応援する',
'description' => '寄付ページを見る',
'url' => ''
],
'en' => [
'title' => 'Support JUNOTA',
'description' => 'Visit the donation page',
'url' => ''
],
'thumbnail' => '',
'visible' => true,
'newTab' => false
]
]
];

function escapeHtml(string $value): string
{
return htmlspecialchars(
$value,
ENT_QUOTES | ENT_SUBSTITUTE,
'UTF-8'
);
}

function loadHomeContent(
string $contentPath,
array $defaultContent
): array
{
if (!is_file($contentPath)) {
return $defaultContent;
}

$json =
file_get_contents($contentPath);

if ($json === false) {
return $defaultContent;
}

$data =
json_decode($json, true);

if (!is_array($data)) {
return $defaultContent;
}

return array_replace_recursive(
$defaultContent,
$data
);
}

function validPublicUrl(string $url): bool
{
if ($url === '') {
return true;
}

if (
filter_var(
$url,
FILTER_VALIDATE_URL
) === false
) {
return false;
}

$scheme =
strtolower(
(string) parse_url(
$url,
PHP_URL_SCHEME
)
);

return in_array(
$scheme,
['http', 'https'],
true
);
}

function postedText(
array $source,
string $key
): string
{
return trim(
(string) ($source[$key] ?? '')
);
}

function saveThumbnail(
array $file,
string $thumbnailDirectory
): string
{
$errorCode =
(int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);

if ($errorCode === UPLOAD_ERR_NO_FILE) {
return '';
}

if ($errorCode !== UPLOAD_ERR_OK) {
throw new RuntimeException(
'サムネイル画像をアップロードできませんでした。'
);
}

$fileSize =
(int) ($file['size'] ?? 0);

if (
$fileSize <= 0 ||
$fileSize > 5 * 1024 * 1024
) {
throw new RuntimeException(
'サムネイル画像は5MB以内にしてください。'
);
}

$temporaryPath =
(string) ($file['tmp_name'] ?? '');

if (
$temporaryPath === '' ||
!is_uploaded_file($temporaryPath)
) {
throw new RuntimeException(
'アップロードされた画像を確認できませんでした。'
);
}

$imageInformation =
@getimagesize(
$temporaryPath
);

if ($imageInformation === false) {
throw new RuntimeException(
'画像ファイルを選択してください。'
);
}

$mimeType =
(string) ($imageInformation['mime'] ?? '');

$extensions = [
'image/jpeg' => 'jpg',
'image/png' => 'png',
'image/webp' => 'webp'
];

if (!isset($extensions[$mimeType])) {
throw new RuntimeException(
'使用できる画像形式はJPEG、PNG、WebPです。'
);
}

if (
!is_dir($thumbnailDirectory) &&
!mkdir(
$thumbnailDirectory,
0755,
true
) &&
!is_dir($thumbnailDirectory)
) {
throw new RuntimeException(
'サムネイル保存フォルダを作成できませんでした。'
);
}

$fileName =
bin2hex(
random_bytes(16)
) .
'.' .
$extensions[$mimeType];

$destination =
$thumbnailDirectory .
'/' .
$fileName;

if (
!move_uploaded_file(
$temporaryPath,
$destination
)
) {
throw new RuntimeException(
'サムネイル画像を保存できませんでした。'
);
}

return
'home-thumbnails/' .
$fileName;
}

if (
!isset($_SESSION['csrf_token']) ||
!is_string($_SESSION['csrf_token'])
) {
$_SESSION['csrf_token'] =
bin2hex(
random_bytes(32)
);
}

$csrfToken =
$_SESSION['csrf_token'];

$message = '';
$error = '';

$isSetup =
!is_file($credentialsPath);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
$postedToken =
(string) ($_POST['csrf_token'] ?? '');

if (
!hash_equals(
$csrfToken,
$postedToken
)
) {
http_response_code(403);

$error =
'操作の有効期限が切れました。ページを再読み込みしてください。';
}
}

if (
$error === '' &&
$isSetup &&
$_SERVER['REQUEST_METHOD'] === 'POST' &&
($_POST['action'] ?? '') === 'setup'
) {
$username =
trim(
(string) ($_POST['username'] ?? '')
);

$password =
(string) ($_POST['password'] ?? '');

$passwordConfirm =
(string) ($_POST['password_confirm'] ?? '');

if (
$username === '' ||
mb_strlen($username) > 100
) {
$error =
'ユーザー名を入力してください。';
} elseif (mb_strlen($password) < 12) {
$error =
'パスワードは12文字以上にしてください。';
} elseif ($password !== $passwordConfirm) {
$error =
'確認用パスワードが一致していません。';
} else {
$credentials = [
'username' => $username,
'passwordHash' => password_hash(
$password,
PASSWORD_DEFAULT
)
];

$credentialsPhp =
"<?php\nreturn " .
var_export(
$credentials,
true
) .
";\n";

$result =
file_put_contents(
$credentialsPath,
$credentialsPhp,
LOCK_EX
);

if ($result === false) {
$error =
'認証設定を保存できませんでした。';
} else {
@chmod(
$credentialsPath,
0600
);

session_regenerate_id(true);

$_SESSION['admin_logged_in'] =
true;

$isSetup =
false;

$message =
'管理者アカウントを設定しました。';
}
}
}

if (
$error === '' &&
!$isSetup &&
$_SERVER['REQUEST_METHOD'] === 'POST' &&
($_POST['action'] ?? '') === 'login'
) {
$credentials =
require $credentialsPath;

$username =
(string) ($_POST['username'] ?? '');

$password =
(string) ($_POST['password'] ?? '');

$validUsername =
isset($credentials['username']) &&
is_string($credentials['username']) &&
hash_equals(
$credentials['username'],
$username
);

$validPassword =
isset($credentials['passwordHash']) &&
is_string($credentials['passwordHash']) &&
password_verify(
$password,
$credentials['passwordHash']
);

if (
$validUsername &&
$validPassword
) {
session_regenerate_id(true);

$_SESSION['admin_logged_in'] =
true;

header(
'Location: admin.php'
);

exit;
}

$error =
'ユーザー名またはパスワードが違います。';
}

if (
$error === '' &&
$_SERVER['REQUEST_METHOD'] === 'POST' &&
($_POST['action'] ?? '') === 'logout'
) {
$_SESSION = [];

session_destroy();

header(
'Location: admin.php'
);

exit;
}

$isLoggedIn =
($_SESSION['admin_logged_in'] ?? false) === true;

$content =
loadHomeContent(
$contentPath,
$defaultContent
);

if (
$error === '' &&
$isLoggedIn &&
$_SERVER['REQUEST_METHOD'] === 'POST' &&
($_POST['action'] ?? '') === 'save'
) {
$newContent = [
'languages' => [],
'notices' => [],
'relatedPages' => []
];

foreach (
['ja', 'en'] as $language
) {
$languagePost =
is_array($_POST['languages'][$language] ?? null)
? $_POST['languages'][$language]
: [];

$newContent['languages'][$language] = [
'title' => postedText(
$languagePost,
'title'
),
'description' => postedText(
$languagePost,
'description'
),
'startButton' => postedText(
$languagePost,
'startButton'
),
'noticeHeading' => postedText(
$languagePost,
'noticeHeading'
),
'linksHeading' => postedText(
$languagePost,
'linksHeading'
),
'footer' => postedText(
$languagePost,
'footer'
)
];
}

$postedNotices =
is_array($_POST['notices'] ?? null)
? array_values($_POST['notices'])
: [];

if (count($postedNotices) > 50) {
$error =
'お知らせは50件以内にしてください。';
}

if ($error === '') {
foreach (
$postedNotices as $noticeIndex => $noticePost
) {
if (!is_array($noticePost)) {
continue;
}

$jaPost =
is_array($noticePost['ja'] ?? null)
? $noticePost['ja']
: [];

$enPost =
is_array($noticePost['en'] ?? null)
? $noticePost['en']
: [];

$jaUrl =
postedText(
$jaPost,
'url'
);

$enUrl =
postedText(
$enPost,
'url'
);

if (
!validPublicUrl($jaUrl) ||
!validPublicUrl($enUrl)
) {
$error =
'お知らせ' .
($noticeIndex + 1) .
'のURLが正しくありません。';

break;
}

$newContent['notices'][] = [
'ja' => [
'text' => postedText(
$jaPost,
'text'
),
'url' => $jaUrl
],
'en' => [
'text' => postedText(
$enPost,
'text'
),
'url' => $enUrl
],
'visible' =>
isset($noticePost['visible']),
'newTab' =>
isset($noticePost['newTab'])
];
}
}

if ($error === '') {
$postedRelatedPages =
is_array($_POST['relatedPages'] ?? null)
? array_values($_POST['relatedPages'])
: [];

if (count($postedRelatedPages) > 50) {
$error =
'関連ページは50件以内にしてください。';
}
}

if ($error === '') {
foreach (
$postedRelatedPages as $pageIndex => $pagePost
) {
if (!is_array($pagePost)) {
continue;
}

$jaPost =
is_array($pagePost['ja'] ?? null)
? $pagePost['ja']
: [];

$enPost =
is_array($pagePost['en'] ?? null)
? $pagePost['en']
: [];

$jaUrl =
postedText(
$jaPost,
'url'
);

$enUrl =
postedText(
$enPost,
'url'
);

if (
!validPublicUrl($jaUrl) ||
!validPublicUrl($enUrl)
) {
$error =
'関連ページ' .
($pageIndex + 1) .
'のURLが正しくありません。';

break;
}

$thumbnail =
postedText(
$pagePost,
'currentThumbnail'
);

if (
!preg_match(
'#\Ahome-thumbnails/[a-f0-9]{32}\.(jpg|png|webp)\z#D',
$thumbnail
)
) {
$thumbnail = '';
}

if (isset($pagePost['removeThumbnail'])) {
$thumbnail = '';
}

$uploadedFile = [
'name' =>
$_FILES['relatedThumbnails']['name'][$pageIndex] ?? '',
'type' =>
$_FILES['relatedThumbnails']['type'][$pageIndex] ?? '',
'tmp_name' =>
$_FILES['relatedThumbnails']['tmp_name'][$pageIndex] ?? '',
'error' =>
$_FILES['relatedThumbnails']['error'][$pageIndex] ?? UPLOAD_ERR_NO_FILE,
'size' =>
$_FILES['relatedThumbnails']['size'][$pageIndex] ?? 0
];

try {
$newThumbnail =
saveThumbnail(
$uploadedFile,
__DIR__ . '/home-thumbnails'
);

if ($newThumbnail !== '') {
$thumbnail =
$newThumbnail;
}
} catch (RuntimeException $exception) {
$error =
'関連ページ' .
($pageIndex + 1) .
'：' .
$exception->getMessage();

break;
}

$newContent['relatedPages'][] = [
'ja' => [
'title' => postedText(
$jaPost,
'title'
),
'description' => postedText(
$jaPost,
'description'
),
'url' => $jaUrl
],
'en' => [
'title' => postedText(
$enPost,
'title'
),
'description' => postedText(
$enPost,
'description'
),
'url' => $enUrl
],
'thumbnail' => $thumbnail,
'visible' =>
isset($pagePost['visible']),
'newTab' =>
isset($pagePost['newTab'])
];
}
}

if ($error === '') {
$json =
json_encode(
$newContent,
JSON_UNESCAPED_UNICODE |
JSON_UNESCAPED_SLASHES |
JSON_PRETTY_PRINT
);

if ($json === false) {
$error =
'保存データを作成できませんでした。';
} else {
$result =
file_put_contents(
$contentPath,
$json . PHP_EOL,
LOCK_EX
);

if ($result === false) {
$error =
'トップページの内容を保存できませんでした。';
} else {
$content =
$newContent;

$message =
'トップページの内容を保存しました。';
}
}
}
}

?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>
<meta
name="robots"
content="noindex, nofollow"
>
<title>ぐるりペイント 管理画面</title>

<style>
* {
box-sizing: border-box;
}

body {
margin: 0;
padding: 40px 20px;
background: #f4f4f1;
color: #181818;
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.admin {
width: min(100%, 920px);
margin: 0 auto;
}

.admin__header {
display: flex;
align-items: center;
justify-content: space-between;
gap: 20px;
margin-bottom: 30px;
}

.admin__title {
margin: 0;
font-size: 24px;
}

.admin__panel {
padding: 24px;
border: 1px solid #bbb;
border-radius: 6px;
background: #fff;
}

.admin__section {
margin-top: 32px;
padding-top: 28px;
border-top: 1px solid #ccc;
}

.admin__section:first-child {
margin-top: 0;
padding-top: 0;
border-top: 0;
}

.admin__section-title {
margin: 0 0 18px;
font-size: 18px;
}

.admin__language-grid {
display: grid;
grid-template-columns: repeat(2, minmax(0, 1fr));
gap: 20px;
}

.admin__language-panel {
padding: 18px;
border: 1px solid #ccc;
border-radius: 5px;
}

.admin__language-title {
margin: 0 0 18px;
font-size: 15px;
}

.admin__field {
display: block;
margin-top: 18px;
}

.admin__field:first-of-type {
margin-top: 0;
}

.admin__label {
display: block;
margin-bottom: 7px;
font-size: 13px;
font-weight: 600;
}

.admin__input,
.admin__textarea {
display: block;
width: 100%;
padding: 10px 12px;
border: 1px solid #aaa;
border-radius: 4px;
background: #fff;
color: #181818;
font: inherit;
}

.admin__textarea {
min-height: 88px;
resize: vertical;
}

.admin__checks {
display: flex;
flex-wrap: wrap;
gap: 18px;
margin-top: 16px;
font-size: 13px;
}

.admin__button {
min-height: 42px;
padding: 0 18px;
border: 1px solid #181818;
border-radius: 4px;
background: #181818;
color: #fff;
font: inherit;
cursor: pointer;
}

.admin__button--secondary {
background: #fff;
color: #181818;
}

.admin__button--small {
min-height: 34px;
padding: 0 12px;
font-size: 12px;
}

.admin__button--danger {
border-color: #a22;
background: #fff;
color: #a22;
}

.admin__actions {
display: flex;
justify-content: flex-end;
gap: 8px;
margin-top: 28px;
}

.admin__item {
margin-top: 16px;
padding: 18px;
border: 1px solid #bbb;
border-radius: 5px;
}

.admin__item:first-child {
margin-top: 0;
}

.admin__item-actions {
display: flex;
justify-content: flex-end;
gap: 8px;
margin-bottom: 16px;
}

.admin__thumbnail-preview {
width: min(100%, 320px);
margin-bottom: 18px;
border: 1px solid #ccc;
border-radius: 4px;
overflow: hidden;
background: #eee;
}

.admin__thumbnail-preview img {
display: block;
width: 100%;
height: auto;
}

.admin__message,
.admin__error {
margin: 0 0 20px;
padding: 12px;
border: 1px solid #777;
border-radius: 4px;
background: #fff;
}

.admin__error {
border-color: #a11;
color: #a11;
}

@media (max-width: 700px) {
body {
padding: 22px 14px;
}

.admin__header {
align-items: flex-start;
}

.admin__panel {
padding: 18px;
}

.admin__language-grid {
grid-template-columns: 1fr;
}
}
</style>
</head>

<body>

<main class="admin">

<header class="admin__header">

<h1 class="admin__title">
ぐるりペイント 管理画面
</h1>

<?php if ($isLoggedIn): ?>

<form method="post">

<input
type="hidden"
name="csrf_token"
value="<?= escapeHtml($csrfToken) ?>"
>

<input
type="hidden"
name="action"
value="logout"
>

<button
class="admin__button admin__button--secondary"
type="submit"
>
ログアウト
</button>

</form>

<?php endif; ?>

</header>

<?php if ($message !== ''): ?>

<p class="admin__message">
<?= escapeHtml($message) ?>
</p>

<?php endif; ?>

<?php if ($error !== ''): ?>

<p class="admin__error">
<?= escapeHtml($error) ?>
</p>

<?php endif; ?>

<?php if ($isSetup): ?>

<section class="admin__panel">

<h2 class="admin__section-title">
初回設定
</h2>

<form method="post">

<input
type="hidden"
name="csrf_token"
value="<?= escapeHtml($csrfToken) ?>"
>

<input
type="hidden"
name="action"
value="setup"
>

<label class="admin__field">

<span class="admin__label">
ユーザー名
</span>

<input
class="admin__input"
type="text"
name="username"
autocomplete="username"
required
>

</label>

<label class="admin__field">

<span class="admin__label">
パスワード（12文字以上）
</span>

<input
class="admin__input"
type="password"
name="password"
autocomplete="new-password"
minlength="12"
required
>

</label>

<label class="admin__field">

<span class="admin__label">
パスワード確認
</span>

<input
class="admin__input"
type="password"
name="password_confirm"
autocomplete="new-password"
minlength="12"
required
>

</label>

<div class="admin__actions">

<button
class="admin__button"
type="submit"
>
管理者を設定
</button>

</div>

</form>

</section>

<?php elseif (!$isLoggedIn): ?>

<section class="admin__panel">

<h2 class="admin__section-title">
ログイン
</h2>

<form method="post">

<input
type="hidden"
name="csrf_token"
value="<?= escapeHtml($csrfToken) ?>"
>

<input
type="hidden"
name="action"
value="login"
>

<label class="admin__field">

<span class="admin__label">
ユーザー名
</span>

<input
class="admin__input"
type="text"
name="username"
autocomplete="username"
required
>

</label>

<label class="admin__field">

<span class="admin__label">
パスワード
</span>

<input
class="admin__input"
type="password"
name="password"
autocomplete="current-password"
required
>

</label>

<div class="admin__actions">

<button
class="admin__button"
type="submit"
>
ログイン
</button>

</div>

</form>

</section>

<?php else: ?>

<form
class="admin__panel"
method="post"
enctype="multipart/form-data"
>

<input
type="hidden"
name="csrf_token"
value="<?= escapeHtml($csrfToken) ?>"
>

<input
type="hidden"
name="action"
value="save"
>

<section class="admin__section">

<h2 class="admin__section-title">
トップページ基本情報
</h2>

<div class="admin__language-grid">

<?php foreach (['ja' => '日本語', 'en' => 'English'] as $language => $languageLabel): ?>

<div class="admin__language-panel">

<h3 class="admin__language-title">
<?= escapeHtml($languageLabel) ?>
</h3>

<?php
$basicFields = [
'title' => 'タイトル',
'description' => '紹介文',
'startButton' => '開始ボタン',
'noticeHeading' => 'お知らせ見出し',
'linksHeading' => '関連ページ見出し',
'footer' => 'フッター'
];

foreach ($basicFields as $field => $label):
$value =
(string) (
$content['languages'][$language][$field] ?? ''
);
?>

<label class="admin__field">

<span class="admin__label">
<?= escapeHtml($label) ?>
</span>

<?php if ($field === 'description'): ?>

<textarea
class="admin__textarea"
name="languages[<?= escapeHtml($language) ?>][<?= escapeHtml($field) ?>]"
><?= escapeHtml($value) ?></textarea>

<?php else: ?>

<input
class="admin__input"
type="text"
name="languages[<?= escapeHtml($language) ?>][<?= escapeHtml($field) ?>]"
value="<?= escapeHtml($value) ?>"
>

<?php endif; ?>

</label>

<?php endforeach; ?>

</div>

<?php endforeach; ?>

</div>

</section>

<section class="admin__section">

<h2 class="admin__section-title">
お知らせ
</h2>

<div id="noticeList">

<?php foreach ($content['notices'] as $index => $notice): ?>

<div
class="admin__item"
data-notice-item
>

<div class="admin__item-actions">

<button
class="admin__button admin__button--secondary admin__button--small"
type="button"
data-notice-up
>
上へ
</button>

<button
class="admin__button admin__button--secondary admin__button--small"
type="button"
data-notice-down
>
下へ
</button>

<button
class="admin__button admin__button--danger admin__button--small"
type="button"
data-notice-delete
>
削除
</button>

</div>

<div class="admin__language-grid">

<?php foreach (['ja' => '日本語', 'en' => 'English'] as $language => $languageLabel): ?>

<div class="admin__language-panel">

<h3 class="admin__language-title">
<?= escapeHtml($languageLabel) ?>
</h3>

<label class="admin__field">

<span class="admin__label">
文章
</span>

<textarea
class="admin__textarea"
name="notices[<?= (int) $index ?>][<?= escapeHtml($language) ?>][text]"
><?= escapeHtml((string) ($notice[$language]['text'] ?? '')) ?></textarea>

</label>

<label class="admin__field">

<span class="admin__label">
リンク先URL
</span>

<input
class="admin__input"
type="url"
name="notices[<?= (int) $index ?>][<?= escapeHtml($language) ?>][url]"
value="<?= escapeHtml((string) ($notice[$language]['url'] ?? '')) ?>"
placeholder="https://"
>

</label>

</div>

<?php endforeach; ?>

</div>

<div class="admin__checks">

<label>

<input
type="checkbox"
name="notices[<?= (int) $index ?>][visible]"
<?= !empty($notice['visible']) ? 'checked' : '' ?>
>

表示する

</label>

<label>

<input
type="checkbox"
name="notices[<?= (int) $index ?>][newTab]"
<?= !empty($notice['newTab']) ? 'checked' : '' ?>
>

新しいタブで開く

</label>

</div>

</div>

<?php endforeach; ?>

</div>

<button
id="addNoticeButton"
class="admin__button admin__button--secondary"
type="button"
>
お知らせを追加
</button>

</section>

<section class="admin__section">

<h2 class="admin__section-title">
関連ページ
</h2>

<div id="relatedPageList">

<?php foreach (($content['relatedPages'] ?? []) as $index => $page): ?>

<div
class="admin__item"
data-related-page-item
>

<div class="admin__item-actions">

<button
class="admin__button admin__button--secondary admin__button--small"
type="button"
data-related-page-up
>
上へ
</button>

<button
class="admin__button admin__button--secondary admin__button--small"
type="button"
data-related-page-down
>
下へ
</button>

<button
class="admin__button admin__button--danger admin__button--small"
type="button"
data-related-page-delete
>
削除
</button>

</div>

<?php if (!empty($page['thumbnail'])): ?>

<div class="admin__thumbnail-preview">

<img
src="<?= escapeHtml((string) $page['thumbnail']) ?>"
alt=""
>

</div>

<?php endif; ?>

<input
type="hidden"
name="relatedPages[<?= (int) $index ?>][currentThumbnail]"
data-related-page-field="currentThumbnail"
value="<?= escapeHtml((string) ($page['thumbnail'] ?? '')) ?>"
>

<label class="admin__field">

<span class="admin__label">
サムネイル画像
</span>

<input
class="admin__input"
type="file"
name="relatedThumbnails[<?= (int) $index ?>]"
accept="image/jpeg,image/png,image/webp"
data-related-page-file
>

</label>

<?php if (!empty($page['thumbnail'])): ?>

<label class="admin__field">

<input
type="checkbox"
name="relatedPages[<?= (int) $index ?>][removeThumbnail]"
data-related-page-field="removeThumbnail"
>

現在のサムネイルを外す

</label>

<?php endif; ?>

<div class="admin__language-grid">

<?php foreach (['ja' => '日本語', 'en' => 'English'] as $language => $languageLabel): ?>

<div class="admin__language-panel">

<h3 class="admin__language-title">
<?= escapeHtml($languageLabel) ?>
</h3>

<label class="admin__field">

<span class="admin__label">
タイトル
</span>

<input
class="admin__input"
type="text"
name="relatedPages[<?= (int) $index ?>][<?= escapeHtml($language) ?>][title]"
data-related-page-field="<?= escapeHtml($language) ?>][title"
value="<?= escapeHtml((string) ($page[$language]['title'] ?? '')) ?>"
>

</label>

<label class="admin__field">

<span class="admin__label">
紹介文
</span>

<input
class="admin__input"
type="text"
name="relatedPages[<?= (int) $index ?>][<?= escapeHtml($language) ?>][description]"
data-related-page-field="<?= escapeHtml($language) ?>][description"
value="<?= escapeHtml((string) ($page[$language]['description'] ?? '')) ?>"
>

</label>

<label class="admin__field">

<span class="admin__label">
リンク先URL
</span>

<input
class="admin__input"
type="url"
name="relatedPages[<?= (int) $index ?>][<?= escapeHtml($language) ?>][url]"
data-related-page-field="<?= escapeHtml($language) ?>][url"
value="<?= escapeHtml((string) ($page[$language]['url'] ?? '')) ?>"
placeholder="https://"
>

</label>

</div>

<?php endforeach; ?>

</div>

<div class="admin__checks">

<label>

<input
type="checkbox"
name="relatedPages[<?= (int) $index ?>][visible]"
data-related-page-field="visible"
<?= !empty($page['visible']) ? 'checked' : '' ?>
>

表示する

</label>

<label>

<input
type="checkbox"
name="relatedPages[<?= (int) $index ?>][newTab]"
data-related-page-field="newTab"
<?= !empty($page['newTab']) ? 'checked' : '' ?>
>

新しいタブで開く

</label>

</div>

</div>

<?php endforeach; ?>

</div>

<button
id="addRelatedPageButton"
class="admin__button admin__button--secondary"
type="button"
>
関連ページを追加
</button>

</section>

<div class="admin__actions">

<button
class="admin__button"
type="submit"
>
保存
</button>

</div>

</form>

<template id="noticeTemplate">

<div
class="admin__item"
data-notice-item
>

<div class="admin__item-actions">

<button
class="admin__button admin__button--secondary admin__button--small"
type="button"
data-notice-up
>
上へ
</button>

<button
class="admin__button admin__button--secondary admin__button--small"
type="button"
data-notice-down
>
下へ
</button>

<button
class="admin__button admin__button--danger admin__button--small"
type="button"
data-notice-delete
>
削除
</button>

</div>

<div class="admin__language-grid">

<div class="admin__language-panel">

<h3 class="admin__language-title">
日本語
</h3>

<label class="admin__field">

<span class="admin__label">
文章
</span>

<textarea
class="admin__textarea"
data-notice-field="ja][text"
></textarea>

</label>

<label class="admin__field">

<span class="admin__label">
リンク先URL
</span>

<input
class="admin__input"
type="url"
data-notice-field="ja][url"
placeholder="https://"
>

</label>

</div>

<div class="admin__language-panel">

<h3 class="admin__language-title">
English
</h3>

<label class="admin__field">

<span class="admin__label">
文章
</span>

<textarea
class="admin__textarea"
data-notice-field="en][text"
></textarea>

</label>

<label class="admin__field">

<span class="admin__label">
リンク先URL
</span>

<input
class="admin__input"
type="url"
data-notice-field="en][url"
placeholder="https://"
>

</label>

</div>

</div>

<div class="admin__checks">

<label>

<input
type="checkbox"
data-notice-field="visible"
checked
>

表示する

</label>

<label>

<input
type="checkbox"
data-notice-field="newTab"
>

新しいタブで開く

</label>

</div>

</div>

</template>

<template id="relatedPageTemplate">

<div
class="admin__item"
data-related-page-item
>

<div class="admin__item-actions">

<button
class="admin__button admin__button--secondary admin__button--small"
type="button"
data-related-page-up
>
上へ
</button>

<button
class="admin__button admin__button--secondary admin__button--small"
type="button"
data-related-page-down
>
下へ
</button>

<button
class="admin__button admin__button--danger admin__button--small"
type="button"
data-related-page-delete
>
削除
</button>

</div>

<input
type="hidden"
data-related-page-field="currentThumbnail"
value=""
>

<label class="admin__field">

<span class="admin__label">
サムネイル画像
</span>

<input
class="admin__input"
type="file"
accept="image/jpeg,image/png,image/webp"
data-related-page-file
>

</label>

<div class="admin__language-grid">

<div class="admin__language-panel">

<h3 class="admin__language-title">
日本語
</h3>

<label class="admin__field">

<span class="admin__label">
タイトル
</span>

<input
class="admin__input"
type="text"
data-related-page-field="ja][title"
>

</label>

<label class="admin__field">

<span class="admin__label">
紹介文
</span>

<input
class="admin__input"
type="text"
data-related-page-field="ja][description"
>

</label>

<label class="admin__field">

<span class="admin__label">
リンク先URL
</span>

<input
class="admin__input"
type="url"
data-related-page-field="ja][url"
placeholder="https://"
>

</label>

</div>

<div class="admin__language-panel">

<h3 class="admin__language-title">
English
</h3>

<label class="admin__field">

<span class="admin__label">
タイトル
</span>

<input
class="admin__input"
type="text"
data-related-page-field="en][title"
>

</label>

<label class="admin__field">

<span class="admin__label">
紹介文
</span>

<input
class="admin__input"
type="text"
data-related-page-field="en][description"
>

</label>

<label class="admin__field">

<span class="admin__label">
リンク先URL
</span>

<input
class="admin__input"
type="url"
data-related-page-field="en][url"
placeholder="https://"
>

</label>

</div>

</div>

<div class="admin__checks">

<label>

<input
type="checkbox"
data-related-page-field="visible"
checked
>

表示する

</label>

<label>

<input
type="checkbox"
data-related-page-field="newTab"
>

新しいタブで開く

</label>

</div>

</div>

</template>

<script>
const noticeList =
document.getElementById(
"noticeList"
);

const addNoticeButton =
document.getElementById(
"addNoticeButton"
);

const noticeTemplate =
document.getElementById(
"noticeTemplate"
);

function reindexNotices() {
const noticeItems =
noticeList.querySelectorAll(
"[data-notice-item]"
);

noticeItems.forEach(
(item, index) => {
const fields =
item.querySelectorAll(
"[data-notice-field]"
);

fields.forEach(
(field) => {
field.name =
`notices[${index}][${field.dataset.noticeField}]`;
}
);
}
);
}

function handleNoticeAction(event) {
const item =
event.target.closest(
"[data-notice-item]"
);

if (!item) {
return;
}

if (
event.target.closest(
"[data-notice-delete]"
)
) {
item.remove();
reindexNotices();
return;
}

if (
event.target.closest(
"[data-notice-up]"
)
) {
const previousItem =
item.previousElementSibling;

if (previousItem) {
noticeList.insertBefore(
item,
previousItem
);
}

reindexNotices();
return;
}

if (
event.target.closest(
"[data-notice-down]"
)
) {
const nextItem =
item.nextElementSibling;

if (nextItem) {
noticeList.insertBefore(
nextItem,
item
);
}

reindexNotices();
}
}

noticeList.addEventListener(
"click",
handleNoticeAction
);

addNoticeButton.addEventListener(
"click",
() => {
const fragment =
noticeTemplate.content.cloneNode(
true
);

noticeList.appendChild(
fragment
);

reindexNotices();
}
);

reindexNotices();

const relatedPageList =
document.getElementById(
"relatedPageList"
);

const addRelatedPageButton =
document.getElementById(
"addRelatedPageButton"
);

const relatedPageTemplate =
document.getElementById(
"relatedPageTemplate"
);

function reindexRelatedPages() {
const relatedPageItems =
relatedPageList.querySelectorAll(
"[data-related-page-item]"
);

relatedPageItems.forEach(
(item, index) => {
const fields =
item.querySelectorAll(
"[data-related-page-field]"
);

fields.forEach(
(field) => {
field.name =
`relatedPages[${index}][${field.dataset.relatedPageField}]`;
}
);

const fileInput =
item.querySelector(
"[data-related-page-file]"
);

if (fileInput) {
fileInput.name =
`relatedThumbnails[${index}]`;
}
}
);
}

function handleRelatedPageAction(event) {
const item =
event.target.closest(
"[data-related-page-item]"
);

if (!item) {
return;
}

if (
event.target.closest(
"[data-related-page-delete]"
)
) {
item.remove();

reindexRelatedPages();

return;
}

if (
event.target.closest(
"[data-related-page-up]"
)
) {
const previousItem =
item.previousElementSibling;

if (previousItem) {
relatedPageList.insertBefore(
item,
previousItem
);
}

reindexRelatedPages();

return;
}

if (
event.target.closest(
"[data-related-page-down]"
)
) {
const nextItem =
item.nextElementSibling;

if (nextItem) {
relatedPageList.insertBefore(
nextItem,
item
);
}

reindexRelatedPages();
}
}

relatedPageList.addEventListener(
"click",
handleRelatedPageAction
);

addRelatedPageButton.addEventListener(
"click",
() => {
const fragment =
relatedPageTemplate.content.cloneNode(
true
);

relatedPageList.appendChild(
fragment
);

reindexRelatedPages();
}
);

reindexRelatedPages();
</script>

<?php endif; ?>

</main>

</body>
</html>