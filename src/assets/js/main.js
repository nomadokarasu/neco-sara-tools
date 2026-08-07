const toolsList = document.getElementById("tools-list");
const currentYear = document.getElementById("current-year");

// フッターの年を自動更新
if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

// tools.jsonからツール情報を読み込む
async function loadTools() {
  try {
    const response = await fetch("./tools.json");

    if (!response.ok) {
      throw new Error("tools.jsonの読み込みに失敗しました。");
    }

    const tools = await response.json();

    if (!Array.isArray(tools) || tools.length === 0) {
      toolsList.innerHTML =
        '<p class="empty-message">現在公開中のツールはありません。</p>';
      return;
    }

    toolsList.innerHTML = "";

    tools.forEach((tool) => {
      const article = document.createElement("article");
      article.className = "tool-card";

const appButton = tool.appUrl
  ? `
      <a
        href="${escapeAttribute(tool.appUrl)}"
        class="button button--primary"
      >
        使ってみる
      </a>
    `
  : "";

      article.innerHTML = `
        <div class="tool-card__meta">
          <span class="tool-card__category">${escapeHtml(tool.category)}</span>
          <span class="tool-card__version">v${escapeHtml(tool.version)}</span>
        </div>

        <h3 class="tool-card__title">
          ${escapeHtml(tool.name)}
        </h3>

        <p class="tool-card__description">
          ${escapeHtml(tool.description)}
        </p>

        <div class="tool-card__footer">
          <span class="tool-card__status">
            ${escapeHtml(tool.status)}
          </span>

          <div class="tool-card__actions">
  ${appButton}

  <a
    href="${escapeAttribute(tool.url)}"
    class="button ${tool.appUrl ? "button--secondary" : "button--primary"}"
  >
    詳細を見る
  </a>
</div>
        </div>
      `;

      toolsList.appendChild(article);
    });
  } catch (error) {
    console.error(error);

    toolsList.innerHTML = `
      <p class="error-message">
        ツール一覧を読み込めませんでした。
      </p>
    `;
  }
}

// HTMLとして解釈されないようにする
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// hrefなどの属性用
function escapeAttribute(value) {
  return escapeHtml(value);
}

loadTools();