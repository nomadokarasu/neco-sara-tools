
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dev = path.join(root, "src/tools/gururi-watch-dev");
const release = path.join(root, "src/tools/gururi-watch");
const version = process.argv[2];

if (!/^\d+\.\d+\.\d+$/.test(version || "")) {
throw new Error("公開版のバージョンを指定してください。例：0.3.0");
}

const files = [
"index.html",
"script.js",
"style.css",
"share.php",
"admin.php",
"api/worlds.php",
"api/create-world.php",
"api/admin-worlds.php",
"api/admin-update-world.php",
"api/report-world.php",
"api/worlds-storage.php",
"api/store-game-dev.php",
"api/delete-game-dev.php",
"api/publish-game-dev.php"
];

for (const name of files) {
if (!fs.existsSync(path.join(dev, name))) {
throw new Error("開発版にファイルがありません：" + name);
}
}

const releaseIndexPath = path.join(release, "index.html");
const oldIndex = fs.readFileSync(releaseIndexPath, "utf8");
const oldVersion = oldIndex.match(/class="site-version">ver\.(\d+\.\d+\.\d+)<\/span>/)?.[1];
const devIndex = fs.readFileSync(path.join(dev, "index.html"), "utf8");

if (!oldVersion) {
throw new Error("現在の公開版バージョンが確認できません。");
}

const toParts = value => value.split(".").map(Number);
const nextParts = toParts(version);
const oldParts = toParts(oldVersion);

for (let i = 0; i < 3; i++) {
if (nextParts[i] > oldParts[i]) break;
if (nextParts[i] < oldParts[i]) {
throw new Error("公開版のバージョンを増やしてください。");
}
if (i === 2) {
throw new Error("公開版のバージョンを増やしてください。");
}
}

if (!devIndex.includes('ver.0.2.24-dev')) {
throw new Error("想定した開発版ではありません。");
}

const headStart = oldIndex.indexOf("<head>") + 6;
const headEnd = oldIndex.indexOf('<meta charset="UTF-8">');
const prodHead = oldIndex.slice(headStart, headEnd);

if (
headStart < 6 ||
headEnd <= headStart ||
!prodHead.includes("G-E5CTR47H44")
) {
throw new Error("公開版のアクセス解析設定が確認できません。");
}

const backup = path.join(
root,
"backups",
"gururi-watch-before-" + version + "-" + Date.now()
);

const results = new Map();

for (const name of files) {
let content = fs.readFileSync(path.join(dev, name), "utf8");

if (name === "index.html") {
content = content.replace(
"window.gtag = function(){};",
""
);
content = content.replace(
"<head>",
"<head>" + prodHead
);
content = content.replace(
'<meta name="robots" content="noindex, nofollow">',
""
);
content = content.replace(
"<title>ぐるりうむ｜開発版</title>",
"<title>ぐるりうむ</title>"
);
content = content.replace(
'ver.0.2.24-dev',
"ver." + version
);
content = content.replace(
/(\.\/script\.js\?v=)[^"]+/,
"$1" + version
);
}

if (name === "script.js") {
content = content.replaceAll(
"https://gururi-game.neco-sara.com/?id=",
"https://gururi-game.neco-sara.com/?site=release&id="
);
}

if (name === "share.php") {
content = content.replaceAll("gururi-watch-dev", "gururi-watch");
}

if (
name === "admin.php" ||
name === "api/admin-worlds.php" ||
name === "api/admin-update-world.php"
) {
content = content.replaceAll(
"gururi_watch_dev_admin",
"gururi_watch_admin"
);
content = content.replaceAll(
"/tools/gururi-watch-dev/",
"/tools/gururi-watch/"
);
}

if (
content.includes("gururi_watch_dev_admin") ||
(name === "index.html" && (
content.includes('content="noindex, nofollow"') ||
content.includes("window.gtag = function(){}") ||
!content.includes("G-E5CTR47H44")
))
) {
throw new Error("公開版への変換に失敗しました：" + name);
}

results.set(name, content);
}

if (process.argv.includes("--dry-run")) {
const index = results.get("index.html");
const script = results.get("script.js");
const admin = results.get("admin.php");

const gameUrl = "https://gururi-game.neco-sara.com/?site=release&id=";
const gameUrlCount = script.split(gameUrl).length - 1;

const checks = {
"公開版バージョン": index.includes('class="site-version">ver.' + version + '</span>'),
"GA4設定": index.includes("G-E5CTR47H44"),
"検索エンジン除外設定なし": !index.includes('content="noindex, nofollow"'),
"直接表示処理": index.includes("direct-world-loading"),
"投稿アニメーション": index.includes("gururi-upload-pulse"),
"公開版ゲームURLが2か所": gameUrlCount === 2,
"開発版ゲームURLなし": !script.includes("https://gururi-game.neco-sara.com/?id="),
"公開版管理セッション": admin.includes('session_name("gururi_watch_admin")'),
"公開版Cookieパス": admin.includes('"/tools/gururi-watch/"')
};

for (const [name, passed] of Object.entries(checks)) {
console.log(name + ": " + (passed ? "OK" : "NG"));
}

if (Object.values(checks).some(passed => !passed)) {
throw new Error("変換テストで問題が見つかりました。");
}

console.log("変換テスト成功。ファイルは変更していません。");
process.exit(0);
}

fs.mkdirSync(backup, {recursive: true});

for (const name of files) {
const target = path.join(release, name);
if (!fs.existsSync(target)) continue;
const backupTarget = path.join(backup, name);
fs.mkdirSync(path.dirname(backupTarget), {recursive: true});
fs.copyFileSync(target, backupTarget);
}

for (const [name, content] of results) {
const target = path.join(release, name);
fs.mkdirSync(path.dirname(target), {recursive: true});
fs.writeFileSync(target, content, "utf8");
}

console.log("公開版への変換が完了しました。");
console.log("公開版バージョン：" + version);
console.log("変換したファイル：" + files.length);
console.log("バックアップ：" + backup);
console.log("管理パスワード・作品データは変更していません。");
console.log("サーバーへのデプロイはまだ行っていません。");