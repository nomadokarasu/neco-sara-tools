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
// GA4設定
// ========================================

const GA_MEASUREMENT_ID =
  "G-E5CTR47H44";


const GA_TAG = `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', '${GA_MEASUREMENT_ID}');
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


  // すでに同じGA4タグがある場合は追加しない
  if (
    html.includes(
      GA_MEASUREMENT_ID
    )
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