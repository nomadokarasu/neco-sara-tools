const folderInput = document.getElementById("folder-input");
const downloadButton = document.getElementById("download-button");
const clearButton = document.getElementById("clear-button");
const copyButton = document.getElementById("copy-button");

const summary = document.getElementById("summary");
const fileCount = document.getElementById("file-count");
const totalSize = document.getElementById("total-size");

const fileSection = document.getElementById("file-section");
const fileList = document.getElementById("file-list");

const previewSection = document.getElementById("preview-section");
const output = document.getElementById("output");

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;

const ignoredDirectoryNames = new Set([
  ".git",
  ".svn",
  ".hg",
  ".idea",
  ".vscode",
  "node_modules",
  "vendor",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".nuxt",
  ".cache",
  "tmp",
  "temp"
]);

const ignoredFileNames = new Set([
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml"
]);

const allowedExtensions = new Set([
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",

  "js",
  "jsx",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "vue",
  "svelte",

  "json",
  "jsonc",
  "xml",
  "yaml",
  "yml",
  "toml",

  "md",
  "mdx",
  "txt",

  "py",
  "rb",
  "php",
  "java",
  "kt",
  "kts",
  "swift",
  "go",
  "rs",
  "c",
  "h",
  "cpp",
  "hpp",
  "cs",

  "sh",
  "bash",
  "zsh",
  "fish",
  "bat",
  "cmd",
  "ps1",

  "sql",
  "graphql",
  "gql",

  "env.example",
  "gitignore",
  "gitattributes",
  "editorconfig",
  "dockerfile"
]);

let selectedFiles = [];
let combinedText = "";
let rootFolderName = "project";

folderInput.addEventListener("change", handleFolderSelection);
downloadButton.addEventListener("click", downloadCombinedText);
clearButton.addEventListener("click", clearSelection);
copyButton.addEventListener("click", copyCombinedText);

async function handleFolderSelection(event) {
  const allFiles = Array.from(event.target.files ?? []);

  if (allFiles.length === 0) {
    return;
  }

  setControlsDisabled(true);
  showTemporaryMessage("ファイルを読み込んでいます。");

  try {
    rootFolderName = getRootFolderName(allFiles);

    const filteredFiles = allFiles
      .filter(isTargetFile)
      .sort((a, b) => {
        const pathA = getRelativePath(a);
        const pathB = getRelativePath(b);

        return pathA.localeCompare(pathB, "ja");
      });

    if (filteredFiles.length === 0) {
      clearSelection();

      window.alert(
        "統合対象となるコードファイルが見つかりませんでした。"
      );

      return;
    }

    const totalBytes = filteredFiles.reduce(
      (sum, file) => sum + file.size,
      0
    );

    if (totalBytes > MAX_TOTAL_SIZE) {
      clearSelection();

      window.alert(
        "対象ファイルの合計容量が大きすぎます。\n" +
        "合計20MB以内のフォルダを選択してください。"
      );

      return;
    }

    selectedFiles = filteredFiles;
    combinedText = await combineFiles(selectedFiles);

    renderResult();
  } catch (error) {
    console.error(error);

    clearSelection();

    window.alert(
      "ファイルの読み込み中に問題が発生しました。"
    );
  } finally {
    setControlsDisabled(false);
  }
}

function isTargetFile(file) {
  const relativePath = getRelativePath(file);
  const pathParts = relativePath.split("/");

  const directoryParts = pathParts.slice(0, -1);

  if (
    directoryParts.some((directoryName) =>
      ignoredDirectoryNames.has(directoryName)
    )
  ) {
    return false;
  }

  if (ignoredFileNames.has(file.name)) {
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    return false;
  }

  return hasAllowedExtension(file.name);
}

function hasAllowedExtension(fileName) {
  const lowerName = fileName.toLowerCase();

  const specialFileNames = [
    "dockerfile",
    "makefile",
    "procfile",
    ".gitignore",
    ".gitattributes",
    ".editorconfig",
    ".npmrc",
    ".nvmrc",
    ".prettierrc",
    ".eslintrc"
  ];

  if (specialFileNames.includes(lowerName)) {
    return true;
  }

  const extension = lowerName.includes(".")
    ? lowerName.split(".").pop()
    : "";

  return allowedExtensions.has(extension);
}

async function combineFiles(files) {
  const sections = [];

  sections.push(
    createProjectHeader(files)
  );

  for (const file of files) {
    const relativePath = removeRootFolder(
      getRelativePath(file)
    );

    let content = "";

    try {
      content = await file.text();
    } catch (error) {
      console.error(
        `${relativePath}を読み込めませんでした。`,
        error
      );

      content = "[このファイルは読み込めませんでした]";
    }

    sections.push(
      [
        "",
        "=".repeat(80),
        `FILE: ${relativePath}`,
        `SIZE: ${formatBytes(file.size)}`,
        "=".repeat(80),
        "",
        content.trimEnd(),
        ""
      ].join("\n")
    );
  }

  return sections.join("\n");
}

function createProjectHeader(files) {
  const totalBytes = files.reduce(
    (sum, file) => sum + file.size,
    0
  );

  const generatedAt = new Date().toLocaleString("ja-JP");

  return [
    "CODE COMBINER EXPORT",
    "",
    `Project: ${rootFolderName}`,
    `Files: ${files.length}`,
    `Total size: ${formatBytes(totalBytes)}`,
    `Generated: ${generatedAt}`,
    "",
    "File list:",
    ...files.map((file) => {
      return `- ${removeRootFolder(getRelativePath(file))}`;
    })
  ].join("\n");
}

function renderResult() {
  const totalBytes = selectedFiles.reduce(
    (sum, file) => sum + file.size,
    0
  );

  fileCount.textContent = String(selectedFiles.length);
  totalSize.textContent = formatBytes(totalBytes);

  fileList.innerHTML = "";

  selectedFiles.forEach((file) => {
    const item = document.createElement("div");
    item.className = "file-item";

    const path = document.createElement("span");
    path.className = "file-item__path";
    path.textContent = removeRootFolder(
      getRelativePath(file)
    );

    const size = document.createElement("span");
    size.className = "file-item__size";
    size.textContent = formatBytes(file.size);

    item.append(path, size);
    fileList.appendChild(item);
  });

  output.value = combinedText;

  summary.hidden = false;
  fileSection.hidden = false;
  previewSection.hidden = false;
  downloadButton.disabled = false;
}

function downloadCombinedText() {
  if (!combinedText) {
    return;
  }

  const blob = new Blob(
    [combinedText],
    {
      type: "text/plain;charset=utf-8"
    }
  );

  const downloadUrl = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = `${sanitizeFileName(rootFolderName)}-combined.txt`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(downloadUrl);
}

async function copyCombinedText() {
  if (!combinedText) {
    return;
  }

  const originalText = copyButton.textContent;

  try {
    await navigator.clipboard.writeText(combinedText);

    copyButton.textContent = "コピーしました";
  } catch (error) {
    console.error(error);

    output.focus();
    output.select();

    const copied = document.execCommand("copy");

    copyButton.textContent = copied
      ? "コピーしました"
      : "コピーできませんでした";
  }

  window.setTimeout(() => {
    copyButton.textContent = originalText;
  }, 1800);
}

function clearSelection() {
  selectedFiles = [];
  combinedText = "";
  rootFolderName = "project";

  folderInput.value = "";
  output.value = "";
  fileList.innerHTML = "";

  summary.hidden = true;
  fileSection.hidden = true;
  previewSection.hidden = true;

  downloadButton.disabled = true;
}

function getRelativePath(file) {
  return file.webkitRelativePath || file.name;
}

function getRootFolderName(files) {
  const firstPath = getRelativePath(files[0]);
  const firstPart = firstPath.split("/")[0];

  return firstPart || "project";
}

function removeRootFolder(relativePath) {
  const parts = relativePath.split("/");

  if (parts.length <= 1) {
    return relativePath;
  }

  return parts.slice(1).join("/");
}

function sanitizeFileName(value) {
  const sanitized = value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "project";
}

function formatBytes(bytes) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${
    units[unitIndex]
  }`;
}

function setControlsDisabled(disabled) {
  folderInput.disabled = disabled;

  if (disabled) {
    downloadButton.disabled = true;
    clearButton.disabled = true;
    copyButton.disabled = true;
  } else {
    downloadButton.disabled = combinedText.length === 0;
    clearButton.disabled = false;
    copyButton.disabled = false;
  }
}

function showTemporaryMessage(message) {
  fileList.innerHTML = "";

  const item = document.createElement("div");
  item.className = "file-item";
  item.textContent = message;

  fileList.appendChild(item);
  fileSection.hidden = false;
}