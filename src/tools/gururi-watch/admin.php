<?php

session_start();

require_once __DIR__ . "/api/admin-config.php";

$error = "";

if (
isset($_GET["logout"])
) {

$_SESSION = [];

session_destroy();

header(
"Location: ./admin.php"
);

exit;

}

if (
$_SERVER["REQUEST_METHOD"] === "POST"
) {

$password =
(string)($_POST["password"] ?? "");

if (
hash_equals(
GURURI_ADMIN_PASSWORD,
$password
)
) {

$_SESSION["gururi_admin_logged_in"] =
true;

header(
"Location: ./admin.php"
);

exit;

}

$error =
"パスワードが違います。";

}

$loggedIn =
!empty(
$_SESSION["gururi_admin_logged_in"]
);

?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ぐるりウォッチ 管理</title>

<style>

* {
box-sizing: border-box;
}

body {
margin: 0;
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
background: #f5f5f5;
color: #111;
}

main {
width: min(100% - 32px, 1000px);
margin: 0 auto;
padding: 40px 0 80px;
}

h1 {
margin: 0 0 30px;
font-size: 26px;
}

.login-form {
width: min(100%, 400px);
padding: 24px;
background: #fff;
border: 1px solid #ddd;
}

.login-form input {
width: 100%;
padding: 12px;
margin-bottom: 12px;
font-size: 16px;
}

button {
font: inherit;
cursor: pointer;
}

.login-button {
width: 100%;
padding: 12px;
border: 0;
background: #111;
color: #fff;
}

.error {
color: #b00020;
font-size: 13px;
}

.admin-header {
display: flex;
justify-content: space-between;
align-items: center;
gap: 20px;
margin-bottom: 30px;
}

.logout-link {
color: #111;
font-size: 13px;
}

.filters {
display: flex;
gap: 8px;
margin-bottom: 20px;
overflow-x: auto;
}

.filter-button {
padding: 8px 14px;
border: 1px solid #bbb;
border-radius: 18px;
background: #fff;
white-space: nowrap;
}

.filter-button.active {
background: #111;
color: #fff;
border-color: #111;
}

.world-list {
display: flex;
flex-direction: column;
gap: 12px;
}

.world-item {
display: grid;
grid-template-columns: 120px 1fr;
gap: 18px;
padding: 16px;
background: #fff;
border: 1px solid #ddd;
}

.world-thumbnail {
width: 120px;
aspect-ratio: 1 / 1;
object-fit: cover;
background: #eee;
}

.world-title {
margin: 0 0 4px;
font-size: 17px;
}

.world-author {
margin: 0 0 10px;
font-size: 13px;
color: #666;
}

.world-meta {
display: flex;
flex-wrap: wrap;
gap: 10px;
margin-bottom: 14px;
font-size: 12px;
color: #666;
}

.status {
font-weight: 600;
}

.actions {
display: flex;
flex-wrap: wrap;
gap: 8px;
}

.action-button {
padding: 8px 12px;
border: 1px solid #bbb;
background: #fff;
}

.action-button.primary {
background: #111;
border-color: #111;
color: #fff;
}

.action-button.delete {
border-color: #b00020;
color: #b00020;
}

.empty {
padding: 40px;
background: #fff;
text-align: center;
color: #777;
}

@media (max-width: 600px) {

main {
width: min(100% - 20px, 1000px);
padding-top: 24px;
}

.world-item {
grid-template-columns: 80px 1fr;
gap: 12px;
padding: 12px;
}

.world-thumbnail {
width: 80px;
}

.actions {
grid-column: 1 / -1;
}

}

</style>
</head>

<body>

<main>

<?php if (!$loggedIn): ?>

<h1>ぐるりウォッチ 管理</h1>

<form class="login-form" method="post">

<input
type="password"
name="password"
placeholder="パスワード"
autocomplete="current-password"
required
>

<?php if ($error !== ""): ?>

<p class="error">
<?php echo htmlspecialchars($error, ENT_QUOTES, "UTF-8"); ?>
</p>

<?php endif; ?>

<button class="login-button" type="submit">
ログイン
</button>

</form>

<?php else: ?>

<div class="admin-header">

<h1>ぐるりウォッチ 管理</h1>

<a class="logout-link" href="./admin.php?logout=1">
ログアウト
</a>

</div>

<div class="filters">

<button class="filter-button active" type="button" data-filter="all">
すべて
</button>

<button class="filter-button" type="button" data-filter="hidden">
要確認
</button>

<button class="filter-button" type="button" data-filter="published">
公開中
</button>

</div>

<div id="worldList" class="world-list"></div>

<?php endif; ?>

</main>

<?php if ($loggedIn): ?>

<script>

const worldList =
document.getElementById(
"worldList"
);

const filterButtons =
document.querySelectorAll(
".filter-button"
);

let worlds = [];

let currentFilter =
"all";

function escapeHtml(
value
) {

return String(value)
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");

}

function formatDate(
value
) {

if (!value) {
return "-";
}

const date =
new Date(
value
);

return new Intl.DateTimeFormat(
"ja-JP",
{
year: "numeric",
month: "2-digit",
day: "2-digit",
hour: "2-digit",
minute: "2-digit"
}
).format(
date
);

}

function statusText(
status
) {

if (
status === "published"
) {
return "公開中";
}

if (
status === "hidden"
) {
return "要確認";
}

return status;

}

function renderWorlds() {

const filtered =
worlds.filter(
(world) => {

if (
currentFilter === "all"
) {
return true;
}

return (
world.status ===
currentFilter
);

}
);

worldList.innerHTML =
"";

if (
filtered.length === 0
) {

worldList.innerHTML =
'<div class="empty">該当する作品はありません。</div>';

return;

}

filtered.forEach(
(world) => {

const item =
document.createElement(
"article"
);

item.className =
"world-item";

let actions = "";

if (
world.status === "hidden"
) {

actions +=
`<button class="action-button primary" type="button" data-action="publish" data-id="${escapeHtml(world.id)}">再公開</button>`;

}

if (
world.status === "published"
) {

actions +=
`<button class="action-button" type="button" data-action="hide" data-id="${escapeHtml(world.id)}">非表示</button>`;

}

actions +=
`<button class="action-button delete" type="button" data-action="delete" data-id="${escapeHtml(world.id)}">削除</button>`;

item.innerHTML =
`<img class="world-thumbnail" src="${escapeHtml(world.thumbnail)}" alt="">
<div>
<h2 class="world-title">${escapeHtml(world.title)}</h2>
<p class="world-author">${escapeHtml(world.author)}</p>
<div class="world-meta">
<span class="status">${escapeHtml(statusText(world.status))}</span>
<span>通報 ${world.reportCount}件</span>
<span>投稿 ${escapeHtml(formatDate(world.createdAt))}</span>
${world.reportedAt ? `<span>通報 ${escapeHtml(formatDate(world.reportedAt))}</span>` : ""}
</div>
<div class="actions">
${actions}
</div>
</div>`;

worldList.appendChild(
item
);

}
);

}

async function loadWorlds() {

const response =
await fetch(
"./api/admin-worlds.php",
{
cache: "no-store"
}
);

if (
response.status === 401
) {

window.location.reload();

return;

}

worlds =
await response.json();

renderWorlds();

}

async function updateWorld(
worldId,
action
) {

if (
action === "delete"
) {

const confirmed =
window.confirm(
"この作品を完全に削除します。\n画像ファイルも削除されます。\n元に戻せません。"
);

if (!confirmed) {
return;
}

}

const response =
await fetch(
"./api/admin-update-world.php",
{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
worldId,
action
})
}
);

const result =
await response.json();

if (
!response.ok ||
!result.success
) {

window.alert(
result.error ||
"更新できませんでした。"
);

return;

}

await loadWorlds();

}

filterButtons.forEach(
(button) => {

button.addEventListener(
"click",
() => {

filterButtons.forEach(
(item) => {

item.classList.remove(
"active"
);

}
);

button.classList.add(
"active"
);

currentFilter =
button.dataset.filter;

renderWorlds();

}
);

}
);

worldList.addEventListener(
"click",
(event) => {

const button =
event.target.closest(
"[data-action]"
);

if (!button) {
return;
}

updateWorld(
button.dataset.id,
button.dataset.action
);

}
);

loadWorlds();

</script>

<?php endif; ?>

</body>
</html>