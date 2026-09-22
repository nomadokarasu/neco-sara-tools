const {
execSync,
execFileSync
} = require("node:child_process");

const fs = require("node:fs");
const path = require("node:path");

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