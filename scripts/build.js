const fs =
  require("node:fs");

const path =
  require("node:path");


const projectRoot =
  path.resolve(
    __dirname,
    ".."
  );


const sourceDirectory =
  path.join(
    projectRoot,
    "src"
  );


const outputDirectory =
  path.join(
    projectRoot,
    "dist"
  );

// 共通管理画面だけを公開版に反映する
if (process.argv.includes("--promote-gururi-admin")) {
  const { execFileSync } = require("node:child_process");

  const developmentAdminPath = path.join(
    sourceDirectory, "tools", "gururi-paint-dev", "admin.php"
  );

  const releaseAdminPath = path.join(
    sourceDirectory, "tools", "gururi-paint", "admin.php"
  );

  const developmentAdmin = fs.readFileSync(
    developmentAdminPath, "utf8"
  );

  if (
    !developmentAdmin.includes("session_name('gururi_paint_testing_admin');") ||
    !developmentAdmin.includes("'path' => '/tools/gururi-paint-dev/'") ||
    !developmentAdmin.includes("gururi-editor-dev")
  ) {
    console.error("エラー：開発版管理画面の設定を確認できません。");
    process.exit(1);
  }

  let releaseAdmin = developmentAdmin.replace(
    /session_name\('gururi_paint_testing_admin'\);\r?\n\r?\n/,
    ""
  );

  releaseAdmin = releaseAdmin.replace(
    "'path' => '/tools/gururi-paint-dev/'",
    "'path' => '/'"
  );

  releaseAdmin = releaseAdmin.replaceAll(
    "gururi-editor-dev",
    "gururi-editor"
  );

  if (
    releaseAdmin.includes("gururi_paint_testing_admin") ||
    releaseAdmin.includes("gururi-editor-dev") ||
    releaseAdmin.includes("/tools/gururi-paint-dev/") ||
    !releaseAdmin.includes("'path' => '/'")
  ) {
    console.error("エラー：公開版への変換に失敗しました。");
    process.exit(1);
  }

  // 変換結果を一時ファイルに保存してPHP構文を検証
  const temporaryAdminPath = path.join(
    projectRoot, "gururi-admin-validation.tmp.php"
  );

  try {
    fs.writeFileSync(temporaryAdminPath, releaseAdmin, "utf8");

    execFileSync(
      "php",
      ["-l", temporaryAdminPath],
      { stdio: "inherit" }
    );

    // 既存の公開版管理画面をバックアップ
    if (!fs.existsSync(releaseAdminPath)) {
      throw new Error("公開版admin.phpが見つかりません。");
    }

    const backupDirectory = path.join(
      projectRoot, "backups"
    );

    fs.mkdirSync(backupDirectory, { recursive: true });

    const backupPath = path.join(
      backupDirectory,
      "gururi-admin-" +
        new Date().toISOString().replace(/[:.]/g, "-") +
        ".php.bak"
    );

    fs.copyFileSync(releaseAdminPath, backupPath);

    // PHP構文チェックに合格した内容だけを反映
    fs.copyFileSync(
      temporaryAdminPath,
      releaseAdminPath
    );

    console.log("管理画面の公開版用変換：OK");
    console.log("PHP構文チェック：OK");
    console.log("バックアップ：" + backupPath);
    console.log("公開版への反映：" + releaseAdminPath);
    console.log("サーバーにはまだ配信していません。");
  } finally {
    if (fs.existsSync(temporaryAdminPath)) {
      fs.unlinkSync(temporaryAdminPath);
    }
  }

  process.exit(0);
}


// ========================================
// ぐるりペイント
// 開発版から公開版への昇格
// ========================================

if (
process.argv.includes(
"--promote-gururi"
)
) {

const {
execFileSync
} = require(
"node:child_process"
);

const optionIndex =
process.argv.indexOf(
"--promote-gururi"
);

const releaseVersion =
process.argv[
optionIndex + 1
] || "";

if (
!/^\d+\.\d+\.\d+$/.test(
releaseVersion
)
) {

console.error(
"エラー：正式版のバージョンを指定してください。例：2.0.1"
);

process.exit(1);
}


const developmentDirectory =
path.join(
sourceDirectory,
"tools",
"gururi-paint-dev"
);

const releaseDirectory =
path.join(
sourceDirectory,
"tools",
"gururi-paint"
);


const targetFiles = [
"index.html",
"script.js",
"service-worker.js",
"style.css",
"admin.php"
];

const targetDirectories = [
"oss"
];


for (
const directoryName of targetDirectories
) {

const developmentTargetDirectory =
path.join(
developmentDirectory,
directoryName
);

if (
!fs.existsSync(
developmentTargetDirectory
) ||
!fs.statSync(
developmentTargetDirectory
).isDirectory()
) {

console.error(
`エラー：開発版の${directoryName}フォルダが見つかりません。`
);

process.exit(1);
}
}


for (
const fileName of targetFiles
) {

const developmentFile =
path.join(
developmentDirectory,
fileName
);

const releaseFile =
path.join(
releaseDirectory,
fileName
);


if (
!fs.existsSync(
developmentFile
)
) {

console.error(
`エラー：開発版の${fileName}が見つかりません。`
);

process.exit(1);
}


if (
!fs.existsSync(
releaseFile
)
) {

console.error(
`エラー：公開版の${fileName}が見つかりません。`
);

process.exit(1);
}
}


const backupTimestamp =
new Date()
.toISOString()
.replace(
/[:.]/g,
"-"
);

const backupDirectory =
path.join(
path.dirname(
projectRoot
),
`gururi-paint-before-${backupTimestamp}`
);


fs.mkdirSync(
backupDirectory,
{
recursive: true
}
);


for (
const fileName of targetFiles
) {

fs.copyFileSync(
path.join(
releaseDirectory,
fileName
),
path.join(
backupDirectory,
fileName
)
);
}


for (
const directoryName of targetDirectories
) {

const releaseTargetDirectory =
path.join(
releaseDirectory,
directoryName
);

if (
!fs.existsSync(
releaseTargetDirectory
)
) {
continue;
}

fs.cpSync(
releaseTargetDirectory,
path.join(
backupDirectory,
directoryName
),
{
recursive: true
}
);
}


console.log(
`置き換え前のバックアップ：${backupDirectory}`
);


const developmentIndexPath =
path.join(
developmentDirectory,
"index.html"
);

const developmentScriptPath =
path.join(
developmentDirectory,
"script.js"
);

const developmentServiceWorkerPath =
path.join(
developmentDirectory,
"service-worker.js"
);

const developmentStylePath =
path.join(
developmentDirectory,
"style.css"
);

const developmentAdminPath =
path.join(
developmentDirectory,
"admin.php"
);


const releaseIndexPath =
path.join(
releaseDirectory,
"index.html"
);

const releaseScriptPath =
path.join(
releaseDirectory,
"script.js"
);

const releaseServiceWorkerPath =
path.join(
releaseDirectory,
"service-worker.js"
);

const releaseStylePath =
path.join(
releaseDirectory,
"style.css"
);

const releaseAdminPath =
path.join(
releaseDirectory,
"admin.php"
);


const developmentIndex =
fs.readFileSync(
developmentIndexPath,
"utf8"
);

const developmentScript =
fs.readFileSync(
developmentScriptPath,
"utf8"
);

const developmentServiceWorker =
fs.readFileSync(
developmentServiceWorkerPath,
"utf8"
);

const developmentStyle =
fs.readFileSync(
developmentStylePath,
"utf8"
);

const developmentAdmin =
fs.readFileSync(
developmentAdminPath,
"utf8"
);


const releaseIndex =
fs.readFileSync(
releaseIndexPath,
"utf8"
);

const releaseServiceWorker =
fs.readFileSync(
releaseServiceWorkerPath,
"utf8"
);


const developmentVersionMatch =
developmentScript.match(
/const APP_VERSION\s*=\s*"([^"]+)";/
);

if (
!developmentVersionMatch
) {

console.error(
"エラー：開発版のバージョンを取得できません。"
);

process.exit(1);
}


const developmentVersion =
developmentVersionMatch[1];


if (
!developmentVersion.endsWith(
"-dev"
)
) {

console.error(
"エラー：開発版のバージョンに-devがありません。"
);

process.exit(1);
}


const releaseBodyPosition =
releaseIndex.indexOf(
"<body>"
);

const developmentBodyPosition =
developmentIndex.indexOf(
"<body>"
);


if (
releaseBodyPosition < 0 ||
developmentBodyPosition < 0
) {

console.error(
"エラー：index.htmlのbodyを取得できません。"
);

process.exit(1);
}


let nextIndex =
releaseIndex.slice(
0,
releaseBodyPosition
) +
developmentIndex.slice(
developmentBodyPosition
);


nextIndex =
nextIndex.replace(
/(\.\/style\.css\?v=)[^"]+/,
`$1${releaseVersion}`
);

nextIndex =
nextIndex.replaceAll(
developmentVersion,
releaseVersion
);


let nextScript =
developmentScript.replaceAll(
developmentVersion,
releaseVersion
);

nextScript =
nextScript.replaceAll(
"gururi-paint-testing-",
"gururi-paint-dev-"
);

nextScript =
nextScript.replaceAll(
"gururi-paint-dev-start-new-project",
"gururi-paint-start-new-project"
);


const releaseCachePrefixMatch =
releaseServiceWorker.match(
/const CACHE_PREFIX\s*=\s*"([^"]+)";/
);


if (
!releaseCachePrefixMatch
) {

console.error(
"エラー：公開版のキャッシュ名を取得できません。"
);

process.exit(1);
}


const releaseCachePrefix =
releaseCachePrefixMatch[1];


let nextServiceWorker =
developmentServiceWorker.replaceAll(
developmentVersion,
releaseVersion
);

nextServiceWorker =
nextServiceWorker.replace(
/(const CACHE_PREFIX\s*=\s*)"[^"]+";/,
`$1"${releaseCachePrefix}";`
);


if (
!developmentAdmin.includes(
"session_name('gururi_paint_testing_admin');"
) ||
!developmentAdmin.includes(
"'path' => '/tools/gururi-paint-dev/'"
)
) {

console.error(
"エラー：開発版admin.phpのセッション設定を確認できません。"
);

process.exit(1);
}


let nextAdmin =
developmentAdmin.replace(
/session_name\('gururi_paint_testing_admin'\);\r?\n\r?\n/,
""
);

nextAdmin =
nextAdmin.replace(
"'path' => '/tools/gururi-paint-dev/'",
"'path' => '/'"
);

// エディタの管理データ・画像参照先を公開版用に変換
nextAdmin =
nextAdmin.replaceAll(
"gururi-editor-dev",
"gururi-editor"
);


if (
nextAdmin.includes(
"gururi_paint_testing_admin"
) ||
nextAdmin.includes(
"/tools/gururi-paint-dev/"
) ||
nextAdmin.includes(
"gururi-editor-dev"
)
) {

console.error(
"エラー：公開版admin.phpに開発版専用設定が残っています。"
);

process.exit(1);
}


if (
!nextAdmin.includes(
"'path' => '/'"
)
) {

console.error(
"エラー：公開版admin.phpのCookieパスを確認できません。"
);

process.exit(1);
}


if (
nextIndex.includes(
"noindex"
) ||
!nextIndex.includes(
'content="index, follow"'
) ||
!nextIndex.includes(
'https://tools.neco-sara.com/tools/gururi-paint/'
)
) {

console.error(
"エラー：公開版のSEO設定を維持できませんでした。"
);

process.exit(1);
}


if (
nextScript.includes(
"gururi-paint-testing-"
) ||
nextServiceWorker.includes(
"gururi-paint-testing-"
)
) {

console.error(
"エラー：開発版専用の保存名が残っています。"
);

process.exit(1);
}


if (
nextIndex.includes(
developmentVersion
) ||
nextScript.includes(
developmentVersion
) ||
nextServiceWorker.includes(
developmentVersion
)
) {

console.error(
"エラー：開発版のバージョン表記が残っています。"
);

process.exit(1);
}


try {

execFileSync(
process.execPath,
[
"--input-type=module",
"--check"
],
{
input: nextScript,
stdio: [
"pipe",
"ignore",
"pipe"
]
}
);

} catch (error) {

console.error(
"エラー：公開版JavaScriptの構文検査に失敗しました。"
);

process.exit(1);
}


fs.writeFileSync(
releaseIndexPath,
nextIndex,
"utf8"
);

fs.writeFileSync(
releaseScriptPath,
nextScript,
"utf8"
);

fs.writeFileSync(
releaseServiceWorkerPath,
nextServiceWorker,
"utf8"
);

fs.writeFileSync(
releaseStylePath,
developmentStyle,
"utf8"
);

fs.writeFileSync(
releaseAdminPath,
nextAdmin,
"utf8"
);


for (
const directoryName of targetDirectories
) {

const developmentTargetDirectory =
path.join(
developmentDirectory,
directoryName
);

const releaseTargetDirectory =
path.join(
releaseDirectory,
directoryName
);

fs.rmSync(
releaseTargetDirectory,
{
recursive: true,
force: true
}
);

fs.cpSync(
developmentTargetDirectory,
releaseTargetDirectory,
{
recursive: true
}
);
}


console.log(
"ぐるりペイントの開発版を公開版へ反映しました。"
);

console.log(
`開発版：${developmentVersion}`
);

console.log(
`公開版：${releaseVersion}`
);

console.log(
"まだサーバーには配信していません。"
);

console.log(
"公開版の統合コードを作成し、内容を確認してください。"
);

process.exit(0);
}


// ========================================
// ぐるりエディタ
// 開発版から公開版への反映
// ========================================

if (process.argv.includes("--promote-editor")) {
  const developmentDirectory = path.join(
    sourceDirectory, "tools", "gururi-editor-dev"
  );

  const releaseDirectory = path.join(
    sourceDirectory, "tools", "gururi-editor"
  );

  const files = ["index.html", "app.js", "style.css"];

  for (const name of files) {
    if (!fs.existsSync(path.join(developmentDirectory, name))) {
      console.error("開発版のファイルがありません：" + name);
      process.exit(1);
    }
  }

  // 公開版の既存ファイルをバックアップ
  if (fs.existsSync(releaseDirectory)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDirectory = path.join(
      path.dirname(projectRoot),
      "gururi-editor-before-" + stamp
    );

    fs.cpSync(releaseDirectory, backupDirectory, {
      recursive: true
    });

    console.log("公開版バックアップ：" + backupDirectory);
  }

  // 公開版への反映前にJavaScriptの構文を確認
  const {execFileSync} = require("node:child_process");

  try {
    execFileSync(
      process.execPath,
      ["--check", path.join(developmentDirectory, "app.js")],
      {stdio: "pipe"}
    );
  } catch (error) {
    console.error("エラー：開発版app.jsに構文エラーがあります。");
    console.error(error.stderr?.toString() || error.message);
    process.exit(1);
  }

  fs.mkdirSync(releaseDirectory, {recursive: true});

  const developmentIndexPath = path.join(
    developmentDirectory, "index.html"
  );

  let releaseIndex = fs.readFileSync(
    developmentIndexPath, "utf8"
  );

  // 開発版のURLを公開版のURLに変更
  releaseIndex = releaseIndex.replaceAll(
    "gururi-editor-dev",
    "gururi-editor"
  );

  // 公開版のバージョンを指定
  const editorVersion = "0.1.0";

  if (!/ver\.\d+\.\d+\.\d+/.test(releaseIndex)) {
    console.error("エラー：バージョン表記が見つかりません。");
    process.exit(1);
  }

  releaseIndex = releaseIndex.replace(
    /ver\.\d+\.\d+\.\d+/,
    "ver." + editorVersion
  );

  // 公開版は検索エンジンへの登録を許可
  releaseIndex = releaseIndex.replace(
    /<meta\s+name=["']robots["']\s+content=["']noindex,\s*nofollow["']\s*\/?>/i,
    '<meta name="robots" content="index, follow">'
  );

  // robots設定がない場合も公開版用に追加
  if (!/<meta\s+name=["']robots["']/i.test(releaseIndex)) {
    releaseIndex = releaseIndex.replace(
      "</head>",
      '<meta name="robots" content="index, follow">\n</head>'
    );
  }

  // 公開版のURLとSEO設定を検証
  if (
    releaseIndex.includes("gururi-editor-dev") ||
    releaseIndex.includes("noindex") ||
    !releaseIndex.includes('content="index, follow"')
  ) {
    console.error("エラー：ぐるりエディタ公開版の設定を確認できません。");
    process.exit(1);
  }

  for (const name of files) {
    if (name === "index.html") {
      fs.writeFileSync(
        path.join(releaseDirectory, name),
        releaseIndex,
        "utf8"
      );
    } else {
      fs.copyFileSync(
        path.join(developmentDirectory, name),
        path.join(releaseDirectory, name)
      );
    }
  }

  // 管理データはコピーしない
  console.log("ぐるりエディタの開発版を公開版へ反映しました。");
  console.log("管理データ home-content.json は変更していません。");
  console.log("まだサーバーには配信していません。");

  process.exit(0);
}

// ========================================
// GA4設定
// ========================================

const GA_MEASUREMENT_ID =
  "G-E5CTR47H44";

const GA_ALL_MEASUREMENT_ID =
  "G-60W5Q19X8K";


const GA_TAG = `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', '${GA_MEASUREMENT_ID}');
    gtag('config', '${GA_ALL_MEASUREMENT_ID}');
  </script>
`;

// ========================================
// srcフォルダ確認
// ========================================

if (
  !fs.existsSync(
    sourceDirectory
  )
) {

  console.error(
    "エラー：srcフォルダが見つかりません。"
  );

  process.exit(
    1
  );
}


// ========================================
// 古いdistを削除
// ========================================

fs.rmSync(
  outputDirectory,
  {
    recursive: true,
    force: true
  }
);


// ========================================
// src → dist
// ========================================

fs.cpSync(
sourceDirectory,
outputDirectory,
{
recursive: true
}
);


// ========================================
// 本番で生成・保持されるデータをdistから除外
// ========================================

const gururiWatchDataDirectory =
path.join(
outputDirectory,
"tools",
"gururi-watch",
"data"
);

const gururiWatchUploadsDirectory =
path.join(
outputDirectory,
"tools",
"gururi-watch",
"uploads"
);

const gururiWatchAdminConfigFile =
path.join(
outputDirectory,
"tools",
"gururi-watch",
"api",
"admin-config.php"
);

fs.rmSync(
gururiWatchDataDirectory,
{
recursive: true,
force: true
}
);

fs.rmSync(
gururiWatchUploadsDirectory,
{
recursive: true,
force: true
}
);

fs.rmSync(
gururiWatchAdminConfigFile,
{
force: true
}
);


// ========================================
// ぐるりペイントのサーバー管理データを除外
// ========================================

for (const toolName of [
"gururi-paint",
"gururi-paint-dev",
"gururi-editor",
"gururi-editor-dev"
]) {

const toolDirectory =
path.join(
outputDirectory,
"tools",
toolName
);

for (const entryName of [
".admin-credentials.php",
".htaccess",
".htpasswd",
"home-content.json",
"home-content-editor.json",
"home-thumbnails",
"home-thumbnails-editor"
]) {

fs.rmSync(
path.join(
toolDirectory,
entryName
),
{
recursive: true,
force: true
}
);
}
}


// ========================================
// HTMLファイルを再帰的に取得
// ========================================

function findHtmlFiles(
  directory
) {

  const htmlFiles =
    [];


  const entries =
    fs.readdirSync(
      directory,
      {
        withFileTypes: true
      }
    );


  entries.forEach(
    (entry) => {

      const fullPath =
        path.join(
          directory,
          entry.name
        );


      if (
        entry.isDirectory()
      ) {

        htmlFiles.push(
          ...findHtmlFiles(
            fullPath
          )
        );

        return;
      }


      if (
        entry.isFile() &&
        entry.name
          .toLowerCase()
          .endsWith(
            ".html"
          )
      ) {

        htmlFiles.push(
          fullPath
        );
      }
    }
  );


  return htmlFiles;
}


// ========================================
// 開発版のHTMLをアクセス解析の対象から外す
// ========================================

const developmentDirectories = [
path.join(outputDirectory, "tools", "gururi-paint-dev"),
path.join(outputDirectory, "tools", "gururi-collection-dev"),
path.join(outputDirectory, "tools", "gururi-editor-dev")
];

const originalFindHtmlFiles = findHtmlFiles;

findHtmlFiles = function(directory) {
const resolvedDirectory = path.resolve(directory);

if (developmentDirectories.some((item) => {
return resolvedDirectory === path.resolve(item);
})) {
return [];
}

return originalFindHtmlFiles(directory);
};


// ========================================
// HTMLへGA4タグを追加
// ========================================

function addGoogleAnalytics(
  filePath
) {

  let html =
    fs.readFileSync(
      filePath,
      "utf8"
    );


 // 両方のGA4測定IDがすでにある場合は追加しない
if (
  html.includes(GA_MEASUREMENT_ID) &&
  html.includes(GA_ALL_MEASUREMENT_ID)
) {

  console.log(
    `GA4設定済み：${path.relative(
      outputDirectory,
      filePath
    )}`
  );

  return;
}

  // <head>がない場合
  if (
    !/<head[^>]*>/i.test(
      html
    )
  ) {

    console.warn(
      `警告：<head>が見つかりません：${path.relative(
        outputDirectory,
        filePath
      )}`
    );

    return;
  }


  // <head>の直後に挿入
  html =
    html.replace(
      /<head([^>]*)>/i,
      (match) =>
        `${match}${GA_TAG}`
    );


  fs.writeFileSync(
    filePath,
    html,
    "utf8"
  );


  console.log(
    `GA4追加：${path.relative(
      outputDirectory,
      filePath
    )}`
  );
}


// ========================================
// 全HTMLへGA4を設定
// ========================================

const htmlFiles =
  findHtmlFiles(
    outputDirectory
  );


htmlFiles.forEach(
  addGoogleAnalytics
);


// ========================================
// 完了
// ========================================

console.log(
  ""
);

console.log(
  "公開用データを生成しました。"
);

console.log(
  `出力先：${outputDirectory}`
);

console.log(
  `HTMLファイル数：${htmlFiles.length}`
);

console.log(
  `GA4測定ID：${GA_MEASUREMENT_ID}`
);