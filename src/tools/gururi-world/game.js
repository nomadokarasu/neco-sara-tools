import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

const container = document.getElementById("panorama-container");
const cameraUI = document.getElementById("camera-ui");
const zoomSlider = document.getElementById("zoom-slider");
const photoCount = document.getElementById("photo-count");
const shutterEffect = document.getElementById("shutter-effect");
const shutterButton = document.getElementById("shutter-button");
const albumButton = document.getElementById("album-button");
const topBackButton =
  document.getElementById(
    "top-back-button"
  );
const albumBackButton = document.getElementById("album-back-button");
const albumPanel = document.getElementById("album-panel");
const albumGrid = document.getElementById("album-grid");
const albumCount = document.getElementById("album-count");
const photoPopup = document.getElementById("photo-popup");
const popupImage = document.getElementById("popup-image");
const popupBackButton = document.getElementById("popup-back-button");
const popupDeleteButton = document.getElementById("popup-delete-button");

const startScreen = document.getElementById("start-screen");

const photoLimitDialog = document.getElementById("photo-limit-dialog");
const limitAlbumButton = document.getElementById("limit-album-button");
const finishButton = document.getElementById("finish-button");

const endScreen = document.getElementById("end-screen");
const endDialogueBox = document.getElementById("end-dialogue-box");
const endDialogueText = document.getElementById("end-dialogue-text");
const endChoiceButtons = document.getElementById("end-choice-buttons");
const endYesButton = document.getElementById("end-yes-button");
const endNoButton = document.getElementById("end-no-button");

const slideshowPanel = document.getElementById("slideshow-panel");
const slideshowImage = document.getElementById("slideshow-image");
const slideshowCount = document.getElementById("slideshow-count");
const slideshowSkipButton = document.getElementById("slideshow-skip-button");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  85,
  1,
  0.1,
  1000
);

camera.position.set(0, 0, 0.1);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});

function resizeViewer() {
  const rect = container.getBoundingClientRect();

  const width =
    Math.max(1, Math.round(rect.width));

  const height =
    Math.max(1, Math.round(rect.height));

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
  Math.min(window.devicePixelRatio, 2)
);

container.appendChild(renderer.domElement);
resizeViewer();

const captureCanvas =
  document.createElement("canvas");

const captureRenderer =
  new THREE.WebGLRenderer({
    canvas: captureCanvas,
    antialias: true,
    preserveDrawingBuffer: true
  });

captureRenderer.setPixelRatio(1);
captureRenderer.outputColorSpace =
  renderer.outputColorSpace;

const geometry =
  new THREE.SphereGeometry(
    500,
    60,
    40
  );

geometry.scale(-1, 1, 1);

const textureLoader =
  new THREE.TextureLoader();

const material =
  new THREE.MeshBasicMaterial();

const panorama =
  new THREE.Mesh(
    geometry,
    material
  );

scene.add(panorama);

function loadWorld(worldId) {

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

        loadWorld(
          worldId
        );

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



const tapToContinue =
  document.getElementById(
    "tap-to-continue"
  );

let currentMode = "camera";

let longitude = 0;
let latitude = 0;

let cameraFov = 85;

const photos = [];
const maxPhotos = 24;

let selectedPhotoIndex = 0;
let isPopupOpen = false;

let isGameStarted = false;
let isEndScreenOpen = false;

let isDragging = false;

let startX = 0;
let startY = 0;

let startLongitude = 0;
let startLatitude = 0;

renderer.domElement.addEventListener(
  "pointerdown",
  (event) => {
    if (
      !isGameStarted ||
      isEndScreenOpen ||
      currentMode === "album"
    ) {
      return;
    }

    isDragging = true;

    startX = event.clientX;
    startY = event.clientY;

    startLongitude = longitude;
    startLatitude = latitude;

    renderer.domElement.setPointerCapture(
      event.pointerId
    );
  }
);

renderer.domElement.addEventListener(
  "pointermove",
  (event) => {
    if (!isDragging) return;

    const deltaX =
      event.clientX - startX;

    const deltaY =
      event.clientY - startY;

    longitude =
      startLongitude -
      deltaX * 0.1;

    latitude =
      startLatitude +
      deltaY * 0.1;
  }
);

renderer.domElement.addEventListener(
  "pointerup",
  () => {
    isDragging = false;
  }
);

function setMode(mode) {
  if (isPopupOpen) {
    closePopup();
  }

  currentMode = mode;
  isDragging = false;

  if (mode === "camera") {
    cameraUI.classList.remove("hidden");
    albumButton.classList.remove("hidden");
    albumPanel.classList.add("hidden");

    camera.fov = cameraFov;
    camera.updateProjectionMatrix();
  }

  if (mode === "album") {
    cameraUI.classList.add("hidden");
    albumButton.classList.add("hidden");
    albumPanel.classList.remove("hidden");

    renderAlbum();
    albumPanel.scrollTop = 0;
  }
}

albumButton.addEventListener(
  "click",
  () => setMode("album")
);

topBackButton.addEventListener(
  "click",
  () => {

    // 撮影した写真をリセット
    photos.splice(
      0,
      photos.length
    );

    selectedPhotoIndex =
      0;

    updatePhotoCount();

    renderAlbum();


    // 撮影画面を終了
    isGameStarted =
      false;

    currentMode =
      "camera";


    cameraUI.classList.add(
      "hidden"
    );

    albumButton.classList.add(
      "hidden"
    );

    topBackButton.classList.add(
      "hidden"
    );


    // トップ画面を表示
    startScreen.classList.remove(
      "hidden"
    );
  }
);

albumBackButton.addEventListener(
  "click",
  () => setMode("camera")
);

function applyZoomFromSlider() {
  const zoom =
    Number(zoomSlider.value);

  cameraFov =
    120 -
    zoom * 0.7;

  if (
    currentMode === "camera"
  ) {
    camera.fov = cameraFov;
    camera.updateProjectionMatrix();
  }
}

zoomSlider.addEventListener(
  "input",
  applyZoomFromSlider
);

renderer.domElement.addEventListener(
  "wheel",
  (event) => {
    if (
      !isGameStarted ||
      isEndScreenOpen ||
      currentMode !== "camera"
    ) {
      return;
    }

    event.preventDefault();

    const currentZoom =
      Number(zoomSlider.value);

    const zoomStep =
      event.deltaY > 0
        ? -5
        : 5;

    const nextZoom =
      THREE.MathUtils.clamp(
        currentZoom + zoomStep,
        0,
        100
      );

    zoomSlider.value =
      nextZoom;

    applyZoomFromSlider();
  },
  {
    passive: false
  }
);

shutterButton.addEventListener(
  "click",
  capturePhoto
);

function capturePhoto() {
  if (
    !isGameStarted ||
    isEndScreenOpen ||
    currentMode !== "camera"
  ) {
    return;
  }

  if (
    photos.length >= maxPhotos
  ) {
    return;
  }

  const outputWidth = 1200;
  const outputHeight = 1200;

  const captureCamera =
    camera.clone();

  captureCamera.aspect = 1;
  captureCamera.updateProjectionMatrix();

  captureRenderer.setSize(
    outputWidth,
    outputHeight,
    false
  );

  captureRenderer.render(
    scene,
    captureCamera
  );

  const imageData =
    captureRenderer.domElement
      .toDataURL("image/png");

  photos.push({
    src: imageData
  });

  updatePhotoCount();

  shutterEffect.classList.remove("active");
  void shutterEffect.offsetWidth;
  shutterEffect.classList.add("active");

  if (
    photos.length === maxPhotos
  ) {
    window.setTimeout(
      () => {
        photoLimitDialog.classList.remove(
          "hidden"
        );
      },
      250
    );
  }
}

function updatePhotoCount() {
  photoCount.textContent =
    `${photos.length} / ${maxPhotos}`;

  albumCount.textContent =
    `${photos.length} / ${maxPhotos}`;
}

limitAlbumButton.addEventListener(
  "click",
  () => {
    photoLimitDialog.classList.add("hidden");
    setMode("album");
  }
);

finishButton.addEventListener(
  "click",
  () => {
    photoLimitDialog.classList.add("hidden");
    openEndScreen();
  }
);

function renderAlbum() {
  albumGrid.innerHTML = "";

  updatePhotoCount();

  photos.forEach(
    (photo, index) => {
      const slot =
        document.createElement("div");

      slot.className =
        "album-slot";

      const img =
        document.createElement("img");

      img.src =
        photo.src;

      img.className =
        "album-photo";

      img.alt =
        `撮影した写真 ${index + 1}`;

      slot.appendChild(img);

      slot.addEventListener(
        "click",
        () => {
          selectedPhotoIndex = index;
          openSelectedPhoto();
        }
      );

      albumGrid.appendChild(slot);
    }
  );
}

function openSelectedPhoto() {
  if (
    selectedPhotoIndex < 0 ||
    selectedPhotoIndex >= photos.length
  ) {
    return;
  }

  popupImage.src =
    photos[selectedPhotoIndex].src;

  isPopupOpen = true;

  photoPopup.classList.remove("hidden");
}

function movePopupPhoto(direction) {
  if (
    photos.length === 0
  ) {
    return;
  }

  const nextIndex =
    selectedPhotoIndex +
    direction;

  if (
    nextIndex < 0 ||
    nextIndex >= photos.length
  ) {
    return;
  }

  selectedPhotoIndex =
    nextIndex;

  popupImage.src =
    photos[selectedPhotoIndex].src;
}

function closePopup() {
  isPopupOpen = false;

  photoPopup.classList.add("hidden");

  popupImage.src = "";
}

popupBackButton.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();
    closePopup();
  }
);

popupDeleteButton.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    // 現在の写真を削除
    deleteSelectedPhoto();

    // 写真が1枚もなくなった場合
    if (photos.length === 0) {
      closePopup();
      return;
    }

    // 削除した位置に次の写真がある場合は、
    // その写真をそのまま表示
    popupImage.src =
      photos[selectedPhotoIndex].src;
  }
);

let popupSwipeStartX = 0;
let popupSwipeStartY = 0;

photoPopup.addEventListener(
  "pointerdown",
  (event) => {
    if (!isPopupOpen) return;

    popupSwipeStartX =
      event.clientX;

    popupSwipeStartY =
      event.clientY;
  }
);

photoPopup.addEventListener(
  "pointerup",
  (event) => {
    if (!isPopupOpen) return;

    const deltaX =
      event.clientX -
      popupSwipeStartX;

    const deltaY =
      event.clientY -
      popupSwipeStartY;

    if (
      Math.abs(deltaY) >
      Math.abs(deltaX)
    ) {
      return;
    }

    if (
      Math.abs(deltaX) <
      50
    ) {
      return;
    }

    if (deltaX < 0) {
      movePopupPhoto(1);
    } else {
      movePopupPhoto(-1);
    }
  }
);

function deleteSelectedPhoto() {
  if (
    selectedPhotoIndex < 0 ||
    selectedPhotoIndex >= photos.length
  ) {
    return;
  }

  photos.splice(
    selectedPhotoIndex,
    1
  );

  if (
    selectedPhotoIndex >= photos.length
  ) {
    selectedPhotoIndex =
      Math.max(
        0,
        photos.length - 1
      );
  }

  updatePhotoCount();
  renderAlbum();
}

const endDialogueState = {
  phase: "intro",
  typing: false,
  fullText: "",
  timer: null,
  awaitingChoice: false
};

function openEndScreen() {
  isEndScreenOpen = true;
  currentMode = "end";

  cameraUI.classList.add("hidden");
  albumButton.classList.add("hidden");
  albumPanel.classList.add("hidden");
  photoPopup.classList.add("hidden");

  endScreen.classList.remove("hidden");
  slideshowPanel.classList.add("hidden");
  endChoiceButtons.classList.add("hidden");

  endDialogueState.phase = "intro";
  endDialogueState.awaitingChoice = false;

  typeEndDialogue(
    "お待たせしました、24枚の写真が現像できましたよ"
  );
}

function typeEndDialogue(
  text,
  showChoicesAfter = false
) {

  window.clearInterval(
    endDialogueState.timer
  );

  endDialogueState.typing = true;
  endDialogueState.fullText = text;

  endDialogueText.textContent = "";

  let index = 0;

  endDialogueState.timer =
    window.setInterval(
      () => {

        endDialogueText.textContent +=
          text[index];

        index += 1;

        if (
          index >= text.length
        ) {

          window.clearInterval(
            endDialogueState.timer
          );

          endDialogueState.typing = false;


          // 質問の場合は、
          // 文字送り終了後0.7秒で選択肢を表示
          if (showChoicesAfter) {

            window.setTimeout(
              () => {
                showEndChoices();
              },
              100
            );
          }
        }
      },
      45
    );
}

function finishTypingImmediately() {
  if (
    !endDialogueState.typing
  ) {
    return;
  }

  window.clearInterval(
    endDialogueState.timer
  );

  endDialogueState.typing = false;

  endDialogueText.textContent =
    endDialogueState.fullText;
}

function showEndChoices() {

  endChoiceButtons.classList.remove(
    "hidden"
  );

  tapToContinue.classList.add(
    "hidden"
  );
}

function hideEndChoices() {

  endChoiceButtons.classList.add(
    "hidden"
  );

  tapToContinue.classList.add(
    "hidden"
  );
}

function advanceEndDialogue() {

  // 文字送り途中なら全文表示
  if (
    endDialogueState.typing
  ) {

    finishTypingImmediately();

    return;
  }


  // 最初のセリフから
  // スライドショー確認へ
  if (
    endDialogueState.phase ===
    "intro"
  ) {

    endDialogueState.phase =
      "slideshow-choice";


    tapToContinue.classList.add(
      "hidden"
    );


    typeEndDialogue(
      "スライドショーを見ますか？",
      true
    );

    return;
  }

  if (
  endDialogueState.phase ===
  "download-complete"
) {

  tapToContinue.classList.add(
    "hidden"
  );

  finishGame();

  return;
}
}

endScreen.addEventListener(
  "click",
  (event) => {
    if (
      event.target.closest("button")
    ) {
      return;
    }

    if (
      !slideshowPanel.classList
        .contains("hidden")
    ) {
      return;
    }

    advanceEndDialogue();
  }
);

endYesButton.addEventListener(
  "click",
  async () => {

    hideEndChoices();


    // スライドショーを見る
    if (
      endDialogueState.phase ===
      "slideshow-choice"
    ) {

      await startSlideshow();


      endDialogueState.phase =
        "download-choice";


      tapToContinue.classList.add(
        "hidden"
      );


      typeEndDialogue(
        "写真をダウンロードしますか？",
        true
      );

      return;
    }


    // 写真をダウンロードする
    if (
  endDialogueState.phase ===
  "download-choice"
) {

  hideEndChoices();

  tapToContinue.classList.add(
    "hidden"
  );


  // すぐに表示を切り替える
  endDialogueText.textContent =
    "ダウンロード中...";


  // ブラウザに一度画面を描画させる
  await new Promise(
    (resolve) => {

      requestAnimationFrame(
        () => {

          requestAnimationFrame(
            resolve
          );
        }
      );
    }
  );


  // ZIP生成・ダウンロード開始
  await downloadAllPhotos();


  // 「完了」が早すぎないように少し待つ
  await new Promise(
    (resolve) => {

      setTimeout(
        resolve,
        1500
      );
    }
  );


  endDialogueState.phase =
    "download-complete";


  typeEndDialogue(
    "ダウンロードできました"
  );


  tapToContinue.classList.remove(
    "hidden"
  );


  return;
}
  }
);


endNoButton.addEventListener(
  "click",
  () => {

    hideEndChoices();


    // スライドショーを見ない
    if (
      endDialogueState.phase ===
      "slideshow-choice"
    ) {

      endDialogueState.phase =
        "download-choice";


      tapToContinue.classList.add(
        "hidden"
      );


      typeEndDialogue(
        "写真をダウンロードしますか？",
        true
      );

      return;
    }


    // ダウンロードしない
    if (
      endDialogueState.phase ===
      "download-choice"
    ) {

      finishGame();

      return;
    }
  }
);
let slideshowResolve = null;
let slideshowTimer = null;
let slideshowIndex = 0;

function startSlideshow() {
  return new Promise(
    (resolve) => {
      slideshowResolve =
        resolve;

      slideshowIndex =
        0;

      slideshowPanel.classList.remove(
        "hidden"
      );

      endDialogueBox.classList.add(
        "hidden"
      );

      showSlideshowPhoto();
    }
  );
}

function showSlideshowPhoto() {
  window.clearTimeout(
    slideshowTimer
  );

  if (
    slideshowIndex >= photos.length
  ) {
    finishSlideshow();
    return;
  }

  slideshowImage.src =
    photos[slideshowIndex].src;

  slideshowCount.textContent =
    `${slideshowIndex + 1} / ${photos.length}`;

  slideshowIndex += 1;

  slideshowTimer =
    window.setTimeout(
      showSlideshowPhoto,
      1800
    );
}

function finishSlideshow() {
  window.clearTimeout(
    slideshowTimer
  );

  slideshowPanel.classList.add(
    "hidden"
  );

  endDialogueBox.classList.remove(
    "hidden"
  );

  if (slideshowResolve) {
    slideshowResolve();
    slideshowResolve = null;
  }
}

slideshowSkipButton.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();
    finishSlideshow();
  }
);

async function downloadAllPhotos() {
  if (
    photos.length === 0
  ) {
    return;
  }

  if (
    typeof JSZip === "undefined"
  ) {
    photos.forEach(
      (photo, index) => {
        const link =
          document.createElement("a");

        link.href =
          photo.src;

        link.download =
          `photo-${String(
            index + 1
          ).padStart(2, "0")}.png`;

        link.click();
      }
    );

    return;
  }

  const zip =
    new JSZip();

  photos.forEach(
    (photo, index) => {
      const base64 =
        photo.src.split(",")[1];

      zip.file(
        `photo-${String(
          index + 1
        ).padStart(2, "0")}.png`,
        base64,
        {
          base64: true
        }
      );
    }
  );

  const blob =
    await zip.generateAsync({
      type: "blob"
    });

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = "photos.zip";

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.setTimeout(
    () => {
      URL.revokeObjectURL(url);
    },
    1000
  );
}

function finishGame() {
  typeEndDialogue(
    "それでは、また。"
  );

  window.setTimeout(
    () => {
      finishTypingImmediately();

      window.setTimeout(
        returnToStartScreen,
        700
      );
    },
    1100
  );
}

function returnToStartScreen() {
  window.clearInterval(
    endDialogueState.timer
  );

  window.clearTimeout(
    slideshowTimer
  );

  photos.splice(
    0,
    photos.length
  );

  selectedPhotoIndex = 0;

  longitude = 0;
  latitude = 0;

  zoomSlider.value = 50;

  applyZoomFromSlider();
  updatePhotoCount();
  renderAlbum();

  endScreen.classList.add("hidden");
  slideshowPanel.classList.add("hidden");
  photoLimitDialog.classList.add("hidden");
  albumPanel.classList.add("hidden");
  photoPopup.classList.add("hidden");

  isPopupOpen = false;
  isGameStarted = false;
  isEndScreenOpen = false;

  currentMode = "camera";

  cameraUI.classList.add(
  "hidden"
);

albumButton.classList.add(
  "hidden"
);

startScreen.classList.remove(
  "hidden"
);
}

const keys = {};

window.addEventListener(
  "keydown",
  (event) => {
    keys[event.code] = true;

    if (
      !isGameStarted ||
      isEndScreenOpen
    ) {
      return;
    }

    if (isPopupOpen) {
      if (
        event.code === "ArrowLeft" &&
        !event.repeat
      ) {
        event.preventDefault();
        movePopupPhoto(-1);
        return;
      }

      if (
        event.code === "ArrowRight" &&
        !event.repeat
      ) {
        event.preventDefault();
        movePopupPhoto(1);
        return;
      }

      if (
        (
          event.code === "Space" ||
          event.code === "Escape"
        ) &&
        !event.repeat
      ) {
        event.preventDefault();
        closePopup();
        return;
      }

      return;
    }

    if (
      currentMode === "album"
    ) {
      if (
        event.code === "Escape" &&
        !event.repeat
      ) {
        setMode("camera");
      }

      return;
    }

    if (
      currentMode === "camera" &&
      event.code === "Space" &&
      !event.repeat
    ) {
      event.preventDefault();
      capturePhoto();
    }
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    keys[event.code] = false;
  }
);

window.addEventListener(
  "resize",
  resizeViewer
);

function animate() {
  requestAnimationFrame(
    animate
  );

  const lookSpeed =
    1.2;

  if (
    isGameStarted &&
    !isEndScreenOpen &&
    currentMode === "camera"
  ) {
    if (
      keys["ArrowLeft"]
    ) {
      longitude -= lookSpeed;
    }

    if (
      keys["ArrowRight"]
    ) {
      longitude += lookSpeed;
    }

    if (
      keys["ArrowUp"]
    ) {
      latitude += lookSpeed;
    }

    if (
      keys["ArrowDown"]
    ) {
      latitude -= lookSpeed;
    }
  }

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
    Math.sin(phi) *
    Math.cos(theta);

  target.y =
    500 *
    Math.cos(phi);

  target.z =
    500 *
    Math.sin(phi) *
    Math.sin(theta);

  camera.lookAt(
    target
  );

  renderer.render(
    scene,
    camera
  );
}

updatePhotoCount();
applyZoomFromSlider();

cameraUI.classList.add(
  "hidden"
);

albumButton.classList.add(
  "hidden"
);

topBackButton.classList.add(
  "hidden"
);

animate();
