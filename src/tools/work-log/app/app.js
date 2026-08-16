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


const projectStatusList =
  document.getElementById(
    "project-status-list"
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


const recordPreviousPeriodButton =
  document.getElementById(
    "record-previous-period-button"
  );


const recordNextPeriodButton =
  document.getElementById(
    "record-next-period-button"
  );


const recordDateInput =
  document.getElementById(
    "record-date"
  );


const recordMonthInput =
  document.getElementById(
    "record-month"
  );


const recordDateLabel =
  document.getElementById(
    "record-date-label"
  );


const recordMonthLabel =
  document.getElementById(
    "record-month-label"
  );


const recordWeekRange =
  document.getElementById(
    "record-week-range"
  );


const recordWeekRangeText =
  document.getElementById(
    "record-week-range-text"
  );


const recordPeriodTitle =
  document.getElementById(
    "record-period-title"
  );


const recordDateRange =
  document.getElementById(
    "record-date-range"
  );


const recordTotalTime =
  document.getElementById(
    "record-total-time"
  );


const recordCategorySummaryList =
  document.getElementById(
    "record-category-summary-list"
  );


const recordProjectList =
  document.getElementById(
    "record-project-list"
  );


const addRecordButton =
  document.getElementById(
    "add-record-button"
  );


const recordDialog =
  document.getElementById(
    "record-dialog"
  );


const recordForm =
  document.getElementById(
    "record-form"
  );


const recordDialogTitle =
  document.getElementById(
    "record-dialog-title"
  );


const recordDialogCloseButton =
  document.getElementById(
    "record-dialog-close-button"
  );


const recordCancelButton =
  document.getElementById(
    "record-cancel-button"
  );


const recordSessionIdInput =
  document.getElementById(
    "record-session-id"
  );


const recordNoteIndexInput =
  document.getElementById(
    "record-note-index"
  );


const recordEditDateInput =
  document.getElementById(
    "record-edit-date"
  );


const recordEditProjectSelect =
  document.getElementById(
    "record-edit-project"
  );


const recordEditStartTimeInput =
  document.getElementById(
    "record-edit-start-time"
  );


const recordEditEndTimeInput =
  document.getElementById(
    "record-edit-end-time"
  );


const recordEditContentInput =
  document.getElementById(
    "record-edit-content"
  );


const recordFormError =
  document.getElementById(
    "record-form-error"
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

let selectedRecordDate =
  new Date();


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

initializeRecordNavigation();

initializeRecordForm();

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
  const categories =
    Array.isArray(
      data.categories
    )
      ? data.categories.map(
          function(category) {
            return {
              ...category,

              projects:
                Array.isArray(
                  category.projects
                )
                  ? category.projects.map(
                      function(project) {
                        return {
                          ...project,

                          isCurrent:
                            project.isCurrent !== false
                        };
                      }
                    )
                  : []
            };
          }
        )
      : [];


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
      categories,

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

updateRecordDateInputDisplay();

renderRecordSummary();
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

  renderProjectStatusList();

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
            getCurrentProjects(
              category
            );


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
// プロジェクト一覧を表示する
// ========================================

function renderProjectStatusList() {
  const items = [];


  appData.categories.forEach(
    function(category) {
      const projects =
        Array.isArray(
          category.projects
        )
          ? category.projects
          : [];


      projects.forEach(
        function(project) {
          const isCurrent =
            project.isCurrent !== false;


          items.push(`
            <label class="project-status-item">
              <span class="project-status-name">
                <span class="project-status-category">
                  ${escapeHtml(category.name)}
                </span>

                <strong>
                  ${escapeHtml(project.name)}
                </strong>
              </span>

              <span class="project-status-check">
                <input
                  type="checkbox"
                  data-action="project-current"
                  data-category-id="${category.id}"
                  data-project-id="${project.id}"
                  ${isCurrent ? "checked" : ""}
                >

                現在のプロジェクト
              </span>
            </label>
          `);
        }
      );
    }
  );


  if (items.length === 0) {
    projectStatusList.innerHTML = `
      <p class="empty-message">
        プロジェクトが設定されていません。
      </p>
    `;

    return;
  }


  projectStatusList.innerHTML =
    items.join("");
}


// ========================================
// 現在のプロジェクトを切り替える
// ========================================

projectStatusList.addEventListener(
  "change",

  function(event) {
    const checkbox =
      event.target;


    if (
      !(
        checkbox instanceof
        HTMLInputElement
      ) ||
      checkbox.dataset.action !==
        "project-current"
    ) {
      return;
    }


    const category =
      findCategory(
        checkbox.dataset.categoryId
      );


    if (!category) {
      return;
    }


    const project =
      findProject(
        category,
        checkbox.dataset.projectId
      );


    if (!project) {
      return;
    }


    project.isCurrent =
      checkbox.checked;


    if (!checkbox.checked) {
      project.allocationPercent =
        0;
    }


    saveAppData();

    updateWorkTimeDisplay();


    showStatusMessage(
      checkbox.checked
        ? "現在のプロジェクトに戻しました。"
        : "プロジェクトをアーカイブへ移動しました。"
    );
  }
);


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
          0,

        isCurrent:
          true
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
      const category =
        findCategory(
          categoryId
        );


      if (!category) {
        return;
      }


      const projectIds =
        new Set(
          category.projects.map(
            function(project) {
              return project.id;
            }
          )
        );


      const hasSavedRecords =
        appData.sessions.some(
          function(session) {
            return projectIds.has(
              session.projectId
            );
          }
        );


      const hasActiveRecord =
        Boolean(
          appData.activeSession &&
          projectIds.has(
            appData.activeSession.projectId
          )
        );


      if (
        hasSavedRecords ||
        hasActiveRecord
      ) {
        window.alert(
          "作業記録があるため、この大分類は削除できません。配下のプロジェクトをアーカイブへ移してください。"
        );

        return;
      }


      const shouldDelete =
        window.confirm(
          "この大分類と、その中のプロジェクトを削除しますか？"
        );


      if (!shouldDelete) {
        return;
      }


      appData.categories =
        appData.categories.filter(
          function(item) {
            return (
              item.id !==
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


      const hasSavedRecords =
        appData.sessions.some(
          function(session) {
            return (
              session.projectId ===
              projectId
            );
          }
        );


      const hasActiveRecord =
        Boolean(
          appData.activeSession &&
          appData.activeSession.projectId ===
            projectId
        );


      if (
        hasSavedRecords ||
        hasActiveRecord
      ) {
        window.alert(
          "作業記録があるため、このプロジェクトは削除できません。「現在のプロジェクト」のチェックを外して、アーカイブへ移してください。"
        );

        return;
      }


      const shouldDelete =
        window.confirm(
          "このプロジェクトを削除しますか？作業記録はありません。"
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
// 現在のプロジェクトを取得する
// ========================================

function getCurrentProjects(
  category
) {
  if (
    !category ||
    !Array.isArray(
      category.projects
    )
  ) {
    return [];
  }


  return category.projects.filter(
    function(project) {
      return (
        project.isCurrent !==
        false
      );
    }
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
            getCurrentProjects(
              category
            )
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


  const currentCategories =
    appData.categories.filter(
      function(category) {
        return (
          getCurrentProjects(
            category
          ).length > 0
        );
      }
    );


  if (
    currentCategories.length === 0
  ) {
    progressList.innerHTML = `
            <p class="empty-message">
        現在のプロジェクトが設定されていません。
      </p>
    `;

    return;
  }


    progressList.innerHTML =
    currentCategories
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
            getCurrentProjects(
              category
            )
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
  <details class="progress-item">
    <summary class="progress-category-summary">
      <div class="progress-category-overview">
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
      </div>
    </summary>

    <div class="project-progress-list">
      ${projectProgressHtml}
    </div>
  </details>
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
  const category =
    findCategory(
      categoryId
    );


  if (!category) {
    return 0;
  }


  const currentProjectIds =
    new Set(
      getCurrentProjects(
        category
      ).map(
        function(project) {
          return project.id;
        }
      )
    );


  let totalSeconds =
    appData.sessions
      .filter(
        function(session) {
          return (
            currentProjectIds.has(
              session.projectId
            ) &&
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
    currentProjectIds.has(
      appData.activeSession.projectId
    ) &&
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
// 記録編集の期間操作
// ========================================

function initializeRecordNavigation() {
  setRecordDateInputValues();

  updateRecordDateInputDisplay();


  recordPreviousPeriodButton.addEventListener(
    "click",

    function() {
      moveRecordPeriod(
        -1
      );
    }
  );


  recordNextPeriodButton.addEventListener(
    "click",

    function() {
      moveRecordPeriod(
        1
      );
    }
  );


  recordDateInput.addEventListener(
    "change",

    function() {
      if (!recordDateInput.value) {
        return;
      }

      selectedRecordDate =
        new Date(
          recordDateInput.value +
          "T00:00:00"
        );

      setRecordDateInputValues();
    }
  );


  recordMonthInput.addEventListener(
    "change",

    function() {
      if (!recordMonthInput.value) {
        return;
      }

      selectedRecordDate =
        new Date(
          recordMonthInput.value +
          "-01T00:00:00"
        );

      setRecordDateInputValues();
    }
  );
}


function updateRecordDateInputDisplay() {
  const selectedPeriod =
    appData.settings.selectedPeriod;

  const isDay =
    selectedPeriod ===
    "day";

  const isWeek =
    selectedPeriod ===
    "week";

  const isMonth =
    selectedPeriod ===
    "month";

  recordDateLabel.hidden =
    !isDay;

  recordWeekRange.hidden =
    !isWeek;

  recordMonthLabel.hidden =
    !isMonth;

  updateRecordWeekRange();
}


function moveRecordPeriod(
  direction
) {
  const movedDate =
    new Date(
      selectedRecordDate
    );

  const selectedPeriod =
    appData.settings.selectedPeriod;

  if (selectedPeriod === "month") {
    movedDate.setMonth(
      movedDate.getMonth() +
      direction
    );
  } else if (selectedPeriod === "week") {
    movedDate.setDate(
      movedDate.getDate() +
      direction * 7
    );
  } else {
    movedDate.setDate(
      movedDate.getDate() +
      direction
    );
  }

  selectedRecordDate =
    movedDate;

  setRecordDateInputValues();
}


function updateRecordWeekRange() {
  const weekStart =
    getRecordWeekStart(
      selectedRecordDate
    );

  const weekEnd =
    new Date(
      weekStart
    );

  weekEnd.setDate(
    weekEnd.getDate() + 6
  );

  recordWeekRangeText.textContent =
    formatRecordDisplayDate(
      weekStart
    ) +
    "〜" +
    formatRecordDisplayDate(
      weekEnd
    );
}


function getRecordWeekStart(
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

  const distanceFromMonday =
    dayNumber === 0
      ? 6
      : dayNumber - 1;

  weekStart.setDate(
    weekStart.getDate() -
    distanceFromMonday
  );

  return weekStart;
}


function formatRecordDisplayDate(
  date
) {
  return new Intl.DateTimeFormat(
    "ja-JP",

    {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short"
    }
  ).format(
    date
  );
}

function setRecordDateInputValues() {
  recordDateInput.value =
    formatRecordDateForInput(
      selectedRecordDate
    );

  recordMonthInput.value =
    formatRecordDateForInput(
      selectedRecordDate
    ).slice(
      0,
      7
    );

  updateRecordWeekRange();

  renderRecordSummary();
}

// ========================================
// 記録編集の集計
// ========================================

function renderRecordSummary() {
  const periodRange =
    getRecordPeriodRange();

  const sessions =
    appData.sessions.filter(
      function(session) {
        const startedAt =
          Number(
            session.startedAt
          );

        return (
          startedAt >=
            periodRange.start.getTime() &&
          startedAt <
            periodRange.end.getTime()
        );
      }
    );

  const totalSeconds =
    sessions.reduce(
      function(
        total,
        session
      ) {
        return (
          total +
          Number(
            session.elapsedSeconds || 0
          )
        );
      },

      0
    );

  recordPeriodTitle.textContent =
    createRecordPeriodTitle(
      periodRange
    );

  recordDateRange.textContent =
    createRecordDateRangeText(
      periodRange
    );

recordTotalTime.textContent =
  formatSecondsAsText(
    totalSeconds
  );

  renderRecordCategorySummary(
  sessions
);

renderRecordProjectReports(
  sessions
);
}

function renderRecordCategorySummary(
  sessions
) {
  if (
    appData.categories.length === 0
  ) {
    recordCategorySummaryList.innerHTML = `
      <p class="empty-message">
        大分類が設定されていません。
      </p>
    `;

    return;
  }

  const selectedPeriodHours =
    getSelectedPeriodHours();

  recordCategorySummaryList.innerHTML =
    appData.categories
      .map(
        function(category) {
          const plannedSeconds =
            Math.round(
              selectedPeriodHours *
              Number(
                category.allocationPercent || 0
              ) /
              100 *
              3600
            );

          const actualSeconds =
            sessions
              .filter(
                function(session) {
                  return (
                    session.categoryId ===
                    category.id
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
                      session.elapsedSeconds || 0
                    )
                  );
                },

                0
              );

          const progressPercent =
            calculateProgressPercent(
              actualSeconds,
              plannedSeconds
            );

          const progressRate =
            calculateProgressRate(
              actualSeconds,
              plannedSeconds
            );

          const progressStatus =
            createProgressStatus(
              actualSeconds,
              plannedSeconds
            );

          return `
            <article class="progress-item">
              <div class="progress-heading">
                <span class="progress-name">
                  ${escapeHtml(category.name)}

                  <strong class="progress-percentage">
                    ${progressRate}
                  </strong>
                </span>

                <span class="progress-time">
                  実績
                  ${formatSecondsAsText(actualSeconds)}
                  ／
                  予定
                  ${formatSecondsAsText(plannedSeconds)}
                </span>
              </div>

              <div class="progress-bar">
                <span
                  class="progress-bar__value"
                  style="width: ${progressPercent}%"
                ></span>
              </div>

              <p
                class="progress-remaining${progressStatus.isOver ? " is-over" : ""}"
              >
                ${progressStatus.message}
              </p>
            </article>
          `;
        }
      )
      .join("");
}

// ========================================
// 記録編集のプロジェクト別記録
// ========================================

function renderRecordProjectReports(
  sessions
) {
  const selectedPeriodHours =
    getSelectedPeriodHours();

  const reportItems = [];

  appData.categories.forEach(
    function(category) {
      const projects =
        Array.isArray(
          category.projects
        )
          ? category.projects
          : [];

      projects.forEach(
        function(project) {
          const projectSessions =
            sessions.filter(
              function(session) {
                return (
                  session.projectId ===
                  project.id
                );
              }
            );

          const totalSeconds =
            projectSessions.reduce(
              function(
                total,
                session
              ) {
                return (
                  total +
                  Number(
                    session.elapsedSeconds || 0
                  )
                );
              },

              0
            );

          const plannedSeconds =
            Math.round(
              selectedPeriodHours *
              Number(
                category.allocationPercent || 0
              ) /
              100 *
              Number(
                project.allocationPercent || 0
              ) /
              100 *
              3600
            );

          const progressRate =
            calculateProgressRate(
              totalSeconds,
              plannedSeconds
            );

          const workDays =
            groupRecordSessionsByDay(
              projectSessions
            );

          reportItems.push(`
            <details class="project-report-item">
              <summary>
                <span class="project-summary-main">
                  <span class="project-category-name">
                    ${escapeHtml(category.name)}
                  </span>

                  <span class="project-name">
                    ${escapeHtml(project.name)}

                    <strong class="progress-percentage">
                      ${progressRate}
                    </strong>
                  </span>
                </span>

                <span class="project-total-information">
                  <span class="project-total-time">
                    ${formatSecondsAsText(totalSeconds)}
                  </span>

                  <span class="project-work-days">
                    作業日数：
                    ${workDays.length}日
                  </span>
                </span>
              </summary>

              <div class="project-detail">
                ${createRecordWorkDayHtml(workDays)}
              </div>
            </details>
          `);
        }
      );
    }
  );

  if (reportItems.length === 0) {
    recordProjectList.innerHTML = `
      <p class="empty-message">
        プロジェクトが設定されていません。
      </p>
    `;

    return;
  }

  recordProjectList.innerHTML =
    reportItems.join("");
}


function groupRecordSessionsByDay(
  sessions
) {
  const workDayMap =
    new Map();

  sessions.forEach(
    function(session) {
      const sessionDate =
        new Date(
          Number(
            session.startedAt
          )
        );

      const dateKey =
        formatRecordDateForInput(
          sessionDate
        );

      if (!workDayMap.has(dateKey)) {
        const date =
          new Date(
            sessionDate
          );

        date.setHours(
          0,
          0,
          0,
          0
        );

        workDayMap.set(
          dateKey,

          {
            date:
              date,

            totalSeconds:
              0,

            records:
              []
          }
        );
      }

      const workDay =
        workDayMap.get(
          dateKey
        );

      workDay.totalSeconds +=
        Number(
          session.elapsedSeconds || 0
        );

      const notes =
        Array.isArray(
          session.notes
        )
          ? session.notes
          : [];

      if (notes.length === 0) {
        workDay.records.push(
          {
            sessionId:
              session.id,

            noteIndex:
              null,

            text:
              "作業内容の記録なし",

            startedAt:
              Number(
                session.startedAt
              ),

            endedAt:
              Number(
                session.endedAt
              ) ||
              Number(
                session.startedAt
              )
          }
        );
      } else {
        notes.forEach(
          function(
            note,
            noteIndex
          ) {
            workDay.records.push(
              {
                sessionId:
                  session.id,

                noteIndex:
                  noteIndex,

                text:
                  note.text ||
                  "作業内容の記録なし",

                startedAt:
                  Number(
                    note.startedAt
                  ) ||
                  Number(
                    session.startedAt
                  ),

                endedAt:
                  Number(
                    note.endedAt
                  ) ||
                  Number(
                    note.createdAt
                  ) ||
                  Number(
                    session.endedAt
                  ) ||
                  Number(
                    session.startedAt
                  )
              }
            );
          }
        );
      }
    }
  );

  return Array.from(
    workDayMap.values()
  ).sort(
    function(a, b) {
      return (
        b.date -
        a.date
      );
    }
  );
}


function createRecordWorkDayHtml(
  workDays
) {
  if (workDays.length === 0) {
    return `
      <p class="empty-message">
        この期間の作業記録はありません。
      </p>
    `;
  }

  return workDays
    .map(
      function(workDay) {
        const recordHtml =
          workDay.records
            .sort(
              function(a, b) {
                return (
                  a.startedAt -
                  b.startedAt
                );
              }
            )
            .map(
              function(record) {
                return `
                  <li>
                    <time
                      class="work-time-range"
                      datetime="${new Date(
                        record.startedAt
                      ).toISOString()}"
                    >
                      ${formatWorkTimeRange(record)}
                    </time>

                    <span class="work-content-text">
  ${escapeHtml(record.text)}
</span>

<span class="record-item-actions">
  <button
    class="record-edit-button secondary-button"
    type="button"
    data-session-id="${escapeHtml(
      String(
        record.sessionId
      )
    )}"
    data-note-index="${
      record.noteIndex === null
        ? ""
        : record.noteIndex
    }"
  >
    編集
  </button>

  <button
    class="record-delete-button danger-button"
    type="button"
    data-session-id="${escapeHtml(
      String(
        record.sessionId
      )
    )}"
    data-note-index="${
      record.noteIndex === null
        ? ""
        : record.noteIndex
    }"
  >
    削除
  </button>
</span>
                  </li>
                `;
              }
            )
            .join("");

        return `
          <article class="work-day-item">
            <time
              class="work-day-date"
              datetime="${formatRecordDateForInput(
                workDay.date
              )}"
            >
              ${formatRecordDisplayDate(
                workDay.date
              )}
            </time>

            <ul class="work-content-list">
              ${recordHtml}
            </ul>

            <span class="work-day-total">
              合計
              ${formatSecondsAsText(
                workDay.totalSeconds
              )}
            </span>
          </article>
        `;
      }
    )
    .join("");
}

function getRecordPeriodRange() {
  const selectedPeriod =
    appData.settings.selectedPeriod;

  let start;
  let end;

  if (selectedPeriod === "month") {
    start =
      new Date(
        selectedRecordDate.getFullYear(),
        selectedRecordDate.getMonth(),
        1
      );

    end =
      new Date(
        selectedRecordDate.getFullYear(),
        selectedRecordDate.getMonth() + 1,
        1
      );
  } else if (selectedPeriod === "week") {
    start =
      getRecordWeekStart(
        selectedRecordDate
      );

    end =
      new Date(
        start
      );

    end.setDate(
      end.getDate() + 7
    );
  } else {
    start =
      new Date(
        selectedRecordDate
      );

    start.setHours(
      0,
      0,
      0,
      0
    );

    end =
      new Date(
        start
      );

    end.setDate(
      end.getDate() + 1
    );
  }

  return {
    start:
      start,

    end:
      end
  };
}


function createRecordPeriodTitle(
  periodRange
) {
  const selectedPeriod =
    appData.settings.selectedPeriod;

  if (selectedPeriod === "month") {
    return (
      selectedRecordDate.getFullYear() +
      "年" +
      (
        selectedRecordDate.getMonth() + 1
      ) +
      "月の集計"
    );
  }

  if (selectedPeriod === "week") {
    const weekEnd =
      new Date(
        periodRange.end
      );

    weekEnd.setDate(
      weekEnd.getDate() - 1
    );

    return (
      formatRecordDisplayDate(
        periodRange.start
      ) +
      "〜" +
      formatRecordDisplayDate(
        weekEnd
      ) +
      "の集計"
    );
  }

  return (
    formatRecordDisplayDate(
      periodRange.start
    ) +
    "の集計"
  );
}


function createRecordDateRangeText(
  periodRange
) {
  const rangeEnd =
    new Date(
      periodRange.end
    );

  rangeEnd.setMilliseconds(
    rangeEnd.getMilliseconds() - 1
  );

  return (
    formatRecordDisplayDate(
      periodRange.start
    ) +
    "〜" +
    formatRecordDisplayDate(
      rangeEnd
    )
  );
}

function formatRecordDateForInput(
  date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return (
    year +
    "-" +
    month +
    "-" +
    day
  );
}

// ========================================
// 作業記録の追加・編集フォーム
// ========================================

function initializeRecordForm() {
  renderRecordProjectOptions();


  addRecordButton.addEventListener(
    "click",

    function() {
      openAddRecordDialog();
    }
  );


  recordProjectList.addEventListener(
  "click",

  function(event) {
    const editButton =
      event.target.closest(
        ".record-edit-button"
      );

    if (editButton) {
      openEditRecordDialog(
        editButton.dataset.sessionId,
        editButton.dataset.noteIndex
      );

      return;
    }

    const deleteButton =
      event.target.closest(
        ".record-delete-button"
      );

    if (deleteButton) {
      deleteRecord(
        deleteButton.dataset.sessionId,
        deleteButton.dataset.noteIndex
      );
    }
  }
);


  recordDialogCloseButton.addEventListener(
    "click",

    closeRecordDialog
  );


  recordCancelButton.addEventListener(
    "click",

    closeRecordDialog
  );


  recordForm.addEventListener(
  "submit",

  function(event) {
    event.preventDefault();

    saveRecordForm();
  }
);
}


function renderRecordProjectOptions(
  includedProjectId = ""
) {
  const optionHtml = [];


  appData.categories.forEach(
    function(category) {
      const projects =
        Array.isArray(
          category.projects
        )
          ? category.projects
          : [];


      projects
        .filter(
          function(project) {
            return (
              project.isCurrent !==
                false ||
              String(project.id) ===
                String(includedProjectId)
            );
          }
        )
        .forEach(
          function(project) {
            const archiveLabel =
              project.isCurrent === false
                ? "（アーカイブ）"
                : "";


            optionHtml.push(`
              <option value="${escapeHtml(project.id)}">
                ${escapeHtml(category.name)}
                ＞
                ${escapeHtml(project.name)}
                ${archiveLabel}
              </option>
            `);
          }
        );
    }
  );


  recordEditProjectSelect.innerHTML = `
    <option value="">
      プロジェクトを選択
    </option>

    ${optionHtml.join("")}
  `;
}


function openAddRecordDialog() {
  recordForm.reset();

  recordSessionIdInput.value =
    "";

  recordNoteIndexInput.value =
    "";

  recordDialogTitle.textContent =
    "作業を追加";

  recordFormError.textContent =
    "";

  recordEditDateInput.value =
    formatRecordDateForInput(
      selectedRecordDate
    );

  const startDate =
    new Date();

  startDate.setSeconds(
    0,
    0
  );

  const endDate =
    new Date(
      startDate
    );

  endDate.setMinutes(
    endDate.getMinutes() + 30
  );

  recordEditStartTimeInput.value =
    formatRecordTimeForInput(
      startDate
    );

  recordEditEndTimeInput.value =
    formatRecordTimeForInput(
      endDate
    );

  renderRecordProjectOptions();

  recordDialog.showModal();
}


function openEditRecordDialog(
  sessionId,
  noteIndexText
) {
  const session =
    appData.sessions.find(
      function(item) {
        return (
          String(item.id) ===
          String(sessionId)
        );
      }
    );

  if (!session) {
    showStatusMessage(
      "編集する作業記録が見つかりません。"
    );

    return;
  }

  const hasNoteIndex =
    noteIndexText !== "";

  const noteIndex =
    hasNoteIndex
      ? Number(noteIndexText)
      : null;

  const note =
    noteIndex !== null &&
    Array.isArray(session.notes)
      ? session.notes[noteIndex]
      : null;

  const startedAt =
    Number(
      note?.startedAt
    ) ||
    Number(
      session.startedAt
    );

  const endedAt =
    Number(
      note?.endedAt
    ) ||
    Number(
      note?.createdAt
    ) ||
    Number(
      session.endedAt
    ) ||
    startedAt;

  recordForm.reset();

  recordSessionIdInput.value =
    String(
      session.id
    );

  recordNoteIndexInput.value =
    noteIndex === null
      ? ""
      : String(
          noteIndex
        );

  recordDialogTitle.textContent =
    "作業を編集";

  recordFormError.textContent =
    "";

    recordEditDateInput.value =
    formatRecordDateForInput(
      new Date(
        startedAt
      )
    );

  renderRecordProjectOptions(
    session.projectId
  );

  recordEditProjectSelect.value =
    session.projectId;

  recordEditStartTimeInput.value =
    formatRecordTimeForInput(
      new Date(
        startedAt
      )
    );

  recordEditEndTimeInput.value =
    formatRecordTimeForInput(
      new Date(
        endedAt
      )
    );

  recordEditContentInput.value =
    note?.text || "";

  recordDialog.showModal();
}

function deleteRecord(
  sessionId,
  noteIndexText
) {
  const sessionIndex =
    appData.sessions.findIndex(
      function(session) {
        return (
          String(session.id) ===
          String(sessionId)
        );
      }
    );

  if (sessionIndex < 0) {
    showStatusMessage(
      "削除する作業記録が見つかりません。"
    );

    return;
  }

  const session =
    appData.sessions[
      sessionIndex
    ];

  const notes =
    Array.isArray(
      session.notes
    )
      ? session.notes
      : [];

  const hasNoteIndex =
    noteIndexText !== "";

  const noteIndex =
    hasNoteIndex
      ? Number(noteIndexText)
      : null;

  let workContent =
    "作業内容の記録なし";

  if (
    noteIndex !== null &&
    notes[noteIndex]
  ) {
    workContent =
      notes[noteIndex].text ||
      workContent;
  } else if (
    notes.length === 1
  ) {
    workContent =
      notes[0].text ||
      workContent;
  }

  const confirmed =
    window.confirm(
      "次の作業記録を削除します。\n\n" +
      workContent +
      "\n\nこの操作を続けますか？"
    );

  if (!confirmed) {
    return;
  }

  if (
    noteIndex !== null &&
    notes.length > 1 &&
    notes[noteIndex]
  ) {
    notes.splice(
      noteIndex,
      1
    );

    session.notes =
      notes;

    recalculateSessionFromNotes(
      session
    );
  } else {
    appData.sessions.splice(
      sessionIndex,
      1
    );
  }

  saveAppData();

  renderRecordSummary();

  renderProgressList();

  showStatusMessage(
    "作業記録を削除しました。"
  );
}

function saveRecordForm() {
  const projectId =
    recordEditProjectSelect.value;

  const projectInformation =
    findProjectInformation(
      projectId
    );

  const workDate =
    recordEditDateInput.value;

  const startTime =
    recordEditStartTimeInput.value;

  const endTime =
    recordEditEndTimeInput.value;

  const workContent =
    recordEditContentInput.value.trim();

  if (!projectInformation) {
    recordFormError.textContent =
      "プロジェクトを選択してください。";

    return;
  }

  if (
    !workDate ||
    !startTime ||
    !endTime
  ) {
    recordFormError.textContent =
      "作業日と時刻を入力してください。";

    return;
  }

  if (!workContent) {
    recordFormError.textContent =
      "作業内容を入力してください。";

    return;
  }

  const startedAt =
    new Date(
      workDate +
      "T" +
      startTime +
      ":00"
    ).getTime();

  const endedAt =
    new Date(
      workDate +
      "T" +
      endTime +
      ":00"
    ).getTime();

  if (
    !Number.isFinite(startedAt) ||
    !Number.isFinite(endedAt)
  ) {
    recordFormError.textContent =
      "日付または時刻が正しくありません。";

    return;
  }

  if (endedAt <= startedAt) {
    recordFormError.textContent =
      "終了時刻は開始時刻より後にしてください。";

    return;
  }

  const recordData = {
    categoryId:
      projectInformation.category.id,

    projectId:
      projectInformation.project.id,

    startedAt:
      startedAt,

    endedAt:
      endedAt,

    elapsedSeconds:
      Math.max(
        1,

        Math.floor(
          (
            endedAt -
            startedAt
          ) /
          1000
        )
      ),

    text:
      workContent
  };

  const sessionId =
    recordSessionIdInput.value;

  const noteIndexText =
    recordNoteIndexInput.value;

  if (sessionId) {
    updateExistingRecord(
      sessionId,
      noteIndexText,
      recordData
    );
  } else {
    appData.sessions.push(
      createRecordSession(
        recordData
      )
    );
  }

  selectedRecordDate =
    new Date(
      startedAt
    );

  saveAppData();

  setRecordDateInputValues();

  renderProgressList();

  closeRecordDialog();

  showStatusMessage(
    sessionId
      ? "作業記録を更新しました。"
      : "作業記録を追加しました。"
  );
}


function updateExistingRecord(
  sessionId,
  noteIndexText,
  recordData
) {
  const sessionIndex =
    appData.sessions.findIndex(
      function(session) {
        return (
          String(session.id) ===
          String(sessionId)
        );
      }
    );

  if (sessionIndex < 0) {
    recordFormError.textContent =
      "編集する作業記録が見つかりません。";

    return;
  }

  const session =
    appData.sessions[
      sessionIndex
    ];

  const notes =
    Array.isArray(
      session.notes
    )
      ? session.notes
      : [];

  const hasNoteIndex =
    noteIndexText !== "";

  const noteIndex =
    hasNoteIndex
      ? Number(noteIndexText)
      : null;

  if (
    noteIndex !== null &&
    notes.length > 1 &&
    notes[noteIndex]
  ) {
    notes.splice(
      noteIndex,
      1
    );

    session.notes =
      notes;

    recalculateSessionFromNotes(
      session
    );

    appData.sessions.push(
      createRecordSession(
        recordData
      )
    );

    return;
  }

  session.categoryId =
    recordData.categoryId;

  session.projectId =
    recordData.projectId;

  session.startedAt =
    recordData.startedAt;

  session.endedAt =
    recordData.endedAt;

  session.elapsedSeconds =
    recordData.elapsedSeconds;

  session.notes = [
    {
      text:
        recordData.text,

      startedAt:
        recordData.startedAt,

      endedAt:
        recordData.endedAt,

      createdAt:
        recordData.endedAt
    }
  ];
}


function createRecordSession(
  recordData
) {
  return {
    id:
      createId(
        "session"
      ),

    categoryId:
      recordData.categoryId,

    projectId:
      recordData.projectId,

    startedAt:
      recordData.startedAt,

    endedAt:
      recordData.endedAt,

    elapsedSeconds:
      recordData.elapsedSeconds,

    notes: [
      {
        text:
          recordData.text,

        startedAt:
          recordData.startedAt,

        endedAt:
          recordData.endedAt,

        createdAt:
          recordData.endedAt
      }
    ]
  };
}


function recalculateSessionFromNotes(
  session
) {
  const notes =
    Array.isArray(
      session.notes
    )
      ? session.notes
      : [];

  if (notes.length === 0) {
    return;
  }

  const startedTimes =
    notes.map(
      function(note) {
        return Number(
          note.startedAt
        );
      }
    );

  const endedTimes =
    notes.map(
      function(note) {
        return (
          Number(
            note.endedAt
          ) ||
          Number(
            note.createdAt
          ) ||
          Number(
            note.startedAt
          )
        );
      }
    );

  session.startedAt =
    Math.min(
      ...startedTimes
    );

  session.endedAt =
    Math.max(
      ...endedTimes
    );

  session.elapsedSeconds =
    notes.reduce(
      function(
        total,
        note
      ) {
        const noteStartedAt =
          Number(
            note.startedAt
          );

        const noteEndedAt =
          Number(
            note.endedAt
          ) ||
          Number(
            note.createdAt
          ) ||
          noteStartedAt;

        return (
          total +
          Math.max(
            1,

            Math.floor(
              (
                noteEndedAt -
                noteStartedAt
              ) /
              1000
            )
          )
        );
      },

      0
    );
}

function closeRecordDialog() {
  recordDialog.close();

  recordFormError.textContent =
    "";
}


function formatRecordTimeForInput(
  date
) {
  const hours =
    String(
      date.getHours()
    ).padStart(
      2,
      "0"
    );

  const minutes =
    String(
      date.getMinutes()
    ).padStart(
      2,
      "0"
    );

  return (
    hours +
    ":" +
    minutes
  );
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