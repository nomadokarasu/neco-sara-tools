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
gartBlob = null
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
gartBlob,
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



const GURURI_ART_MAGIC = "GURURIART";
const GURURI_ART_FORMAT_VERSION = 1;

function readAscii(bytes, start, length) {
let result = "";

for (let i = start; i < start + length; i += 1) {
result += String.fromCharCode(bytes[i]);
}

return result;
}

function getGururiArtAssetBlob(file, asset, payloadStart) {
if (!asset) return null;

const offset = Number(asset.offset);
const length = Number(asset.length);

if (
!Number.isFinite(offset) ||
!Number.isFinite(length) ||
offset < 0 ||
length <= 0
) {
throw new Error("作品アセット情報が正しくありません。");
}

const start = payloadStart + offset;
const end = start + length;

if (end > file.size) {
throw new Error("作品ファイルのアセットが破損しています。");
}

return file.slice(
start,
end,
asset.mimeType || "application/octet-stream"
);
}

async function parseGururiArtFile(file) {
const buffer = await file.arrayBuffer();
const bytes = new Uint8Array(buffer);

const magicLength = GURURI_ART_MAGIC.length;

if (bytes.length < magicLength + 8) {
throw new Error("ぐるり作品ファイルが破損しています。");
}

const magic = readAscii(bytes, 0, magicLength);

if (magic !== GURURI_ART_MAGIC) {
throw new Error("ぐるり作品ファイルではありません。");
}

const view = new DataView(buffer);

const version = view.getUint32(
magicLength,
true
);

if (version !== GURURI_ART_FORMAT_VERSION) {
throw new Error(
`この作品のファイルバージョン ${version} にはまだ対応していません。`
);
}

const manifestLength = view.getUint32(
magicLength + 4,
true
);

const manifestStart = magicLength + 8;
const manifestEnd = manifestStart + manifestLength;

if (manifestEnd > bytes.length) {
throw new Error("作品情報が破損しています。");
}

const manifestBytes = bytes.slice(
manifestStart,
manifestEnd
);

const manifestText = new TextDecoder("utf-8").decode(
manifestBytes
);

let manifest;

try {
manifest = JSON.parse(manifestText);
} catch (error) {
throw new Error("作品情報を読み取れませんでした。");
}

if (
!manifest ||
manifest.format !== "gururi-art" ||
manifest.formatVersion !== 1
) {
throw new Error("対応していないぐるり作品形式です。");
}

if (
manifest.type !== "image" &&
manifest.type !== "video"
) {
throw new Error(
"この作品カテゴリーは現在のぐるりコレクションではまだ再生できません。"
);
}

if (!manifest.assets) {
throw new Error("作品データが含まれていません。");
}

const sourceAsset =
manifest.type === "video"
? (
manifest.assets.video ||
manifest.assets.artwork
)
: manifest.assets.artwork;

if (!sourceAsset) {
throw new Error(
manifest.type === "video"
? "作品動画が含まれていません。"
: "作品画像が含まれていません。"
);
}

const payloadStart = manifestEnd;

const sourceBlob =
getGururiArtAssetBlob(
file,
sourceAsset,
payloadStart
);

const thumbnailBlob =
manifest.assets.thumbnail
? getGururiArtAssetBlob(
file,
manifest.assets.thumbnail,
payloadStart
)
: null;

return {
manifest,
sourceBlob,
artworkBlob:
manifest.type === "image"
? sourceBlob
: null,
videoBlob:
manifest.type === "video"
? sourceBlob
: null,
thumbnailBlob
};
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
const hasGartBlob =
record.gartBlob instanceof Blob &&
record.gartBlob.size > 0;

artworks.push({
id: record.id,
title: record.title,
author: record.author,
authorUrl: record.authorUrl || "",
createdAt: record.createdAt || "",
type: record.type,
symbol: record.symbol,
sourceFileName: record.sourceFileName,
gartData: hasGartBlob
? await blobToDataUrl(record.gartBlob)
: null,
sourceData: !hasGartBlob && record.sourceBlob
? await blobToDataUrl(record.sourceBlob)
: null,
thumbnailData: !hasGartBlob && record.thumbnailBlob
? await blobToDataUrl(record.thumbnailBlob)
: null,
camera: record.camera || {
yaw: 0,
pitch: 0,
fov: 75
}
});
}

return {
format: "gururi-collection",
version: 2,
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
const text = await file.text();
const backup = JSON.parse(text);

if (
!backup ||
backup.format !== "gururi-collection" ||
![1, 2].includes(backup.version) ||
!Array.isArray(backup.artworks)
) {
throw new Error("ぐるりコレクションのバックアップファイルではありません。");
}

for (const item of backup.artworks) {
if (item.gartData) {
const gartBlob =
await dataUrlToBlob(
item.gartData
);

const parsed =
await parseGururiArtFile(
gartBlob
);

const manifest =
parsed.manifest;

const work = {
id:
item.id ||
manifest.id ||
`${Date.now()}-${Math.random().toString(36).slice(2)}`,
title:
item.title ||
manifest.title ||
"無題",
author:
item.author ||
manifest.author ||
"作者未設定",
authorUrl:
item.authorUrl ||
manifest.authorUrl ||
"",
createdAt:
item.createdAt ||
manifest.createdAt ||
"",
type:
item.type ||
"illustration",
symbol:
item.symbol ||
"◎",
sourceFileName:
item.sourceFileName ||
"artwork.gart",
thumbnailBlob:
parsed.thumbnailBlob,
playback:
manifest.playback || null,
camera:
item.camera ||
manifest.initialView || {
yaw: 0,
pitch: 0,
fov: 75
}
};

await saveArtworkToDatabase(
work,
parsed.sourceBlob,
gartBlob
);

continue;
}

if (!item.sourceData) {
continue;
}

const sourceBlob =
await dataUrlToBlob(
item.sourceData
);

const thumbnailBlob =
item.thumbnailData
? await dataUrlToBlob(
item.thumbnailData
)
: null;

const work = {
id: item.id,
title: item.title,
author: item.author,
authorUrl: item.authorUrl || "",
createdAt: item.createdAt || "",
type: item.type,
symbol: item.symbol,
sourceFileName: item.sourceFileName,
thumbnailBlob,
camera: item.camera || {
yaw: 0,
pitch: 0,
fov: 75
}
};

await saveArtworkToDatabase(
work,
sourceBlob
);
}

state.works.forEach((work) => {
if (work.sourceUrl) {
URL.revokeObjectURL(work.sourceUrl);
}

if (work.thumbnailUrl) {
URL.revokeObjectURL(work.thumbnailUrl);
}
});

state.works =
await loadArtworksFromDatabase();

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
`「${work.title}」をコレクションから削除しますか？\n\n元の.gartファイルは削除されません。`
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
const extension = file.name.split(".").pop().toLowerCase();

if (extension !== "gart") {
window.alert("ぐるり作品（.gart）を選択してください。");
return;
}

try {
const parsed = await parseGururiArtFile(file);
const manifest = parsed.manifest;

const work = {
id: manifest.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
title: manifest.title || file.name.replace(/\.[^.]+$/, ""),
author: manifest.author || "作者未設定",
authorUrl: manifest.authorUrl || "",
createdAt: manifest.createdAt || "",
type:
manifest.type === "video"
? "animation"
: "illustration",
symbol: "◎",
sourceFileName: file.name,
sourceUrl:
URL.createObjectURL(
parsed.sourceBlob
),
thumbnailUrl:
parsed.thumbnailBlob
? URL.createObjectURL(
parsed.thumbnailBlob
)
: null,
thumbnailBlob:
parsed.thumbnailBlob,
playback:
manifest.playback || null,
camera:
manifest.initialView || {
yaw: 0,
pitch: 0,
fov: 75
}
};

await saveArtworkToDatabase(
work,
parsed.sourceBlob,
file
);

state.works.push(work);
renderLibrary();
} catch (error) {
console.error(error);

window.alert(
error.message || "ぐるり作品を読み込めませんでした。"
);
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
document.body.classList.remove("lock-pending");
passwordUnlockInput.value = "";
passwordUnlockMessage.textContent = "";

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
