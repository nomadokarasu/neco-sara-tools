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
'title' => 'ぐるりペイント',
'description' => 'カメラをぐるぐる回しながらお絵描きできるペイントツールです',
'startButton' => 'ぐるりペイントをはじめる',
'notice' => 'ぐるりペイント Web版V2を開発しています。',
'footer' => '© JUNOTA',
'links' => [
'gururiamu' => [
'title' => 'ぐるりあむ',
'description' => 'ぐるり作品を見る',
'url' => '',
'visible' => true,
'newTab' => false
],
'blog' => [
'title' => '開発ブログ',
'description' => '開発の記録を読む',
'url' => '',
'visible' => true,
'newTab' => false
],
'notification' => [
'title' => '製品版発売通知',
'description' => '製品版の情報を受け取る',
'url' => '',
'visible' => true,
'newTab' => false
],
'donation' => [
'title' => 'JUNOTAを応援する',
'description' => '寄付ページを見る',
'url' => '',
'visible' => true,
'newTab' => false
]
]
];

$linkLabels = [
'gururiamu' => 'ぐるりあむ',
'blog' => '開発ブログ',
'notification' => '製品版発売通知',
'donation' => '寄付ページ'
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

$content =
array_replace(
$defaultContent,
$data
);

$content['links'] =
array_replace_recursive(
$defaultContent['links'],
is_array($data['links'] ?? null)
? $data['links']
: []
);

return $content;
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

if (
$_SERVER['REQUEST_METHOD'] === 'POST'
) {
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
} elseif (
mb_strlen($password) < 12
) {
$error =
'パスワードは12文字以上にしてください。';
} elseif (
$password !== $passwordConfirm
) {
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
'認証設定を保存できませんでした。ファイルの書き込み権限を確認してください。';
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
'title' => trim(
(string) ($_POST['title'] ?? '')
),
'description' => trim(
(string) ($_POST['description'] ?? '')
),
'startButton' => trim(
(string) ($_POST['startButton'] ?? '')
),
'notice' => trim(
(string) ($_POST['notice'] ?? '')
),
'footer' => trim(
(string) ($_POST['footer'] ?? '')
),
'links' => []
];

foreach (
$linkLabels as $key => $label
) {
$url =
trim(
(string) ($_POST[$key . '_url'] ?? '')
);

if (!validPublicUrl($url)) {
$error =
$label .
'のURLが正しくありません。';

break;
}

$newContent['links'][$key] = [
'title' => trim(
(string) ($_POST[$key . '_title'] ?? '')
),
'description' => trim(
(string) ($_POST[$key . '_description'] ?? '')
),
'url' => $url,
'visible' =>
isset($_POST[$key . '_visible']),
'newTab' =>
isset($_POST[$key . '_new_tab'])
];
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
width: min(100%, 760px);
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

.admin__field {
display: block;
margin-top: 18px;
}

.admin__field:first-child {
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
min-height: 90px;
resize: vertical;
}

.admin__checks {
display: flex;
flex-wrap: wrap;
gap: 18px;
margin-top: 14px;
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

.admin__actions {
display: flex;
justify-content: flex-end;
margin-top: 28px;
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

@media (max-width: 600px) {
body {
padding: 22px 14px;
}

.admin__header {
align-items: flex-start;
}

.admin__panel {
padding: 18px;
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

<p>
管理画面で使用するユーザー名とパスワードを設定します。
</p>

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
基本情報
</h2>

<?php
$basicFields = [
'title' => 'タイトル',
'description' => '紹介文',
'startButton' => '開始ボタン',
'notice' => 'お知らせ',
'footer' => 'フッター'
];

foreach (
$basicFields as $key => $label
):
?>

<label class="admin__field">

<span class="admin__label">
<?= escapeHtml($label) ?>
</span>

<?php if (in_array($key, ['description', 'notice'], true)): ?>

<textarea
class="admin__textarea"
name="<?= escapeHtml($key) ?>"
><?= escapeHtml((string) $content[$key]) ?></textarea>

<?php else: ?>

<input
class="admin__input"
type="text"
name="<?= escapeHtml($key) ?>"
value="<?= escapeHtml((string) $content[$key]) ?>"
>

<?php endif; ?>

</label>

<?php endforeach; ?>

</section>

<?php foreach ($linkLabels as $key => $label): ?>

<section class="admin__section">

<h2 class="admin__section-title">
<?= escapeHtml($label) ?>
</h2>

<label class="admin__field">

<span class="admin__label">
表示名
</span>

<input
class="admin__input"
type="text"
name="<?= escapeHtml($key) ?>_title"
value="<?= escapeHtml((string) $content['links'][$key]['title']) ?>"
>

</label>

<label class="admin__field">

<span class="admin__label">
紹介文
</span>

<input
class="admin__input"
type="text"
name="<?= escapeHtml($key) ?>_description"
value="<?= escapeHtml((string) $content['links'][$key]['description']) ?>"
>

</label>

<label class="admin__field">

<span class="admin__label">
リンク先URL
</span>

<input
class="admin__input"
type="url"
name="<?= escapeHtml($key) ?>_url"
value="<?= escapeHtml((string) $content['links'][$key]['url']) ?>"
placeholder="https://"
>

</label>

<div class="admin__checks">

<label>

<input
type="checkbox"
name="<?= escapeHtml($key) ?>_visible"
<?= !empty($content['links'][$key]['visible']) ? 'checked' : '' ?>
>

表示する

</label>

<label>

<input
type="checkbox"
name="<?= escapeHtml($key) ?>_new_tab"
<?= !empty($content['links'][$key]['newTab']) ? 'checked' : '' ?>
>

新しいタブで開く

</label>

</div>

</section>

<?php endforeach; ?>

<div class="admin__actions">

<button
class="admin__button"
type="submit"
>
保存
</button>

</div>

</form>

<?php endif; ?>

</main>

</body>
</html>