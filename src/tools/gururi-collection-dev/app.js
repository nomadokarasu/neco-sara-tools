const recommendedWorks = [
{
id: "recommended-001",
title: "サンプル作品 01",
author: "JUNOTA",
type: "illustration",
productUrl: "https://booth.pm/",
symbol: "◯"
},
{
id: "recommended-002",
title: "サンプル作品 02",
author: "JUNOTA",
type: "illustration",
productUrl: "https://booth.pm/",
symbol: "◎"
},
{
id: "recommended-003",
title: "サンプル作品 03",
author: "JUNOTA",
type: "illustration",
productUrl: "https://booth.pm/",
symbol: "◌"
}
];

const state = {
category: "all",
query: "",
works: []
};

const els = {
recommendedTrack: document.querySelector("#recommended-track"),
recommendedPrev: document.querySelector("#recommended-prev"),
recommendedNext: document.querySelector("#recommended-next"),
addButton: document.querySelector("#add-artwork-button"),
emptyAddButton: document.querySelector("#empty-add-button"),
fileInput: document.querySelector("#artwork-file-input"),
backupButton: document.querySelector("#backup-button"),
restoreButton: document.querySelector("#restore-button"),
restoreFileInput: document.querySelector("#restore-file-input"),
categoryTabs: [...document.querySelectorAll(".category-tab")],
searchInput: document.querySelector("#search-input"),
artworkGrid: document.querySelector("#artwork-grid"),
emptyState: document.querySelector("#empty-state"),
libraryCount: document.querySelector("#library-count"),
viewerLayer: document.querySelector("#viewer-layer"),
viewerBack: document.querySelector("#viewer-back"),
viewerTitle: document.querySelector("#viewer-title"),
viewerAuthor: document.querySelector("#viewer-author"),
viewerStage: document.querySelector("#viewer-stage"),
viewerCanvas: document.querySelector("#viewer-canvas"),
viewerPlayButton: document.querySelector("#viewer-play-button"),
viewerMessage: document.querySelector("#viewer-message"),
viewerMessageTitle: document.querySelector("#viewer-message-title"),
viewerMessageText: document.querySelector("#viewer-message-text")
};

const installButton = document.querySelector("#install-button");
const installModal = document.querySelector("#install-modal");
const installModalClose = document.querySelector("#install-modal-close");
const installDeviceTabs = [...document.querySelectorAll(".install-device-tab")];
const installGuides = [...document.querySelectorAll(".install-guide")];
const installNativeButton = document.querySelector("#install-native-button");
const installPcButton = document.querySelector("#install-pc-button");
let deferredInstallPrompt = null;
let installPreviousFocus = null;

function isStandaloneApp() {
return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function detectInstallDevice() {
const ua = navigator.userAgent;
if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
if (/Android/i.test(ua)) return "android";
return "pc";
}

function selectInstallDevice(device) {
installDeviceTabs.forEach((tab) => {
const active = tab.dataset.installDevice === device;
tab.classList.toggle("is-active", active);
tab.setAttribute("aria-pressed", active ? "true" : "false");
});
installGuides.forEach((guide) => {
guide.hidden = guide.dataset.installGuide !== device;
});
}

function openInstallModal() {
installPreviousFocus = document.activeElement;
selectInstallDevice(detectInstallDevice());
installModal.hidden = false;
document.body.classList.add("install-modal-open");
installModalClose.focus();
}

function closeInstallModal() {
installModal.hidden = true;
document.body.classList.remove("install-modal-open");
if (installPreviousFocus && typeof installPreviousFocus.focus === "function") {
installPreviousFocus.focus();
}
}

async function requestNativeInstallation() {
if (!deferredInstallPrompt) return;
const promptEvent = deferredInstallPrompt;
deferredInstallPrompt = null;
installNativeButton.hidden = true;
installPcButton.hidden = true;
try {
await promptEvent.prompt();
await promptEvent.userChoice;
} catch (error) {
console.warn("インストール画面を表示できませんでした。", error);
}
}

function setupPwa() {
if ("serviceWorker" in navigator && window.isSecureContext) {
window.addEventListener("load", () => {
navigator.serviceWorker.register("./sw.js", {scope: "./"}).catch((error) => {
console.warn("オフライン機能を登録できませんでした", error);
});
});
}

if (isStandaloneApp()) {
installButton.hidden = true;
return;
}

installButton.addEventListener("click", () => {
if (deferredInstallPrompt) {
requestNativeInstallation();
} else {
openInstallModal();
}
});
installModalClose.addEventListener("click", closeInstallModal);

installModal.addEventListener("click", (event) => {
if (event.target === installModal) closeInstallModal();
});

document.addEventListener("keydown", (event) => {
if (installModal.hidden) return;
if (event.key === "Escape") {
event.preventDefault();
closeInstallModal();
}
if (event.key === "Tab") {
const controls = [...installModal.querySelectorAll("button:not([hidden])")].filter((button) => button.getClientRects().length > 0);
if (!controls.length) return;
const first = controls[0];
const last = controls[controls.length - 1];
if (event.shiftKey && document.activeElement === first) {
event.preventDefault();
last.focus();
} else if (!event.shiftKey && document.activeElement === last) {
event.preventDefault();
first.focus();
}
}
});

installDeviceTabs.forEach((tab) => {
tab.addEventListener("click", () => {
selectInstallDevice(tab.dataset.installDevice);
});
});

window.addEventListener("beforeinstallprompt", (event) => {
event.preventDefault();
deferredInstallPrompt = event;
if (detectInstallDevice() === "android") {
installNativeButton.hidden = false;
} else {
installPcButton.hidden = false;
}
});

window.addEventListener("appinstalled", () => {
deferredInstallPrompt = null;
installButton.hidden = true;
installNativeButton.hidden = true;
installPcButton.hidden = true;
closeInstallModal();
});

installNativeButton.addEventListener("click", requestNativeInstallation);
installPcButton.addEventListener("click", requestNativeInstallation);
}

function typeLabel(type) {
if (type === "animation") return "動画";
if (type === "game") return "ゲーム";
return "画像";
}

const COLLECTION_DB_NAME = "gururi-collection-db";
const COLLECTION_DB_VERSION = 2;
const COLLECTION_STORE_NAME = "artworks";

function openCollectionDatabase() {
return new Promise((resolve, reject) => {
const request = indexedDB.open(
COLLECTION_DB_NAME,
COLLECTION_DB_VERSION
);

request.onupgradeneeded = () => {
const database = request.result;

if (!database.objectStoreNames.contains(COLLECTION_STORE_NAME)) {
database.createObjectStore(COLLECTION_STORE_NAME, {
keyPath: "id"
});
}
};

request.onsuccess = () => {
resolve(request.result);
};

request.onerror = () => {
reject(request.error || new Error("コレクションデータベースを開けませんでした。"));
};
});
}

async function saveArtworkToDatabase(
work,
sourceBlob,
zipBlob = null
) {
const database = await openCollectionDatabase();

return new Promise((resolve, reject) => {
const transaction = database.transaction(
COLLECTION_STORE_NAME,
"readwrite"
);

const store = transaction.objectStore(COLLECTION_STORE_NAME);

store.put({
id: work.id,
title: work.title,
author: work.author,
authorUrl: work.authorUrl || "",
createdAt: work.createdAt || "",
type: work.type,
symbol: work.symbol,
sourceFileName: work.sourceFileName,
sourceBlob,
zipBlob,
thumbnailBlob:
work.thumbnailBlob || null,
playback:
work.playback || null,
camera:
work.camera || {
yaw: 0,
pitch: 0,
fov: 75
}
});

transaction.oncomplete = () => {
database.close();
resolve();
};

transaction.onerror = () => {
const error = transaction.error;
database.close();
reject(error || new Error("作品を保存できませんでした。"));
};

transaction.onabort = () => {
const error = transaction.error;
database.close();
reject(error || new Error("作品の保存が中断されました。"));
};
});
}

async function getAllArtworkRecordsFromDatabase() {
const database = await openCollectionDatabase();

return new Promise((resolve, reject) => {
const transaction = database.transaction(
COLLECTION_STORE_NAME,
"readonly"
);

const store = transaction.objectStore(COLLECTION_STORE_NAME);
const request = store.getAll();

request.onsuccess = () => {
database.close();
resolve(request.result || []);
};

request.onerror = () => {
const error = request.error;
database.close();
reject(error || new Error("保存済み作品を読み込めませんでした。"));
};
});
}

async function deleteArtworkFromDatabase(id) {
const database = await openCollectionDatabase();

return new Promise((resolve, reject) => {
const transaction = database.transaction(
COLLECTION_STORE_NAME,
"readwrite"
);

const store = transaction.objectStore(
COLLECTION_STORE_NAME
);

store.delete(id);

transaction.oncomplete = () => {
database.close();
resolve();
};

transaction.onerror = () => {
const error = transaction.error;
database.close();
reject(
error ||
new Error(
"作品を削除できませんでした。"
)
);
};

transaction.onabort = () => {
const error = transaction.error;
database.close();
reject(
error ||
new Error(
"作品の削除が中断されました。"
)
);
};
});
}

async function loadArtworksFromDatabase() {
const records = await getAllArtworkRecordsFromDatabase();

return records.map((record) => ({
id: record.id,
title: record.title,
author: record.author,
authorUrl: record.authorUrl || "",
createdAt: record.createdAt || "",
type: record.type,
symbol: record.symbol,
sourceFileName: record.sourceFileName,
sourceUrl: record.sourceBlob
? URL.createObjectURL(record.sourceBlob)
: null,
thumbnailUrl:
record.thumbnailBlob
? URL.createObjectURL(
record.thumbnailBlob
)
: null,
playback:
record.playback || null,
camera:
record.camera || {
yaw: 0,
pitch: 0,
fov: 75
}
}));
}



const ZIP_MAX_ENTRIES = 32;
const ZIP_MAX_MANIFEST_BYTES = 1024 * 1024;
const ZIP_MAX_ARTWORK_BYTES = 1024 * 1024 * 1024;

async function parseGururiArtZip(file) {
const bytes = new Uint8Array(await file.arrayBuffer());
const view = new DataView(bytes.buffer);
const decoder = new TextDecoder("utf-8", {fatal: true});

if (bytes.length < 22) throw new Error("ZIPファイルが破損しています。");

let endPosition = -1;
for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) {
endPosition = i;
break;
}
}
if (endPosition < 0) throw new Error("ZIPのファイル一覧を読み取れませんでした。");
if (view.getUint16(endPosition + 4, true) !== 0 || view.getUint16(endPosition + 6, true) !== 0) {
throw new Error("分割ZIPには対応していません。");
}
const count = view.getUint16(endPosition + 10, true);
const directorySize = view.getUint32(endPosition + 12, true);
const directoryOffset = view.getUint32(endPosition + 16, true);
if (count < 2 || count > ZIP_MAX_ENTRIES || directoryOffset + directorySize > endPosition) {
throw new Error("ZIPの構造が正しくありません。");
}

const entries = new Map();
let position = directoryOffset;
for (let i = 0; i < count; i++) {
if (position + 46 > bytes.length || view.getUint32(position, true) !== 0x02014b50) {
throw new Error("ZIPのファイル一覧が破損しています。");
}
const flags = view.getUint16(position + 8, true);
const method = view.getUint16(position + 10, true);
const crc = view.getUint32(position + 16, true);
const compressedSize = view.getUint32(position + 20, true);
const plainSize = view.getUint32(position + 24, true);
const nameLength = view.getUint16(position + 28, true);
const extraLength = view.getUint16(position + 30, true);
const commentLength = view.getUint16(position + 32, true);
const localOffset = view.getUint32(position + 42, true);
const next = position + 46 + nameLength + extraLength + commentLength;
if (next > directoryOffset + directorySize || (flags & 1) !== 0 || method !== 0 || compressedSize !== plainSize || plainSize > ZIP_MAX_ARTWORK_BYTES) {
throw new Error("このZIP形式には対応していません。ぐるりペイントから書き出したZIPを選択してください。");
}
const name = decoder.decode(bytes.subarray(position + 46, position + 46 + nameLength));
if (!/^(manifest\.json|artwork\.(png|mp4)|thumbnail\.png)$/.test(name) || entries.has(name)) {
throw new Error("ぐるり作品ZIPに対応していないファイルが含まれています。");
}
if (localOffset + 30 > directoryOffset || view.getUint32(localOffset, true) !== 0x04034b50) {
throw new Error("ZIPのデータが破損しています。");
}
const localFlags = view.getUint16(localOffset + 6, true);
const localMethod = view.getUint16(localOffset + 8, true);
const localNameLength = view.getUint16(localOffset + 26, true);
const localExtraLength = view.getUint16(localOffset + 28, true);
const dataStart = localOffset + 30 + localNameLength + localExtraLength;
const localName = decoder.decode(bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength));
if (localName !== name || localFlags !== flags || localMethod !== method || dataStart + compressedSize > directoryOffset) {
throw new Error("ZIP内のファイル情報が一致しません。");
}
entries.set(name, {start: dataStart, size: plainSize, crc});
position = next;
}
if (position !== directoryOffset + directorySize) throw new Error("ZIPのファイル一覧に不整合があります。");

function readEntry(name, maxSize, mimeType) {
const entry = entries.get(name);
if (!entry || entry.size > maxSize) throw new Error(`${name} が見つからないか、サイズが大きすぎます。`);
const content = bytes.subarray(entry.start, entry.start + entry.size);
let checksum = 0xffffffff;
for (const byte of content) {
checksum ^= byte;
for (let i = 0; i < 8; i++) checksum = (checksum >>> 1) ^ ((checksum & 1) ? 0xedb88320 : 0);
}
if (((checksum ^ 0xffffffff) >>> 0) !== entry.crc) throw new Error(`${name} が破損しています。`);
return new Blob([content], {type: mimeType});
}

let manifest;
try {
manifest = JSON.parse(await readEntry("manifest.json", ZIP_MAX_MANIFEST_BYTES, "application/json").text());
} catch (error) {
throw new Error(`作品情報を読み取れませんでした: ${error.message}`);
}
if (!manifest || manifest.format !== "gururi-art" || manifest.formatVersion !== 2 ||
manifest.exporter?.app !== "gururi-paint" || !["image", "video"].includes(manifest.type)) {
throw new Error("対応するぐるりペイントの作品ZIPではありません。");
}
const artworkName = manifest.type === "video" ? "artwork.mp4" : "artwork.png";
const artworkType = manifest.type === "video" ? "video/mp4" : "image/png";
if (manifest.assets?.artwork?.path !== artworkName || manifest.assets?.thumbnail?.path !== "thumbnail.png" ||
entries.has(manifest.type === "video" ? "artwork.png" : "artwork.mp4")) {
throw new Error("作品情報とZIPの内容が一致しません。");
}
if (!manifest.initialView || ![manifest.initialView.yaw, manifest.initialView.pitch, manifest.initialView.fov].every(Number.isFinite)) {
throw new Error("初期視点情報が正しくありません。");
}
const sourceBlob = readEntry(artworkName, ZIP_MAX_ARTWORK_BYTES, artworkType);
const thumbnailBlob = readEntry("thumbnail.png", 32 * 1024 * 1024, "image/png");
return {manifest, sourceBlob, thumbnailBlob};
}

function blobToDataUrl(blob) {
return new Promise((resolve, reject) => {
const reader = new FileReader();

reader.onload = () => {
resolve(reader.result);
};

reader.onerror = () => {
reject(reader.error || new Error("作品データを読み込めませんでした。"));
};

reader.readAsDataURL(blob);
});
}

async function dataUrlToBlob(dataUrl) {
const response = await fetch(dataUrl);
return response.blob();
}

async function createCollectionBackup() {
const records = await getAllArtworkRecordsFromDatabase();
const artworks = [];
for (const record of records) {
if (!(record.zipBlob instanceof Blob) || !record.zipBlob.size) continue;
artworks.push({
id: record.id,
zipData: await blobToDataUrl(record.zipBlob)
});
}
return {
format: "gururi-collection",
version: 3,
createdAt: new Date().toISOString(),
artworks
};
}

async function downloadCollectionBackup() {
try {
const backup = await createCollectionBackup();

const json = JSON.stringify(backup);
const blob = new Blob([json], {
type: "application/json"
});

const url = URL.createObjectURL(blob);
const link = document.createElement("a");

const now = new Date();
const date = [
now.getFullYear(),
String(now.getMonth() + 1).padStart(2, "0"),
String(now.getDate()).padStart(2, "0")
].join("-");

link.href = url;
link.download = `gururi-collection-${date}.gururicollection`;

document.body.append(link);
link.click();
link.remove();

URL.revokeObjectURL(url);
} catch (error) {
console.error(error);

window.alert(
"バックアップを作成できませんでした。"
);
}
}

async function restoreCollectionBackup(file) {
const backup = JSON.parse(await file.text());
if (!backup || backup.format !== "gururi-collection" || backup.version !== 3 || !Array.isArray(backup.artworks)) {
throw new Error("対応するぐるりコレクションのバックアップではありません。");
}
// すべての作品を先に検証し、途中で失敗した場合には保存済み作品を変更しない。
const restored = [];
for (const item of backup.artworks) {
if (typeof item.zipData !== "string") throw new Error("バックアップ内の作品データがありません。");
const zipBlob = await dataUrlToBlob(item.zipData);
const parsed = await parseGururiArtZip(zipBlob);
const manifest = parsed.manifest;
restored.push({
work: {
id: item.id || manifest.id || crypto.randomUUID(),
title: manifest.title || "無題",
author: manifest.author || "作者未設定",
authorUrl: manifest.authorUrl || "",
createdAt: manifest.createdAt || "",
type: manifest.type === "video" ? "animation" : "illustration",
symbol: "◎",
sourceFileName: `${manifest.title || "artwork"}.zip`,
thumbnailBlob: parsed.thumbnailBlob,
playback: manifest.playback || null,
camera: manifest.initialView
},
sourceBlob: parsed.sourceBlob,
zipBlob
});
}
for (const entry of restored) {
await saveArtworkToDatabase(entry.work, entry.sourceBlob, entry.zipBlob);
}
state.works.forEach((work) => {
if (work.sourceUrl) URL.revokeObjectURL(work.sourceUrl);
if (work.thumbnailUrl) URL.revokeObjectURL(work.thumbnailUrl);
});
state.works = await loadArtworksFromDatabase();
renderLibrary();
}

class PanoramaViewer {
constructor(canvas) {
this.canvas = canvas;
this.gl = canvas.getContext("webgl", {
antialias: true,
alpha: false,
powerPreference: "high-performance"
});

this.program = null;
this.texture = null;
this.yaw = 0;
this.pitch = 0;
this.fov = 75;
this.pointers = new Map();
this.lastSinglePointer = null;
this.lastPinchDistance = null;
this.animationFrame = null;
this.needsRender = false;
this.video = null;
this.videoAnimationFrame = null;

if (!this.gl) {
throw new Error("WebGLを利用できません。");
}

this.initWebGL();
this.bindEvents();
this.resize();
}

initWebGL() {
const gl = this.gl;

const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
v_uv = a_position * 0.5 + 0.5;
gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

varying vec2 v_uv;

uniform sampler2D u_texture;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_fov;
uniform float u_aspect;

const float PI = 3.1415926535897932384626433832795;

void main() {
float fovRadians = radians(u_fov);
float scale = tan(fovRadians * 0.5);

vec2 screen = v_uv * 2.0 - 1.0;
screen.x *= u_aspect;

vec3 direction = normalize(vec3(
screen.x * scale,
screen.y * scale,
1.0
));

float cosPitch = cos(u_pitch);
float sinPitch = sin(u_pitch);

direction = vec3(
direction.x,
direction.y * cosPitch + direction.z * sinPitch,
-direction.y * sinPitch + direction.z * cosPitch
);

float cosYaw = cos(u_yaw);
float sinYaw = sin(u_yaw);

direction = vec3(
direction.x * cosYaw + direction.z * sinYaw,
direction.y,
-direction.x * sinYaw + direction.z * cosYaw
);

float longitude = atan(direction.x, direction.z);
float latitude = asin(clamp(direction.y, -1.0, 1.0));

vec2 panoramaUv = vec2(
0.25 + longitude / (2.0 * PI),
0.5 + latitude / PI
);

gl_FragColor = texture2D(u_texture, panoramaUv);
}
`;

const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
const message = gl.getProgramInfoLog(program);
gl.deleteProgram(program);
throw new Error(message || "Viewerの初期化に失敗しました。");
}

gl.deleteShader(vertexShader);
gl.deleteShader(fragmentShader);

this.program = program;

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
gl.ARRAY_BUFFER,
new Float32Array([
-1, -1,
1, -1,
-1, 1,
-1, 1,
1, -1,
1, 1
]),
gl.STATIC_DRAW
);

const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

this.uniforms = {
texture: gl.getUniformLocation(program, "u_texture"),
yaw: gl.getUniformLocation(program, "u_yaw"),
pitch: gl.getUniformLocation(program, "u_pitch"),
fov: gl.getUniformLocation(program, "u_fov"),
aspect: gl.getUniformLocation(program, "u_aspect")
};

this.texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, this.texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

gl.useProgram(program);
gl.uniform1i(this.uniforms.texture, 0);
}

createShader(type, source) {
const gl = this.gl;
const shader = gl.createShader(type);
gl.shaderSource(shader, source);
gl.compileShader(shader);

if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
const message = gl.getShaderInfoLog(shader);
gl.deleteShader(shader);
throw new Error(message || "Viewerのシェーダーを作成できませんでした。");
}

return shader;
}

bindEvents() {
this.canvas.addEventListener("pointerdown", (event) => {
this.canvas.setPointerCapture(event.pointerId);

this.pointers.set(event.pointerId, {
x: event.clientX,
y: event.clientY
});

if (this.pointers.size === 1) {
this.lastSinglePointer = {
x: event.clientX,
y: event.clientY
};
}

if (this.pointers.size === 2) {
this.lastPinchDistance = this.getPinchDistance();
}
});

this.canvas.addEventListener("pointermove", (event) => {
if (!this.pointers.has(event.pointerId)) return;

const previous = this.pointers.get(event.pointerId);

this.pointers.set(event.pointerId, {
x: event.clientX,
y: event.clientY
});

if (this.pointers.size === 1 && this.lastSinglePointer) {
const dx = event.clientX - previous.x;
const dy = event.clientY - previous.y;

const sensitivity = (this.fov / 75) * 0.0025;

this.yaw -= dx * sensitivity;
this.pitch += dy * sensitivity;

this.pitch = Math.max(
-Math.PI / 2 + 0.01,
Math.min(Math.PI / 2 - 0.01, this.pitch)
);

this.requestRender();
}

if (this.pointers.size === 2) {
const distance = this.getPinchDistance();

if (this.lastPinchDistance !== null && distance > 0) {
const ratio = this.lastPinchDistance / distance;
this.fov *= ratio;
this.fov = Math.max(20, Math.min(120, this.fov));
this.requestRender();
}

this.lastPinchDistance = distance;
}
});

const releasePointer = (event) => {
this.pointers.delete(event.pointerId);

if (this.pointers.size === 1) {
const remaining = [...this.pointers.values()][0];
this.lastSinglePointer = {
x: remaining.x,
y: remaining.y
};
} else {
this.lastSinglePointer = null;
}

this.lastPinchDistance = null;
};

this.canvas.addEventListener("pointerup", releasePointer);
this.canvas.addEventListener("pointercancel", releasePointer);

this.canvas.addEventListener("wheel", (event) => {
event.preventDefault();

this.fov += event.deltaY * 0.04;
this.fov = Math.max(20, Math.min(120, this.fov));

this.requestRender();
}, { passive: false });

window.addEventListener("resize", () => {
this.resize();
});
}

getPinchDistance() {
const points = [...this.pointers.values()];

if (points.length < 2) return 0;

const dx = points[0].x - points[1].x;
const dy = points[0].y - points[1].y;

return Math.hypot(dx, dy);
}

resize() {
const width = Math.max(1, this.canvas.clientWidth);
const height = Math.max(1, this.canvas.clientHeight);
const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

const renderWidth = Math.round(width * pixelRatio);
const renderHeight = Math.round(height * pixelRatio);

if (
this.canvas.width !== renderWidth ||
this.canvas.height !== renderHeight
) {
this.canvas.width = renderWidth;
this.canvas.height = renderHeight;
}

this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
this.requestRender();
}

resetView(camera = null) {
this.yaw = camera && Number.isFinite(camera.yaw)
? camera.yaw
: 0;

this.pitch = camera && Number.isFinite(camera.pitch)
? camera.pitch
: 0;

this.fov = camera && Number.isFinite(camera.fov)
? Math.max(20, Math.min(120, camera.fov))
: 75;

this.requestRender();
}

load(sourceUrl, camera = null) {
this.stopVideo();

return new Promise((resolve, reject) => {
const image = new Image();

image.onload = () => {
const gl = this.gl;

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, this.texture);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
gl.texImage2D(
gl.TEXTURE_2D,
0,
gl.RGBA,
gl.RGBA,
gl.UNSIGNED_BYTE,
image
);

this.resetView(camera);
this.resize();
resolve();
};

image.onerror = () => {
reject(new Error("画像を読み込めませんでした。"));
};

image.src = sourceUrl;
});
}

stopVideo() {
if (
this.videoAnimationFrame !==
null
) {
cancelAnimationFrame(
this.videoAnimationFrame
);

this.videoAnimationFrame =
null;
}

if (!this.video) {
return;
}

this.video.pause();
this.video.removeAttribute(
"src"
);
this.video.load();

this.video =
null;
}

updateVideoTexture() {
if (
!this.video ||
this.video.readyState < 2
) {
return;
}

const gl =
this.gl;

gl.activeTexture(
gl.TEXTURE0
);

gl.bindTexture(
gl.TEXTURE_2D,
this.texture
);

gl.pixelStorei(
gl.UNPACK_FLIP_Y_WEBGL,
true
);

gl.texImage2D(
gl.TEXTURE_2D,
0,
gl.RGBA,
gl.RGBA,
gl.UNSIGNED_BYTE,
this.video
);

this.render();
}

startVideoRenderLoop() {
if (
this.videoAnimationFrame !==
null
) {
return;
}

const updateFrame = () => {
this.videoAnimationFrame =
null;

if (!this.video) {
return;
}

this.updateVideoTexture();

if (
!this.video.paused &&
!this.video.ended
) {
this.videoAnimationFrame =
requestAnimationFrame(
updateFrame
);
}
};

this.videoAnimationFrame =
requestAnimationFrame(
updateFrame
);
}

loadVideo(
sourceUrl,
camera = null,
playback = null
) {
this.stopVideo();

return new Promise(
(resolve, reject) => {
const video =
document.createElement(
"video"
);

this.video =
video;

video.preload =
"auto";

video.muted =
true;

video.defaultMuted =
true;

video.playsInline =
true;

video.loop =
Boolean(
playback &&
playback.loop
);

video.addEventListener(
"loadeddata",
() => {

if (
this.video !== video
) {
return;
}

this.resetView(
camera
);

this.resize();

this.updateVideoTexture();

resolve();
},
{
once: true
}
);

video.addEventListener(
"play",
() => {

if (
this.video === video
) {

this.startVideoRenderLoop();

updateViewerPlaybackUi();
}
}
);

video.addEventListener(
"pause",
() => {

if (
this.video === video
) {

updateViewerPlaybackUi();
}
}
);

video.addEventListener(
"ended",
() => {

if (
this.video === video
) {

this.updateVideoTexture();

updateViewerPlaybackUi();
}
}
);

video.addEventListener(
"seeked",
() => {

if (
this.video === video
) {

this.updateVideoTexture();
}
}
);

video.addEventListener(
"error",
() => {
if (
this.video === video
) {
reject(
new Error(
"動画を読み込めませんでした。"
)
);
}
},
{
once: true
}
);

video.src =
sourceUrl;

video.load();
}
);
}

requestRender() {
if (this.needsRender) return;

this.needsRender = true;

this.animationFrame = requestAnimationFrame(() => {
this.needsRender = false;
this.render();
});
}

render() {
const gl = this.gl;

if (!this.program) return;

gl.useProgram(this.program);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, this.texture);

gl.uniform1f(this.uniforms.yaw, this.yaw);
gl.uniform1f(this.uniforms.pitch, this.pitch);
gl.uniform1f(this.uniforms.fov, this.fov);
gl.uniform1f(
this.uniforms.aspect,
this.canvas.width / Math.max(1, this.canvas.height)
);

gl.drawArrays(gl.TRIANGLES, 0, 6);
}
}

let panoramaViewer = null;

function getPanoramaViewer() {
if (!panoramaViewer) {
panoramaViewer = new PanoramaViewer(els.viewerCanvas);
}

return panoramaViewer;
}

function showViewerMessage(title, text) {
els.viewerMessageTitle.textContent = title;
els.viewerMessageText.textContent = text;
els.viewerMessage.hidden = false;
}

function hideViewerMessage() {
els.viewerMessage.hidden = true;
}

let viewerCurrentWork =
null;


function updateViewerPlaybackUi() {

const video =
panoramaViewer &&
panoramaViewer.video
? panoramaViewer.video
: null;

const isAnimation =
viewerCurrentWork &&
viewerCurrentWork.type ===
"animation";

const showPlayButton =
Boolean(
isAnimation &&
video &&
(
video.paused ||
video.ended
)
);

els.viewerPlayButton.hidden =
!showPlayButton;
}


async function toggleViewerVideoPlayback() {

if (
!viewerCurrentWork ||
viewerCurrentWork.type !==
"animation"
) {
return;
}

const video =
panoramaViewer &&
panoramaViewer.video
? panoramaViewer.video
: null;

if (!video) {
return;
}

if (
!video.paused &&
!video.ended
) {

video.pause();

return;
}

if (video.ended) {

video.currentTime =
0;
}

try {

await video.play();

} catch (error) {

console.error(
"Video playback failed.",
error
);
}

updateViewerPlaybackUi();
}

function renderRecommended() {
els.recommendedTrack.innerHTML = "";

recommendedWorks.forEach((work) => {
const article = document.createElement("article");
article.className = "recommended-card";

const visual = document.createElement("div");
visual.className = "card-visual";
visual.textContent = work.symbol;

const body = document.createElement("div");
body.className = "card-body";

const type = document.createElement("span");
type.className = "card-type";
type.textContent = typeLabel(work.type);

const title = document.createElement("h3");
title.className = "card-title";
title.textContent = work.title;

const author = document.createElement("p");
author.className = "card-author";
author.textContent = work.author;

const link = document.createElement("a");
link.className = "card-action";
link.href = work.productUrl;
link.target = "_blank";
link.rel = "noopener noreferrer";
link.textContent = "BOOTHで見る";

body.append(type, title, author, link);
article.append(visual, body);
els.recommendedTrack.append(article);
});
}

function getVisibleWorks() {
const query = state.query.trim().toLowerCase();

return state.works.filter((work) => {
const categoryMatch = state.category === "all" || work.type === state.category;
const text = `${work.title} ${work.author}`.toLowerCase();
const queryMatch = !query || text.includes(query);
return categoryMatch && queryMatch;
});
}

async function removeWorkFromCollection(work) {
const confirmed = window.confirm(
`「${work.title}」をコレクションから削除しますか？\n\n元のZIPファイルは削除されません。`
);

if (!confirmed) {
return;
}

try {
await deleteArtworkFromDatabase(
work.id
);

if (work.sourceUrl) {
URL.revokeObjectURL(
work.sourceUrl
);
}

if (work.thumbnailUrl) {
URL.revokeObjectURL(
work.thumbnailUrl
);
}

state.works =
state.works.filter(
(item) =>
item.id !== work.id
);

renderLibrary();
} catch (error) {
console.error(error);

window.alert(
error.message ||
"作品を削除できませんでした。"
);
}
}

function renderLibrary() {
const visible = getVisibleWorks();
els.artworkGrid.innerHTML = "";

els.libraryCount.textContent = `${state.works.length}作品`;

if (visible.length === 0) {
els.artworkGrid.hidden = true;
els.emptyState.hidden = false;

if (state.works.length > 0) {
els.emptyState.querySelector("h3").textContent = "該当する作品がありません";
els.emptyState.querySelector("p").textContent = "カテゴリーまたは検索条件を変更してください。";
els.emptyAddButton.hidden = true;
} else {
els.emptyState.querySelector("h3").textContent = "まだ作品がありません";
els.emptyState.querySelector("p").textContent = "「作品を追加」から、ぐるり作品をコレクションに加えられます。";
els.emptyAddButton.hidden = false;
}
return;
}

els.emptyState.hidden = true;
els.artworkGrid.hidden = false;

visible.forEach((work) => {
const article = document.createElement("article");
article.className = "artwork-card";

const button = document.createElement("button");
button.type = "button";
button.className = "artwork-card-open";
button.setAttribute(
"aria-label",
`${work.title}を開く`
);

const visual = document.createElement("div");
visual.className = "card-visual";

if (work.thumbnailUrl) {
const thumbnail =
document.createElement("img");

thumbnail.src =
work.thumbnailUrl;

thumbnail.alt = "";

visual.append(
thumbnail
);
} else {
visual.textContent =
work.symbol || "◎";
}

const body = document.createElement("div");
body.className = "card-body";

const type = document.createElement("span");
type.className = "card-type";
type.textContent =
typeLabel(work.type);

const title = document.createElement("h3");
title.className = "card-title";
title.textContent = work.title;

const author = document.createElement("p");
author.className = "card-author";
author.textContent = work.author;

body.append(
type,
title,
author
);

button.append(
visual,
body
);

button.addEventListener(
"click",
() => openViewer(work)
);

const menuButton =
document.createElement("button");

menuButton.type = "button";
menuButton.className =
"artwork-menu-button";

menuButton.textContent = "…";

menuButton.setAttribute(
"aria-label",
`${work.title}のメニュー`
);

menuButton.setAttribute(
"aria-expanded",
"false"
);

const menu =
document.createElement("div");

menu.className =
"artwork-menu";

menu.hidden = true;

const deleteButton =
document.createElement("button");

deleteButton.type = "button";

deleteButton.className =
"artwork-delete-button";

deleteButton.textContent =
"コレクションから削除";

menuButton.addEventListener(
"click",
(event) => {
event.stopPropagation();

const willOpen =
menu.hidden;

document
.querySelectorAll(
".artwork-menu"
)
.forEach(
(otherMenu) => {
otherMenu.hidden = true;
}
);

document
.querySelectorAll(
".artwork-menu-button"
)
.forEach(
(otherButton) => {
otherButton.setAttribute(
"aria-expanded",
"false"
);
}
);

menu.hidden =
!willOpen;

menuButton.setAttribute(
"aria-expanded",
willOpen
? "true"
: "false"
);
}
);

deleteButton.addEventListener(
"click",
async (event) => {
event.stopPropagation();

menu.hidden = true;

menuButton.setAttribute(
"aria-expanded",
"false"
);

await removeWorkFromCollection(
work
);
}
);

menu.append(
deleteButton
);

article.append(
button,
menuButton,
menu
);

els.artworkGrid.append(
article
);
});
}

async function openViewer(work) {

viewerCurrentWork =
work;

els.viewerTitle.textContent =
work.title;

els.viewerAuthor.textContent =
work.author;

els.viewerPlayButton.hidden =
true;

els.viewerCanvas.style.visibility =
"hidden";

els.viewerLayer.hidden =
false;

document.body.style.overflow =
"hidden";

const isVideoWork =
work.type ===
"animation";

showViewerMessage(
"作品を読み込んでいます",
"しばらくお待ちください"
);

if (!work.sourceUrl) {
showViewerMessage(
"この作品はまだ表示できません",
"作品データを読み込めませんでした"
);
return;
}

try {
const viewer =
getPanoramaViewer();

viewer.resize();

if (isVideoWork) {

await viewer.loadVideo(
work.sourceUrl,
work.camera || null,
work.playback || null
);

} else {

await viewer.load(
work.sourceUrl,
work.camera || null
);
}

els.viewerCanvas.style.visibility =
"visible";

hideViewerMessage();

updateViewerPlaybackUi();
} catch (error) {
console.error(error);

showViewerMessage(
"作品を表示できませんでした",
error.message ||
"作品の読み込み中にエラーが発生しました"
);
}
}

function closeViewer() {

if (panoramaViewer) {

panoramaViewer.stopVideo();
}

viewerCurrentWork =
null;

viewerTapPointerId =
null;

viewerTapMoved =
false;

els.viewerPlayButton.hidden =
true;

els.viewerCanvas.style.visibility =
"hidden";

els.viewerLayer.hidden =
true;

document.body.style.overflow =
"";
}

function openFilePicker() {
els.fileInput.click();
}

async function addTemporaryWorkFromFile(file) {
if (!file.name.toLowerCase().endsWith(".zip")) {
window.alert("ぐるりペイントの作品ZIP（.zip）を選択してください。");
return;
}
try {
const parsed = await parseGururiArtZip(file);
const manifest = parsed.manifest;
const work = {
id: crypto.randomUUID(),
title: manifest.title || file.name.replace(/\.[^.]+$/, ""),
author: manifest.author || "作者未設定",
authorUrl: manifest.authorUrl || "",
createdAt: manifest.createdAt || "",
type: manifest.type === "video" ? "animation" : "illustration",
symbol: "◎",
sourceFileName: file.name,
sourceUrl: URL.createObjectURL(parsed.sourceBlob),
thumbnailUrl: URL.createObjectURL(parsed.thumbnailBlob),
thumbnailBlob: parsed.thumbnailBlob,
playback: manifest.playback || null,
camera: manifest.initialView
};
try {
await saveArtworkToDatabase(work, parsed.sourceBlob, file);
} catch (error) {
URL.revokeObjectURL(work.sourceUrl);
URL.revokeObjectURL(work.thumbnailUrl);
throw error;
}
const existingIndex = state.works.findIndex((item) => item.id === work.id);
if (existingIndex >= 0) {
const previous = state.works[existingIndex];
if (previous.sourceUrl) URL.revokeObjectURL(previous.sourceUrl);
if (previous.thumbnailUrl) URL.revokeObjectURL(previous.thumbnailUrl);
state.works[existingIndex] = work;
} else {
state.works.push(work);
}
renderLibrary();
} catch (error) {
console.error(error);
window.alert(error.message || "作品ZIPを読み込めませんでした。");
}
}

els.addButton.addEventListener("click", openFilePicker);
els.emptyAddButton.addEventListener("click", openFilePicker);

els.backupButton.addEventListener("click", async () => {
await downloadCollectionBackup();
});

els.restoreButton.addEventListener("click", () => {
els.restoreFileInput.click();
});

els.restoreFileInput.addEventListener("change", async (event) => {
const [file] = event.target.files;
if (!file) return;

try {
await restoreCollectionBackup(file);

window.alert(
"コレクションを復元しました。"
);
} catch (error) {
console.error(error);

window.alert(
error.message || "バックアップを復元できませんでした。"
);
}

event.target.value = "";
});

els.fileInput.addEventListener("change", async (event) => {
const [file] = event.target.files;
if (!file) return;

await addTemporaryWorkFromFile(file);
event.target.value = "";
});

els.categoryTabs.forEach((tab) => {
tab.addEventListener("click", () => {
state.category = tab.dataset.category;

els.categoryTabs.forEach((item) => {
const active = item === tab;
item.classList.toggle("is-active", active);
item.setAttribute("aria-selected", active ? "true" : "false");
});

renderLibrary();
});
});

els.searchInput.addEventListener("input", () => {
state.query = els.searchInput.value;
renderLibrary();
});

els.recommendedPrev.addEventListener("click", () => {
els.recommendedTrack.scrollBy({ left: -300, behavior: "smooth" });
});

els.recommendedNext.addEventListener("click", () => {
els.recommendedTrack.scrollBy({ left: 300, behavior: "smooth" });
});

let viewerTapPointerId =
null;

let viewerTapStartX =
0;

let viewerTapStartY =
0;

let viewerTapMoved =
false;


els.viewerCanvas.addEventListener(
"pointerdown",
(event) => {

if (
viewerTapPointerId !==
null
) {

viewerTapMoved =
true;

return;
}

viewerTapPointerId =
event.pointerId;

viewerTapStartX =
event.clientX;

viewerTapStartY =
event.clientY;

viewerTapMoved =
false;
}
);


els.viewerCanvas.addEventListener(
"pointermove",
(event) => {

if (
event.pointerId !==
viewerTapPointerId
) {
return;
}

const distance =
Math.hypot(
event.clientX -
viewerTapStartX,
event.clientY -
viewerTapStartY
);

if (distance > 8) {

viewerTapMoved =
true;
}
}
);


els.viewerCanvas.addEventListener(
"pointerup",
(event) => {

if (
event.pointerId !==
viewerTapPointerId
) {
return;
}

const shouldToggle =
!viewerTapMoved;

viewerTapPointerId =
null;

viewerTapMoved =
false;

if (shouldToggle) {

toggleViewerVideoPlayback();
}
}
);


els.viewerCanvas.addEventListener(
"pointercancel",
(event) => {

if (
event.pointerId ===
viewerTapPointerId
) {

viewerTapPointerId =
null;

viewerTapMoved =
false;
}
}
);


els.viewerPlayButton.addEventListener(
"click",
() => {

toggleViewerVideoPlayback();
}
);


els.viewerBack.addEventListener(
"click",
closeViewer
);

document.addEventListener(
"keydown",
(event) => {

if (
event.key === "Escape" &&
!els.viewerLayer.hidden
) {

closeViewer();

return;
}


if (
event.code === "Space" &&
!els.viewerLayer.hidden
) {

event.preventDefault();

if (event.repeat) {
return;
}

toggleViewerVideoPlayback();
}
}
);

async function initializeApp() {
renderRecommended();

try {
state.works = await loadArtworksFromDatabase();
} catch (error) {
console.error(error);
state.works = [];

window.alert(
"保存済みのコレクションを読み込めませんでした。"
);
}

renderLibrary();
}

const privacyButton = document.querySelector("#privacy-button");
const privacyModal = document.querySelector("#privacy-modal");
const privacyModalClose = document.querySelector("#privacy-modal-close");
let privacyPreviousFocus = null;

function openPrivacyModal() {
privacyPreviousFocus = document.activeElement;
privacyModal.hidden = false;
document.body.classList.add("privacy-modal-open");
privacyModalClose.focus();
}

function closePrivacyModal() {
privacyModal.hidden = true;
document.body.classList.remove("privacy-modal-open");
if (privacyPreviousFocus && typeof privacyPreviousFocus.focus === "function") {
privacyPreviousFocus.focus();
}
}

privacyButton.addEventListener("click", openPrivacyModal);
privacyModalClose.addEventListener("click", closePrivacyModal);

privacyModal.addEventListener("click", (event) => {
if (event.target === privacyModal) {
closePrivacyModal();
}
});

document.addEventListener("keydown", (event) => {
if (privacyModal.hidden) return;
if (event.key === "Escape") {
event.preventDefault();
closePrivacyModal();
return;
}
if (event.key === "Tab") {
const controls = [privacyModalClose];
const first = controls[0];
const last = controls[controls.length - 1];
if (event.shiftKey && document.activeElement === first) {
event.preventDefault();
last.focus();
} else if (!event.shiftKey && document.activeElement === last) {
event.preventDefault();
first.focus();
}
}
});

const PASSWORD_STORAGE_KEY = "gururi-collection-password-v1";
const passwordOverlay = document.querySelector("#password-overlay");
const passwordUnlockForm = document.querySelector("#password-unlock-form");
const passwordUnlockInput = document.querySelector("#password-unlock-input");
const passwordUnlockMessage = document.querySelector("#password-unlock-message");
const passwordSettingsOverlay = document.querySelector("#password-settings-overlay");
const passwordSettingsButton = document.querySelector("#password-settings-button");
const passwordSettingsForm = document.querySelector("#password-settings-form");
const passwordSettingsTitle = document.querySelector("#password-settings-title");
const passwordSettingsDescription = document.querySelector("#password-settings-description");
const passwordCurrentLabel = document.querySelector("#password-current-label");
const passwordCurrentInput = document.querySelector("#password-current-input");
const passwordNewLabel = document.querySelector("#password-new-label");
const passwordNewInput = document.querySelector("#password-new-input");
const passwordConfirmLabel = document.querySelector("#password-confirm-label");
const passwordConfirmInput = document.querySelector("#password-confirm-input");
const passwordSettingsMessage = document.querySelector("#password-settings-message");
const passwordSaveButton = document.querySelector("#password-save-button");
const passwordSettingsClose = document.querySelector("#password-settings-close");

let passwordRecord = null;
let passwordMode = "set";
let appInitialized = false;
let passwordBusy = false;

const COLLECTION_GUIDE_STORAGE_KEY = "gururi-collection-guide-completed-v1";
const collectionGuideOverlay = document.querySelector("#collection-guide-overlay");
const collectionGuidePages = [...document.querySelectorAll(".collection-guide-page")];
const collectionGuideCounter = document.querySelector("#collection-guide-counter");
const collectionGuideBack = document.querySelector("#collection-guide-back");
const collectionGuideNext = document.querySelector("#collection-guide-next");
const collectionGuideSetPassword = document.querySelector("#collection-guide-set-password");
const collectionGuideSkipPassword = document.querySelector("#collection-guide-skip-password");
const collectionGuideFinish = document.querySelector("#collection-guide-finish");
const collectionGuideButton = document.querySelector("#collection-guide-button");

let collectionGuidePage = 0;
let collectionGuideInitial = false;
let collectionGuideAwaitingPassword = false;

function renderCollectionGuide() {
collectionGuidePages.forEach((page, index) => {
page.hidden = index !== collectionGuidePage;
});
collectionGuideCounter.textContent = `${collectionGuidePage + 1} / 4`;
collectionGuideBack.hidden = collectionGuidePage === 0;
collectionGuideNext.hidden = collectionGuidePage === 3;

const isFinal = collectionGuidePage === 3;
collectionGuideSetPassword.hidden = !isFinal || Boolean(passwordRecord);
collectionGuideSkipPassword.hidden = !isFinal || Boolean(passwordRecord) || !collectionGuideInitial;
collectionGuideFinish.hidden = !isFinal || (collectionGuideInitial && !passwordRecord);
}

function showCollectionGuide(initial = false) {
collectionGuideInitial = initial;
collectionGuideAwaitingPassword = false;
collectionGuidePage = 0;
guideSiteDataContent.hidden = true;
guideSiteDataToggle.setAttribute("aria-expanded", "false");
renderCollectionGuide();
collectionGuideOverlay.hidden = false;
collectionGuideNext.focus();
}

async function completeCollectionGuide() {
const initial = collectionGuideInitial;
if (initial) {
localStorage.setItem(COLLECTION_GUIDE_STORAGE_KEY, "1");
}
collectionGuideAwaitingPassword = false;
collectionGuideInitial = false;
collectionGuideOverlay.hidden = true;
if (initial) {
await unlockCollection();
} else {
collectionGuideButton.focus();
}
}

collectionGuideBack.addEventListener("click", () => {
if (collectionGuidePage > 0) {
collectionGuidePage -= 1;
renderCollectionGuide();
}
});

collectionGuideNext.addEventListener("click", () => {
if (collectionGuidePage < 3) {
collectionGuidePage += 1;
renderCollectionGuide();
}
});

collectionGuideSkipPassword.addEventListener("click", () => {
completeCollectionGuide();
});

collectionGuideFinish.addEventListener("click", () => {
completeCollectionGuide();
});

collectionGuideSetPassword.addEventListener("click", () => {
collectionGuideAwaitingPassword = true;
collectionGuideOverlay.hidden = true;
openPasswordSettings("set");
});

collectionGuideButton.addEventListener("click", () => {
closeCollectionMenu();
showCollectionGuide(false);
});

const guideSiteDataToggle = document.querySelector("#guide-site-data-toggle");
const guideSiteDataContent = document.querySelector("#guide-site-data-content");

guideSiteDataToggle.addEventListener("click", () => {
const willOpen = guideSiteDataContent.hidden;
guideSiteDataContent.hidden = !willOpen;
guideSiteDataToggle.setAttribute("aria-expanded", String(willOpen));
});

function bytesToHex(bytes) {
return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) {
throw new Error("パスワード情報が破損しています。");
}
return new Uint8Array(hex.match(/.{2}/g).map(value => parseInt(value, 16)));
}

async function derivePassword(password, salt) {
const key = await crypto.subtle.importKey(
"raw",
new TextEncoder().encode(password),
"PBKDF2",
false,
["deriveBits"]
);
const bits = await crypto.subtle.deriveBits(
{
name: "PBKDF2",
salt,
iterations: 210000,
hash: "SHA-256"
},
key,
256
);
return bytesToHex(new Uint8Array(bits));
}

async function createPasswordRecord(password) {
const salt = crypto.getRandomValues(new Uint8Array(16));
return {
version: 1,
salt: bytesToHex(salt),
hash: await derivePassword(password, salt)
};
}

async function verifyPassword(password) {
if (!passwordRecord) return false;
const actual = await derivePassword(
password,
hexToBytes(passwordRecord.salt)
);
const expected = hexToBytes(passwordRecord.hash);
const actualBytes = hexToBytes(actual);
let difference = 0;
for (let i = 0; i < expected.length; i += 1) {
difference |= expected[i] ^ actualBytes[i];
}
return expected.length === actualBytes.length && difference === 0;
}

function savePasswordRecord(record) {
if (record) {
localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(record));
} else {
localStorage.removeItem(PASSWORD_STORAGE_KEY);
}
passwordRecord = record;
updatePasswordMenu();
}

async function unlockCollection() {
passwordOverlay.hidden = true;
passwordUnlockInput.value = "";
passwordUnlockMessage.textContent = "";

if (localStorage.getItem(COLLECTION_GUIDE_STORAGE_KEY) !== "1") {
if (collectionGuideOverlay.hidden) {
showCollectionGuide(true);
}
return;
}

document.body.classList.remove("lock-pending");

if (!appInitialized) {
appInitialized = true;
await initializeApp();
}
}

function lockCollection() {
if (!passwordRecord) return;
if (!els.viewerLayer.hidden) closeViewer();
passwordSettingsOverlay.hidden = true;
document.body.classList.add("lock-pending");
passwordOverlay.hidden = false;
passwordUnlockInput.value = "";
passwordUnlockMessage.textContent = "";
passwordUnlockInput.focus();
}

function openPasswordSettings(mode = "change") {
passwordMode = passwordRecord ? mode : "set";
passwordSettingsForm.reset();
passwordSettingsMessage.textContent = "";
passwordCurrentLabel.hidden = passwordMode === "set";
passwordNewLabel.hidden = passwordMode === "remove";
passwordConfirmLabel.hidden = passwordMode === "remove";
passwordSettingsTitle.textContent = passwordMode === "set"
? "パスワードを設定"
: passwordMode === "remove"
? "パスワードを解除"
: "パスワードを変更";
passwordSettingsDescription.textContent = passwordMode === "remove"
? "現在のパスワードを入力すると、次回からロックされなくなります。"
: "パスワードは8文字以上で設定してください。";
passwordSaveButton.textContent = passwordMode === "set"
? "設定する"
: passwordMode === "remove"
? "ロックを解除する"
: "変更する";
passwordSettingsOverlay.hidden = false;
(passwordMode === "set" ? passwordNewInput : passwordCurrentInput).focus();
}

const collectionMenuButton = document.querySelector("#collection-menu-button");
const collectionMenuPanel = document.querySelector("#collection-menu-panel");

function closeCollectionMenu() {
collectionMenuPanel.hidden = true;
collectionMenuButton.setAttribute("aria-expanded", "false");
collectionMenuButton.setAttribute("aria-label", "メニューを開く");
}

collectionMenuButton.addEventListener("click", event => {
event.stopPropagation();
const willOpen = collectionMenuPanel.hidden;
collectionMenuPanel.hidden = !willOpen;
collectionMenuButton.setAttribute("aria-expanded", String(willOpen));
collectionMenuButton.setAttribute("aria-label", willOpen ? "メニューを閉じる" : "メニューを開く");
});

document.addEventListener("click", event => {
if (!event.target.closest(".collection-menu")) {
closeCollectionMenu();
}
});

document.addEventListener("keydown", event => {
if (event.key === "Escape" && !collectionMenuPanel.hidden) {
closeCollectionMenu();
collectionMenuButton.focus();
}
});

const passwordChangeButton = document.querySelector("#password-change-button");
const passwordMenuRemoveButton = document.querySelector("#password-menu-remove-button");

function updatePasswordMenu() {
passwordSettingsButton.disabled = Boolean(passwordRecord);
passwordChangeButton.disabled = !passwordRecord;
passwordMenuRemoveButton.disabled = !passwordRecord;
}

passwordSettingsButton.addEventListener("click", () => {
closeCollectionMenu();
openPasswordSettings("set");
});

passwordChangeButton.addEventListener("click", () => {
closeCollectionMenu();
openPasswordSettings("change");
});

passwordMenuRemoveButton.addEventListener("click", () => {
closeCollectionMenu();
openPasswordSettings("remove");
});

updatePasswordMenu();

passwordSettingsClose.addEventListener("click", () => {
if (passwordBusy) return;
passwordSettingsOverlay.hidden = true;
if (collectionGuideAwaitingPassword) {
collectionGuideAwaitingPassword = false;
collectionGuideOverlay.hidden = false;
renderCollectionGuide();
collectionGuideSetPassword.focus();
}
});

passwordUnlockForm.addEventListener("submit", async event => {
event.preventDefault();
if (passwordBusy) return;
passwordBusy = true;
const button = passwordUnlockForm.querySelector("button");
button.disabled = true;
try {
const valid = await verifyPassword(passwordUnlockInput.value);
if (!valid) {
passwordUnlockMessage.textContent = "パスワードが正しくありません。";
passwordUnlockInput.value = "";
passwordUnlockInput.focus();
return;
}
await unlockCollection();
} catch (error) {
console.error(error);
passwordUnlockMessage.textContent = "認証できませんでした。";
} finally {
passwordBusy = false;
button.disabled = false;
}
});

passwordSettingsForm.addEventListener("submit", async event => {
event.preventDefault();
if (passwordBusy) return;
passwordBusy = true;
passwordSaveButton.disabled = true;
passwordSettingsMessage.textContent = "";

try {
if (passwordRecord) {
const valid = await verifyPassword(passwordCurrentInput.value);
if (!valid) {
passwordSettingsMessage.textContent = "現在のパスワードが正しくありません。";
return;
}
}

if (passwordMode === "remove") {
savePasswordRecord(null);
passwordSettingsOverlay.hidden = true;
return;
}

const newPassword = passwordNewInput.value;
if (newPassword.length < 8) {
passwordSettingsMessage.textContent = "8文字以上で入力してください。";
return;
}
if (newPassword !== passwordConfirmInput.value) {
passwordSettingsMessage.textContent = "確認用パスワードが一致しません。";
return;
}

const record = await createPasswordRecord(newPassword);
savePasswordRecord(record);
passwordSettingsOverlay.hidden = true;

if (collectionGuideAwaitingPassword) {
await completeCollectionGuide();
}
} catch (error) {
console.error(error);
passwordSettingsMessage.textContent = "設定を保存できませんでした。";
} finally {
passwordBusy = false;
passwordSaveButton.disabled = false;
}
});

async function startPasswordProtectedApp() {
try {
if (!window.isSecureContext || !crypto.subtle) {
throw new Error("安全な接続が必要です。");
}

const saved = localStorage.getItem(PASSWORD_STORAGE_KEY);
if (saved) {
const record = JSON.parse(saved);
if (
record.version !== 1 ||
typeof record.salt !== "string" ||
typeof record.hash !== "string" ||
record.salt.length !== 32 ||
record.hash.length !== 64
) {
throw new Error("保存済みのパスワード情報が正しくありません。");
}
hexToBytes(record.salt);
hexToBytes(record.hash);
passwordRecord = record;
updatePasswordMenu();
lockCollection();
} else {
await unlockCollection();
}
} catch (error) {
console.error(error);
passwordUnlockMessage.textContent =
"ロックの初期化に失敗しました。作品データは削除されていません。";
passwordUnlockInput.disabled = true;
}
}

setupPwa();
startPasswordProtectedApp();
