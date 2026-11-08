const {
execSync,
execFileSync
} = require("node:child_process");

const fs = require("node:fs");
const path = require("node:path");

if (process.argv.includes("--gururi-admin")) {
  try {
    process.chdir(path.resolve(__dirname, ".."));

    const adminPath = "src/tools/gururi-paint/admin.php";
    const workflowPath = ".github/workflows/deploy.yml";

    if (!fs.existsSync(adminPath)) {
      throw new Error("公開版admin.phpが見つかりません。");
    }

    const workflow = fs.readFileSync(workflowPath, "utf8");

    if (!workflow.includes("Upload Gururi Paint admin by FTPS")) {
      throw new Error("管理画面専用の配信設定が見つかりません。");
    }

    const admin = fs.readFileSync(adminPath, "utf8");

    if (
      !admin.includes("gururi-editor/home-content.json") ||
      admin.includes("gururi-editor-dev") ||
      admin.includes("gururi_paint_testing_admin")
    ) {
      throw new Error("公開版管理画面の設定を確認できません。");
    }

    execFileSync("php", ["-l", adminPath], {
      stdio: "inherit"
    });

    const staged = execFileSync(
      "git",
      ["diff", "--cached", "--name-only"],
      { encoding: "utf8" }
    ).trim();

    if (staged) {
      throw new Error("Gitに追加済みの変更があります。配信を中止しました。");
    }

    console.log("管理画面専用配信の事前検証：OK");

    // 管理画面と配信設定だけをGitに追加
    execFileSync("git", [
      "add", "--",
      adminPath,
      workflowPath
    ], { stdio: "inherit" });

    const changes = execFileSync(
      "git",
      ["diff", "--cached", "--name-only"],
      { encoding: "utf8" }
    ).trim();

    if (!changes) {
      throw new Error("送信する変更がありません。");
    }

    const allowedFiles = [adminPath, workflowPath];

    for (const file of changes.split(/\r?\n/)) {
      if (!allowedFiles.includes(file)) {
        throw new Error("許可されていないファイルが含まれています：" + file);
      }
    }

    console.log("Gitへの追加対象：");
    console.log(changes);

    // 許可された2ファイルだけをコミット
    execFileSync("git", [
      "commit",
      "-m",
      "Deploy Gururi admin only"
    ], { stdio: "inherit" });

    // 管理画面専用ブランチへ送信
    execFileSync("git", [
      "push",
      "origin",
      "HEAD:gururi-paint-admin-deploy"
    ], { stdio: "inherit" });

    console.log("管理画面専用ブランチへの送信が完了しました。");
    console.log("GitHub Actionsで配信結果を確認してください。");

    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (process.argv.includes("--editor-release")) {
try {
  process.chdir(path.resolve(__dirname, ".."));

  const sourceDirectory = "src/tools/gururi-editor";
  const requiredFiles = [
    "index.html",
    "app.js",
    "style.css"
  ];

  for (const fileName of requiredFiles) {
    if (!fs.existsSync(path.join(sourceDirectory, fileName))) {
      throw new Error("公開版のファイルがありません：" + fileName);
    }
  }

  const workflow = fs.readFileSync(".github/workflows/deploy.yml", "utf8");

  if (!workflow.includes("Prepare Gururi Editor release files")) {
    throw new Error("公開版の配信設定が見つかりません。");
  }

  const staged = execFileSync("git", ["diff", "--cached", "--name-only"], {
    encoding: "utf8"
  }).trim();

  if (staged) {
    throw new Error("Gitに追加済みの変更があります。配信を停止しました。");
  }

  execFileSync(process.execPath, ["scripts/build.js"], {
    stdio: "inherit"
  });

  execFileSync("git", [
    "add", "--",
    "package.json",
    ".gitignore",
    "scripts/build.js",
    "scripts/deploy.js",
    ".github/workflows/deploy.yml",
    sourceDirectory
  ], {stdio: "inherit"});

  const changes = execFileSync("git", ["diff", "--cached", "--name-only"], {
    encoding: "utf8"
  }).trim();

  if (changes) {
    execFileSync("git", [
      "commit", "-m", "Release Gururi Editor"
    ], {stdio: "inherit"});
  }

  execFileSync("git", [
    "push", "origin", "HEAD:gururi-editor-release-deploy"
  ], {stdio: "inherit"});

  console.log("ぐるりエディタ公開版を配信用ブランチへ送信しました。");
  console.log("GitHub Actionsで配信結果を確認してください。");
  process.exit(0);

} catch (error) {
  console.error("ぐるりエディタ公開版の配信を停止しました。");
  console.error(error.message);
  process.exit(1);
}
}



if (process.argv.includes("--watch-release")) {
try {
process.chdir(path.resolve(__dirname, ".."));

const sourceDirectory = "src/tools/gururi-watch";
const workflowPath = ".github/workflows/deploy.yml";

const requiredFiles = [
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

for (const name of requiredFiles) {
if (!fs.existsSync(path.join(sourceDirectory, name))) {
throw new Error("公開版のファイルがありません：" + name);
}
}

const workflow = fs.readFileSync(workflowPath, "utf8");

if (
!workflow.includes("gururi-watch-release-deploy") ||
!workflow.includes("Upload Gururium release by FTPS")
) {
throw new Error("ぐるりうむ公開版の配信設定が未完成です。");
}

const staged = execFileSync("git", [
"diff", "--cached", "--name-only"
], {encoding: "utf8"}).trim();

if (staged) {
throw new Error("Gitに追加済みの変更があります。配信を停止しました。");
}

const index = fs.readFileSync(
path.join(sourceDirectory, "index.html"),
"utf8"
);

const versionMatch = index.match(
/class="site-version">ver\.(\d+\.\d+\.\d+)<\/span>/
);

if (!versionMatch) {
throw new Error("公開版のバージョンを確認できません。");
}

const version = versionMatch[1];

if (
index.includes("noindex") ||
index.includes("開発版") ||
index.includes("window.gtag = function(){}") ||
!index.includes("G-E5CTR47H44") ||
!index.includes('class="site-version">ver.' + version + '</span>')
) {
throw new Error("公開版の設定またはバージョンを確認できません。");
}

const adminFiles = [
"admin.php",
"api/admin-worlds.php",
"api/admin-update-world.php"
];

for (const name of adminFiles) {
const content = fs.readFileSync(
path.join(sourceDirectory, name),
"utf8"
);

if (
content.includes("gururi_watch_dev_admin") ||
content.includes("/tools/gururi-watch-dev/")
) {
throw new Error("開発版の管理設定が残っています：" + name);
}
}

execFileSync(process.execPath, [
"scripts/build.js"
], {stdio: "inherit"});

execFileSync(process.execPath, [
"--check",
path.join(sourceDirectory, "script.js")
], {stdio: "inherit"});

const filesToStage = [
"package.json",
"scripts/build.js",
"scripts/deploy.js",
"scripts/promote-watch.js",
workflowPath,
...requiredFiles.map(name => path.join(sourceDirectory, name))
];

execFileSync("git", [
"add", "--", ...filesToStage
], {stdio: "inherit"});

const changes = execFileSync("git", [
"diff", "--cached", "--name-only"
], {encoding: "utf8"}).trim();

if (changes) {
console.log("公開版デプロイの変更対象：");
console.log(changes);

execFileSync("git", [
"commit", "-m", "Release Gururium " + version
], {stdio: "inherit"});
}

execFileSync("git", [
"push", "origin", "HEAD:gururi-watch-release-deploy"
], {stdio: "inherit"});

console.log("ぐるりうむ公開版を配信用ブランチへ送信しました。");
console.log("GitHub Actionsで配信結果を確認してください。");

process.exit(0);

} catch (error) {
console.error("ぐるりうむ公開版の配信を停止しました。");
console.error(error.message);
process.exit(1);
}
}

if (process.argv.includes("--watch-dev")) {
try {
process.chdir(path.resolve(__dirname, ".."));

const sourceDirectory = "src/tools/gururi-watch-dev";
const workflowPath = ".github/workflows/deploy.yml";

for (const name of ["index.html", "script.js", "style.css"]) {
if (!fs.existsSync(path.join(sourceDirectory, name))) {
throw new Error("必要なファイルがありません：" + name);
}
}

const workflow = fs.readFileSync(workflowPath, "utf8");

if (
!workflow.includes("gururi-watch-dev-deploy") ||
!workflow.includes("Upload Gururium development by FTPS")
) {
throw new Error("ぐるりうむ開発版の配信設定が見つかりません。");
}

const staged = execFileSync("git", [
"diff", "--cached", "--name-only"
], {encoding: "utf8"}).trim();

if (staged) {
throw new Error("Gitに追加済みの変更があります。配信を停止しました。");
}

execFileSync(process.execPath, [
"scripts/build.js"
], {stdio: "inherit"});

execFileSync(process.execPath, [
"--check",
path.join(sourceDirectory, "script.js")
], {stdio: "inherit"});

const allowedExtensions = new Set([
".html", ".js", ".css", ".php",
".png", ".jpg", ".jpeg", ".webp",
".svg", ".gif", ".ico", ".json"
]);

const sourceFiles = [];

function collectWatchFiles(directory) {
for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
if (
entry.name.startsWith(".") ||
["data", "uploads", "node_modules"].includes(entry.name)
) {
continue;
}

const fullPath = path.join(directory, entry.name);

if (entry.isDirectory()) {
collectWatchFiles(fullPath);
continue;
}

if (!entry.isFile()) {
continue;
}

if (
entry.name === "admin-config.php" ||
entry.name.toLowerCase().includes("secret") ||
entry.name.toLowerCase().includes("credential")
) {
continue;
}

if (allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
sourceFiles.push(fullPath);
}
}
}

collectWatchFiles(sourceDirectory);

if (sourceFiles.length === 0) {
throw new Error("配信対象のファイルがありません。");
}

const gitFiles = [
"package.json",
".gitignore",
"scripts/build.js",
"scripts/deploy.js",
workflowPath,
...sourceFiles
];

execFileSync("git", [
"add", "--", ...gitFiles
], {stdio: "inherit"});

const changes = execFileSync("git", [
"diff", "--cached", "--name-only"
], {encoding: "utf8"}).trim();

if (changes) {
console.log("Gitへの追加対象：");
console.log(changes);

execFileSync("git", [
"commit", "-m", "Update Gururium development"
], {stdio: "inherit"});
}

execFileSync("git", [
"push", "origin", "HEAD:gururi-watch-dev-deploy"
], {stdio: "inherit"});

console.log("ぐるりうむ開発版を配信用ブランチへ送信しました。");
console.log("GitHub Actionsで配信結果を確認してください。");

process.exit(0);
} catch (error) {
console.error("ぐるりうむ開発版の配信を停止しました。");
console.error(error.message);
process.exit(1);
}
}

if (process.argv.includes("--editor-dev")) {
try {
process.chdir(path.resolve(__dirname, ".."));

const sourceDirectory = "src/tools/gururi-editor-dev";
  const requiredFiles = [
    "index.html",
    "app.js",
    "style.css"
  ];

  for (const fileName of requiredFiles) {
    if (!fs.existsSync(path.join(sourceDirectory, fileName))) {
      throw new Error("必要なファイルがありません：" + fileName);
    }
  }

  const workflow = fs.readFileSync(".github/workflows/deploy.yml", "utf8");

  if (!workflow.includes("Prepare Gururi Editor development files")) {
    throw new Error("開発版の配信設定が見つかりません。");
  }

  const staged = execFileSync("git", ["diff", "--cached", "--name-only"], {
    encoding: "utf8"
  }).trim();

  if (staged) {
    throw new Error("Gitに追加済みの変更があります。配信を停止しました。");
  }

  execFileSync(process.execPath, ["scripts/build.js"], {
    stdio: "inherit"
  });

  execFileSync("git", [
    "add", "--",
    "package.json",
    ".gitignore",
    "scripts/build.js",
    "scripts/deploy.js",
    ".github/workflows/deploy.yml",
    sourceDirectory
  ], {stdio: "inherit"});

  const changes = execFileSync("git", ["diff", "--cached", "--name-only"], {
    encoding: "utf8"
  }).trim();

  if (changes) {
    execFileSync("git", [
      "commit", "-m", "Update Gururi Editor development"
    ], {stdio: "inherit"});
  }

  execFileSync("git", [
    "push", "origin", "HEAD:gururi-editor-dev-deploy"
  ], {stdio: "inherit"});

  console.log("ぐるりエディタ開発版を配信用ブランチへ送信しました。");
  console.log("GitHub Actionsで配信結果を確認してください。");
  process.exit(0);

} catch (error) {
  console.error("ぐるりエディタ開発版の配信を停止しました。");
  console.error(error.message);
  process.exit(1);
}
}

if (process.argv.includes("--collection-release")) {
try {
process.chdir(path.resolve(__dirname, ".."));

const workflow = fs.readFileSync(
".github/workflows/deploy.yml",
"utf8"
);

if (!workflow.includes("# COLLECTION_RELEASE_DEPLOY_READY")) {
throw new Error("ぐるりコレクション公開版の配信設定が未完成です。");
}

const sourceDirectory = "src/tools/gururi-collection";

const requiredFiles = [
"index.html",
"app.js",
"styles.css",
"sw.js",
"manifest.webmanifest",
"icon-192.png",
"icon-512.png"
];

for (const name of requiredFiles) {
if (!fs.existsSync(path.join(sourceDirectory, name))) {
throw new Error(`公開版のファイルが見つかりません：${name}`);
}
}

const index = fs.readFileSync(
path.join(sourceDirectory, "index.html"),
"utf8"
);

const worker = fs.readFileSync(
path.join(sourceDirectory, "sw.js"),
"utf8"
);

if (
!index.includes("Version 0.0.9") ||
index.includes("noindex") ||
index.includes("gururi-collection-dev") ||
worker.includes("gururi-collection-dev") ||
!worker.includes("gururi-collection-release-shell-")
) {
throw new Error("公開版の設定を確認できません。配信を停止しました。");
}

function gitRead(args) {
return execFileSync("git", args, {encoding: "utf8"}).trim();
}

function gitRun(args) {
execFileSync("git", args, {stdio: "inherit"});
}

if (gitRead(["diff", "--cached", "--name-only"])) {
throw new Error("Gitに追加済みの変更があります。配信を停止しました。");
}

execFileSync(process.execPath, ["scripts/build.js"], {
stdio: "inherit"
});

gitRun([
"add",
"--",
"package.json",
"scripts/promote-collection.js",
"scripts/deploy.js",
".github/workflows/deploy.yml",
sourceDirectory
]);

if (gitRead(["diff", "--cached", "--name-only"])) {
gitRun([
"commit",
"-m",
"Release Gururi Collection 0.0.9"
]);
}

gitRun([
"push",
"origin",
"HEAD:gururi-collection-release-deploy"
]);

console.log("ぐるりコレクション Version 0.0.9 の公開版を送信しました。");
console.log("GitHub Actionsで配信結果を確認してください。");
process.exit(0);

} catch (error) {
console.error("ぐるりコレクション公開版の配信を停止しました。");
console.error(error.message);
process.exit(1);
}
}

if (process.argv.includes("--collection-dev")) {
try {
process.chdir(path.resolve(__dirname, ".."));

const workflow = fs.readFileSync(".github/workflows/deploy.yml", "utf8");

if (!workflow.includes("# COLLECTION_DEV_DEPLOY_READY")) {
throw new Error("ぐるりコレクション開発版の配信設定が未完成です。");
}

const sourceDirectory = "src/tools/gururi-collection-dev";
const requiredFiles = [
"index.html",
"app.js",
"styles.css",
"sw.js",
"manifest.webmanifest",
"icon-192.png",
"icon-512.png"
];

for (const fileName of requiredFiles) {
if (!fs.existsSync(path.join(sourceDirectory, fileName))) {
throw new Error(`必要なファイルが見つかりません：${fileName}`);
}
}

function gitReadCollection(args) {
return execFileSync("git", args, {encoding: "utf8"}).trim();
}

function gitRunCollection(args) {
execFileSync("git", args, {stdio: "inherit"});
}

const stagedFiles = gitReadCollection(["diff", "--cached", "--name-only"]);

if (stagedFiles) {
throw new Error("すでにGitへ追加済みの変更があります。配信を停止しました。");
}

execFileSync(process.execPath, ["scripts/build.js"], {stdio: "inherit"});

gitRunCollection([
"add",
"--",
"package.json",
"scripts/build.js",
"scripts/deploy.js",
".github/workflows/deploy.yml",
sourceDirectory
]);

const changes = gitReadCollection(["diff", "--cached", "--name-only"]);

if (changes) {
gitRunCollection([
"commit",
"-m",
"Update Gururi Collection development"
]);
}

gitRunCollection([
"push",
"origin",
"HEAD:gururi-collection-dev-deploy"
]);

console.log("ぐるりコレクション開発版を配信用ブランチへ送信しました。");
console.log("サーバーへの反映結果はGitHub Actionsで確認してください。");

process.exit(0);

} catch (error) {
console.error("ぐるりコレクション開発版の更新を停止しました。");
console.error(error.message);
process.exit(1);
}
}

if (
process.argv.includes("--gururi-release")
) {

try {

process.chdir(
path.resolve(__dirname, "..")
);

const workflow = fs.readFileSync(
".github/workflows/deploy.yml",
"utf8"
);

if (
!workflow.includes(
"# GURURI_RELEASE_DEPLOY_READY"
)
) {

throw new Error(
"公開版専用の配信設定が未完成です。まだ実行できません。"
);
}


function gitReadRelease(
args
) {

return execFileSync(
"git",
args,
{
encoding: "utf8"
}
).trim();
}


function gitRunRelease(
args
) {

execFileSync(
"git",
args,
{
stdio: "inherit"
}
);
}


const stagedFiles =
gitReadRelease([
"diff",
"--cached",
"--name-only"
]);


if (stagedFiles) {

throw new Error(
"すでにGitへ追加済みの変更があります。配信せず、状況を確認してください。"
);
}


execFileSync(
process.execPath,
[
"scripts/build.js"
],
{
stdio: "inherit"
}
);


const releaseIndex =
fs.readFileSync(
"src/tools/gururi-paint/index.html",
"utf8"
);

const releaseScript =
fs.readFileSync(
"src/tools/gururi-paint/script.js",
"utf8"
);

const releaseServiceWorker =
fs.readFileSync(
"src/tools/gururi-paint/service-worker.js",
"utf8"
);

const releaseAdmin =
fs.readFileSync(
"src/tools/gururi-paint/admin.php",
"utf8"
);


const releaseVersionMatch =
releaseScript.match(
/const APP_VERSION\s*=\s*"([^"]+)";/
);


if (
!releaseVersionMatch
) {

throw new Error(
"公開版のバージョンを確認できません。"
);
}


const releaseVersion =
releaseVersionMatch[1];


if (
releaseVersion.includes(
"-dev"
) ||
releaseIndex.includes(
"noindex"
) ||
releaseIndex.includes(
"ぐるりペイント｜開発版"
) ||
releaseScript.includes(
"gururi-paint-testing-"
) ||
releaseServiceWorker.includes(
"gururi-paint-testing-"
) ||
releaseAdmin.includes(
"gururi_paint_testing_admin"
) ||
releaseAdmin.includes(
"/tools/gururi-paint-dev/"
) ||
!releaseAdmin.includes(
"'path' => '/'"
)
) {

throw new Error(
"公開版に開発版専用の設定が残っています。配信を停止しました。"
);
}


if (
!releaseIndex.includes(
'content="index, follow"'
) ||
!releaseIndex.includes(
'https://tools.neco-sara.com/tools/gururi-paint/'
)
) {

throw new Error(
"公開版のSEO設定を確認できません。配信を停止しました。"
);
}


gitRunRelease([
"add",
"--",
"package.json",
".gitignore",
"scripts",
".github/workflows",
"src/tools/gururi-paint"
]);


const changes =
gitReadRelease([
"diff",
"--cached",
"--name-only"
]);


if (changes) {

gitRunRelease([
"commit",
"-m",
`Release Gururi Paint ${releaseVersion}`
]);
}


gitRunRelease([
"push",
"origin",
"HEAD:gururi-paint-release-deploy"
]);


console.log(
`ぐるりペイント公開版 ${releaseVersion} を配信用ブランチへ送信しました。`
);

console.log(
"サーバーへの反映結果はGitHub Actionsで確認してください。"
);

process.exit(0);

} catch (error) {

console.error(
"公開版の更新を停止しました。"
);

console.error(
error.message
);

process.exit(1);
}
}


if (
process.argv.includes("--gururi-dev")
) {

try {

process.chdir(
path.resolve(__dirname, "..")
);

const workflow = fs.readFileSync(
".github/workflows/deploy.yml",
"utf8"
);

if (
!workflow.includes(
"# GURURI_DEV_DEPLOY_READY"
)
) {
throw new Error(
"開発版専用の配信設定が未完成です。まだ実行できません。"
);
}

function gitRead(args) {
return execFileSync(
"git",
args,
{
encoding: "utf8"
}
).trim();
}

function gitRun(args) {
execFileSync(
"git",
args,
{
stdio: "inherit"
}
);
}

const stagedFiles = gitRead([
"diff",
"--cached",
"--name-only"
]);

if (stagedFiles) {
throw new Error(
"すでにGitへ追加済みの変更があります。配信せず、状況を確認してください。"
);
}

execFileSync(
process.execPath,
["scripts/build.js"],
{
stdio: "inherit"
}
);

gitRun([
"add",
"--",
"package.json",
".gitignore",
"scripts",
".github/workflows",
"src/tools/gururi-paint-dev"
]);

const changes = gitRead([
"diff",
"--cached",
"--name-only"
]);

if (changes) {

gitRun([
"commit",
"-m",
"Update Gururi Paint development"
]);
}

gitRun([
"push",
"origin",
"HEAD:gururi-paint-dev-deploy"
]);

console.log(
"開発版配信用ブランチへ送信しました。"
);

console.log(
"サーバーへの反映結果はGitHub Actionsで確認してください。"
);

process.exit(0);

} catch (error) {

console.error(
"開発版の更新を停止しました。"
);

console.error(
error.message
);

process.exit(1);
}
}

function run(command) {
  console.log(`> ${command}`);
  execSync(command, {
    stdio: "inherit"
  });
}

function output(command) {
  return execSync(command, {
    encoding: "utf8"
  }).trim();
}

try {
  console.log("=== Deploy start ===");

  // 1. 公開用データを生成して、ビルドエラーがないか確認
  run("npm run build");

  // 2. 変更の有無を確認
  const status = output("git status --porcelain");

  if (!status) {
    console.log("変更されたファイルはありません。");
    process.exit(0);
  }

  // 3. 変更をGitへ追加
  run("git add -A");

  // 4. 自動コミット
  const now = new Date();

  const timestamp = now
    .toISOString()
    .replace("T", " ")
    .slice(0, 16);

  run(`git commit -m "Update tools ${timestamp}"`);

  // 5. GitHubへpush
  run("git push");

  console.log("");
  console.log("=== Deploy complete ===");
  console.log("GitHub Actionsによるサイト更新を開始しました。");

} catch (error) {
  console.error("");
  console.error("デプロイに失敗しました。");
  process.exit(1);
}