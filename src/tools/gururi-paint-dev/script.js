import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import iro from
"https://cdn.jsdelivr.net/npm/@jaames/iro@5/dist/iro.es.js";

/* ================================
基本設定
================================ */

const viewport =
document.getElementById("viewport");

const scene = new THREE.Scene();


/* ================================
アプリバージョン
================================ */

const APP_VERSION =
"1.3.35";


const appVersion =
document.getElementById(
"appVersion"
);


if (appVersion) {

appVersion.textContent =
`ver.${APP_VERSION}-dev`;
}


let paintStartTracked = false;

function trackGAEvent(
eventName,
eventParameters = {}
) {
if (
typeof window.gtag !== "function"
) {
return false;
}

window.gtag(
"event",
eventName,
eventParameters
);

return true;
}

function trackPaintStart() {
if (paintStartTracked) {
return;
}

const hasPaintAction =
strokeHistory.some(
(action) =>
action?.tool === "pen" ||
action?.tool === "eraser" ||
action?.tool === "bucket"
);

if (!hasPaintAction) {
return;
}

const tracked =
trackGAEvent(
"paint_start"
);

if (tracked) {
paintStartTracked = true;
}
}


/* ================================
ツールUI
================================ */

const penToolButton =
document.getElementById("penTool");

const eraserToolButton =
document.getElementById("eraserTool");

const bucketToolButton =
document.getElementById("bucketTool");

const eyedropperToolButton =
document.getElementById("eyedropperTool");

const lookToolButton =
document.getElementById("lookTool");

const addToolButton =
document.getElementById("addToolButton");

const toolLibraryPanel =
document.getElementById(
"toolLibraryPanel"
);

const toolLibraryCloseButton =
document.getElementById(
"toolLibraryCloseButton"
);

const cameraToolTitle =
document.getElementById(
"cameraToolTitle"
);

const cameraToolDescription =
document.getElementById(
"cameraToolDescription"
);

const cameraToolAddButton =
document.getElementById(
"cameraToolAddButton"
);

const cameraToolButton =
document.getElementById(
"cameraTool"
);

const cameraCaptureUi =
document.getElementById(
"cameraCaptureUi"
);

const cameraPhotoModeButton =
document.getElementById(
"cameraPhotoModeButton"
);

const cameraVideoModeButton =
document.getElementById(
"cameraVideoModeButton"
);

const cameraShutterButton =
document.getElementById(
"cameraShutterButton"
);

const cameraRecordingTime =
document.getElementById(
"cameraRecordingTime"
);


const TOOL_REGISTRY =
Object.freeze({

pen: {
id: "pen",
builtIn: true
},

eraser: {
id: "eraser",
builtIn: true
},

bucket: {
id: "bucket",
builtIn: true
},

eyedropper: {
id: "eyedropper",
builtIn: true
},

look: {
id: "look",
builtIn: true
},

camera: {
id: "camera",
builtIn: false
}
});


const TOOL_PALETTE_STORAGE_KEY =
"gururi-paint-dev-palette-tools";


let addedPaletteToolIds = [];


try {

const savedPaletteToolIds =
JSON.parse(
localStorage.getItem(
TOOL_PALETTE_STORAGE_KEY
) || "[]"
);

if (Array.isArray(savedPaletteToolIds)) {

addedPaletteToolIds =
savedPaletteToolIds.filter(
(toolId) =>
TOOL_REGISTRY[toolId] &&
!TOOL_REGISTRY[toolId].builtIn
);
}

} catch (error) {

addedPaletteToolIds = [];
}


const layerList =
document.getElementById("layerList");

const addLayerButton =
document.getElementById("addLayerButton");

const layerUpButton =
document.getElementById("layerUpButton");

const layerDownButton =
document.getElementById("layerDownButton");

const deleteLayerButton =
document.getElementById("deleteLayerButton");

const penSizeInput =
document.getElementById("penSize");

const penSizeMinus =
document.getElementById("penSizeMinus");

const penSizePlus =
document.getElementById("penSizePlus");

const penSizeValue =
document.getElementById("penSizeValue");

const colorPickerWheel =
document.getElementById(
"colorPickerWheel"
);


const colorWheelLayer =
document.getElementById(
"colorWheelLayer"
);


const colorBoxLayer =
document.getElementById(
"colorBoxLayer"
);


const penColorInput =
document.getElementById("penColorInput");


const currentPenColorSwatch =
document.getElementById(
"currentPenColorSwatch"
);


const recentColorsElement =
document.getElementById("recentColors");


const penColorControl =
document.querySelector(
".pen-color-control"
);


const mobileColorButton =
document.getElementById(
"mobileColorButton"
);


const mobileColorBackdrop =
document.getElementById(
"mobileColorBackdrop"
);


const undoButton =
document.getElementById("undoButton");

const redoButton =
document.getElementById("redoButton");

const canvasSizeSelect =
document.getElementById("canvasSize");

const eyeHeightInput =
document.getElementById("eyeHeight");

const eyeHeightMinus =
document.getElementById(
"eyeHeightMinus"
);

const eyeHeightPlus =
document.getElementById(
"eyeHeightPlus"
);

const eyeHeightValue =
document.getElementById(
"eyeHeightValue"
);

const groundToggle =
document.getElementById(
"groundToggle"
);

const projectSaveButton =
document.getElementById(
"projectSaveButton"
);

const projectLoadButton =
document.getElementById(
"projectLoadButton"
);

const projectLoadInput =
document.getElementById(
"projectLoadInput"
);

const previewButton =
document.getElementById("previewButton");

const downloadButton =
document.getElementById("downloadButton");

const previewDownloadButton =
document.getElementById(
"previewDownloadButton"
);

const languageButton =
document.getElementById(
"languageButton"
);

const helpButton =
document.getElementById("helpButton");

const helpPanel =
document.getElementById("helpPanel");

const helpCloseButton =
document.getElementById(
"helpCloseButton"
);


const shortcutSettingsButton =
document.getElementById(
"shortcutSettingsButton"
);

const shortcutPanel =
document.getElementById(
"shortcutPanel"
);

const shortcutCloseButton =
document.getElementById(
"shortcutCloseButton"
);

const shortcutResetButton =
document.getElementById(
"shortcutResetButton"
);

const shortcutConfirmButton =
document.getElementById(
"shortcutConfirmButton"
);

const shortcutInstruction =
document.getElementById(
"shortcutInstruction"
);

const shortcutStatus =
document.getElementById(
"shortcutStatus"
);

const shortcutKeyButtons =
document.querySelectorAll(
"[data-shortcut-action]"
);

const lookDirectionHorizontalSelect =
document.getElementById(
"lookDirectionHorizontalSelect"
);

const lookDirectionVerticalSelect =
document.getElementById(
"lookDirectionVerticalSelect"
);


const desktopUndoMenuButton =
document.getElementById(
"desktopUndoMenuButton"
);

const desktopRedoMenuButton =
document.getElementById(
"desktopRedoMenuButton"
);

const desktopHelpMenuButton =
document.getElementById(
"desktopHelpMenuButton"
);

const appMenuTriggers =
document.querySelectorAll(
".app-menu__trigger"
);

const appMenus =
document.querySelectorAll(
".app-menu"
);


const shortcutSaveConfirmPanel =
document.getElementById(
"shortcutSaveConfirmPanel"
);

const shortcutSaveConfirmMessage =
document.getElementById(
"shortcutSaveConfirmMessage"
);

const shortcutSaveConfirmYesButton =
document.getElementById(
"shortcutSaveConfirmYesButton"
);

const shortcutSaveConfirmNoButton =
document.getElementById(
"shortcutSaveConfirmNoButton"
);


const welcomeLanguageButtons =
document.querySelectorAll(
"[data-welcome-language]"
);

const welcomeImage =
document.getElementById(
"welcomeImage"
);

const welcomeXLink =
document.getElementById(
"welcomeXLink"
);

const welcomeNoteLink =
document.getElementById(
"welcomeNoteLink"
);


/*
言語ごとのnote記事URL
*/

const WELCOME_NOTE_URLS = {

ja:
"https://note.com/junnoota/n/n87a466960ce6",

en:
"https://note.com/junnoota/n/ne455507ce7ec"

};


const previewOverlay =
document.getElementById("previewOverlay");

const previewCloseButton =
document.getElementById(
"previewCloseButton"
);

const previewCanvas =
document.getElementById(
"previewCanvas"
);


const previewContext =
previewCanvas.getContext("2d");


const previewSeamHandle =
document.getElementById(
"previewSeamHandle"
);


/* ================================
言語切り替え
================================ */

const LANGUAGE_STORAGE_KEY =
"gururi-paint-dev-language";


let savedLanguage = null;


try {

savedLanguage =
localStorage.getItem(
LANGUAGE_STORAGE_KEY
);

} catch (error) {

savedLanguage = null;
}


let currentLanguage =
savedLanguage === "ja" ||
savedLanguage === "en"
? savedLanguage
: "ja";


const translations = {

ja: {

appTitle:
"ぐるりペイント",

undoTitle:
"元に戻す（Ctrl + Z）",

undo:
"元に戻す",

redoTitle:
"やり直す（Ctrl + Y）",

redo:
"やり直す",

outputSize:
"出力サイズ",

eyeHeight:
"目線",

eyeLower:
"目線を下げる",

eyeRaise:
"目線を上げる",

guideGrid:
"補助グリッド",

saveData:
"データ保存(.gururi)",

loadData:
"インポート（.gururi)",

preview:
"プレビュー",

savePng:
"PNG保存(2：1画像)",

download:
"ダウンロード",

help:
"はじめに",

welcomeTitle:
"ぐるりペイントへようこそ！",

welcomeIntroText:
"360°の空間に直接絵を描けるブラウザツールです。",

welcomeBasicsTitle:
"基本操作",

welcomePcTitle:
"PC",

welcomeMobileTitle:
"スマートフォン",

welcomeDevelopmentTitle:
"ぐるりペイントは現在も開発中です",

welcomeDevelopmentText:
"これからも機能追加や改善を続けていきます。",

welcomeShareTitle:
"描いた作品をぜひ見せてください！",

welcomeShareText:
"Xでハッシュタグをつけて投稿してもらえるとうれしいです。",

welcomeX:
"Xをフォロー",

welcomeNote:
"開発について読む・応援する",

pen:
"ペン",

eraser:
"消しゴム",

bucket:
"バケツ",

eyedropper:
"スポイト",

lookTool:
"手のひら",

addTool:
"ツールを追加",

add:
"追加",

added:
"追加済み",

camera:
"カメラ",

cameraDescription:
"現在見えている360°空間を通常の画像として撮影します。",

captureFormat:
"撮影形式",

photo:
"写真",

video:
"動画",

capture:
"撮影",

brushSize:
"太さ",

thinner:
"細くする",

thicker:
"太くする",

brushSizeAria:
"ペンの太さ",

brushSizeNumberAria:
"ペンの太さを数値入力",

chooseColor:
"色を選択",

color:
"色",

currentPenColor:
"現在のペン色",

recentColors:
"最近使用した色",

layers:
"レイヤー",

addLayer:
"レイヤーを追加",

moveUp:
"上へ移動",

moveDown:
"下へ移動",

deleteLayer:
"レイヤーを削除",

delete:
"削除",

controlPanels:
"操作パネル",

draw:
"描画",

settings:
"設定",

fileMenu:
"ファイル",

editMenu:
"編集",

settingsMenu:
"設定",

helpMenu:
"ヘルプ",

shortcutMenu:
"ショートカット",

helpMenuItem:
"はじめに",

helpLookAround:
"Space + ドラッグ：見回す",

helpZoom:
"Z + 上下ドラッグ：ズーム",

helpUndo:
"Ctrl + Z：元に戻す",

helpRedo:
"Ctrl + Y：やり直す",

helpMobileDraw:
"1本指：描画",

helpMobileLook:
"2本指ドラッグ：見回す",

helpMobileZoom:
"ピンチ：ズーム",

previewTitle:
"ぐるり画像プレビュー",

close:
"閉じる",

seamChange:
"ドラッグして画像の左端を変更",

hideLayer:
"非表示にする",

showLayer:
"表示する",

dragReorder:
"ドラッグして並び替え",

dragReorderAria:
"レイヤーをドラッグして並び替え",

editLayerNameMobile:
"長押しでレイヤー名を編集",

editLayerNameDesktop:
"ダブルクリックでレイヤー名を編集",

opacity:
"不透明度",

layerImageLoadError:
"レイヤー画像を読み込めませんでした。",

invalidProject:
"ぐるりペイントの保存データではありません。",

brokenLayerImage:
"レイヤー画像が壊れています。",

projectLoaded:
"データを読み込みました。",

projectLoadFailed:
"データを読み込めませんでした。\nぐるりペイントで保存したデータか確認してください。"
},


en: {

appTitle:
"Gururi Paint",

undoTitle:
"Undo (Ctrl + Z)",

undo:
"Undo",

redoTitle:
"Redo (Ctrl + Y)",

redo:
"Redo",

outputSize:
"Output size",

eyeHeight:
"Eye height",

eyeLower:
"Lower eye height",

eyeRaise:
"Raise eye height",

guideGrid:
"Guide grid",

saveData:
"Save data (.gururi)",

loadData:
"Import",

preview:
"Preview",

savePng:
"Save PNG (2:1 image)",

download:
"Download",

help:
"About",

welcomeTitle:
"Welcome to Gururi Paint!",

welcomeIntroText:
"A browser tool for painting directly inside a 360° space.",

welcomeBasicsTitle:
"Basic controls",

welcomePcTitle:
"PC",

welcomeMobileTitle:
"Mobile",

welcomeDevelopmentTitle:
"Gururi Paint is still in development",

welcomeDevelopmentText:
"We'll keep adding features and improving the tool.",

welcomeShareTitle:
"Share what you make!",

welcomeShareText:
"Post your work on X with one of these hashtags.",

welcomeX:
"Follow on X",

welcomeNote:
"Read about the project / Support",

pen:
"Pen",

eraser:
"Eraser",

bucket:
"Fill",

eyedropper:
"Eyedropper",

lookTool:
"Hand",

addTool:
"Add tools",

add:
"Add",

added:
"Added",

camera:
"Camera",

cameraDescription:
"Capture the current view of the 360° space as a standard image.",

captureFormat:
"Capture format",

photo:
"Photo",

video:
"Video",

capture:
"Capture",

brushSize:
"Size",

thinner:
"Thinner",

thicker:
"Thicker",

brushSizeAria:
"Brush size",

brushSizeNumberAria:
"Enter brush size",

chooseColor:
"Choose color",

color:
"Color",

currentPenColor:
"Current pen color",

recentColors:
"Recent colors",

layers:
"Layers",

addLayer:
"Add layer",

moveUp:
"Move up",

moveDown:
"Move down",

deleteLayer:
"Delete layer",

delete:
"Delete",

controlPanels:
"Control panels",

draw:
"Draw",

settings:
"Settings",

fileMenu:
"File",

editMenu:
"Edit",

settingsMenu:
"Settings",

helpMenu:
"Help",

shortcutMenu:
"Shortcuts",

helpMenuItem:
"About",

helpLookAround:
"Space + Drag: Look around",

helpZoom:
"Z + Drag up/down: Zoom",

helpUndo:
"Ctrl + Z: Undo",

helpRedo:
"Ctrl + Y: Redo",

helpMobileDraw:
"Draw with one finger",

helpMobileLook:
"Drag with two fingers to look around",

helpMobileZoom:
"Pinch to zoom",

previewTitle:
"Gururi Image Preview",

close:
"Close",

seamChange:
"Drag to change the left edge of the image",

hideLayer:
"Hide layer",

showLayer:
"Show layer",

dragReorder:
"Drag to reorder",

dragReorderAria:
"Drag layer to reorder",

editLayerNameMobile:
"Press and hold to edit layer name",

editLayerNameDesktop:
"Double-click to edit layer name",

opacity:
"Opacity",

layerImageLoadError:
"Could not load the layer image.",

invalidProject:
"This is not a Gururi Paint project file.",

brokenLayerImage:
"The layer image is corrupted.",

projectLoaded:
"Project loaded.",

projectLoadFailed:
"Could not load the project.\nPlease check that it was saved by Gururi Paint."
}
};


function t(
key
) {

return (
translations[currentLanguage]
?.[key] ??
translations.ja[key] ??
key
);
}


function getDefaultLayerName(
number
) {

return currentLanguage === "en"
? `Layer ${number}`
: `レイヤー${number}`;
}


function setElementText(
selector,
text
) {

const element =
document.querySelector(
selector
);


if (element) {

element.textContent =
text;
}
}


function applyLanguage(
rerenderLayers = true
) {

document.documentElement.lang =
currentLanguage;


document.title =
t("appTitle");


setElementText(
".toolbar__title",
t("appTitle")
);


setElementText(
'[data-app-menu="file"]',
t("fileMenu")
);

setElementText(
'[data-app-menu="edit"]',
t("editMenu")
);

setElementText(
'[data-app-menu="settings"]',
t("settingsMenu")
);

setElementText(
'[data-app-menu="help"]',
t("helpMenu")
);


undoButton.title =
t("undoTitle");

undoButton.setAttribute(
"aria-label",
t("undo")
);


redoButton.title =
t("redoTitle");

redoButton.setAttribute(
"aria-label",
t("redo")
);


desktopUndoMenuButton.textContent =
t("undo");

desktopRedoMenuButton.textContent =
t("redo");


setElementText(
".canvas-size-control label",
t("outputSize")
);


setElementText(
".eye-height-control label",
t("eyeHeight")
);


eyeHeightMinus.title =
t("eyeLower");

eyeHeightPlus.title =
t("eyeRaise");


setElementText(
".guide-toggle span",
t("guideGrid")
);


projectSaveButton.textContent =
t("saveData");

projectLoadButton.textContent =
t("loadData");

previewButton.textContent =
t("preview");

downloadButton.textContent =
t("savePng");

previewDownloadButton.textContent =
t("download");

shortcutSettingsButton.textContent =
t("shortcutMenu");

desktopHelpMenuButton.textContent =
t("helpMenuItem");


const languageSwitchLabel =
currentLanguage === "ja"
? "英語に切り替え"
: "Switch to Japanese";


languageButton.textContent =
currentLanguage === "ja"
? "EN"
: "JA";

languageButton.title =
languageSwitchLabel;

languageButton.setAttribute(
"aria-label",
languageSwitchLabel
);


helpButton.title =
t("help");

helpButton.textContent =
t("help");


penToolButton.title =
t("pen");

penToolButton.setAttribute(
"aria-label",
t("pen")
);

penToolButton.querySelector(
".drawing-tool-label"
).textContent =
t("pen");


eraserToolButton.title =
t("eraser");

eraserToolButton.setAttribute(
"aria-label",
t("eraser")
);

eraserToolButton.querySelector(
".drawing-tool-label"
).textContent =
t("eraser");


bucketToolButton.title =
t("bucket");

bucketToolButton.setAttribute(
"aria-label",
t("bucket")
);

bucketToolButton.querySelector(
".drawing-tool-label"
).textContent =
t("bucket");


eyedropperToolButton.title =
t("eyedropper");

eyedropperToolButton.setAttribute(
"aria-label",
t("eyedropper")
);

eyedropperToolButton.querySelector(
".drawing-tool-label"
).textContent =
t("eyedropper");


lookToolButton.title =
t("lookTool");

lookToolButton.setAttribute(
"aria-label",
t("lookTool")
);

lookToolButton.querySelector(
".drawing-tool-label"
).textContent =
t("lookTool");


addToolButton.title =
t("addTool");

addToolButton.setAttribute(
"aria-label",
t("addTool")
);


setElementText(
"#toolLibraryPanelTitle",
t("addTool")
);

toolLibraryCloseButton.setAttribute(
"aria-label",
t("close")
);

cameraToolTitle.textContent =
t("camera");

cameraToolDescription.textContent =
t("cameraDescription");

cameraToolButton.title =
t("camera");

cameraToolButton.setAttribute(
"aria-label",
t("camera")
);

cameraToolButton.querySelector(
".drawing-tool-label"
).textContent =
t("camera");


updateToolPalette();


cameraPhotoModeButton.textContent =
t("photo");

cameraVideoModeButton.textContent =
t("video");

cameraShutterButton.setAttribute(
"aria-label",
t("capture")
);

document.querySelector(
".camera-mode-switch"
)?.setAttribute(
"aria-label",
t("captureFormat")
);


setElementText(
".pen-size-label",
t("brushSize")
);


penSizeMinus.title =
t("thinner");

penSizePlus.title =
t("thicker");


penSizeInput.setAttribute(
"aria-label",
t("brushSizeAria")
);


penSizeValue.setAttribute(
"aria-label",
t("brushSizeNumberAria")
);


mobileColorButton.setAttribute(
"aria-label",
t("chooseColor")
);


setElementText(
".pen-color-label",
t("color")
);


currentPenColorSwatch.setAttribute(
"aria-label",
t("currentPenColor")
);


recentColorsElement.setAttribute(
"aria-label",
t("recentColors")
);


setElementText(
".layer-panel__header strong",
t("layers")
);


addLayerButton.title =
t("addLayer");

layerUpButton.title =
t("moveUp");

layerDownButton.title =
t("moveDown");

deleteLayerButton.title =
t("deleteLayer");

deleteLayerButton.textContent =
t("delete");


const mobileTabs =
document.querySelector(
".mobile-bottom-tabs"
);


mobileTabs?.setAttribute(
"aria-label",
t("controlPanels")
);


setElementText(
'.mobile-bottom-tab[data-mobile-panel="draw"]',
t("draw")
);


setElementText(
'.mobile-bottom-tab[data-mobile-panel="layer"]',
t("layers")
);


setElementText(
'.mobile-bottom-tab[data-mobile-panel="settings"]',
t("settings")
);


setElementText(
"#welcomePanelTitle",
t("help")
);


if (welcomeImage) {

const isEnglish =
currentLanguage === "en";

welcomeImage.src =
isEnglish
? "./images/welcome-en.png"
: "./images/welcome-ja.png";

welcomeImage.alt =
isEnglish
? "Gururi Paint basic controls and introduction"
: "ぐるりペイントの基本操作と案内";
}


setElementText(
"#welcomeXLink",
t("welcomeX")
);

setElementText(
"#welcomeNoteLink",
t("welcomeNote")
);

welcomeNoteLink.href =
WELCOME_NOTE_URLS[
currentLanguage
];

helpCloseButton.setAttribute(
"aria-label",
t("close")
);

welcomeLanguageButtons.forEach(
(button) => {

const isActive =
button.dataset.welcomeLanguage ===
currentLanguage;

button.classList.toggle(
"is-active",
isActive
);

button.setAttribute(
"aria-pressed",
String(isActive)
);
}
);


setElementText(
".preview-header span",
t("previewTitle")
);


previewCloseButton.textContent =
t("close");


previewSeamHandle.title =
t("seamChange");


previewSeamHandle.setAttribute(
"aria-label",
t("seamChange")
);


if (rerenderLayers) {

renderLayerPanel();
}


requestAnimationFrame(
() => {

updateMobileViewportSize();
}
);
}


function setLanguage(
language
) {

if (
language !== "ja" &&
language !== "en"
) {

return;
}


currentLanguage =
language;


try {

localStorage.setItem(
LANGUAGE_STORAGE_KEY,
currentLanguage
);

} catch (error) {

/*
言語設定を保存できない環境でも
切り替え自体はそのまま使用する
*/
}


applyLanguage();
}


/*
カメラ

FOV：75度
視点位置：高さ1.5m
*/
const camera = new THREE.PerspectiveCamera(
85,
viewport.clientWidth / viewport.clientHeight,
0.1,
1000
);

camera.position.set(0, 1.5, 0);


/* ================================
Renderer
================================ */

/*
スマートフォンでは
Three.jsの描画解像度を抑えて
動作を軽くする
*/

const renderer =
new THREE.WebGLRenderer({
antialias: true
});

const isMobileDevice =
window.matchMedia(
"(max-width: 700px)"
).matches;


renderer.setPixelRatio(
isMobileDevice
? 1
: Math.min(
window.devicePixelRatio,
2
)
);

renderer.setSize(
viewport.clientWidth,
viewport.clientHeight
);

viewport.appendChild(renderer.domElement);


/* ================================
撮影用Renderer
================================ */

const PHOTO_CAPTURE_SIZE =
1080;

const photoCaptureCanvas =
document.createElement(
"canvas"
);

const photoCaptureRenderer =
new THREE.WebGLRenderer({
canvas: photoCaptureCanvas,
antialias: true,
preserveDrawingBuffer: true
});

photoCaptureRenderer.setPixelRatio(
1
);

photoCaptureRenderer.outputColorSpace =
renderer.outputColorSpace;


/* ================================
360°キャンバス
================================ */

/*
最終的には、このCanvasへ絵を描きます。

Version 1の標準サイズ：
4096 × 2048
*/

const paintCanvas =
document.createElement("canvas");

/*
最終出力サイズ

書き出し時には
このサイズを使用する
*/

let outputWidth = 4096;
let outputHeight = 2048;


/*
編集時の解像度

最終出力の1/2
*/

const editScale = 0.5;

paintCanvas.width =
Math.round(
outputWidth *
editScale
);

paintCanvas.height =
Math.round(
outputHeight *
editScale
);

const paintContext =
paintCanvas.getContext("2d");


/* ================================
描画専用Canvas
================================ */

/*
編集用Canvasの解像度。

0.5 = 出力サイズの1/2
4096 × 2048
↓
2048 × 1024
*/

/*
描画Canvasは
編集用Canvasと同じ解像度にする
*/

const drawScale = 1;


let drawCanvas =
document.createElement("canvas");

drawCanvas.width =
paintCanvas.width;

drawCanvas.height =
paintCanvas.height;

let drawContext =
drawCanvas.getContext("2d");


/*
画像拡大時の補間を無効化
*/

drawContext.imageSmoothingEnabled =
false;


/* ================================
レイヤー
================================ */

const layers = [
{
id: 1,
name:
getDefaultLayerName(1),
canvas: drawCanvas,
context: drawContext,
visible: true,
opacity: 1
}
];

let activeLayerId = 1;
let nextLayerId = 2;
let nextLayerNumber = 2;


function createLayerCanvas() {

const canvas =
document.createElement("canvas");

canvas.width =
paintCanvas.width;

canvas.height =
paintCanvas.height;

const context =
canvas.getContext("2d");

context.imageSmoothingEnabled =
false;

return {
canvas,
context
};
}


function getLayerById(layerId) {

return (
layers.find(
(layer) =>
layer.id === layerId
) || null
);
}


function getActiveLayer() {

return getLayerById(
activeLayerId
);
}


function setActiveLayerReference(
layerId
) {

const layer =
getLayerById(layerId);

if (!layer) {
return false;
}

activeLayerId =
layer.id;

drawCanvas =
layer.canvas;

drawContext =
layer.context;

return true;
}


function setActiveLayer(layerId) {

if (
!setActiveLayerReference(
layerId
)
) {
return;
}

renderLayerPanel();
}


/*
テストしやすいように、
最初は単色で塗っておきます。
*/

function drawBaseCanvas() {

/*
表示用Canvasを初期化
*/

paintContext.clearRect(
0,
0,
paintCanvas.width,
paintCanvas.height
);


/*
背景
*/

paintContext.fillStyle =
"#eeeeee";

paintContext.fillRect(
0,
0,
paintCanvas.width,
paintCanvas.height
);
}


drawBaseCanvas();

/* ================================
Canvas → Texture
================================ */

/*
描画レイヤーを
表示用Canvasへ合成する
*/

let paintUpdateRequested = false;


/*
スマートフォンでは
360°テクスチャ更新を
最大30fps程度に抑える
*/

let lastPaintUpdateTime = 0;

const paintUpdateInterval =
isMobileDevice
? 1000 / 30
: 0;


function requestPaintUpdate() {

paintUpdateRequested = true;
}


function updatePaintCanvas() {

/*
背景とグリッドを維持したまま
描画レイヤーを重ねるため、
後ほど背景を再描画する
*/

drawBaseCanvas();

/*
表示中のレイヤーを
下から順番に合成する
*/

paintContext.imageSmoothingEnabled =
false;

for (const layer of layers) {

if (!layer.visible) {
continue;
}


/*
レイヤーの不透明度
*/

paintContext.globalAlpha =
typeof layer.opacity === "number"
? layer.opacity
: 1;


paintContext.drawImage(
layer.canvas,
0,
0
);
}


/*
次の描画に影響しないよう
100%へ戻す
*/

paintContext.globalAlpha = 1;

texture.needsUpdate = true;
}

/* ================================
長方形プレビュー
================================ */


/*
左右反転済みの画像を
一時保存するCanvas
*/

const previewSourceCanvas =
document.createElement(
"canvas"
);


const previewSourceContext =
previewSourceCanvas.getContext(
"2d"
);


/*
360°画像の左端位置。

0 = 元の左端
0.5 = 画像中央
1 = 一周して元の左端
*/

let previewSeamRatio = 0;


function updatePreview() {

/*
プレビューは
編集時と同じ解像度を使用
*/

previewCanvas.width =
paintCanvas.width;

previewCanvas.height =
paintCanvas.height;


previewSourceCanvas.width =
paintCanvas.width;

previewSourceCanvas.height =
paintCanvas.height;


previewContext.imageSmoothingEnabled =
false;


previewSourceContext
.imageSmoothingEnabled =
false;


/*
まず左右反転した
通常のプレビュー画像を作る
*/

previewSourceContext.clearRect(
0,
0,
previewSourceCanvas.width,
previewSourceCanvas.height
);


previewSourceContext.save();


previewSourceContext.translate(
previewSourceCanvas.width,
0
);


previewSourceContext.scale(
-1,
1
);


previewSourceContext.drawImage(
paintCanvas,
0,
0
);


previewSourceContext.restore();


/*
左端位置をCanvas上の
X座標へ変換する
*/

const width =
previewCanvas.width;


const height =
previewCanvas.height;


const normalizedRatio =
(
(
previewSeamRatio %
1
) +
1
) % 1;


const seamX =
Math.round(
normalizedRatio *
width
) % width;


previewContext.clearRect(
0,
0,
width,
height
);


/*
seamX以降を
左側へ描画
*/

const rightWidth =
width -
seamX;


if (rightWidth > 0) {

previewContext.drawImage(
previewSourceCanvas,

seamX,
0,
rightWidth,
height,

0,
0,
rightWidth,
height
);
}


/*
元画像の左側部分を
右端へつなげる。

360°なので継ぎ目なく
循環させることができる。
*/

if (seamX > 0) {

previewContext.drawImage(
previewSourceCanvas,

0,
0,
seamX,
height,

rightWidth,
0,
seamX,
height
);
}
}

/* ================================
PNG書き出し
================================ */

function downloadPNG() {

/*
念のため最新の描画内容を
paintCanvasへ反映
*/

updatePaintCanvas();


/*
書き出し専用Canvas
*/

const exportCanvas =
document.createElement("canvas");

exportCanvas.width =
outputWidth;

exportCanvas.height =
outputHeight;

const exportContext =
exportCanvas.getContext("2d");

exportContext.imageSmoothingEnabled =
false;


/*
まず、プレビューと同じ並び順の
元画像を作るための一時Canvasを用意する
*/

const previewLikeSourceCanvas =
document.createElement("canvas");

previewLikeSourceCanvas.width =
paintCanvas.width;

previewLikeSourceCanvas.height =
paintCanvas.height;

const previewLikeSourceContext =
previewLikeSourceCanvas.getContext("2d");

previewLikeSourceContext.imageSmoothingEnabled =
false;


/*
左右反転した通常の
360°長方形画像を作る
*/

previewLikeSourceContext.clearRect(
0,
0,
previewLikeSourceCanvas.width,
previewLikeSourceCanvas.height
);

previewLikeSourceContext.save();

previewLikeSourceContext.translate(
previewLikeSourceCanvas.width,
0
);

previewLikeSourceContext.scale(
-1,
1
);

previewLikeSourceContext.drawImage(
paintCanvas,
0,
0
);

previewLikeSourceContext.restore();


/*
次に、プレビューと同じく
左端位置を previewSeamRatio に合わせて
循環移動した画像を作る
*/

const previewLikeCanvas =
document.createElement("canvas");

previewLikeCanvas.width =
paintCanvas.width;

previewLikeCanvas.height =
paintCanvas.height;

const previewLikeContext =
previewLikeCanvas.getContext("2d");

previewLikeContext.imageSmoothingEnabled =
false;


const sourceWidth =
previewLikeCanvas.width;

const sourceHeight =
previewLikeCanvas.height;

const normalizedRatio =
(
(
previewSeamRatio %
1
) +
1
) % 1;

const seamX =
Math.round(
normalizedRatio *
sourceWidth
) % sourceWidth;


previewLikeContext.clearRect(
0,
0,
sourceWidth,
sourceHeight
);


/*
seamX 以降を左側へ描画
*/

const rightWidth =
sourceWidth - seamX;

if (rightWidth > 0) {

previewLikeContext.drawImage(
previewLikeSourceCanvas,
seamX,
0,
rightWidth,
sourceHeight,
0,
0,
rightWidth,
sourceHeight
);
}


/*
元画像左側を右端へつなげる
*/

if (seamX > 0) {

previewLikeContext.drawImage(
previewLikeSourceCanvas,
0,
0,
seamX,
sourceHeight,
rightWidth,
0,
seamX,
sourceHeight
);
}


/*
プレビューと同じ並び順の画像を
出力サイズへ拡大して書き出す
*/

exportContext.clearRect(
0,
0,
outputWidth,
outputHeight
);

exportContext.drawImage(
previewLikeCanvas,
0,
0,
sourceWidth,
sourceHeight,
0,
0,
outputWidth,
outputHeight
);


/*
PNGダウンロード
*/

const link =
document.createElement("a");

link.href =
exportCanvas.toDataURL(
"image/png"
);

link.download =
"gururi-world.png";

link.click();
}


/* ================================
プロジェクト保存
================================ */

function downloadProject() {

const projectData = {

format:
"gururi-paint-project",

version: 1,

savedAt:
new Date().toISOString(),


/*
Canvas
*/

canvas: {

editWidth:
paintCanvas.width,

editHeight:
paintCanvas.height,

outputWidth,

outputHeight
},


/*
視点
*/

view: {

eyeHeight:
camera.position.y,

yaw,

pitch,

fov:
camera.fov,

guideVisible:
groundToggle.checked,

previewSeamRatio
},


/*
描画ツール
*/

tools: {

penColor,

penSize,

savedPenSize,

savedEraserSize,

recentColors:
[...recentColors],

currentTool
},


/*
レイヤー管理
*/

layerState: {

activeLayerId,

nextLayerId,

nextLayerNumber
},


/*
各レイヤーを
透明PNGとして保存
*/

layers:
layers.map(
(layer) => ({

id:
layer.id,

name:
layer.name,

visible:
layer.visible,

opacity:
typeof layer.opacity ===
"number"
? layer.opacity
: 1,

image:
layer.canvas.toDataURL(
"image/png"
)
})
)
};


const json =
JSON.stringify(
projectData
);


const blob =
new Blob(
[json],
{
type:
"application/json"
}
);


const url =
URL.createObjectURL(
blob
);


const now =
new Date();


const pad =
(value) =>
String(value)
.padStart(2, "0");


const filename =
"gururi-" +
now.getFullYear() +
pad(
now.getMonth() + 1
) +
pad(
now.getDate()
) +
"-" +
pad(
now.getHours()
) +
pad(
now.getMinutes()
) +
".gururi";


const link =
document.createElement("a");


link.href =
url;

link.download =
filename;


document.body.appendChild(
link
);

link.click();

link.remove();


setTimeout(
() => {

URL.revokeObjectURL(
url
);
},
1000
);
}


/* ================================
プロジェクト読み込み
================================ */

function loadProjectImage(
source
) {

return new Promise(
(
resolve,
reject
) => {

const image =
new Image();


image.onload =
() => {

resolve(
image
);
};


image.onerror =
() => {

reject(
new Error(
"レイヤー画像を読み込めませんでした。"
)
);
};


image.src =
source;
}
);
}


function clampProjectNumber(
value,
min,
max,
fallback
) {

const number =
Number(value);


if (
!Number.isFinite(
number
)
) {

return fallback;
}


return Math.max(
min,
Math.min(
max,
number
)
);
}


async function loadProject(
file
) {

const text =
await file.text();


const projectData =
JSON.parse(
text
);


/*
ぐるりペイントの
保存データか確認
*/

if (
projectData.format !==
"gururi-paint-project" ||
projectData.version !== 1 ||
!Array.isArray(
projectData.layers
) ||
projectData.layers.length === 0
) {

throw new Error(
"ぐるりペイントの保存データではありません。"
);
}


/*
編集Canvasサイズ
*/

const editWidth =
Math.round(
clampProjectNumber(
projectData.canvas
?.editWidth,
256,
8192,
2048
)
);


const editHeight =
Math.round(
clampProjectNumber(
projectData.canvas
?.editHeight,
128,
4096,
1024
)
);


paintCanvas.width =
editWidth;

paintCanvas.height =
editHeight;

paintContext
.imageSmoothingEnabled =
false;


/*
出力サイズ
*/

const savedOutputWidth =
Number(
projectData.canvas
?.outputWidth
);

if (
[
2048,
4096,
8192
].includes(
savedOutputWidth
)
) {

outputWidth =
savedOutputWidth;

} else {

outputWidth =
4096;
}


outputHeight =
outputWidth / 2;


canvasSizeSelect.value =
String(
outputWidth
);


/*
レイヤーを復元
*/

const loadedLayers = [];


for (
let i = 0;
i <
projectData.layers.length;
i++
) {

const layerData =
projectData.layers[i];


if (
typeof layerData.image !==
"string"
) {

throw new Error(
"レイヤー画像が壊れています。"
);
}


const {
canvas,
context
} =
createLayerCanvas();


const image =
await loadProjectImage(
layerData.image
);


context.clearRect(
0,
0,
canvas.width,
canvas.height
);


context.drawImage(
image,
0,
0,
canvas.width,
canvas.height
);


/*
Undo用の基準画像を作る
*/

const baseCanvas =
document.createElement(
"canvas"
);


baseCanvas.width =
canvas.width;

baseCanvas.height =
canvas.height;


const baseContext =
baseCanvas.getContext(
"2d"
);


baseContext
.imageSmoothingEnabled =
false;


baseContext.drawImage(
canvas,
0,
0
);


const layerId =
Number(
layerData.id
);


loadedLayers.push({

id:
Number.isInteger(
layerId
)
? layerId
: i + 1,

name:
typeof layerData.name ===
"string" &&
layerData.name.trim()
? layerData.name
: `レイヤー${i + 1}`,

canvas,

context,

baseCanvas,

visible:
layerData.visible !==
false,

opacity:
clampProjectNumber(
layerData.opacity,
0,
1,
1
)
});
}


/*
現在のレイヤー配列を
読み込んだものへ置換
*/

layers.splice(
0,
layers.length,
...loadedLayers
);


/*
レイヤーID管理
*/

const maxLayerId =
Math.max(
...layers.map(
(layer) =>
layer.id
)
);


nextLayerId =
Math.max(
maxLayerId + 1,
Number(
projectData
.layerState
?.nextLayerId
) ||
maxLayerId + 1
);


nextLayerNumber =
Math.max(
layers.length + 1,
Number(
projectData
.layerState
?.nextLayerNumber
) ||
layers.length + 1
);


const savedActiveLayerId =
Number(
projectData
.layerState
?.activeLayerId
);


if (
getLayerById(
savedActiveLayerId
)
) {

activeLayerId =
savedActiveLayerId;

} else {

activeLayerId =
layers[
layers.length - 1
].id;
}


setActiveLayerReference(
activeLayerId
);


/*
ペン設定
*/

const loadedPenColor =
projectData.tools
?.penColor;


if (
typeof loadedPenColor ===
"string" &&
/^#[0-9a-fA-F]{6}$/.test(
loadedPenColor
)
) {

setPenColor(
loadedPenColor
);
}


savedPenSize =
clampProjectNumber(
projectData.tools
?.savedPenSize,
1,
50,
3
);


savedEraserSize =
clampProjectNumber(
projectData.tools
?.savedEraserSize,
1,
50,
10
);


penSize =
clampProjectNumber(
projectData.tools
?.penSize,
1,
50,
savedPenSize
);


penSizeInput.value =
penSize;

penSizeValue.value =
penSize;


/*
最近使用した色
*/

if (
Array.isArray(
projectData.tools
?.recentColors
)
) {

recentColors =
projectData.tools
.recentColors
.filter(
(color) =>
typeof color ===
"string" &&
/^#[0-9a-fA-F]{6}$/.test(
color
)
)
.map(
(color) =>
color.toLowerCase()
)
.slice(
0,
8
);

} else {

recentColors = [];
}


renderRecentColors();


/*
使用ツール
*/

const loadedTool =
projectData.tools
?.currentTool;


if (
[
"pen",
"eraser",
"bucket",
"eyedropper",
"look"
].includes(
loadedTool
)
) {

currentTool =
loadedTool;

} else {

currentTool =
"pen";
}


penToolButton
.classList
.toggle(
"is-active",
currentTool === "pen"
);

eraserToolButton
.classList
.toggle(
"is-active",
currentTool === "eraser"
);

bucketToolButton
.classList
.toggle(
"is-active",
currentTool === "bucket"
);

eyedropperToolButton
.classList
.toggle(
"is-active",
currentTool ===
"eyedropper"
);

lookToolButton
.classList
.toggle(
"is-active",
currentTool ===
"look"
);


if (
currentTool === "bucket" ||
currentTool === "eyedropper"
) {

renderer
.domElement
.style
.cursor =
"crosshair";

} else if (
currentTool === "look"
) {

renderer
.domElement
.style
.cursor =
"grab";

} else {

renderer
.domElement
.style
.cursor =
"none";
}


eraserCursor.visible =
false;


/*
目線
*/

const eyeHeight =
clampProjectNumber(
projectData.view
?.eyeHeight,
0.5,
30,
1.5
);


camera.position.y =
eyeHeight;


eyeHeightInput.value =
eyeHeight;

eyeHeightValue.value =
eyeHeight.toFixed(1);


updateGroundGridSize(
eyeHeight
);

updateHorizontalGuideHeight(
eyeHeight
);


/*
カメラ方向
*/

const savedYaw =
Number(
projectData.view
?.yaw
);

const savedPitch =
Number(
projectData.view
?.pitch
);


yaw =
Number.isFinite(
savedYaw
)
? savedYaw
: 0;


const pitchLimit =
Math.PI / 2 -
0.01;


pitch =
Number.isFinite(
savedPitch
)
? Math.max(
-pitchLimit,
Math.min(
pitchLimit,
savedPitch
)
)
: 0;


/*
ズーム
*/

camera.fov =
clampProjectNumber(
projectData.view
?.fov,
20,
120,
85
);


camera
.updateProjectionMatrix();


/*
補助グリッド
*/

const guideVisible =
projectData.view
?.guideVisible !==
false;


groundToggle.checked =
guideVisible;

groundGrid.visible =
guideVisible;

verticalGuides.visible =
guideVisible;

horizontalGuides.visible =
guideVisible;


/*
プレビュー画像の
左端位置を復元する。

古い保存データには
この値がないため0を使用する。
*/

previewSeamRatio =
clampProjectNumber(
projectData.view
?.previewSeamRatio,
0,
1,
0
);


/*
1は0と同じ位置なので
0へ統一する
*/

if (
previewSeamRatio >= 1
) {
previewSeamRatio = 0;
}


previewDragRatio = 0;


previewSeamHandle
.style
.left =
"0px";


/*
読み込み前の
Undo / Redo履歴は破棄
*/

strokeHistory.length = 0;

redoStrokeHistory.length = 0;

currentStroke = null;

isDrawing = false;


/*
UIと球体へ反映
*/

renderLayerPanel();

updatePaintCanvas();

updateCameraDirection();


alert(
"データを読み込みました。"
);
}


const texture =
new THREE.CanvasTexture(paintCanvas);

texture.colorSpace = THREE.SRGBColorSpace;


/* ================================
球体
================================ */

/*
半径10mの球体。

BackSideを指定することで、
球体の内側を見ることができます。
*/

const geometry =
new THREE.SphereGeometry(
50,
64,
32
);

const material =
new THREE.MeshBasicMaterial({
map: texture,
side: THREE.BackSide
});

const sphere =
new THREE.Mesh(
geometry,
material
);

scene.add(sphere);


/* ================================
ペン／消しゴムカーソル
================================ */

const eraserCursorGeometry =
new THREE.BufferGeometry();


const eraserCursorMaterial =
new THREE.LineDashedMaterial({
color: 0x222222,
dashSize: 0.12,
gapSize: 0.08,
depthTest: false
});


const eraserCursor =
new THREE.LineLoop(
eraserCursorGeometry,
eraserCursorMaterial
);


eraserCursor.visible = false;
eraserCursor.renderOrder = 20;


/*
動的に形状を書き換える
カーソルなので
視錐台カリングを無効化
*/

eraserCursor.frustumCulled = false;


scene.add(
eraserCursor
);


/* ================================
地面グリッド
================================ */

/*
巨大な1枚の平面を作り、
シェーダーで1m間隔のグリッドを描く。

カメラのfarが1000mなので、
2000m四方あれば
実質的に無限の地面として見える。
*/

/*
地面グリッドと上空グリッドで共通して使う
グリッド面の大きさ。

かなり大きくして、
無限遠方まで続いて見えるようにする。
*/

const guideGridPlaneSize = 20000;


const groundGridGeometry =
new THREE.PlaneGeometry(
guideGridPlaneSize,
guideGridPlaneSize
);


const groundGridMaterial =
new THREE.ShaderMaterial({

uniforms: {

gridSize: {
value: 1.0
}
},

transparent: true,

depthTest: false,

depthWrite: false,

side: THREE.DoubleSide,

vertexShader: `
varying vec3 vWorldPosition;

void main() {

vec4 worldPosition =
modelMatrix *
vec4(
position,
1.0
);

vWorldPosition =
worldPosition.xyz;

gl_Position =
projectionMatrix *
viewMatrix *
worldPosition;
}
`,

fragmentShader: `
varying vec3 vWorldPosition;

uniform float gridSize;

void main() {

/*
gridSizeで世界座標を割ることで
グリッドの1マスの大きさを変更する
*/

vec2 gridPosition =
vWorldPosition.xz /
gridSize;


/*
線を画面上で
なめらかに表示する
*/

vec2 gridDistance =
abs(
fract(
gridPosition -
0.5
) -
0.5
) /
fwidth(
gridPosition
);


float line =
1.0 -
min(
min(
gridDistance.x,
gridDistance.y
),
1.0
);


/*
青いグリッド
*/

vec3 gridColor =
vec3(
0.25,
0.55,
1.0
);


gl_FragColor =
vec4(
gridColor,
line * 0.35
);
}
`
});


const groundGrid =
new THREE.Mesh(
groundGridGeometry,
groundGridMaterial
);


/*
PlaneGeometryは最初は縦向きなので
水平な地面にする
*/

groundGrid.rotation.x =
-Math.PI / 2;


/*
高さ0m
*/

groundGrid.position.y = 0;


/*
球体より後、
アイレベルより前に描画
*/

groundGrid.renderOrder = 9;

groundGrid.frustumCulled = false;


scene.add(
groundGrid
);


/*
高さ20mグリッド専用Material
*/

const horizontalGridMaterial =
groundGridMaterial.clone();


/*
地面より粗いマス目にする
1マス = 10m
*/

horizontalGridMaterial
.uniforms
.gridSize
.value = 10;


/* ================================
目線の高さに合わせて
グリッドサイズを変更
================================ */

function updateGroundGridSize(
eyeHeight
) {

/*
目線1.5mのとき
1マス = 1m

高さに比例して
マス目も大きくする
*/

const gridSize =
Math.sqrt(
eyeHeight / 1.5
);

groundGridMaterial
.uniforms
.gridSize
.value =
gridSize;
}


/*
初期値
目線1.5m → 1mグリッド
*/

updateGroundGridSize(
camera.position.y
);


/* ================================
縦方向の補助線
================================ */

/*
30度ごとの12方向に、
垂直線を遠方まで繰り返す。
*/

const verticalGuidePoints = [];

const verticalGuideCount = 12;


/*
垂直線同士の奥行き間隔
*/

const verticalGuideSpacing = 50;


/*
カメラのfarが1000mなので、
その少し手前まで配置する
*/

const verticalGuideMaxDistance =
950;


/*
垂直線の高さ
*/

const verticalGuideHeight = 80;


for (
let distance =
verticalGuideSpacing;

distance <=
verticalGuideMaxDistance;

distance +=
verticalGuideSpacing
) {

for (
let i = 0;
i < verticalGuideCount;
i++
) {

const angle =
(
i /
verticalGuideCount
) *
Math.PI *
2;


const x =
Math.cos(angle) *
distance;

const z =
Math.sin(angle) *
distance;


/*
地面から上方向へ
垂直線を伸ばす
*/

verticalGuidePoints.push(
new THREE.Vector3(
x,
0,
z
)
);

verticalGuidePoints.push(
new THREE.Vector3(
x,
verticalGuideHeight,
z
)
);
}
}


const verticalGuideGeometry =
new THREE.BufferGeometry()
.setFromPoints(
verticalGuidePoints
);


const verticalGuideMaterial =
new THREE.LineBasicMaterial({

color: 0x6699ff,

transparent: true,

opacity: 0.18,

depthTest: false,

depthWrite: false
});


const verticalGuides =
new THREE.LineSegments(
verticalGuideGeometry,
verticalGuideMaterial
);


verticalGuides.renderOrder = 10;

verticalGuides.frustumCulled =
false;


scene.add(
verticalGuides
);


/* ================================
高さ20mの水平グリッド
================================ */

/*
地面グリッドと
まったく同じGeometry・Materialを使い、
高さ20mに1枚だけ配置する
*/

const horizontalGuides =
new THREE.Mesh(
groundGridGeometry,
horizontalGridMaterial
);


horizontalGuides.rotation.x =
-Math.PI / 2;


/*
水平グリッドは
常に目線より30m上へ配置する
*/

function updateHorizontalGuideHeight(
eyeHeight
) {

horizontalGuides.position.y =
eyeHeight + 30;
}


updateHorizontalGuideHeight(
camera.position.y
);


/*
補助線として前面に表示
*/

horizontalGuides.renderOrder =
8;

horizontalGuides.frustumCulled =
false;


scene.add(
horizontalGuides
);

/* ================================
視点回転
================================ */

let isSpacePressed = false;
let isZPressed = false;

let isLooking = false;
let isZooming = false;

let previousMouseX = 0;
let previousMouseY = 0;

let yaw = 0;
let pitch = 0;

/* ================================
ペン描画
================================ */

const raycaster =
new THREE.Raycaster();

const pointer =
new THREE.Vector2();

let isDrawing = false;

let previousPaintX = null;
let previousPaintY = null;

let previousMidX = null;
let previousMidY = null;


/* ================================
Undo / Redo
================================ */

/*
完了したストロークの履歴
*/

const strokeHistory = [];


/*
Undoしたストロークの履歴
*/

const redoStrokeHistory = [];


/*
現在描画中のストローク
*/

let currentStroke = null;


/* ================================
高速Undo / Redo
================================ */

/*
Canvasを小さなタイルに分け、
ストロークが触ったタイルだけ
描画前の状態を保存する。

128 × 128pxにすることで、
短い線でも保存メモリが
大きくなりすぎないようにする。
*/

const HISTORY_TILE_SIZE = 128;


/*
X座標を360°Canvas内へ戻す
*/

function wrapHistoryX(
x,
width
) {

return (
(x % width) +
width
) % width;
}


/*
指定された範囲に含まれる
タイルを描画前に保存する
*/

function captureStrokeTiles(
stroke,
minX,
minY,
maxX,
maxY
) {

if (
!stroke ||
!(stroke.tileDiffs instanceof Map)
) {
return;
}


const layer =
getLayerById(
stroke.layerId
);


if (!layer) {
return;
}


const canvas =
layer.canvas;

const context =
layer.context;


const yStart =
Math.max(
0,
Math.floor(minY)
);

const yEnd =
Math.min(
canvas.height - 1,
Math.ceil(maxY)
);


if (yEnd < yStart) {
return;
}


/*
横方向の一部分を
タイル単位で保存する
*/

function captureXRange(
rangeStart,
rangeEnd
) {

const xStart =
Math.max(
0,
Math.floor(rangeStart)
);

const xEnd =
Math.min(
canvas.width - 1,
Math.ceil(rangeEnd)
);


if (xEnd < xStart) {
return;
}


const firstTileX =
Math.floor(
xStart /
HISTORY_TILE_SIZE
);

const lastTileX =
Math.floor(
xEnd /
HISTORY_TILE_SIZE
);

const firstTileY =
Math.floor(
yStart /
HISTORY_TILE_SIZE
);

const lastTileY =
Math.floor(
yEnd /
HISTORY_TILE_SIZE
);


for (
let tileY = firstTileY;
tileY <= lastTileY;
tileY++
) {

for (
let tileX = firstTileX;
tileX <= lastTileX;
tileX++
) {

const key =
`${tileX}:${tileY}`;


/*
同じストローク内で
同じタイルは一度だけ保存
*/

if (
stroke.tileDiffs.has(
key
)
) {
continue;
}


const x =
tileX *
HISTORY_TILE_SIZE;

const y =
tileY *
HISTORY_TILE_SIZE;


const width =
Math.min(
HISTORY_TILE_SIZE,
canvas.width - x
);

const height =
Math.min(
HISTORY_TILE_SIZE,
canvas.height - y
);


stroke.tileDiffs.set(
key,
{
x,
y,
width,
height,

imageData:
context.getImageData(
x,
y,
width,
height
)
}
);
}
}
}


const spanX =
Math.max(
0,
maxX - minX
);


/*
Canvas一周以上なら
横方向すべてを保存
*/

if (
spanX >= canvas.width
) {

captureXRange(
0,
canvas.width - 1
);

return;
}


/*
左右端をまたぐ場合にも
正しくタイルを保存する
*/

const wrappedStart =
wrapHistoryX(
minX,
canvas.width
);

const wrappedEnd =
wrappedStart +
spanX;


if (
wrappedEnd <
canvas.width
) {

captureXRange(
wrappedStart,
wrappedEnd
);

} else {

captureXRange(
wrappedStart,
canvas.width - 1
);

captureXRange(
0,
wrappedEnd -
canvas.width
);
}
}


/*
Undo / Redo時には、
保存してあるタイルと
現在のタイルを交換する。

同じ処理をもう一度行えば
Redoになる。
*/

function swapStrokeTiles(
stroke
) {

if (
!stroke ||
!(stroke.tileDiffs instanceof Map) ||
stroke.tileDiffs.size === 0
) {
return false;
}


const layer =
getLayerById(
stroke.layerId
);


if (!layer) {
return false;
}


const context =
layer.context;


for (
const tile of
stroke.tileDiffs.values()
) {

const currentImage =
context.getImageData(
tile.x,
tile.y,
tile.width,
tile.height
);


context.putImageData(
tile.imageData,
tile.x,
tile.y
);


/*
保存内容を現在状態へ交換する。
これにより同じ関数で
UndoとRedoの両方に対応できる。
*/

tile.imageData =
currentImage;
}


return true;
}


/*
ペン設定
*/

let penColor = "#000000";


function setPenColor(
color
) {

const normalizedColor =
String(color)
.toLowerCase();


penColor =
normalizedColor;


penColorInput.value =
normalizedColor;


/*
スマートフォン用
現在色表示
*/

mobileColorButton
.style
.backgroundColor =
normalizedColor;


/*
PC用の
現在色表示も更新する
*/

currentPenColorSwatch
.style
.backgroundColor =
normalizedColor;


/*
中央の彩度・明度Boxへ
色を同期する
*/

if (
colorBoxPicker.color.hexString
.toLowerCase() !==
normalizedColor
) {

colorBoxPicker.color.hexString =
normalizedColor;
}


/*
色相環のハンドルも
現在色へ同期する
*/

const hsv =
colorBoxPicker.color.hsv;


currentHue =
hsv.h;


updateHueRingHandle(
currentHue
);
}

/*
外側の色相環は
iro.jsではなくCSSで表示する。

JavaScriptでは
選択ハンドルだけを管理する。
*/

const colorHueHandle =
document.getElementById(
"colorHueHandle"
);


let currentHue = 0;
/*
中央の
彩度・明度ボックス
*/

const colorBoxPicker =
new iro.ColorPicker(
colorBoxLayer,
{
width: 64,

color: {
h: 0,
s: 0,
v: 0
},

borderWidth: 1,
borderColor: "#777",

padding: 0,

layout: [
{
component:
iro.ui.Box,

options: {
boxHeight: 64
}
}
]
}
);

/* ================================
色相環
================================ */


/*
色相から
ハンドル位置を更新する
*/

function updateHueRingHandle(
hue
) {

const size =
colorWheelLayer
.clientWidth;


if (size <= 0) {
return;
}


const center =
size / 2;


/*
リング幅24pxなので
その中央をハンドルが通る
*/

const radius =
center - 12;


/*
0°を円の上側にする
*/

const angle =
(
hue - 90
) *
Math.PI /
180;


const x =
center +
Math.cos(angle) *
radius;


const y =
center +
Math.sin(angle) *
radius;


colorHueHandle.style.left =
`${x}px`;

colorHueHandle.style.top =
`${y}px`;
}


/*
ポインター位置から
色相を求める
*/

function updateHueFromPointer(
event,
checkRingArea = false
) {

const rect =
colorWheelLayer
.getBoundingClientRect();


const centerX =
rect.left +
rect.width / 2;

const centerY =
rect.top +
rect.height / 2;


const dx =
event.clientX -
centerX;

const dy =
event.clientY -
centerY;


const distance =
Math.hypot(
dx,
dy
);


const outerRadius =
rect.width / 2;


const innerRadius =
outerRadius - 24;


/*
最初に押した位置が
リング上でなければ
色相操作を開始しない
*/

if (
checkRingArea &&
(
distance <
innerRadius ||
distance >
outerRadius
)
) {

return false;
}


/*
上 = 0°
右 = 90°
下 = 180°
左 = 270°
*/

let hue =
(
Math.atan2(
dy,
dx
) *
180 /
Math.PI +
90
);


hue =
(
hue +
360
) % 360;


currentHue =
hue;


const hsv =
colorBoxPicker
.color
.hsv;


/*
彩度・明度はそのまま、
色相だけ変更する
*/

colorBoxPicker.color.hsv = {
h: hue,
s: hsv.s,
v: hsv.v
};


updateHueRingHandle(
hue
);


return true;
}


let isHueDragging = false;


colorWheelLayer.addEventListener(
"pointerdown",
(event) => {

const started =
updateHueFromPointer(
event,
true
);


if (!started) {
return;
}


isHueDragging =
true;


colorWheelLayer
.setPointerCapture(
event.pointerId
);


event.preventDefault();
event.stopPropagation();
}
);


colorWheelLayer.addEventListener(
"pointermove",
(event) => {

if (!isHueDragging) {
return;
}


updateHueFromPointer(
event
);


event.preventDefault();
event.stopPropagation();
}
);


function finishHuePointer(
event
) {

if (!isHueDragging) {
return;
}


isHueDragging =
false;


if (
colorWheelLayer
.hasPointerCapture(
event.pointerId
)
) {

colorWheelLayer
.releasePointerCapture(
event.pointerId
);
}


event.stopPropagation();
}


colorWheelLayer.addEventListener(
"pointerup",
finishHuePointer
);


colorWheelLayer.addEventListener(
"pointercancel",
finishHuePointer
);


/*
================================
外側リング
色相変更
================================
*/




/*
================================
中央ボックス
彩度・明度変更
================================
*/

colorBoxPicker.on(
"color:change",
(color) => {

const normalizedColor =
color.hexString
.toLowerCase();


/*
選択した色を
実際のペン色へ反映する
*/

penColor =
normalizedColor;


/*
hiddenのカラー入力も同期
*/

penColorInput.value =
normalizedColor;


/*
スマートフォンの
現在色表示も同期
*/

mobileColorButton
.style
.backgroundColor =
normalizedColor;


/*
PC用の
現在色表示も同期する
*/

currentPenColorSwatch
.style
.backgroundColor =
normalizedColor;


/*
色相環のハンドルを
現在の色相へ同期する
*/

const hsv =
color.hsv;


currentHue =
hsv.h;


updateHueRingHandle(
currentHue
);
}
);

/* ================================
45°回転したSVひし形の操作
================================ */

let isColorBoxDragging = false;


/*
画面上のポインター座標を
45°回転前のBox座標へ戻して、
彩度・明度へ変換する
*/

function updateColorBoxFromPointer(
event
) {

const rect =
colorBoxLayer
.getBoundingClientRect();


/*
回転後の要素の中心
*/

const centerX =
rect.left +
rect.width / 2;

const centerY =
rect.top +
rect.height / 2;


/*
中心から見た
マウス／指の位置
*/

const dx =
event.clientX -
centerX;

const dy =
event.clientY -
centerY;


/*
CSSで時計回り45°回しているので、
座標を反時計回り45°戻す
*/

const angle =
Math.PI / 4;

const cos =
Math.cos(angle);

const sin =
Math.sin(angle);


const boxSize =
colorBoxLayer.offsetWidth;


const localX =
dx * cos +
dy * sin +
boxSize / 2;

const localY =
-dx * sin +
dy * cos +
boxSize / 2;


/*
Boxの範囲内へ収める
*/

const x =
Math.max(
0,
Math.min(
boxSize,
localX
)
);

const y =
Math.max(
0,
Math.min(
boxSize,
localY
)
);


/*
横軸：彩度
縦軸：明度
*/

const saturation =
(
x /
boxSize
) * 100;

const value =
100 -
(
y /
boxSize
) * 100;


const currentHSV =
colorBoxPicker
.color
.hsv;


colorBoxPicker.color.hsv = {
h: currentHSV.h,
s: saturation,
v: value
};
}


/*
ひし形を押した
*/

colorBoxLayer.addEventListener(
"pointerdown",
(event) => {

isColorBoxDragging =
true;


colorBoxLayer
.setPointerCapture(
event.pointerId
);


updateColorBoxFromPointer(
event
);


event.preventDefault();
event.stopPropagation();
}
);


/*
ひし形上をドラッグ
*/

colorBoxLayer.addEventListener(
"pointermove",
(event) => {

if (!isColorBoxDragging) {
return;
}


updateColorBoxFromPointer(
event
);


event.preventDefault();
event.stopPropagation();
}
);


/*
操作終了
*/

function finishColorBoxPointer(
event
) {

if (!isColorBoxDragging) {
return;
}


isColorBoxDragging =
false;


if (
colorBoxLayer
.hasPointerCapture(
event.pointerId
)
) {

colorBoxLayer
.releasePointerCapture(
event.pointerId
);
}


event.stopPropagation();
}


colorBoxLayer.addEventListener(
"pointerup",
finishColorBoxPointer
);


colorBoxLayer.addEventListener(
"pointercancel",
finishColorBoxPointer
);


/* ================================
スマートフォン用
カラーホイール
================================ */

function openMobileColorPicker() {

if (!isMobileDevice) {
return;
}


penColorControl.classList.add(
"is-mobile-color-open"
);


mobileColorBackdrop.classList.add(
"is-open"
);


mobileColorButton.setAttribute(
"aria-expanded",
"true"
);
}


function closeMobileColorPicker() {

penColorControl.classList.remove(
"is-mobile-color-open"
);


mobileColorBackdrop.classList.remove(
"is-open"
);


mobileColorButton.setAttribute(
"aria-expanded",
"false"
);
}


mobileColorButton.addEventListener(
"click",
() => {

if (!isMobileDevice) {
return;
}


if (
penColorControl.classList.contains(
"is-mobile-color-open"
)
) {

closeMobileColorPicker();

} else {

openMobileColorPicker();
}
}
);


mobileColorBackdrop.addEventListener(
"click",
() => {

closeMobileColorPicker();
}
);


let penSize = 3;
let savedPenSize = 3;
let savedEraserSize = 10;


/* ================================
ペンサイズ
================================ */

penSizeInput.addEventListener(
"input",
() => {

penSize =
Number(
penSizeInput.value
);

penSizeValue.value =
penSize;


if (currentTool === "pen") {

savedPenSize =
penSize;

} else if (
currentTool === "eraser"
) {

savedEraserSize =
penSize;
}
}
);


penSizeValue.addEventListener(
"input",
() => {

let value =
Number(
penSizeValue.value
);


if (!Number.isFinite(value)) {
return;
}


value =
Math.max(
1,
Math.min(
50,
value
)
);


penSize =
value;

penSizeInput.value =
value;


if (currentTool === "pen") {

savedPenSize =
penSize;

} else if (
currentTool === "eraser"
) {

savedEraserSize =
penSize;
}
}
);


/*
スマートフォンでは
Enterで太さを確定して
入力欄からフォーカスを外す
*/

penSizeValue.addEventListener(
"keydown",
(event) => {

if (
!isMobileDevice ||
event.key !== "Enter"
) {
return;
}


event.preventDefault();


let value =
Number(
penSizeValue.value
);


/*
不正な値の場合は
現在の太さへ戻す
*/

if (!Number.isFinite(value)) {

penSizeValue.value =
penSize;

penSizeValue.blur();

return;
}


/*
1～50の範囲に収めて確定
*/

value =
Math.max(
1,
Math.min(
50,
value
)
);


penSize =
value;

penSizeInput.value =
value;

penSizeValue.value =
value;


if (currentTool === "pen") {

savedPenSize =
penSize;

} else if (
currentTool === "eraser"
) {

savedEraserSize =
penSize;
}


/*
数字キーボードを閉じる
*/

penSizeValue.blur();
}
);


/*
太さ −
*/

penSizeMinus.addEventListener(
"click",
() => {

penSize =
Math.max(
1,
penSize - 1
);

penSizeInput.value =
penSize;

penSizeValue.value =
penSize;


if (currentTool === "pen") {

savedPenSize =
penSize;

} else if (
currentTool === "eraser"
) {

savedEraserSize =
penSize;
}
}
);


/*
太さ ＋
*/

penSizePlus.addEventListener(
"click",
() => {

penSize =
Math.min(
50,
penSize + 1
);

penSizeInput.value =
penSize;

penSizeValue.value =
penSize;


if (currentTool === "pen") {

savedPenSize =
penSize;

} else if (
currentTool === "eraser"
) {

savedEraserSize =
penSize;
}
}
);


/* ================================
ペン色
================================ */

let recentColors = [];


function renderRecentColors() {

recentColorsElement.innerHTML = "";


/*
スマートフォンでは
最近使用した色を表示しない
*/

if (isMobileDevice) {
return;
}


/*
常に4色 × 2段の
8マスを表示する
*/

for (
let i = 0;
i < 8;
i++
) {

const color =
recentColors[i] || null;

const button =
document.createElement("button");

button.type =
"button";

button.className =
"recent-color-button";


if (!color) {

button.classList.add(
"is-empty"
);

button.disabled = true;

} else {

button.style.backgroundColor =
color;

button.title =
color;


button.addEventListener(
"click",
() => {

setPenColor(
color
);

rememberColor(
color
);
}
);
}


recentColorsElement.appendChild(
button
);
}
}


function rememberColor(color) {

if (
typeof color !== "string" ||
!/^#[0-9a-fA-F]{6}$/.test(color)
) {
return;
}


const normalizedColor =
color.toLowerCase();


recentColors =
[
normalizedColor,
...recentColors.filter(
(item) =>
item !== normalizedColor
)
].slice(0, 8);


renderRecentColors();
}


penColorInput.addEventListener(
"input",
() => {

setPenColor(
penColorInput.value
);
}
);


penColorInput.addEventListener(
"change",
() => {

rememberColor(
penColorInput.value
);
}
);


rememberColor(
penColor
);


/*
現在選択しているツール

pen
eraser
bucket
eyedropper
*/

let currentTool = "pen";


/*
ストローク履歴は
描画開始時と終了時に記録する
*/






function updateEraserCursor(event) {

/*
視点回転・ズーム中は
カーソルを表示しない
*/

if (
currentTool === "bucket" ||
currentTool === "eyedropper" ||
currentTool === "look" ||
isLooking ||
isZooming
) {

eraserCursor.visible = false;

return;
}

const rect =
renderer.domElement
.getBoundingClientRect();


/*
実際の描画と同じ方法で
マウス位置をThree.js座標へ変換
*/

pointer.x =
(
(event.clientX - rect.left) /
rect.width
) * 2 - 1;

pointer.y =
-(
(
event.clientY - rect.top
) /
rect.height
) * 2 + 1;


/*
実際の描画と同じRaycast
*/

raycaster.setFromCamera(
pointer,
camera
);


const intersections =
raycaster.intersectObject(
sphere,
false
);


if (intersections.length === 0) {

eraserCursor.visible = false;

return;
}


const intersection =
intersections[0];


/*
カーソル直下の色を調べて
明るい場所では黒、
暗い場所では白にする
*/

if (intersection.uv) {

const sampleX =
Math.max(
0,
Math.min(
paintCanvas.width - 1,
Math.floor(
intersection.uv.x *
paintCanvas.width
)
)
);

const sampleY =
Math.max(
0,
Math.min(
paintCanvas.height - 1,
Math.floor(
(1 - intersection.uv.y) *
paintCanvas.height
)
)
);


const pixel =
paintContext.getImageData(
sampleX,
sampleY,
1,
1
).data;


const brightness =
pixel[0] * 0.2126 +
pixel[1] * 0.7152 +
pixel[2] * 0.0722;


if (brightness < 140) {

eraserCursorMaterial.color.setHex(
0xffffff
);

} else {

eraserCursorMaterial.color.setHex(
0x222222
);
}
}


const centerDirection =
intersection.point
.clone()
.normalize();


/*
球面上で円を作るための
直交する2方向
*/

let tangentX =
new THREE.Vector3(
0,
1,
0
);


if (
Math.abs(
centerDirection.dot(
tangentX
)
) > 0.95
) {

tangentX.set(
1,
0,
0
);
}


tangentX
.cross(
centerDirection
)
.normalize();


const tangentY =
centerDirection
.clone()
.cross(
tangentX
)
.normalize();


/*
消しゴム直径penSize pxの
半径を球面角度へ変換
*/

const angularRadius =
(
penSize /
drawCanvas.width
) *
Math.PI;


/*
球体より少し内側に表示
*/

const cursorRadius = 49.8;

const points = [];

const segments = 64;


for (
let i = 0;
i < segments;
i++
) {

const angle =
(
i /
segments
) *
Math.PI *
2;


const direction =
centerDirection
.clone()
.multiplyScalar(
Math.cos(
angularRadius
)
)
.add(
tangentX
.clone()
.multiplyScalar(
Math.sin(
angularRadius
) *
Math.cos(angle)
)
)
.add(
tangentY
.clone()
.multiplyScalar(
Math.sin(
angularRadius
) *
Math.sin(angle)
)
)
.normalize();


points.push(
direction.multiplyScalar(
cursorRadius
)
);
}


eraserCursorGeometry
.setFromPoints(
points
);

eraserCursor.computeLineDistances();

eraserCursor.visible = true;
}


function getPaintPosition(event) {

const rect =
renderer.domElement.getBoundingClientRect();


/*
マウス位置を
Three.jsの座標系
-1 ～ +1 に変換
*/

pointer.x =
(
(event.clientX - rect.left) /
rect.width
) * 2 - 1;

pointer.y =
-(
(
event.clientY - rect.top
) /
rect.height
) * 2 + 1;


/*
カメラからRayを飛ばす
*/

raycaster.setFromCamera(
pointer,
camera
);


/*
球体との交点を調べる
*/

const intersections =
raycaster.intersectObject(
sphere,
false
);


if (intersections.length === 0) {
return null;
}


const intersection =
intersections[0];

if (!intersection.uv) {
return null;
}


/*
UV座標
↓
Canvas座標
*/

const u =
intersection.uv.x;

const v =
intersection.uv.y;

/*
UV座標を
編集用Canvasの座標へ変換
*/

const x =
u * drawCanvas.width;

const y =
(1 - v) *
drawCanvas.height;


return {
x,
y
};
}

/* ================================
スポイト
================================ */

function pickColorAt(
x,
y
) {

/*
背景と表示中の全レイヤーを
最新状態で合成してから色を取得する
*/

updatePaintCanvas();


const sampleX =
Math.max(
0,
Math.min(
paintCanvas.width - 1,
Math.floor(x)
)
);

const sampleY =
Math.max(
0,
Math.min(
paintCanvas.height - 1,
Math.floor(y)
)
);


const pixel =
paintContext.getImageData(
sampleX,
sampleY,
1,
1
).data;


const toHex =
(value) =>
value
.toString(16)
.padStart(2, "0");


const color =
`#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;


setPenColor(
color
);


rememberColor(
color
);
}


/* ================================
バケツ塗り
================================ */

function hexToRgba(hex) {

const value =
hex.replace("#", "");

return [
parseInt(value.slice(0, 2), 16),
parseInt(value.slice(2, 4), 16),
parseInt(value.slice(4, 6), 16),
255
];
}


function floodFill(
x,
y,
fillColor,
layerId,
historyAction = null
) {

const layer =
getLayerById(layerId);

if (!layer) {
return false;
}


const fillCanvas =
layer.canvas;

const fillContext =
layer.context;


const width =
fillCanvas.width;

const height =
fillCanvas.height;


const startX =
Math.max(
0,
Math.min(
width - 1,
Math.floor(x)
)
);

const startY =
Math.max(
0,
Math.min(
height - 1,
Math.floor(y)
)
);


/*
バケツの境界判定用Canvas。

表示中の全レイヤーを合成し、
選択中レイヤーだけではなく
レイヤーを横断して塗る範囲を決める。
*/

const referenceCanvas =
document.createElement("canvas");

referenceCanvas.width =
width;

referenceCanvas.height =
height;


const referenceContext =
referenceCanvas.getContext("2d");

referenceContext.imageSmoothingEnabled =
false;


for (const referenceLayer of layers) {

if (!referenceLayer.visible) {
continue;
}

referenceContext.globalAlpha =
typeof referenceLayer.opacity ===
"number"
? referenceLayer.opacity
: 1;


referenceContext.drawImage(
referenceLayer.canvas,
0,
0
);


referenceContext.globalAlpha =
1;
}


const referenceImageData =
referenceContext.getImageData(
0,
0,
width,
height
);

const referenceData =
referenceImageData.data;


/*
実際に色を書き込むのは
選択中のレイヤーだけ
*/

const fillImageData =
fillContext.getImageData(
0,
0,
width,
height
);

const fillData =
fillImageData.data;


const startOffset =
(
startY * width +
startX
) * 4;


const targetR =
referenceData[startOffset];

const targetG =
referenceData[startOffset + 1];

const targetB =
referenceData[startOffset + 2];

const targetA =
referenceData[startOffset + 3];


const [
fillR,
fillG,
fillB,
fillA
] =
hexToRgba(fillColor);


function isTarget(offset) {

/*
透明部分はRGB値に関係なく
同じ領域として扱う。

アンチエイリアスによる
薄い半透明ピクセルも
塗り領域として扱う。
*/

if (targetA <= 64) {

return (
referenceData[offset + 3] <= 64
);
}


return (
referenceData[offset] === targetR &&
referenceData[offset + 1] === targetG &&
referenceData[offset + 2] === targetB &&
referenceData[offset + 3] === targetA
);
}


const queue =
new Int32Array(
width * height
);

const visited =
new Uint8Array(
width * height
);

let head = 0;
let tail = 0;
let changed = false;


function paintAndQueue(
pixelX,
pixelY
) {

const pixelIndex =
pixelY * width +
pixelX;


if (visited[pixelIndex]) {
return;
}


const offset =
pixelIndex * 4;


if (!isTarget(offset)) {
return;
}


visited[pixelIndex] = 1;


if (
fillData[offset] !== fillR ||
fillData[offset + 1] !== fillG ||
fillData[offset + 2] !== fillB ||
fillData[offset + 3] !== fillA
) {

changed = true;
}


fillData[offset] =
fillR;

fillData[offset + 1] =
fillG;

fillData[offset + 2] =
fillB;

fillData[offset + 3] =
fillA;


queue[tail] =
pixelIndex;

tail++;
}


paintAndQueue(
startX,
startY
);


while (head < tail) {

const pixelIndex =
queue[head];

head++;


const pixelX =
pixelIndex % width;

const pixelY =
Math.floor(
pixelIndex / width
);


/*
360°画像なので
左右端をつなげる
*/

const leftX =
pixelX === 0
? width - 1
: pixelX - 1;

const rightX =
pixelX === width - 1
? 0
: pixelX + 1;


paintAndQueue(
leftX,
pixelY
);

paintAndQueue(
rightX,
pixelY
);


if (pixelY > 0) {

paintAndQueue(
pixelX,
pixelY - 1
);
}


if (pixelY < height - 1) {

paintAndQueue(
pixelX,
pixelY + 1
);
}
}


/*
塗り残し防止。

flood fillで確定した領域から
境界方向へ1pxだけ塗りを広げる。

このピクセルは次の探索には使わないため、
線を越えて反対側まで
塗りが漏れることはない。
*/

const edgePainted =
new Uint8Array(
width * height
);


function paintUnderEdge(
pixelIndex
) {

/*
本来の塗り領域は
すでに処理済み
*/

if (
visited[pixelIndex] ||
edgePainted[pixelIndex]
) {
return;
}


const offset =
pixelIndex * 4;


/*
透明部分には広げない。

アンチエイリアスされた線など、
境界として認識されたピクセルだけを
対象にする。
*/

if (
referenceData[
offset + 3
] <= 64
) {
return;
}


edgePainted[pixelIndex] =
1;


/*
このレイヤーにすでに線がある場合は、
線を消さず、その「下」に
塗り色がある状態を計算する。
*/

const existingAlpha =
fillData[
offset + 3
] / 255;


const backgroundRatio =
1 - existingAlpha;


const nextR =
Math.round(
fillData[offset] *
existingAlpha +
fillR *
backgroundRatio
);


const nextG =
Math.round(
fillData[offset + 1] *
existingAlpha +
fillG *
backgroundRatio
);


const nextB =
Math.round(
fillData[offset + 2] *
existingAlpha +
fillB *
backgroundRatio
);


if (
fillData[offset] !== nextR ||
fillData[offset + 1] !==
nextG ||
fillData[offset + 2] !==
nextB ||
fillData[offset + 3] !==
255
) {

changed = true;
}


fillData[offset] =
nextR;

fillData[offset + 1] =
nextG;

fillData[offset + 2] =
nextB;

fillData[offset + 3] =
255;
}


/*
flood fillで塗ったすべてのピクセルを
基準として、その周囲8方向を調べる。

斜め線の角にも塗り残しが
出ないよう8方向にしている。
*/

for (
let i = 0;
i < tail;
i++
) {

const pixelIndex =
queue[i];


const pixelX =
pixelIndex % width;


const pixelY =
Math.floor(
pixelIndex / width
);


for (
let offsetY = -1;
offsetY <= 1;
offsetY++
) {

const nextY =
pixelY + offsetY;


if (
nextY < 0 ||
nextY >= height
) {
continue;
}


for (
let offsetX = -1;
offsetX <= 1;
offsetX++
) {

if (
offsetX === 0 &&
offsetY === 0
) {
continue;
}


/*
360°画像なので
左右端はつなげる
*/

let nextX =
pixelX + offsetX;


if (nextX < 0) {

nextX =
width - 1;

} else if (
nextX >= width
) {

nextX = 0;
}


const nextIndex =
nextY * width +
nextX;


paintUnderEdge(
nextIndex
);
}
}
}


if (!changed) {
return false;
}


/*
差分Undo用。

flood fillで実際に変更対象となった
ピクセル（visited と edgePainted）から
変更範囲を求め、
putImageDataする前のキャンバス状態を
タイル単位で保存する。
*/

if (
historyAction &&
historyAction.tileDiffs instanceof Map
) {

let minChangedX = width;
let minChangedY = height;

let maxChangedX = -1;
let maxChangedY = -1;


for (
let i = 0;
i < visited.length;
i++
) {

if (
!visited[i] &&
!edgePainted[i]
) {
continue;
}


const x =
i % width;

const y =
Math.floor(i / width);


if (x < minChangedX) {
minChangedX = x;
}

if (y < minChangedY) {
minChangedY = y;
}

if (x > maxChangedX) {
maxChangedX = x;
}

if (y > maxChangedY) {
maxChangedY = y;
}
}


if (
maxChangedX >= 0 &&
maxChangedY >= 0
) {

captureStrokeTiles(
historyAction,
minChangedX,
minChangedY,
maxChangedX,
maxChangedY
);
}
}


fillContext.putImageData(
fillImageData,
0,
0
);


return true;
}

/* ================================
出力サイズ
================================ */

canvasSizeSelect.addEventListener(
"change",
() => {

outputWidth =
Number(
canvasSizeSelect.value
);

outputHeight =
outputWidth / 2;
}
);


/* ================================
目線の高さ
================================ */

eyeHeightInput.addEventListener(
"input",
() => {

const eyeHeight =
Number(
eyeHeightInput.value
);

camera.position.y =
eyeHeight;

updateGroundGridSize(
eyeHeight
);

updateHorizontalGuideHeight(
eyeHeight
);

eyeHeightValue.value =
eyeHeight.toFixed(1);
}
);


eyeHeightValue.addEventListener(
"input",
() => {

let eyeHeight =
Number(
eyeHeightValue.value
);


if (!Number.isFinite(eyeHeight)) {
return;
}


eyeHeight =
Math.max(
0.5,
Math.min(
30,
eyeHeight
)
);


camera.position.y =
eyeHeight;

updateGroundGridSize(
eyeHeight
);

updateHorizontalGuideHeight(
eyeHeight
);

eyeHeightInput.value =
eyeHeight;
}
);

/*
目線 −
*/

eyeHeightMinus.addEventListener(
"click",
() => {

let eyeHeight =
Number(
eyeHeightInput.value
);

eyeHeight =
Math.max(
0.5,
eyeHeight - 0.1
);

eyeHeight =
Number(
eyeHeight.toFixed(1)
);

camera.position.y =
eyeHeight;

updateGroundGridSize(
eyeHeight
);

updateHorizontalGuideHeight(
eyeHeight
);

eyeHeightInput.value =
eyeHeight;

eyeHeightValue.value =
eyeHeight.toFixed(1);
}
);


/*
目線 ＋
*/

eyeHeightPlus.addEventListener(
"click",
() => {

let eyeHeight =
Number(
eyeHeightInput.value
);

eyeHeight =
Math.min(
30,
eyeHeight + 0.1
);

eyeHeight =
Number(
eyeHeight.toFixed(1)
);

camera.position.y =
eyeHeight;

updateGroundGridSize(
eyeHeight
);

updateHorizontalGuideHeight(
eyeHeight
);

eyeHeightInput.value =
eyeHeight;

eyeHeightValue.value =
eyeHeight.toFixed(1);
}
);

/* ================================
ガイド表示
================================ */

groundToggle.addEventListener(
"change",
() => {

groundGrid.visible =
groundToggle.checked;

verticalGuides.visible =
groundToggle.checked;

horizontalGuides.visible =
groundToggle.checked;
}
);



/* ================================
パネル移動
================================ */

function makePanelDraggable(
panel
) {

if (!panel) {
return;
}


let isDraggingPanel = false;

let startPointerX = 0;
let startPointerY = 0;

let startPanelLeft = 0;
let startPanelTop = 0;


panel.addEventListener(
"pointerdown",
(event) => {

/*
スマートフォンでは
パネルを下部固定にするため
ドラッグ移動を無効にする
*/

if (
window.matchMedia(
"(max-width: 700px)"
).matches
) {
return;
}


/*
左クリック以外では
移動を開始しない
*/

if (event.button !== 0) {
return;
}


/*
ボタンや入力欄などを
操作しているときは
パネルを移動しない
*/

if (
event.target.closest(
[
"button",
"input",
"select",
"textarea",
"label",
"a",
".pen-color-control",
".recent-colors"
].join(",")
)
) {

return;
}


const rect =
panel.getBoundingClientRect();


isDraggingPanel = true;

startPointerX =
event.clientX;

startPointerY =
event.clientY;

startPanelLeft =
rect.left;

startPanelTop =
rect.top;


/*
右基準で配置されている
レイヤーパネルも、
ドラッグ開始時に
左上基準へ切り替える
*/

panel.style.left =
`${rect.left}px`;

panel.style.top =
`${rect.top}px`;

panel.style.right =
"auto";

panel.style.bottom =
"auto";


panel.classList.add(
"is-dragging"
);


document.body.style.userSelect =
"none";


event.preventDefault();
}
);


window.addEventListener(
"pointermove",
(event) => {

if (!isDraggingPanel) {
return;
}


const deltaX =
event.clientX -
startPointerX;

const deltaY =
event.clientY -
startPointerY;


/*
画面外へ完全に
出てしまわないよう制限
*/

const maxLeft =
Math.max(
0,
window.innerWidth -
panel.offsetWidth
);


/*
上部ツールバー48pxを
避けるため52pxから下にする
*/

const minTop = 52;

const maxTop =
Math.max(
minTop,
window.innerHeight -
panel.offsetHeight
);


const nextLeft =
Math.max(
0,
Math.min(
maxLeft,
startPanelLeft +
deltaX
)
);


const nextTop =
Math.max(
minTop,
Math.min(
maxTop,
startPanelTop +
deltaY
)
);


panel.style.left =
`${nextLeft}px`;

panel.style.top =
`${nextTop}px`;
}
);


function stopPanelDrag() {

if (!isDraggingPanel) {
return;
}


isDraggingPanel = false;


panel.classList.remove(
"is-dragging"
);


document.body.style.userSelect =
"";
}


window.addEventListener(
"pointerup",
stopPanelDrag
);


window.addEventListener(
"pointercancel",
stopPanelDrag
);
}


/*
左：ツールパネル
*/

makePanelDraggable(
document.querySelector(
".drawing-tools"
)
);


/*
右：レイヤーパネル
*/

makePanelDraggable(
document.querySelector(
".layer-panel"
)
);


/* ================================
スマートフォン用
下部パネル切り替え
================================ */

const mobileBottomTabButtons =
document.querySelectorAll(
".mobile-bottom-tab"
);

const drawingToolsPanel =
document.querySelector(
".drawing-tools"
);

const layerPanel =
document.querySelector(
".layer-panel"
);

const settingsPanel =
document.querySelector(
".toolbar__tools"
);


function updateMobileViewportSize() {

/*
PCでは通常サイズへ戻す
*/

if (
!window.matchMedia(
"(max-width: 700px)"
).matches
) {

viewport.style.height = "";

} else {

/*
現在開いている
下部パネルを取得
*/

const openPanel =
document.querySelector(
".drawing-tools.is-mobile-open, " +
".layer-panel.is-mobile-open, " +
".toolbar__tools.is-mobile-open"
);


const panelHeight =
openPanel
? openPanel
.getBoundingClientRect()
.height
: 0;


/*
44px = 上部ヘッダー
52px = 下部タブ

下部パネルも差し引いて、
実際に見える部分だけを
描画エリアにする
*/

viewport.style.height =
`calc(
100dvh -
44px -
52px -
${panelHeight}px -
env(safe-area-inset-bottom)
)`;
}


/*
Three.js側も
新しい描画領域サイズへ合わせる
*/

camera.aspect =
viewport.clientWidth /
viewport.clientHeight;


camera.updateProjectionMatrix();


renderer.setSize(
viewport.clientWidth,
viewport.clientHeight
);
}


function setMobilePanel(
panelName
) {

/*
描画タブから離れる場合は
カラーホイールを閉じる
*/

if (panelName !== "draw") {

closeMobileColorPicker();
}


drawingToolsPanel
?.classList
.toggle(
"is-mobile-open",
panelName === "draw"
);


layerPanel
?.classList
.toggle(
"is-mobile-open",
panelName === "layer"
);


settingsPanel
?.classList
.toggle(
"is-mobile-open",
panelName === "settings"
);


mobileBottomTabButtons.forEach(
(button) => {

button.classList.toggle(
"is-active",
button.dataset.mobilePanel ===
panelName
);
}
);


/*
displayが切り替わったあとに
パネルの実際の高さを測る
*/

requestAnimationFrame(
() => {

updateMobileViewportSize();
}
);
}


mobileBottomTabButtons.forEach(
(button) => {

button.addEventListener(
"click",
() => {

setMobilePanel(
button.dataset.mobilePanel
);
}
);
}
);


/*
初期状態では
描画パネルを表示する
*/

setMobilePanel(
"draw"
);


/* ================================
レイヤーUI
================================ */

function updateLayerActionButtons() {

const activeIndex =
layers.findIndex(
(layer) =>
layer.id === activeLayerId
);


layerUpButton.disabled =
activeIndex < 0 ||
activeIndex ===
layers.length - 1;

layerDownButton.disabled =
activeIndex <= 0;

deleteLayerButton.disabled =
layers.length <= 1;
}


/* ================================
レイヤー
ドラッグ並び替え
================================ */

let layerDragState = null;


/*
ドロップ位置の表示を消す
*/

function clearLayerDropMarkers() {

for (
const item of
layerList.querySelectorAll(
".layer-item"
)
) {

item.classList.remove(
"is-drop-before",
"is-drop-after"
);
}
}


/*
ドラッグ中の
ドロップ位置を調べる
*/

function updateLayerDragTarget(
event
) {

if (!layerDragState) {
return;
}


/*
スマートフォンで
リスト端までドラッグした場合は
少しずつスクロールする
*/

const listRect =
layerList.getBoundingClientRect();


if (
event.clientY <
listRect.top + 28
) {

layerList.scrollTop -= 12;

} else if (
event.clientY >
listRect.bottom - 28
) {

layerList.scrollTop += 12;
}


const element =
document.elementFromPoint(
event.clientX,
event.clientY
);


const targetItem =
element
?.closest(
".layer-item"
);


clearLayerDropMarkers();


layerDragState.targetLayerId =
null;


if (
!targetItem ||
targetItem ===
layerDragState.sourceItem
) {
return;
}


const targetLayerId =
Number(
targetItem.dataset.layerId
);


if (
!Number.isFinite(
targetLayerId
)
) {
return;
}


const rect =
targetItem
.getBoundingClientRect();


/*
対象レイヤーの上半分なら
その上へ。

下半分なら
その下へ配置する。
*/

const placeAfter =
event.clientY >=
rect.top +
rect.height / 2;


targetItem.classList.add(
placeAfter
? "is-drop-after"
: "is-drop-before"
);


layerDragState.targetLayerId =
targetLayerId;


layerDragState.placeAfter =
placeAfter;
}


/*
ドラッグ終了
*/

function finishLayerDrag(
commit = true
) {

if (!layerDragState) {
return;
}


const {
layerId,
targetLayerId,
placeAfter,
sourceItem
} =
layerDragState;


sourceItem.classList.remove(
"is-layer-dragging"
);


clearLayerDropMarkers();


layerDragState = null;


if (
!commit ||
targetLayerId === null ||
targetLayerId === layerId
) {
return;
}


/*
UIと同じ
上→下の配列を一時的に作る
*/

const visualLayers =
[...layers].reverse();


const draggedIndex =
visualLayers.findIndex(
(layer) =>
layer.id === layerId
);


if (draggedIndex < 0) {
return;
}


const [
draggedLayer
] =
visualLayers.splice(
draggedIndex,
1
);


const targetIndex =
visualLayers.findIndex(
(layer) =>
layer.id ===
targetLayerId
);


if (targetIndex < 0) {
return;
}


const insertIndex =
targetIndex +
(
placeAfter
? 1
: 0
);


visualLayers.splice(
insertIndex,
0,
draggedLayer
);


/*
実際のlayers配列は
下→上なので再び反転して戻す
*/

layers.splice(
0,
layers.length,
...visualLayers.reverse()
);


requestPaintUpdate();

renderLayerPanel();
}


function renderLayerPanel() {

layerList.innerHTML = "";

/*
配列は下→上の順なので、
UIでは逆順に表示する
*/

for (
let i = layers.length - 1;
i >= 0;
i--
) {

const layer =
layers[i];

const item =
document.createElement("div");

item.className =
"layer-item";


/*
ドラッグ並び替えで
対象レイヤーを判別する
*/

item.dataset.layerId =
String(
layer.id
);


if (
layer.id === activeLayerId
) {

item.classList.add(
"is-active"
);
}


const visibilityButton =
document.createElement("button");

visibilityButton.type =
"button";

visibilityButton.className =
"layer-visibility-button";

visibilityButton.textContent =
layer.visible
? "●"
: "○";

visibilityButton.title =
layer.visible
? t("hideLayer")
: t("showLayer");


visibilityButton.addEventListener(
"click",
(event) => {

event.stopPropagation();

layer.visible =
!layer.visible;

requestPaintUpdate();

renderLayerPanel();
}
);


/*
レイヤー並び替え用
ドラッグハンドル
*/

const dragHandle =
document.createElement(
"button"
);


dragHandle.type =
"button";


dragHandle.className =
"layer-drag-handle";


dragHandle.textContent =
"≡";


dragHandle.title =
t("dragReorder");


dragHandle.setAttribute(
"aria-label",
t("dragReorderAria")
);


dragHandle.addEventListener(
"pointerdown",
(event) => {

/*
PCでは左クリックだけ
*/

if (
event.pointerType ===
"mouse" &&
event.button !== 0
) {
return;
}


layerDragState = {
layerId:
layer.id,

sourceItem:
item,

targetLayerId:
null,

placeAfter:
false
};


item.classList.add(
"is-layer-dragging"
);


dragHandle
.setPointerCapture(
event.pointerId
);


event.preventDefault();

event.stopPropagation();
}
);


dragHandle.addEventListener(
"pointermove",
(event) => {

if (!layerDragState) {
return;
}


updateLayerDragTarget(
event
);


event.preventDefault();

event.stopPropagation();
}
);


dragHandle.addEventListener(
"pointerup",
(event) => {

if (!layerDragState) {
return;
}


if (
dragHandle
.hasPointerCapture(
event.pointerId
)
) {

dragHandle
.releasePointerCapture(
event.pointerId
);
}


finishLayerDrag(
true
);


event.preventDefault();

event.stopPropagation();
}
);


dragHandle.addEventListener(
"pointercancel",
(event) => {

if (
dragHandle
.hasPointerCapture(
event.pointerId
)
) {

dragHandle
.releasePointerCapture(
event.pointerId
);
}


finishLayerDrag(
false
);
}
);


/*
レイヤー名。

PC：
ダブルクリックで編集。

スマートフォン：
長押しで編集。
*/

const nameInput =
document.createElement("input");


nameInput.type =
"text";


nameInput.className =
"layer-name-input";


nameInput.value =
layer.name;


nameInput.maxLength =
80;


/*
最初は編集不可。

1回クリック／タップでは
レイヤー選択だけを行う。
*/

nameInput.readOnly =
true;


nameInput.title =
isMobileDevice
? t("editLayerNameMobile")
: t("editLayerNameDesktop");


/*
レイヤー名編集を開始する
*/

function startLayerNameEditing() {

/*
readonly状態のinputには
すでにフォーカスが当たっている
場合がある。

スマートフォンでキーボードを
確実に開き直すため、
一度フォーカスを外す。
*/

nameInput.blur();


/*
編集可能にする
*/

nameInput.readOnly =
false;


/*
pointerup / dblclick の
ユーザー操作中に
すぐフォーカスし直す。

遅延処理にはしない。
*/

nameInput.focus({
preventScroll: true
});


/*
名前全体を選択する
*/

nameInput.setSelectionRange(
0,
nameInput.value.length
);
}


/*
クリック／タップされた
レイヤーを選択する
*/

nameInput.addEventListener(
"focus",
() => {

if (
layer.id !== activeLayerId
) {

setActiveLayerReference(
layer.id
);


for (
const otherItem of
layerList.querySelectorAll(
".layer-item"
)
) {

otherItem.classList.remove(
"is-active"
);
}


item.classList.add(
"is-active"
);


updateLayerActionButtons();
}
}
);


/*
PC：
ダブルクリックで編集開始
*/

nameInput.addEventListener(
"dblclick",
(event) => {

if (isMobileDevice) {
return;
}


event.preventDefault();

event.stopPropagation();


startLayerNameEditing();
}
);


/*
================================
スマートフォン：
長押しで編集開始
================================
*/

let layerNameLongPressTimer =
null;


let layerNameLongPressReady =
false;


let layerNamePressStartX =
0;


let layerNamePressStartY =
0;


function cancelLayerNameLongPress() {

if (
layerNameLongPressTimer !==
null
) {

clearTimeout(
layerNameLongPressTimer
);


layerNameLongPressTimer =
null;
}
}


nameInput.addEventListener(
"pointerdown",
(event) => {

if (
!isMobileDevice ||
!nameInput.readOnly
) {
return;
}


layerNamePressStartX =
event.clientX;


layerNamePressStartY =
event.clientY;


layerNameLongPressReady =
false;


cancelLayerNameLongPress();


/*
約0.55秒で
長押しと判定する
*/

layerNameLongPressTimer =
setTimeout(
() => {

layerNameLongPressReady =
true;


layerNameLongPressTimer =
null;
},
550
);
}
);


/*
指が大きく動いたら
スクロール操作とみなし、
長押しをキャンセルする
*/

nameInput.addEventListener(
"pointermove",
(event) => {

if (
!isMobileDevice ||
layerNameLongPressTimer ===
null
) {
return;
}


const distance =
Math.hypot(
event.clientX -
layerNamePressStartX,

event.clientY -
layerNamePressStartY
);


if (distance > 10) {

cancelLayerNameLongPress();

layerNameLongPressReady =
false;
}
}
);


/*
長押し後に指を離したら
編集状態へ切り替える
*/

nameInput.addEventListener(
"pointerup",
(event) => {

if (!isMobileDevice) {
return;
}


cancelLayerNameLongPress();


if (
!layerNameLongPressReady
) {
return;
}


layerNameLongPressReady =
false;


/*
キーボード表示のため、
preventDefaultは行わない。

このpointerupイベント中に
編集状態へ切り替える。
*/

startLayerNameEditing();


event.stopPropagation();
}
);


nameInput.addEventListener(
"pointercancel",
() => {

cancelLayerNameLongPress();

layerNameLongPressReady =
false;
}
);


/*
名前を確定
*/

nameInput.addEventListener(
"change",
() => {

const newName =
nameInput.value.trim();


if (newName) {

layer.name =
newName;


nameInput.value =
layer.name;

} else {

nameInput.value =
layer.name;
}
}
);


/*
Enterで確定
*/

nameInput.addEventListener(
"keydown",
(event) => {

if (
event.key === "Enter" &&
!event.isComposing
) {

nameInput.blur();
}


/*
Escなら変更前へ戻す
*/

if (
event.key === "Escape"
) {

nameInput.value =
layer.name;


nameInput.blur();
}
}
);


/*
編集終了後は
再び読み取り専用へ戻す
*/

nameInput.addEventListener(
"blur",
() => {

nameInput.readOnly =
true;
}
);


/*
不透明度
*/

const opacityControl =
document.createElement("div");

opacityControl.className =
"layer-opacity-control";


const opacityHeader =
document.createElement("div");

opacityHeader.className =
"layer-opacity-header";


const opacityLabel =
document.createElement("span");

opacityLabel.textContent =
t("opacity");


const opacityValue =
document.createElement("span");

opacityValue.textContent =
`${Math.round(
(
typeof layer.opacity ===
"number"
? layer.opacity
: 1
) * 100
)}%`;


opacityHeader.appendChild(
opacityLabel
);

opacityHeader.appendChild(
opacityValue
);


const opacityInput =
document.createElement("input");

opacityInput.type =
"range";

opacityInput.min =
"0";

opacityInput.max =
"100";

opacityInput.step =
"1";

opacityInput.value =
String(
Math.round(
(
typeof layer.opacity ===
"number"
? layer.opacity
: 1
) * 100
)
);


opacityInput.addEventListener(
"input",
() => {

const value =
Number(
opacityInput.value
);


layer.opacity =
Math.max(
0,
Math.min(
1,
value / 100
)
);


opacityValue.textContent =
`${Math.round(
layer.opacity * 100
)}%`;


requestPaintUpdate();
}
);


opacityControl.appendChild(
opacityHeader
);

opacityControl.appendChild(
opacityInput
);


item.appendChild(
visibilityButton
);


item.appendChild(
nameInput
);


item.appendChild(
dragHandle
);


item.appendChild(
opacityControl
);

layerList.appendChild(
item
);
}


updateLayerActionButtons();
}


function addLayer() {

const previousActiveLayerId =
activeLayerId;


const {
canvas,
context
} =
createLayerCanvas();


const layer = {
id: nextLayerId,
name:
getDefaultLayerName(
nextLayerNumber
),
canvas,
context,
visible: true,
opacity: 1
};


nextLayerId++;
nextLayerNumber++;


const index =
layers.length;


layers.push(
layer
);


/*
レイヤー追加もUndo対象にする
*/

redoStrokeHistory.length = 0;

strokeHistory.push({
historyType: "layer-add",
layer,
index,
previousActiveLayerId
});


setActiveLayer(
layer.id
);

requestPaintUpdate();
}


function deleteActiveLayer() {

if (layers.length <= 1) {
return;
}


const index =
layers.findIndex(
(layer) =>
layer.id === activeLayerId
);

if (index < 0) {
return;
}


const deletedLayer =
layers[index];


layers.splice(
index,
1
);


if (
currentStroke &&
currentStroke.layerId ===
deletedLayer.id
) {

currentStroke = null;
isDrawing = false;
}


const nextIndex =
Math.min(
index,
layers.length - 1
);

const nextActiveLayerId =
layers[nextIndex].id;


/*
レイヤー削除もUndo対象にする。
削除したレイヤー本体を履歴へ保持するので、
描画内容と名前もそのまま復元できる。
*/

redoStrokeHistory.length = 0;

strokeHistory.push({
historyType: "layer-delete",
layer: deletedLayer,
index,
nextActiveLayerId
});


setActiveLayer(
nextActiveLayerId
);

requestPaintUpdate();
}


function moveActiveLayer(
direction
) {

const index =
layers.findIndex(
(layer) =>
layer.id === activeLayerId
);

if (index < 0) {
return;
}


const targetIndex =
index + direction;


if (
targetIndex < 0 ||
targetIndex >= layers.length
) {

return;
}


const temp =
layers[index];

layers[index] =
layers[targetIndex];

layers[targetIndex] =
temp;


requestPaintUpdate();

renderLayerPanel();
}


addLayerButton.addEventListener(
"click",
() => {

addLayer();
}
);


deleteLayerButton.addEventListener(
"click",
() => {

deleteActiveLayer();
}
);


layerUpButton.addEventListener(
"click",
() => {

moveActiveLayer(1);
}
);


layerDownButton.addEventListener(
"click",
() => {

moveActiveLayer(-1);
}
);


function toggleLanguage() {

setLanguage(
currentLanguage === "ja"
? "en"
: "ja"
);
}


languageButton.addEventListener(
"click",
() => {

toggleLanguage();
}
);


/*
スマートフォンでは
clickが正しく発火しない場合があるため、
touchendでも直接切り替える。

preventDefaultによって、
直後に生成されるclickとの
二重実行を防ぐ。
*/

languageButton.addEventListener(
"touchend",
(event) => {

event.preventDefault();
event.stopPropagation();

toggleLanguage();
},
{
passive: false
}
);


/* ================================
ショートカット設定画面
================================ */

let shortcutCaptureAction = null;

let shortcutDraftKeys = null;

let lookDirectionHorizontalDraft = null;
let lookDirectionVerticalDraft = null;


function formatShortcutKey(
key
) {

if (key === "space") {
return "Space";
}


if (key.length === 1) {
return key.toUpperCase();
}


return key;
}


function getShortcutSettingsSource() {

return (
shortcutDraftKeys ||
shortcutKeys
);
}


function getDuplicateShortcutKeys() {

const keyCounts =
new Map();

const shortcutSettingsSource =
getShortcutSettingsSource();


Object.values(
shortcutSettingsSource
).forEach(
(key) => {

keyCounts.set(
key,
(
keyCounts.get(key) ||
0
) + 1
);
}
);


return new Set(
[...keyCounts.entries()]
.filter(
([, count]) =>
count > 1
)
.map(
([key]) =>
key
)
);
}


function refreshShortcutSettingsButtons() {

const shortcutSettingsSource =
getShortcutSettingsSource();

const duplicateShortcutKeys =
getDuplicateShortcutKeys();


shortcutKeyButtons.forEach(
(button) => {

const action =
button.dataset.shortcutAction;

const shortcutKey =
shortcutSettingsSource[action];


button.textContent =
formatShortcutKey(
shortcutKey
);


button.classList.toggle(
"is-duplicate",
duplicateShortcutKeys.has(
shortcutKey
)
);
}
);
}


function updateShortcutStatusForDuplicates(
normalMessage = ""
) {

const hasDuplicates =
getDuplicateShortcutKeys().size > 0;


shortcutStatus.classList.toggle(
"is-error",
hasDuplicates
);

shortcutConfirmButton.disabled =
hasDuplicates;


shortcutStatus.textContent =
hasDuplicates
? (
currentLanguage === "en"
? "Duplicate keys are assigned."
: "キーが重複しています"
)
: normalMessage;


return hasDuplicates;
}


function refreshLookDirectionSetting() {

lookDirectionHorizontalSelect.value =
lookDirectionHorizontalDraft ??
lookDirectionHorizontal;

lookDirectionVerticalSelect.value =
lookDirectionVerticalDraft ??
lookDirectionVertical;
}


function stopShortcutCapture() {

shortcutCaptureAction = null;

shortcutKeyButtons.forEach(
(button) => {

button.classList.remove(
"is-capturing"
);
}
);
}


function openShortcutSettings() {

stopShortcutCapture();


shortcutDraftKeys = {
...shortcutKeys
};

lookDirectionHorizontalDraft =
lookDirectionHorizontal;

lookDirectionVerticalDraft =
lookDirectionVertical;


refreshShortcutSettingsButtons();
refreshLookDirectionSetting();

updateShortcutStatusForDuplicates();

shortcutPanel.classList.add(
"is-open"
);
}


function closeShortcutSettings() {

stopShortcutCapture();


shortcutDraftKeys = null;

lookDirectionHorizontalDraft = null;
lookDirectionVerticalDraft = null;


shortcutStatus.classList.remove(
"is-error"
);

shortcutStatus.textContent = "";

shortcutConfirmButton.disabled =
false;


shortcutPanel.classList.remove(
"is-open"
);
}


function hasShortcutSettingsChanges() {

if (!shortcutDraftKeys) {
return false;
}


const shortcutChanged =
Object.keys(
DEFAULT_SHORTCUT_KEYS
).some(
(action) =>
shortcutDraftKeys[action] !==
shortcutKeys[action]
);


const horizontalChanged =
lookDirectionHorizontalDraft !==
lookDirectionHorizontal;


const verticalChanged =
lookDirectionVerticalDraft !==
lookDirectionVertical;


return (
shortcutChanged ||
horizontalChanged ||
verticalChanged
);
}


function saveShortcutSettingsDraft() {

if (
!shortcutDraftKeys ||
getDuplicateShortcutKeys().size > 0
) {

updateShortcutStatusForDuplicates();

return false;
}


shortcutKeys = {
...shortcutDraftKeys
};


lookDirectionHorizontal =
lookDirectionHorizontalDraft ??
lookDirectionHorizontal;


lookDirectionVertical =
lookDirectionVerticalDraft ??
lookDirectionVertical;


saveShortcutKeys();
saveLookDirections();


closeShortcutSettings();

return true;
}


function closeShortcutSaveConfirm() {

shortcutSaveConfirmPanel.classList.remove(
"is-open"
);
}


function openShortcutSaveConfirm() {

const hasDuplicates =
getDuplicateShortcutKeys().size > 0;


shortcutSaveConfirmMessage.textContent =
currentLanguage === "en"
? "Save settings?"
: "設定を保存しますか？";


shortcutSaveConfirmYesButton.textContent =
currentLanguage === "en"
? "Yes"
: "する";

shortcutSaveConfirmNoButton.textContent =
currentLanguage === "en"
? "No"
: "しない";


shortcutSaveConfirmYesButton.disabled =
hasDuplicates;


shortcutSaveConfirmPanel.classList.add(
"is-open"
);
}


function requestCloseShortcutSettings() {

stopShortcutCapture();


if (
!hasShortcutSettingsChanges()
) {

closeShortcutSettings();

return;
}


/*
キーが重複している場合は
保存確認を出さず、
一時変更を破棄して閉じる。
*/

if (
getDuplicateShortcutKeys().size > 0
) {

closeShortcutSettings();

return;
}


openShortcutSaveConfirm();
}


function startShortcutCapture(
action
) {

shortcutCaptureAction =
action;


shortcutKeyButtons.forEach(
(button) => {

button.classList.toggle(
"is-capturing",
button.dataset.shortcutAction ===
action
);
}
);


shortcutStatus.classList.remove(
"is-error"
);

shortcutStatus.textContent =
currentLanguage === "en"
? "Press a new key. Press Esc to cancel."
: "新しいキーを押してください。Escでキャンセルできます。";
}


function assignShortcutKey(
action,
newKey
) {

if (!shortcutDraftKeys) {
return;
}


shortcutDraftKeys[action] =
newKey;

refreshShortcutSettingsButtons();

stopShortcutCapture();


updateShortcutStatusForDuplicates(
currentLanguage === "en"
? "Change ready. Press Save to apply."
: "変更内容を更新しました。「保存」で確定します。"
);
}


shortcutSettingsButton.addEventListener(
"click",
() => {

openShortcutSettings();
}
);


shortcutCloseButton.addEventListener(
"click",
() => {

requestCloseShortcutSettings();
}
);


shortcutPanel.addEventListener(
"click",
(event) => {

if (
event.target === shortcutPanel
) {

requestCloseShortcutSettings();
}
}
);


shortcutKeyButtons.forEach(
(button) => {

button.addEventListener(
"click",
() => {

startShortcutCapture(
button.dataset.shortcutAction
);
}
);
}
);


lookDirectionHorizontalSelect.addEventListener(
"change",
() => {

lookDirectionHorizontalDraft =
lookDirectionHorizontalSelect.value ===
"reverse"
? "reverse"
: "standard";


updateShortcutStatusForDuplicates(
currentLanguage === "en"
? "Change ready. Press Apply to save."
: "変更内容を更新しました。「設定する」で確定します。"
);
}
);


lookDirectionVerticalSelect.addEventListener(
"change",
() => {

lookDirectionVerticalDraft =
lookDirectionVerticalSelect.value ===
"reverse"
? "reverse"
: "standard";


updateShortcutStatusForDuplicates(
currentLanguage === "en"
? "Change ready. Press Apply to save."
: "変更内容を更新しました。「設定する」で確定します。"
);
}
);


shortcutResetButton.addEventListener(
"click",
() => {

shortcutDraftKeys = {
...DEFAULT_SHORTCUT_KEYS
};

lookDirectionHorizontalDraft =
DEFAULT_LOOK_DIRECTION;

lookDirectionVerticalDraft =
DEFAULT_LOOK_DIRECTION;


refreshShortcutSettingsButtons();
refreshLookDirectionSetting();

stopShortcutCapture();


updateShortcutStatusForDuplicates(
currentLanguage === "en"
? "Default settings are ready. Press Save to apply."
: "初期設定を表示しています。「保存」で確定します。"
);
}
);


shortcutConfirmButton.addEventListener(
"click",
() => {

saveShortcutSettingsDraft();
}
);


shortcutSaveConfirmYesButton.addEventListener(
"click",
() => {

if (
getDuplicateShortcutKeys().size > 0
) {
return;
}


closeShortcutSaveConfirm();

saveShortcutSettingsDraft();
}
);


shortcutSaveConfirmNoButton.addEventListener(
"click",
() => {

closeShortcutSaveConfirm();

closeShortcutSettings();
}
);


/*
キー変更待ちの間だけ、
通常の描画ショートカットより先に
KeyboardEventを受け取る。
*/

window.addEventListener(
"keydown",
(event) => {

if (
!shortcutPanel.classList.contains(
"is-open"
)
) {
return;
}


if (
shortcutSaveConfirmPanel.classList.contains(
"is-open"
)
) {

event.preventDefault();
event.stopImmediatePropagation();

return;
}


if (
event.key === "Escape"
) {

event.preventDefault();
event.stopImmediatePropagation();


if (shortcutCaptureAction) {

stopShortcutCapture();

updateShortcutStatusForDuplicates();

} else {

requestCloseShortcutSettings();
}

return;
}


if (!shortcutCaptureAction) {
return;
}


event.preventDefault();
event.stopImmediatePropagation();


if (
event.ctrlKey ||
event.metaKey ||
event.altKey ||
event.isComposing
) {

shortcutStatus.textContent =
currentLanguage === "en"
? "Use a single key without Ctrl, Command, or Alt."
: "Ctrl・Command・Altを使わず、1つのキーを押してください。";

return;
}


const newShortcutKey =
getShortcutKey(
event
);


if (
newShortcutKey !== "space" &&
newShortcutKey.length !== 1
) {

shortcutStatus.textContent =
currentLanguage === "en"
? "Please use a letter, symbol, or Space key."
: "文字・記号・Spaceのいずれかを使用してください。";

return;
}


assignShortcutKey(
shortcutCaptureAction,
newShortcutKey
);
},
true
);


applyLanguage(false);

renderLayerPanel();


/* ================================
PC用 メニューバー
================================ */

function closeAllAppMenus() {

appMenus.forEach(
(menu) => {

menu.classList.remove(
"is-open"
);
}
);
}


appMenuTriggers.forEach(
(trigger) => {

trigger.addEventListener(
"click",
(event) => {

event.stopPropagation();


const targetMenu =
trigger.closest(
".app-menu"
);


const shouldOpen =
!targetMenu.classList.contains(
"is-open"
);


closeAllAppMenus();


if (shouldOpen) {

targetMenu.classList.add(
"is-open"
);
}
}
);
}
);


document.addEventListener(
"click",
(event) => {

if (
event.target.closest(
".app-menu"
)
) {
return;
}


closeAllAppMenus();
}
);


window.addEventListener(
"keydown",
(event) => {

if (
event.key !== "Escape"
) {
return;
}


closeAllAppMenus();
}
);


document.querySelectorAll(
".app-menu__item"
).forEach(
(button) => {

button.addEventListener(
"click",
() => {

closeAllAppMenus();
}
);
}
);


desktopUndoMenuButton.addEventListener(
"click",
() => {

undoButton.click();
}
);


desktopRedoMenuButton.addEventListener(
"click",
() => {

redoButton.click();
}
);


desktopHelpMenuButton.addEventListener(
"click",
() => {

helpButton.click();
}
);


/* ================================
ツール切り替え
================================ */

let guideVisibilityBeforeCamera =
null;


function setGuideVisibility(
visible
) {

groundToggle.checked =
visible;

groundGrid.visible =
visible;

verticalGuides.visible =
visible;

horizontalGuides.visible =
visible;
}


function enterCameraMode() {

if (guideVisibilityBeforeCamera === null) {

guideVisibilityBeforeCamera =
groundToggle.checked;
}

setGuideVisibility(
false
);

groundToggle.disabled =
true;

eraserCursor.visible =
false;

cameraCaptureUi.hidden =
false;
}


function leaveCameraMode() {

if (guideVisibilityBeforeCamera === null) {
return;
}

setGuideVisibility(
guideVisibilityBeforeCamera
);

guideVisibilityBeforeCamera =
null;

groundToggle.disabled =
false;

cameraCaptureUi.hidden =
true;
}


function selectDrawingTool(
tool
) {

if (!TOOL_REGISTRY[tool]) {
return;
}


const previousTool =
currentTool;


if (
previousTool === "camera" &&
tool !== "camera"
) {

leaveCameraMode();
}


currentTool = tool;


if (tool === "camera") {

enterCameraMode();
}


/*
ペン・消しゴムでは
それぞれ保存してある太さを復元する
*/

if (tool === "pen") {

penSize =
savedPenSize;

} else if (tool === "eraser") {

penSize =
savedEraserSize;
}


if (
tool === "pen" ||
tool === "eraser"
) {

penSizeInput.value =
penSize;

penSizeValue.value =
penSize;

renderer.domElement.style.cursor =
"none";

} else {

eraserCursor.visible = false;

if (
tool === "look" ||
tool === "camera"
) {

renderer.domElement.style.cursor =
"grab";

} else {

renderer.domElement.style.cursor =
"crosshair";
}
}


penToolButton.classList.toggle(
"is-active",
tool === "pen"
);

eraserToolButton.classList.toggle(
"is-active",
tool === "eraser"
);

bucketToolButton.classList.toggle(
"is-active",
tool === "bucket"
);

eyedropperToolButton.classList.toggle(
"is-active",
tool === "eyedropper"
);

lookToolButton.classList.toggle(
"is-active",
tool === "look"
);

cameraToolButton.classList.toggle(
"is-active",
tool === "camera"
);
}


penToolButton.addEventListener(
"click",
() => {

selectDrawingTool(
"pen"
);
}
);


eraserToolButton.addEventListener(
"click",
() => {

selectDrawingTool(
"eraser"
);
}
);


bucketToolButton.addEventListener(
"click",
() => {

selectDrawingTool(
"bucket"
);
}
);


eyedropperToolButton.addEventListener(
"click",
() => {

selectDrawingTool(
"eyedropper"
);
}
);


lookToolButton.addEventListener(
"pointerdown",
(event) => {

event.preventDefault();
event.stopPropagation();

selectDrawingTool(
"look"
);
}
);


cameraToolButton.addEventListener(
"pointerdown",
(event) => {

event.preventDefault();
event.stopPropagation();

selectDrawingTool(
"camera"
);
}
);


let cameraCaptureMode =
"photo";


function setCameraCaptureMode(
mode
) {

if (
mode !== "photo" &&
mode !== "video"
) {
return;
}

cameraCaptureMode =
mode;

cameraPhotoModeButton.classList.toggle(
"is-active",
mode === "photo"
);

cameraPhotoModeButton.setAttribute(
"aria-pressed",
mode === "photo"
? "true"
: "false"
);

cameraVideoModeButton.classList.toggle(
"is-active",
mode === "video"
);

cameraVideoModeButton.setAttribute(
"aria-pressed",
mode === "video"
? "true"
: "false"
);
}


cameraPhotoModeButton.addEventListener(
"click",
() => {

setCameraCaptureMode(
"photo"
);
}
);


cameraVideoModeButton.addEventListener(
"click",
() => {

setCameraCaptureMode(
"video"
);
}
);


/*
現在の画面中央と一致する
正方形用の垂直画角を求める
*/

function getSquareCaptureFov() {

const viewportAspect =
Math.max(
0.0001,
camera.aspect
);


if (viewportAspect >= 1) {

return camera.fov;
}


const verticalFov =
THREE.MathUtils.degToRad(
camera.fov
);

const horizontalFov =
2 *
Math.atan(
Math.tan(
verticalFov / 2
) *
viewportAspect
);

return THREE.MathUtils.radToDeg(
horizontalFov
);
}


/*
撮影ファイル名
*/

function getPhotoCaptureFilename() {

const now =
new Date();

const pad =
(value) =>
String(value).padStart(
2,
"0"
);

return (
"gururi-photo-" +
now.getFullYear() +
pad(now.getMonth() + 1) +
pad(now.getDate()) +
"-" +
pad(now.getHours()) +
pad(now.getMinutes()) +
pad(now.getSeconds()) +
".png"
);
}


function takeCameraPhoto() {

if (
currentTool !== "camera" ||
cameraCaptureMode !== "photo"
) {
return;
}


/*
最新の描画内容を
360°テクスチャへ反映する
*/

updatePaintCanvas();

texture.needsUpdate =
true;


/*
現在のカメラを複製して
中央正方形の画角へ調整する
*/

const captureCamera =
camera.clone();

captureCamera.aspect =
1;

captureCamera.fov =
getSquareCaptureFov();

captureCamera.updateProjectionMatrix();


photoCaptureRenderer.setSize(
PHOTO_CAPTURE_SIZE,
PHOTO_CAPTURE_SIZE,
false
);

photoCaptureRenderer.render(
scene,
captureCamera
);


photoCaptureCanvas.toBlob(
(blob) => {

if (!blob) {

alert(
currentLanguage === "en"
? "Could not create the image."
: "画像を作成できませんでした。"
);

return;
}


const downloadUrl =
URL.createObjectURL(
blob
);

const link =
document.createElement(
"a"
);

link.href =
downloadUrl;

link.download =
getPhotoCaptureFilename();

link.click();


window.setTimeout(
() => {

URL.revokeObjectURL(
downloadUrl
);
},
1000
);
},
"image/png"
);
}


cameraShutterButton.addEventListener(
"click",
() => {

if (cameraCaptureMode === "photo") {

takeCameraPhoto();
}
}
);


function saveToolPalette() {

try {

localStorage.setItem(
TOOL_PALETTE_STORAGE_KEY,
JSON.stringify(
addedPaletteToolIds
)
);

} catch (error) {

return false;
}

return true;
}


function updateToolPalette() {

const cameraIsAdded =
addedPaletteToolIds.includes(
"camera"
);

cameraToolButton.hidden =
!cameraIsAdded;

cameraToolAddButton.disabled =
cameraIsAdded;

cameraToolAddButton.textContent =
cameraIsAdded
? t("added")
: t("add");
}


function openToolLibrary() {

updateToolPalette();

toolLibraryPanel.classList.add(
"is-open"
);
}


function closeToolLibrary() {

toolLibraryPanel.classList.remove(
"is-open"
);
}


addToolButton.addEventListener(
"click",
() => {

openToolLibrary();
}
);


cameraToolAddButton.addEventListener(
"click",
() => {

if (
addedPaletteToolIds.includes(
"camera"
)
) {
return;
}

addedPaletteToolIds.push(
"camera"
);

saveToolPalette();
updateToolPalette();
closeToolLibrary();
}
);


toolLibraryCloseButton.addEventListener(
"click",
() => {

closeToolLibrary();
}
);


toolLibraryPanel.addEventListener(
"click",
(event) => {

if (event.target === toolLibraryPanel) {

closeToolLibrary();
}
}
);


document.addEventListener(
"keydown",
(event) => {

if (
event.key === "Escape" &&
toolLibraryPanel.classList.contains(
"is-open"
)
) {

closeToolLibrary();
}
}
);


/* ================================
ストローク再描画
================================ */

function drawStroke(stroke) {

if (
!stroke ||
stroke.historyType
) {
return;
}


const layer =
getLayerById(
stroke.layerId
);


/*
削除中のレイヤーに属する
描画履歴は再描画しない
*/

if (!layer) {
return;
}


const targetCanvas =
layer.canvas;

const targetContext =
layer.context;


/*
バケツ塗りを再現
*/

if (stroke.tool === "bucket") {

floodFill(
stroke.x,
stroke.y,
stroke.color,
layer.id
);

return;
}


if (
!stroke.points ||
stroke.points.length === 0
) {
return;
}


/*
ペン／消しゴム設定
*/

if (stroke.tool === "eraser") {

targetContext.globalCompositeOperation =
"destination-out";

} else {

targetContext.globalCompositeOperation =
"source-over";
}


targetContext.strokeStyle =
stroke.color;

targetContext.fillStyle =
stroke.color;

targetContext.lineWidth =
stroke.size;

targetContext.lineCap =
"round";

targetContext.lineJoin =
"round";


/*
最初の一点
*/

const firstPoint =
stroke.points[0];

targetContext.beginPath();

targetContext.arc(
firstPoint.x,
firstPoint.y,
(
stroke.size *
drawScale
) / 2,
0,
Math.PI * 2
);

targetContext.fill();


/*
1点しかない場合は終了
*/

if (stroke.points.length === 1) {
return;
}


/*
曲線を再描画
*/

let previousX =
firstPoint.x;

let previousY =
firstPoint.y;

let previousMidX =
firstPoint.x;

let previousMidY =
firstPoint.y;


for (
let i = 1;
i < stroke.points.length;
i++
) {

const point =
stroke.points[i];

let adjustedX =
point.x;

const deltaX =
adjustedX - previousX;


/*
360°の継ぎ目を補正
*/

if (
deltaX <
-targetCanvas.width / 2
) {

adjustedX +=
targetCanvas.width;

} else if (
deltaX >
targetCanvas.width / 2
) {

adjustedX -=
targetCanvas.width;
}


const midX =
(
previousX +
adjustedX
) / 2;

const midY =
(
previousY +
point.y
) / 2;


/*
通常位置
*/

targetContext.beginPath();

targetContext.moveTo(
previousMidX,
previousMidY
);

targetContext.quadraticCurveTo(
previousX,
previousY,
midX,
midY
);

targetContext.stroke();


/*
左側コピー
*/

targetContext.beginPath();

targetContext.moveTo(
previousMidX -
targetCanvas.width,
previousMidY
);

targetContext.quadraticCurveTo(
previousX -
targetCanvas.width,
previousY,
midX -
targetCanvas.width,
midY
);

targetContext.stroke();


/*
右側コピー
*/

targetContext.beginPath();

targetContext.moveTo(
previousMidX +
targetCanvas.width,
previousMidY
);

targetContext.quadraticCurveTo(
previousX +
targetCanvas.width,
previousY,
midX +
targetCanvas.width,
midY
);

targetContext.stroke();


previousMidX =
midX;

previousMidY =
midY;

previousX =
adjustedX;

previousY =
point.y;


/*
座標をCanvas範囲へ戻す
*/

if (previousX < 0) {

previousX +=
targetCanvas.width;

previousMidX +=
targetCanvas.width;

} else if (
previousX >=
targetCanvas.width
) {

previousX -=
targetCanvas.width;

previousMidX -=
targetCanvas.width;
}
}
}


/* ================================
描画レイヤーを再構築
================================ */

function rebuildDrawing() {

/*
すべての描画レイヤーを空にする
*/

for (const layer of layers) {

layer.context.clearRect(
0,
0,
layer.canvas.width,
layer.canvas.height
);


/*
読み込み時の基準画像があれば、
まずそれを復元する
*/

if (layer.baseCanvas) {

layer.context.drawImage(
layer.baseCanvas,
0,
0
);
}
}


/*
読み込み後に行った操作だけを
最初から順番に再描画する
*/

for (
const stroke of strokeHistory
) {

drawStroke(stroke);
}


/*
球体へ反映
*/

updatePaintCanvas();
}


/* ================================
Undo
================================ */

function undo() {

if (strokeHistory.length === 0) {
return;
}


const action =
strokeHistory.pop();


redoStrokeHistory.push(
action
);


/*
新方式で記録された
ペン／消しゴムの場合は、
全履歴を再描画せず
変更タイルだけを戻す
*/

if (
action.tileDiffs instanceof Map &&
action.tileDiffs.size > 0
) {

swapStrokeTiles(
action
);

requestPaintUpdate();

return;
}


/*
レイヤー追加を取り消す
*/

if (
action.historyType ===
"layer-add"
) {

const index =
layers.findIndex(
(layer) =>
layer.id ===
action.layer.id
);


if (index >= 0) {

layers.splice(
index,
1
);
}


let restoreLayerId =
action.previousActiveLayerId;


if (
!getLayerById(
restoreLayerId
)
) {

restoreLayerId =
layers.length > 0
? layers[
layers.length - 1
].id
: null;
}


if (restoreLayerId !== null) {

setActiveLayer(
restoreLayerId
);
}


requestPaintUpdate();

return;
}


/*
レイヤー削除を取り消す
*/

if (
action.historyType ===
"layer-delete"
) {

const index =
Math.max(
0,
Math.min(
action.index,
layers.length
)
);


if (
!getLayerById(
action.layer.id
)
) {

layers.splice(
index,
0,
action.layer
);
}


setActiveLayer(
action.layer.id
);

requestPaintUpdate();

return;
}


/*
描画操作を取り消す
*/

rebuildDrawing();
}


/* ================================
Redo
================================ */

function redo() {

if (
redoStrokeHistory.length === 0
) {
return;
}


const action =
redoStrokeHistory.pop();


/*
新方式のペン／消しゴムは
タイルをもう一度交換するだけで
Redoできる
*/

if (
action.tileDiffs instanceof Map &&
action.tileDiffs.size > 0
) {

swapStrokeTiles(
action
);


strokeHistory.push(
action
);


requestPaintUpdate();

return;
}


/*
レイヤー追加をやり直す
*/

if (
action.historyType ===
"layer-add"
) {

const index =
Math.max(
0,
Math.min(
action.index,
layers.length
)
);


if (
!getLayerById(
action.layer.id
)
) {

layers.splice(
index,
0,
action.layer
);
}


strokeHistory.push(
action
);


setActiveLayer(
action.layer.id
);

requestPaintUpdate();

return;
}


/*
レイヤー削除をやり直す
*/

if (
action.historyType ===
"layer-delete"
) {

const index =
layers.findIndex(
(layer) =>
layer.id ===
action.layer.id
);


if (index >= 0) {

layers.splice(
index,
1
);
}


strokeHistory.push(
action
);


let nextActiveLayerId =
action.nextActiveLayerId;


if (
!getLayerById(
nextActiveLayerId
)
) {

const fallbackIndex =
Math.min(
action.index,
layers.length - 1
);

nextActiveLayerId =
layers[fallbackIndex].id;
}


setActiveLayer(
nextActiveLayerId
);

requestPaintUpdate();

return;
}


/*
描画操作をやり直す
*/

strokeHistory.push(
action
);

rebuildDrawing();
}


/* ================================
プレビュー左端ハンドル
================================ */

let isPreviewSeamDragging =
false;


/*
今回のドラッグで
選択している位置
*/

let previewDragRatio = 0;


/*
ポインター位置に
▼を移動する
*/

function updatePreviewSeamHandle(
event
) {

const rect =
previewCanvas
.getBoundingClientRect();


if (
rect.width <= 0
) {
return;
}


/*
Canvas左端を0として
ポインター位置を取得
*/

let x =
event.clientX -
rect.left;


/*
画像の範囲内に制限
*/

x =
Math.max(
0,
Math.min(
rect.width,
x
)
);


previewDragRatio =
x /
rect.width;


previewSeamHandle
.style
.left =
`${x}px`;
}


/*
▼をつかむ
*/

previewSeamHandle.addEventListener(
"pointerdown",
(event) => {

if (
event.pointerType ===
"mouse" &&
event.button !== 0
) {
return;
}


isPreviewSeamDragging =
true;


previewDragRatio = 0;


previewSeamHandle
.setPointerCapture(
event.pointerId
);


updatePreviewSeamHandle(
event
);


event.preventDefault();

event.stopPropagation();
}
);


/*
▼を横方向へ移動
*/

previewSeamHandle.addEventListener(
"pointermove",
(event) => {

if (
!isPreviewSeamDragging
) {
return;
}


updatePreviewSeamHandle(
event
);


event.preventDefault();

event.stopPropagation();
}
);


/*
▼を離した位置を
新しい画像左端にする
*/

function finishPreviewSeamDrag(
event
) {

if (
!isPreviewSeamDragging
) {
return;
}


isPreviewSeamDragging =
false;


if (
previewSeamHandle
.hasPointerCapture(
event.pointerId
)
) {

previewSeamHandle
.releasePointerCapture(
event.pointerId
);
}


/*
現在の左端位置へ
今回選択した位置を加える
*/

previewSeamRatio =
(
previewSeamRatio +
previewDragRatio
) % 1;


/*
新しい左端で
プレビューを書き直す
*/

updatePreview();


/*
▼自身は再び
新しい画像の左端へ戻す
*/

previewDragRatio = 0;


previewSeamHandle
.style
.left =
"0px";


event.preventDefault();

event.stopPropagation();
}


previewSeamHandle.addEventListener(
"pointerup",
finishPreviewSeamDrag
);


previewSeamHandle.addEventListener(
"pointercancel",
(event) => {

isPreviewSeamDragging =
false;


previewDragRatio = 0;


previewSeamHandle
.style
.left =
"0px";


if (
previewSeamHandle
.hasPointerCapture(
event.pointerId
)
) {

previewSeamHandle
.releasePointerCapture(
event.pointerId
);
}
}
);


/* ================================
プレビューUI
================================ */

previewButton.addEventListener(
"click",
() => {

/*
念のため最新の描画内容を
表示用Canvasへ反映
*/

updatePaintCanvas();


/*
プレビューを作成
*/

updatePreview();


/*
オーバーレイを表示
*/

previewOverlay.classList.add(
"is-open"
);
}
);


previewCloseButton.addEventListener(
"click",
() => {

previewOverlay.classList.remove(
"is-open"
);
}
);


previewDownloadButton.addEventListener(
"click",
() => {

downloadPNG();

trackGAEvent(
"download_image"
);
}
);

/* ================================
はじめに
================================ */

const WELCOME_VERSION =
"2";

const WELCOME_STORAGE_KEY =
"gururi-paint-dev-welcome-version";


function markWelcomeAsSeen() {

try {

localStorage.setItem(
WELCOME_STORAGE_KEY,
WELCOME_VERSION
);

} catch (error) {

/*
保存できない環境でも
ウィンドウ自体は使用できる
*/

}
}


function showWelcomeIfNeeded() {

let seenVersion = null;

try {

seenVersion =
localStorage.getItem(
WELCOME_STORAGE_KEY
);

} catch (error) {

seenVersion = null;
}


if (
seenVersion !==
WELCOME_VERSION
) {

helpPanel.classList.add(
"is-open"
);

trackGAEvent(
"welcome_open",
{
source: "auto",
ui_language:
currentLanguage
}
);
}
}


helpButton.addEventListener(
"click",
() => {

helpPanel.classList.add(
"is-open"
);

trackGAEvent(
"welcome_open",
{
source: "button",
ui_language:
currentLanguage
}
);
}
);


helpCloseButton.addEventListener(
"click",
() => {

helpPanel.classList.remove(
"is-open"
);

trackGAEvent(
"welcome_close",
{
ui_language:
currentLanguage
}
);

markWelcomeAsSeen();
}
);


welcomeLanguageButtons.forEach(
(button) => {

button.addEventListener(
"click",
() => {

const language =
button.dataset.welcomeLanguage;

if (
language ===
currentLanguage
) {

return;
}

setLanguage(
language
);

trackGAEvent(
"welcome_language_click",
{
ui_language:
language
}
);
}
);
}
);


welcomeXLink.addEventListener(
"click",
() => {

trackGAEvent(
"welcome_x_click",
{
ui_language:
currentLanguage
}
);
}
);


welcomeNoteLink.addEventListener(
"click",
() => {

trackGAEvent(
"welcome_note_click",
{
ui_language:
currentLanguage
}
);
}
);


/*
初回アクセス時のみ
自動で「はじめに」を表示
*/

showWelcomeIfNeeded();


/* ================================
ページを離れる前の確認
================================ */

/*
タブを閉じる、
ページを再読み込みする、
ブラウザバックする、
別ページへ移動する場合に
ブラウザ標準の確認を表示する。
*/

window.addEventListener(
"beforeunload",
(event) => {

event.preventDefault();

/*
一部ブラウザとの互換性のために必要
*/

event.returnValue = "";
}
);


/* ================================
データ保存／読み込み
================================ */

projectSaveButton.addEventListener(
"click",
() => {

downloadProject();
}
);


projectLoadButton.addEventListener(
"click",
() => {

projectLoadInput.click();
}
);


projectLoadInput.addEventListener(
"change",
async () => {

const file =
projectLoadInput
.files?.[0];


if (!file) {
return;
}


try {

await loadProject(
file
);

} catch (error) {

console.error(
error
);


alert(
"データを読み込めませんでした。\n" +
"ぐるりペイントで保存したデータか確認してください。"
);

} finally {

/*
同じファイルをもう一度
選択できるようにする
*/

projectLoadInput.value =
"";
}
}
);


/* ================================
PNG保存
================================ */

downloadButton.addEventListener(
"click",
() => {

previewButton.click();
}
);

/* ================================
Undo / Redo ボタン
================================ */

undoButton.addEventListener(
"click",
() => {

undo();
}
);


redoButton.addEventListener(
"click",
() => {

redo();
}
);


/* ================================
キーボードショートカット設定
================================ */

const SHORTCUT_STORAGE_KEY =
"gururi-paint-dev-shortcuts";


const DEFAULT_SHORTCUT_KEYS = {
pen: "p",
eraser: "e",
bucket: "b",
eyedropper: "s",
look: "h",
lookAround: "space",
zoom: "z"
};


/*
保存されたショートカットキーを
安全な文字列へ変換する。
*/

function normalizeShortcutKey(
value,
fallback
) {

if (
typeof value !== "string"
) {
return fallback;
}


const normalized =
value
.trim()
.toLowerCase();


if (!normalized) {
return fallback;
}


return normalized;
}


/*
localStorageから
ショートカット設定を読み込む。
*/

function loadShortcutKeys() {

let savedShortcutKeys = null;


try {

const savedValue =
localStorage.getItem(
SHORTCUT_STORAGE_KEY
);


if (savedValue) {

savedShortcutKeys =
JSON.parse(
savedValue
);
}

} catch (error) {

savedShortcutKeys = null;
}


if (
!savedShortcutKeys ||
typeof savedShortcutKeys !== "object" ||
Array.isArray(
savedShortcutKeys
)
) {

return {
...DEFAULT_SHORTCUT_KEYS
};
}


const loadedShortcutKeys = {};


for (
const [
action,
defaultKey
] of Object.entries(
DEFAULT_SHORTCUT_KEYS
)
) {

loadedShortcutKeys[action] =
normalizeShortcutKey(
savedShortcutKeys[action],
defaultKey
);
}


return loadedShortcutKeys;
}


/*
現在のショートカット設定を
localStorageへ保存する。
*/

function saveShortcutKeys() {

try {

localStorage.setItem(
SHORTCUT_STORAGE_KEY,
JSON.stringify(
shortcutKeys
)
);

return true;

} catch (error) {

return false;
}
}


/*
ショートカット設定を
初期状態へ戻す。
*/

function resetShortcutKeys() {

shortcutKeys = {
...DEFAULT_SHORTCUT_KEYS
};

saveShortcutKeys();
}


/*
保存済み設定があれば使用し、
なければ初期設定を使用する。
*/

let shortcutKeys =
loadShortcutKeys();


/* ================================
見回し方向設定
================================ */

const LOOK_DIRECTION_HORIZONTAL_STORAGE_KEY =
"gururi-paint-dev-look-direction-horizontal-v2";

const LOOK_DIRECTION_VERTICAL_STORAGE_KEY =
"gururi-paint-dev-look-direction-vertical-v2";

const DEFAULT_LOOK_DIRECTION =
"standard";


function loadLookDirection(
storageKey
) {

try {

const savedValue =
localStorage.getItem(
storageKey
);

if (
savedValue === "standard" ||
savedValue === "reverse"
) {
return savedValue;
}

} catch (error) {

/*
保存データを読み込めない場合は
初期設定を使用する。
*/
}


return DEFAULT_LOOK_DIRECTION;
}


function saveLookDirections() {

try {

localStorage.setItem(
LOOK_DIRECTION_HORIZONTAL_STORAGE_KEY,
lookDirectionHorizontal
);

localStorage.setItem(
LOOK_DIRECTION_VERTICAL_STORAGE_KEY,
lookDirectionVertical
);

return true;

} catch (error) {

return false;
}
}


function resetLookDirections() {

lookDirectionHorizontal =
DEFAULT_LOOK_DIRECTION;

lookDirectionVertical =
DEFAULT_LOOK_DIRECTION;

saveLookDirections();
}


function getHorizontalLookDirectionMultiplier() {

return lookDirectionHorizontal ===
"reverse"
? -1
: 1;
}


function getVerticalLookDirectionMultiplier() {

return lookDirectionVertical ===
"reverse"
? 1
: -1;
}


let lookDirectionHorizontal =
loadLookDirection(
LOOK_DIRECTION_HORIZONTAL_STORAGE_KEY
);

let lookDirectionVertical =
loadLookDirection(
LOOK_DIRECTION_VERTICAL_STORAGE_KEY
);


/*
KeyboardEventを
ショートカット判定用の文字列へ変換する。

文字キーはevent.keyを使用することで、
QWERTY / AZERTYなどの
キーボード配列に対応する。
*/

function getShortcutKey(
event
) {

if (
event.code === "Space"
) {
return "space";
}

return event.key.toLowerCase();
}


/*
描画ツールに割り当てられている
ショートカットから
ツール名を取得する。
*/

function getDrawingToolFromShortcut(
key
) {

const drawingTools = [
"pen",
"eraser",
"bucket",
"eyedropper",
"look"
];

return (
drawingTools.find(
(tool) =>
shortcutKeys[tool] === key
) || null
);
}


window.addEventListener(
"keydown",
(event) => {

/*
入力欄を操作している間は
描画用キーボードショートカットを
実行しない。

レイヤー名はreadOnly時なら
通常のショートカットを使用できる。
*/

const target =
event.target;


const isEditableInput =
target instanceof HTMLInputElement &&
(
!target.classList.contains(
"layer-name-input"
) ||
!target.readOnly
);


const isOtherEditableElement =
target instanceof HTMLTextAreaElement ||
target instanceof HTMLSelectElement ||
(
target instanceof HTMLElement &&
target.isContentEditable
);


if (
isEditableInput ||
isOtherEditableElement
) {
return;
}


/*
ショートカット設定画面を
開いている間は、
通常の描画ショートカットを停止する。
*/

if (
shortcutPanel.classList.contains(
"is-open"
)
) {
return;
}


/*
Undo / Redo

Ctrl：
Windows / Linux

Meta：
macOSのCommand

event.keyを使用することで、
QWERTY / AZERTYなどの
キーボード配列にも対応する。
*/

const shortcutModifierPressed =
event.ctrlKey ||
event.metaKey;

const shortcutKey =
getShortcutKey(
event
);


/*
Ctrl / Command + Z
Undo
*/

if (
shortcutModifierPressed &&
!event.shiftKey &&
shortcutKey === "z"
) {

event.preventDefault();

undo();

return;
}


/*
Ctrl + Y
または
Ctrl / Command + Shift + Z
Redo
*/

if (
shortcutModifierPressed &&
(
shortcutKey === "y" ||
(
event.shiftKey &&
shortcutKey === "z"
)
)
) {

event.preventDefault();

redo();

return;
}


/*
描画ツールショートカット
*/

if (
!event.ctrlKey &&
!event.metaKey &&
!event.altKey
) {

const shortcutTool =
getDrawingToolFromShortcut(
shortcutKey
);

if (shortcutTool) {

event.preventDefault();

selectDrawingTool(
shortcutTool
);

return;
}
}


/*
Space
*/

if (
shortcutKey ===
shortcutKeys.lookAround
) {

isSpacePressed = true;

event.preventDefault();
}


/*
Z

event.codeではなく
event.keyを使用することで、
QWERTY / AZERTYなどの
キーボード配列に関係なく、
実際に入力された「Z」で判定する。
*/

if (
shortcutKey ===
shortcutKeys.zoom
) {

isZPressed = true;

event.preventDefault();
}

}
);


window.addEventListener(
"keyup",
(event) => {

/*
Spaceを離した
*/

if (
getShortcutKey(
event
) ===
shortcutKeys.lookAround
) {

isSpacePressed = false;
isLooking = false;

viewport.classList.remove(
"is-looking"
);
}


/*
Zを離した
*/

if (
getShortcutKey(
event
) ===
shortcutKeys.zoom
) {

isZPressed = false;
isZooming = false;

viewport.classList.remove(
"is-zooming"
);
}

}
);

/* ================================
スマートフォン
タッチ操作
================================ */

const activeTouchPointers =
new Map();

let touchNavigationActive =
false;

let previousTouchCenterX = 0;
let previousTouchCenterY = 0;

let previousTouchDistance = 0;


/*
バケツ／スポイトは
pointerdownでは実行せず、
1本指のタップだと確定した
pointerup時に実行する
*/

let pendingTouchTap = null;


/*
現在のタッチ位置を保存
*/

function updateTouchPointer(
event
) {

activeTouchPointers.set(
event.pointerId,
{
x: event.clientX,
y: event.clientY
}
);
}


/*
2本指の中心位置と
指同士の距離を取得
*/

function getTouchGestureState() {

const touches =
Array.from(
activeTouchPointers.values()
);


if (touches.length < 2) {
return null;
}


const first =
touches[0];

const second =
touches[1];


const centerX =
(
first.x +
second.x
) / 2;


const centerY =
(
first.y +
second.y
) / 2;


const distance =
Math.hypot(
second.x - first.x,
second.y - first.y
);


return {
centerX,
centerY,
distance
};
}


/*
1本目の指で描き始めたあと、
2本目の指が置かれた場合は
その描画を取り消す
*/

function cancelCurrentTouchStroke() {

if (!isDrawing) {
return;
}


/*
描きかけのストロークが
変更したタイルだけを
描画前状態へ戻す
*/

if (currentStroke) {

swapStrokeTiles(
currentStroke
);
}


isDrawing = false;

currentStroke = null;

previousPaintX = null;
previousPaintY = null;

previousMidX = null;
previousMidY = null;


requestPaintUpdate();
}


/*
2本指操作開始
*/

function startTouchNavigation() {

cancelCurrentTouchStroke();

pendingTouchTap = null;


const gesture =
getTouchGestureState();


if (!gesture) {
return;
}


touchNavigationActive =
true;


previousTouchCenterX =
gesture.centerX;

previousTouchCenterY =
gesture.centerY;

previousTouchDistance =
gesture.distance;


eraserCursor.visible =
false;
}


/*
Pointer Captureを解除
*/

function releaseTouchPointer(
event
) {

if (
renderer.domElement
.hasPointerCapture(
event.pointerId
)
) {

renderer.domElement
.releasePointerCapture(
event.pointerId
);
}
}


/*
タッチ開始

trueを返した場合は
通常のpointerdown処理を
ここで終了する
*/

function handleTouchPointerDown(
event
) {

if (
event.pointerType !== "touch"
) {
return false;
}


event.preventDefault();

updateTouchPointer(
event
);


renderer.domElement
.setPointerCapture(
event.pointerId
);


/*
2本以上になったら
視点操作へ切り替える
*/

if (
activeTouchPointers.size >= 2
) {

startTouchNavigation();

return true;
}


/*
バケツ／スポイトは
2本目の指が来ないことを
確認してから実行する
*/

if (
currentTool === "bucket" ||
currentTool === "eyedropper"
) {

pendingTouchTap = {

pointerId:
event.pointerId,

startX:
event.clientX,

startY:
event.clientY,

moved:
false,

tool:
currentTool,

color:
penColor,

layerId:
activeLayerId
};


return true;
}


/*
ペン／消しゴムは
既存のpointerdown処理を使う
*/

return false;
}


/*
タッチ移動
*/

function handleTouchPointerMove(
event
) {

if (
event.pointerType !== "touch"
) {
return false;
}


if (
!activeTouchPointers.has(
event.pointerId
)
) {
return false;
}


event.preventDefault();

updateTouchPointer(
event
);


/*
2本指なら
見回し＋ピンチズーム
*/

if (
activeTouchPointers.size >= 2
) {

if (!touchNavigationActive) {

startTouchNavigation();
}


const gesture =
getTouchGestureState();


if (!gesture) {
return true;
}


/*
2本指ドラッグ
→ 視点回転
*/

const deltaX =
gesture.centerX -
previousTouchCenterX;

const deltaY =
gesture.centerY -
previousTouchCenterY;


const lookSensitivity =
0.003;

const horizontalLookDirectionMultiplier =
getHorizontalLookDirectionMultiplier();

const verticalLookDirectionMultiplier =
getVerticalLookDirectionMultiplier();


yaw -=
deltaX *
lookSensitivity *
horizontalLookDirectionMultiplier;

pitch -=
deltaY *
lookSensitivity *
verticalLookDirectionMultiplier;


const limit =
Math.PI / 2 -
0.01;


pitch =
Math.max(
-limit,
Math.min(
limit,
pitch
)
);


/*
ピンチ
指を広げる → ズームイン
指を狭める → ズームアウト
*/

const distanceDelta =
gesture.distance -
previousTouchDistance;


const pinchSensitivity =
0.12;


camera.fov -=
distanceDelta *
pinchSensitivity;


camera.fov =
Math.max(
20,
Math.min(
120,
camera.fov
)
);


camera.updateProjectionMatrix();


previousTouchCenterX =
gesture.centerX;

previousTouchCenterY =
gesture.centerY;

previousTouchDistance =
gesture.distance;


return true;
}


/*
一度2本指操作になったら、
片方を離しても残った1本では
描画を開始しない
*/

if (touchNavigationActive) {
return true;
}


/*
バケツ／スポイトの
タップ判定。

10px以上動いた場合は
タップとはみなさない。
*/

if (
pendingTouchTap &&
pendingTouchTap.pointerId ===
event.pointerId
) {

const movedDistance =
Math.hypot(
event.clientX -
pendingTouchTap.startX,

event.clientY -
pendingTouchTap.startY
);


if (movedDistance > 10) {

pendingTouchTap.moved =
true;
}


return true;
}


/*
ペン／消しゴムは
既存のpointermove処理を使う
*/

return false;
}


/*
タッチ終了
*/

function handleTouchPointerEnd(
event,
canceled = false
) {

if (
event.pointerType !== "touch"
) {
return false;
}


event.preventDefault();


/*
2本指操作中
*/

if (touchNavigationActive) {

activeTouchPointers.delete(
event.pointerId
);


if (
activeTouchPointers.size >= 2
) {

const gesture =
getTouchGestureState();


if (gesture) {

previousTouchCenterX =
gesture.centerX;

previousTouchCenterY =
gesture.centerY;

previousTouchDistance =
gesture.distance;
}
}


/*
指がすべて離れるまでは
描画へ戻さない
*/

if (
activeTouchPointers.size === 0
) {

touchNavigationActive =
false;
}


releaseTouchPointer(
event
);


return true;
}


/*
バケツ／スポイトの
タップを確定
*/

if (
pendingTouchTap &&
pendingTouchTap.pointerId ===
event.pointerId
) {

const tap =
pendingTouchTap;


pendingTouchTap = null;


activeTouchPointers.delete(
event.pointerId
);


releaseTouchPointer(
event
);


if (
canceled ||
tap.moved
) {
return true;
}


const position =
getPaintPosition(
event
);


if (!position) {
return true;
}


/*
スポイト
*/

if (
tap.tool === "eyedropper"
) {

pickColorAt(
position.x,
position.y
);


return true;
}


/*
バケツ
*/

if (
tap.tool === "bucket"
) {

const bucketAction = {
tool: "bucket",
layerId: tap.layerId,
color: tap.color,
x: position.x,
y: position.y,

/*
差分Undo用
*/
tileDiffs:
new Map()
};


const changed =
floodFill(
position.x,
position.y,
tap.color,
tap.layerId,
bucketAction
);

if (!changed) {
return true;
}


redoStrokeHistory.length =
0;


strokeHistory.push(
bucketAction
);


rememberColor(
tap.color
);


requestPaintUpdate();


return true;
}


return true;
}


/*
通常の1本指描画
*/

activeTouchPointers.delete(
event.pointerId
);


/*
OSなどによるキャンセル時は
描画中の線を破棄する
*/

if (canceled) {

cancelCurrentTouchStroke();

releaseTouchPointer(
event
);

return true;
}


/*
通常のpointerup処理へ渡し、
ストロークを確定する
*/

return false;
}


renderer.domElement.addEventListener(
"pointerleave",
() => {

eraserCursor.visible =
false;
}
);


/* マウスを押す */

renderer.domElement.addEventListener(
"pointerdown",
(event) => {

if (event.button !== 0) {
return;
}


/*
スマートフォンの
タッチ開始処理
*/

if (
handleTouchPointerDown(
event
)
) {
return;
}


/*
Space + 左ドラッグ
または見回しツール
→ 視点回転
*/

if (
isSpacePressed ||
currentTool === "look" ||
currentTool === "camera"
) {

isLooking = true;

previousMouseX = event.clientX;
previousMouseY = event.clientY;

viewport.classList.add(
"is-looking"
);

renderer.domElement.setPointerCapture(
event.pointerId
);

return;
}


/*
Z + 左ドラッグ
ズーム
*/

if (isZPressed) {

isZooming = true;

previousMouseY = event.clientY;

viewport.classList.add(
"is-zooming"
);

renderer.domElement.setPointerCapture(
event.pointerId
);

return;
}


/*
SpaceもZも押していない
→ ペン描画
*/

const position =
getPaintPosition(event);

if (!position) {
return;
}


/*
スポイト
*/

if (currentTool === "eyedropper") {

pickColorAt(
position.x,
position.y
);

return;
}


/*
バケツ塗り
*/

if (currentTool === "bucket") {

const bucketAction = {
tool: "bucket",
layerId: activeLayerId,
color: penColor,
x: position.x,
y: position.y,

/*
差分Undo用
*/
tileDiffs:
new Map()
};


const changed =
floodFill(
position.x,
position.y,
penColor,
activeLayerId,
bucketAction
);


if (!changed) {
return;
}


redoStrokeHistory.length = 0;


strokeHistory.push(
bucketAction
);


rememberColor(
penColor
);


requestPaintUpdate();

return;
}


/*
ペンで実際に使った色を
最近使用した色へ記録
*/

if (currentTool === "pen") {

rememberColor(
penColor
);
}


/*
新しいストロークを開始
*/

currentStroke = {
tool: currentTool,
layerId: activeLayerId,
color: penColor,
size: penSize,

/*
高速Undo用。
このストロークが変更する
タイルの描画前状態を保存する。
*/

tileDiffs:
new Map(),

points: [
{
x: position.x,
y: position.y
}
]
};


/*
新しく描画を始めたので
Redo履歴を破棄
*/

redoStrokeHistory.length = 0;


/*
描画開始
*/

isDrawing = true;

previousPaintX =
position.x;

previousPaintY =
position.y;

previousMidX =
position.x;

previousMidY =
position.y;


/*
クリックした最初の一点を描く
*/

const initialHistoryPadding =
(
penSize *
drawScale
) / 2 + 2;


captureStrokeTiles(
currentStroke,

position.x -
initialHistoryPadding,

position.y -
initialHistoryPadding,

position.x +
initialHistoryPadding,

position.y +
initialHistoryPadding
);


if (currentTool === "eraser") {

drawContext.globalCompositeOperation =
"destination-out";

} else {

drawContext.globalCompositeOperation =
"source-over";
}


drawContext.fillStyle =
penColor;

drawContext.beginPath();

drawContext.arc(
position.x,
position.y,
(
penSize *
drawScale
) / 2,
0,
Math.PI * 2
);

drawContext.fill();


/*
球体表示の更新を予約
*/

requestPaintUpdate();

renderer.domElement.setPointerCapture(
event.pointerId
);

}
);


/* マウスを動かす */

renderer.domElement.addEventListener(
"pointermove",
(event) => {

/*
スマートフォンの
タッチ移動処理
*/

if (
handleTouchPointerMove(
event
)
) {
return;
}


/*
ペン／消しゴムカーソルは
マウス使用時だけ表示する
*/

if (
event.pointerType !== "touch"
) {

updateEraserCursor(
event
);
}


/*
視点回転
*/


if (isLooking) {

const deltaX =
event.clientX - previousMouseX;

const deltaY =
event.clientY - previousMouseY;

previousMouseX = event.clientX;
previousMouseY = event.clientY;

const sensitivity = 0.003;

const horizontalLookDirectionMultiplier =
getHorizontalLookDirectionMultiplier();

const verticalLookDirectionMultiplier =
getVerticalLookDirectionMultiplier();

yaw -=
deltaX *
sensitivity *
horizontalLookDirectionMultiplier;

pitch -=
deltaY *
sensitivity *
verticalLookDirectionMultiplier;

const limit =
Math.PI / 2 - 0.01;

pitch =
Math.max(
-limit,
Math.min(limit, pitch)
);

return;
}


/*
ズーム
*/

if (isZooming) {

const deltaY =
event.clientY - previousMouseY;

previousMouseY =
event.clientY;


/*
上へドラッグ
deltaY がマイナス
→ FOVを小さくする
→ ズームイン

下へドラッグ
deltaY がプラス
→ FOVを大きくする
→ ズームアウト
*/

const zoomSensitivity = 0.15;

camera.fov +=
deltaY * zoomSensitivity;


/*
ズーム可能範囲
*/

camera.fov =
Math.max(
20,
Math.min(
120,
camera.fov
)
);


/*
FOVを変更したので
Projection Matrixを更新
*/

camera.updateProjectionMatrix();

return;
}


/*
ペン描画
*/

if (isDrawing) {

const position =
getPaintPosition(event);

if (!position) {
return;
}


/*
現在の座標を
ストローク履歴へ追加
*/

if (currentStroke) {

currentStroke.points.push({
x: position.x,
y: position.y
});
}


/*
選択中ツールに応じて
描画方法を変更
*/

if (currentTool === "eraser") {

/*
既存ピクセルを透明化
*/

drawContext.globalCompositeOperation =
"destination-out";

} else {

/*
通常描画
*/

drawContext.globalCompositeOperation =
"source-over";
}


drawContext.strokeStyle =
penColor;

drawContext.lineWidth =
penSize * drawScale;

drawContext.lineCap =
"round";

drawContext.lineJoin =
"round";


/*
360°画像の左右端を
連続した座標として扱う
*/

let adjustedX =
position.x;

const deltaX =
adjustedX - previousPaintX;


/*
右端 → 左端
*/

if (
deltaX <
-paintCanvas.width / 2
) {
adjustedX +=
paintCanvas.width;
}


/*
左端 → 右端
*/

else if (
deltaX >
paintCanvas.width / 2
) {
adjustedX -=
paintCanvas.width;
}


/*
中間点
*/

const midX =
(
previousPaintX +
adjustedX
) / 2;

const midY =
(
previousPaintY +
position.y
) / 2;


/*
この曲線が触れる範囲を
描画前に保存する。

quadraticCurveは
始点・制御点・終点の
範囲内に収まるため、
この3点から範囲を求める。
*/

const historyPadding =
(
penSize *
drawScale
) / 2 + 2;


captureStrokeTiles(
currentStroke,

Math.min(
previousMidX,
previousPaintX,
midX
) -
historyPadding,

Math.min(
previousMidY,
previousPaintY,
midY
) -
historyPadding,

Math.max(
previousMidX,
previousPaintX,
midX
) +
historyPadding,

Math.max(
previousMidY,
previousPaintY,
midY
) +
historyPadding
);


/*
通常位置に描画
*/

drawContext.beginPath();

drawContext.moveTo(
previousMidX,
previousMidY
);

drawContext.quadraticCurveTo(
previousPaintX,
previousPaintY,
midX,
midY
);

drawContext.stroke();


/*
左側にも同じ線を描く
*/

drawContext.beginPath();

drawContext.moveTo(
previousMidX -
paintCanvas.width,
previousMidY
);

drawContext.quadraticCurveTo(
previousPaintX -
paintCanvas.width,
previousPaintY,
midX -
paintCanvas.width,
midY
);

drawContext.stroke();


/*
右側にも同じ線を描く
*/

drawContext.beginPath();

drawContext.moveTo(
previousMidX +
paintCanvas.width,
previousMidY
);

drawContext.quadraticCurveTo(
previousPaintX +
paintCanvas.width,
previousPaintY,
midX +
paintCanvas.width,
midY
);

drawContext.stroke();

/*
次回用の座標を保存
*/

previousMidX =
midX;

previousMidY =
midY;

previousPaintX =
adjustedX;

previousPaintY =
position.y;


/*
Canvas範囲外へ出た座標を
0～widthへ戻す
*/

if (
previousPaintX < 0
) {

previousPaintX +=
paintCanvas.width;

previousMidX +=
paintCanvas.width;
}

else if (
previousPaintX >=
paintCanvas.width
) {

previousPaintX -=
paintCanvas.width;

previousMidX -=
paintCanvas.width;
}


/*
球体表示の更新を予約する

実際の更新は
次の描画フレームで行う
*/

requestPaintUpdate();

return;
}

}
);

/* マウスを離す */

renderer.domElement.addEventListener(
"pointerup",
(event) => {

/*
スマートフォンの
タッチ終了処理
*/

if (
handleTouchPointerEnd(
event
)
) {
return;
}


isLooking = false;
isZooming = false;


/*
描画中だった場合は
ストロークを履歴へ登録
*/

if (
isDrawing &&
currentStroke
) {

strokeHistory.push(
currentStroke
);

currentStroke = null;
}


isDrawing = false;

previousPaintX = null;
previousPaintY = null;

previousMidX = null;
previousMidY = null;

viewport.classList.remove(
"is-looking"
);

viewport.classList.remove(
"is-zooming"
);


/*
Pointer Captureを先に解除する
*/

if (
renderer.domElement.hasPointerCapture(
event.pointerId
)
) {

renderer.domElement.releasePointerCapture(
event.pointerId
);
}


/*
Capture解除に伴うpointerleave等が
終わった次のフレームで
カーソルを復帰させる
*/

const cursorEvent = {
clientX: event.clientX,
clientY: event.clientY
};

requestAnimationFrame(
() => {

updateEraserCursor(
cursorEvent
);
}
);

}
);


/*
スマートフォンで、
OSやブラウザによって
タッチが中断された場合
*/

renderer.domElement.addEventListener(
"pointerup",
() => {
trackPaintStart();
}
);

renderer.domElement.addEventListener(
"pointercancel",
(event) => {

handleTouchPointerEnd(
event,
true
);
}
);


/* ================================
カメラ方向更新
================================ */

function updateCameraDirection() {

const direction =
new THREE.Vector3();

direction.x =
Math.sin(yaw) *
Math.cos(pitch);

direction.y =
Math.sin(pitch);

direction.z =
-Math.cos(yaw) *
Math.cos(pitch);

const target =
camera.position
.clone()
.add(direction);

camera.lookAt(target);
}


/* ================================
リサイズ
================================ */

window.addEventListener(
"resize",
() => {

updateMobileViewportSize();
}
);


/* ================================
描画ループ
================================ */

function animate() {

requestAnimationFrame(animate);


/*
描画内容に変更があった場合だけ
360°テクスチャを更新する
*/

const now =
performance.now();


if (
paintUpdateRequested &&
(
paintUpdateInterval === 0 ||
now - lastPaintUpdateTime >=
paintUpdateInterval
)
) {

updatePaintCanvas();

paintUpdateRequested = false;

lastPaintUpdateTime =
now;
}


updateCameraDirection();

renderer.render(
scene,
camera
);
}

animate();