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