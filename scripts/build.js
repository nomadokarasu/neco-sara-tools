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
"style.css"
];


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
"gururi-paint-dev"
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
"home-thumbnails"
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

const developmentDirectory =
path.join(
outputDirectory,
"tools",
"gururi-paint-dev"
);

const originalFindHtmlFiles =
findHtmlFiles;

findHtmlFiles = function(directory) {

if (
path.resolve(directory) ===
path.resolve(developmentDirectory)
) {
return [];
}

return originalFindHtmlFiles(
directory
);
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