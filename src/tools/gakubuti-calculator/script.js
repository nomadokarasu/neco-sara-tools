// ========================================
// 要素取得
// ========================================

const calculateButton =
document.getElementById("calculateButton");

const downloadButton =
document.getElementById("downloadButton");

const resultSection =
document.getElementById("resultSection");

const drawingSection =
document.getElementById("drawingSection");

const downloadSection =
document.getElementById("downloadSection");

const errorMessage =
document.getElementById("errorMessage");

const woodDrawing =
document.getElementById("woodDrawing");

const frameDrawing =
document.getElementById("frameDrawing");


// ========================================
// 数値取得
// ========================================

function getNumber(id) {

const element =
document.getElementById(id);

const value =
parseFloat(element.value);

return value;

}


// ========================================
// 数値表示
// ========================================

function formatNumber(value) {

return Number(
value.toFixed(2)
).toString();

}


// ========================================
// 計算
// ========================================

function calculateFrame() {

errorMessage.textContent = "";


// ----------------------------------------
// 入力値
// ----------------------------------------

const woodVertical =
getNumber("woodVertical");

const woodHorizontal =
getNumber("woodHorizontal");

const overlap =
getNumber("overlap");

const artHeight =
getNumber("artHeight");

const artWidth =
getNumber("artWidth");

const artThickness =
getNumber("artThickness");

const clearance =
getNumber("clearance");


const direction =
"vertical";


// ----------------------------------------
// 入力チェック
// ----------------------------------------

const values = [
woodVertical,
woodHorizontal,
overlap,
artHeight,
artWidth,
artThickness,
clearance
];


if (
values.some(
value => Number.isNaN(value)
)
) {

showError(
"すべての項目を入力してください。"
);

return;
}


if (
woodVertical <= 0 ||
woodHorizontal <= 0 ||
artHeight <= 0 ||
artWidth <= 0
) {

showError(
"寸法には0より大きい数値を入力してください。"
);

return;
}


if (
overlap < 0 ||
artThickness < 0 ||
clearance < 0
) {

showError(
"0以上の数値を入力してください。"
);

return;
}


if (
overlap * 2 >= artHeight ||
overlap * 2 >= artWidth
) {

showError(
"絵にかぶさる部分の寸法が大きすぎます。"
);

return;
}


// ----------------------------------------
// カット寸法
// ----------------------------------------

let verticalCut;
let horizontalCut;


// 縦部材（勝ち部材）

verticalCut =
artHeight +
((woodHorizontal - overlap) * 2) +
clearance;


// 横部材（負け部材）

horizontalCut =
artWidth +
clearance -
(overlap * 2);


// ----------------------------------------
// アクリル板
// ----------------------------------------

const acrylicHeight =
artHeight;

const acrylicWidth =
artWidth;


// ----------------------------------------
// 完成外寸
//
// 絵の外周に角材が出る寸法：
// 角材の縦寸法 - かぶさり寸法
// ----------------------------------------

const outsideAmount =
woodHorizontal - overlap;


const frameHeight =
artHeight +
(outsideAmount * 2) +
clearance;


const frameWidth =
artWidth +
(outsideAmount * 2) +
clearance;


// 額縁の奥行きは
// 角材の横寸法とする

const frameDepth =
woodHorizontal;


// ----------------------------------------
// 結果
// ----------------------------------------

document.getElementById(
"verticalCutResult"
).textContent =
`${formatNumber(verticalCut)} mm`;


document.getElementById(
"horizontalCutResult"
).textContent =
`${formatNumber(horizontalCut)} mm`;


document.getElementById(
"acrylicResult"
).textContent =
`${formatNumber(acrylicHeight)} × ` +
`${formatNumber(acrylicWidth)} mm`;


document.getElementById(
"frameHeightResult"
).textContent =
`${formatNumber(frameHeight)} mm`;


document.getElementById(
"frameWidthResult"
).textContent =
`${formatNumber(frameWidth)} mm`;


document.getElementById(
"frameDepthResult"
).textContent =
`${formatNumber(frameDepth)} mm`;


// ----------------------------------------
// 図面
// ----------------------------------------

drawWoodSection({
woodVertical,
woodHorizontal,
overlap,
artThickness
});


drawFrame({
artHeight,
artWidth,
frameHeight,
frameWidth,
verticalCut,
horizontalCut,
woodVertical,
woodHorizontal,
overlap,
clearance,
direction
});


// ----------------------------------------
// 表示
// ----------------------------------------

resultSection.hidden = false;

drawingSection.hidden = false;

downloadSection.hidden = false;


resultSection.scrollIntoView({
behavior: "smooth",
block: "start"
});

}


// ========================================
// エラー
// ========================================

function showError(message) {

errorMessage.textContent =
message;

resultSection.hidden = true;

drawingSection.hidden = true;

downloadSection.hidden = true;

}


// ========================================
// 角材断面図
// ========================================

function drawWoodSection(data) {

const sourceSvg =
document.getElementById(
"woodProfileSvg"
);

if (!sourceSvg) {
return;
}

const clonedSvg =
sourceSvg.cloneNode(true);

clonedSvg.removeAttribute(
"id"
);

clonedSvg.classList.add(
"wood-svg"
);

woodDrawing.innerHTML =
"";

woodDrawing.appendChild(
clonedSvg
);

}


// ========================================
// 額縁正面図
// ========================================

function drawFrame(data) {

const {
artHeight,
artWidth,
frameHeight,
frameWidth,
verticalCut,
horizontalCut,
direction
} = data;


// ----------------------------------------
// 表示用サイズ
// ----------------------------------------

const maxWidth = 360;
const maxHeight = 360;


const scale =
Math.min(
maxWidth / frameWidth,
maxHeight / frameHeight
);


const displayWidth =
frameWidth * scale;

const displayHeight =
frameHeight * scale;


const artDisplayWidth =
artWidth * scale;

const artDisplayHeight =
artHeight * scale;


const partWidth =
data.woodHorizontal * scale;


const frameX =
300 - (displayWidth / 2);

const frameCenterY =
270;

const frameY =
frameCenterY - (displayHeight / 2);


const artX =
300 - (artDisplayWidth / 2);

const artY =
frameCenterY - (artDisplayHeight / 2);


const directionText =
direction === "vertical"
? "縦勝ち"
: "横勝ち";


frameDrawingFront.innerHTML = `

<svg
class="frame-svg"
viewBox="0 0 600 520"
role="img"
aria-label="額縁の完成寸法図"
>

<!-- 絵 -->

<defs>
<clipPath id="frontDrawingArtClip">
<rect
x="${artX}"
y="${artY}"
width="${artDisplayWidth}"
height="${artDisplayHeight}"
/>
</clipPath>
</defs>

<image
href="./images/sample-art.jpg"
x="${artX}"
y="${artY}"
width="${artDisplayWidth}"
height="${artDisplayHeight}"
preserveAspectRatio="xMidYMid slice"
clip-path="url(#frontDrawingArtClip)"
/>


<!-- 4本の角材 -->

<rect
x="${frameX}"
y="${frameY}"
width="${displayWidth}"
height="${partWidth}"
class="frame-part"
/>

<rect
x="${frameX}"
y="${frameY + displayHeight - partWidth}"
width="${displayWidth}"
height="${partWidth}"
class="frame-part"
/>

<rect
x="${frameX}"
y="${frameY}"
width="${partWidth}"
height="${displayHeight}"
class="frame-part"
/>

<rect
x="${frameX + displayWidth - partWidth}"
y="${frameY}"
width="${partWidth}"
height="${displayHeight}"
class="frame-part"
/>





<!-- 横外寸 -->

<line
x1="${frameX}"
y1="70"
x2="${frameX + displayWidth}"
y2="70"
class="dimension-line"
/>

<line
x1="${frameX}"
y1="58"
x2="${frameX}"
y2="82"
class="dimension-line"
/>

<line
x1="${frameX + displayWidth}"
y1="58"
x2="${frameX + displayWidth}"
y2="82"
class="dimension-line"
/>

<text
x="300"
y="48"
class="drawing-dimension-text"
>
${formatNumber(frameWidth)} mm
</text>


<!-- 縦外寸 -->

<line
x1="${frameX - 35}"
y1="${frameY}"
x2="${frameX - 35}"
y2="${frameY + displayHeight}"
class="dimension-line"
/>

<line
x1="${frameX - 45}"
y1="${frameY}"
x2="${frameX - 25}"
y2="${frameY}"
class="dimension-line"
/>

<line
x1="${frameX - 45}"
y1="${frameY + displayHeight}"
x2="${frameX - 25}"
y2="${frameY + displayHeight}"
class="dimension-line"
/>

<text
x="${frameX - 55}"
y="${frameCenterY}"
transform="rotate(-90 ${frameX - 55} ${frameCenterY})"
class="drawing-dimension-text"
>
${formatNumber(frameHeight)} mm
</text>

</svg>

`;


const backOpeningWidth =
artWidth +
data.clearance;

const backOpeningHeight =
artHeight +
data.clearance;


const backScale =
Math.min(
360 / frameWidth,
360 / frameHeight
);


const backFrameWidth =
frameWidth * backScale;

const backFrameHeight =
frameHeight * backScale;

const backOpeningDisplayWidth =
backOpeningWidth * backScale;

const backOpeningDisplayHeight =
backOpeningHeight * backScale;


const backFrameX =
300 -
(backFrameWidth / 2);

const backFrameY =
270 -
(backFrameHeight / 2);

const backOpeningX =
300 -
(backOpeningDisplayWidth / 2);

const backOpeningY =
270 -
(backOpeningDisplayHeight / 2);


frameDrawingBack.innerHTML = `

<svg
class="frame-svg"
viewBox="0 0 600 600"
role="img"
aria-label="額縁の裏側寸法図"
>

<!-- 裏側の4本の角材 -->

<rect
x="${backFrameX}"
y="${backFrameY}"
width="${partWidth}"
height="${backFrameHeight}"
class="frame-part"
/>

<rect
x="${backFrameX + backFrameWidth - partWidth}"
y="${backFrameY}"
width="${partWidth}"
height="${backFrameHeight}"
class="frame-part"
/>

<rect
x="${backFrameX + partWidth}"
y="${backFrameY}"
width="${backFrameWidth - (partWidth * 2)}"
height="${partWidth}"
class="frame-part"
/>

<rect
x="${backFrameX + partWidth}"
y="${backFrameY + backFrameHeight - partWidth}"
width="${backFrameWidth - (partWidth * 2)}"
height="${partWidth}"
class="frame-part"
/>


<!-- 絵＋クリアランスの範囲 -->

<rect
x="${backOpeningX}"
y="${backOpeningY}"
width="${backOpeningDisplayWidth}"
height="${backOpeningDisplayHeight}"
fill="none"
stroke="#222"
stroke-width="2"
/>


<!-- 内寸 -->

<text
x="300"
y="${frameCenterY - 42}"
class="drawing-dimension-label"
>
内寸
</text>

<text
x="300"
y="${frameCenterY - 10}"
class="drawing-dimension-text"
>
${formatNumber(backOpeningWidth)} mm
</text>

<text
x="300"
y="${frameCenterY + 18}"
class="drawing-dimension-label"
>
×
</text>

<text
x="300"
y="${frameCenterY + 52}"
class="drawing-dimension-text"
>
${formatNumber(backOpeningHeight)} mm
</text>


<!-- かさなり -->

<line
x1="${backOpeningX}"
y1="${backFrameY - 18}"
x2="${backFrameX + partWidth}"
y2="${backFrameY - 18}"
class="dimension-line"
/>

<line
x1="${backOpeningX}"
y1="${backFrameY - 26}"
x2="${backOpeningX}"
y2="${backFrameY - 10}"
class="dimension-line"
/>

<line
x1="${backFrameX + partWidth}"
y1="${backFrameY - 26}"
x2="${backFrameX + partWidth}"
y2="${backFrameY - 10}"
class="dimension-line"
/>

<text
x="${backFrameX + 25}"
y="${backFrameY - 38}"
class="drawing-dimension-label"
>
かさなり ${formatNumber(data.overlap)} mm
</text>


<!-- 勝ち部材 -->

<line
x1="${backFrameX + backFrameWidth + 45}"
y1="${backFrameY}"
x2="${backFrameX + backFrameWidth + 45}"
y2="${backFrameY + backFrameHeight}"
class="dimension-line"
/>

<line
x1="${backFrameX + backFrameWidth + 33}"
y1="${backFrameY}"
x2="${backFrameX + backFrameWidth + 57}"
y2="${backFrameY}"
class="dimension-line"
/>

<line
x1="${backFrameX + backFrameWidth + 33}"
y1="${backFrameY + backFrameHeight}"
x2="${backFrameX + backFrameWidth + 57}"
y2="${backFrameY + backFrameHeight}"
class="dimension-line"
/>

<text
x="${backFrameX + backFrameWidth + 80}"
y="${frameCenterY - 15}"
class="drawing-dimension-label drawing-dimension-side-label"
>
勝ち部材
</text>

<text
x="${backFrameX + backFrameWidth + 80}"
y="${frameCenterY + 18}"
class="drawing-dimension-text drawing-dimension-side-label"
>
${formatNumber(verticalCut)} mm
</text>


<!-- 負け部材 -->

<line
x1="${backFrameX + partWidth}"
y1="${backFrameY + backFrameHeight + 40}"
x2="${backFrameX + backFrameWidth - partWidth}"
y2="${backFrameY + backFrameHeight + 40}"
class="dimension-line"
/>

<line
x1="${backFrameX + partWidth}"
y1="${backFrameY + backFrameHeight + 28}"
x2="${backFrameX + partWidth}"
y2="${backFrameY + backFrameHeight + 52}"
class="dimension-line"
/>

<line
x1="${backFrameX + backFrameWidth - partWidth}"
y1="${backFrameY + backFrameHeight + 28}"
x2="${backFrameX + backFrameWidth - partWidth}"
y2="${backFrameY + backFrameHeight + 52}"
class="dimension-line"
/>

<text
x="300"
y="${backFrameY + backFrameHeight + 75}"
class="drawing-dimension-label"
>
負け部材
</text>

<text
x="300"
y="${backFrameY + backFrameHeight + 108}"
class="drawing-dimension-text"
>
${formatNumber(horizontalCut)} mm
</text>

</svg>

`;

}


// ========================================
// 計算ボタン
// ========================================

calculateButton.addEventListener(
"click",
calculateFrame
);


// ========================================
// Enterでも計算
// ========================================

document
.querySelectorAll(
'input[type="number"]'
)
.forEach(input => {

input.addEventListener(
"keydown",
event => {

if (event.key === "Enter") {
calculateFrame();
}

}
);

});


// ========================================
// ダウンロード
// ========================================

function getSvgCssText() {

let cssText =
"";

Array.from(
document.styleSheets
).forEach(styleSheet => {

try {

Array.from(
styleSheet.cssRules
).forEach(rule => {

cssText +=
rule.cssText;

});

} catch (error) {

}

});

return cssText;

}


async function imageUrlToDataUrl(url) {

const response =
await fetch(url);

const blob =
await response.blob();

return new Promise((resolve, reject) => {

const reader =
new FileReader();

reader.onload =
() => resolve(reader.result);

reader.onerror =
reject;

reader.readAsDataURL(
blob
);

});

}


async function prepareSvgClone(svg) {

const clone =
svg.cloneNode(true);

const cssText =
getSvgCssText();

const styleElement =
document.createElementNS(
"http://www.w3.org/2000/svg",
"style"
);

styleElement.textContent =
cssText;

clone.insertBefore(
styleElement,
clone.firstChild
);


const images =
clone.querySelectorAll(
"image"
);

for (
const image of images
) {

const href =
image.getAttribute(
"href"
) ||
image.getAttributeNS(
"http://www.w3.org/1999/xlink",
"href"
);

if (
href &&
!href.startsWith("data:")
) {

try {

const absoluteUrl =
new URL(
href,
window.location.href
).href;

const dataUrl =
await imageUrlToDataUrl(
absoluteUrl
);

image.setAttribute(
"href",
dataUrl
);

} catch (error) {

}

}

}

return clone;

}


async function svgToPngDataUrl(svg) {

const clone =
await prepareSvgClone(
svg
);

const serializer =
new XMLSerializer();

const svgText =
serializer.serializeToString(
clone
);

const svgBlob =
new Blob(
[svgText],
{
type:
"image/svg+xml;charset=utf-8"
}
);

const svgUrl =
URL.createObjectURL(
svgBlob
);


return new Promise((resolve, reject) => {

const image =
new Image();

image.onload =
() => {

const viewBox =
svg.viewBox.baseVal;

const width =
viewBox.width || 600;

const height =
viewBox.height || 600;

const scale =
3;

const canvas =
document.createElement(
"canvas"
);

canvas.width =
width * scale;

canvas.height =
height * scale;

const context =
canvas.getContext(
"2d"
);

context.fillStyle =
"#ffffff";

context.fillRect(
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

URL.revokeObjectURL(
svgUrl
);

resolve(
canvas.toDataURL(
"image/png"
)
);

};

image.onerror =
() => {

URL.revokeObjectURL(
svgUrl
);

reject(
new Error(
"SVGの変換に失敗しました。"
)
);

};

image.src =
svgUrl;

});

}


function addImageToPdf(
pdf,
imageData,
imageWidth,
imageHeight
) {

const pageWidth =
pdf.internal.pageSize.getWidth();

const pageHeight =
pdf.internal.pageSize.getHeight();

const margin =
15;

const maxWidth =
pageWidth -
(margin * 2);

const maxHeight =
pageHeight -
(margin * 2);

const scale =
Math.min(
maxWidth / imageWidth,
maxHeight / imageHeight
);

const width =
imageWidth * scale;

const height =
imageHeight * scale;

const x =
(pageWidth - width) / 2;

const y =
(pageHeight - height) / 2;

pdf.addImage(
imageData,
"PNG",
x,
y,
width,
height
);

}


downloadButton.addEventListener(
"click",
async () => {

const woodSvg =
woodDrawing.querySelector(
"svg"
);

const frontSvg =
document.querySelector(
"#frameDrawingFront svg"
);

const backSvg =
document.querySelector(
"#frameDrawingBack svg"
);


if (
!woodSvg ||
!frontSvg ||
!backSvg
) {

alert(
"先に「寸法を計算」を押してください。"
);

return;

}


downloadButton.disabled =
true;

downloadButton.textContent =
"PDFを作成中...";


try {

const {
jsPDF
} =
window.jspdf;


const pdf =
new jsPDF({
orientation:
"landscape",
unit:
"mm",
format:
"a4"
});


const drawings = [
{
title:
"角材の寸法",
svg:
woodSvg
},
{
title:
"表から見た図",
svg:
frontSvg
},
{
title:
"裏から見た図",
svg:
backSvg
}
];


const pageWidth =
pdf.internal.pageSize.getWidth();

const pageHeight =
pdf.internal.pageSize.getHeight();


const marginX =
10;

const marginTop =
12;

const marginBottom =
12;

const columnGap =
5;


const usableWidth =
pageWidth -
(marginX * 2) -
(columnGap * 2);

const columnWidth =
usableWidth / 3;


const drawingTop =
18;

const titleY =
172;

const titleHeight =
12;

const drawingBottom =
titleY -
8;

const drawingAreaHeight =
drawingBottom -
drawingTop;


function createJapaneseTextImage(
text
) {

const canvas =
document.createElement(
"canvas"
);

const scale =
3;

canvas.width =
900;

canvas.height =
120;

const context =
canvas.getContext(
"2d"
);

context.scale(
scale,
scale
);

context.fillStyle =
"#ffffff";

context.fillRect(
0,
0,
canvas.width / scale,
canvas.height / scale
);

context.fillStyle =
"#111111";

context.font =
'700 18px "Yu Gothic", "Hiragino Sans", Meiryo, sans-serif';

context.textAlign =
"center";

context.textBaseline =
"middle";

context.fillText(
text,
150,
20
);

return canvas.toDataURL(
"image/png"
);

}


for (
let index = 0;
index < drawings.length;
index += 1
) {

const drawing =
drawings[index];

const svg =
drawing.svg;

const imageData =
await svgToPngDataUrl(
svg
);

const viewBox =
svg.viewBox.baseVal;


const columnX =
marginX +
(
index *
(
columnWidth +
columnGap
)
);


const scale =
Math.min(
(columnWidth - 4) /
viewBox.width,
drawingAreaHeight /
viewBox.height
);


const imageWidth =
viewBox.width *
scale;

const imageHeight =
viewBox.height *
scale;


const imageX =
columnX +
(
columnWidth -
imageWidth
) /
2;


const imageY =
drawingTop +
(
drawingAreaHeight -
imageHeight
) /
2;


pdf.addImage(
imageData,
"PNG",
imageX,
imageY,
imageWidth,
imageHeight
);


const titleImage =
createJapaneseTextImage(
drawing.title
);


const titleWidth =
columnWidth -
8;

const titleX =
columnX +
4;


pdf.addImage(
titleImage,
"PNG",
titleX,
titleY,
titleWidth,
titleHeight
);

}


pdf.save(
"gakubuti-drawing.pdf"
);

} catch (error) {

console.error(
error
);

alert(
"PDFの作成に失敗しました。"
);

} finally {

downloadButton.disabled =
false;

downloadButton.textContent =
"図面をダウンロード";

}

}
);


// ========================================
// 角材断面リアルタイムプレビュー
// ========================================

const woodVerticalInput =
document.getElementById("woodVertical");

const woodHorizontalInput =
document.getElementById("woodHorizontal");

const overlapInput =
document.getElementById("overlap");


function updateWoodProfile() {

// ----------------------------------------
// a・b・c
//
// a = 角材の横寸法
// b = 角材の縦寸法
// c = 絵にかぶさる部分
// ----------------------------------------

const inputA =
parseFloat(woodHorizontalInput.value);

const inputB =
parseFloat(woodVerticalInput.value);

const inputC =
parseFloat(overlapInput.value);

const inputThickness =
parseFloat(
document.getElementById("artThickness").value
);


// ----------------------------------------
// 未入力の寸法には仮の値を使用する
//
// 入力された寸法はその時点ですぐ反映する
// ----------------------------------------

const a =
Number.isNaN(inputA) || inputA <= 0
? 20
: inputA;

const b =
Number.isNaN(inputB) || inputB <= 0
? 30
: inputB;

const c =
Number.isNaN(inputC) || inputC < 0
? 5
: inputC;

const artThickness =
Number.isNaN(inputThickness) ||
inputThickness < 0
? 0
: inputThickness;


// ----------------------------------------
// SVG内で使用する最大サイズ
// ----------------------------------------

const maxDrawingWidth = 260;
const maxDrawingHeight = 230;


// 実寸比率を維持して縮尺を決定

const scale =
Math.min(
maxDrawingWidth / a,
maxDrawingHeight / b
);


const drawingWidth =
a * scale;

const drawingHeight =
b * scale;


// ----------------------------------------
// cの表示
//
// cは横方向のかぶさり寸法として
// 実寸比率で表示
// ----------------------------------------

let overlapWidth =
c * scale;


// cがaを超える場合の表示崩れ防止

overlapWidth =
Math.min(
overlapWidth,
drawingWidth
);


// ----------------------------------------
// 絵が入る部分の高さ
// ----------------------------------------

const thicknessHeight =
Math.min(
artThickness * scale,
drawingHeight
);

const rebateDepth =
drawingHeight -
thicknessHeight;


// ----------------------------------------
// 描画位置
// ----------------------------------------

const x = 120;

const y =
190 - (drawingHeight / 2);


const right =
x + drawingWidth;

const bottom =
y + drawingHeight;


const innerX =
right - overlapWidth;

const innerY =
y + rebateDepth;


// ----------------------------------------
// L字型断面
// ----------------------------------------

const path = `

M ${x} ${y}

L ${right} ${y}

L ${right} ${innerY}

L ${innerX} ${innerY}

L ${innerX} ${bottom}

L ${x} ${bottom}

Z

`;


document
.getElementById("woodProfileShape")
.setAttribute(
"d",
path
);


// ========================================
// a 寸法線
// ========================================

setLine(
"dimensionALine",
x,
y - 35,
right,
y - 35
);


setLine(
"dimensionAStart",
x,
y - 45,
x,
y - 25
);


setLine(
"dimensionAEnd",
right,
y - 45,
right,
y - 25
);


setText(
"dimensionAText",
(x + right) / 2,
y - 55,
`${formatNumber(a)} mm`
);


// ========================================
// b 寸法線
// ========================================

setLine(
"dimensionBLine",
x - 35,
y,
x - 35,
bottom
);


setLine(
"dimensionBStart",
x - 45,
y,
x - 25,
y
);


setLine(
"dimensionBEnd",
x - 45,
bottom,
x - 25,
bottom
);


const bText =
document.getElementById(
"dimensionBText"
);


bText.setAttribute(
"x",
x - 65
);

bText.setAttribute(
"y",
(y + bottom) / 2
);

bText.setAttribute(
"transform",
`
rotate(
-90
${x - 65}
${(y + bottom) / 2}
)
`
);

bText.textContent =
`${formatNumber(b)} mm`


// ========================================
// c 寸法線
// ========================================

const cY =
bottom + 35;


setLine(
"dimensionCLine",
innerX,
cY,
right,
cY
);


setLine(
"dimensionCStart",
innerX,
cY - 10,
innerX,
cY + 10
);


setLine(
"dimensionCEnd",
right,
cY - 10,
right,
cY + 10
);


setText(
"dimensionCText",
(innerX + right) / 2,
cY + 25,
`${formatNumber(c)} mm`
);


// ========================================
// 絵の厚み寸法
// ========================================

const thicknessDimensionX =
right + 35;

setLine(
"dimensionThicknessLine",
thicknessDimensionX,
innerY,
thicknessDimensionX,
bottom
);

setLine(
"dimensionThicknessStart",
thicknessDimensionX - 10,
innerY,
thicknessDimensionX + 10,
innerY
);

setLine(
"dimensionThicknessEnd",
thicknessDimensionX - 10,
bottom,
thicknessDimensionX + 10,
bottom
);

const thicknessText =
document.getElementById(
"dimensionThicknessText"
);

thicknessText.setAttribute(
"x",
thicknessDimensionX + 25
);

thicknessText.setAttribute(
"y",
(innerY + bottom) / 2
);

thicknessText.setAttribute(
"transform",
`rotate(-90 ${thicknessDimensionX + 25} ${(innerY + bottom) / 2})`
);

thicknessText.textContent =
`${formatNumber(artThickness)} mm`;


}


// ========================================
// SVG補助関数
// ========================================

function setLine(
id,
x1,
y1,
x2,
y2
) {

const line =
document.getElementById(id);

line.setAttribute("x1", x1);
line.setAttribute("y1", y1);
line.setAttribute("x2", x2);
line.setAttribute("y2", y2);

}


function setText(
id,
x,
y,
text
) {

const element =
document.getElementById(id);

element.setAttribute("x", x);
element.setAttribute("y", y);

element.removeAttribute(
"transform"
);

element.textContent =
text;

}


// ========================================
// 初期表示
// ========================================

function drawDefaultWoodProfile() {

const shape =
document.getElementById(
"woodProfileShape"
);


shape.setAttribute(
"d",
`
M 140 90
L 380 90
L 380 135
L 330 135
L 330 290
L 140 290
Z
`
);


setLine(
"dimensionALine",
140,
55,
380,
55
);

setLine(
"dimensionAStart",
140,
45,
140,
65
);

setLine(
"dimensionAEnd",
380,
45,
380,
65
);

setText(
"dimensionAText",
260,
30,
""
);


setLine(
"dimensionBLine",
105,
90,
105,
290
);

setLine(
"dimensionBStart",
95,
90,
115,
90
);

setLine(
"dimensionBEnd",
95,
290,
115,
290
);


const bText =
document.getElementById(
"dimensionBText"
);

bText.setAttribute(
"x",
75
);

bText.setAttribute(
"y",
190
);

bText.setAttribute(
"transform",
"rotate(-90 75 190)"
);

bText.textContent =
"";


setLine(
"dimensionCLine",
330,
325,
380,
325
);

setLine(
"dimensionCStart",
330,
315,
330,
335
);

setLine(
"dimensionCEnd",
380,
315,
380,
335
);

setText(
"dimensionCText",
355,
355,
""
);

}


// ========================================
// 入力した瞬間に更新
// ========================================

[
woodVerticalInput,
woodHorizontalInput,
overlapInput,
document.getElementById("artThickness")
].forEach(input => {

input.addEventListener(
"input",
updateWoodProfile
);

});


// 初回描画

updateWoodProfile();


// ========================================
// 絵寸法リアルタイムプレビュー
// ========================================

const artHeightInput =
document.getElementById("artHeight");

const artWidthInput =
document.getElementById("artWidth");

const artThicknessInput =
document.getElementById("artThickness");


function updateArtSizePreview() {

const inputHeight =
parseFloat(artHeightInput.value);

const inputWidth =
parseFloat(artWidthInput.value);

const inputThickness =
parseFloat(artThicknessInput.value);


// ----------------------------------------
// 未入力の場合は仮の寸法を使用
// ----------------------------------------

const artHeight =
Number.isNaN(inputHeight) || inputHeight <= 0
? 420
: inputHeight;

const artWidth =
Number.isNaN(inputWidth) || inputWidth <= 0
? 297
: inputWidth;

const artThickness =
Number.isNaN(inputThickness) || inputThickness < 0
? 20
: inputThickness;


// ----------------------------------------
// 表示領域
// ----------------------------------------

const maxWidth = 260;
const maxHeight = 240;

const scale =
Math.min(
maxWidth / artWidth,
maxHeight / artHeight
);

const displayWidth =
artWidth * scale;

const displayHeight =
artHeight * scale;


// 厚みは実寸比率を基本にする。
// 非常に薄い場合でも形が確認できるよう
// 最低限の表示幅を確保する。

const thicknessOffset =
Math.max(
8,
Math.min(
artThickness * scale,
45
)
);


// ----------------------------------------
// 正面の位置
// ----------------------------------------

const x =
230 - (displayWidth / 2);

const y =
190 - (displayHeight / 2);

const right =
x + displayWidth;

const bottom =
y + displayHeight;


// ----------------------------------------
// 厚み方向
//
// 右上方向へずらして表現
// ----------------------------------------

const depthX =
thicknessOffset;

const depthY =
-thicknessOffset * 0.55;


// ========================================
// 正面
// ========================================

const frontShape =
document.getElementById(
"artFrontShape"
);

frontShape.setAttribute(
"x",
x
);

frontShape.setAttribute(
"y",
y
);

frontShape.setAttribute(
"width",
displayWidth
);

frontShape.setAttribute(
"height",
displayHeight
);

const artFrontImage =
document.getElementById(
"artFrontImage"
);

artFrontImage.setAttribute(
"x",
x
);

artFrontImage.setAttribute(
"y",
y
);

artFrontImage.setAttribute(
"width",
displayWidth
);

artFrontImage.setAttribute(
"height",
displayHeight
);

const artFrontClipRect =
document.getElementById(
"artFrontClipRect"
);

artFrontClipRect.setAttribute(
"x",
x
);

artFrontClipRect.setAttribute(
"y",
y
);

artFrontClipRect.setAttribute(
"width",
displayWidth
);

artFrontClipRect.setAttribute(
"height",
displayHeight
);


// ========================================
// 上面
// ========================================

const topShape =
document.getElementById(
"artTopShape"
);

topShape.setAttribute(
"points",
`
${x},${y}
${right},${y}
${right + depthX},${y + depthY}
${x + depthX},${y + depthY}
`
);


// ========================================
// 右側面
// ========================================

const rightShape =
document.getElementById(
"artRightShape"
);

rightShape.setAttribute(
"points",
`
${right},${y}
${right + depthX},${y + depthY}
${right + depthX},${bottom + depthY}
${right},${bottom}
`
);


// ========================================
// 横寸法
// ========================================

const widthDimensionY =
bottom + 40;

setLine(
"artWidthLine",
x,
widthDimensionY,
right,
widthDimensionY
);

setLine(
"artWidthStart",
x,
widthDimensionY - 10,
x,
widthDimensionY + 10
);

setLine(
"artWidthEnd",
right,
widthDimensionY - 10,
right,
widthDimensionY + 10
);

setText(
"artWidthText",
(x + right) / 2,
widthDimensionY + 25,
Number.isNaN(inputWidth)
? ""
: `${formatNumber(inputWidth)} mm`
);


// ========================================
// 縦寸法
// ========================================

const heightDimensionX =
x - 40;

setLine(
"artHeightLine",
heightDimensionX,
y,
heightDimensionX,
bottom
);

setLine(
"artHeightStart",
heightDimensionX - 10,
y,
heightDimensionX + 10,
y
);

setLine(
"artHeightEnd",
heightDimensionX - 10,
bottom,
heightDimensionX + 10,
bottom
);

const heightText =
document.getElementById(
"artHeightText"
);

heightText.setAttribute(
"x",
heightDimensionX - 25
);

heightText.setAttribute(
"y",
(y + bottom) / 2
);

heightText.setAttribute(
"transform",
`
rotate(
-90
${heightDimensionX - 25}
${(y + bottom) / 2}
)
`
);

heightText.textContent =
Number.isNaN(inputHeight)
? ""
: `${formatNumber(inputHeight)} mm`;


// ========================================
// 厚み寸法
// ========================================

const thicknessStartX =
right + 12;

const thicknessStartY =
y - 12;

const thicknessEndX =
thicknessStartX + depthX;

const thicknessEndY =
thicknessStartY + depthY;

setLine(
"artThicknessLine",
thicknessStartX,
thicknessStartY,
thicknessEndX,
thicknessEndY
);

setLine(
"artThicknessStart",
thicknessStartX - 5,
thicknessStartY - 5,
thicknessStartX + 5,
thicknessStartY + 5
);

setLine(
"artThicknessEnd",
thicknessEndX - 5,
thicknessEndY - 5,
thicknessEndX + 5,
thicknessEndY + 5
);

setText(
"artThicknessText",
(thicknessStartX + thicknessEndX) / 2 + 25,
(thicknessStartY + thicknessEndY) / 2 - 10,
Number.isNaN(inputThickness)
? ""
: `${formatNumber(inputThickness)} mm`
);

}


// ========================================
// 絵の寸法が変更されるたびに
// 描画し直す
// ========================================

function redrawArtSizePreview() {

updateArtSizePreview();

}


// ========================================
// 各入力欄を監視
// ========================================

artHeightInput.addEventListener(
"input",
redrawArtSizePreview
);

artWidthInput.addEventListener(
"input",
redrawArtSizePreview
);

artThicknessInput.addEventListener(
"input",
redrawArtSizePreview
);


// ========================================
// 初回描画
// ========================================

redrawArtSizePreview();


// ========================================
// 勝ち方向リアルタイムプレビュー
// ========================================

function updateFrameDirectionPreview() {

const direction =
"vertical";

const inputWoodHorizontal =
parseFloat(
woodHorizontalInput.value
);

const inputOverlap =
parseFloat(
overlapInput.value
);

const inputArtHeight =
parseFloat(
artHeightInput.value
);

const inputArtWidth =
parseFloat(
artWidthInput.value
);

const inputClearance =
parseFloat(
document.getElementById("clearance").value
);


// ----------------------------------------
// 入力値
// ----------------------------------------

const woodHorizontal =
Number.isNaN(inputWoodHorizontal) ||
inputWoodHorizontal <= 0
? 20
: inputWoodHorizontal;

const overlap =
Number.isNaN(inputOverlap) ||
inputOverlap < 0
? 5
: inputOverlap;

const artHeight =
Number.isNaN(inputArtHeight) ||
inputArtHeight <= 0
? 420
: inputArtHeight;

const artWidth =
Number.isNaN(inputArtWidth) ||
inputArtWidth <= 0
? 297
: inputArtWidth;

const clearance =
Number.isNaN(inputClearance) ||
inputClearance < 0
? 1
: inputClearance;


// ----------------------------------------
// 完成外寸
// ----------------------------------------

const outsideAmount =
woodHorizontal -
overlap;

const realOuterWidth =
artWidth +
(outsideAmount * 2) +
clearance;

const realOuterHeight =
artHeight +
(outsideAmount * 2) +
clearance;


// ----------------------------------------
// SVG内に収めるための縮尺
// ----------------------------------------

const maxDrawingWidth = 340;
const maxDrawingHeight = 300;

const scale =
Math.min(
maxDrawingWidth / realOuterWidth,
maxDrawingHeight / realOuterHeight
);


// ----------------------------------------
// SVG上の寸法
// ----------------------------------------

const outerWidth =
realOuterWidth * scale;

const outerHeight =
realOuterHeight * scale;

const partWidth =
woodHorizontal * scale;


// ----------------------------------------
// SVG中央に配置
// ----------------------------------------

const outerX =
250 -
(outerWidth / 2);

const outerY =
200 -
(outerHeight / 2);


const artDisplayWidth =
artWidth * scale;

const artDisplayHeight =
artHeight * scale;

const artX =
250 -
(artDisplayWidth / 2);

const artY =
200 -
(artDisplayHeight / 2);


const frameArtImage =
document.getElementById(
"frameArtImage"
);

frameArtImage.setAttribute(
"x",
artX
);

frameArtImage.setAttribute(
"y",
artY
);

frameArtImage.setAttribute(
"width",
artDisplayWidth
);

frameArtImage.setAttribute(
"height",
artDisplayHeight
);


const frameArtClipRect =
document.getElementById(
"frameArtClipRect"
);

frameArtClipRect.setAttribute(
"x",
artX
);

frameArtClipRect.setAttribute(
"y",
artY
);

frameArtClipRect.setAttribute(
"width",
artDisplayWidth
);

frameArtClipRect.setAttribute(
"height",
artDisplayHeight
);


// ========================================
// 縦勝ち
// ========================================

if (direction === "vertical") {

setRect(
"directionLeft",
outerX,
outerY,
partWidth,
outerHeight
);

setRect(
"directionRight",
outerX +
outerWidth -
partWidth,
outerY,
partWidth,
outerHeight
);

setRect(
"directionTop",
outerX +
partWidth,
outerY,
outerWidth -
(partWidth * 2),
partWidth
);

setRect(
"directionBottom",
outerX +
partWidth,
outerY +
outerHeight -
partWidth,
outerWidth -
(partWidth * 2),
partWidth
);

}


// ========================================
// 横勝ち
// ========================================

else {

setRect(
"directionTop",
outerX,
outerY,
outerWidth,
partWidth
);

setRect(
"directionBottom",
outerX,
outerY +
outerHeight -
partWidth,
outerWidth,
partWidth
);

setRect(
"directionLeft",
outerX,
outerY +
partWidth,
partWidth,
outerHeight -
(partWidth * 2)
);

setRect(
"directionRight",
outerX +
outerWidth -
partWidth,
outerY +
partWidth,
partWidth,
outerHeight -
(partWidth * 2)
);

}

}


// ========================================
// rect設定
// ========================================

function setRect(
id,
x,
y,
width,
height
) {

const rect =
document.getElementById(id);

rect.setAttribute(
"x",
x
);

rect.setAttribute(
"y",
y
);

rect.setAttribute(
"width",
width
);

rect.setAttribute(
"height",
height
);

}


// ========================================
// ラジオボタン変更時に描画
// ========================================




woodHorizontalInput.addEventListener(
"input",
updateFrameDirectionPreview
);

overlapInput.addEventListener(
"input",
updateFrameDirectionPreview
);

artHeightInput.addEventListener(
"input",
updateFrameDirectionPreview
);

artWidthInput.addEventListener(
"input",
updateFrameDirectionPreview
);

document.getElementById(
"clearance"
).addEventListener(
"input",
updateFrameDirectionPreview
);


// ========================================
// 初回描画
// ========================================

updateFrameDirectionPreview();