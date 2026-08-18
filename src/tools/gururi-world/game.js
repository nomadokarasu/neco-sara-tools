import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

const container =
  document.getElementById(
    "panorama-container"
  );

const cameraUI =
  document.getElementById(
    "camera-ui"
  );

const zoomSlider =
  document.getElementById(
    "zoom-slider"
  );

const photoCount =
  document.getElementById(
    "photo-count"
  );

const shutterEffect =
  document.getElementById(
    "shutter-effect"
  );

const shutterButton =
  document.getElementById(
    "shutter-button"
  );

const albumButton =
  document.getElementById(
    "album-button"
  );

const topBackButton =
  document.getElementById(
    "top-back-button"
  );

const albumBackButton =
  document.getElementById(
    "album-back-button"
  );

const albumPanel =
  document.getElementById(
    "album-panel"
  );

const albumGrid =
  document.getElementById(
    "album-grid"
  );

const albumCount =
  document.getElementById(
    "album-count"
  );

const photoPopup =
  document.getElementById(
    "photo-popup"
  );

const popupImage =
  document.getElementById(
    "popup-image"
  );

const popupBackButton =
  document.getElementById(
    "popup-back-button"
  );

const popupDeleteButton =
  document.getElementById(
    "popup-delete-button"
  );

const startScreen =
  document.getElementById(
    "start-screen"
  );

const photoLimitDialog =
  document.getElementById(
    "photo-limit-dialog"
  );

const limitAlbumButton =
  document.getElementById(
    "limit-album-button"
  );

const finishButton =
  document.getElementById(
    "finish-button"
  );

const endScreen =
  document.getElementById(
    "end-screen"
  );

const endDialogueBox =
  document.getElementById(
    "end-dialogue-box"
  );

const endDialogueText =
  document.getElementById(
    "end-dialogue-text"
  );

const endChoiceButtons =
  document.getElementById(
    "end-choice-buttons"
  );

const endYesButton =
  document.getElementById(
    "end-yes-button"
  );

const endNoButton =
  document.getElementById(
    "end-no-button"
  );

const slideshowPanel =
  document.getElementById(
    "slideshow-panel"
  );

const slideshowImage =
  document.getElementById(
    "slideshow-image"
  );

const slideshowCount =
  document.getElementById(
    "slideshow-count"
  );

const slideshowSkipButton =
  document.getElementById(
    "slideshow-skip-button"
  );

const tapToContinue =
  document.getElementById(
    "tap-to-continue"
  );


// ========================================
// Three.js
// ========================================

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
    antialias: true,
    preserveDrawingBuffer: true
  });


function resizeViewer() {

  const rect =
    container.getBoundingClientRect();

  const width =
    Math.max(
      1,
      Math.round(
        rect.width
      )
    );

  const height =
    Math.max(
      1,
      Math.round(
        rect.height
      )
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


renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);

container.appendChild(
  renderer.domElement
);

resizeViewer();


// ========================================
// 撮影用Canvas
// ========================================

const captureCanvas =
  document.createElement(
    "canvas"
  );

const captureRenderer =
  new THREE.WebGLRenderer({
    canvas: captureCanvas,
    antialias: true,
    preserveDrawingBuffer: true
  });

captureRenderer.setPixelRatio(
  1
);

captureRenderer.outputColorSpace =
  renderer.outputColorSpace;


// ========================================
// 360°パノラマ
// ========================================

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

const textureLoader =
  new THREE.TextureLoader();

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


// ========================================
// 状態
// ========================================

let currentMode =
  "camera";

let longitude =
  0;

let latitude =
  0;

let targetLongitude =
  0;

let targetLatitude =
  0;

let cameraFov =
  85;

const photos =
  [];

const maxPhotos =
  12;

let selectedPhotoIndex =
  0;

let isPopupOpen =
  false;

let isGameStarted =
  false;

let isEndScreenOpen =
  false;

  // ========================================
// GA4イベント送信
// ========================================

function trackGururiEvent(
  eventName,
  parameters = {}
) {

  if (
    typeof window.gtag !==
    "function"
  ) {
    return;
  }

  window.gtag(
    "event",
    eventName,
    parameters
  );
}

// ========================================
// 視点操作
// ========================================

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


// スマホとPCで感度を変更
const dragSensitivity =
  window.matchMedia(
    "(max-width: 600px)"
  ).matches
    ? 0.3
    : 0.1;


// ========================================
// ピンチズーム
// ========================================

const activePointers =
  new Map();

let pinchStartDistance =
  null;

let pinchStartZoom =
  null;


// ========================================
// 世界を読み込む
// ========================================

function loadWorld(
  worldId
) {

  const panoramaPath =
    `./assets/worlds/${worldId}/panorama.png`;

  textureLoader.load(
    panoramaPath,
    (texture) => {

      panorama.material.map =
        texture;

      panorama.material.needsUpdate =
        true;
    }
  );
}


const worldCards =
  document.querySelectorAll(
    ".world-card"
  );


worldCards.forEach(
  (card) => {

    card.addEventListener(
      "click",
      () => {

        const worldId =
          card.dataset.world;

          trackGururiEvent(
  "gururi_world_select",
  {
    world_id: worldId
  }
);

        loadWorld(
          worldId
        );


        // 視点を初期位置へ
        longitude =
          0;

        latitude =
          0;

        targetLongitude =
          0;

        targetLatitude =
          0;


        // ズームを中央へ
        zoomSlider.value =
          50;

        applyZoomFromSlider();


        // タッチ状態をリセット
        activePointers.clear();

        pinchStartDistance =
          null;

        pinchStartZoom =
          null;

        isDragging =
          false;


        // 開始画面を閉じる
        startScreen.classList.add(
          "hidden"
        );


        isGameStarted =
          true;


        setMode(
          "camera"
        );


        topBackButton.classList.remove(
          "hidden"
        );
      }
    );
  }
);


// ========================================
// 2点間の距離
// ========================================

function getPointerDistance(
  pointA,
  pointB
) {

  const dx =
    pointA.x -
    pointB.x;

  const dy =
    pointA.y -
    pointB.y;

  return Math.hypot(
    dx,
    dy
  );
}


// ========================================
// pointerdown
// ========================================

renderer.domElement.addEventListener(
  "pointerdown",
  (event) => {

    if (
      !isGameStarted ||
      isEndScreenOpen ||
      currentMode !== "camera"
    ) {
      return;
    }


    // 指・マウス位置を記録
    activePointers.set(
      event.pointerId,
      {
        x: event.clientX,
        y: event.clientY
      }
    );


    // pointerupを確実に取得
    renderer.domElement
      .setPointerCapture(
        event.pointerId
      );


    // ------------------------------------
    // 1本指
    // 視点移動開始
    // ------------------------------------

    if (
      activePointers.size ===
      1
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


    // ------------------------------------
    // 2本指
    // ピンチ開始
    // ------------------------------------

    if (
      activePointers.size ===
      2
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

      pinchStartZoom =
        Number(
          zoomSlider.value
        );
    }
  }
);


// ========================================
// pointermove
// ========================================

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


    // 現在位置へ更新
    activePointers.set(
      event.pointerId,
      {
        x: event.clientX,
        y: event.clientY
      }
    );


    // ------------------------------------
    // 2本指
    // ピンチズーム
    // ------------------------------------

    if (
      activePointers.size ===
      2
    ) {

      const points =
        Array.from(
          activePointers.values()
        );

      const currentDistance =
        getPointerDistance(
          points[0],
          points[1]
        );


      if (
        pinchStartDistance ===
          null ||
        pinchStartZoom ===
          null
      ) {
        return;
      }


      const distanceChange =
        currentDistance -
        pinchStartDistance;


      const nextZoom =
        THREE.MathUtils.clamp(
          pinchStartZoom +
            distanceChange *
              0.25,
          0,
          100
        );


      // ズームバーも動かす
      zoomSlider.value =
        nextZoom;


      // 実際のカメラへ反映
      applyZoomFromSlider();


      return;
    }


    // ------------------------------------
    // 1本指
    // 視点移動
    // ------------------------------------

    if (
      !isDragging
    ) {
      return;
    }


    const deltaX =
      event.clientX -
      startX;

    const deltaY =
      event.clientY -
      startY;


    // 指の移動距離に比例して
    // 視点の移動量も変化する
    targetLongitude =
      startLongitude -
      deltaX *
        dragSensitivity;

    targetLatitude =
      startLatitude +
      deltaY *
        dragSensitivity;


    // 上下方向の制限
    targetLatitude =
      Math.max(
        -85,
        Math.min(
          85,
          targetLatitude
        )
      );
  }
);


// ========================================
// pointerup
// ========================================

renderer.domElement.addEventListener(
  "pointerup",
  (event) => {

    activePointers.delete(
      event.pointerId
    );


    // ------------------------------------
    // 全ての指が離れた
    // ------------------------------------

    if (
      activePointers.size ===
      0
    ) {

      isDragging =
        false;

      pinchStartDistance =
        null;

      pinchStartZoom =
        null;

      return;
    }


    // ------------------------------------
    // ピンチ後に1本残った
    // ------------------------------------

    if (
      activePointers.size ===
      1
    ) {

      const remainingPoint =
        Array.from(
          activePointers.values()
        )[0];


      isDragging =
        true;


      startX =
        remainingPoint.x;

      startY =
        remainingPoint.y;


      startLongitude =
        targetLongitude;

      startLatitude =
        targetLatitude;


      pinchStartDistance =
        null;

      pinchStartZoom =
        null;
    }
  }
);


// ========================================
// pointercancel
// ========================================

renderer.domElement.addEventListener(
  "pointercancel",
  (event) => {

    activePointers.delete(
      event.pointerId
    );


    // 全ての指がなくなった
    if (
      activePointers.size ===
      0
    ) {

      isDragging =
        false;

      pinchStartDistance =
        null;

      pinchStartZoom =
        null;

      return;
    }


    // 1本だけ残った場合
    if (
      activePointers.size ===
      1
    ) {

      const remainingPoint =
        Array.from(
          activePointers.values()
        )[0];


      isDragging =
        true;


      startX =
        remainingPoint.x;

      startY =
        remainingPoint.y;


      startLongitude =
        targetLongitude;

      startLatitude =
        targetLatitude;


      pinchStartDistance =
        null;

      pinchStartZoom =
        null;
    }
  }
);

// ========================================
// キーボード操作
// ========================================

const keys = {};

window.addEventListener(
  "keydown",
  (event) => {

    // ========================================
    // 拡大写真を左右の矢印キーで移動
    // ========================================

    if (
      isPopupOpen
    ) {

      // 左キー
      // → 前の写真
      if (
        event.key ===
        "ArrowLeft"
      ) {

        event.preventDefault();

        movePopupPhoto(
          -1
        );

        return;
      }


      // 右キー
      // → 次の写真
      if (
        event.key ===
        "ArrowRight"
      ) {

        event.preventDefault();

        movePopupPhoto(
          1
        );

        return;
      }
    }


    keys[event.key] =
      true;
  }
);

window.addEventListener(
  "keyup",
  (event) => {

    keys[event.key] =
      false;
  }
);


// ========================================
// モード切り替え
// ========================================

function setMode(
  mode
) {

  if (
    isPopupOpen
  ) {
    closePopup();
  }


  currentMode =
    mode;


  // タッチ操作状態をリセット
  isDragging =
    false;

  activePointers.clear();

  pinchStartDistance =
    null;

  pinchStartZoom =
    null;


  // --------------------------------------
  // 撮影モード
  // --------------------------------------

  if (
    mode === "camera"
  ) {

    cameraUI.classList.remove(
      "hidden"
    );

    albumButton.classList.remove(
      "hidden"
    );

    albumPanel.classList.add(
      "hidden"
    );


    if (
      isGameStarted &&
      !isEndScreenOpen
    ) {

      topBackButton.classList.remove(
        "hidden"
      );
    }

    return;
  }


  // --------------------------------------
  // アルバムモード
  // --------------------------------------

  if (
    mode === "album"
  ) {

    cameraUI.classList.add(
      "hidden"
    );

    albumButton.classList.add(
      "hidden"
    );

    topBackButton.classList.add(
      "hidden"
    );

    albumPanel.classList.remove(
      "hidden"
    );


    renderAlbum();

    return;
  }
}


// ========================================
// ズーム
// ========================================

function applyZoomFromSlider() {

  const value =
    Number(
      zoomSlider.value
    );


  /*
    0   = 最もズームアウト
    50  = 初期位置
    100 = 最もズームイン
  */

  const minFov =
    35;

  const maxFov =
    120;


  cameraFov =
    THREE.MathUtils.lerp(
      maxFov,
      minFov,
      value / 100
    );


  camera.fov =
    cameraFov;

  camera.updateProjectionMatrix();
}


zoomSlider.addEventListener(
  "input",
  () => {

    applyZoomFromSlider();
  }
);


// 初期ズーム
zoomSlider.value =
  50;

applyZoomFromSlider();


// ========================================
// 写真枚数表示
// ========================================

function updatePhotoCount() {

  const text =
    `${photos.length} / ${maxPhotos}`;


  photoCount.textContent =
    text;

  albumCount.textContent =
    text;
}


// ========================================
// シャッター演出
// ========================================

function playShutterEffect() {

  shutterEffect.classList.remove(
    "active"
  );


  void shutterEffect.offsetWidth;


  shutterEffect.classList.add(
    "active"
  );


  window.setTimeout(
    () => {

      shutterEffect.classList.remove(
        "active"
      );
    },
    180
  );
}


// ========================================
// 写真を撮影
// ========================================

function takePhoto() {

  if (
    !isGameStarted ||
    isEndScreenOpen ||
    currentMode !== "camera"
  ) {
    return;
  }


  // すでに24枚ある場合
  if (
    photos.length >=
    maxPhotos
  ) {

    openPhotoLimitDialog();

    return;
  }


  playShutterEffect();


  /*
    現在ディスプレイに表示されている
    正方形の画角をそのまま撮影する
  */

  const rect =
    container.getBoundingClientRect();


  const captureSize =
    Math.max(
      1,
      Math.round(
        Math.min(
          rect.width,
          rect.height
        )
      )
    );


  captureRenderer.setSize(
    captureSize,
    captureSize,
    false
  );


  const captureCamera =
    camera.clone();


  captureCamera.aspect =
    1;

  captureCamera.updateProjectionMatrix();


  captureRenderer.render(
    scene,
    captureCamera
  );


  const dataUrl =
    captureCanvas.toDataURL(
      "image/png"
    );


  photos.push({
    dataUrl
  });

// 最初の1枚
if (
  photos.length ===
  1
) {

  trackGururiEvent(
    "gururi_photo_first"
  );
}

  updatePhotoCount();

  renderAlbum();


  // 24枚目を撮影した場合
if (
  photos.length >=
  maxPhotos
) {

  trackGururiEvent(
    "gururi_photo_complete"
  );


  window.setTimeout(
      () => {

        openPhotoLimitDialog();
      },
      350
    );
  }
}


shutterButton.addEventListener(
  "click",
  () => {

    takePhoto();
  }
);


// ========================================
// 24枚制限ダイアログ
// ========================================

function openPhotoLimitDialog() {

  photoLimitDialog.classList.remove(
    "hidden"
  );
}


function closePhotoLimitDialog() {

  photoLimitDialog.classList.add(
    "hidden"
  );
}


// 「アルバムを開く」
limitAlbumButton.addEventListener(
  "click",
  () => {

    closePhotoLimitDialog();

    setMode(
      "album"
    );
  }
);


// 「撮影を終了する」
finishButton.addEventListener(
  "click",
  () => {

    closePhotoLimitDialog();

    startEndSequence();
  }
);


// ========================================
// アルバムを開く
// ========================================

albumButton.addEventListener(
  "click",
  () => {

    setMode(
      "album"
    );
  }
);


// ========================================
// 撮影に戻る
// ========================================

albumBackButton.addEventListener(
  "click",
  () => {

    setMode(
      "camera"
    );
  }
);


// ========================================
// アルバムを描画
// ========================================

function renderAlbum() {

  albumGrid.innerHTML =
    "";


  photos.forEach(
    (
      photo,
      index
    ) => {

      const item =
  document.createElement(
    "button"
  );

item.type =
  "button";

item.className =
  "album-slot";


      const image =
        document.createElement(
          "img"
        );


      image.src =
  photo.dataUrl;

image.className =
  "album-photo";

image.alt =
  `写真 ${index + 1}`;


      item.appendChild(
        image
      );


      item.addEventListener(
        "click",
        () => {

          openPopup(
            index
          );
        }
      );


      albumGrid.appendChild(
        item
      );
    }
  );


  updatePhotoCount();
}


// ========================================
// 拡大写真を開く
// ========================================

function openPopup(
  index
) {

  if (
    photos.length ===
    0
  ) {
    return;
  }


  selectedPhotoIndex =
    index;


  popupImage.src =
    photos[
      selectedPhotoIndex
    ].dataUrl;


  photoPopup.classList.remove(
    "hidden"
  );


  isPopupOpen =
    true;
}


// ========================================
// 拡大写真を閉じる
// ========================================

function closePopup() {

  photoPopup.classList.add(
    "hidden"
  );


  popupImage.src =
    "";


  isPopupOpen =
    false;
}


// ========================================
// 前後の写真へ移動
// ========================================

function movePopupPhoto(
  direction
) {

  if (
    photos.length ===
    0
  ) {
    return;
  }


  selectedPhotoIndex +=
    direction;


  // 最後から最初へ
  if (
    selectedPhotoIndex >=
    photos.length
  ) {

    selectedPhotoIndex =
      0;
  }


  // 最初から最後へ
  if (
    selectedPhotoIndex <
    0
  ) {

    selectedPhotoIndex =
      photos.length - 1;
  }


  popupImage.src =
    photos[
      selectedPhotoIndex
    ].dataUrl;
}


// ========================================
// 「アルバムに戻る」
// ========================================

popupBackButton.addEventListener(
  "click",
  (event) => {

    event.stopPropagation();


    closePopup();
  }
);


// ========================================
// 拡大写真を左右スワイプ
// ========================================

let popupSwipeStartX =
  0;

let popupSwipeStartY =
  0;


photoPopup.addEventListener(
  "pointerdown",
  (event) => {

    if (
      !isPopupOpen
    ) {
      return;
    }


    // ボタン操作はスワイプ判定しない
    if (
      event.target.closest(
        "button"
      )
    ) {
      return;
    }


    popupSwipeStartX =
      event.clientX;

    popupSwipeStartY =
      event.clientY;


    // 指が領域外へ出ても
    // pointerupを受け取れるようにする
    photoPopup.setPointerCapture(
      event.pointerId
    );
  }
);


photoPopup.addEventListener(
  "pointerup",
  (event) => {

    if (
      !isPopupOpen
    ) {
      return;
    }


    if (
      event.target.closest(
        "button"
      )
    ) {
      return;
    }


    const deltaX =
      event.clientX -
      popupSwipeStartX;

    const deltaY =
      event.clientY -
      popupSwipeStartY;


    // 縦方向の動きの方が大きい場合は無視
    if (
      Math.abs(
        deltaY
      ) >
      Math.abs(
        deltaX
      )
    ) {
      return;
    }


    // 小さすぎる移動は無視
    if (
      Math.abs(
        deltaX
      ) <
      30
    ) {
      return;
    }


    // 左へスワイプ
    // → 次の写真
    if (
      deltaX <
      0
    ) {

      movePopupPhoto(
        1
      );

      return;
    }


    // 右へスワイプ
    // → 前の写真
    movePopupPhoto(
      -1
    );
  }
);


// ========================================
// 写真を削除
// ========================================

popupDeleteButton.addEventListener(
  "click",
  (event) => {

    event.stopPropagation();


    if (
      photos.length ===
      0
    ) {
      return;
    }


    const deletedIndex =
      selectedPhotoIndex;


    photos.splice(
      deletedIndex,
      1
    );


    updatePhotoCount();

    renderAlbum();


    // 写真が全部なくなった場合
    if (
      photos.length ===
      0
    ) {

      closePopup();

      return;
    }


    /*
      削除した写真の位置に
      次の写真が詰められるので、
      同じindexを表示する。

      最後の写真を削除した場合だけ
      ひとつ前へ移動する。
    */

    if (
      deletedIndex >=
      photos.length
    ) {

      selectedPhotoIndex =
        photos.length - 1;

    } else {

      selectedPhotoIndex =
        deletedIndex;
    }


    popupImage.src =
      photos[
        selectedPhotoIndex
      ].dataUrl;


    // 24枚未満になったので
    // 制限ダイアログが開いていたら閉じる
    if (
      photos.length <
      maxPhotos
    ) {

      closePhotoLimitDialog();
    }
  }
);

// ========================================
// トップに戻る
// ========================================

topBackButton.addEventListener(
  "click",
  () => {

    // 写真を削除
    photos.length =
      0;

    selectedPhotoIndex =
      0;

    updatePhotoCount();

    renderAlbum();


    // 視点を初期位置へ
    longitude =
      0;

    latitude =
      0;

    targetLongitude =
      0;

    targetLatitude =
      0;


    // ズームを初期位置へ
    zoomSlider.value =
      50;

    applyZoomFromSlider();


    // タッチ状態をリセット
    isDragging =
      false;

    activePointers.clear();

    pinchStartDistance =
      null;

    pinchStartZoom =
      null;


    // 撮影を終了
    isGameStarted =
      false;


    // UIを閉じる
    cameraUI.classList.add(
      "hidden"
    );

    albumButton.classList.add(
      "hidden"
    );

    albumPanel.classList.add(
      "hidden"
    );

    topBackButton.classList.add(
      "hidden"
    );

    closePopup();

    closePhotoLimitDialog();


    // トップ画面を表示
    startScreen.classList.remove(
      "hidden"
    );
  }
);


// ========================================
// 終了画面
// ========================================

const endDialogueState = {
  phase: "intro",
  isTyping: false,
  waitingForChoice: false
};


let typeTimer =
  null;


// ZIP事前生成用
let preparedDownloadUrl =
  null;

let preparedDownloadName =
  null;

let preparingDownloadPromise =
  null;

// ========================================
// セリフを1文字ずつ表示
// ========================================

function typeEndDialogue(
  text,
  hideArrow = false
) {

  if (
    typeTimer
  ) {

    clearInterval(
      typeTimer
    );

    typeTimer =
      null;
  }


  endDialogueState.isTyping =
    true;


  endDialogueText.textContent =
    "";


  tapToContinue.classList.add(
    "hidden"
  );


  let index =
    0;


  typeTimer =
    window.setInterval(
      () => {

        endDialogueText.textContent +=
          text[index];


        index +=
          1;


        if (
          index >=
          text.length
        ) {

          clearInterval(
            typeTimer
          );


          typeTimer =
            null;


          endDialogueState.isTyping =
            false;


          if (
            !hideArrow
          ) {

            tapToContinue.classList.remove(
              "hidden"
            );
          }
        }
      },
      45
    );
}


// ========================================
// 選択肢を表示
// ========================================

function showEndChoices() {

  endChoiceButtons.classList.remove(
    "hidden"
  );


  tapToContinue.classList.add(
    "hidden"
  );


  endDialogueState.waitingForChoice =
    true;
}


// ========================================
// 選択肢を隠す
// ========================================

function hideEndChoices() {

  endChoiceButtons.classList.add(
    "hidden"
  );


  endDialogueState.waitingForChoice =
    false;
}


// ========================================
// セリフ終了後、少し待って選択肢を表示
// ========================================

function waitForDialogueThenShowChoices() {

  const checkTimer =
    window.setInterval(
      () => {

        if (
          !endDialogueState.isTyping
        ) {

          clearInterval(
            checkTimer
          );


          window.setTimeout(
            () => {

              if (
                isEndScreenOpen
              ) {

                showEndChoices();
              }
            },
            650
          );
        }
      },
      50
    );
}


// ========================================
// 終了シーケンス開始
// ========================================

function startEndSequence() {

  isEndScreenOpen =
    true;


  isGameStarted =
    false;


  currentMode =
    "camera";


  isDragging =
    false;


  activePointers.clear();


  pinchStartDistance =
    null;


  pinchStartZoom =
    null;


  cameraUI.classList.add(
    "hidden"
  );


  albumButton.classList.add(
    "hidden"
  );


  albumPanel.classList.add(
    "hidden"
  );


  topBackButton.classList.add(
    "hidden"
  );


  closePopup();


  closePhotoLimitDialog();


  endScreen.classList.remove(
    "hidden"
  );


  slideshowPanel.classList.add(
    "hidden"
  );


  hideEndChoices();


  endDialogueBox.classList.remove(
    "hidden"
  );


  endDialogueState.phase =
    "intro";


  typeEndDialogue(
    "お待たせしました、24枚の写真が現像できましたよ"
  );
}


// ========================================
// 終了画面の会話を進める
// ========================================

function advanceEndDialogue() {

  // 文字送り中は進めない
  if (
    endDialogueState.isTyping
  ) {
    return;
  }


  // 選択肢表示中も進めない
  if (
    endDialogueState.waitingForChoice
  ) {
    return;
  }


  // --------------------------------------
  // 最初のセリフ
  // ↓
  // スライドショーを見ますか？
  // --------------------------------------

  if (
    endDialogueState.phase ===
    "intro"
  ) {

    endDialogueState.phase =
      "slideshow-question";


    typeEndDialogue(
      "スライドショーを見ますか？",
      true
    );


    waitForDialogueThenShowChoices();


    return;
  }

// --------------------------------------
// ZIPの準備が後から完了した場合
// --------------------------------------

if (
  endDialogueState.phase ===
  "download-ready"
) {

  const downloadStarted =
    startPreparedDownload();


  if (
    !downloadStarted
  ) {

    endDialogueState.phase =
      "download-error";


    typeEndDialogue(
      "ダウンロードできませんでした"
    );


    return;
  }


  endDialogueState.phase =
    "download-complete";


  typeEndDialogue(
    "ダウンロードを開始しました"
  );


  return;
}

  // --------------------------------------
  // ダウンロード後
  // ↓
  // それでは、また
  // --------------------------------------

  if (
    endDialogueState.phase ===
      "download-complete" ||
    endDialogueState.phase ===
      "download-error"
  ) {

    endDialogueState.phase =
      "goodbye";


    typeEndDialogue(
      "それでは、また"
    );


    return;
  }


  // --------------------------------------
  // 最後
  // ↓
  // トップへ戻る
  // --------------------------------------

  if (
    endDialogueState.phase ===
    "goodbye"
  ) {

    tapToContinue.classList.add(
      "hidden"
    );


    finishGame();


    return;
  }
}


// ========================================
// 終了画面全体をタップ
// ========================================

endScreen.addEventListener(
  "click",
  (event) => {

    // ボタンを押した場合は除外
    if (
      event.target.closest(
        "button"
      )
    ) {
      return;
    }


    // スライドショー中は除外
    if (
      !slideshowPanel.classList.contains(
        "hidden"
      )
    ) {
      return;
    }


    advanceEndDialogue();
  }
);


// ========================================
// 「はい」
// ========================================

endYesButton.addEventListener(
  "click",
  async () => {

    // ------------------------------------
    // スライドショーを見る
    // ------------------------------------

    if (
      endDialogueState.phase ===
      "slideshow-question"
    ) {

      hideEndChoices();


      await startSlideshow();


      endDialogueState.phase =
  "download-question";


typeEndDialogue(
  "写真をダウンロードしますか？",
  true
);


// 質問を表示している間に
// ZIPを事前生成する
preparingDownloadPromise =
  preparePhotoDownload();


waitForDialogueThenShowChoices();


      return;
    }


    // ------------------------------------
    // 写真をダウンロードする
    // ------------------------------------

    if (
  endDialogueState.phase ===
  "download-question"
) {

  hideEndChoices();


  tapToContinue.classList.add(
    "hidden"
  );


  /*
    通常は選択肢が表示されるまでに
    ZIP生成が完了している。
  */

  if (
    preparedDownloadUrl
  ) {

    const downloadStarted =
      startPreparedDownload();


    if (
      !downloadStarted
    ) {

      endDialogueState.phase =
        "download-error";


      typeEndDialogue(
        "ダウンロードできませんでした"
      );


      return;
    }


    endDialogueState.phase =
      "download-complete";


    typeEndDialogue(
      "ダウンロードを開始しました"
    );


    return;
  }


  /*
    まだZIP生成中だった場合
  */

  endDialogueText.textContent =
    "ダウンロードの準備中...";


  if (
    preparingDownloadPromise
  ) {

    await preparingDownloadPromise;
  }


  /*
    ZIPの準備が完了した場合でも、
    この時点ではユーザー操作から
    時間が空いているため、
    自動ダウンロードは行わない。
  */

  if (
    preparedDownloadUrl
  ) {

    endDialogueState.phase =
      "download-ready";


    typeEndDialogue(
      "準備ができました。もう一度タップしてください"
    );


    return;
  }


  endDialogueState.phase =
    "download-error";


  typeEndDialogue(
    "ダウンロードできませんでした"
  );


  return;
}
  }
);


// ========================================
// 「いいえ」
// ========================================

endNoButton.addEventListener(
  "click",
  () => {

    hideEndChoices();


    // ------------------------------------
    // スライドショーを見ない
    // ------------------------------------

    if (
      endDialogueState.phase ===
      "slideshow-question"
    ) {

      endDialogueState.phase =
  "download-question";


typeEndDialogue(
  "写真をダウンロードしますか？",
  true
);


// 質問を表示している間に
// ZIPを事前生成する
preparingDownloadPromise =
  preparePhotoDownload();


waitForDialogueThenShowChoices();


      return;
    }


    // ------------------------------------
    // ダウンロードしない
    // ------------------------------------

    if (
      endDialogueState.phase ===
      "download-question"
    ) {

      endDialogueState.phase =
        "goodbye";


      typeEndDialogue(
        "それでは、また"
      );


      return;
    }
  }
);


// ========================================
// スライドショー
// ========================================

let slideshowResolve =
  null;


let slideshowTimer =
  null;


let slideshowIndex =
  0;


// ========================================
// スライドショー開始
// ========================================

function startSlideshow() {

  return new Promise(
    (resolve) => {

      if (
        photos.length ===
        0
      ) {

        resolve();


        return;
      }

      trackGururiEvent(
  "gururi_slideshow",
  {
    photo_count:
      photos.length
  }
);


      slideshowResolve =
        resolve;


      slideshowIndex =
        0;


      endDialogueBox.classList.add(
        "hidden"
      );


      slideshowPanel.classList.remove(
        "hidden"
      );


      showSlideshowPhoto();


      slideshowTimer =
        window.setInterval(
          () => {

            slideshowIndex +=
              1;


            if (
              slideshowIndex >=
              photos.length
            ) {

              finishSlideshow();


              return;
            }


            showSlideshowPhoto();
          },
          2200
        );
    }
  );
}


// ========================================
// スライドショーの写真を表示
// ========================================

function showSlideshowPhoto() {

  if (
    photos.length ===
    0
  ) {
    return;
  }


  const photo =
    photos[
      slideshowIndex
    ];


  slideshowImage.src =
    photo.dataUrl;


  slideshowCount.textContent =
    `${slideshowIndex + 1} / ${photos.length}`;
}


// ========================================
// スライドショー終了
// ========================================

function finishSlideshow() {

  if (
    slideshowTimer
  ) {

    clearInterval(
      slideshowTimer
    );


    slideshowTimer =
      null;
  }


  slideshowPanel.classList.add(
    "hidden"
  );


  endDialogueBox.classList.remove(
    "hidden"
  );


  const resolve =
    slideshowResolve;


  slideshowResolve =
    null;


  if (
    resolve
  ) {

    resolve();
  }
}


// ========================================
// スライドショーをスキップ
// ========================================

slideshowSkipButton.addEventListener(
  "click",
  (event) => {

    event.stopPropagation();


    finishSlideshow();
  }
);

// ========================================
// 写真をZIPでダウンロード
// ========================================

// ========================================
// ZIPを事前生成
// ========================================

async function preparePhotoDownload() {

  // 前回のURLが残っていたら破棄
  if (
    preparedDownloadUrl
  ) {

    URL.revokeObjectURL(
      preparedDownloadUrl
    );

    preparedDownloadUrl =
      null;
  }


  preparedDownloadName =
    null;


  if (
    photos.length ===
    0
  ) {

    console.error(
      "ダウンロードする写真がありません。"
    );

    return false;
  }


  if (
    typeof window.JSZip ===
    "undefined"
  ) {

    console.error(
      "JSZipが読み込まれていません。"
    );

    return false;
  }


  try {

    const zip =
      new window.JSZip();


    photos.forEach(
      (
        photo,
        index
      ) => {

        const base64 =
          photo.dataUrl.split(
            ","
          )[1];


        const number =
          String(
            index + 1
          ).padStart(
            2,
            "0"
          );


        zip.file(
          `photo-${number}.png`,
          base64,
          {
            base64: true
          }
        );
      }
    );


    // ZIPをここで先に生成
    const zipBlob =
      await zip.generateAsync({
        type: "blob"
      });


    preparedDownloadUrl =
      URL.createObjectURL(
        zipBlob
      );


    const now =
      new Date();


    const year =
      now.getFullYear();


    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );


    const hours =
      String(
        now.getHours()
      ).padStart(
        2,
        "0"
      );


    const minutes =
      String(
        now.getMinutes()
      ).padStart(
        2,
        "0"
      );


    const seconds =
      String(
        now.getSeconds()
      ).padStart(
        2,
        "0"
      );


    preparedDownloadName =
      `gururi-${year}${month}${day}-${hours}${minutes}${seconds}.zip`;


    return true;

  } catch (
    error
  ) {

    console.error(
      "ZIPの作成に失敗しました。",
      error
    );


    preparedDownloadUrl =
      null;

    preparedDownloadName =
      null;


    return false;
  }
}


// ========================================
// 生成済みZIPをダウンロード
// ========================================

function startPreparedDownload() {

  if (
    !preparedDownloadUrl ||
    !preparedDownloadName
  ) {

    return false;
  }


  const link =
    document.createElement(
      "a"
    );


  link.href =
    preparedDownloadUrl;


  link.download =
    preparedDownloadName;


  link.style.display =
    "none";


  document.body.appendChild(
    link
  );


  // 「はい」を押したイベント内で
  // すぐにダウンロードを開始する
  link.click();

  trackGururiEvent(
  "gururi_download",
  {
    photo_count:
      photos.length
  }
);


  link.remove();


  return true;
}


// ========================================
// ゲーム終了
// ========================================

function finishGame() {

  if (
    typeTimer
  ) {

    clearInterval(
      typeTimer
    );


    typeTimer =
      null;
  }


  if (
    slideshowTimer
  ) {

    clearInterval(
      slideshowTimer
    );


    slideshowTimer =
      null;
  }


  hideEndChoices();


  tapToContinue.classList.add(
    "hidden"
  );


  endScreen.classList.add(
    "hidden"
  );


  slideshowPanel.classList.add(
    "hidden"
  );


  endDialogueBox.classList.remove(
    "hidden"
  );


  isEndScreenOpen =
    false;


  returnToStartScreen();
}


// ========================================
// 開始画面へ戻る
// ========================================

function returnToStartScreen() {

  isGameStarted =
    false;


  currentMode =
    "camera";


  // 写真を削除
  photos.length =
    0;


  selectedPhotoIndex =
    0;


  updatePhotoCount();


  renderAlbum();


  // 視点リセット
  longitude =
    0;


  latitude =
    0;


  targetLongitude =
    0;


  targetLatitude =
    0;


  // ズームリセット
  zoomSlider.value =
    50;


  applyZoomFromSlider();


  // タッチ状態リセット
  isDragging =
    false;


  activePointers.clear();


  pinchStartDistance =
    null;


  pinchStartZoom =
    null;


  // UIを閉じる
  cameraUI.classList.add(
    "hidden"
  );


  albumButton.classList.add(
    "hidden"
  );


  albumPanel.classList.add(
    "hidden"
  );


  topBackButton.classList.add(
    "hidden"
  );


  closePopup();


  closePhotoLimitDialog();


  // 終了画面を閉じる
  endScreen.classList.add(
    "hidden"
  );


  // 開始画面
  startScreen.classList.remove(
    "hidden"
  );


  // 会話状態を初期化
  endDialogueState.phase =
    "intro";


  endDialogueState.isTyping =
    false;


  endDialogueState.waitingForChoice =
    false;


  endDialogueText.textContent =
    "";

    
if (
  preparedDownloadUrl
) {

  URL.revokeObjectURL(
    preparedDownloadUrl
  );
}


preparedDownloadUrl =
  null;

preparedDownloadName =
  null;

preparingDownloadPromise =
  null;
}

// ========================================
// カメラの描画
// ========================================

function updateCameraLook() {

  latitude =
    Math.max(
      -85,
      Math.min(
        85,
        latitude
      )
    );


  const phi =
    THREE.MathUtils.degToRad(
      90 - latitude
    );


  const theta =
    THREE.MathUtils.degToRad(
      longitude
    );


  const target =
    new THREE.Vector3();


  target.x =
    500 *
    Math.sin(
      phi
    ) *
    Math.cos(
      theta
    );


  target.y =
    500 *
    Math.cos(
      phi
    );


  target.z =
    500 *
    Math.sin(
      phi
    ) *
    Math.sin(
      theta
    );


  camera.lookAt(
    target
  );
}


// ========================================
// アニメーション
// ========================================

function animate() {

  requestAnimationFrame(
    animate
  );


  // --------------------------------------
  // スワイプ先へ滑らかに追従
  // --------------------------------------

  longitude +=
    (
      targetLongitude -
      longitude
    ) *
    0.18;


  latitude +=
    (
      targetLatitude -
      latitude
    ) *
    0.18;


  // --------------------------------------
  // キーボード操作
  // --------------------------------------

  const lookSpeed =
    1.2;


  if (
    isGameStarted &&
    !isEndScreenOpen &&
    currentMode ===
      "camera"
  ) {

    if (
      keys["ArrowLeft"]
    ) {

      targetLongitude -=
        lookSpeed;
    }


    if (
      keys["ArrowRight"]
    ) {

      targetLongitude +=
        lookSpeed;
    }


    if (
      keys["ArrowUp"]
    ) {

      targetLatitude +=
        lookSpeed;
    }


    if (
      keys["ArrowDown"]
    ) {

      targetLatitude -=
        lookSpeed;
    }


    targetLatitude =
      Math.max(
        -85,
        Math.min(
          85,
          targetLatitude
        )
      );
  }


  updateCameraLook();


  renderer.render(
    scene,
    camera
  );
}


animate();


// ========================================
// リサイズ
// ========================================

window.addEventListener(
  "resize",
  () => {

    resizeViewer();
  }
);


// ========================================
// ResizeObserver
// ========================================

const resizeObserver =
  new ResizeObserver(
    () => {

      resizeViewer();
    }
  );


resizeObserver.observe(
  container
);


// ========================================
// 初期状態
// ========================================

updatePhotoCount();


renderAlbum();


cameraUI.classList.add(
  "hidden"
);


albumButton.classList.add(
  "hidden"
);


albumPanel.classList.add(
  "hidden"
);


topBackButton.classList.add(
  "hidden"
);


photoLimitDialog.classList.add(
  "hidden"
);


photoPopup.classList.add(
  "hidden"
);


endScreen.classList.add(
  "hidden"
);


slideshowPanel.classList.add(
  "hidden"
);


endChoiceButtons.classList.add(
  "hidden"
);


tapToContinue.classList.add(
  "hidden"
);


// 開始時はトップ画面を表示
startScreen.classList.remove(
  "hidden"
);