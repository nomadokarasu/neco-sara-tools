const folderInput = document.getElementById("folder-input");
const downloadButton = document.getElementById("download-button");
const clearButton = document.getElementById("clear-button");
const copyButton = document.getElementById("copy-button");
const copyButtonBottom = document.getElementById("copy-button-bottom");

const summary = document.getElementById("summary");
const fileCount = document.getElementById("file-count");
const excludedCount = document.getElementById("excluded-count");
const totalSize = document.getElementById("total-size");

const fileSection = document.getElementById("file-section");
const fileList = document.getElementById("file-list");
const combineButton = document.getElementById("combine-button");
const selectionCount = document.getElementById("selection-count");
const selectAllCheckbox = document.getElementById("select-all-checkbox");

const excludedSection = document.getElementById("excluded-section");
const excludedList = document.getElementById("excluded-list");

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


]);

let availableFiles = [];
let selectedPaths = new Set();
let selectedFiles = [];
let excludedFiles = [];
let combinedText = "";
let rootFolderName = "project";
let openedFolders = new Set();

folderInput.addEventListener("change", handleFolderSelection);
downloadButton.addEventListener("click", downloadCombinedText);
clearButton.addEventListener("click", clearSelection);
copyButton.addEventListener("click", () => copyCombinedText(copyButton));
copyButtonBottom.addEventListener("click", () => copyCombinedText(copyButtonBottom));
combineButton.addEventListener("click", executeCombination);
selectAllCheckbox.addEventListener("change", () => {
selectedPaths = selectAllCheckbox.checked
? new Set(availableFiles.map(getRelativePath))
: new Set();
selectionChanged();
});

function handleFolderSelection(event) {
const allFiles = Array.from(event.target.files ?? []);
if (!allFiles.length) return;
clearSelection();
rootFolderName = getRootFolderName(allFiles);
const classified = allFiles.map(classifyFile).sort((a,b) => getRelativePath(a.file).localeCompare(getRelativePath(b.file), "ja"));
availableFiles = classified.filter(item => item.included).map(item => item.file);
excludedFiles = classified.filter(item => !item.included);
selectedPaths = new Set();
fileSection.hidden = false;
summary.hidden = false;
renderFileTree();
updateSelectionSummary();
}

function renderFileTree() {
fileList.replaceChildren();
const root = {name: rootFolderName, folders: new Map(), files: []};
for (const result of [...availableFiles.map(file => ({file, included: true})), ...excludedFiles]) {
const parts = getRelativePath(result.file).split("/").slice(1);
let node = root;
for (const segment of parts.slice(0, -1)) {
if (!node.folders.has(segment)) node.folders.set(segment, {name: segment, folders: new Map(), files: []});
node = node.folders.get(segment);
}
node.files.push(result);
}
function pathsWithin(node) {
return [...node.files.filter(item => item.included).map(item => getRelativePath(item.file)), ...[...node.folders.values()].flatMap(pathsWithin)];
}
function addNode(node, container, isRoot = false, parentPath = "") {
const folderPaths = pathsWithin(node);
let children = container;
const folderPath = parentPath ? `${parentPath}/${node.name}` : node.name;
if (!isRoot) {
const details = document.createElement("details");
details.open = openedFolders.has(folderPath);
details.addEventListener("toggle", () => {
if (details.open) {
openedFolders.add(folderPath);
} else {
openedFolders.delete(folderPath);
}
});
const heading = document.createElement("summary");
heading.className = "tree-heading";
const checkbox = document.createElement("input");
checkbox.type = "checkbox";
checkbox.disabled = folderPaths.length === 0;
checkbox.checked = folderPaths.length > 0 && folderPaths.every(path => selectedPaths.has(path));
checkbox.indeterminate = folderPaths.some(path => selectedPaths.has(path)) && !checkbox.checked;
checkbox.addEventListener("click", e => e.stopPropagation());
checkbox.addEventListener("change", () => {
for (const path of folderPaths) checkbox.checked ? selectedPaths.add(path) : selectedPaths.delete(path);
selectionChanged();
});
const name = document.createElement("span");
name.textContent = "📁 " + node.name;
heading.append(checkbox,name);
details.append(heading);
children = document.createElement("div");
children.className = "tree-children";
details.append(children);
container.append(details);
}
for (const folder of [...node.folders.values()].sort((a,b) => a.name.localeCompare(b.name,"ja"))) addNode(folder, children, false, folderPath);
for (const item of node.files.sort((a,b) => a.file.name.localeCompare(b.file.name,"ja"))) {
const label = document.createElement("label");
label.className = "tree-file";
const checkbox = document.createElement("input");
checkbox.type = "checkbox";
checkbox.disabled = !item.included;
checkbox.checked = item.included && selectedPaths.has(getRelativePath(item.file));
checkbox.addEventListener("change", () => {
const path = getRelativePath(item.file);
checkbox.checked ? selectedPaths.add(path) : selectedPaths.delete(path);
selectionChanged();
});
const name = document.createElement("span");
name.textContent = "📄 " + item.file.name;
const size = document.createElement("small");
size.textContent = item.included ? formatBytes(item.file.size) : item.reason;
if (!item.included) label.classList.add("tree-file--disabled");
label.append(checkbox,name,size);
children.append(label);
}
}
addNode(root,fileList,true);
}

function selectionChanged() {
combinedText = "";
selectedFiles = [];
output.value = "";
previewSection.hidden = true;
downloadButton.disabled = true;
copyButton.disabled = true;
copyButtonBottom.disabled = true;
renderFileTree();
updateSelectionSummary();
}

function updateSelectionSummary() {
const files = availableFiles.filter(file => selectedPaths.has(getRelativePath(file)));
const bytes = files.reduce((sum,file) => sum + file.size,0);
fileCount.textContent = String(files.length);
excludedCount.textContent = String(excludedFiles.length + availableFiles.length - files.length);
totalSize.textContent = formatBytes(bytes);
selectionCount.textContent = `${files.length}ファイル選択中`;
combineButton.disabled = files.length === 0 || bytes > MAX_TOTAL_SIZE;
selectionCount.textContent += bytes > MAX_TOTAL_SIZE ? "（合計20MBを超えています）" : "";
selectAllCheckbox.checked = availableFiles.length > 0 && files.length === availableFiles.length;
selectAllCheckbox.indeterminate = files.length > 0 && files.length < availableFiles.length;
selectAllCheckbox.disabled = availableFiles.length === 0;
}

async function executeCombination() {
selectedFiles = availableFiles.filter(file => selectedPaths.has(getRelativePath(file)));
if (!selectedFiles.length) return;
setControlsDisabled(true);
combineButton.disabled = true;
try {
combinedText = await combineFiles(selectedFiles);
renderResult();
} catch (error) {
console.error(error);
window.alert("統合中に問題が発生しました。");
} finally {
setControlsDisabled(false);
updateSelectionSummary();
}
}

function classifyFile(file) {
  const relativePath = getRelativePath(file);
  const pathParts = relativePath.split("/");
  const directoryParts = pathParts.slice(0, -1);

  const ignoredDirectory = directoryParts.find((directoryName) =>
    ignoredDirectoryNames.has(directoryName)
  );

  if (ignoredDirectory) {
    return {
      file,
      included: false,
      reason: `除外フォルダ：${ignoredDirectory}`
    };
  }

  if (ignoredFileNames.has(file.name)) {
    return {
      file,
      included: false,
      reason: "除外対象のファイル名"
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      file,
      included: false,
      reason: "1ファイルの容量上限を超過"
    };
  }

  if (!hasAllowedExtension(file.name)) {
    return {
      file,
      included: false,
      reason: "対象外のファイル形式"
    };
  }

  return {
    file,
    included: true,
    reason: ""
  };
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
  ".eslintrc",
  ".env.example",
  ".env.local.example",
  ".env.development.example",
  ".env.production.example"
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
output.value = combinedText;
previewSection.hidden = false;
downloadButton.disabled = false;
copyButton.disabled = false;
copyButtonBottom.disabled = false;
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

async function copyCombinedText(button) {
if (!combinedText) {
return;
}

const originalText = button.textContent;

try {
await navigator.clipboard.writeText(combinedText);
button.textContent = "コピーしました";
} catch (error) {
console.error(error);
output.focus();
output.select();
const copied = document.execCommand("copy");
button.textContent = copied ? "コピーしました" : "コピーできませんでした";
}

window.setTimeout(() => {
button.textContent = originalText;
}, 1800);
}

function clearSelection() {
availableFiles = [];
selectedPaths = new Set();
selectedFiles = [];
excludedFiles = [];
combinedText = "";
rootFolderName = "project";
openedFolders = new Set();
folderInput.value = "";
output.value = "";
fileList.replaceChildren();
excludedList.replaceChildren();
summary.hidden = true;
fileSection.hidden = true;
excludedSection.hidden = true;
previewSection.hidden = true;
downloadButton.disabled = true;
copyButton.disabled = true;
copyButtonBottom.disabled = true;
combineButton.disabled = true;
selectionCount.textContent = "";
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
clearButton.disabled = disabled;
combineButton.disabled = disabled || selectedPaths.size === 0;
downloadButton.disabled = disabled || !combinedText;
copyButton.disabled = disabled || !combinedText;
copyButtonBottom.disabled = disabled || !combinedText;
}
