import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

let worlds = {};

const DONATION_URLS = {
ja: "https://note.com/junnoota/n/n87a466960ce6",
en: "https://note.com/junnoota/n/ne455507ce7ec"
};

const LANGUAGE_STORAGE_KEY =
"gururi-watch-language";

const DONATION_HIDE_STORAGE_KEY =
"gururi-watch-hide-donation";

const PINNED_WORLD_IDS = [
"f4505070ceafd766",
"81d7b6e6c55af4a7",
"362e592326817cff"
];

const TEXT = {
ja: {
siteTitle: "ぐるりうむ",
siteDescription: "ぐるりペイントで描かれた世界たち",
postWorld: "世界を投稿",
gururiPaint: "ぐるりペイント",
support: "JUNOTAを応援",
authorIntro: "作者紹介",
donate: "JUNOTAを応援",
shareWorld: "世界を共有",
top: "トップへ",
reportProblem: "問題を報告",
reportTitle: "この世界を報告しますか？",
reportText: "権利侵害、不適切な内容、その他問題があると思われる場合に報告してください。",
reportNote: "報告された世界は確認のため一時的に非表示になります。",
reportSubmit: "問題を報告する",
reporting: "報告中…",
cancel: "キャンセル",
postTitle: "世界を投稿する",
workTitle: "作品名",
creatorName: "作者名",
workIntro: "作品紹介",
introPlaceholder: "自由に文章を書いてね",
xUrl: "XのURL",
website: "Webサイトなど",
thumbnail: "サムネイル画像",
thumbnailHelp: "正方形（1：1）のJPG / PNG / WebP、10MB以下",
panorama: "ぐるり画像",
panoramaHelp: "横2：縦1のJPG / PNG / WebP、10MB以下。ぐるりペイントから保存した画像をそのまま使用できます。",
contentCheck: "R18・過度に暴力的な内容ではありません。",
rightsCheck: "他人の作品・個人情報などを無断で使用していません。",
terms: "自分が投稿する権利を持つ画像であり、問題がある場合は運営者が非表示・削除できることに同意します。",
postSubmit: "投稿する",
posting: "投稿中…",
postCompleteTitle: "投稿しました！",
postCompleteText: "この世界の共有URLです。",
copyUrl: "URLをコピー",
copied: "コピーしました。",
shareTitle: "この世界を共有",
shareDescription: "投稿文を自由に編集して、そのままXに投稿できます。",
shareToX: "Xに投稿する",
copyText: "文章をコピー",
donationTitle: "ぐるりうむを楽しんでいただけましたか？",
donationText: "ぐるりペイント・ぐるりうむは個人で制作・運営しています。<strong>広告はあんまり好きじゃないので、</strong>今後の開発を応援していただける場合は、寄付をしていただけるとうれしいです。",
donationImageAlt: "寄付のお願い画像",
donationAction: "寄付について詳しく読む",
returnTop: "ぐるりうむのトップへ",
donationHide: "もう表示しない",
empty: "まだ投稿された世界はありません。",
authorX: "作者のXを見る",
authorSite: "作者のサイトを見る",
close: "閉じる",
alreadyReported: "この世界はすでに報告済みです。",
reportSuccess: "報告を受け付けました。この世界は確認のため一時的に非表示になりました。",
reportFailed: "報告できませんでした。",
listFailed: "世界一覧を読み込めませんでした。",
termsRequired: "投稿条件への同意が必要です。",
postFailed: "投稿できませんでした。",
copySelect: "文章を選択しました。コピーしてください。",
urlSelect: "URLを選択しました。コピーしてください。",
fileTooLarge: "画像は10MB以下にしてください。",
imageUnreadable: "画像を読み込めませんでした。別の画像を選択してください。"
},
en: {
siteTitle: "Gururium",
siteDescription: "Worlds created with Gururi Paint",
postWorld: "Post a world",
gururiPaint: "Gururi Paint",
support: "Support JUNOTA",
authorIntro: "Creator",
donate: "Support JUNOTA",
shareWorld: "Share",
top: "Back to top",
reportProblem: "Report",
reportTitle: "Report this world?",
reportText: "Please report this world if you believe it contains rights violations, inappropriate content, or another problem.",
reportNote: "A reported world will be temporarily hidden while it is reviewed.",
reportSubmit: "Report this world",
reporting: "Reporting…",
cancel: "Cancel",
postTitle: "Post a world",
workTitle: "Title",
creatorName: "Creator",
workIntro: "About this work",
introPlaceholder: "Write anything you like",
xUrl: "X URL",
website: "Website",
thumbnail: "Thumbnail",
thumbnailHelp: "Square (1:1), JPG / PNG / WebP, up to 10 MB",
panorama: "Panorama image",
panoramaHelp: "2:1 landscape JPG / PNG / WebP, up to 10 MB. You can use an image saved directly from Gururi Paint.",
contentCheck: "This submission does not contain adult or excessively violent content.",
rightsCheck: "I am not using other people's works or personal information without permission.",
terms: "I have the right to upload these images and agree that the operator may hide or delete problematic submissions.",
postSubmit: "Post",
posting: "Posting…",
postCompleteTitle: "Posted!",
postCompleteText: "Here is the share URL for this world.",
copyUrl: "Copy URL",
copied: "Copied.",
shareTitle: "Share this world",
shareDescription: "Edit the text freely, then post it directly to X.",
shareToX: "Post to X",
copyText: "Copy text",
donationTitle: "Did you enjoy Gururium?",
donationText: "Gururi Paint and Gururium are independently created and operated by one person. <strong>I’m not a big fan of ads,</strong> so if you’d like to support future development, I’d be grateful for a donation.",
donationImageAlt: "Donation request image",
donationAction: "Learn more about supporting this project",
returnTop: "Back to Gururium",
donationHide: "Don't show this again",
empty: "No worlds have been posted yet.",
authorX: "View creator's X",
authorSite: "View creator's website",
close: "Close",
alreadyReported: "You have already reported this world.",
reportSuccess: "Thank you. This world has been temporarily hidden while it is reviewed.",
reportFailed: "Could not submit the report.",
listFailed: "Could not load the worlds.",
termsRequired: "You must agree to the submission terms.",
postFailed: "Could not post this world.",
copySelect: "The text has been selected. Please copy it.",
urlSelect: "The URL has been selected. Please copy it.",
fileTooLarge: "Images must be 10 MB or smaller.",
imageUnreadable: "The image could not be loaded. Please choose another image."
}
};

function getInitialLanguage() {

const parameters =
new URLSearchParams(
window.location.search
);

const urlLanguage =
parameters.get(
"lang"
);

if (
urlLanguage === "ja" ||
urlLanguage === "en"
) {
return urlLanguage;
}

try {

const savedLanguage =
localStorage.getItem(
LANGUAGE_STORAGE_KEY
);

if (
savedLanguage === "ja" ||
savedLanguage === "en"
) {
return savedLanguage;
}

} catch (error) {
}

return navigator.language
.toLowerCase()
.startsWith("ja")
? "ja"
: "en";

}

let currentLanguage =
getInitialLanguage();

function t(
key
) {

return (
TEXT[currentLanguage][key] ||
TEXT.ja[key] ||
key
);

}

const topScreen =
document.getElementById("topScreen");

const viewerScreen =
document.getElementById("viewerScreen");

const panoramaContainer =
document.getElementById("panoramaContainer");

const worldList =
document.getElementById("worldList");

const emptyMessage =
document.getElementById("emptyMessage");

const postButton =
document.getElementById("postButton");

const gururiPaintButton =
document.querySelector(".gururi-paint-button");

const topDonateButton =
document.getElementById("topDonateButton");

const topLanguageButton =
document.getElementById("topLanguageButton");

const viewerLanguageButton =
document.getElementById("viewerLanguageButton");

const postPanel =
document.getElementById("postPanel");

const postCompletePanel =
document.getElementById("postCompletePanel");

const postCompleteCloseButton =
document.getElementById("postCompleteCloseButton");

const postShareUrl =
document.getElementById("postShareUrl");

const copyShareUrlButton =
document.getElementById("copyShareUrlButton");

const copyShareUrlMessage =
document.getElementById("copyShareUrlMessage");

const postCloseButton =
document.getElementById("postCloseButton");

const postForm =
document.getElementById("postForm");

const postContentCheck =
document.getElementById("postContentCheck");

const postRightsCheck =
document.getElementById("postRightsCheck");

const postTerms =
document.getElementById("postTerms");

const postThumbnail =
document.getElementById("postThumbnail");

const postPanorama =
document.getElementById("postPanorama");

const thumbnailWarning =
document.getElementById("thumbnailWarning");

const panoramaWarning =
document.getElementById("panoramaWarning");

const postError =
document.getElementById("postError");

const postSubmitButton =
document.getElementById("postSubmitButton");

const authorButton =
document.getElementById("authorButton");

const donateButton =
document.getElementById("donateButton");

const shareButton =
document.getElementById("shareButton");

const sharePanel =
document.getElementById("sharePanel");

const shareCloseButton =
document.getElementById("shareCloseButton");

const sharePostText =
document.getElementById("sharePostText");

const shareToXButton =
document.getElementById("shareToXButton");

const copyShareTextButton =
document.getElementById("copyShareTextButton");

const shareCopyMessage =
document.getElementById("shareCopyMessage");

const backButton =
document.getElementById("backButton");

const reportButton =
document.getElementById("reportButton");

const reportPanel =
document.getElementById("reportPanel");

const reportCloseButton =
document.getElementById("reportCloseButton");

const reportSubmitButton =
document.getElementById("reportSubmitButton");

const reportCancelButton =
document.getElementById("reportCancelButton");

const reportError =
document.getElementById("reportError");

const authorPanel =
document.getElementById("authorPanel");

const authorCloseButton =
document.getElementById("authorCloseButton");

const authorWorkTitle =
document.getElementById("authorWorkTitle");

const authorName =
document.getElementById("authorName");

const authorDescription =
document.getElementById("authorDescription");

const authorLinks =
document.getElementById("authorLinks");

const donationPanel =
document.getElementById("donationPanel");

const donationImage =
document.getElementById("donationImage");

const donationCloseButton =
document.getElementById("donationCloseButton");

const donationActionButton =
document.getElementById("donationActionButton");

const returnTopButton =
document.getElementById("returnTopButton");

const donationHideCheckbox =
document.getElementById("donationHideCheckbox");

let currentWorld =
null;

function trackEvent(
eventName,
parameters = {}
) {

if (
typeof window.gtag !== "function"
) {
return;
}

window.gtag(
"event",
eventName,
parameters
);

}

function getCurrentWorldAnalyticsData() {

if (!currentWorld) {
return {};
}

return {
world_id: currentWorld.id,
world_title: currentWorld.title,
world_author: currentWorld.author,
language: currentLanguage
};

}


function applyLanguage() {

document.documentElement.lang =
currentLanguage;

document.title =
t("siteTitle");

document.querySelector(
".site-title"
).textContent =
t("siteTitle");

document.querySelector(
".site-description"
).textContent =
t("siteDescription");

postButton.textContent =
t("postWorld");

document.querySelector(
".gururi-paint-button"
).textContent =
t("gururiPaint");

topDonateButton.textContent =
t("support");

authorButton.textContent =
t("authorIntro");

donateButton.textContent =
t("donate");

shareButton.textContent =
t("shareWorld");

backButton.lastElementChild.textContent =
t("top");

reportButton.textContent =
t("reportProblem");

reportPanel.querySelector(
".modal-title"
).textContent =
t("reportTitle");

reportPanel.querySelector(
".report-text"
).textContent =
t("reportText");

reportPanel.querySelector(
".report-note"
).textContent =
t("reportNote");

reportSubmitButton.textContent =
t("reportSubmit");

reportCancelButton.textContent =
t("cancel");

postPanel.querySelector(
".modal-title"
).textContent =
t("postTitle");

document.getElementById(
"postTitle"
).previousElementSibling.textContent =
t("workTitle");

document.getElementById(
"postAuthor"
).previousElementSibling.textContent =
t("creatorName");

document.getElementById(
"postDescription"
).previousElementSibling.textContent =
t("workIntro");

document.getElementById(
"postDescription"
).placeholder =
t("introPlaceholder");

document.getElementById(
"postXUrl"
).previousElementSibling.textContent =
t("xUrl");

document.getElementById(
"postExternalUrl"
).previousElementSibling.textContent =
t("website");

postThumbnail.previousElementSibling.textContent =
t("thumbnail");

postThumbnail.parentElement.querySelector(
"small"
).textContent =
t("thumbnailHelp");

postPanorama.previousElementSibling.textContent =
t("panorama");

postPanorama.parentElement.querySelector(
"small"
).textContent =
t("panoramaHelp");

postContentCheck.nextElementSibling.textContent =
t("contentCheck");

postRightsCheck.nextElementSibling.textContent =
t("rightsCheck");

postTerms.nextElementSibling.textContent =
t("terms");

postSubmitButton.textContent =
t("postSubmit");

postCompletePanel.querySelector(
".modal-title"
).textContent =
t("postCompleteTitle");

postCompletePanel.querySelector(
".post-complete-text"
).textContent =
t("postCompleteText");

copyShareUrlButton.textContent =
t("copyUrl");

sharePanel.querySelector(
".modal-title"
).textContent =
t("shareTitle");

sharePanel.querySelector(
".share-description"
).textContent =
t("shareDescription");

shareToXButton.textContent =
t("shareToX");

copyShareTextButton.textContent =
t("copyText");

donationPanel.querySelector(
".modal-title"
).textContent =
t("donationTitle");

donationPanel.querySelector(
".donation-text"
).innerHTML =
t("donationText");

donationImage.src =
currentLanguage === "ja"
? "./assets/donation-support.png?v=2026090421"
: "./assets/donation-support-en.png?v=2026090421";

donationImage.alt =
t("donationImageAlt");

donationActionButton.textContent =
t("donationAction");

returnTopButton.textContent =
t("returnTop");

donationHideCheckbox.nextElementSibling.textContent =
t("donationHide");

emptyMessage.textContent =
t("empty");

document.querySelectorAll(
".modal-close"
).forEach(
(button) => {

button.setAttribute(
"aria-label",
t("close")
);

}
);

const nextLanguageLabel =
currentLanguage === "ja"
? "EN"
: "日本語";

topLanguageButton.textContent =
nextLanguageLabel;

viewerLanguageButton.textContent =
nextLanguageLabel;

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
}

const url =
new URL(
window.location.href
);

url.searchParams.set(
"lang",
currentLanguage
);

window.history.replaceState(
{},
"",
url
);

applyLanguage();

if (
currentWorld &&
!sharePanel.classList.contains(
"hidden"
)
) {

sharePostText.value =
createSharePostText();

}

}

function toggleLanguage() {

setLanguage(
currentLanguage === "ja"
? "en"
: "ja"
);

}


const scene =
new THREE.Scene();

const camera =
new THREE.PerspectiveCamera(
85,
1,
0.1,
1000
);

camera.position.set(
0,
0,
0.1
);

const renderer =
new THREE.WebGLRenderer({
antialias: true
});

renderer.setPixelRatio(
Math.min(
window.devicePixelRatio,
2
)
);

panoramaContainer.appendChild(
renderer.domElement
);

const geometry =
new THREE.SphereGeometry(
500,
60,
40
);

geometry.scale(
-1,
1,
1
);

const material =
new THREE.MeshBasicMaterial();

const panorama =
new THREE.Mesh(
geometry,
material
);

scene.add(
panorama
);

const textureLoader =
new THREE.TextureLoader();

let longitude =
0;

let latitude =
0;

let targetLongitude =
0;

let targetLatitude =
0;

let isDragging =
false;

let startX =
0;

let startY =
0;

let startLongitude =
0;

let startLatitude =
0;

const activePointers =
new Map();

let pinchStartDistance =
null;

let pinchStartFov =
null;

function resizeViewer() {

const width =
Math.max(
1,
panoramaContainer.clientWidth
);

const height =
Math.max(
1,
panoramaContainer.clientHeight
);

camera.aspect =
width / height;

camera.updateProjectionMatrix();

renderer.setSize(
width,
height,
false
);

}

function getPointerDistance(
pointA,
pointB
) {

const dx =
pointA.x - pointB.x;

const dy =
pointA.y - pointB.y;

return Math.hypot(
dx,
dy
);

}

function resetView() {

longitude =
0;

latitude =
0;

targetLongitude =
0;

targetLatitude =
0;

camera.fov =
85;

camera.updateProjectionMatrix();

activePointers.clear();

pinchStartDistance =
null;

pinchStartFov =
null;

isDragging =
false;

}

function loadWorld(
worldId
) {

const world =
worlds[worldId];

if (!world) {
return;
}

currentWorld =
world;

const worldUrl =
new URL(
window.location.href
);

worldUrl.searchParams.set(
"world",
worldId
);

window.history.replaceState(
{},
"",
worldUrl
);

textureLoader.load(
world.panorama,
(texture) => {

texture.colorSpace =
THREE.SRGBColorSpace;

if (
panorama.material.map
) {

panorama.material.map.dispose();

}

panorama.material.map =
texture;

panorama.material.needsUpdate =
true;

resetView();

topScreen.classList.add(
"hidden"
);

viewerScreen.classList.remove(
"hidden"
);

resizeViewer();

trackEvent(
"world_view",
getCurrentWorldAnalyticsData()
);

}
);

}

function showTop() {

viewerScreen.classList.add(
"hidden"
);

topScreen.classList.remove(
"hidden"
);

currentWorld =
null;

const topUrl =
new URL(
window.location.href
);

topUrl.searchParams.delete(
"world"
);

window.history.replaceState(
{},
"",
topUrl
);

}

function openAuthorPanel() {

if (!currentWorld) {
return;
}

authorWorkTitle.textContent =
currentWorld.title;

authorName.textContent =
currentWorld.author;

authorDescription.textContent =
currentWorld.description || "";

authorLinks.innerHTML =
"";

if (currentWorld.xUrl) {

const xLink =
document.createElement("a");

xLink.href =
currentWorld.xUrl;

xLink.target =
"_blank";

xLink.rel =
"noopener noreferrer";

xLink.textContent =
t("authorX");

authorLinks.appendChild(
xLink
);

}

if (currentWorld.externalUrl) {

const externalLink =
document.createElement("a");

externalLink.href =
currentWorld.externalUrl;

externalLink.target =
"_blank";

externalLink.rel =
"noopener noreferrer";

externalLink.textContent =
t("authorSite");

authorLinks.appendChild(
externalLink
);

}

authorPanel.classList.remove(
"hidden"
);

}

function closeAuthorPanel() {

authorPanel.classList.add(
"hidden"
);

}

let donationShouldReturnTop =
false;

function shouldHideDonationPanel() {

try {

return (
localStorage.getItem(
DONATION_HIDE_STORAGE_KEY
) === "1"
);

} catch (error) {

return false;

}

}

function saveDonationHidePreference() {

if (!donationHideCheckbox.checked) {
return;
}

try {

localStorage.setItem(
DONATION_HIDE_STORAGE_KEY,
"1"
);

} catch (error) {
}

}

function openDonationPanel(
returnToTop = false
) {

if (
returnToTop &&
shouldHideDonationPanel()
) {

showTop();
return;

}

donationShouldReturnTop =
returnToTop;

donationHideCheckbox.checked =
false;

donationHideCheckbox.closest(
".donation-hide-option"
).style.display =
returnToTop
? "flex"
: "none";

donationPanel.classList.remove(
"hidden"
);

}

function closeDonationPanel() {

donationPanel.classList.add(
"hidden"
);

}

function closeDonationPanelByUser() {

saveDonationHidePreference();

closeDonationPanel();

if (
donationShouldReturnTop
) {

showTop();

}

donationShouldReturnTop =
false;

}

function openReportPanel() {

if (!currentWorld) {
return;
}

reportError.textContent =
"";

reportError.classList.add(
"hidden"
);

reportPanel.classList.remove(
"hidden"
);

}

function closeReportPanel() {

reportPanel.classList.add(
"hidden"
);

}

async function submitReport() {

if (!currentWorld) {
return;
}

const worldId =
currentWorld.id;

reportSubmitButton.disabled =
true;

reportSubmitButton.textContent =
"報告中…";

reportError.classList.add(
"hidden"
);

try {

const response =
await fetch(
"./api/report-world.php",
{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
worldId
})
}
);

const result =
await response.json();

if (
!response.ok ||
!result.success
) {

throw new Error(
result.error ||
"報告できませんでした。"
);

}



closeReportPanel();

window.alert(
"報告を受け付けました。この世界は確認のため一時的に非表示になりました。"
);

await loadWorldList();

showTop();

} catch (error) {

reportError.textContent =
error.message ||
"報告できませんでした。";

reportError.classList.remove(
"hidden"
);

} finally {

reportSubmitButton.disabled =
false;

reportSubmitButton.textContent =
"問題を報告する";

}

}

function getCurrentWorldShareUrl() {

if (!currentWorld) {
return "";
}

const shareUrl =
new URL(
"./share.php",
window.location.href
);

shareUrl.searchParams.set(
"world",
currentWorld.id
);

shareUrl.searchParams.set(
"lang",
currentLanguage
);

return shareUrl.toString();

}

function createSharePostText() {

if (!currentWorld) {
return "";
}

const shareUrl =
getCurrentWorldShareUrl();

if (
currentLanguage === "en"
) {

return `${currentWorld.title}
Creator: ${currentWorld.author}

${shareUrl}

#GururiPaint #Gururium`;

}

return `${currentWorld.title}
作者：${currentWorld.author}

${shareUrl}

#ぐるりペイント #ぐるりうむ`;

}

function openSharePanel() {

if (!currentWorld) {
return;
}

sharePostText.value =
createSharePostText();

shareCopyMessage.classList.add(
"hidden"
);

sharePanel.classList.remove(
"hidden"
);

}

function closeSharePanel() {

sharePanel.classList.add(
"hidden"
);

}

function shareCurrentWorldToX() {

const text =
sharePostText.value.trim();

if (!text) {
return;
}

const xUrl =
"https://twitter.com/intent/tweet?text=" +
encodeURIComponent(
text
);

window.open(
xUrl,
"_blank",
"noopener,noreferrer"
);

}

async function copySharePostText() {

const text =
sharePostText.value;

try {

await navigator.clipboard.writeText(
text
);

shareCopyMessage.textContent =
"コピーしました。";

shareCopyMessage.classList.remove(
"hidden"
);

} catch (error) {

sharePostText.focus();

sharePostText.select();

shareCopyMessage.textContent =
"文章を選択しました。コピーしてください。";

shareCopyMessage.classList.remove(
"hidden"
);

}

}

function escapeHtml(
value
) {

return String(value)
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll("\"", "&quot;")
.replaceAll("'", "&#039;");

}

function renderWorldList() {

worldList.innerHTML =
"";

const allWorlds =
Object.values(
worlds
);

const pinnedWorlds =
PINNED_WORLD_IDS
.map(
(worldId) =>
allWorlds.find(
(world) =>
world.id === worldId
)
)
.filter(
Boolean
);

const otherWorlds =
allWorlds.filter(
(world) =>
!PINNED_WORLD_IDS.includes(
world.id
)
);

const worldArray = [
...pinnedWorlds,
...otherWorlds
];

if (
worldArray.length === 0
) {

emptyMessage.classList.remove(
"hidden"
);

return;

}

emptyMessage.classList.add(
"hidden"
);

worldArray.forEach(
(world) => {

const card =
document.createElement(
"button"
);

card.type =
"button";

card.className =
"world-card";

card.dataset.world =
world.id;

card.innerHTML =
`<img src="${escapeHtml(world.thumbnail)}" alt=""><div class="world-card-info"><strong>${escapeHtml(world.title)}</strong><span>${escapeHtml(world.author)}</span></div>`;

card.addEventListener(
"click",
() => {

loadWorld(
world.id
);

}
);

worldList.appendChild(
card
);

}
);

}

async function loadWorldList() {

try {

const response =
await fetch(
"./api/worlds.php",
{
cache: "no-store"
}
);

if (!response.ok) {
throw new Error(
"世界一覧を読み込めませんでした。"
);
}

const worldArray =
await response.json();

worlds =
{};

worldArray.forEach(
(world) => {

worlds[world.id] =
world;

}
);

renderWorldList();

const parameters =
new URLSearchParams(
window.location.search
);

const requestedWorldId =
parameters.get(
"world"
);

if (
requestedWorldId &&
worlds[requestedWorldId]
) {

loadWorld(
requestedWorldId
);

}

} catch (error) {

console.error(
error
);

emptyMessage.textContent =
"世界一覧を読み込めませんでした。";

emptyMessage.classList.remove(
"hidden"
);

}

}

function checkImageRatio(
input,
warningElement,
type
) {

warningElement.textContent =
"";

warningElement.classList.add(
"hidden"
);

input.setCustomValidity(
""
);

const file =
input.files[0];

if (!file) {
return;
}

if (
file.size >
10 * 1024 * 1024
) {

const message =
t("fileTooLarge");

warningElement.textContent =
message;

warningElement.classList.remove(
"hidden"
);

input.setCustomValidity(
message
);

return;

}

const image =
new Image();

const objectUrl =
URL.createObjectURL(
file
);

image.onload =
() => {

URL.revokeObjectURL(
objectUrl
);

const width =
image.naturalWidth;

const height =
image.naturalHeight;

if (
!width ||
!height
) {
return;
}

const ratio =
width / height;

let message =
"";

if (
type === "thumbnail" &&
(
ratio < 0.98 ||
ratio > 1.02
)
) {

message =
currentLanguage === "ja"
? `サムネイル画像は正方形（1：1）にしてください。現在は ${width} × ${height}px です。`
: `The thumbnail must be square (1:1). The selected image is ${width} × ${height}px.`;

}

if (
type === "panorama" &&
(
ratio < 1.9 ||
ratio > 2.1
)
) {

message =
currentLanguage === "ja"
? `ぐるり画像は横2：縦1にしてください。現在は ${width} × ${height}px です。`
: `The panorama must have a 2:1 landscape ratio. The selected image is ${width} × ${height}px.`;

}

if (message) {

warningElement.textContent =
message;

warningElement.classList.remove(
"hidden"
);

input.setCustomValidity(
message
);

}

};

image.onerror =
() => {

URL.revokeObjectURL(
objectUrl
);

const message =
t("imageUnreadable");

warningElement.textContent =
message;

warningElement.classList.remove(
"hidden"
);

input.setCustomValidity(
message
);

};

image.src =
objectUrl;

}

postThumbnail.addEventListener(
"change",
() => {

checkImageRatio(
postThumbnail,
thumbnailWarning,
"thumbnail"
);

}
);

postPanorama.addEventListener(
"change",
() => {

checkImageRatio(
postPanorama,
panoramaWarning,
"panorama"
);

}
);

function openPostPanel() {

postError.classList.add(
"hidden"
);

postError.textContent =
"";

postPanel.classList.remove(
"hidden"
);

}

function closePostPanel() {

postPanel.classList.add(
"hidden"
);

}

function openPostCompletePanel(
worldId
) {

const shareUrl =
new URL(
"./share.php",
window.location.href
);

shareUrl.searchParams.set(
"world",
worldId
);

shareUrl.searchParams.set(
"lang",
currentLanguage
);

postShareUrl.value =
shareUrl.toString();

copyShareUrlMessage.classList.add(
"hidden"
);

postCompletePanel.classList.remove(
"hidden"
);

}

function closePostCompletePanel() {

postCompletePanel.classList.add(
"hidden"
);

showTop();

}

async function copyPostShareUrl() {

const shareUrl =
postShareUrl.value;

try {

await navigator.clipboard.writeText(
shareUrl
);

copyShareUrlMessage.textContent =
"コピーしました。";

copyShareUrlMessage.classList.remove(
"hidden"
);

} catch (error) {

postShareUrl.focus();

postShareUrl.select();

copyShareUrlMessage.textContent =
"URLを選択しました。コピーしてください。";

copyShareUrlMessage.classList.remove(
"hidden"
);

}

}

topLanguageButton.addEventListener(
"click",
() => {

toggleLanguage();

}
);

viewerLanguageButton.addEventListener(
"click",
() => {

toggleLanguage();

}
);

postButton.addEventListener(
"click",
() => {

trackEvent(
"post_open",
{
language: currentLanguage
}
);

openPostPanel();

}
);

gururiPaintButton.addEventListener(
"click",
() => {

trackEvent(
"gururi_paint_click",
{
language: currentLanguage
}
);

}
);

topDonateButton.addEventListener(
"click",
() => {

trackEvent(
"support_open",
{
location: "top",
language: currentLanguage
}
);

openDonationPanel(
false
);

}
);

postCloseButton.addEventListener(
"click",
() => {

closePostPanel();

}
);



postForm.addEventListener(
"submit",
async (event) => {

event.preventDefault();

postError.classList.add(
"hidden"
);

postError.textContent =
"";

if (
!postContentCheck.checked ||
!postRightsCheck.checked ||
!postTerms.checked
) {

postError.textContent =
t("termsRequired");

postError.classList.remove(
"hidden"
);

return;

}

const formData =
new FormData(
postForm
);

formData.set(
"termsAccepted",
"1"
);

postSubmitButton.disabled =
true;

postSubmitButton.textContent =
"投稿中…";

try {

const response =
await fetch(
"./api/create-world.php",
{
method: "POST",
body: formData
}
);

const result =
await response.json();

if (
!response.ok ||
!result.success
) {

throw new Error(
result.error ||
"投稿できませんでした。"
);

}

postForm.reset();

closePostPanel();

await loadWorldList();

if (
result.world &&
result.world.id
) {

trackEvent(
"post_complete",
{
world_id: result.world.id,
world_title: result.world.title || "",
world_author: result.world.author || "",
language: currentLanguage
}
);

openPostCompletePanel(
result.world.id
);

}

} catch (error) {

postError.textContent =
error.message ||
"投稿できませんでした。";

postError.classList.remove(
"hidden"
);

} finally {

postSubmitButton.disabled =
false;

postSubmitButton.textContent =
"投稿する";

}

}
);

postCompleteCloseButton.addEventListener(
"click",
() => {

closePostCompletePanel();

}
);

copyShareUrlButton.addEventListener(
"click",
() => {

copyPostShareUrl();

}
);

postCompletePanel.addEventListener(
"click",
(event) => {

if (
event.target === postCompletePanel
) {

closePostCompletePanel();

}

}
);

authorButton.addEventListener(
"click",
() => {

trackEvent(
"author_open",
getCurrentWorldAnalyticsData()
);

openAuthorPanel();

}
);

authorCloseButton.addEventListener(
"click",
() => {

closeAuthorPanel();

}
);

donateButton.addEventListener(
"click",
() => {

trackEvent(
"support_open",
{
...getCurrentWorldAnalyticsData(),
location: "viewer"
}
);

openDonationPanel();

}
);

donationCloseButton.addEventListener(
"click",
() => {

closeDonationPanelByUser();

}
);

shareButton.addEventListener(
"click",
() => {

trackEvent(
"world_share",
getCurrentWorldAnalyticsData()
);

openSharePanel();

}
);

shareCloseButton.addEventListener(
"click",
() => {

closeSharePanel();

}
);

shareToXButton.addEventListener(
"click",
() => {

trackEvent(
"share_x",
getCurrentWorldAnalyticsData()
);

shareCurrentWorldToX();

}
);

copyShareTextButton.addEventListener(
"click",
() => {

copySharePostText();

}
);

sharePanel.addEventListener(
"click",
(event) => {

if (
event.target === sharePanel
) {

closeSharePanel();

}

}
);

backButton.addEventListener(
"click",
() => {

openDonationPanel(
true
);

}
);

reportButton.addEventListener(
"click",
() => {

openReportPanel();

}
);

reportCloseButton.addEventListener(
"click",
() => {

closeReportPanel();

}
);

reportCancelButton.addEventListener(
"click",
() => {

closeReportPanel();

}
);

reportSubmitButton.addEventListener(
"click",
() => {

submitReport();

}
);

reportPanel.addEventListener(
"click",
(event) => {

if (
event.target === reportPanel
) {

closeReportPanel();

}

}
);

returnTopButton.addEventListener(
"click",
() => {

saveDonationHidePreference();

closeDonationPanel();

donationShouldReturnTop =
false;

showTop();

}
);

donationActionButton.addEventListener(
"click",
() => {

trackEvent(
"donation_link_click",
{
...getCurrentWorldAnalyticsData(),
language: currentLanguage
}
);

const donationUrl =
DONATION_URLS[currentLanguage];

window.open(
donationUrl,
"_blank",
"noopener,noreferrer"
);

}
);

authorPanel.addEventListener(
"click",
(event) => {

if (
event.target === authorPanel
) {

closeAuthorPanel();

}

}
);

donationPanel.addEventListener(
"click",
(event) => {

if (
event.target === donationPanel
) {

closeDonationPanelByUser();

}

}
);

renderer.domElement.addEventListener(
"pointerdown",
(event) => {

activePointers.set(
event.pointerId,
{
x: event.clientX,
y: event.clientY
}
);

renderer.domElement.setPointerCapture(
event.pointerId
);

if (
activePointers.size === 1
) {

isDragging =
true;

startX =
event.clientX;

startY =
event.clientY;

startLongitude =
targetLongitude;

startLatitude =
targetLatitude;

}

if (
activePointers.size === 2
) {

isDragging =
false;

const points =
Array.from(
activePointers.values()
);

pinchStartDistance =
getPointerDistance(
points[0],
points[1]
);

pinchStartFov =
camera.fov;

}

}
);

renderer.domElement.addEventListener(
"pointermove",
(event) => {

if (
!activePointers.has(
event.pointerId
)
) {
return;
}

activePointers.set(
event.pointerId,
{
x: event.clientX,
y: event.clientY
}
);

if (
activePointers.size === 2
) {

const points =
Array.from(
activePointers.values()
);

const distance =
getPointerDistance(
points[0],
points[1]
);

if (
pinchStartDistance === null ||
pinchStartFov === null
) {
return;
}

const ratio =
pinchStartDistance / distance;

camera.fov =
THREE.MathUtils.clamp(
pinchStartFov * ratio,
20,
120
);

camera.updateProjectionMatrix();

return;

}

if (!isDragging) {
return;
}

const deltaX =
event.clientX - startX;

const deltaY =
event.clientY - startY;

const sensitivity =
window.matchMedia(
"(max-width: 600px)"
).matches
? 0.3
: 0.1;

targetLongitude =
startLongitude -
deltaX * sensitivity;

targetLatitude =
startLatitude +
deltaY * sensitivity;

targetLatitude =
THREE.MathUtils.clamp(
targetLatitude,
-85,
85
);

}
);

function endPointer(
event
) {

activePointers.delete(
event.pointerId
);

if (
activePointers.size === 0
) {

isDragging =
false;

pinchStartDistance =
null;

pinchStartFov =
null;

return;

}

if (
activePointers.size === 1
) {

const remaining =
Array.from(
activePointers.values()
)[0];

isDragging =
true;

startX =
remaining.x;

startY =
remaining.y;

startLongitude =
targetLongitude;

startLatitude =
targetLatitude;

pinchStartDistance =
null;

pinchStartFov =
null;

}

}

renderer.domElement.addEventListener(
"pointerup",
endPointer
);

renderer.domElement.addEventListener(
"pointercancel",
endPointer
);

renderer.domElement.addEventListener(
"wheel",
(event) => {

event.preventDefault();

camera.fov =
THREE.MathUtils.clamp(
camera.fov +
event.deltaY * 0.03,
20,
120
);

camera.updateProjectionMatrix();

},
{
passive: false
}
);

function animate() {

requestAnimationFrame(
animate
);

longitude +=
(
targetLongitude -
longitude
) * 0.12;

latitude +=
(
targetLatitude -
latitude
) * 0.12;

const phi =
THREE.MathUtils.degToRad(
90 - latitude
);

const theta =
THREE.MathUtils.degToRad(
longitude
);

camera.lookAt(
500 *
Math.sin(phi) *
Math.cos(theta),
500 *
Math.cos(phi),
500 *
Math.sin(phi) *
Math.sin(theta)
);

renderer.render(
scene,
camera
);

}

window.addEventListener(
"resize",
resizeViewer
);

resizeViewer();

animate();

applyLanguage();

loadWorldList();