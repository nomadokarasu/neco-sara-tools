const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const sourceDirectory = path.join(projectRoot, "src");
const outputDirectory = path.join(projectRoot, "dist");

if (!fs.existsSync(sourceDirectory)) {
  console.error("エラー：srcフォルダが見つかりません。");
  process.exit(1);
}

// 古い公開用データを削除
fs.rmSync(outputDirectory, {
  recursive: true,
  force: true
});

// srcの内容からdistを新しく生成
fs.cpSync(sourceDirectory, outputDirectory, {
  recursive: true
});

console.log("公開用データを生成しました。");
console.log(`出力先：${outputDirectory}`);