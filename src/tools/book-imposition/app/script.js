// ========================================
// PDF.js
// ========================================

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


// ========================================
// HTML要素
// ========================================

const pdfInput =
    document.getElementById("pdfInput");

const status =
    document.getElementById("status");

const previewSection =
    document.getElementById("previewSection");

const pdfInfo =
    document.getElementById("pdfInfo");

const instruction =
    document.getElementById("instruction");

const spreadsContainer =
    document.getElementById("spreads");

    const bindingSection =
    document.getElementById(
        "bindingSection"
    );

const imposeButton =
    document.getElementById(
        "imposeButton"
    );

const bookViewerSection =
    document.getElementById(
        "bookViewerSection"
    );

const viewerInfo =
    document.getElementById(
        "viewerInfo"
    );

const viewerPageCounter =
    document.getElementById(
        "viewerPageCounter"
    );

const viewerPage =
    document.getElementById(
        "viewerPage"
    );

const viewerLeftButton =
    document.getElementById(
        "viewerLeftButton"
    );

const viewerRightButton =
    document.getElementById(
        "viewerRightButton"
    );

    const printSection =
    document.getElementById(
        "printSection"
    );

const downloadPrintPdfButton =
    document.getElementById(
        "downloadPrintPdfButton"
    );

const printStatus =
    document.getElementById(
        "printStatus"
    );

    const printFileName =
    document.getElementById(
        "printFileName"
    );



const downloadPagesZipButton =
    document.getElementById(
        "downloadPagesZipButton"
    );

const pageZipStatus =
    document.getElementById(
        "pageZipStatus"
    );

    const pageZipFileName =
    document.getElementById(
        "pageZipFileName"
    );

// ========================================
// 印刷方法に応じてファイル名を変更
// ========================================

const printRangeInputs =
    document.querySelectorAll(
        'input[name="printRange"]'
    );


printRangeInputs.forEach(
    function (input) {

        input.addEventListener(
            "change",
            function () {

                if (input.value === "all") {

                    printFileName.value =
                        "全部";

                } else if (
                    input.value === "even"
                ) {

                    printFileName.value =
                        "先印刷";

                } else if (
                    input.value === "odd"
                ) {

                    printFileName.value =
                        "後印刷";
                }
            }
        );
    }
);

// ========================================
// 状態
// ========================================

let firstPageSelected = false;

// 個別PDF作成用に元PDFを保持する
let originalPdfBytes = null;

// 綴じ方向
let currentBindingDirection = null;

// 製本方法
let currentBindingMethod =
    "saddle-stitch";

// 製本後プレビュー
let viewerPages = [];

let viewerSpreads = [];

let currentViewerSpreadIndex = 0;

// 中綴じ面付結果
let currentImposition = [];


// ========================================
// PDF選択
// ========================================

pdfInput.addEventListener(
    "change",
    handlePDF
);


// ========================================
// PDFを読み込む
// ========================================

async function handlePDF(event) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    // ------------------------------------
    // 前回の状態をリセット
    // ------------------------------------

    resetTool();


    // ------------------------------------
    // PDFか確認
    // ------------------------------------

    if (file.type !== "application/pdf") {

        showError(
            "PDFファイルを選択してください。"
        );

        pdfInput.value = "";

        return;
    }


    try {

        const arrayBuffer =
            await file.arrayBuffer();


        // ========================================
        // 元PDFを保持
        // ========================================

        originalPdfBytes =
            arrayBuffer.slice(0);


        const pdf =
    await pdfjsLib
        .getDocument({
            data: arrayBuffer,

            cMapUrl:
    new URL(
        "./cmaps/",
        window.location.href
    ).href,

            cMapPacked:
                true,

            standardFontDataUrl:
    new URL(
        "./standard_fonts/",
        window.location.href
    ).href
        })
        .promise;


        const originalPageCount =
            pdf.numPages;


        // ========================================
        // 奇数ページか確認
        // ========================================

        if (originalPageCount % 2 === 0) {

            showError(
                `このPDFは使用できません。` +
                `PDFは ${originalPageCount} ページです。` +
                `奇数ページのPDFをアップロードしてください。`
            );

            originalPdfBytes =
                null;

            pdfInput.value = "";

            return;
        }


        // ========================================
        // 読み込み成功
        // ========================================

        status.textContent =
            "PDFを読み込みました。";

        status.className =
            "status-success";


        pdfInfo.textContent =
            `元PDF：${originalPageCount}ページ`;


        instruction.textContent =
            "最初のページを選択してください。";


        previewSection.classList.remove(
            "hidden"
        );


        // ========================================
        // 元PDFを上から順番に表示
        // ========================================

        for (
            let pageNumber = 1;
            pageNumber <= originalPageCount;
            pageNumber++
        ) {

            const page =
                await pdf.getPage(
                    pageNumber
                );


            await createSpreadPreview(
                page,
                pageNumber
            );
        }


    } catch (error) {

        console.error(error);


        showError(
            "PDFの読み込みに失敗しました。"
        );


        originalPdfBytes =
            null;


        pdfInput.value = "";
    }
}


// ========================================
// 見開きプレビューを作る
// ========================================

async function createSpreadPreview(
    page,
    originalPageNumber
) {

    const scale = 1.5;


    const viewport =
        page.getViewport({
            scale: scale
        });


    // ------------------------------------
    // PDFページ全体をCanvasへ描画
    // ------------------------------------

    const fullCanvas =
        document.createElement("canvas");


    const fullContext =
        fullCanvas.getContext("2d");


    fullCanvas.width =
        Math.ceil(viewport.width);


    fullCanvas.height =
        Math.ceil(viewport.height);


    await page.render({

        canvasContext:
            fullContext,

        viewport:
            viewport

    }).promise;


    // ------------------------------------
    // 左右の幅
    // ------------------------------------

    const halfWidth =
        Math.floor(
            fullCanvas.width / 2
        );


    // ========================================
    // 左半分
    // ========================================

    const leftCanvas =
        document.createElement("canvas");


    leftCanvas.width =
        halfWidth;


    leftCanvas.height =
        fullCanvas.height;


    const leftContext =
        leftCanvas.getContext("2d");


    leftContext.drawImage(

        fullCanvas,

        0,
        0,

        halfWidth,
        fullCanvas.height,

        0,
        0,

        halfWidth,
        fullCanvas.height

    );


    // ========================================
    // 右半分
    // ========================================

    const rightCanvas =
        document.createElement("canvas");


    rightCanvas.width =
        fullCanvas.width - halfWidth;


    rightCanvas.height =
        fullCanvas.height;


    const rightContext =
        rightCanvas.getContext("2d");


    rightContext.drawImage(

        fullCanvas,

        halfWidth,
        0,

        fullCanvas.width - halfWidth,
        fullCanvas.height,

        0,
        0,

        fullCanvas.width - halfWidth,
        fullCanvas.height

    );


    // ========================================
    // 見開き要素
    // ========================================

    const spreadItem =
        document.createElement("div");


    spreadItem.className =
        "spread-item";

        // PDF 2ページ目以降は
// 内部では作成するが画面には表示しない
if (originalPageNumber !== 1) {

    spreadItem.style.display =
        "none";
}


    // ------------------------------------
    // 元PDFのページ番号
    // ------------------------------------

    const originalNumber =
        document.createElement("div");


    originalNumber.className =
        "original-page-number";


    originalNumber.textContent =
        `PDF ${originalPageNumber}ページ目`;


    // ------------------------------------
    // 見開き
    // ------------------------------------

    const spread =
        document.createElement("div");


    spread.className =
        "spread";


    // ========================================
    // 左半ページ
    // ========================================

    const leftHalf =
        createHalfPage(
            leftCanvas,
            originalPageNumber,
            "left"
        );


    // ========================================
    // 右半ページ
    // ========================================

    const rightHalf =
        createHalfPage(
            rightCanvas,
            originalPageNumber,
            "right"
        );


    // ------------------------------------
    // 組み立て
    // ------------------------------------

    spread.appendChild(
        leftHalf
    );


    spread.appendChild(
        rightHalf
    );


    spreadItem.appendChild(
        originalNumber
    );


    spreadItem.appendChild(
        spread
    );


    spreadsContainer.appendChild(
        spreadItem
    );
}


// ========================================
// 半ページを作る
// ========================================

function createHalfPage(
    canvas,
    originalPageNumber,
    side
) {

    const half =
        document.createElement("div");


    half.className =
        "half-page";


    half.dataset.originalPage =
        originalPageNumber;


    half.dataset.side =
        side;


    half.appendChild(
        canvas
    );


    // ------------------------------------
    // 最初のページとして選択
    // ------------------------------------

    half.addEventListener(
        "click",
        function () {

            selectFirstPage(
                half
            );

        }
    );


    return half;
}


// ========================================
// 最初のページを選択
// ========================================

function selectFirstPage(
    selectedHalf
) {

    if (firstPageSelected) {
        return;
    }


    firstPageSelected =
        true;


    // ========================================
    // クリックされた側
    // ========================================

    const firstSide =
        selectedHalf.dataset.side;


    /*
        このツールでの定義

        左側を1ページ目として選択
        → 右綴じ

        右側を1ページ目として選択
        → 左綴じ
    */

    const bindingDirection =
        firstSide === "left"
            ? "右綴じ"
            : "左綴じ";

            currentBindingDirection =
    bindingDirection;


    // ========================================
    // 見開きを取得
    // ========================================

    const spreads =
        Array.from(
            document.querySelectorAll(
                ".spread"
            )
        );


    // ========================================
    // すべての半ページを一度除外
    // ========================================

    const allHalfPages =
        Array.from(
            document.querySelectorAll(
                ".half-page"
            )
        );


    allHalfPages.forEach(
        function (half) {

            half.classList.add(
                "excluded"
            );


            half.classList.remove(
                "first-page"
            );


            delete half.dataset.bookPage;


            const oldNumber =
                half.querySelector(
                    ".book-page-number"
                );


            if (oldNumber) {
                oldNumber.remove();
            }


            const oldButton =
                half.querySelector(
                    ".page-download-button"
                );


            if (oldButton) {
                oldButton.remove();
            }

        }
    );


    // ========================================
    // ページ番号
    // ========================================

    let pageNumber = 1;


    // ========================================
    // 最初の見開き
    // ========================================

    const firstSpread =
        spreads[0];


    const firstPage =
        firstSpread.querySelector(
            `.half-page[data-side="${firstSide}"]`
        );


    setBookPage(
        firstPage,
        pageNumber
    );


    pageNumber++;


    // ========================================
    // 中間の見開き
    // ========================================

    for (
        let i = 1;
        i < spreads.length - 1;
        i++
    ) {

        const spread =
            spreads[i];


        const left =
            spread.querySelector(
                '.half-page[data-side="left"]'
            );


        const right =
            spread.querySelector(
                '.half-page[data-side="right"]'
            );


        // ====================================
        // 右綴じ
        //
        // 3 | 2
        // 5 | 4
        // 7 | 6
        // ====================================

        if (bindingDirection === "右綴じ") {

            setBookPage(
                right,
                pageNumber
            );


            pageNumber++;


            setBookPage(
                left,
                pageNumber
            );


            pageNumber++;

        }


        // ====================================
        // 左綴じ
        //
        // 2 | 3
        // 4 | 5
        // 6 | 7
        // ====================================

        else {

            setBookPage(
                left,
                pageNumber
            );


            pageNumber++;


            setBookPage(
                right,
                pageNumber
            );


            pageNumber++;

        }

    }


    // ========================================
    // 最後の見開き
    // ========================================

    const lastSpread =
        spreads[
            spreads.length - 1
        ];


    let lastPage;


    // ----------------------------------------
    // 右綴じ
    //
    // 白紙 | 8
    // ----------------------------------------

    if (bindingDirection === "右綴じ") {

        lastPage =
            lastSpread.querySelector(
                '.half-page[data-side="right"]'
            );

    }


    // ----------------------------------------
    // 左綴じ
    //
    // 8 | 白紙
    // ----------------------------------------

    else {

        lastPage =
            lastSpread.querySelector(
                '.half-page[data-side="left"]'
            );

    }


    setBookPage(
        lastPage,
        pageNumber
    );


    // ========================================
    // 最初のページを強調
    // ========================================

    firstPage.classList.add(
        "first-page"
    );


    // ========================================
    // 表示更新
    // ========================================

    instruction.innerHTML =
        `最初のページを設定しました。` +
        `<br>` +
        `${bindingDirection} / ` +
        `全 ${pageNumber} ページ`;
        bindingSection.classList.remove(
    "hidden"
);

bindingSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
});
}


// ========================================
// 本のページとして設定
// ========================================

function setBookPage(
    half,
    pageNumber
) {

    half.classList.remove(
        "excluded"
    );


    half.dataset.bookPage =
        pageNumber;


    // ========================================
    // ページ番号
    // ========================================

    const number =
        document.createElement(
            "div"
        );


    number.className =
        "book-page-number";


    number.textContent =
        pageNumber;


    half.appendChild(
        number
    );


    
}


// ========================================
// 個別ページPDFを作成
// ========================================

async function downloadSinglePage(
    half,
    bookPageNumber
) {

    if (!originalPdfBytes) {

        alert(
            "元PDFのデータが見つかりません。"
        );

        return;
    }


    if (typeof PDFLib === "undefined") {

        alert(
            "PDF作成ライブラリを読み込めませんでした。"
        );

        return;
    }


    try {

        // ========================================
        // 元PDFを読み込む
        // ========================================

        const sourcePdf =
            await PDFLib.PDFDocument.load(
                originalPdfBytes
            );


        const originalPageNumber =
            Number(
                half.dataset.originalPage
            );


        const side =
            half.dataset.side;


        // ========================================
        // 対象ページを新しいPDFへコピー
        // ========================================

        const outputPdf =
            await PDFLib.PDFDocument.create();


        const [copiedPage] =
            await outputPdf.copyPages(
                sourcePdf,
                [
                    originalPageNumber - 1
                ]
            );


        // ========================================
        // 元ページの実際のCropBoxを取得
        // ========================================

        const cropBox =
            copiedPage.getCropBox();


        const halfWidth =
            cropBox.width / 2;


        // ========================================
        // 左右どちらを残すか
        // ========================================

        let cropX;


        if (side === "left") {

            cropX =
                cropBox.x;

        } else {

            cropX =
                cropBox.x + halfWidth;

        }


        // ========================================
        // CropBoxを半分にする
        // ========================================

        copiedPage.setCropBox(
            cropX,
            cropBox.y,
            halfWidth,
            cropBox.height
        );


        // ========================================
        // MediaBoxも半ページサイズにする
        // ========================================

        copiedPage.setMediaBox(
            cropX,
            cropBox.y,
            halfWidth,
            cropBox.height
        );


        // ========================================
        // PDFへ追加
        // ========================================

        outputPdf.addPage(
            copiedPage
        );


        // ========================================
        // 保存
        // ========================================

        const pdfBytes =
            await outputPdf.save();


        const blob =
            new Blob(
                [pdfBytes],
                {
                    type: "application/pdf"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `page-${bookPageNumber}.pdf`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            function () {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );


    } catch (error) {

        console.error(error);


        alert(
            "PDFの作成に失敗しました。"
        );

    }
}

// ========================================
// 面付
// ========================================

imposeButton.addEventListener(
    "click",
    createImposition
);


// ========================================
// 製本方法に応じて面付
// ========================================

function createImposition() {

    if (!currentBindingDirection) {

        alert(
            "最初のページを選択してください。"
        );

        return;
    }


    const selectedMethod =
        document.querySelector(
            'input[name="bindingMethod"]:checked'
        );


    if (!selectedMethod) {

        alert(
            "製本方法を選択してください。"
        );

        return;
    }


    currentBindingMethod =
        selectedMethod.value;


    switch (currentBindingMethod) {

        case "saddle-stitch":

            currentImposition =
                createSaddleStitchImposition();

            break;


        default:

            alert(
                "この製本方法にはまだ対応していません。"
            );

            return;
    }


    createBookViewer();

}


// ========================================
// 製本後の見開きを作成
// ========================================

function createViewerSpreads() {

    const spreads = [];

    const totalPages =
        viewerPages.length;


    // ========================================
    // 表紙
    // ========================================

    spreads.push({
        pages: [1]
    });


    // ========================================
    // 本文
    //
    // 2-3
    // 4-5
    // 6-7
    // ...
    // ========================================

    for (
        let pageNumber = 2;
        pageNumber < totalPages;
        pageNumber += 2
    ) {

        spreads.push({
            pages: [
                pageNumber,
                pageNumber + 1
            ]
        });
    }


    // ========================================
    // 裏表紙
    // ========================================

    spreads.push({
        pages: [totalPages]
    });


    return spreads;
}


// ========================================
// 中綴じ用 面付ルール
// ========================================

function createSaddleStitchImposition() {

    const bookPages =
        getBookPages();


    const totalPages =
        bookPages.length;


    if (totalPages % 4 !== 0) {

        alert(
            "中綴じ製本ではページ数が4の倍数である必要があります。"
        );

        return [];
    }


    const imposedSurfaces = [];


    let low =
        1;


    let high =
        totalPages;


    while (low < high) {

        // ========================================
        // 右綴じ
        // ========================================

        if (
            currentBindingDirection ===
            "右綴じ"
        ) {

            // 表
            imposedSurfaces.push({
                left: low,
                right: high
            });


            low++;
            high--;


            // 裏
            imposedSurfaces.push({
                left: high,
                right: low
            });


            low++;
            high--;

        }


        // ========================================
        // 左綴じ
        // ========================================

        else {

            // 表
            imposedSurfaces.push({
                left: high,
                right: low
            });


            low++;
            high--;


            // 裏
            imposedSurfaces.push({
                left: low,
                right: high
            });


            low++;
            high--;

        }
    }


    return imposedSurfaces;
}


// ========================================
// 本のページをページ番号順で取得
// ========================================

function getBookPages() {

    const pages =
        Array.from(
            document.querySelectorAll(
                '.half-page[data-book-page]'
            )
        );


    pages.sort(
        function (a, b) {

            return (
                Number(
                    a.dataset.bookPage
                ) -
                Number(
                    b.dataset.bookPage
                )
            );

        }
    );


    return pages;
}


// ========================================
// 製本後ビューワーを作る
// ========================================

function createBookViewer() {

    viewerPages =
        getBookPages();


    if (
        currentImposition.length === 0 ||
        viewerPages.length === 0
    ) {

        return;
    }


    // ========================================
    // 製本後の見開きを作成
    // ========================================

    viewerSpreads =
        createViewerSpreads();


    currentViewerSpreadIndex =
        0;


    viewerInfo.textContent =
        `${getBindingMethodName()} / ` +
        `${currentBindingDirection}`;


    bookViewerSection.classList.remove(
        "hidden"
    );


    printSection.classList.remove(
        "hidden"
    );


    renderViewerPage();


    bookViewerSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ========================================
// 製本方法の表示名
// ========================================

function getBindingMethodName() {

    switch (currentBindingMethod) {

        case "saddle-stitch":
            return "中綴じ";

        default:
            return "不明";
    }
}


// ========================================
// ビューワー表示
// ========================================

function renderViewerPage() {

    if (viewerSpreads.length === 0) {
        return;
    }


    viewerPage.innerHTML =
        "";


    const spread =
        viewerSpreads[
            currentViewerSpreadIndex
        ];


    const spreadContainer =
        document.createElement(
            "div"
        );


    spreadContainer.className =
        "viewer-spread";


    // ========================================
    // 表紙・裏表紙
    // ========================================

    if (spread.pages.length === 1) {

        const pageNumber =
            spread.pages[0];


        const pageElement =
            createViewerPageCanvas(
                pageNumber
            );


        spreadContainer.classList.add(
            "single-page"
        );


        // 右綴じ
        if (
            currentBindingDirection ===
            "右綴じ"
        ) {

            if (pageNumber === 1) {

                spreadContainer.classList.add(
                    "single-right"
                );

            } else {

                spreadContainer.classList.add(
                    "single-left"
                );
            }

        }

        // 左綴じ
        else {

            if (pageNumber === 1) {

                spreadContainer.classList.add(
                    "single-left"
                );

            } else {

                spreadContainer.classList.add(
                    "single-right"
                );
            }
        }


        spreadContainer.appendChild(
            pageElement
        );


        viewerPageCounter.textContent =
            `${pageNumber} / ${viewerPages.length}`;
    }


    // ========================================
    // 見開き
    // ========================================

    else {

        const firstPageNumber =
            spread.pages[0];


        const secondPageNumber =
            spread.pages[1];


        let leftPageNumber;
        let rightPageNumber;


        // 右綴じ
        //
        // 3 | 2
        // 5 | 4
        // ========================================

        if (
            currentBindingDirection ===
            "右綴じ"
        ) {

            leftPageNumber =
                secondPageNumber;

            rightPageNumber =
                firstPageNumber;

        }


        // 左綴じ
        //
        // 2 | 3
        // 4 | 5
        // ========================================

        else {

            leftPageNumber =
                firstPageNumber;

            rightPageNumber =
                secondPageNumber;
        }


        spreadContainer.appendChild(
            createViewerPageCanvas(
                leftPageNumber
            )
        );


        spreadContainer.appendChild(
            createViewerPageCanvas(
                rightPageNumber
            )
        );


        viewerPageCounter.textContent =
            `${firstPageNumber}–${secondPageNumber} / ${viewerPages.length}`;
    }


    viewerPage.appendChild(
        spreadContainer
    );


    updateViewerButtons();
}


// ========================================
// ビューワーボタン
// ========================================

function updateViewerButtons() {

    const isFirst =
    currentViewerSpreadIndex === 0;


const isLast =
    currentViewerSpreadIndex ===
    viewerSpreads.length - 1;


    // ========================================
    // 右綴じ
    //
    // 左：次へ
    // 右：前へ
    // ========================================

    if (
        currentBindingDirection ===
        "右綴じ"
    ) {

        viewerLeftButton.textContent =
            "← 次へ";


        viewerRightButton.textContent =
            "前へ →";


        viewerLeftButton.disabled =
            isLast;


        viewerRightButton.disabled =
            isFirst;

    }


    // ========================================
    // 左綴じ
    //
    // 左：前へ
    // 右：次へ
    // ========================================

    else {

        viewerLeftButton.textContent =
            "← 前へ";


        viewerRightButton.textContent =
            "次へ →";


        viewerLeftButton.disabled =
            isFirst;


        viewerRightButton.disabled =
            isLast;
    }
}


// ========================================
// 左ボタン
// ========================================

viewerLeftButton.addEventListener(
    "click",
    function () {

        if (
            currentBindingDirection ===
            "右綴じ"
        ) {

            goToNextViewerPage();

        } else {

            goToPreviousViewerPage();
        }
    }
);


// ========================================
// 右ボタン
// ========================================

viewerRightButton.addEventListener(
    "click",
    function () {

        if (
            currentBindingDirection ===
            "右綴じ"
        ) {

            goToPreviousViewerPage();

        } else {

            goToNextViewerPage();
        }
    }
);


// ========================================
// 次ページ
// ========================================

function goToNextViewerPage() {

    if (
        currentViewerSpreadIndex >=
        viewerSpreads.length - 1
    ) {

        return;
    }


    currentViewerSpreadIndex++;


    renderViewerPage();
}

function createViewerPageCanvas(
    pageNumber
) {

    const sourceHalf =
        viewerPages[
            pageNumber - 1
        ];


    const sourceCanvas =
        sourceHalf.querySelector(
            "canvas"
        );


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "viewer-book-page";


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        sourceCanvas.width;


    canvas.height =
        sourceCanvas.height;


    const context =
        canvas.getContext(
            "2d"
        );


    context.drawImage(
        sourceCanvas,
        0,
        0
    );


    wrapper.appendChild(
        canvas
    );


    return wrapper;
}


// ========================================
// 前ページ
// ========================================

function goToPreviousViewerPage() {

    if (
        currentViewerSpreadIndex <= 0
    ) {

        return;
    }


    currentViewerSpreadIndex--;


    renderViewerPage();
}


// ========================================
// キーボード操作
// ========================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            bookViewerSection.classList.contains(
                "hidden"
            )
        ) {

            return;
        }


        // ========================================
        // 右綴じ
        // ========================================

        if (
            currentBindingDirection ===
            "右綴じ"
        ) {

            if (
                event.key ===
                "ArrowLeft"
            ) {

                goToNextViewerPage();

            }


            if (
                event.key ===
                "ArrowRight"
            ) {

                goToPreviousViewerPage();
            }

        }


        // ========================================
        // 左綴じ
        // ========================================

        else {

            if (
                event.key ===
                "ArrowRight"
            ) {

                goToNextViewerPage();

            }


            if (
                event.key ===
                "ArrowLeft"
            ) {

                goToPreviousViewerPage();
            }
        }
    }
);


// ========================================
// スワイプ操作
// ========================================

let viewerTouchStartX =
    null;


viewerPage.addEventListener(
    "touchstart",
    function (event) {

        viewerTouchStartX =
            event.changedTouches[0].clientX;

    },
    {
        passive: true
    }
);


viewerPage.addEventListener(
    "touchend",
    function (event) {

        if (
            viewerTouchStartX === null
        ) {

            return;
        }


        const touchEndX =
            event.changedTouches[0].clientX;


        const difference =
            touchEndX -
            viewerTouchStartX;


        viewerTouchStartX =
            null;


        // 小さな移動は無視
        if (
            Math.abs(difference) < 50
        ) {

            return;
        }


        // ========================================
        // 右綴じ
        //
        // 左へスワイプ → 次へ
        // ========================================

        if (
            currentBindingDirection ===
            "右綴じ"
        ) {

            if (difference < 0) {

                goToNextViewerPage();

            } else {

                goToPreviousViewerPage();
            }

        }


        // ========================================
        // 左綴じ
        //
        // 右へスワイプ → 次へ
        // ========================================

        else {

            if (difference > 0) {

                goToNextViewerPage();

            } else {

                goToPreviousViewerPage();
            }
        }
    },
    {
        passive: true
    }
);

// ========================================
// 印刷用PDFダウンロード
// ========================================

downloadPrintPdfButton.addEventListener(
    "click",
    downloadPrintPdf
);


// ========================================
// 印刷用PDFを作成
// ========================================

async function downloadPrintPdf() {

    if (!originalPdfBytes) {

        alert(
            "元PDFのデータが見つかりません。"
        );

        return;
    }


    if (
        !currentImposition ||
        currentImposition.length === 0
    ) {

        alert(
            "先に面付を行ってください。"
        );

        return;
    }


    if (typeof PDFLib === "undefined") {

        alert(
            "PDF作成ライブラリを読み込めませんでした。"
        );

        return;
    }


    // ========================================
    // 出力範囲
    // ========================================

    const selectedRange =
        document.querySelector(
            'input[name="printRange"]:checked'
        );


    if (!selectedRange) {

        alert(
            "ダウンロードする印刷面を選択してください。"
        );

        return;
    }


    const printRange =
        selectedRange.value;


    try {

        downloadPrintPdfButton.disabled =
            true;


        printStatus.textContent =
            "印刷用PDFを作成しています…";


        // ========================================
        // 元PDF
        // ========================================

        const sourcePdf =
            await PDFLib.PDFDocument.load(
                originalPdfBytes
            );


        // ========================================
        // 出力PDF
        // ========================================

        const outputPdf =
            await PDFLib.PDFDocument.create();


        // ========================================
        // 本ページ → 元PDF位置
        // ========================================

        const pageMap =
            createBookPageSourceMap();


        // ========================================
        // 面を順番に処理
        // ========================================

        for (
            let i = 0;
            i < currentImposition.length;
            i++
        ) {

            const surfaceNumber =
                i + 1;


            // ------------------------------------
            // 奇数面のみ
            // ------------------------------------

            if (
                printRange === "odd" &&
                surfaceNumber % 2 === 0
            ) {

                continue;
            }


            // ------------------------------------
            // 偶数面のみ
            // ------------------------------------

            if (
                printRange === "even" &&
                surfaceNumber % 2 !== 0
            ) {

                continue;
            }


            const surface =
                currentImposition[i];


            await addImposedSurfaceToPdf(
                sourcePdf,
                outputPdf,
                pageMap,
                surface
            );
        }


        // ========================================
        // PDF保存
        // ========================================

        const pdfBytes =
            await outputPdf.save();


        const blob =
            new Blob(
                [pdfBytes],
                {
                    type: "application/pdf"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            createPrintPdfFileName(
                printRange
            );


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            function () {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );


        printStatus.textContent =
            "印刷用PDFを作成しました。";


    } catch (error) {

        console.error(error);


        printStatus.textContent =
            "";


        alert(
            "印刷用PDFの作成に失敗しました。"
        );


    } finally {

        downloadPrintPdfButton.disabled =
            false;
    }
}


// ========================================
// 本ページと元PDF位置の対応表
// ========================================

function createBookPageSourceMap() {

    const pageMap =
        new Map();


    const bookPages =
        document.querySelectorAll(
            '.half-page[data-book-page]'
        );


    bookPages.forEach(
        function (half) {

            const bookPageNumber =
                Number(
                    half.dataset.bookPage
                );


            const originalPageNumber =
                Number(
                    half.dataset.originalPage
                );


            const side =
                half.dataset.side;


            pageMap.set(
                bookPageNumber,
                {
                    originalPageNumber:
                        originalPageNumber,

                    side:
                        side
                }
            );
        }
    );


    return pageMap;
}


// ========================================
// 1つの印刷面をPDFへ追加
// ========================================

async function addImposedSurfaceToPdf(
    sourcePdf,
    outputPdf,
    pageMap,
    surface
) {

    const leftSource =
        pageMap.get(
            surface.left
        );


    const rightSource =
        pageMap.get(
            surface.right
        );


    if (
        !leftSource ||
        !rightSource
    ) {

        throw new Error(
            "面付するページが見つかりません。"
        );
    }


    // ========================================
    // 左右ページを埋め込み用に取得
    // ========================================

    const leftData =
        await embedBookPage(
            sourcePdf,
            outputPdf,
            leftSource
        );


    const rightData =
        await embedBookPage(
            sourcePdf,
            outputPdf,
            rightSource
        );


    // ========================================
    // ページサイズが一致しているか確認
    // ========================================

    const tolerance =
        0.01;


    if (
        Math.abs(
            leftData.width -
            rightData.width
        ) > tolerance ||
        Math.abs(
            leftData.height -
            rightData.height
        ) > tolerance
    ) {

        throw new Error(
            "左右ページのサイズが一致していません。"
        );
    }


    const halfWidth =
        leftData.width;


    const pageHeight =
        leftData.height;


    // ========================================
    // 元の見開きサイズで印刷面を作成
    // ========================================

    const outputPage =
        outputPdf.addPage(
            [
                halfWidth * 2,
                pageHeight
            ]
        );


    // ========================================
    // 左ページ
    // ========================================

    outputPage.drawPage(
        leftData.embeddedPage,
        {
            x: 0,
            y: 0,

            width:
                halfWidth,

            height:
                pageHeight
        }
    );


    // ========================================
    // 右ページ
    // ========================================

    outputPage.drawPage(
        rightData.embeddedPage,
        {
            x: halfWidth,
            y: 0,

            width:
                halfWidth,

            height:
                pageHeight
        }
    );
}


// ========================================
// 本の1ページを元PDFから直接取得
// ========================================

async function embedBookPage(
    sourcePdf,
    outputPdf,
    source
) {

    const sourcePage =
        sourcePdf.getPage(
            source.originalPageNumber - 1
        );


    const cropBox =
        sourcePage.getCropBox();


    const halfWidth =
        cropBox.width / 2;


    let left;
    let right;


    if (
        source.side ===
        "left"
    ) {

        left =
            cropBox.x;


        right =
            cropBox.x +
            halfWidth;

    } else {

        left =
            cropBox.x +
            halfWidth;


        right =
            cropBox.x +
            cropBox.width;
    }


    /*
        元PDFページを画像化せず、
        必要な半分だけを直接埋め込む。
    */

    const embeddedPage =
        await outputPdf.embedPage(
            sourcePage,
            {
                left: left,
                bottom: cropBox.y,
                right: right,
                top:
                    cropBox.y +
                    cropBox.height
            }
        );


    return {
        embeddedPage:
            embeddedPage,

        width:
            halfWidth,

        height:
            cropBox.height
    };
}


// ========================================
// 印刷PDFファイル名
// ========================================

function createPrintPdfFileName() {

    let fileName =
        printFileName.value.trim();


    // 未入力の場合
    if (!fileName) {

        fileName =
            "全部";
    }


    // .pdfまで入力された場合は取り除く
    fileName =
        fileName.replace(
            /\.pdf$/i,
            ""
        );


    // ファイル名に使用できない文字を置換
    fileName =
        fileName.replace(
            /[\\/:*?"<>|]/g,
            "_"
        );


    return (
        fileName +
        ".pdf"
    );
}

// ========================================
// ページごとのPDFをZIP保存
// ========================================

downloadPagesZipButton.addEventListener(
    "click",
    downloadPagesZip
);


// ========================================
// ZIPを作成
// ========================================

async function downloadPagesZip() {

    if (!originalPdfBytes) {

        alert(
            "元PDFのデータが見つかりません。"
        );

        return;
    }


    if (typeof JSZip === "undefined") {

        alert(
            "ZIP作成ライブラリを読み込めませんでした。"
        );

        return;
    }


    // ========================================
    // ファイル形式
    // ========================================

    const selectedFormat =
        document.querySelector(
            'input[name="pageFormat"]:checked'
        );


    if (!selectedFormat) {

        alert(
            "ファイル形式を選択してください。"
        );

        return;
    }


    const pageFormat =
        selectedFormat.value;


    try {

        downloadPagesZipButton.disabled =
            true;


        pageZipStatus.textContent =
            "ページごとのデータを作成しています…";


        // ========================================
        // 本ページと元PDF位置の対応
        // ========================================

        const pageMap =
            createBookPageSourceMap();


        const totalPages =
            pageMap.size;


        const zip =
            new JSZip();


        // ========================================
        // PDFの場合
        // ========================================

        if (pageFormat === "pdf") {

            if (typeof PDFLib === "undefined") {

                throw new Error(
                    "PDF作成ライブラリを読み込めませんでした。"
                );
            }


            const sourcePdf =
                await PDFLib.PDFDocument.load(
                    originalPdfBytes
                );


            for (
                let pageNumber = 1;
                pageNumber <= totalPages;
                pageNumber++
            ) {

                const source =
                    pageMap.get(
                        pageNumber
                    );


                if (!source) {

                    throw new Error(
                        `ページ${pageNumber}が見つかりません。`
                    );
                }


                const pdfBytes =
                    await createSingleBookPagePdf(
                        sourcePdf,
                        source
                    );


                const numberText =
                    String(
                        pageNumber
                    ).padStart(
                        2,
                        "0"
                    );


                zip.file(
                    `page${numberText}.pdf`,
                    pdfBytes
                );


                pageZipStatus.textContent =
                    `${pageNumber} / ${totalPages} ページを作成中…`;
            }
        }


        // ========================================
        // PNGの場合
        // ========================================

        if (pageFormat === "png") {

            const pdfData =
                originalPdfBytes.slice(0);


            const pdf =
                await pdfjsLib
                    .getDocument({
                        data: pdfData
                    })
                    .promise;


            for (
                let pageNumber = 1;
                pageNumber <= totalPages;
                pageNumber++
            ) {

                const source =
                    pageMap.get(
                        pageNumber
                    );


                if (!source) {

                    throw new Error(
                        `ページ${pageNumber}が見つかりません。`
                    );
                }


                const pngBlob =
                    await createSingleBookPagePng(
                        pdf,
                        source
                    );


                const numberText =
                    String(
                        pageNumber
                    ).padStart(
                        2,
                        "0"
                    );


                zip.file(
                    `page${numberText}.png`,
                    pngBlob
                );


                pageZipStatus.textContent =
                    `${pageNumber} / ${totalPages} ページを作成中…`;
            }
        }


        // ========================================
        // ZIP生成
        // ========================================

        pageZipStatus.textContent =
            "ZIPファイルを作成しています…";


        const zipBlob =
            await zip.generateAsync({
                type: "blob"
            });


        const url =
            URL.createObjectURL(
                zipBlob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        let zipFileName =
    pageZipFileName.value.trim();


if (!zipFileName) {

    zipFileName =
        "pages";
}


// .zipまで入力されていた場合は取り除く
zipFileName =
    zipFileName.replace(
        /\.zip$/i,
        ""
    );


// ファイル名に使用できない文字を置換
zipFileName =
    zipFileName.replace(
        /[\\/:*?"<>|]/g,
        "_"
    );


link.download =
    zipFileName +
    ".zip";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            function () {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );


        pageZipStatus.textContent =
            `${totalPages}ページのデータをZIPにまとめました。`;


    } catch (error) {

        console.error(error);


        pageZipStatus.textContent =
            "";


        alert(
            "ページごとのデータの作成に失敗しました。"
        );


    } finally {

        downloadPagesZipButton.disabled =
            false;
    }
}


// ========================================
// 本の1ページだけをPDF化
// ========================================

async function createSingleBookPagePdf(
    sourcePdf,
    source
) {

    const outputPdf =
        await PDFLib.PDFDocument.create();


    // ========================================
    // 元ページをコピー
    // ========================================

    const [copiedPage] =
        await outputPdf.copyPages(
            sourcePdf,
            [
                source.originalPageNumber - 1
            ]
        );


    // ========================================
    // 元ページのCropBox
    // ========================================

    const cropBox =
        copiedPage.getCropBox();


    const halfWidth =
        cropBox.width / 2;


    // ========================================
    // 左右どちらを残すか
    // ========================================

    let cropX;


    if (
        source.side ===
        "left"
    ) {

        cropX =
            cropBox.x;

    } else {

        cropX =
            cropBox.x +
            halfWidth;
    }


    // ========================================
    // 半ページに切り出す
    // ========================================

    copiedPage.setCropBox(
        cropX,
        cropBox.y,
        halfWidth,
        cropBox.height
    );


    copiedPage.setMediaBox(
        cropX,
        cropBox.y,
        halfWidth,
        cropBox.height
    );


    // ========================================
    // PDFへ追加
    // ========================================

    outputPdf.addPage(
        copiedPage
    );


    // ========================================
    // PDFデータを返す
    // ========================================

    return await outputPdf.save();
}

// ========================================
// 本の1ページをPNG化
// 300dpi相当
// ========================================

async function createSingleBookPagePng(
    pdf,
    source
) {

    const page =
        await pdf.getPage(
            source.originalPageNumber
        );


    /*
        PDFの標準単位は72dpi基準。

        300 / 72 にすることで
        300dpi相当のピクセル数で描画する。
    */

    const scale =
        300 / 72;


    const viewport =
        page.getViewport({
            scale: scale
        });


    // ========================================
    // 見開き全体を高解像度レンダリング
    // ========================================

    const fullCanvas =
        document.createElement(
            "canvas"
        );


    fullCanvas.width =
        Math.ceil(
            viewport.width
        );


    fullCanvas.height =
        Math.ceil(
            viewport.height
        );


    const fullContext =
        fullCanvas.getContext(
            "2d"
        );


    await page.render({
        canvasContext:
            fullContext,

        viewport:
            viewport
    }).promise;


    // ========================================
    // 半ページサイズ
    // ========================================

    const halfWidth =
        Math.floor(
            fullCanvas.width / 2
        );


    const outputCanvas =
        document.createElement(
            "canvas"
        );


    outputCanvas.width =
        halfWidth;


    outputCanvas.height =
        fullCanvas.height;


    const outputContext =
        outputCanvas.getContext(
            "2d"
        );


    // ========================================
    // 左右どちらを切り出すか
    // ========================================

    let sourceX;


    if (
        source.side ===
        "left"
    ) {

        sourceX =
            0;

    } else {

        sourceX =
            fullCanvas.width -
            halfWidth;
    }


    outputContext.drawImage(
        fullCanvas,

        sourceX,
        0,
        halfWidth,
        fullCanvas.height,

        0,
        0,
        halfWidth,
        fullCanvas.height
    );


    // ========================================
    // PNG Blob
    // ========================================

    return await new Promise(
        function (
            resolve,
            reject
        ) {

            outputCanvas.toBlob(
                function (blob) {

                    if (!blob) {

                        reject(
                            new Error(
                                "PNGの作成に失敗しました。"
                            )
                        );

                        return;
                    }


                    resolve(
                        blob
                    );

                },
                "image/png"
            );
        }
    );
}

// ========================================
// リセット
// ========================================

function resetTool() {

    firstPageSelected =
        false;


    originalPdfBytes =
        null;


    currentBindingDirection =
        null;


    currentBindingMethod =
        "saddle-stitch";


    viewerPages =
        [];


    viewerSpreads =
    [];


currentViewerSpreadIndex =
    0;


    currentImposition =
        [];


    status.textContent =
        "";


    status.className =
        "";


    pdfInfo.textContent =
        "";


    instruction.textContent =
        "最初のページを選択してください。";


    spreadsContainer.innerHTML =
        "";


    previewSection.classList.add(
        "hidden"
    );

    bindingSection.classList.add(
    "hidden"
);


bookViewerSection.classList.add(
    "hidden"
);

printSection.classList.add(
    "hidden"
);


pageZipStatus.textContent =
    "";


printStatus.textContent =
    "";


viewerPage.innerHTML =
    "";


viewerPageCounter.textContent =
    "";


viewerInfo.textContent =
    "";
}


// ========================================
// エラー
// ========================================

function showError(
    message
) {

    status.textContent =
        message;


    status.className =
        "status-error";
}