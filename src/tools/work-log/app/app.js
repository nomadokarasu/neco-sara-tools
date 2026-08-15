"use strict";


// ========================================
// 保存に使用する名前
// ========================================

const STORAGE_KEY =
  "junota-work-log";


// ========================================
// 初期データ
// ========================================

const defaultData = {
    settings: {
    weeklyHours: 30,
    selectedPeriod: "week",
    selectedScreen: "work"
  },

  categories: [],

  sessions: [],

  activeSession: null
};


// ========================================
// HTML要素
// ========================================

const periodButtons =
  document.querySelectorAll(
    ".period-button"
  );


const workTimeForm =
  document.getElementById(
    "work-time-form"
  );


const workTimeLabel =
  document.getElementById(
    "work-time-label"
  );


const totalWorkHoursInput =
  document.getElementById(
    "total-work-hours"
  );


const convertedDay =
  document.getElementById(
    "converted-day"
  );


const convertedWeek =
  document.getElementById(
    "converted-week"
  );


const convertedMonth =
  document.getElementById(
    "converted-month"
  );


const statusMessage =
  document.getElementById(
    "status-message"
  );

  

const categoryList =
  document.getElementById(
    "category-list"
  );


const allocationTotal =
  document.getElementById(
    "allocation-total"
  );


const addCategoryButton =
  document.getElementById(
    "add-category-button"
  );


const timerProjectSelect =
  document.getElementById(
    "timer-project"
  );


const progressList =
  document.getElementById(
    "progress-list"
  );

  

const screenTabButtons =
  document.querySelectorAll(
    ".screen-tab"
  );


const workPanel =
  document.getElementById(
    "work-panel"
  );


const settingsPanel =
  document.getElementById(
    "settings-panel"
  );


const recordsPanel =
  document.getElementById(
    "records-panel"
  );

  

const timerCategoryName =
  document.getElementById(
    "timer-category-name"
  );


const timerProjectName =
  document.getElementById(
    "timer-project-name"
  );


const timerDisplay =
  document.getElementById(
    "timer-display"
  );


const remainingTime =
  document.getElementById(
    "remaining-time"
  );


const startButton =
  document.getElementById(
    "start-button"
  );


const stopButton =
  document.getElementById(
    "stop-button"
  );




const workNoteForm =
  document.getElementById(
    "work-note-form"
  );


const workNoteInput =
  document.getElementById(
    "work-note"
  );


const addNoteButton =
  document.getElementById(
    "add-note-button"
  );


const currentNoteList =
  document.getElementById(
    "current-note-list"
  );


// ========================================
// 保存済みデータを読み込む
// ========================================

let appData =
  structuredClone(
    defaultData
  );


// ========================================
// 初期表示
// ========================================

initializeApp();


async function initializeApp() {
  appData =
    await loadAppData();

  ensureInitialCategories();

  updatePeriodButtons();

  updateScreenTabs();

  updateWorkTimeDisplay();

  initializeTimer();
}


// ========================================
// データの読み込み
// ========================================

async function loadAppData() {
  const localData =
    loadLocalAppData();

  try {
    const response =
      await fetch(
        "../api/load.php?time=" +
        Date.now(),

        {
          method: "GET",
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "HTTP " +
        response.status
      );
    }

    const serverData =
      await response.json();

    const normalizedServerData =
      normalizeAppData(
        serverData
      );

    if (
      !hasWorkLogContent(
        normalizedServerData
      ) &&
      hasWorkLogContent(
        localData
      )
    ) {
      return localData;
    }

    localStorage.setItem(
      STORAGE_KEY,

      JSON.stringify(
        normalizedServerData
      )
    );

    return normalizedServerData;
  } catch (error) {
    console.error(
      "サーバーからの読み込みに失敗しました。",
      error
    );

    return localData;
  }
}


function loadLocalAppData() {
  const savedData =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!savedData) {
    return structuredClone(
      defaultData
    );
  }

  try {
    return normalizeAppData(
      JSON.parse(
        savedData
      )
    );
  } catch (error) {
    console.error(
      "ブラウザ内データの読み込みに失敗しました。",
      error
    );

    return structuredClone(
      defaultData
    );
  }
}


function normalizeAppData(data) {
  return {
    ...structuredClone(
      defaultData
    ),

    ...data,

    settings: {
      ...defaultData.settings,

      ...(data.settings || {})
    },

    categories:
      Array.isArray(
        data.categories
      )
        ? data.categories
        : [],

    sessions:
      Array.isArray(
        data.sessions
      )
        ? data.sessions
        : [],

    activeSession:
      data.activeSession || null
  };
}


function hasWorkLogContent(data) {
  return (
    data.categories.length > 0 ||
    data.sessions.length > 0 ||
    Boolean(
      data.activeSession
    )
  );
}


// ========================================
// データの保存
// ========================================

let adminPassword = "";

let pendingServerData = null;

let serverSavePromise = null;


function saveAppData() {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(
      appData
    )
  );

  pendingServerData =
    structuredClone(
      appData
    );

  if (!serverSavePromise) {
    serverSavePromise =
      saveQueuedDataToServer()
        .finally(
          function() {
            serverSavePromise =
              null;

            if (pendingServerData) {
              saveAppData();
            }
          }
        );
  }
}


async function saveQueuedDataToServer() {
  while (pendingServerData) {
    const dataToSave =
      pendingServerData;

    pendingServerData =
      null;

    if (!adminPassword) {
      const enteredPassword =
        window.prompt(
          "管理用パスワードを入力してください。"
        );

      if (!enteredPassword) {
        showStatusMessage(
          "サーバーへの保存を中止しました。ブラウザ内には保存されています。"
        );

        return;
      }

      adminPassword =
        enteredPassword;
    }

    try {
      const response =
        await fetch(
          "../api/save.php",

          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            cache: "no-store",

            body: JSON.stringify(
              {
                password:
                  adminPassword,

                data:
                  dataToSave
              }
            )
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          adminPassword = "";
        }

        throw new Error(
          result.error ||
          "サーバーへの保存に失敗しました。"
        );
      }

      showStatusMessage(
        "ブラウザとサーバーに保存しました。"
      );
    } catch (error) {
      console.error(
        "サーバーへの保存に失敗しました。",
        error
      );

      showStatusMessage(
        error.message ||
        "サーバーへの保存に失敗しました。"
      );

      return;
    }
  }
}


// ========================================
// 表示設定だけをブラウザ内に保存
// ========================================

function saveDisplaySettingsLocally() {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(
      appData
    )
  );
}


// ========================================
// 日・週・月ボタン
// ========================================

periodButtons.forEach(
  function(periodButton) {
    periodButton.addEventListener(
      "click",

      function() {
        const selectedPeriod =
          periodButton.dataset.period;


        if (!selectedPeriod) {
          return;
        }


        appData.settings.selectedPeriod =
  selectedPeriod;


saveDisplaySettingsLocally();

updatePeriodButtons();

        updateWorkTimeDisplay();
      }
    );
  }
);


// ========================================
// 選択中の期間をボタンに反映
// ========================================

function updatePeriodButtons() {
  periodButtons.forEach(
    function(periodButton) {
      const buttonPeriod =
        periodButton.dataset.period;


      const isSelected =
        buttonPeriod ===
        appData.settings.selectedPeriod;


      periodButton.classList.toggle(
        "is-active",
        isSelected
      );
    }
  );
}


// ========================================
// 作業時間の保存
// ========================================

workTimeForm.addEventListener(
  "submit",

  function(event) {
    event.preventDefault();


    const enteredHours =
      Number(
        totalWorkHoursInput.value
      );


    if (
      !Number.isFinite(
        enteredHours
      ) ||
      enteredHours <= 0
    ) {
      showStatusMessage(
        "0より大きい時間を入力してください。"
      );

      return;
    }


    const selectedPeriod =
      appData.settings.selectedPeriod;


    appData.settings.weeklyHours =
      convertToWeeklyHours(
        enteredHours,
        selectedPeriod
      );


    saveAppData();

    updateWorkTimeDisplay();


    showStatusMessage(
      "作業時間を保存しました。"
    );
  }
);


// ========================================
// 入力された時間を週単位に変換
// ========================================

function convertToWeeklyHours(
  enteredHours,
  period
) {
    if (period === "day") {
    return enteredHours * 7;
  }


  if (period === "month") {
    return enteredHours * 12 / 52;
  }


  return enteredHours;
}


// ========================================
// 週の時間から各期間へ変換
// ========================================

function getConvertedHours() {
  const weeklyHours =
    appData.settings.weeklyHours;


  return {
        day:
      weeklyHours / 7,

    week:
      weeklyHours,

    month:
      weeklyHours * 52 / 12
  };
}


// ========================================
// 作業時間の表示を更新
// ========================================

function updateWorkTimeDisplay() {
  const convertedHours =
    getConvertedHours();


  const selectedPeriod =
    appData.settings.selectedPeriod;


  if (selectedPeriod === "day") {
    workTimeLabel.textContent =
      "1日の作業時間";
  } else if (
    selectedPeriod === "month"
  ) {
    workTimeLabel.textContent =
      "1か月の作業時間";
  } else {
    workTimeLabel.textContent =
      "1週間の作業時間";
  }


  totalWorkHoursInput.value =
    formatInputNumber(
      convertedHours[
        selectedPeriod
      ]
    );


  convertedDay.textContent =
    formatHours(
      convertedHours.day
    );


  convertedWeek.textContent =
    formatHours(
      convertedHours.week
    );


    convertedMonth.textContent =
    formatHours(
      convertedHours.month
    );


    renderCategoryList();

  renderTimerProjectOptions();

  renderProgressList();

  renderTimer();
}


// ========================================
// 入力欄用の数値表示
// ========================================

function formatInputNumber(
  number
) {
  const roundedNumber =
    Math.round(
      number * 10
    ) / 10;


  return String(
    roundedNumber
  );
}


// ========================================
// 「○時間○分」へ変換
// ========================================

function formatHours(
  decimalHours
) {
  const totalMinutes =
    Math.round(
      decimalHours * 60
    );


  const hours =
    Math.floor(
      totalMinutes / 60
    );


  const minutes =
    totalMinutes % 60;


  if (
    hours > 0 &&
    minutes > 0
  ) {
    return (
      hours +
      "時間" +
      minutes +
      "分"
    );
  }


  if (hours > 0) {
    return (
      hours +
      "時間"
    );
  }


  return (
    minutes +
    "分"
  );
}


// ========================================
// 画面右下のメッセージ
// ========================================

let statusMessageTimer =
  null;


function showStatusMessage(
  message
) {
  statusMessage.textContent =
    message;


  statusMessage.classList.add(
    "is-visible"
  );


  if (statusMessageTimer) {
    clearTimeout(
      statusMessageTimer
    );
  }


  statusMessageTimer =
    setTimeout(
      function() {
        statusMessage.classList.remove(
          "is-visible"
        );
      },

      2500
    );
}



// ========================================
// 最初の大分類とプロジェクト
// ========================================

function ensureInitialCategories() {
  if (
    Array.isArray(
      appData.categories
    ) &&
    appData.categories.length > 0
  ) {
    return;
  }


  appData.categories = [
    {
      id:
        createId(
          "category"
        ),

      name:
        "作品づくり",

      allocationPercent:
        40,

      projects: [
        {
          id:
            createId(
              "project"
            ),

          name:
            "作品制作",

          allocationPercent:
            100
        }
      ]
    },

    {
      id:
        createId(
          "category"
        ),

      name:
        "ウェブツールづくり",

      allocationPercent:
        35,

      projects: [
        {
          id:
            createId(
              "project"
            ),

          name:
            "ぐるりの世界",

          allocationPercent:
            50
        },

        {
          id:
            createId(
              "project"
            ),

          name:
            "手が描けーる",

          allocationPercent:
            50
        }
      ]
    },

    {
      id:
        createId(
          "category"
        ),

      name:
        "SEO記事作成",

      allocationPercent:
        25,

      projects: [
        {
          id:
            createId(
              "project"
            ),

          name:
            "SEO記事",

          allocationPercent:
            100
        }
      ]
    }
  ];


  saveAppData();
}


// ========================================
// IDを作る
// ========================================

function createId(
  prefix
) {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID ===
      "function"
  ) {
    return (
      prefix +
      "-" +
      window.crypto.randomUUID()
    );
  }


  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(16)
      .slice(2)
  );
}


// ========================================
// 現在選択中の期間の予定時間
// ========================================

function getSelectedPeriodHours() {
  const convertedHours =
    getConvertedHours();


  const selectedPeriod =
    appData.settings.selectedPeriod;


  return (
    convertedHours[
      selectedPeriod
    ]
  );
}


// ========================================
// 大分類とプロジェクトを表示する
// ========================================

function renderCategoryList() {
  const selectedPeriodHours =
    getSelectedPeriodHours();


  const totalPercentage =
    appData.categories.reduce(
      function(total, category) {
        return (
          total +
          Number(
            category.allocationPercent
          )
        );
      },

      0
    );


    allocationTotal.textContent =
    createAllocationMessage(
      totalPercentage
    );


  allocationTotal.classList.toggle(
    "has-error",

    Math.round(
      totalPercentage
    ) !== 100
  );


  categoryList.innerHTML =
    appData.categories
      .map(
        function(category) {
          const categoryHours =
            selectedPeriodHours *
            Number(
              category.allocationPercent
            ) /
            100;


                    const projects =
            Array.isArray(
              category.projects
            )
              ? category.projects
              : [];


          const projectTotalPercentage =
            projects.reduce(
              function(
                total,
                project
              ) {
                return (
                  total +
                  Number(
                    project.allocationPercent
                  )
                );
              },

              0
            );


          const projectAllocationMessage =
            createAllocationMessage(
              projectTotalPercentage
            );


          const projectAllocationClass =
            Math.round(
              projectTotalPercentage
            ) === 100
              ? ""
              : " has-error";


          const projectHtml =
            projects
              .map(
                function(project) {
                  const projectHours =
                    categoryHours *
                    Number(
                      project.allocationPercent
                    ) /
                    100;


                  return `
                    <div
                      class="project-item"
                      data-project-id="${project.id}"
                    >
                      <span class="project-branch">
                        └
                      </span>

                      <input
                        class="project-name-input"
                        type="text"
                        value="${escapeHtml(project.name)}"
                        data-action="project-name"
                        data-category-id="${category.id}"
                        data-project-id="${project.id}"
                        aria-label="プロジェクト名"
                      >

                      <label class="percentage-input">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value="${project.allocationPercent}"
                          data-action="project-percentage"
                          data-category-id="${category.id}"
                          data-project-id="${project.id}"
                          aria-label="プロジェクトの割合"
                        >

                        <span>
                          %
                        </span>
                      </label>

                      <span class="project-hours">
                        ${formatHours(projectHours)}
                      </span>

                      <button
                        class="small-button delete-button"
                        type="button"
                        data-action="delete-project"
                        data-category-id="${category.id}"
                        data-project-id="${project.id}"
                      >
                        削除
                      </button>
                    </div>
                  `;
                }
              )
              .join("");


          return `
            <article
              class="category-item"
              data-category-id="${category.id}"
            >
              <div class="category-header">
                <input
                  class="category-name-input"
                  type="text"
                  value="${escapeHtml(category.name)}"
                  data-action="category-name"
                  data-category-id="${category.id}"
                  aria-label="大分類名"
                >

                <label class="percentage-input">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value="${category.allocationPercent}"
                    data-action="category-percentage"
                    data-category-id="${category.id}"
                    aria-label="大分類の割合"
                  >

                  <span>
                    %
                  </span>
                </label>

                <span class="category-hours">
                  ${formatHours(categoryHours)}
                </span>

                <button
                  class="small-button delete-button"
                  type="button"
                  data-action="delete-category"
                  data-category-id="${category.id}"
                >
                  削除
                </button>
              </div>

                            <div class="project-list">
                <p
                  class="project-allocation-status${projectAllocationClass}"
                >
                  プロジェクト配分：
                  ${projectAllocationMessage}
                </p>

                ${projectHtml}

                <form
                  class="add-project-form"
                  data-category-id="${category.id}"
                >
                  <input
                    type="text"
                    name="projectName"
                    placeholder="プロジェクトを追加"
                    required
                  >

                  <button
                    class="small-button"
                    type="submit"
                  >
                    追加
                  </button>
                </form>
              </div>
            </article>
          `;
        }
      )
      .join("");
}


// ========================================
// HTMLとして解釈される文字を変換する
// ========================================

function escapeHtml(
  text
) {
  return String(
    text
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      "\"",
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


// ========================================
// 大分類を追加する
// ========================================

addCategoryButton.addEventListener(
  "click",

  function() {
    appData.categories.push(
      {
        id:
          createId(
            "category"
          ),

        name:
          "新しい大分類",

        allocationPercent:
          0,

        projects: []
      }
    );


    saveAppData();

    updateWorkTimeDisplay();


    showStatusMessage(
      "大分類を追加しました。"
    );
  }
);


// ========================================
// 大分類・プロジェクトの入力を保存する
// ========================================

categoryList.addEventListener(
  "change",

  function(event) {
    const target =
      event.target;


    if (
      !(target instanceof HTMLInputElement)
    ) {
      return;
    }


    const action =
      target.dataset.action;


    const categoryId =
      target.dataset.categoryId;


    const projectId =
      target.dataset.projectId;


    const category =
      findCategory(
        categoryId
      );


    if (!category) {
      return;
    }


    if (
      action ===
      "category-name"
    ) {
      category.name =
        target.value.trim() ||
        "名称未設定";
    }


    if (
      action ===
      "category-percentage"
    ) {
      category.allocationPercent =
        normalizePercentage(
          target.value
        );
    }


    if (
      action ===
        "project-name" ||
      action ===
        "project-percentage"
    ) {
      const project =
        findProject(
          category,
          projectId
        );


      if (!project) {
        return;
      }


      if (
        action ===
        "project-name"
      ) {
        project.name =
          target.value.trim() ||
          "名称未設定";
      }


      if (
        action ===
        "project-percentage"
      ) {
        project.allocationPercent =
          normalizePercentage(
            target.value
          );
      }
    }


    saveAppData();

    updateWorkTimeDisplay();


    showStatusMessage(
      "設定を保存しました。"
    );
  }
);


// ========================================
// プロジェクトを追加する
// ========================================

categoryList.addEventListener(
  "submit",

  function(event) {
    const form =
      event.target;


    if (
      !form.classList.contains(
        "add-project-form"
      )
    ) {
      return;
    }


    event.preventDefault();


    const categoryId =
      form.dataset.categoryId;


    const category =
      findCategory(
        categoryId
      );


    if (!category) {
      return;
    }


    const formData =
      new FormData(
        form
      );


    const projectName =
      String(
        formData.get(
          "projectName"
        ) || ""
      ).trim();


    if (!projectName) {
      return;
    }


    category.projects.push(
      {
        id:
          createId(
            "project"
          ),

        name:
          projectName,

        allocationPercent:
          0
      }
    );


    saveAppData();

    updateWorkTimeDisplay();


    showStatusMessage(
      "プロジェクトを追加しました。"
    );
  }
);


// ========================================
// 大分類・プロジェクトを削除する
// ========================================

categoryList.addEventListener(
  "click",

  function(event) {
    const button =
      event.target.closest(
        "button[data-action]"
      );


    if (!button) {
      return;
    }


    const action =
      button.dataset.action;


    const categoryId =
      button.dataset.categoryId;


    const projectId =
      button.dataset.projectId;


    if (
      action ===
      "delete-category"
    ) {
      const shouldDelete =
        window.confirm(
          "この大分類と、その中のプロジェクトを削除しますか？"
        );


      if (!shouldDelete) {
        return;
      }


      appData.categories =
        appData.categories.filter(
          function(category) {
            return (
              category.id !==
              categoryId
            );
          }
        );


      saveAppData();

      updateWorkTimeDisplay();


      showStatusMessage(
        "大分類を削除しました。"
      );
    }


    if (
      action ===
      "delete-project"
    ) {
      const category =
        findCategory(
          categoryId
        );


      if (!category) {
        return;
      }


      const shouldDelete =
        window.confirm(
          "このプロジェクトを削除しますか？"
        );


      if (!shouldDelete) {
        return;
      }


      category.projects =
        category.projects.filter(
          function(project) {
            return (
              project.id !==
              projectId
            );
          }
        );


      saveAppData();

      updateWorkTimeDisplay();


      showStatusMessage(
        "プロジェクトを削除しました。"
      );
    }
  }
);


// ========================================
// 大分類を探す
// ========================================

function findCategory(
  categoryId
) {
  return appData.categories.find(
    function(category) {
      return (
        category.id ===
        categoryId
      );
    }
  );
}


// ========================================
// プロジェクトを探す
// ========================================

function findProject(
  category,
  projectId
) {
  return category.projects.find(
    function(project) {
      return (
        project.id ===
        projectId
      );
    }
  );
}


// ========================================
// 割合を0〜100に収める
// ========================================

function normalizePercentage(
  value
) {
  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }


  return Math.min(
    100,

    Math.max(
      0,
      number
    )
  );
}


// ========================================
// タイマーの選択肢を更新する
// ========================================

function renderTimerProjectOptions() {
  const previousValue =
    timerProjectSelect.value;


  const optionHtml =
    appData.categories
      .map(
        function(category) {
          const projects =
            category.projects
              .map(
                function(project) {
                  return `
                    <option value="${project.id}">
                      ${escapeHtml(project.name)}
                    </option>
                  `;
                }
              )
              .join("");


          if (!projects) {
            return "";
          }


          return `
            <optgroup label="${escapeHtml(category.name)}">
              ${projects}
            </optgroup>
          `;
        }
      )
      .join("");


  timerProjectSelect.innerHTML = `
    <option value="">
      プロジェクトを選択
    </option>

    ${optionHtml}
  `;


  const previousOptionExists =
    Array.from(
      timerProjectSelect.options
    ).some(
      function(option) {
        return (
          option.value ===
          previousValue
        );
      }
    );


  if (previousOptionExists) {
    timerProjectSelect.value =
      previousValue;
  }
}


// ========================================
// 現在の進捗欄を表示する
// ========================================

function renderProgressList() {
  const selectedPeriodHours =
    getSelectedPeriodHours();


  if (
    appData.categories.length === 0
  ) {
    progressList.innerHTML = `
      <p class="empty-message">
        大分類が設定されていません。
      </p>
    `;

    return;
  }


  progressList.innerHTML =
    appData.categories
      .map(
        function(category) {
          const categoryPlannedSeconds =
            Math.round(
              selectedPeriodHours *
              Number(
                category.allocationPercent
              ) /
              100 *
              3600
            );


          const categoryActualSeconds =
            getCategoryActualSeconds(
              category.id
            );


            const categoryProgressPercent =
            calculateProgressPercent(
              categoryActualSeconds,
              categoryPlannedSeconds
            );


          const categoryProgressRate =
            calculateProgressRate(
              categoryActualSeconds,
              categoryPlannedSeconds
            );


          const categoryStatus =
            createProgressStatus(
              categoryActualSeconds,
              categoryPlannedSeconds
            );


          const projectProgressHtml =
            category.projects
              .map(
                function(project) {
                  const projectPlannedSeconds =
                    getProjectPlannedSeconds(
                      project.id
                    );


                  const projectActualSeconds =
                    getProjectActualSeconds(
                      project.id
                    );


                  const projectProgressPercent =
                    calculateProgressPercent(
                      projectActualSeconds,
                      projectPlannedSeconds
                    );


                  const projectProgressRate =
                    calculateProgressRate(
                      projectActualSeconds,
                      projectPlannedSeconds
                    );


                  const projectStatus =
                    createProgressStatus(
                      projectActualSeconds,
                      projectPlannedSeconds
                    );


                  return `
                    <div class="project-progress-item">
                      <div class="progress-heading">
                                                <span class="project-progress-name">
                          └ ${escapeHtml(project.name)}

                          <strong class="progress-percentage">
                            ${projectProgressRate}
                          </strong>
                        </span>

                        <span class="progress-time">
                          実績
                          ${formatSecondsAsText(projectActualSeconds)}
                          ／
                          予定
                          ${formatSecondsAsText(projectPlannedSeconds)}
                        </span>
                      </div>

                      <div class="progress-bar">
                        <span
                          class="progress-bar__value"
                          style="width: ${projectProgressPercent}%"
                        ></span>
                      </div>

                      <p
                        class="progress-remaining${projectStatus.isOver ? " is-over" : ""}"
                      >
                        ${projectStatus.message}
                      </p>
                    </div>
                  `;
                }
              )
              .join("");


          return `
            <article class="progress-item">
              <div class="progress-heading">
                                <span class="progress-name">
                  ${escapeHtml(category.name)}

                  <strong class="progress-percentage">
                    ${categoryProgressRate}
                  </strong>
                </span>

                <span class="progress-time">
                  実績
                  ${formatSecondsAsText(categoryActualSeconds)}
                  ／
                  予定
                  ${formatSecondsAsText(categoryPlannedSeconds)}
                </span>
              </div>

              <div class="progress-bar">
                <span
                  class="progress-bar__value"
                  style="width: ${categoryProgressPercent}%"
                ></span>
              </div>

              <p
                class="progress-remaining${categoryStatus.isOver ? " is-over" : ""}"
              >
                ${categoryStatus.message}
              </p>

              <div class="project-progress-list">
                ${projectProgressHtml}
              </div>
            </article>
          `;
        }
      )
      .join("");
}



// ========================================
// 割合の合計メッセージ
// ========================================

function createAllocationMessage(
  totalPercentage
) {
  const roundedTotal =
    Math.round(
      totalPercentage * 10
    ) / 10;


  const difference =
    Math.round(
      Math.abs(
        100 - roundedTotal
      ) * 10
    ) / 10;


  if (roundedTotal < 100) {
    return (
      "合計 " +
      roundedTotal +
      "%（未配分 " +
      difference +
      "%）"
    );
  }


  if (roundedTotal > 100) {
    return (
      "合計 " +
      roundedTotal +
      "%（" +
      difference +
      "%超過）"
    );
  }


  return "合計 100%";
}



// ========================================
// タイマー
// ========================================

var timerIntervalId =
  null;


// ========================================
// タイマーの初期化
// ========================================

function initializeTimer() {
  renderTimer();


  if (appData.activeSession) {
    startTimerInterval();
  }
}


// ========================================
// プロジェクト選択
// ========================================

timerProjectSelect.addEventListener(
  "change",

  function() {
    renderTimer();
  }
);


// ========================================
// タイマー開始
// ========================================

startButton.addEventListener(
  "click",

  function() {
    const projectId =
      timerProjectSelect.value;


    if (!projectId) {
      showStatusMessage(
        "プロジェクトを選択してください。"
      );

      return;
    }


    const projectInformation =
      findProjectInformation(
        projectId
      );


    if (!projectInformation) {
      showStatusMessage(
        "プロジェクトが見つかりません。"
      );

      return;
    }


    if (appData.activeSession) {
      showStatusMessage(
        "すでに作業中です。"
      );

      return;
    }


    appData.activeSession = {
      id:
        createId(
          "session"
        ),

      categoryId:
        projectInformation.category.id,

      projectId:
        projectInformation.project.id,

            startedAt:
        Date.now(),

      segmentStartedAt:
        Date.now(),

      notes: []
    };


    saveAppData();

    renderTimer();

    startTimerInterval();


    showStatusMessage(
      "作業を開始しました。"
    );
  }
);


// ========================================
// 終了ボタン
// ========================================

stopButton.addEventListener(
  "click",

  function() {
    finishActiveSession();
  }
);





// ========================================
// 作業を終了して保存
// ========================================

function finishActiveSession() {
  if (!appData.activeSession) {
    return;
  }


  const endedAt =
    Date.now();


  const elapsedSeconds =
    Math.max(
      1,

      Math.floor(
        (
          endedAt -
          appData.activeSession.startedAt
        ) /
        1000
      )
    );


  const savedNotes =
    Array.isArray(
      appData.activeSession.notes
    )
      ? [
          ...appData.activeSession.notes
        ]
      : [];


  appData.sessions.push(
    {
      id:
        appData.activeSession.id,

      categoryId:
        appData.activeSession.categoryId,

      projectId:
        appData.activeSession.projectId,

      startedAt:
        appData.activeSession.startedAt,

      endedAt:
        endedAt,

      elapsedSeconds:
        elapsedSeconds,

      notes:
        savedNotes
    }
  );


  appData.activeSession =
    null;


  saveAppData();

  stopTimerInterval();

  renderTimer();

  renderProgressList();


  showStatusMessage(
    "作業記録を保存しました。"
  );
}


// ========================================
// 1秒ごとの更新を開始する
// ========================================

function startTimerInterval() {
  stopTimerInterval();


  timerIntervalId =
    setInterval(
      function() {
        renderTimer();

        renderProgressList();
      },

      1000
    );
}


// ========================================
// 1秒ごとの更新を停止する
// ========================================

function stopTimerInterval() {
  if (!timerIntervalId) {
    return;
  }


  clearInterval(
    timerIntervalId
  );


  timerIntervalId =
    null;
}


// ========================================
// タイマー全体の表示
// ========================================

function renderTimer() {
  if (appData.activeSession) {
    renderActiveTimer();

    updateNoteInputState();

    renderCurrentNotes();

    return;
  }


  renderWaitingTimer();

  updateNoteInputState();

  renderCurrentNotes();
}


// ========================================
// 開始前のタイマー表示
// ========================================

function renderWaitingTimer() {
  timerProjectSelect.disabled =
    false;


  startButton.disabled =
    false;


  stopButton.disabled =
    true;


  timerDisplay.textContent =
    "00:00:00";


  const projectId =
    timerProjectSelect.value;


  if (!projectId) {
    timerCategoryName.textContent =
      "";


    timerProjectName.textContent =
      "プロジェクトが選択されていません";


    remainingTime.textContent =
      "残り時間：—";


    remainingTime.classList.remove(
      "is-over"
    );


    return;
  }


  const projectInformation =
    findProjectInformation(
      projectId
    );


  if (!projectInformation) {
    return;
  }


  timerCategoryName.textContent =
    projectInformation.category.name;


  timerProjectName.textContent =
    projectInformation.project.name;


  updateRemainingTime(
    projectId
  );
}


// ========================================
// 作業中のタイマー表示
// ========================================

function renderActiveTimer() {
  const activeSession =
    appData.activeSession;


  const projectInformation =
    findProjectInformation(
      activeSession.projectId
    );


  if (!projectInformation) {
    timerCategoryName.textContent =
      "削除されたプロジェクト";


    timerProjectName.textContent =
      "プロジェクト情報がありません";
  } else {
    timerCategoryName.textContent =
      projectInformation.category.name;


    timerProjectName.textContent =
      projectInformation.project.name;
  }


  timerProjectSelect.value =
    activeSession.projectId;


  timerProjectSelect.disabled =
    true;


  startButton.disabled =
    true;


  stopButton.disabled =
    false;


  timerDisplay.textContent =
    formatTimerClock(
      getActiveElapsedSeconds()
    );


  updateRemainingTime(
    activeSession.projectId
  );
}


// ========================================
// 現在作業中の経過秒数
// ========================================

function getActiveElapsedSeconds() {
  if (!appData.activeSession) {
    return 0;
  }


  return Math.max(
    0,

    Math.floor(
      (
        Date.now() -
        appData.activeSession.startedAt
      ) /
      1000
    )
  );
}


// ========================================
// 00:00:00形式にする
// ========================================

function formatTimerClock(
  totalSeconds
) {
  const hours =
    Math.floor(
      totalSeconds / 3600
    );


  const minutes =
    Math.floor(
      (
        totalSeconds % 3600
      ) /
      60
    );


  const seconds =
    totalSeconds % 60;


  return [
    hours,
    minutes,
    seconds
  ]
    .map(
      function(number) {
        return String(
          number
        ).padStart(
          2,
          "0"
        );
      }
    )
    .join(":");
}


// ========================================
// 秒数を「○時間○分」へ変換
// ========================================

function formatSecondsAsText(
  totalSeconds
) {
  if (totalSeconds < 60) {
    return (
      totalSeconds +
      "秒"
    );
  }


  const totalMinutes =
    Math.floor(
      totalSeconds / 60
    );


  const hours =
    Math.floor(
      totalMinutes / 60
    );


  const minutes =
    totalMinutes % 60;


  if (
    hours > 0 &&
    minutes > 0
  ) {
    return (
      hours +
      "時間" +
      minutes +
      "分"
    );
  }


  if (hours > 0) {
    return (
      hours +
      "時間"
    );
  }


  return (
    minutes +
    "分"
  );
}


// ========================================
// プロジェクトと大分類を探す
// ========================================

function findProjectInformation(
  projectId
) {
  for (
    const category of
    appData.categories
  ) {
    const project =
      category.projects.find(
        function(item) {
          return (
            item.id ===
            projectId
          );
        }
      );


    if (project) {
      return {
        category:
          category,

        project:
          project
      };
    }
  }


  return null;
}


// ========================================
// プロジェクトの予定秒数
// ========================================

function getProjectPlannedSeconds(
  projectId
) {
  const projectInformation =
    findProjectInformation(
      projectId
    );


  if (!projectInformation) {
    return 0;
  }


  const selectedPeriodHours =
    getSelectedPeriodHours();


  const categoryHours =
    selectedPeriodHours *
    Number(
      projectInformation
        .category
        .allocationPercent
    ) /
    100;


  const projectHours =
    categoryHours *
    Number(
      projectInformation
        .project
        .allocationPercent
    ) /
    100;


  return Math.round(
    projectHours * 3600
  );
}


// ========================================
// 選択期間内のプロジェクト実績
// ========================================

function getProjectActualSeconds(
  projectId
) {
  let totalSeconds =
    appData.sessions
      .filter(
        function(session) {
          return (
            session.projectId ===
              projectId &&
            isDateInSelectedPeriod(
              session.startedAt
            )
          );
        }
      )
      .reduce(
        function(
          total,
          session
        ) {
          return (
            total +
            Number(
              session.elapsedSeconds
            )
          );
        },

        0
      );


  if (
    appData.activeSession &&
    appData.activeSession.projectId ===
      projectId &&
    isDateInSelectedPeriod(
      appData.activeSession.startedAt
    )
  ) {
    totalSeconds +=
      getActiveElapsedSeconds();
  }


  return totalSeconds;
}


// ========================================
// 選択期間内の日付か確認する
// ========================================

function isDateInSelectedPeriod(
  timestamp
) {
  const targetDate =
    new Date(
      timestamp
    );


  const now =
    new Date();


  const selectedPeriod =
    appData.settings.selectedPeriod;


  if (selectedPeriod === "day") {
    return (
      targetDate.getFullYear() ===
        now.getFullYear() &&
      targetDate.getMonth() ===
        now.getMonth() &&
      targetDate.getDate() ===
        now.getDate()
    );
  }


  if (selectedPeriod === "week") {
    const weekStart =
      getWeekStart(
        now
      );


    const nextWeekStart =
      new Date(
        weekStart
      );


    nextWeekStart.setDate(
      weekStart.getDate() + 7
    );


    return (
      targetDate >=
        weekStart &&
      targetDate <
        nextWeekStart
    );
  }


  return (
    targetDate.getFullYear() ===
      now.getFullYear() &&
    targetDate.getMonth() ===
      now.getMonth()
  );
}


// ========================================
// 月曜日の日付を取得する
// ========================================

function getWeekStart(
  date
) {
  const weekStart =
    new Date(
      date
    );


  weekStart.setHours(
    0,
    0,
    0,
    0
  );


  const dayNumber =
    weekStart.getDay();


  const daysFromMonday =
    (
      dayNumber + 6
    ) %
    7;


  weekStart.setDate(
    weekStart.getDate() -
    daysFromMonday
  );


  return weekStart;
}


// ========================================
// 残り時間または超過時間
// ========================================

function updateRemainingTime(
  projectId
) {
  const plannedSeconds =
    getProjectPlannedSeconds(
      projectId
    );


  const actualSeconds =
    getProjectActualSeconds(
      projectId
    );


  const difference =
    plannedSeconds -
    actualSeconds;


  if (difference >= 0) {
    remainingTime.textContent =
      "残り時間：" +
      formatSecondsAsText(
        difference
      );


    remainingTime.classList.remove(
      "is-over"
    );

    return;
  }


  remainingTime.textContent =
    "予定時間を " +
    formatSecondsAsText(
      Math.abs(
        difference
      )
    ) +
    " 超過";


  remainingTime.classList.add(
    "is-over"
  );
}



// ========================================
// 作業内容を追加する
// ========================================

workNoteForm.addEventListener(
  "submit",

  function(event) {
    event.preventDefault();


    if (!appData.activeSession) {
      showStatusMessage(
        "タイマーを開始してください。"
      );

      return;
    }


    const noteText =
      workNoteInput.value.trim();


    if (!noteText) {
      showStatusMessage(
        "作業内容を入力してください。"
      );

      return;
    }


    if (
      !Array.isArray(
        appData.activeSession.notes
      )
    ) {
      appData.activeSession.notes =
        [];
    }


        const segmentEndedAt =
      Date.now();


    const segmentStartedAt =
      Number(
        appData.activeSession
          .segmentStartedAt
      ) ||
      Number(
        appData.activeSession
          .startedAt
      );


    appData.activeSession.notes.push(
      {
        id:
          createId(
            "note"
          ),

        text:
          noteText,

        startedAt:
          segmentStartedAt,

        endedAt:
          segmentEndedAt,

        createdAt:
          segmentEndedAt
      }
    );


    appData.activeSession.segmentStartedAt =
      segmentEndedAt;


    saveAppData();


    workNoteInput.value =
      "";


    renderCurrentNotes();


    workNoteInput.focus();


    showStatusMessage(
      "作業内容を追加しました。"
    );
  }
);


// ========================================
// 作業内容入力欄の有効・無効
// ========================================

function updateNoteInputState() {
  const isWorking =
    Boolean(
      appData.activeSession
    );


  workNoteInput.disabled =
    !isWorking;


  addNoteButton.disabled =
    !isWorking;


  if (isWorking) {
    workNoteInput.placeholder =
      "現在の作業内容を入力";
  } else {
    workNoteInput.placeholder =
      "タイマーを開始すると入力できます";
  }
}


// ========================================
// 現在の作業内容を表示する
// ========================================

function renderCurrentNotes() {
  if (!appData.activeSession) {
    currentNoteList.innerHTML = `
      <li class="empty-message">
        タイマーを開始すると、作業内容を記録できます。
      </li>
    `;

    return;
  }


  const notes =
    Array.isArray(
      appData.activeSession.notes
    )
      ? appData.activeSession.notes
      : [];


  if (notes.length === 0) {
    currentNoteList.innerHTML = `
      <li class="empty-message">
        まだ作業内容は記録されていません。
      </li>
    `;

    return;
  }


  currentNoteList.innerHTML =
    notes
      .map(
        function(note) {
          return `
            <li class="note-item">
              <time
                class="note-time"
                datetime="${new Date(
                  note.createdAt
                ).toISOString()}"
              >
                                ${formatWorkTimeRange(
                  note
                )}
              </time>

              <span class="note-text">
                ${escapeHtml(note.text)}
              </span>
            </li>
          `;
        }
      )
      .join("");
}


// ========================================
// 作業内容の追加時刻
// ========================================

function formatNoteTime(
  timestamp
) {
  return new Intl.DateTimeFormat(
    "ja-JP",

    {
      hour:
        "2-digit",

      minute:
        "2-digit"
    }
  ).format(
    new Date(
      timestamp
    )
  );
}



// ========================================
// 大分類の実績時間
// ========================================

function getCategoryActualSeconds(
  categoryId
) {
  let totalSeconds =
    appData.sessions
      .filter(
        function(session) {
          return (
            session.categoryId ===
              categoryId &&
            isDateInSelectedPeriod(
              session.startedAt
            )
          );
        }
      )
      .reduce(
        function(
          total,
          session
        ) {
          return (
            total +
            Number(
              session.elapsedSeconds
            )
          );
        },

        0
      );


  if (
    appData.activeSession &&
    appData.activeSession.categoryId ===
      categoryId &&
    isDateInSelectedPeriod(
      appData.activeSession.startedAt
    )
  ) {
    totalSeconds +=
      getActiveElapsedSeconds();
  }


  return totalSeconds;
}


// ========================================
// 進捗率
// ========================================

function calculateProgressPercent(
  actualSeconds,
  plannedSeconds
) {
  if (plannedSeconds <= 0) {
    return (
      actualSeconds > 0
        ? 100
        : 0
    );
  }


  const progressPercent =
    actualSeconds /
    plannedSeconds *
    100;


  return Math.min(
    100,

    Math.max(
      0,
      progressPercent
    )
  );
}


// ========================================
// 残り時間または超過時間の文言
// ========================================

function createProgressStatus(
  actualSeconds,
  plannedSeconds
) {
  if (
    plannedSeconds <= 0 &&
    actualSeconds <= 0
  ) {
    return {
      message:
        "予定時間なし",

      isOver:
        false
    };
  }


  if (
    plannedSeconds <= 0 &&
    actualSeconds > 0
  ) {
    return {
      message:
        "予定時間を設定せずに " +
        formatSecondsAsText(
          actualSeconds
        ) +
        " 作業",

      isOver:
        true
    };
  }


  const difference =
    plannedSeconds -
    actualSeconds;


  if (difference >= 0) {
    return {
      message:
        "残り " +
        formatSecondsAsText(
          difference
        ),

      isOver:
        false
    };
  }


  return {
    message:
      "予定より " +
      formatSecondsAsText(
        Math.abs(
          difference
        )
      ) +
      " 超過",

    isOver:
      true
  };
}



// ========================================
// 作業・設定・記録編集タブ
// ========================================

screenTabButtons.forEach(
  function(screenTabButton) {
    screenTabButton.addEventListener(
      "click",

      function() {
        const selectedScreen =
          screenTabButton.dataset.screen;

        const allowedScreens = [
          "work",
          "settings",
          "records"
        ];

        if (
          !allowedScreens.includes(
            selectedScreen
          )
        ) {
          return;
        }

        appData.settings.selectedScreen =
          selectedScreen;

        saveDisplaySettingsLocally();

        updateScreenTabs();
      }
    );
  }
);


// ========================================
// 選択中のタブを画面へ反映する
// ========================================

function updateScreenTabs() {
  const allowedScreens = [
    "work",
    "settings",
    "records"
  ];

  const requestedScreen =
    appData.settings.selectedScreen;

  const selectedScreen =
    allowedScreens.includes(
      requestedScreen
    )
      ? requestedScreen
      : "work";


  screenTabButtons.forEach(
    function(screenTabButton) {
      const isSelected =
        screenTabButton.dataset.screen ===
        selectedScreen;

      screenTabButton.classList.toggle(
        "is-active",
        isSelected
      );

      screenTabButton.setAttribute(
        "aria-selected",
        String(
          isSelected
        )
      );
    }
  );


  workPanel.hidden =
    selectedScreen !==
    "work";

  settingsPanel.hidden =
    selectedScreen !==
    "settings";

  recordsPanel.hidden =
    selectedScreen !==
    "records";
}



// ========================================
// 表示用の進捗率
// ========================================

function calculateProgressRate(
  actualSeconds,
  plannedSeconds
) {
  if (plannedSeconds <= 0) {
    if (actualSeconds > 0) {
      return "計算不可";
    }


    return "0%";
  }


  const progressRate =
    actualSeconds /
    plannedSeconds *
    100;


  const roundedRate =
    Math.round(
      progressRate * 10
    ) /
    10;


  return (
    roundedRate +
    "%"
  );
}



// ========================================
// 作業内容の開始・終了時刻
// ========================================

function formatWorkTimeRange(
  note
) {
  const startedAt =
    Number(
      note.startedAt
    );


  const endedAt =
    Number(
      note.endedAt ||
      note.createdAt
    );


  if (!startedAt) {
    return formatNoteTime(
      endedAt
    );
  }


  return (
    formatNoteTime(
      startedAt
    ) +
    "〜" +
    formatNoteTime(
      endedAt
    )
  );
}