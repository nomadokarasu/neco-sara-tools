"use strict";


// ========================================
// 基本設定
// ========================================

const STORAGE_KEY =
  "junota-work-log";


const defaultData = {
  settings: {
    weeklyHours: 30
  },

  categories: [],

  monthlyPlans: {},

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


const previousPeriodButton =
  document.getElementById(
    "previous-period-button"
  );


const nextPeriodButton =
  document.getElementById(
    "next-period-button"
  );


const reportDateInput =
  document.getElementById(
    "report-date"
  );


const reportMonthInput =
  document.getElementById(
    "report-month"
  );


const dateInputLabel =
  document.getElementById(
    "date-input-label"
  );


const monthInputLabel =
  document.getElementById(
    "month-input-label"
  );


const weekRangeDisplay =
  document.getElementById(
    "week-range-display"
  );


const weekRangeText =
  document.getElementById(
    "week-range-text"
  );


const activeWorkPanel =
  document.getElementById(
    "active-work-panel"
  );


const activeCategoryName =
  document.getElementById(
    "active-category-name"
  );


const activeProjectName =
  document.getElementById(
    "active-project-name"
  );


const activeTimer =
  document.getElementById(
    "active-timer"
  );


const reportPeriodTitle =
  document.getElementById(
    "report-period-title"
  );


const reportTotalTime =
  document.getElementById(
    "report-total-time"
  );


const plannedWorkTotal =
  document.getElementById(
    "planned-work-total"
  );


const unplannedWorkTotal =
  document.getElementById(
    "unplanned-work-total"
  );


const reportDateRange =
  document.getElementById(
    "report-date-range"
  );


const dailyWorkDetails =
  document.getElementById(
    "daily-work-details"
  );


const dailyWorkDate =
  document.getElementById(
    "daily-work-date"
  );


const dailyWorkTimeline =
  document.getElementById(
    "daily-work-timeline"
  );


const categorySummaryList =
  document.getElementById(
    "category-summary-list"
  );


const summaryAllWorkDays =
  document.getElementById(
    "summary-all-work-days"
  );


const summaryPlannedWorkDays =
  document.getElementById(
    "summary-planned-work-days"
  );


const summaryUnplannedWorkDays =
  document.getElementById(
    "summary-unplanned-work-days"
  );


const currentProjectList =
  document.getElementById(
    "current-project-list"
  );


const projectReportList =
  document.getElementById(
    "project-report-list"
  );


// ========================================
// 表示状態
// ========================================

let selectedPeriod =
  "week";


let selectedDate =
  new Date();


let appData =
  structuredClone(
    defaultData
  );


// ========================================
// 初期化
// ========================================

initializeReport();


async function initializeReport() {
  appData =
    await loadAppData();

  setDateInputValues();

  updatePeriodButtons();

  updateDateInputDisplay();

  renderReport();


  window.setInterval(
    function() {
      renderActiveWork();
    },

    1000
  );


  window.setInterval(
    async function() {
      appData =
        await loadAppData();


      const openDetailsState =
        captureOpenDetailsState();


      renderReport();


      restoreOpenDetailsState(
        openDetailsState
      );
    },

    15000
  );
}


// ========================================
// 折りたたみの展開状態を保存する
// ========================================

function captureOpenDetailsState() {
  const rootIds = [
    "summary-all-work-days",
    "summary-planned-work-days",
    "summary-unplanned-work-days",
    "category-summary-list",
    "current-project-list",
    "project-report-list"
  ];


  return rootIds
    .map(
      function(rootId) {
        const root =
          document.getElementById(
            rootId
          );


        if (!root) {
          return null;
        }


        const details =
          Array.from(
            root.querySelectorAll(
              "details"
            )
          );


        const openIndexes =
          [];


        details.forEach(
          function(detail, index) {
            if (detail.open) {
              openIndexes.push(
                index
              );
            }
          }
        );


        return {
          rootId:
            rootId,

          openIndexes:
            openIndexes
        };
      }
    )
    .filter(
      function(state) {
        return state !== null;
      }
    );
}


// ========================================
// 折りたたみの展開状態を復元する
// ========================================

function restoreOpenDetailsState(
  savedState
) {
  savedState.forEach(
    function(rootState) {
      const root =
        document.getElementById(
          rootState.rootId
        );


      if (!root) {
        return;
      }


      const details =
        Array.from(
          root.querySelectorAll(
            "details"
          )
        );


      rootState.openIndexes.forEach(
        function(index) {
          const detail =
            details[index];


          if (detail) {
            detail.open =
              true;
          }
        }
      );
    }
  );
}


// ========================================
// 保存データの読み込み
// ========================================

async function loadAppData() {
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

    return normalizeReportData(
      serverData
    );
  } catch (error) {
    console.error(
      "サーバーから作業記録を読み込めませんでした。",
      error
    );

    return loadLocalReportData();
  }
}


function loadLocalReportData() {
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
    return normalizeReportData(
      JSON.parse(
        savedData
      )
    );
  } catch (error) {
    console.error(
      "ブラウザ内の作業記録を読み込めませんでした。",
      error
    );

    return structuredClone(
      defaultData
    );
  }
}


function normalizeReportMonthlyPlans(
  monthlyPlans
) {
  if (
    !monthlyPlans ||
    typeof monthlyPlans !== "object" ||
    Array.isArray(
      monthlyPlans
    )
  ) {
    return {};
  }


  const normalizedPlans =
    {};


  Object.entries(
    monthlyPlans
  ).forEach(
    function(
      [
        monthKey,
        plan
      ]
    ) {
      if (
        !/^\d{4}-\d{2}$/.test(
          monthKey
        ) ||
        !plan ||
        typeof plan !== "object" ||
        Array.isArray(
          plan
        )
      ) {
        return;
      }


      const categories =
        Array.isArray(
          plan.categories
        )
          ? plan.categories
              .map(
                function(categoryPlan) {
                  if (
                    !categoryPlan ||
                    !categoryPlan.categoryId
                  ) {
                    return null;
                  }


                  const projects =
                    Array.isArray(
                      categoryPlan.projects
                    )
                      ? categoryPlan.projects
                          .map(
                            function(projectPlan) {
                              if (
                                !projectPlan ||
                                !projectPlan.projectId
                              ) {
                                return null;
                              }


                              return {
                                projectId:
                                  String(
                                    projectPlan.projectId
                                  ),

                                projectName:
                                  String(
                                    projectPlan.projectName ||
                                    ""
                                  ),

                                allocationPercent:
                                  Math.max(
                                    0,

                                    Number(
                                      projectPlan.allocationPercent
                                    ) ||
                                    0
                                  ),

                                plannedMinutes:
                                  Math.max(
                                    0,

                                    Math.round(
                                      Number(
                                        projectPlan.plannedMinutes
                                      ) ||
                                      0
                                    )
                                  )
                              };
                            }
                          )
                          .filter(
                            function(projectPlan) {
                              return (
                                projectPlan !==
                                null
                              );
                            }
                          )
                      : [];


                  return {
                    categoryId:
                      String(
                        categoryPlan.categoryId
                      ),

                    categoryName:
                      String(
                        categoryPlan.categoryName ||
                        ""
                      ),

                    allocationPercent:
                      Math.max(
                        0,

                        Number(
                          categoryPlan.allocationPercent
                        ) ||
                        0
                      ),

                    plannedMinutes:
                      Math.max(
                        0,

                        Math.round(
                          Number(
                            categoryPlan.plannedMinutes
                          ) ||
                          0
                        )
                      ),

                    projects:
                      projects
                  };
                }
              )
              .filter(
                function(categoryPlan) {
                  return (
                    categoryPlan !==
                    null
                  );
                }
              )
          : [];


      normalizedPlans[
        monthKey
      ] = {
        totalMinutes:
          Math.max(
            0,

            Math.round(
              Number(
                plan.totalMinutes
              ) ||
              0
            )
          ),

        categories:
          categories
      };
    }
  );


  return normalizedPlans;
}


function normalizeReportData(data) {
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

    monthlyPlans:
      normalizeReportMonthlyPlans(
        data.monthlyPlans
      ),

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


// ========================================
// 期間切り替え
// ========================================

periodButtons.forEach(
  function(periodButton) {
    periodButton.addEventListener(
      "click",

      function() {
        const period =
          periodButton.dataset.period;


        if (
          period !== "day" &&
          period !== "week" &&
          period !== "month"
        ) {
          return;
        }


        selectedPeriod =
          period;


        updatePeriodButtons();

        updateDateInputDisplay();

        renderReport();
      }
    );
  }
);


// ========================================
// 選択中の期間ボタン
// ========================================

function updatePeriodButtons() {
  periodButtons.forEach(
    function(periodButton) {
      periodButton.classList.toggle(
        "is-active",

        periodButton.dataset.period ===
          selectedPeriod
      );
    }
  );
}


// ========================================
// 日付入力の初期値
// ========================================

function setDateInputValues() {
  reportDateInput.value =
    formatDateForInput(
      selectedDate
    );


  reportMonthInput.value =
    formatMonthForInput(
      selectedDate
    );


  updateReportWeekRange();
}


function updateReportWeekRange() {
  const weekStart =
    getWeekStart(
      selectedDate
    );

  const weekEnd =
    new Date(
      weekStart
    );

  weekEnd.setDate(
    weekEnd.getDate() + 6
  );

  weekRangeText.textContent =
    formatReportMonthDay(
      weekStart
    ) +
    "～" +
    formatReportMonthDay(
      weekEnd
    );
}


function formatReportMonthDay(
  date
) {
  return (
    (
      date.getMonth() + 1
    ) +
    "月" +
    date.getDate() +
    "日"
  );
}


// ========================================
// 日付入力欄の切り替え
// ========================================

function updateDateInputDisplay() {
  const isDay =
    selectedPeriod ===
    "day";

  const isWeek =
    selectedPeriod ===
    "week";

  const isMonth =
    selectedPeriod ===
    "month";


  dateInputLabel.hidden =
    !isDay;

  weekRangeDisplay.hidden =
    !isWeek;

  monthInputLabel.hidden =
    !isMonth;


  if (isDay) {
    dateInputLabel.firstChild.textContent =
      "表示する日";
  }


  setDateInputValues();
}


// ========================================
// 日付を選択する
// ========================================

reportDateInput.addEventListener(
  "change",

  function() {
    if (!reportDateInput.value) {
      return;
    }


    selectedDate =
      createLocalDateFromInput(
        reportDateInput.value
      );


    renderReport();
  }
);


// ========================================
// 月を選択する
// ========================================

reportMonthInput.addEventListener(
  "change",

  function() {
    if (!reportMonthInput.value) {
      return;
    }


    const [
      year,
      month
    ] =
      reportMonthInput.value
        .split("-")
        .map(Number);


    selectedDate =
      new Date(
        year,
        month - 1,
        1
      );


    renderReport();
  }
);


// ========================================
// 前の期間
// ========================================

previousPeriodButton.addEventListener(
  "click",

  function() {
    moveSelectedPeriod(
      -1
    );
  }
);


// ========================================
// 次の期間
// ========================================

nextPeriodButton.addEventListener(
  "click",

  function() {
    moveSelectedPeriod(
      1
    );
  }
);


// ========================================
// 表示期間を前後へ移動する
// ========================================

function moveSelectedPeriod(
  direction
) {
  const movedDate =
    new Date(
      selectedDate
    );


  if (selectedPeriod === "day") {
    movedDate.setDate(
      movedDate.getDate() +
      direction
    );
  }


  if (selectedPeriod === "week") {
    movedDate.setDate(
      movedDate.getDate() +
      direction * 7
    );
  }


  if (selectedPeriod === "month") {
    movedDate.setMonth(
      movedDate.getMonth() +
      direction
    );
  }


  selectedDate =
    movedDate;


  setDateInputValues();

  renderReport();
}


// ========================================
// レポート全体を表示する
// ========================================

function renderReport() {
  const periodRange =
    getSelectedPeriodRange();


  const sessions =
    getSessionsInRange(
      periodRange
    );


  renderPeriodInformation(
    periodRange
  );


  renderDailyWorkTimeline(
    sessions
  );


  renderActiveWork();

  renderCurrentSummary(
    sessions,
    periodRange
  );


  renderCurrentProjectReports();


  renderArchiveReports();
}


// ========================================
// 選択期間の開始と終了
// ========================================

function getSelectedPeriodRange() {
  if (selectedPeriod === "day") {
    const start =
      startOfDay(
        selectedDate
      );


    const end =
      new Date(
        start
      );


    end.setDate(
      end.getDate() + 1
    );


    return {
      start:
        start,

      end:
        end
    };
  }


  if (selectedPeriod === "week") {
    const start =
      getWeekStart(
        selectedDate
      );


    const end =
      new Date(
        start
      );


    end.setDate(
      end.getDate() + 7
    );


    return {
      start:
        start,

      end:
        end
    };
  }


  const start =
    new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );


  const end =
    new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      1
    );


  return {
    start:
      start,

    end:
      end
  };
}


// ========================================
// 選択期間内の作業記録
// ========================================

function getSessionsInRange(
  periodRange
) {
  const sessions =
    Array.isArray(
      appData.sessions
    )
      ? appData.sessions.filter(
          function(session) {
            return isTimestampInRange(
              session.startedAt,
              periodRange
            );
          }
        )
      : [];


  const result =
    [
      ...sessions
    ];


  if (
    appData.activeSession &&
    isTimestampInRange(
      appData.activeSession.startedAt,
      periodRange
    )
  ) {
    result.push(
      {
        ...appData.activeSession,

        endedAt:
          null,

        elapsedSeconds:
          getActiveElapsedSeconds(),

        isActive:
          true
      }
    );
  }


  return result;
}


// ========================================
// 期間内か確認する
// ========================================

function isTimestampInRange(
  timestamp,
  periodRange
) {
  const date =
    new Date(
      timestamp
    );


  return (
    date >=
      periodRange.start &&
    date <
      periodRange.end
  );
}


// ========================================
// 期間タイトルと総時間
// ========================================

function renderPeriodInformation(
  periodRange
) {
  if (selectedPeriod === "day") {
    reportPeriodTitle.textContent =
      formatJapaneseDate(
        periodRange.start
      ) +
      "の集計";
  }


if (selectedPeriod === "week") {
  const weekEnd =
    new Date(
      periodRange.end
    );

  weekEnd.setDate(
    weekEnd.getDate() - 1
  );

  reportPeriodTitle.textContent =
    formatReportMonthDay(
      periodRange.start
    ) +
    "～" +
    formatReportMonthDay(
      weekEnd
    ) +
    "の集計";
}


  if (selectedPeriod === "month") {
    reportPeriodTitle.textContent =
      periodRange.start.getFullYear() +
      "年" +
      (
        periodRange.start.getMonth() +
        1
      ) +
      "月の集計";
  }


  const displayEnd =
    new Date(
      periodRange.end.getTime() -
      1
    );


  if (selectedPeriod === "day") {
    reportDateRange.hidden =
      true;


    dailyWorkDetails.hidden =
      false;


    dailyWorkDate.textContent =
      formatJapaneseDate(
        periodRange.start
      );
  } else {
    reportDateRange.hidden =
      false;


    dailyWorkDetails.hidden =
      true;


    dailyWorkDetails.open =
      false;


    reportDateRange.textContent =
      formatJapaneseDate(
        periodRange.start
      ) +
      " ～ " +
      formatJapaneseDate(
        displayEnd
      );
  }
}


// ========================================
// 日別作業内容
// ========================================

function renderDailyWorkTimeline(
  sessions
) {
  if (selectedPeriod !== "day") {
    return;
  }


  const timelineItems =
    [];


  sessions.forEach(
    function(session) {
      const projectInformation =
        findProjectInformation(
          session.projectId
        );


      const categoryName =
        projectInformation
          ? projectInformation.category.name
          : "分類情報なし";


      const projectName =
        projectInformation
          ? projectInformation.project.name
          : "プロジェクト情報なし";


      const notes =
        Array.isArray(
          session.notes
        )
          ? session.notes
          : [];


      if (notes.length === 0) {
        timelineItems.push(
          {
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
              ),

            categoryName:
              categoryName,

            projectName:
              projectName,

            text:
              "作業内容の記録なし"
          }
        );

        return;
      }


      notes.forEach(
        function(note) {
          timelineItems.push(
            {
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
                ),

              categoryName:
                categoryName,

              projectName:
                projectName,

              text:
                note.text ||
                "作業内容の記録なし"
            }
          );
        }
      );
    }
  );


  timelineItems.sort(
    function(a, b) {
      return (
        a.startedAt -
        b.startedAt
      );
    }
  );


  if (timelineItems.length === 0) {
    dailyWorkTimeline.innerHTML = `
      <p class="empty-message">
        この日の作業記録はありません。
      </p>
    `;

    return;
  }


  dailyWorkTimeline.innerHTML = `
    <ul class="daily-work-list">
      ${timelineItems
        .map(
          function(item) {
            return `
              <li>
                <time class="daily-work-time">
                  ${formatClockTime(item.startedAt)}
                  ～
                  ${formatClockTime(item.endedAt)}
                </time>

                <strong class="daily-work-project">
                  【${escapeHtml(item.categoryName)}/${escapeHtml(item.projectName)}】
                </strong>

                <span class="daily-work-content">
                  ${escapeHtml(item.text)}
                  （${formatSecondsAsText(
                    Math.max(
                      0,

                      Math.floor(
                        (
                          item.endedAt -
                          item.startedAt
                        ) /
                        1000
                      )
                    )
                  )}）
                </span>
              </li>
            `;
          }
        )
        .join("")}
    </ul>
  `;
}


// ========================================
// 現在作業中の内容
// ========================================

function renderActiveWork() {
  const activeSession =
    appData.activeSession;


  if (!activeSession) {
    activeWorkPanel.hidden =
      true;

    return;
  }


  const projectInformation =
    findProjectInformation(
      activeSession.projectId
    );


  activeWorkPanel.hidden =
    false;


  if (projectInformation) {
    activeCategoryName.textContent =
      projectInformation.category.name;


    activeProjectName.textContent =
      projectInformation.project.name;
  } else {
    activeCategoryName.textContent =
      "分類情報なし";


    activeProjectName.textContent =
      "削除されたプロジェクト";
  }


  activeTimer.textContent =
    formatTimerClock(
      getActiveElapsedSeconds()
    );
}


// ========================================
// 作業中の経過秒数
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
// 選択期間の月間計画を計算する
// ========================================

function calculatePlanForPeriod(
  periodRange
) {
  let totalPlannedSeconds =
    0;


  let hasMonthlyPlan =
    false;


  const categoryPlannedSeconds =
    new Map();


  const projectPlannedSeconds =
    new Map();


  const currentDate =
    startOfDay(
      periodRange.start
    );


  while (
    currentDate <
    periodRange.end
  ) {
    const monthKey =
      formatMonthForInput(
        currentDate
      );


    const monthlyPlan =
      appData.monthlyPlans[
        monthKey
      ];


    if (monthlyPlan) {
      hasMonthlyPlan =
        true;


      const daysInMonth =
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        ).getDate();


      const dailyTotalSeconds =
        Number(
          monthlyPlan.totalMinutes ||
          0
        ) *
        60 /
        daysInMonth;


      totalPlannedSeconds +=
        dailyTotalSeconds;


      const categories =
        Array.isArray(
          monthlyPlan.categories
        )
          ? monthlyPlan.categories
          : [];


      categories.forEach(
        function(categoryPlan) {
          const categoryId =
            String(
              categoryPlan.categoryId
            );


          const dailyCategorySeconds =
            Number(
              categoryPlan.plannedMinutes ||
              0
            ) *
            60 /
            daysInMonth;


          categoryPlannedSeconds.set(
            categoryId,

            (
              categoryPlannedSeconds.get(
                categoryId
              ) ||
              0
            ) +
            dailyCategorySeconds
          );


          const projects =
            Array.isArray(
              categoryPlan.projects
            )
              ? categoryPlan.projects
              : [];


          projects.forEach(
            function(projectPlan) {
              const projectId =
                String(
                  projectPlan.projectId
                );


              const dailyProjectSeconds =
                Number(
                  projectPlan.plannedMinutes ||
                  0
                ) *
                60 /
                daysInMonth;


              projectPlannedSeconds.set(
                projectId,

                (
                  projectPlannedSeconds.get(
                    projectId
                  ) ||
                  0
                ) +
                dailyProjectSeconds
              );
            }
          );
        }
      );
    }


    currentDate.setDate(
      currentDate.getDate() + 1
    );
  }


  return {
    hasMonthlyPlan:
      hasMonthlyPlan,

    totalPlannedSeconds:
      Math.round(
        totalPlannedSeconds
      ),

    categoryPlannedSeconds:
      new Map(
        Array.from(
          categoryPlannedSeconds.entries()
        ).map(
          function(
            [
              categoryId,
              seconds
            ]
          ) {
            return [
              categoryId,
              Math.round(
                seconds
              )
            ];
          }
        )
      ),

    projectPlannedSeconds:
      new Map(
        Array.from(
          projectPlannedSeconds.entries()
        ).map(
          function(
            [
              projectId,
              seconds
            ]
          ) {
            return [
              projectId,
              Math.round(
                seconds
              )
            ];
          }
        )
      )
  };
}


// ========================================
// 作業記録が計画内か確認する
// ========================================

function isSessionPlanned(
  session
) {
  const sessionDate =
    new Date(
      session.startedAt
    );


  const monthKey =
    formatMonthForInput(
      sessionDate
    );


  const monthlyPlan =
    appData.monthlyPlans[
      monthKey
    ];


  if (
    !monthlyPlan ||
    !Array.isArray(
      monthlyPlan.categories
    )
  ) {
    return false;
  }


  return monthlyPlan.categories.some(
    function(categoryPlan) {
      const projects =
        Array.isArray(
          categoryPlan.projects
        )
          ? categoryPlan.projects
          : [];


      return projects.some(
        function(projectPlan) {
          return (
            String(
              projectPlan.projectId
            ) ===
            String(
              session.projectId
            )
          );
        }
      );
    }
  );
}


// ========================================
// SUMMARY用の日付一覧を作成する
// ========================================

function createSummaryWorkDaysHtml(
  sessions,
  emptyMessage
) {
  if (
    !Array.isArray(
      sessions
    ) ||
    sessions.length === 0
  ) {
    return `
      <p class="empty-message">
        ${escapeHtml(emptyMessage)}
      </p>
    `;
  }


  const workDayMap =
    new Map();


  sessions.forEach(
    function(session) {
      const sessionDate =
        new Date(
          session.startedAt
        );


      const dateKey =
        formatDateForInput(
          sessionDate
        );


      if (
        !workDayMap.has(
          dateKey
        )
      ) {
        workDayMap.set(
          dateKey,

          {
            date:
              startOfDay(
                sessionDate
              ),

            totalSeconds:
              0,

            items:
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
          session.elapsedSeconds ||
          0
        );


      const projectInformation =
        findProjectInformation(
          session.projectId
        );


      const categoryName =
        projectInformation
          ? projectInformation
              .category.name
          : "分類情報なし";


      const projectName =
        projectInformation
          ? projectInformation
              .project.name
          : "プロジェクト情報なし";


      const notes =
        Array.isArray(
          session.notes
        ) &&
        session.notes.length > 0
          ? session.notes
          : [
              {
                text:
                  "作業内容の記録なし",

                startedAt:
                  session.startedAt,

                endedAt:
                  session.endedAt ||
                  session.startedAt
              }
            ];


      notes.forEach(
        function(note) {
          const startedAt =
            Number(
              note.startedAt
            ) ||
            Number(
              session.startedAt
            );


          const endedAt =
            Number(
              note.endedAt
            ) ||
            Number(
              note.createdAt
            ) ||
            Number(
              session.endedAt
            ) ||
            startedAt;


          workDay.items.push(
            {
              startedAt:
                startedAt,

              endedAt:
                endedAt,

              categoryName:
                categoryName,

              projectName:
                projectName,

              text:
                note.text ||
                "作業内容の記録なし"
            }
          );
        }
      );
    }
  );


  const workDays =
    Array.from(
      workDayMap.values()
    ).sort(
      function(a, b) {
        return (
          a.date -
          b.date
        );
      }
    );


  return workDays
    .map(
      function(workDay) {
        const items =
          workDay.items
            .slice()
            .sort(
              function(a, b) {
                return (
                  a.startedAt -
                  b.startedAt
                );
              }
            );


        const itemHtml =
          items
            .map(
              function(item) {
                const elapsedSeconds =
                  Math.max(
                    0,

                    Math.floor(
                      (
                        item.endedAt -
                        item.startedAt
                      ) /
                      1000
                    )
                  );


                return `
                  <li>
                    <time class="work-time-range">
                      ${formatClockTime(item.startedAt)}
                      ～
                      ${formatClockTime(item.endedAt)}
                    </time>

                    <strong class="summary-work-project">
                      【${escapeHtml(item.categoryName)}/${escapeHtml(item.projectName)}】
                    </strong>

                    <span class="work-content-text">
                      ${escapeHtml(item.text)}
                      （${formatSecondsAsText(elapsedSeconds)}）
                    </span>
                  </li>
                `;
              }
            )
            .join("");


        return `
          <details class="work-day-item is-collapsible">
            <summary>
              <time
                class="work-day-date"
                datetime="${formatDateForInput(workDay.date)}"
              >
                ${formatJapaneseDate(workDay.date)}
              </time>

              <span class="work-day-total">
                合計
                ${formatSecondsAsText(workDay.totalSeconds)}
              </span>
            </summary>

            <div class="work-day-content">
              <ul class="work-content-list summary-work-content-list">
                ${itemHtml}
              </ul>
            </div>
          </details>
        `;
      }
    )
    .join("");
}


// ========================================
// 月間計画と実績のSUMMARY
// ========================================

function renderCurrentSummary(
  sessions,
  periodRange
) {
  const periodPlan =
    calculatePlanForPeriod(
      periodRange
    );


  const recordedProjectIds =
    new Set(
      sessions.map(
        function(session) {
          return String(
            session.projectId
          );
        }
      )
    );


  const plannedProjectIds =
    new Set(
      periodPlan
        .projectPlannedSeconds
        .keys()
    );


  const summaryProjectIds =
    new Set(
      [
        ...recordedProjectIds,
        ...plannedProjectIds
      ]
    );


  const plannedCategoryIds =
    new Set(
      periodPlan
        .categoryPlannedSeconds
        .keys()
    );


  const periodCategories =
    appData.categories.filter(
      function(category) {
        const projects =
          Array.isArray(
            category.projects
          )
            ? category.projects
            : [];


        return (
          plannedCategoryIds.has(
            String(
              category.id
            )
          ) ||
          projects.some(
            function(project) {
              return summaryProjectIds.has(
                String(
                  project.id
                )
              );
            }
          )
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


  const periodPlannedSeconds =
    periodPlan.totalPlannedSeconds;


  const plannedSessions =
    sessions.filter(
      function(session) {
        return isSessionPlanned(
          session
        );
      }
    );


  const unplannedSessions =
    sessions.filter(
      function(session) {
        return !isSessionPlanned(
          session
        );
      }
    );


  const plannedActualSeconds =
    plannedSessions.reduce(
      function(
        total,
        session
      ) {
        return (
          total +
          Number(
            session.elapsedSeconds ||
            0
          )
        );
      },

      0
    );


  const unplannedActualSeconds =
    unplannedSessions.reduce(
      function(
        total,
        session
      ) {
        return (
          total +
          Number(
            session.elapsedSeconds ||
            0
          )
        );
      },

      0
    );


  reportTotalTime.textContent =
    formatSecondsAsText(
      totalSeconds
    ) +
    " / " +
    (
      periodPlan.hasMonthlyPlan
        ? formatSecondsAsText(
            periodPlannedSeconds
          )
        : "計画なし"
    );


  plannedWorkTotal.textContent =
    formatSecondsAsText(
      plannedActualSeconds
    );


  unplannedWorkTotal.textContent =
    formatSecondsAsText(
      unplannedActualSeconds
    );


  summaryAllWorkDays.innerHTML =
    createSummaryWorkDaysHtml(
      sessions,
      "この期間の作業記録はありません。"
    );


  summaryPlannedWorkDays.innerHTML =
    createSummaryWorkDaysHtml(
      plannedSessions,
      "この期間の計画内作業はありません。"
    );


  summaryUnplannedWorkDays.innerHTML =
    createSummaryWorkDaysHtml(
      unplannedSessions,
      "この期間の計画外作業はありません。"
    );


  const summaryDescription =
    document.querySelector(
      ".summary-description"
    );


  if (summaryDescription) {
    summaryDescription.textContent =
      periodPlan.hasMonthlyPlan
        ? "月間計画に含まれるプロジェクトは、実績がない場合も表示します。計画にない作業には「予定外」と表示します。"
        : "この期間には月間計画がありません。記録された作業は「予定外」として表示します。";
  }


  if (
    periodCategories.length === 0
  ) {
    categorySummaryList.innerHTML = `
      <p class="empty-message">
        この期間の月間計画と作業記録はありません。
      </p>
    `;

    return;
  }


  categorySummaryList.innerHTML =
    periodCategories
      .map(
        function(category) {
          const allProjects =
            Array.isArray(
              category.projects
            )
              ? category.projects
              : [];


          const periodProjects =
            allProjects
              .filter(
                function(project) {
                  return summaryProjectIds.has(
                    String(
                      project.id
                    )
                  );
                }
              )
              .sort(
                function(a, b) {
                  const aIsPlanned =
                    plannedProjectIds.has(
                      String(
                        a.id
                      )
                    );


                  const bIsPlanned =
                    plannedProjectIds.has(
                      String(
                        b.id
                      )
                    );


                  if (
                    aIsPlanned ===
                    bIsPlanned
                  ) {
                    return 0;
                  }


                  return aIsPlanned
                    ? -1
                    : 1;
                }
              );


          const categoryProjectIds =
            new Set(
              periodProjects.map(
                function(project) {
                  return project.id;
                }
              )
            );


          const categorySessions =
            sessions.filter(
              function(session) {
                return categoryProjectIds.has(
                  session.projectId
                );
              }
            );


          const categoryActualSeconds =
            categorySessions.reduce(
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


          const categoryPlannedSeconds =
            periodPlan
              .categoryPlannedSeconds
              .get(
                String(
                  category.id
                )
              ) ||
            0;


          const categoryProgressRate =
            calculateProgressRate(
              categoryActualSeconds,
              categoryPlannedSeconds
            );


          const categoryProgressWidth =
            calculateProgressWidth(
              categoryActualSeconds,
              categoryPlannedSeconds
            );


          const categoryStatus =
            createProgressStatus(
              categoryActualSeconds,
              categoryPlannedSeconds
            );


          const projectHtml =
            periodProjects
              .map(
                function(project) {
                  const projectSessions =
                    categorySessions.filter(
                      function(session) {
                        return (
                          session.projectId ===
                          project.id
                        );
                      }
                    );


                  const projectActualSeconds =
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


                  const projectPlannedSeconds =
                    periodPlan
                      .projectPlannedSeconds
                      .get(
                        String(
                          project.id
                        )
                      ) ||
                    0;


                  const isUnplannedWork =
                    !plannedProjectIds.has(
                      String(
                        project.id
                      )
                    ) &&
                    projectActualSeconds > 0;


                  const planStatusLabel =
                    isUnplannedWork
                      ? `
                        <span class="unplanned-work-label">
                          予定外
                        </span>
                      `
                      : "";


                  const projectProgressRate =
                    calculateProgressRate(
                      projectActualSeconds,
                      projectPlannedSeconds
                    );


                  const projectProgressWidth =
                    calculateProgressWidth(
                      projectActualSeconds,
                      projectPlannedSeconds
                    );


                  const projectStatus =
                    createProgressStatus(
                      projectActualSeconds,
                      projectPlannedSeconds
                    );


                  const workDays =
                    groupSessionsByDay(
                      projectSessions
                    );


                  return `
                    <details class="summary-project-item">
                      <summary>
                        <div class="summary-project-overview">
                          <div class="category-summary-heading">
                            <span class="category-summary-name">
                              ${escapeHtml(project.name)}

                              ${planStatusLabel}

                              ${
                                isUnplannedWork
                                  ? ""
                                  : `
                                    <strong class="progress-percentage">
                                      ${projectProgressRate}
                                    </strong>
                                  `
                              }
                            </span>
                            <span class="category-summary-times">
                              実績
                              ${formatSecondsAsText(projectActualSeconds)}
                              ／
                              ${
                                isUnplannedWork
                                  ? "予定なし"
                                  : (
                                      "予定 " +
                                      formatSecondsAsText(
                                        projectPlannedSeconds
                                      )
                                    )
                              }
                            </span>
                          </div>

                          ${
                            isUnplannedWork
                              ? `
                                <p class="category-summary-status is-unplanned">
                                  月間計画にない作業です。
                                </p>
                              `
                              : `
                                <div class="progress-bar">
                                  <span
                                    class="progress-bar__value"
                                    style="width: ${projectProgressWidth}%"
                                  ></span>
                                </div>

                                <p
                                  class="category-summary-status${projectStatus.isOver ? " is-over" : ""}"
                                >
                                  ${projectStatus.message}
                                </p>
                              `
                          }
                        </div>
                      </summary>

                      <div class="summary-project-detail">
                        ${
                          selectedPeriod === "day"
                            ? createDayProjectWorkHtml(
                                workDays
                              )
                            : createWorkDayHtml(
                                workDays,
                                true
                              )
                        }
                      </div>
                    </details>
                  `;
                }
              )
              .join("");


          return `
            <details class="category-summary-item">
              <summary>
                <div class="category-summary-overview">
                  <div class="category-summary-heading">
                    <span class="category-summary-name">
                      ${escapeHtml(category.name)}

                      <strong class="progress-percentage">
                        ${categoryProgressRate}
                      </strong>
                    </span>

                    <span class="category-summary-times">
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
                      style="width: ${categoryProgressWidth}%"
                    ></span>
                  </div>

                  <p
                    class="category-summary-status${categoryStatus.isOver ? " is-over" : ""}"
                  >
                    ${categoryStatus.message}
                  </p>
                </div>
              </summary>

              <div class="summary-project-list">
                ${projectHtml}
              </div>
            </details>
          `;
        }
      )
      .join("");
}


// ========================================
// 現在のプロジェクト
// ========================================

function renderCurrentProjectReports() {
  const categoryItems =
    [];


  appData.categories.forEach(
    function(category) {
      const projects =
        Array.isArray(
          category.projects
        )
          ? category.projects.filter(
              function(project) {
                return (
                  project.isCurrent !==
                  false
                );
              }
            )
          : [];


      if (projects.length === 0) {
        return;
      }


      const projectItems =
        projects
          .map(
            function(project) {
              const projectSessions =
                appData.sessions.filter(
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


              const workDays =
                groupSessionsByDay(
                  projectSessions
                );


              let workPeriodText =
                "作業記録なし";


              if (workDays.length > 0) {
                const newestDate =
                  workDays[0].date;


                const oldestDate =
                  workDays[
                    workDays.length - 1
                  ].date;


                workPeriodText =
                  formatJapaneseDate(
                    oldestDate
                  ) +
                  " ～ " +
                  formatJapaneseDate(
                    newestDate
                  );
              }


              return `
                <details class="project-report-item">
                  <summary>
                    <span class="project-name">
                      ${escapeHtml(project.name)}
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
                    <p class="archive-work-period">
                      作業期間：
                      ${workPeriodText}
                    </p>

                    ${createWorkDayHtml(workDays)}
                  </div>
                </details>
              `;
            }
          )
          .join("");


      categoryItems.push(`
        <details class="archive-category-item">
          <summary>
            <strong>
              ${escapeHtml(category.name)}
            </strong>
          </summary>

          <div class="archive-project-list">
            ${projectItems}
          </div>
        </details>
      `);
    }
  );


  if (
    categoryItems.length === 0
  ) {
    currentProjectList.innerHTML = `
      <p class="empty-message">
        現在のプロジェクトはありません。
      </p>
    `;

    return;
  }


  currentProjectList.innerHTML =
    categoryItems.join("");
}


// ========================================
// アーカイブされたプロジェクト
// ========================================

function renderArchiveReports() {
  const categoryItems =
    [];


  appData.categories.forEach(
    function(category) {
      const projects =
        Array.isArray(
          category.projects
        )
          ? category.projects.filter(
              function(project) {
                return (
                  project.isCurrent ===
                  false
                );
              }
            )
          : [];


      if (projects.length === 0) {
        return;
      }


      const projectItems =
        projects
          .map(
            function(project) {
              const projectSessions =
                appData.sessions.filter(
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


              const workDays =
                groupSessionsByDay(
                  projectSessions
                );


              let workPeriodText =
                "作業記録なし";


              if (workDays.length > 0) {
                const newestDate =
                  workDays[0].date;


                const oldestDate =
                  workDays[
                    workDays.length - 1
                  ].date;


                workPeriodText =
                  formatJapaneseDate(
                    oldestDate
                  ) +
                  " ～ " +
                  formatJapaneseDate(
                    newestDate
                  );
              }


              return `
                <details class="project-report-item">
                  <summary>
                    <span class="project-name">
                      ${escapeHtml(project.name)}
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
                    <p class="archive-work-period">
                      作業期間：
                      ${workPeriodText}
                    </p>

                    ${createWorkDayHtml(workDays)}
                  </div>
                </details>
              `;
            }
          )
          .join("");


      categoryItems.push(`
        <details class="archive-category-item">
          <summary>
            <strong>
              ${escapeHtml(category.name)}
            </strong>
          </summary>

          <div class="archive-project-list">
            ${projectItems}
          </div>
        </details>
      `);
    }
  );


  if (
    categoryItems.length === 0
  ) {
    projectReportList.innerHTML = `
      <p class="empty-message">
        アーカイブされたプロジェクトはありません。
      </p>
    `;

    return;
  }


  projectReportList.innerHTML =
    categoryItems.join("");
}


// ========================================
// 大分類別の集計
// ========================================

function renderCategorySummary(
  sessions
) {
  const totalSeconds =
    sessions.reduce(
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


  reportTotalTime.textContent =
    formatSecondsAsText(
      totalSeconds
    );


  if (
    !Array.isArray(
      appData.categories
    ) ||
    appData.categories.length === 0
  ) {
    categorySummaryList.innerHTML = `
      <p class="empty-message">
        大分類が設定されていません。
      </p>
    `;

    return;
  }


  const periodHours =
    getSelectedPeriodHours();


  categorySummaryList.innerHTML =
    appData.categories
      .map(
        function(category) {
          const plannedSeconds =
            Math.round(
              periodHours *
              Number(
                category.allocationPercent
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
                      session.elapsedSeconds
                    )
                  );
                },

                0
              );


          const progressRate =
            calculateProgressRate(
              actualSeconds,
              plannedSeconds
            );


          const progressWidth =
            calculateProgressWidth(
              actualSeconds,
              plannedSeconds
            );


          const status =
            createProgressStatus(
              actualSeconds,
              plannedSeconds
            );


          return `
            <article class="category-summary-item">
              <div class="category-summary-heading">
                <span class="category-summary-name">
                  ${escapeHtml(category.name)}

                  <strong class="progress-percentage">
                    ${progressRate}
                  </strong>
                </span>

                <span class="category-summary-times">
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
                  style="width: ${progressWidth}%"
                ></span>
              </div>

              <p
                class="category-summary-status${status.isOver ? " is-over" : ""}"
              >
                ${status.message}
              </p>
            </article>
          `;
        }
      )
      .join("");
}


// ========================================
// プロジェクト別のレポート
// ========================================

function renderProjectReports(
  sessions
) {
  const periodHours =
    getSelectedPeriodHours();


  const reportItems =
    [];


  appData.categories.forEach(
    function(category) {
      category.projects.forEach(
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
                    session.elapsedSeconds
                  )
                );
              },

              0
            );


          const plannedSeconds =
            Math.round(
              periodHours *
              Number(
                category.allocationPercent
              ) /
              100 *
              Number(
                project.allocationPercent
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
            groupSessionsByDay(
              projectSessions
            );


          const workDayHtml =
            createWorkDayHtml(
              workDays
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
                ${workDayHtml}
              </div>
            </details>
          `);
        }
      );
    }
  );


  if (reportItems.length === 0) {
    projectReportList.innerHTML = `
      <p class="empty-message">
        プロジェクトが設定されていません。
      </p>
    `;

    return;
  }


  projectReportList.innerHTML =
    reportItems.join("");
}


// ========================================
// 作業記録を日ごとにまとめる
// ========================================

function groupSessionsByDay(
  sessions
) {
  const workDayMap =
    new Map();


  sessions.forEach(
    function(session) {
      const dateKey =
        formatDateForInput(
          new Date(
            session.startedAt
          )
        );


      if (
        !workDayMap.has(
          dateKey
        )
      ) {
        workDayMap.set(
          dateKey,

          {
            date:
              startOfDay(
                new Date(
                  session.startedAt
                )
              ),

            totalSeconds:
              0,

            notes:
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
          session.elapsedSeconds
        );


      const notes =
        Array.isArray(
          session.notes
        )
          ? session.notes
          : [];


            if (notes.length === 0) {
        workDay.notes.push(
          {
            text:
              "作業内容の記録なし",

            startedAt:
              session.startedAt,

            endedAt:
              session.endedAt ||
              session.startedAt
          }
        );
      } else {
        notes.forEach(
          function(note) {
            workDay.notes.push(
              {
                text:
                  note.text,

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
        a.date -
        b.date
      );
    }
  );
}


// ========================================
// 日表示のプロジェクト別作業内容
// ========================================

function createDayProjectWorkHtml(
  workDays
) {
  if (workDays.length === 0) {
    return `
      <p class="empty-message">
        この日の作業記録はありません。
      </p>
    `;
  }


  const notes =
    workDays.flatMap(
      function(workDay) {
        return Array.isArray(
          workDay.notes
        )
          ? workDay.notes
          : [];
      }
    );


  notes.sort(
    function(a, b) {
      return (
        Number(
          a.startedAt || 0
        ) -
        Number(
          b.startedAt || 0
        )
      );
    }
  );


  if (notes.length === 0) {
    return `
      <p class="empty-message">
        作業内容の記録はありません。
      </p>
    `;
  }


  return `
    <ul class="work-content-list">
      ${notes
        .map(
          function(note) {
            return `
              <li>
                <time
                  class="work-time-range"
                  datetime="${new Date(
                    note.startedAt
                  ).toISOString()}"
                >
                  ${formatWorkTimeRange(note)}
                </time>

                <span class="work-content-text">
                  ${escapeHtml(note.text)}
                </span>
              </li>
            `;
          }
        )
        .join("")}
    </ul>
  `;
}


// ========================================
// 作業日ごとのHTML
// ========================================

function createWorkDayHtml(
  workDays,
  isCollapsible = false
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
        const sortedNotes =
          workDay.notes
            .slice()
            .sort(
              function(a, b) {
                return (
                  Number(
                    a.startedAt || 0
                  ) -
                  Number(
                    b.startedAt || 0
                  )
                );
              }
            );


        const noteHtml =
          sortedNotes
            .map(
              function(note) {
                return `
                  <li>
                    <time
                      class="work-time-range"
                      datetime="${new Date(
                        note.startedAt
                      ).toISOString()}"
                    >
                      ${formatWorkTimeRange(note)}
                    </time>

                    <span class="work-content-text">
                      ${escapeHtml(note.text)}
                    </span>
                  </li>
                `;
              }
            )
            .join("");


        const dateHtml = `
          <time
            class="work-day-date"
            datetime="${formatDateForInput(workDay.date)}"
          >
            ${formatJapaneseDate(workDay.date)}
          </time>
        `;


        const totalHtml = `
          <span class="work-day-total">
            合計
            ${formatSecondsAsText(workDay.totalSeconds)}
          </span>
        `;


        if (isCollapsible) {
          return `
            <details class="work-day-item is-collapsible">
              <summary>
                ${dateHtml}
                ${totalHtml}
              </summary>

              <div class="work-day-content">
                <ul class="work-content-list">
                  ${noteHtml}
                </ul>
              </div>
            </details>
          `;
        }


        return `
          <article class="work-day-item">
            ${dateHtml}

            <ul class="work-content-list">
              ${noteHtml}
            </ul>

            ${totalHtml}
          </article>
        `;
      }
    )
    .join("");
}


// ========================================
// 選択期間の予定時間
// ========================================

function getSelectedPeriodHours() {
  const weeklyHours =
    Number(
      appData.settings.weeklyHours
    ) || 0;


  if (selectedPeriod === "day") {
    return (
      weeklyHours / 7
    );
  }


  if (selectedPeriod === "month") {
    return (
      weeklyHours *
      52 /
      12
    );
  }


  return weeklyHours;
}


// ========================================
// プロジェクトを探す
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
// 進捗率
// ========================================

function calculateProgressRate(
  actualSeconds,
  plannedSeconds
) {
  if (plannedSeconds <= 0) {
    return (
      actualSeconds > 0
        ? "計算不可"
        : "0%"
    );
  }


  const rate =
    actualSeconds /
    plannedSeconds *
    100;


  const roundedRate =
    Math.round(
      rate * 10
    ) /
    10;


  return (
    roundedRate +
    "%"
  );
}


// ========================================
// 進捗バーの幅
// ========================================

function calculateProgressWidth(
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


  return Math.min(
    100,

    Math.max(
      0,

      actualSeconds /
      plannedSeconds *
      100
    )
  );
}


// ========================================
// 残り時間・超過時間
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
// 日付関係
// ========================================

function startOfDay(
  date
) {
  const result =
    new Date(
      date
    );


  result.setHours(
    0,
    0,
    0,
    0
  );


  return result;
}


function getWeekStart(
  date
) {
  const result =
    startOfDay(
      date
    );


  const daysFromMonday =
    (
      result.getDay() +
      6
    ) %
    7;


  result.setDate(
    result.getDate() -
    daysFromMonday
  );


  return result;
}


function createLocalDateFromInput(
  dateText
) {
  const [
    year,
    month,
    day
  ] =
    dateText
      .split("-")
      .map(Number);


  return new Date(
    year,
    month - 1,
    day
  );
}


function formatDateForInput(
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


function formatMonthForInput(
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


  return (
    year +
    "-" +
    month
  );
}


function formatJapaneseDate(
  date
) {
  return new Intl.DateTimeFormat(
    "ja-JP",

    {
      year:
        "numeric",

      month:
        "long",

      day:
        "numeric",

      weekday:
        "short"
    }
  ).format(
    date
  );
}


// ========================================
// 時間表示
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


function formatSecondsAsText(
  totalSeconds
) {
  const safeSeconds =
    Math.max(
      0,

      Math.round(
        totalSeconds
      )
    );


  if (safeSeconds < 60) {
    return (
      safeSeconds +
      "秒"
    );
  }


  const totalMinutes =
    Math.floor(
      safeSeconds / 60
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
// HTML用の文字変換
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
// 作業内容の開始・終了時刻
// ========================================

function formatWorkTimeRange(
  note
) {
  return (
    formatClockTime(
      note.startedAt
    ) +
    "〜" +
    formatClockTime(
      note.endedAt
    )
  );
}


// ========================================
// 時刻だけを表示する
// ========================================

function formatClockTime(
  timestamp
) {
  return new Intl.DateTimeFormat(
    "ja-JP",

    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false
    }
  ).format(
    new Date(
      timestamp
    )
  );
}