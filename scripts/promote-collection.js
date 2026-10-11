const fs = require("node:fs");
const path = require("node:path");
const {execFileSync} = require("node:child_process");

const root = path.resolve(__dirname, "..");
const devDir = path.join(root, "src/tools/gururi-collection-dev");
const releaseDir = path.join(root, "src/tools/gururi-collection");

const files = [
"index.html",
"app.js",
"styles.css",
"sw.js",
"manifest.webmanifest",
"icon-192.png",
"icon-512.png"
];

const textFiles = new Set([
"index.html",
"app.js",
"styles.css",
"sw.js",
"manifest.webmanifest"
]);

const VERSION = "0.0.9";

try {
for (const name of files) {
if (!fs.existsSync(path.join(devDir, name))) {
throw new Error(`開発版のファイルがありません：${name}`);
}
}

const releaseExists = fs.existsSync(releaseDir);
const releaseIndexExists = fs.existsSync(
path.join(releaseDir, "index.html")
);

if (releaseExists && !releaseIndexExists) {
const entries = fs.readdirSync(releaseDir);

if (entries.length > 0) {
throw new Error(
"公開版フォルダにindex.html以外のファイルが存在します。内容を確認してください。"
);
}
}

const generated = new Map();

for (const name of files) {
if (!textFiles.has(name)) continue;

let content = fs.readFileSync(path.join(devDir, name), "utf8");

content = content.replaceAll(
"gururi-collection-dev",
"gururi-collection"
);

if (name === "index.html") {
const versionPattern = /Version\s+\d+\.\d+\.\d+\s*（開発版）/;

if (!versionPattern.test(content)) {
throw new Error(
"開発版のバージョン表記を確認できません。index.htmlを確認してください。"
);
}

content = content.replace(
versionPattern,
`Version ${VERSION}`
);
}

if (name === "sw.js") {
const cachePattern = /const CACHE_NAME\s*=\s*"[^"]+";/;

if (!cachePattern.test(content)) {
throw new Error("Service Workerのキャッシュ名を確認できません。");
}

content = content.replace(
cachePattern,
`const CACHE_NAME = "gururi-collection-release-shell-v1";`
);

content = content.replace(
/name\.startsWith\("gururi-collection-shell-"\)/g,
'name.startsWith("gururi-collection-release-shell-")'
);

if (!content.includes(
'name.startsWith("gururi-collection-release-shell-")'
)) {
throw new Error("Service Workerのキャッシュ削除範囲を確認できません。");
}
}

if (name === "manifest.webmanifest") {
const manifest = JSON.parse(content);

manifest.start_url = "./index.html";
manifest.scope = "./";
manifest.display = "standalone";

content = JSON.stringify(manifest, null, 2) + "\n";
}

generated.set(name, content);
}

if (generated.get("index.html").includes("gururi-collection-dev")) {
throw new Error("公開版HTMLに開発版のパスが残っています。");
}

if (generated.get("index.html").includes("noindex")) {
throw new Error("公開版HTMLにnoindexが残っています。");
}

for (const name of ["app.js", "sw.js"]) {
execFileSync(process.execPath, ["--check"], {
input: generated.get(name),
stdio: ["pipe", "ignore", "pipe"]
});
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");

const backupDir = path.join(
path.dirname(root),
`gururi-collection-before-${stamp}`
);

if (releaseIndexExists) {
fs.cpSync(releaseDir, backupDir, {
recursive: true,
errorOnExist: true,
force: false
});

console.log(`公開版バックアップ：${backupDir}`);
} else {
console.log("初回公開のため、バックアップ対象の公開版ソースはありません。");
fs.mkdirSync(releaseDir, {recursive: true});
}

for (const name of files) {
const destination = path.join(releaseDir, name);

if (textFiles.has(name)) {
fs.writeFileSync(destination, generated.get(name), "utf8");
} else {
fs.copyFileSync(path.join(devDir, name), destination);
}
}

console.log(`ぐるりコレクション公開版 Version ${VERSION} を作成しました。`);
console.log("まだサーバーには配信していません。");

} catch (error) {
console.error("公開版への昇格を停止しました。");
console.error(error.message);
process.exit(1);
}